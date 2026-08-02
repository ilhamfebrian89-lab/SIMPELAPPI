import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import type { AppConfig } from '../src/config.js';

const config: AppConfig = {
  nodeEnv: 'test',
  host: '127.0.0.1',
  port: 8080,
  logLevel: 'silent',
  databaseUrl: 'postgresql://unused:unused@127.0.0.1:1/unused',
  jwtSecret: 'a-secure-test-secret-with-32-characters',
  jwtIssuer: 'simpelappi-auth',
  jwtAudience: 'simpelappi-api',
  accessTokenTtlSeconds: 3600,
  refreshTokenTtlSeconds: 604800,
  corsOrigins: []
};

describe('SIMPELAPPI API', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('returns health status and a correlation ID', async () => {
    app = await buildApp({ config, logger: false });
    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { 'x-correlation-id': 'test-correlation-id' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-correlation-id']).toBe('test-correlation-id');
    expect(response.json()).toMatchObject({
      success: true,
      data: { status: 'ok' }
    });
  });

  it('rejects protected requests without a bearer token', async () => {
    app = await buildApp({ config, logger: false });
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().errors[0].code).toBe('AUTH-401');
  });

  it('returns the standard validation envelope', async () => {
    app = await buildApp({ config, logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/monitoring',
      payload: {
        monitoringDate: '2026-08-01',
        observerUserId: '22222222-2222-2222-2222-222222222223',
        items: [{ questionCode: 'HH-01', answerValue: 'yes', scoreValue: 1 }]
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().errors[0].code).toBe('VAL-001');
  });

  it('blocks a director from creating monitoring data', async () => {
    app = await buildApp({ config, logger: false });
    const token = app.jwt.sign({
      sub: '22222222-2222-2222-2222-222222222221',
      role_code: 'DIRECTOR',
      unit_id: '11111111-1111-1111-1111-111111111113',
      scope: ['dashboard:read', 'report:read'],
      token_version: 0,
      token_type: 'access'
    });
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/monitoring',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        monitoringDate: '2026-08-01',
        unitId: '11111111-1111-1111-1111-111111111111',
        observerUserId: '22222222-2222-2222-2222-222222222221',
        items: [{ questionCode: 'HH-01', answerValue: 'yes', scoreValue: 1 }]
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().errors[0].code).toBe('AUTH-403');
  });

  it('requires a HAIs subtype for HAIs surveillance cases', async () => {
    app = await buildApp({ config, logger: false });
    const token = app.jwt.sign({
      sub: '22222222-2222-2222-2222-222222222223',
      role_code: 'IPCN',
      unit_id: '11111111-1111-1111-1111-111111111111',
      scope: ['surveilans:write'],
      token_version: 0,
      token_type: 'access'
    });
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/surveilans/cases',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        mrn: 'MRN-001',
        fullName: 'Pasien Uji',
        unitId: '11111111-1111-1111-1111-111111111111',
        diagnosisText: 'Diagnosis uji',
        surveillanceType: 'hais'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().errors[0]).toMatchObject({
      code: 'VAL-001',
      field: 'surveillanceSubtype'
    });
  });

  it('enforces own-unit dashboard access before querying data', async () => {
    app = await buildApp({ config, logger: false });
    const token = app.jwt.sign({
      sub: '22222222-2222-2222-2222-222222222224',
      role_code: 'IPCLN',
      unit_id: '11111111-1111-1111-1111-111111111111',
      scope: ['dashboard:read:own-unit'],
      token_version: 0,
      token_type: 'access'
    });
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard/kpi?date=2026-08-01&unitId=11111111-1111-1111-1111-111111111112',
      headers: { authorization: `Bearer ${token}` }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().errors[0].code).toBe('AUTH-403');
  });
});
