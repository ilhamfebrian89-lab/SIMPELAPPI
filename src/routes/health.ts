import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => ({
    success: true,
    message: 'SIMPELAPPI API is running.',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  }));

  app.get('/ready', async (_request, reply) => {
    try {
      await app.db.query('select 1');
      return {
        success: true,
        message: 'SIMPELAPPI API is ready.',
        data: { status: 'ready' }
      };
    } catch (error) {
      app.log.error({ err: error }, 'Database readiness check failed');
      return reply.status(503).send({
        success: false,
        message: 'SIMPELAPPI API is not ready.',
        errors: [{ code: 'SYS-503', detail: 'Database connection is unavailable.' }]
      });
    }
  });
};
