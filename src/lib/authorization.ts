import type { FastifyRequest } from 'fastify';
import { AppError } from './errors.js';
import { canAccessUnit } from '../plugins/security.js';

export function assertActor(request: FastifyRequest, actorUserId: string) {
  if (request.user.sub !== actorUserId && !request.user.scope.includes('admin:*')) {
    throw new AppError(403, 'AUTH-403', 'The acting user must match the authenticated user.');
  }
}

export function assertUnitAccess(
  request: FastifyRequest,
  unitId: string,
  broadScope: string,
  ownUnitScope: string
) {
  if (!canAccessUnit(request.user, unitId, broadScope, ownUnitScope)) {
    throw new AppError(403, 'AUTH-403', 'Access to data from this unit is not permitted.');
  }
}
