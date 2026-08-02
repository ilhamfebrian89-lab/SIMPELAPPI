import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { assertActor, assertUnitAccess } from '../lib/authorization.js';
import { recordAuditTrail, withTransaction } from '../lib/database.js';
import { AppError } from '../lib/errors.js';
import { createRecordNumber } from '../lib/record-number.js';

const uuid = Type.String({ format: 'uuid' });
const date = Type.String({ format: 'date' });

export const auditRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.post(
    '/',
    {
      preHandler: [app.authenticate, app.authorize(['audit:write'])],
      schema: {
        body: Type.Object({
          auditDate: date,
          unitId: uuid,
          auditorUserId: uuid,
          findings: Type.Optional(
            Type.Array(
              Type.Object({
                findingCategory: Type.String({ minLength: 1, maxLength: 80 }),
                findingDetail: Type.String({ minLength: 1 }),
                severityLevel: Type.String({ minLength: 1, maxLength: 20 })
              })
            )
          ),
          recommendations: Type.Optional(
            Type.Array(
              Type.Object({
                recommendationText: Type.String({ minLength: 1 }),
                dueDate: Type.Optional(date)
              })
            )
          )
        })
      }
    },
    async (request, reply) => {
      assertActor(request, request.body.auditorUserId);
      assertUnitAccess(request, request.body.unitId, 'audit:write', 'audit:write:own-unit');
      const auditNo = createRecordNumber('AUD');

      const result = await withTransaction(app.db, async (client) => {
        const created = await client.query<{ audit_id: string; status: string }>(
          `insert into core_audit.audits
             (audit_no, audit_date, unit_id, auditor_user_id, status, created_by, updated_by)
           values ($1, $2, $3, $4, 'draft', $4, $4)
           returning audit_id, status`,
          [auditNo, request.body.auditDate, request.body.unitId, request.body.auditorUserId]
        );
        const audit = created.rows[0];
        if (!audit) {
          throw new Error('Audit insert did not return a record.');
        }

        for (const finding of request.body.findings ?? []) {
          await client.query(
            `insert into core_audit.audit_findings
               (audit_id, finding_category, finding_detail, severity_level)
             values ($1, $2, $3, $4)`,
            [audit.audit_id, finding.findingCategory, finding.findingDetail, finding.severityLevel]
          );
        }
        for (const recommendation of request.body.recommendations ?? []) {
          await client.query(
            `insert into core_audit.audit_recommendations
               (audit_id, recommendation_text, due_date)
             values ($1, $2, $3)`,
            [audit.audit_id, recommendation.recommendationText, recommendation.dueDate ?? null]
          );
        }

        await recordAuditTrail(client, {
          moduleName: 'audit',
          entityName: 'audits',
          entityId: audit.audit_id,
          actionType: 'create',
          actorUserId: request.user.sub,
          newValue: { auditNo, status: audit.status, unitId: request.body.unitId },
          ipAddress: request.ip
        });
        return audit;
      });

      return reply.status(201).send({
        success: true,
        message: 'Audit draft created.',
        data: {
          auditId: result.audit_id,
          auditNo,
          status: result.status
        }
      });
    }
  );

  app.post(
    '/:auditId/approval',
    {
      preHandler: [app.authenticate, app.authorize(['audit:approve'])],
      schema: {
        params: Type.Object({ auditId: uuid }),
        body: Type.Object({
          approverUserId: uuid,
          approvalStatus: Type.Union([
            Type.Literal('approved'),
            Type.Literal('rejected'),
            Type.Literal('need_revision')
          ]),
          approvalNote: Type.Optional(Type.String())
        })
      }
    },
    async (request) => {
      assertActor(request, request.body.approverUserId);
      const auditStatus = request.body.approvalStatus === 'rejected' ? 'need_revision' : request.body.approvalStatus;

      await withTransaction(app.db, async (client) => {
        const current = await client.query<{ audit_id: string; status: string }>(
          'select audit_id, status from core_audit.audits where audit_id = $1 for update',
          [request.params.auditId]
        );
        const audit = current.rows[0];
        if (!audit) {
          throw new AppError(404, 'RES-404', 'Audit was not found.');
        }
        if (audit.status === 'closed') {
          throw new AppError(409, 'BIZ-409', 'A closed audit cannot be approved again.');
        }

        await client.query(
          `insert into core_audit.audit_approvals
             (audit_id, approver_user_id, approval_status, approval_note)
           values ($1, $2, $3, $4)`,
          [
            request.params.auditId,
            request.body.approverUserId,
            request.body.approvalStatus,
            request.body.approvalNote ?? null
          ]
        );
        await client.query(
          `update core_audit.audits
              set status = $2, updated_at = now(), updated_by = $3
            where audit_id = $1`,
          [request.params.auditId, auditStatus, request.body.approverUserId]
        );
        await recordAuditTrail(client, {
          moduleName: 'audit',
          entityName: 'audits',
          entityId: audit.audit_id,
          actionType: 'approve',
          actorUserId: request.user.sub,
          previousValue: { status: audit.status },
          newValue: { status: auditStatus, approvalStatus: request.body.approvalStatus },
          ipAddress: request.ip
        });
      });

      return {
        success: true,
        message: 'Audit approval recorded.',
        data: {
          auditId: request.params.auditId,
          approvalStatus: request.body.approvalStatus
        }
      };
    }
  );
};
