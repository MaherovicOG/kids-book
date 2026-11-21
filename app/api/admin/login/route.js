import { NextResponse } from 'next/server';
import { database } from '../../../../lib/db.mjs';
import { verifyPassword } from '../../../../lib/password.mjs';
import { createSession, sessionCookie } from '../../../../lib/auth.js';
import { sameOrigin, rateBucket, consumeRate } from '../../../../lib/security.mjs';
export const runtime = 'nodejs';
export async function POST(request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid request.' }, { status: 403 });
  try {
    const sql = database();
    if (!await consumeRate(sql, rateBucket(request, 'login'), 10, 900)) return Response.json({ error: 'Too many login attempts. Please try again in 15 minutes.' }, { status: 429 });
    const { email, password } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string' || password.length > 200 || email.length > 254) return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
    const [admin] = await sql`select email, password_hash from public.lp_admins where email = ${email.trim().toLowerCase()}`;
    const valid = verifyPassword(password, admin?.password_hash || process.env.ADMIN_PASSWORD_HASH || '');
    if (!admin || !valid) return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
    const token = await createSession(admin.email);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookie(token));
    return response;
  } catch { return Response.json({ error: 'Login is temporarily unavailable.' }, { status: 503 }); }
}
