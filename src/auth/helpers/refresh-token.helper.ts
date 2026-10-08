import { createHash, timingSafeEqual } from 'node:crypto';

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function matchesRefreshToken(
  token: string,
  storedHash: string,
): boolean {
  if (!/^[0-9a-f]{64}$/.test(storedHash)) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(hashRefreshToken(token), 'hex'),
    Buffer.from(storedHash, 'hex'),
  );
}
