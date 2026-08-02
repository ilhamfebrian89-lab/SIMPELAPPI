import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyServerOptions } from 'fastify';
import type { AppConfig } from './config.js';
import { registerErrorHandler } from './lib/errors.js';
import { databasePlugin, type Database } from './plugins/database.js';
import { securityPlugin } from './plugins/security.js';
import { auditRoutes } from './routes/audit.js';
import { authRoutes } from './routes/auth.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { healthRoutes } from './routes/health.js';
import { monitoringRoutes } from './routes/monitoring.js';
import { notificationRoutes } from './routes/notifications.js';
import { rtlRoutes } from './routes/rtl.js';
import { surveillanceRoutes } from './routes/surveillance.js';

type BuildAppOptions = {
  config: AppConfig;
  database?: Database;
  logger?: FastifyServerOptions['logger'];
};

export async function buildApp({ config, database, logger }: BuildAppOptions) {
  const app = Fastify({
    logger: logger ?? {
      level: config.logLevel,
      redact: ['req.headers.authorization', 'body.password', 'body.refreshToken']
    },
    genReqId(request) {
      const correlationId = request.headers['x-correlation-id'];
      return typeof correlationId === 'string' && correlationId.length <= 100 ? correlationId : randomUUID();
    }
  });

  registerErrorHandler(app);
  await app.register(databasePlugin, {
    connectionString: config.databaseUrl,
    ...(database ? { database } : {})
  });
  await app.register(securityPlugin, { config });

  app.addHook('onSend', async (request, reply) => {
    void reply.header('x-correlation-id', request.id);
  });

  await app.register(healthRoutes);
  await app.register(authRoutes(config), { prefix: '/api/v1/auth' });
  await app.register(monitoringRoutes, { prefix: '/api/v1/monitoring' });
  await app.register(auditRoutes, { prefix: '/api/v1/audit' });
  await app.register(rtlRoutes, { prefix: '/api/v1/rtl' });
  await app.register(surveillanceRoutes, { prefix: '/api/v1/surveilans' });
  await app.register(notificationRoutes, { prefix: '/api/v1/notifications' });
  await app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });

  return app;
}
