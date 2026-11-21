import { createHmac } from 'node:crypto';
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return origin === new URL(request.url).origin;
}
export function rateBucket(request, purpose) {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret) throw new Error('Server configuration is incomplete.');
  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  return `${purpose}:${createHmac('sha256', secret).update(address).digest('hex')}`;
}
export async function consumeRate(sql, bucket, max, seconds) {
  const [row] = await sql`insert into public.lp_rate_limits (bucket) values (${bucket})
    on conflict (bucket) do update set
      hits = case when lp_rate_limits.starts_at < now() - ${seconds} * interval '1 second' then 1 else lp_rate_limits.hits + 1 end,
      starts_at = case when lp_rate_limits.starts_at < now() - ${seconds} * interval '1 second' then now() else lp_rate_limits.starts_at end
    returning hits`;
  return row.hits <= max;
}
