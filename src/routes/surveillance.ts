import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { assertUnitAccess } from '../lib/authorization.js';
import { recordAuditTrail, withTransaction } from '../lib/database.js';
import { createRecordNumber } from '../lib/record-number.js';

const uuid = Type.String({ format: 'uuid' });

export const surveillanceRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.post(
    '/cases',
    {
      preHandler: [app.authenticate, app.authorize(['surveilans:write'])],
      schema: {
        body: Type.Object({
          mrn: Type.String({ minLength: 1, maxLength: 50 }),
          fullName: Type.String({ minLength: 1, maxLength: 200 }),
          unitId: uuid,
          diagnosisText: Type.String({ minLength: 1 }),
          haiTypeCode: Type.String({ minLength: 1, maxLength: 30 }),
          organismName: Type.Optional(Type.String({ maxLength: 160 }))
        })
      }
    },
    async (request, reply) => {
      assertUnitAccess(request, request.body.unitId, 'surveilans:write', 'surveilans:write:own-unit');
      const caseNo = createRecordNumber('HAI');

      const result = await withTransaction(app.db, async (client) => {
        const patientResult = await client.query<{ patient_id: string }>(
          `insert into core_surveillance.patients (mrn, full_name)
           values ($1, $2)
           on conflict (mrn) do update set full_name = excluded.full_name
           returning patient_id`,
          [request.body.mrn, request.body.fullName]
        );
        const patient = patientResult.rows[0];
        if (!patient) {
          throw new Error('Patient upsert did not return a record.');
        }

        const caseResult = await client.query<{ case_id: string; status: string }>(
          `insert into core_surveillance.surveillance_cases
             (case_no, patient_id, unit_id, diagnosis_text, status, created_by)
           values ($1, $2, $3, $4, 'open', $5)
           returning case_id, status`,
          [caseNo, patient.patient_id, request.body.unitId, request.body.diagnosisText, request.user.sub]
        );
        const surveillanceCase = caseResult.rows[0];
        if (!surveillanceCase) {
          throw new Error('Surveillance case insert did not return a record.');
        }

        await client.query(
          `insert into core_surveillance.hai_events (case_id, hai_type_code, onset_date, confirmation_status)
           values ($1, $2, current_date, 'suspected')`,
          [surveillanceCase.case_id, request.body.haiTypeCode]
        );
        if (request.body.organismName) {
          await client.query(
            `insert into core_surveillance.culture_results (case_id, organism_name, result_date)
             values ($1, $2, current_date)`,
            [surveillanceCase.case_id, request.body.organismName]
          );
        }
        await recordAuditTrail(client, {
          moduleName: 'surveillance',
          entityName: 'surveillance_cases',
          entityId: surveillanceCase.case_id,
          actionType: 'create',
          actorUserId: request.user.sub,
          newValue: { caseNo, status: surveillanceCase.status, unitId: request.body.unitId },
          ipAddress: request.ip
        });
        return surveillanceCase;
      });

      return reply.status(201).send({
        success: true,
        message: 'Surveillance case created.',
        data: {
          caseId: result.case_id,
          caseNo,
          status: result.status
        }
      });
    }
  );
};
