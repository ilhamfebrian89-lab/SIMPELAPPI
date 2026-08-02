import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/password.js';

describe('password hashing', () => {
  it('verifies only the original password', async () => {
    const hash = await hashPassword('strong-test-password');

    await expect(verifyPassword('strong-test-password', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('rejects malformed hashes', async () => {
    await expect(verifyPassword('strong-test-password', 'invalid')).resolves.toBe(false);
  });
});
