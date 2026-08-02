import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

const keyLength = 64;
const cost = 16_384;
const blockSize = 8;
const parallelization = 1;

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      keyLength,
      { N: cost, r: blockSize, p: parallelization, maxmem: 64 * 1024 * 1024 },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      }
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt);
  return `scrypt$${cost}$${blockSize}$${parallelization}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, encodedCost, encodedBlockSize, encodedParallelization, encodedSalt, encodedValue] =
    encodedHash.split('$');

  if (
    algorithm !== 'scrypt' ||
    Number(encodedCost) !== cost ||
    Number(encodedBlockSize) !== blockSize ||
    Number(encodedParallelization) !== parallelization ||
    !encodedSalt ||
    !encodedValue
  ) {
    return false;
  }

  const expected = Buffer.from(encodedValue, 'base64');
  const actual = await scrypt(password, Buffer.from(encodedSalt, 'base64'));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
