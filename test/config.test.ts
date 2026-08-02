import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('parses a valid environment', () => {
    const config = loadConfig({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/simpelappi',
      JWT_SECRET: 'a-secure-test-secret-with-32-characters'
    });

    expect(config.port).toBe(8080);
    expect(config.corsOrigins).toEqual(['http://localhost:3000', 'http://localhost:8080']);
  });

  it('rejects a short JWT secret', () => {
    expect(() =>
      loadConfig({
        DATABASE_URL: 'postgresql://user:password@localhost:5432/simpelappi',
        JWT_SECRET: 'too-short'
      })
    ).toThrow('Invalid application configuration');
  });
});
