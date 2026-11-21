import { randomUUID } from 'node:crypto';
import { siteLocales, translate, priceLabel } from '../../../lib/i18n.mjs';
import { database } from '../../../lib/db.mjs';
import { orderSchema, imageMime } from '../../../lib/validation.mjs';
import { sameOrigin, rateBucket, consumeRate } from '../../../lib/security.mjs';
export const runtime = 'nodejs';
export async function POST(request) {
  const requestedLocale=request.headers.get('x-site-language');
  const locale=siteLocales.includes(requestedLocale)?requestedLocale:'en';
  const error=key=>translate(locale,`errors.${key}`);
  if (!sameOrigin(request)) return Response.json({ error: error('origin') }, { status: 403 });
  if (Number(request.headers.get('content-length') || 0) > 4100000) return Response.json({ error: error('smallPhoto') }, { status: 413 });
  try {
    const sql = database();
    if (!await consumeRate(sql, rateBucket(request, 'orders'), 8, 3600)) return Response.json({ error: error('rate') }, { status: 429 });
    const form = await request.formData();
    const parsed = orderSchema.safeParse(Object.fromEntries([...form.entries()].filter(([key]) => key !== 'photo')));
    if (!parsed.success) return Response.json({ error: error('details') }, { status: 400 });
    const photo = form.get('photo');
    if (!(photo instanceof File) || !photo.size || photo.size > 3 * 1024 * 1024) return Response.json({ error: error('serverPhoto') }, { status: 400 });
    const bytes = Buffer.from(await photo.arrayBuffer());
    const mime = imageMime(bytes);
    if (!mime) return Response.json({ error: error('fileType') }, { status: 400 });
    const v = parsed.data;
    const reference = `LHB-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
    const [order] = await sql`insert into public.lp_orders
      (request_id, reference, customer_name, email, whatsapp, delivery_method, child_name, age, sex, language, site_language, currency, favorite_color, favorite_animal, adventure, superhero, child_photo, photo_mime, customer_notes)
      values (${v.requestId}, ${reference}, ${v.customerName}, ${v.email}, ${v.whatsapp}, ${v.deliveryMethod}, ${v.childName}, ${v.age}, ${v.sex}, ${v.language}, ${v.siteLanguage}, ${v.currency}, ${v.favoriteColor}, ${v.favoriteAnimal}, ${v.adventure}, ${v.superhero}, ${bytes}, ${mime}, ${v.notes})
      on conflict (request_id) do update set request_id = excluded.request_id returning reference, currency, delivery_method, language`;
    return Response.json({ reference: order.reference, currency:order.currency, deliveryMethod:order.delivery_method, bookLanguage:order.language,
      message:translate(locale,'form.successCopy',{price:priceLabel(order.currency)}) }, { status:201 });
  } catch {
    return Response.json({ error: error('unavailable') }, { status: 503 });
  }
}
