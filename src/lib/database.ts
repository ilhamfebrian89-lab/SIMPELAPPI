import type { PoolClient } from 'pg';
import type { Database } from '../plugins/database.js';

export async function withTransaction<T>(
  database: Database,
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await database.connect();
  try {
    await client.query('begin');
    const result = await operation(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function recordAuditTrail(
  client: PoolClient,
  input: {
    moduleName: string;
    entityName: string;
    entityId: string;
    actionType: string;
    actorUserId: string;
    previousValue?: unknown;
    newValue?: unknown;
    ipAddress?: string;
  }
) {
  await client.query(
    `insert into generic_audit.audit_trails
       (module_name, entity_name, entity_id, action_type, old_value_json, new_value_json,
        action_by_user_id, ip_address)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      input.moduleName,
      input.entityName,
      input.entityId,
      input.actionType,
      input.previousValue === undefined ? null : JSON.stringify(input.previousValue),
      input.newValue === undefined ? null : JSON.stringify(input.newValue),
      input.actorUserId,
      input.ipAddress ?? null
    ]
  );
}
