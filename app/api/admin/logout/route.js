import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, sessionCookie } from '../../../../lib/auth.js';
import { tokenHash } from '../../../../lib/password.mjs';
import { database } from '../../../../lib/db.mjs';
import { sameOrigin } from '../../../../lib/security.mjs';
export async function POST(request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid request.' }, { status: 403 });
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  try { if (token) await database()`delete from public.lp_sessions where token_hash = ${tokenHash(token)}`; }
  catch { return Response.json({ error: 'Could not sign out. Please try again.' }, { status: 503 }); }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie('', 0));
  return response;
}
