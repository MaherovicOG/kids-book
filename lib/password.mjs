import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password, encoded) {
  try {
    const [algorithm, salt, hash] = encoded.split(':');
    if (algorithm !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(hash)) return false;
    return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'));
  } catch { return false; }
}
export function tokenHash(token) { return createHash('sha256').update(token).digest('hex'); }
