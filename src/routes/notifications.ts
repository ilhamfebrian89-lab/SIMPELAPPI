import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { assertActor } from '../lib/authorization.js';
import { AppError } from '../lib/errors.js';

const uuid = Type.String({ format: 'uuid' });

type NotificationRow = {
  notification_id: string;
  title: string;
  body: string;
  source_type: string;
  source_id: string;
  is_read: boolean;
  created_at: Date;
};

export const notificationRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '/',
    {
      preHandler: [app.authenticate, app.authorize(['notification:read'])],
      schema: {
        querystring: Type.Object({
          page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
          size: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
          isRead: Type.Optional(Type.Boolean())
        })
      }
    },
    async (request) => {
      const page = request.query.page ?? 1;
      const size = request.query.size ?? 20;
      const offset = (page - 1) * size;
      const readFilter = request.query.isRead === undefined ? '' : 'and is_read = $4';
      const parameters: unknown[] = [request.user.sub, size, offset];
      if (request.query.isRead !== undefined) {
        parameters.push(request.query.isRead);
      }

      const result = await app.db.query<NotificationRow>(
        `select notification_id, title, body, source_type, source_id, is_read, created_at
           from support_notification.notifications
          where recipient_user_id = $1 ${readFilter}
          order by created_at desc
          limit $2 offset $3`,
        parameters
      );
      const countParameters =
        request.query.isRead === undefined ? [request.user.sub] : [request.user.sub, request.query.isRead];
      const count = await app.db.query<{ total: string }>(
        `select count(*)::text as total
           from support_notification.notifications
          where recipient_user_id = $1 ${request.query.isRead === undefined ? '' : 'and is_read = $2'}`,
        countParameters
      );

      return {
        success: true,
        message: 'Notifications loaded.',
        data: result.rows.map((row) => ({
          notificationId: row.notification_id,
          title: row.title,
          body: row.body,
          sourceType: row.source_type,
          sourceId: row.source_id,
          isRead: row.is_read,
          createdAt: row.created_at.toISOString()
        })),
        meta: {
          page,
          size,
          total: Number(count.rows[0]?.total ?? 0)
        }
      };
    }
  );

  app.patch(
    '/:notificationId/read',
    {
      preHandler: [app.authenticate, app.authorize(['notification:read'])],
      schema: {
        params: Type.Object({ notificationId: uuid }),
        body: Type.Object({ readBy: uuid })
      }
    },
    async (request) => {
      assertActor(request, request.body.readBy);
      const updated = await app.db.query<{ notification_id: string }>(
        `update support_notification.notifications
            set is_read = true, read_at = coalesce(read_at, now())
          where notification_id = $1 and recipient_user_id = $2
          returning notification_id`,
        [request.params.notificationId, request.user.sub]
      );
      if (!updated.rows[0]) {
        throw new AppError(404, 'RES-404', 'Notification was not found.');
      }
      return {
        success: true,
        message: 'Notification marked as read.',
        data: { notificationId: request.params.notificationId, isRead: true }
      };
    }
  );
};
