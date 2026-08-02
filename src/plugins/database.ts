import fp from 'fastify-plugin';
import { Pool, type PoolConfig } from 'pg';

export type Database = Pick<Pool, 'query' | 'connect' | 'end'>;

declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
  }
}

type DatabasePluginOptions = {
  connectionString: string;
  database?: Database;
};

export const databasePlugin = fp<DatabasePluginOptions>(async (app, options) => {
  const pool =
    options.database ??
    new Pool({
      connectionString: options.connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    } satisfies PoolConfig);

  app.decorate('db', pool);
  app.addHook('onClose', async () => {
    await pool.end();
  });
});
