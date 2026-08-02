import { Type } from '@sinclair/typebox';
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { AppConfig } from '../config.js';
import { AppError } from '../lib/errors.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import type { AuthClaims } from '../plugins/security.js';

const roleScopes: Record<string, string[]> = {
  DIRECTOR: ['dashboard:read', 'report:read'],
  PPI_CHAIR: ['monitoring:write', 'audit:approve', 'rtl:write', 'dashboard:read'],
  IPCN: ['monitoring:write', 'audit:write', 'surveilans:write', 'rtl:write', 'notification:read', 'dashboard:read'],
  IPCLN: ['monitoring:write:own-unit', 'notification:read', 'dashboard:read:own-unit'],
  UNIT_HEAD: ['rtl:write:own-unit', 'notification:read', 'dashboard:read:own-unit', 'report:read:own-unit'],
  ADMIN: ['admin:*']
};

type CredentialRow = {
  user_id: string;
  full_name: string;
  role_code: string;
  unit_id: string;
  password_hash: string;
  token_version: number;
  failed_attempts: number;
  locked_until: Date | null;
};

async function findCredential(app: Parameters<FastifyPluginAsyncTypebox>[0], username: string) {
  const result = await app.db.query<CredentialRow>(
    `select u.user_id, u.full_name, u.role_code, u.unit_id,
            c.password_hash, c.token_version, c.failed_attempts, c.locked_until
       from support_identity.user_credentials c
       join support_identity.users u on u.user_id = c.user_id
      where lower(c.username) = lower($1)
        and u.is_active = true`,
    [username]
  );
  return result.rows[0];
}

function createClaims(row: CredentialRow, tokenType: AuthClaims['token_type']): AuthClaims {
  return {
    sub: row.user_id,
    role_code: row.role_code,
    unit_id: row.unit_id,
    scope: roleScopes[row.role_code] ?? [],
    token_version: row.token_version,
    token_type: tokenType
  };
}

export const authRoutes = (config: AppConfig): FastifyPluginAsyncTypebox => async (app) => {
  app.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute'
        }
      },
      schema: {
        body: Type.Object({
          username: Type.String({ minLength: 1, maxLength: 100 }),
          password: Type.String({ minLength: 8, maxLength: 200 })
        })
      }
    },
    async (request) => {
      const credential = await findCredential(app, request.body.username);
      const isLocked = credential?.locked_until && credential.locked_until.getTime() > Date.now();
      let passwordMatches = false;
      if (credential) {
        passwordMatches = await verifyPassword(request.body.password, credential.password_hash);
      } else {
        await hashPassword(request.body.password);
      }

      if (!credential || isLocked || !passwordMatches) {
        if (credential && !isLocked) {
          await app.db.query(
            `update support_identity.user_credentials
                set failed_attempts = failed_attempts + 1,
                    locked_until = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' else null end,
                    updated_at = now()
              where user_id = $1`,
            [credential.user_id]
          );
        }
        throw new AppError(401, 'AUTH-401', 'Invalid username or password.');
      }

      await app.db.query(
        `update support_identity.user_credentials
            set failed_attempts = 0, locked_until = null, last_login_at = now(), updated_at = now()
          where user_id = $1`,
        [credential.user_id]
      );

      const accessToken = await app.jwt.sign(createClaims(credential, 'access'), {
        expiresIn: config.accessTokenTtlSeconds
      });
      const refreshToken = await app.jwt.sign(createClaims(credential, 'refresh'), {
        expiresIn: config.refreshTokenTtlSeconds
      });

      return {
        success: true,
        message: 'Login successful.',
        data: {
          accessToken,
          refreshToken,
          expiresIn: config.accessTokenTtlSeconds,
          user: {
            userId: credential.user_id,
            fullName: credential.full_name,
            roleCode: credential.role_code,
            unitId: credential.unit_id
          }
        }
      };
    }
  );

  app.post(
    '/refresh',
    {
      schema: {
        body: Type.Object({
          refreshToken: Type.String({ minLength: 1 })
        })
      }
    },
    async (request) => {
      let claims: AuthClaims;
      try {
        claims = app.jwt.verify<AuthClaims>(request.body.refreshToken);
      } catch {
        throw new AppError(401, 'AUTH-401', 'The refresh token is invalid or expired.');
      }
      if (claims.token_type !== 'refresh') {
        throw new AppError(401, 'AUTH-401', 'A refresh token is required.');
      }

      const result = await app.db.query<CredentialRow>(
        `select u.user_id, u.full_name, u.role_code, u.unit_id,
                c.password_hash, c.token_version, c.failed_attempts, c.locked_until
           from support_identity.users u
           join support_identity.user_credentials c on c.user_id = u.user_id
          where u.user_id = $1 and u.is_active = true`,
        [claims.sub]
      );
      const credential = result.rows[0];
      const isLocked = credential?.locked_until && credential.locked_until.getTime() > Date.now();
      if (!credential || isLocked || claims.token_version !== credential.token_version) {
        throw new AppError(401, 'AUTH-401', 'The user is no longer active.');
      }

      const accessToken = await app.jwt.sign(createClaims(credential, 'access'), {
        expiresIn: config.accessTokenTtlSeconds
      });
      return {
        success: true,
        message: 'Access token refreshed.',
        data: {
          accessToken,
          expiresIn: config.accessTokenTtlSeconds
        }
      };
    }
  );
};
