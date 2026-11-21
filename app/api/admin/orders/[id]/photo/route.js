import { currentAdmin } from '../../../../../../lib/auth.js';
import { database } from '../../../../../../lib/db.mjs';
export async function GET(request, { params }) {
  try {
    if (!await currentAdmin()) return new Response('Unauthorized', { status: 401 });
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('Not found', { status: 404 });
    const [order] = await database()`select child_photo, photo_mime from public.lp_orders where id = ${id}`;
    if (!order) return new Response('Not found', { status: 404 });
    return new Response(order.child_photo, { headers: { 'Content-Type': order.photo_mime, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new Response('Unavailable', { status: 503 }); }
}
