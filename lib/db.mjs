import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import path from 'node:path';
let client;
export function database() {
  if (!process.env.DATABASE_URL) throw new Error('Database is not configured.');
  client ||= postgres(process.env.DATABASE_URL, {
    ssl: { rejectUnauthorized: true, ca: readFileSync(path.join(process.cwd(), 'lib/supabase-ca.crt'), 'utf8') }, max: 2, idle_timeout: 20, connect_timeout: 12,
    prepare: false, onnotice: () => {}
  });
  return client;
}
