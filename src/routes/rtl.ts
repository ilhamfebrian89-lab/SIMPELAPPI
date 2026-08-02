import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { assertActor, assertUnitAccess } from '../lib/authorization.js';
import { recordAuditTrail, withTransaction } from '../lib/database.js';
import { AppError } from '../lib/errors.js';
import { createRecordNumber } from '../lib/record-number.js';

const uuid = Type.String({ format: 'uuid' });

export const rtlRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.post(
    '/',
    {
      preHandler: [app.authenticate, app.authorize(['rtl:write', 'rtl:write:own-unit'])],
      schema: {
        body: Type.Object({
          sourceType: Type.Union([Type.Literal('audit'), Type.Literal('monitoring'), Type.Literal('analytics')]),
          sourceId: uuid,
          rtlTitle: Type.String({ minLength: 1, maxLength: 220 }),
          picUserId: uuid,
          unitId: uuid,
          dueDate: Type.String({ format: 'date' })
        })
      }
    },
    async (request, reply) => {
      assertUnitAccess(request, request.body.unitId, 'rtl:write', 'rtl:write:own-unit');
      const rtlNo = createRecordNumber('RTL');

      const result = await withTransaction(app.db, async (client) => {
        const created = await client.query<{ rtl_id: string; status: string }>(
          `insert into core_audit.rtls
             (rtl_no, source_type, source_id, rtl_title, pic_user_id, unit_id, due_date,
              progress_percent, status, created_by, updated_by)
           values ($1, $2, $3, $4, $5, $6, $7, 0, 'open', $8, $8)
           returning rtl_id, status`,
          [
            rtlNo,
            request.body.sourceType,
            request.body.sourceId,
            request.body.rtlTitle,
            request.body.picUserId,
            request.body.unitId,
            request.body.dueDate,
            request.user.sub
          ]
        );
        const rtl = created.rows[0];
        if (!rtl) {
          throw new Error('RTL insert did not return a record.');
        }
        await recordAuditTrail(client, {
          moduleName: 'rtl',
          entityName: 'rtls',
          entityId: rtl.rtl_id,
          actionType: 'create',
          actorUserId: request.user.sub,
          newValue: { rtlNo, status: rtl.status, unitId: request.body.unitId },
          ipAddress: request.ip
        });
        return rtl;
      });

      return reply.status(201).send({
        success: true,
        message: 'RTL created.',
        data: {
          rtlId: result.rtl_id,
          rtlNo,
          status: result.status
        }
      });
    }
  );

  app.patch(
    '/:rtlId/progress',
    {
      preHandler: [app.authenticate, app.authorize(['rtl:write', 'rtl:write:own-unit'])],
      schema: {
        params: Type.Object({ rtlId: uuid }),
        body: Type.Object({
          progressPercent: Type.Number({ minimum: 0, maximum: 100 }),
          comment: Type.Optional(Type.String()),
          updatedBy: uuid
        })
      }
    },
    async (request) => {
      assertActor(request, request.body.updatedBy);

      const status = request.body.progressPercent >= 100 ? 'closed' : 'in_progress';
      await withTransaction(app.db, async (client) => {
        const current = await client.query<{
          rtl_id: string;
          unit_id: string;
          status: string;
          progress_percent: string;
        }>('select rtl_id, unit_id, status, progress_percent from core_audit.rtls where rtl_id = $1 for update', [
          request.params.rtlId
        ]);
        const rtl = current.rows[0];
        if (!rtl) {
          throw new AppError(404, 'RES-404', 'RTL was not found.');
        }
        assertUnitAccess(request, rtl.unit_id, 'rtl:write', 'rtl:write:own-unit');
        if (rtl.status === 'closed') {
          throw new AppError(409, 'BIZ-409', 'A closed RTL cannot be updated.');
        }

        await client.query(
          `update core_audit.rtls
              set progress_percent = $2, status = $3, updated_at = now(), updated_by = $4
            where rtl_id = $1`,
          [request.params.rtlId, request.body.progressPercent, status, request.body.updatedBy]
        );
        if (request.body.comment) {
          await client.query(
            `insert into core_audit.rtl_comments (rtl_id, comment_by_user_id, comment_text)
             values ($1, $2, $3)`,
            [request.params.rtlId, request.body.updatedBy, request.body.comment]
          );
        }
        await recordAuditTrail(client, {
          moduleName: 'rtl',
          entityName: 'rtls',
          entityId: rtl.rtl_id,
          actionType: 'update',
          actorUserId: request.user.sub,
          previousValue: { progressPercent: Number(rtl.progress_percent), status: rtl.status },
          newValue: { progressPercent: request.body.progressPercent, status },
          ipAddress: request.ip
        });
      });

      return {
        success: true,
        message: 'RTL progress updated.',
        data: {
          rtlId: request.params.rtlId,
          progressPercent: request.body.progressPercent,
          status
        }
      };
    }
  );
};
