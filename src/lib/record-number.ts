import { randomUUID } from 'node:crypto';

export function createRecordNumber(prefix: string, date = new Date()): string {
  const datePart = date.toISOString().slice(0, 10).replaceAll('-', '');
  const randomPart = randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
  return `${prefix}-${datePart}-${randomPart}`;
}
