import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { assertUnitAccess } from '../lib/authorization.js';

type KpiRow = {
  kpi_date: string;
  unit_id: string;
  hand_hygiene_rate: string | null;
  bundle_compliance_rate: string | null;
  active_hai_count: number | null;
  open_rtl_count: number | null;
};

export const dashboardRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '/kpi',
    {
      preHandler: [app.authenticate, app.authorize(['dashboard:read', 'dashboard:read:own-unit'])],
      schema: {
        querystring: Type.Object({
          date: Type.String({ format: 'date' }),
          unitId: Type.String({ format: 'uuid' })
        })
      }
    },
    async (request) => {
      assertUnitAccess(request, request.query.unitId, 'dashboard:read', 'dashboard:read:own-unit');
      const result = await app.db.query<KpiRow>(
        `select kpi_date::text, unit_id, hand_hygiene_rate, bundle_compliance_rate,
                active_hai_count, open_rtl_count
           from support_reporting.dashboard_kpi_daily
          where kpi_date = $1 and unit_id = $2`,
        [request.query.date, request.query.unitId]
      );
      const row = result.rows[0];

      return {
        success: true,
        message: 'Dashboard KPI loaded.',
        data: {
          date: request.query.date,
          unitId: request.query.unitId,
          handHygieneRate: Number(row?.hand_hygiene_rate ?? 0),
          bundleComplianceRate: Number(row?.bundle_compliance_rate ?? 0),
          activeHaiCount: row?.active_hai_count ?? 0,
          openRtlCount: row?.open_rtl_count ?? 0
        }
      };
    }
  );
};
