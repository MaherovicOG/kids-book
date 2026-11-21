import { readFile } from 'node:fs/promises';
import { database } from '../lib/db.mjs';
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH) throw new Error('Set the admin email and password hash first.');
const sql = database();
try {
  await sql.unsafe(await readFile(new URL('../lib/schema.sql', import.meta.url), 'utf8'));
  await sql`insert into public.lp_admins (email, password_hash)
    values (${process.env.ADMIN_EMAIL.toLowerCase()}, ${process.env.ADMIN_PASSWORD_HASH})
    on conflict (email) do update set password_hash = excluded.password_hash`;
  console.log('Supabase schema initialized; admin account configured.');
} catch (error) {
  console.error(`Database setup failed (${error.code || error.name}). ${error.message.replace(/postgres(?:ql)?:\/\/\S+/g, '[connection redacted]')}`);
  process.exitCode = 1;
} finally { await sql.end(); }
