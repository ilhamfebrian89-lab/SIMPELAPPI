import { parseArgs } from 'node:util';
import { Pool } from 'pg';
import { hashPassword } from '../lib/password.js';

const { values } = parseArgs({
  options: {
    user: { type: 'string' },
    username: { type: 'string' }
  }
});

const databaseUrl = process.env.DATABASE_URL;
const password = process.env.SIMPELAPPI_USER_PASSWORD;

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set.');
}
if (!password || password.length < 12 || password.length > 200) {
  throw new Error('SIMPELAPPI_USER_PASSWORD must contain between 12 and 200 characters.');
}
if (!values.user || !values.username) {
  throw new Error('Usage: npm run user:set-password -- --user <email-or-employee-no> --username <username>');
}
if (!/^[A-Za-z0-9._-]{3,100}$/.test(values.username)) {
  throw new Error('Username must contain 3-100 letters, numbers, dots, underscores, or hyphens.');
}

const pool = new Pool({ connectionString: databaseUrl });

try {
  const userResult = await pool.query<{ user_id: string }>(
    `select user_id
       from support_identity.users
      where lower(email) = lower($1) or employee_no = $1`,
    [values.user]
  );
  const user = userResult.rows[0];
  if (!user) {
    throw new Error(`User not found: ${values.user}`);
  }

  const passwordHash = await hashPassword(password);
  await pool.query(
    `insert into support_identity.user_credentials (user_id, username, password_hash)
     values ($1, $2, $3)
     on conflict (user_id) do update
       set username = excluded.username,
           password_hash = excluded.password_hash,
           token_version = support_identity.user_credentials.token_version + 1,
           failed_attempts = 0,
           locked_until = null,
           updated_at = now()`,
    [user.user_id, values.username, passwordHash]
  );
  console.log(`Credentials updated for ${values.username}.`);
} finally {
  await pool.end();
}
