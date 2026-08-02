import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { assertUnitAccess } from '../lib/authorization.js';
import { recordAuditTrail, withTransaction } from '../lib/database.js';
import { AppError } from '../lib/errors.js';
import { createRecordNumber } from '../lib/record-number.js';

const uuid = Type.String({ format: 'uuid' });
const date = Type.String({ format: 'date' });
const optionalText = (maxLength = 2000) => Type.Optional(Type.String({ maxLength }));
const yesNo = Type.Optional(
  Type.Union([Type.Literal('yes'), Type.Literal('no'), Type.Literal('not_applicable')])
);
const surveillanceType = Type.Union([
  Type.Literal('hais'),
  Type.Literal('tuberculosis'),
  Type.Literal('hiv_aids'),
  Type.Literal('outbreak'),
  Type.Literal('other')
]);
const outcome = Type.Union([
  Type.Literal('hospitalized'),
  Type.Literal('discharged'),
  Type.Literal('referred'),
  Type.Literal('deceased')
]);

const dynamicDataSchema = Type.Object({
  tuberculosis: Type.Optional(
    Type.Object({
      status: optionalText(60),
      geneXpert: optionalText(500),
      bta: optionalText(500),
      culture: optionalText(500),
      chestXray: optionalText(1000),
      oatStartDate: Type.Optional(date),
      oatRegimen: optionalText(1000),
      dots: yesNo,
      sitbReporting: yesNo
    })
  ),
  hivAids: Type.Optional(
    Type.Object({
      status: optionalText(60),
      rapidTest: optionalText(500),
      elisa: optionalText(500),
      viralLoad: optionalText(500),
      cd4: optionalText(500),
      art: yesNo,
      oiProphylaxis: yesNo,
      hivCounseling: yesNo
    })
  ),
  outbreak: Type.Optional(
    Type.Object({
      disease: optionalText(100),
      caseStatus: optionalText(30),
      onsetDate: Type.Optional(date),
      travelHistory: optionalText(),
      contactHistory: optionalText(),
      exposureHistory: optionalText(),
      laboratoryExamination: optionalText(),
      pcrGeneXpert: optionalText(1000),
      radiology: optionalText(1000),
      precautionType: optionalText(30),
      isolationPlacement: optionalText(500),
      ppiReporting: yesNo,
      skdrReporting: yesNo,
      healthOfficeReporting: yesNo,
      contactInvestigation: yesNo
    })
  ),
  otherInfection: Type.Optional(
    Type.Object({
      infectionName: optionalText(200),
      details: optionalText()
    })
  )
});

const clinicalDataSchema = Type.Object({
  symptoms: optionalText(),
  riskFactors: optionalText()
});

const supportingExaminationsSchema = Type.Object({
  laboratory: optionalText(),
  culture: optionalText(),
  radiology: optionalText(),
  other: optionalText()
});

const infectionControlSchema = Type.Object({
  precautionType: optionalText(30),
  isolationPlacement: optionalText(500),
  handHygiene: yesNo,
  ppeUse: yesNo,
  patientEducation: yesNo
});

const reportingDataSchema = Type.Object({
  ppiTeam: yesNo,
  ppra: yesNo,
  skdr: yesNo,
  healthOffice: yesNo,
  contactInvestigation: yesNo
});

const verificationDataSchema = Type.Object({
  ipcnName: optionalText(200),
  verificationDate: Type.Optional(date),
  conclusion: optionalText(),
  notes: optionalText()
});

const createSurveillanceCaseBody = Type.Object({
  mrn: Type.String({ minLength: 1, maxLength: 50 }),
  fullName: Type.String({ minLength: 1, maxLength: 200 }),
  birthDate: Type.Optional(date),
  ageYears: Type.Optional(Type.Integer({ minimum: 0, maximum: 150 })),
  sex: Type.Optional(Type.Union([Type.Literal('male'), Type.Literal('female')])),
  unitId: uuid,
  unitName: optionalText(200),
  roomName: optionalText(200),
  attendingPhysician: optionalText(200),
  admissionDate: Type.Optional(date),
  surveillanceStartDate: Type.Optional(date),
  surveillanceType: Type.Optional(surveillanceType),
  surveillanceSubtype: optionalText(100),
  diagnosisText: Type.String({ minLength: 1 }),
  haiTypeCode: optionalText(30),
  organismName: optionalText(160),
  dynamicData: Type.Optional(dynamicDataSchema),
  clinicalData: Type.Optional(clinicalDataSchema),
  supportingExaminations: Type.Optional(supportingExaminationsSchema),
  infectionControl: Type.Optional(infectionControlSchema),
  reportingData: Type.Optional(reportingDataSchema),
  outcome: Type.Optional(outcome),
  verificationData: Type.Optional(verificationDataSchema)
});

