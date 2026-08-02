import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { assertActor, assertUnitAccess } from '../lib/authorization.js';
import { recordAuditTrail, withTransaction } from '../lib/database.js';
import { AppError } from '../lib/errors.js';
import { createRecordNumber } from '../lib/record-number.js';

const uuid = Type.String({ format: 'uuid' });
const date = Type.String({ format: 'date' });

export const monitoringRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.post(
    '/',
    {
      preHandler: [app.authenticate, app.authorize(['monitoring:write', 'monitoring:write:own-unit'])],
      schema: {
        body: Type.Object({
          monitoringDate: date,
          unitId: uuid,
          observerUserId: uuid,
          templateId: Type.Optional(uuid),
          items: Type.Array(
            Type.Object({
              questionCode: Type.String({ minLength: 1, maxLength: 60 }),
              answerValue: Type.String({ minLength: 1, maxLength: 40 }),
              scoreValue: Type.Number(),
              note: Type.Optional(Type.String())
            }),
            { minItems: 1 }
          )
        })
      }
    },
    async (request, reply) => {
      assertActor(request, request.body.observerUserId);
      assertUnitAccess(request, request.body.unitId, 'monitoring:write', 'monitoring:write:own-unit');

      const monitoringNo = createRecordNumber('MTR');
      const totalScore =
        (request.body.items.reduce((total, item) => total + item.scoreValue, 0) / request.body.items.length) * 100;

      const result = await withTransaction(app.db, async (client) => {
        const monitoring = await client.query<{ monitoring_id: string; status: string }>(
          `insert into core_monitoring.monitorings
             (monitoring_no, monitoring_date, unit_id, observer_user_id, template_id,
              status, total_score, created_by, updated_by)
           values ($1, $2, $3, $4, $5, 'draft', $6, $4, $4)
           returning monitoring_id, status`,
          [
            monitoringNo,
            request.body.monitoringDate,
            request.body.unitId,
            request.body.observerUserId,
            request.body.templateId ?? null,
            totalScore
          ]
        );
        const row = monitoring.rows[0];
        if (!row) {
          throw new Error('Monitoring insert did not return a record.');
        }

        for (const item of request.body.items) {
          await client.query(
            `insert into core_monitoring.monitoring_items
               (monitoring_id, question_code, answer_value, score_value, note)
             values ($1, $2, $3, $4, $5)`,
            [row.monitoring_id, item.questionCode, item.answerValue, item.scoreValue, item.note ?? null]
          );
        }

        await recordAuditTrail(client, {
          moduleName: 'monitoring',
          entityName: 'monitorings',
          entityId: row.monitoring_id,
          actionType: 'create',
          actorUserId: request.user.sub,
          newValue: { monitoringNo, status: row.status, unitId: request.body.unitId },
          ipAddress: request.ip
        });

        return row;
      });

      return reply.status(201).send({
        success: true,
        message: 'Monitoring draft created.',
        data: {
          monitoringId: result.monitoring_id,
          monitoringNo,
          status: result.status
        }
      });
    }
  );

  app.post(
    '/:monitoringId/submit',
    {
      preHandler: [app.authenticate, app.authorize(['monitoring:write', 'monitoring:write:own-unit'])],
      schema: {
        params: Type.Object({ monitoringId: uuid }),
        body: Type.Object({ submittedBy: uuid })
      }
    },
    async (request) => {
      assertActor(request, request.body.submittedBy);

      const result = await withTransaction(app.db, async (client) => {
        const current = await client.query<{ monitoring_id: string; unit_id: string; status: string }>(
          `select monitoring_id, unit_id, status
             from core_monitoring.monitorings
            where monitoring_id = $1
            for update`,
          [request.params.monitoringId]
        );
        const monitoring = current.rows[0];
        if (!monitoring) {
          throw new AppError(404, 'RES-404', 'Monitoring was not found.');
        }
        assertUnitAccess(request, monitoring.unit_id, 'monitoring:write', 'monitoring:write:own-unit');
        if (monitoring.status !== 'draft') {
          throw new AppError(409, 'BIZ-409', 'Only draft monitoring records can be submitted.');
        }

        const updated = await client.query<{ submitted_at: Date }>(
          `update core_monitoring.monitorings
              set status = 'submitted', submitted_at = now(), updated_at = now(), updated_by = $2
            where monitoring_id = $1
            returning submitted_at`,
          [request.params.monitoringId, request.body.submittedBy]
        );
        const updatedRow = updated.rows[0];
        if (!updatedRow) {
          throw new Error('Monitoring update did not return a record.');
        }

        await recordAuditTrail(client, {
          moduleName: 'monitoring',
          entityName: 'monitorings',
          entityId: monitoring.monitoring_id,
          actionType: 'submit',
          actorUserId: request.user.sub,
          previousValue: { status: monitoring.status },
          newValue: { status: 'submitted' },
          ipAddress: request.ip
        });
        return updatedRow;
      });

      return {
        success: true,
        message: 'Monitoring submitted.',
        data: {
          monitoringId: request.params.monitoringId,
          status: 'submitted',
          submittedAt: result.submitted_at.toISOString()
        }
      };
    }
  );
};
