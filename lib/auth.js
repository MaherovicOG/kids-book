import 'server-only';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { database } from './db.mjs';
import { tokenHash } from './password.mjs';
export const COOKIE_NAME = 'little_pages_admin';
export async function currentAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const [session] = await database()`select admin_email from public.lp_sessions where token_hash = ${tokenHash(token)} and expires_at > now()`;
  return session?.admin_email || null;
}
export async function createSession(email) {
  const token = randomBytes(32).toString('hex');
  await database()`delete from public.lp_sessions where expires_at < now()`;
  await database()`insert into public.lp_sessions (token_hash, admin_email, expires_at) values (${tokenHash(token)}, ${email}, now() + interval '12 hours')`;
  return token;
}
export function sessionCookie(token, maxAge = 43200) {
  return { name: COOKIE_NAME, value: token, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge };
}