type SurveillanceCaseRow = {
  case_id: string;
  case_no: string;
  status: string;
  unit_id: string;
};

type CurrentSurveillanceRow = SurveillanceCaseRow & {
  patient_id: string;
  surveillance_type: 'hais' | 'tuberculosis' | 'hiv_aids' | 'outbreak' | 'other';
  surveillance_subtype: string | null;
};

export const surveillanceRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.post(
    '/cases',
    {
      preHandler: [app.authenticate, app.authorize(['surveilans:write'])],
      schema: { body: createSurveillanceCaseBody }
    },
    async (request, reply) => {
      assertUnitAccess(request, request.body.unitId, 'surveilans:write', 'surveilans:write:own-unit');
      const selectedType = request.body.surveillanceType ?? 'hais';
      const selectedSubtype = request.body.surveillanceSubtype ?? request.body.haiTypeCode ?? null;
      if (selectedType === 'hais' && !selectedSubtype) {
        throw new AppError(400, 'VAL-001', 'Jenis HAIs wajib dipilih.', 'surveillanceSubtype');
      }

      const caseNo = createRecordNumber(selectedType === 'hais' ? 'HAI' : 'SRV');
      const result = await withTransaction(app.db, async (client) => {
        const patientResult = await client.query<{ patient_id: string }>(
          `insert into core_surveillance.patients
             (mrn, full_name, birth_date, age_years, sex, updated_at)
           values ($1, $2, $3, $4, $5, now())
           on conflict (mrn) do update
             set full_name = excluded.full_name,
                 birth_date = coalesce(excluded.birth_date, core_surveillance.patients.birth_date),
                 age_years = coalesce(excluded.age_years, core_surveillance.patients.age_years),
                 sex = coalesce(excluded.sex, core_surveillance.patients.sex),
                 updated_at = now()
           returning patient_id`,
          [
            request.body.mrn,
            request.body.fullName,
            request.body.birthDate ?? null,
            request.body.ageYears ?? null,
            request.body.sex ?? null
          ]
        );
        const patient = patientResult.rows[0];
        if (!patient) {
          throw new Error('Patient upsert did not return a record.');
        }

        const caseResult = await client.query<SurveillanceCaseRow>(
          `insert into core_surveillance.surveillance_cases
             (case_no, patient_id, unit_id, unit_name, room_name, attending_physician, admission_date,
              surveillance_start_date, surveillance_type, surveillance_subtype, diagnosis_text,
              dynamic_data, clinical_data, supporting_examinations, infection_control_data,
              reporting_data, outcome, verification_data, status, created_by, updated_at)
           values
             ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb,
              $14::jsonb, $15::jsonb, $16::jsonb, $17, $18::jsonb, 'open', $19, now())
           returning case_id, case_no, status, unit_id`,
          [
            caseNo,
            patient.patient_id,
            request.body.unitId,
            request.body.unitName ?? null,
            request.body.roomName ?? null,
            request.body.attendingPhysician ?? null,
            request.body.admissionDate ?? null,
            request.body.surveillanceStartDate ?? null,
            selectedType,
            selectedSubtype,
            request.body.diagnosisText,
            JSON.stringify(request.body.dynamicData ?? {}),
            JSON.stringify(request.body.clinicalData ?? {}),
            JSON.stringify(request.body.supportingExaminations ?? {}),
            JSON.stringify(request.body.infectionControl ?? {}),
            JSON.stringify(request.body.reportingData ?? {}),
            request.body.outcome ?? null,
            JSON.stringify(request.body.verificationData ?? {}),
            request.user.sub
          ]
        );
        const surveillanceCase = caseResult.rows[0];
        if (!surveillanceCase) {
          throw new Error('Surveillance case insert did not return a record.');
        }

        if (selectedType === 'hais' && selectedSubtype) {
          await client.query(
            `insert into core_surveillance.hai_events
               (case_id, hai_type_code, onset_date, confirmation_status)
             values ($1, $2, coalesce($3::date, current_date), 'suspected')`,
            [surveillanceCase.case_id, selectedSubtype, request.body.surveillanceStartDate ?? null]
          );
        }
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
          newValue: {
            caseNo,
            status: surveillanceCase.status,
            unitId: request.body.unitId,
            surveillanceType: selectedType,
            surveillanceSubtype: selectedSubtype,
            outcome: request.body.outcome ?? null
          },
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
          status: result.status,
          surveillanceType: selectedType,
          surveillanceSubtype: selectedSubtype
        }
      });
    }
  );

  app.get(
    '/cases/:caseId',
    {
      preHandler: [app.authenticate, app.authorize(['surveilans:write'])],
      schema: { params: Type.Object({ caseId: uuid }) }
    },
    async (request) => {
      const result = await app.db.query<SurveillanceCaseRow & Record<string, unknown>>(
        `select sc.*, p.mrn, p.full_name, p.birth_date, p.age_years, p.sex,
                (select jsonb_build_object(
                          'haiTypeCode', he.hai_type_code,
                          'onsetDate', he.onset_date,
                          'confirmationStatus', he.confirmation_status
                        )
                   from core_surveillance.hai_events he
                  where he.case_id = sc.case_id
                  order by he.hai_event_id
                  limit 1) as hai_event,
                (select jsonb_build_object(
                          'organismName', cr.organism_name,
                          'specimenType', cr.specimen_type,
                          'sensitivitySummary', cr.sensitivity_summary,
                          'resultDate', cr.result_date
                        )
                   from core_surveillance.culture_results cr
                  where cr.case_id = sc.case_id
                  order by cr.result_date desc nulls last, cr.culture_id
                  limit 1) as culture_result
           from core_surveillance.surveillance_cases sc
           join core_surveillance.patients p on p.patient_id = sc.patient_id
          where sc.case_id = $1`,
        [request.params.caseId]
      );
      const surveillanceCase = result.rows[0];
      if (!surveillanceCase) {
        throw new AppError(404, 'RES-404', 'Surveillance case was not found.');
      }
      assertUnitAccess(request, surveillanceCase.unit_id, 'surveilans:write', 'surveilans:write:own-unit');
      return {
        success: true,
        message: 'Surveillance case retrieved.',
        data: surveillanceCase
      };
    }
  );

  app.patch(
    '/cases/:caseId',
    {
      preHandler: [app.authenticate, app.authorize(['surveilans:write'])],
      schema: {
        params: Type.Object({ caseId: uuid }),
        body: Type.Partial(createSurveillanceCaseBody)
      }
    },
    async (request) => {
      const result = await withTransaction(app.db, async (client) => {
        const currentResult = await client.query<CurrentSurveillanceRow>(
          `select case_id, case_no, patient_id, unit_id, status, surveillance_type, surveillance_subtype
             from core_surveillance.surveillance_cases
            where case_id = $1
            for update`,
          [request.params.caseId]
        );
        const current = currentResult.rows[0];
        if (!current) {
          throw new AppError(404, 'RES-404', 'Surveillance case was not found.');
        }
        assertUnitAccess(request, current.unit_id, 'surveilans:write', 'surveilans:write:own-unit');
        if (request.body.unitId) {
          assertUnitAccess(request, request.body.unitId, 'surveilans:write', 'surveilans:write:own-unit');
        }

        const selectedType = request.body.surveillanceType ?? current.surveillance_type;
        const selectedSubtype =
          request.body.surveillanceSubtype ?? request.body.haiTypeCode ?? current.surveillance_subtype;
        if (selectedType === 'hais' && !selectedSubtype) {
          throw new AppError(400, 'VAL-001', 'Jenis HAIs wajib dipilih.', 'surveillanceSubtype');
        }

        await client.query(
          `update core_surveillance.patients
              set mrn = coalesce($2, mrn),
                  full_name = coalesce($3, full_name),
                  birth_date = coalesce($4, birth_date),
                  age_years = coalesce($5, age_years),
                  sex = coalesce($6, sex),
                  updated_at = now()
            where patient_id = $1`,
          [
            current.patient_id,
            request.body.mrn ?? null,
            request.body.fullName ?? null,
            request.body.birthDate ?? null,
            request.body.ageYears ?? null,
            request.body.sex ?? null
          ]
        );

        const updatedResult = await client.query<SurveillanceCaseRow>(
          `update core_surveillance.surveillance_cases
              set unit_id = coalesce($2, unit_id),
                  unit_name = coalesce($3, unit_name),
                  room_name = coalesce($4, room_name),
                  attending_physician = coalesce($5, attending_physician),
                  admission_date = coalesce($6, admission_date),
                  surveillance_start_date = coalesce($7, surveillance_start_date),
                  surveillance_type = $8,
                  surveillance_subtype = $9,
                  diagnosis_text = coalesce($10, diagnosis_text),
                  dynamic_data = coalesce($11::jsonb, dynamic_data),
                  clinical_data = coalesce($12::jsonb, clinical_data),
                  supporting_examinations = coalesce($13::jsonb, supporting_examinations),
                  infection_control_data = coalesce($14::jsonb, infection_control_data),
                  reporting_data = coalesce($15::jsonb, reporting_data),
                  outcome = coalesce($16, outcome),
                  verification_data = coalesce($17::jsonb, verification_data),
                  updated_at = now()
            where case_id = $1
            returning case_id, case_no, status, unit_id`,
          [
            request.params.caseId,
            request.body.unitId ?? null,
            request.body.unitName ?? null,
            request.body.roomName ?? null,
            request.body.attendingPhysician ?? null,
            request.body.admissionDate ?? null,
            request.body.surveillanceStartDate ?? null,
            selectedType,
            selectedSubtype,
            request.body.diagnosisText ?? null,
            request.body.dynamicData === undefined ? null : JSON.stringify(request.body.dynamicData),
            request.body.clinicalData === undefined ? null : JSON.stringify(request.body.clinicalData),
            request.body.supportingExaminations === undefined
              ? null
              : JSON.stringify(request.body.supportingExaminations),
            request.body.infectionControl === undefined ? null : JSON.stringify(request.body.infectionControl),
            request.body.reportingData === undefined ? null : JSON.stringify(request.body.reportingData),
            request.body.outcome ?? null,
            request.body.verificationData === undefined ? null : JSON.stringify(request.body.verificationData)
          ]
        );
        const updated = updatedResult.rows[0];
        if (!updated) {
          throw new Error('Surveillance case update did not return a record.');
        }

        if (selectedType === 'hais' && selectedSubtype) {
          const haiUpdate = await client.query(
            `update core_surveillance.hai_events
                set hai_type_code = $2,
                    onset_date = coalesce($3::date, onset_date)
              where case_id = $1`,
            [request.params.caseId, selectedSubtype, request.body.surveillanceStartDate ?? null]
          );
          if (haiUpdate.rowCount === 0) {
            await client.query(
              `insert into core_surveillance.hai_events
                 (case_id, hai_type_code, onset_date, confirmation_status)
               values ($1, $2, coalesce($3::date, current_date), 'suspected')`,
              [request.params.caseId, selectedSubtype, request.body.surveillanceStartDate ?? null]
            );
          }
        } else if (current.surveillance_type === 'hais') {
          await client.query('delete from core_surveillance.hai_events where case_id = $1', [
            request.params.caseId
          ]);
        }

        if (request.body.organismName !== undefined) {
          const cultureUpdate = await client.query(
            `update core_surveillance.culture_results
                set organism_name = $2,
                    result_date = current_date
              where culture_id = (
                select culture_id
                  from core_surveillance.culture_results
                 where case_id = $1
                 order by result_date desc nulls last, culture_id
                 limit 1
              )`,
            [request.params.caseId, request.body.organismName]
          );
          if (cultureUpdate.rowCount === 0) {
            await client.query(
              `insert into core_surveillance.culture_results (case_id, organism_name, result_date)
               values ($1, $2, current_date)`,
              [request.params.caseId, request.body.organismName]
            );
          }
        }

        await recordAuditTrail(client, {
          moduleName: 'surveillance',
          entityName: 'surveillance_cases',
          entityId: request.params.caseId,
          actionType: 'update',
          actorUserId: request.user.sub,
          previousValue: {
            unitId: current.unit_id,
            surveillanceType: current.surveillance_type,
            surveillanceSubtype: current.surveillance_subtype
          },
          newValue: {
            unitId: updated.unit_id,
            surveillanceType: selectedType,
            surveillanceSubtype: selectedSubtype,
            outcome: request.body.outcome ?? null
          },
          ipAddress: request.ip
        });
        return updated;
      });

      return {
        success: true,
        message: 'Surveillance case updated.',
        data: {
          caseId: result.case_id,
          caseNo: result.case_no,
          status: result.status
        }
      };
    }
  );
};
