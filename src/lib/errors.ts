import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export type ErrorDetail = {
  code: string;
  detail: string;
  field?: string;
};

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

type DatabaseError = Error & {
  code?: string;
  constraint?: string;
};

function sendError(reply: FastifyReply, statusCode: number, message: string, error: ErrorDetail) {
  return reply.status(statusCode).send({
    success: false,
    message,
    errors: [error]
  });
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      return sendError(reply, error.statusCode, error.message, {
        code: error.code,
        detail: error.message,
        ...(error.field ? { field: error.field } : {})
      });
    }

    if (error.validation) {
      const firstIssue = error.validation[0];
      const field = firstIssue?.instancePath?.replace(/^\//, '') || firstIssue?.params?.missingProperty;
      return sendError(reply, 400, 'Request validation failed.', {
        code: 'VAL-001',
        detail: firstIssue?.message ?? 'Invalid request payload.',
        ...(typeof field === 'string' && field ? { field } : {})
      });
    }

    const databaseError = error as DatabaseError;
    if (databaseError.code === '23503') {
      return sendError(reply, 400, 'Referenced data does not exist.', {
        code: 'VAL-002',
        detail: 'One or more referenced records do not exist.'
      });
    }
    if (databaseError.code === '23505') {
      return sendError(reply, 409, 'The record already exists.', {
        code: 'BIZ-409',
        detail: 'A record with the same unique value already exists.'
      });
    }

    request.log.error({ err: error }, 'Unhandled request error');
    return sendError(reply, 500, 'Internal server error.', {
      code: 'SYS-500',
      detail: 'An unexpected error occurred.'
    });
  });
}
