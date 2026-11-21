import { database } from '../../../../../lib/db.mjs';
import { orderView } from '../../../../../lib/order-view.mjs';
import { currentAdmin } from '../../../../../lib/auth.js';
import { updateSchema } from '../../../../../lib/validation.mjs';
import { canTransition } from '../../../../../lib/order-state.mjs';
import { sameOrigin } from '../../../../../lib/security.mjs';
export async function PATCH(request, { params }) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid request.' }, { status: 403 });
  try {
    if (!await currentAdmin()) return Response.json({ error: 'Sign in again.' }, { status: 401 });
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: 'Invalid order.' }, { status: 400 });
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: 'Check the status and notes.' }, { status: 400 });
    const result = await database().begin(async sql => {
      const [existing] = await sql`select status from public.lp_orders where id = ${id} for update`;
      if (!existing) return { code: 404, error: 'Order not found.' };
      if (!canTransition(existing.status, parsed.data.status)) return { code: 409, error: 'That status change is not allowed.' };
      const status = parsed.data.status;
      const [row] = await sql`update public.lp_orders set status = ${status}, admin_notes = ${parsed.data.adminNotes},
        confirmed_at = case when ${status} = 'confirmed' and confirmed_at is null then now() else confirmed_at end,
        due_at = case when ${status} = 'confirmed' and due_at is null then now() + interval '3 hours' else due_at end,
        delivered_at = case when ${status} = 'delivered' and delivered_at is null then now() else delivered_at end,
        updated_at = now() where id = ${id} returning status, created_at, confirmed_at, due_at, delivered_at`;
      return { code: 200, order: orderView(row) };
    });
    return Response.json(result.error ? { error: result.error } : result.order, { status: result.code });
  } catch { return Response.json({ error: 'Could not update the order.' }, { status: 503 }); }
}
