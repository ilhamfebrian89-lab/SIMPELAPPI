import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import type { AppConfig } from '../config.js';
import { AppError } from '../lib/errors.js';

export type AuthClaims = {
  sub: string;
  role_code: string;
  unit_id: string;
  scope: string[];
  token_version: number;
  token_type: 'access' | 'refresh';
};

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthClaims;
    user: AuthClaims;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: preHandlerHookHandler;
    authorize: (requiredScopes: string[]) => preHandlerHookHandler;
  }
}

function hasScope(scopes: string[], requiredScope: string): boolean {
  return scopes.includes(requiredScope) || scopes.includes('admin:*');
}

export function canAccessUnit(
  claims: AuthClaims,
  unitId: string,
  broadScope: string,
  ownUnitScope: string
): boolean {
  return hasScope(claims.scope, broadScope) || (hasScope(claims.scope, ownUnitScope) && claims.unit_id === unitId);
}

export const securityPlugin = fp<{ config: AppConfig }>(async (app, { config }) => {
  await app.register(helmet, { global: true });
  await app.register(cors, {
    origin: config.nodeEnv === 'production' ? config.corsOrigins : true,
    credentials: true
  });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute'
  });
  await app.register(jwt, {
    secret: config.jwtSecret,
    sign: {
      iss: config.jwtIssuer,
      aud: config.jwtAudience
    },
    verify: {
      allowedIss: config.jwtIssuer,
      allowedAud: config.jwtAudience
    }
  });

  app.decorate('authenticate', async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new AppError(401, 'AUTH-401', 'Authentication is required.');
    }
    if (request.user.token_type !== 'access') {
      throw new AppError(401, 'AUTH-401', 'An access token is required.');
    }
  });

  app.decorate('authorize', (requiredScopes: string[]) => {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
      if (!requiredScopes.some((scope) => hasScope(request.user.scope, scope))) {
        throw new AppError(403, 'AUTH-403', 'You do not have permission to perform this action.');
      }
    };
  });
});
