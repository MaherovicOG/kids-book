import { redirect } from 'next/navigation';
import { currentAdmin } from '../../lib/auth';
import { database } from '../../lib/db.mjs';
import { orderView } from '../../lib/order-view.mjs';
import AdminDashboard from '../../components/AdminDashboard';
export const metadata = { title:'Orders — Little Hero Books', robots:{index:false,follow:false} };
export const dynamic = 'force-dynamic';
export default async function Admin() {
  let email;
  try { email = await currentAdmin(); }
  catch { return <main className="login-shell"><div className="login-card"><h1>Connection unavailable</h1><p>We could not connect to the order database. Please refresh in a moment.</p><a href="/admin" className="button">Try again</a></div></main>; }
  if (!email) redirect('/admin/login');
  const sql = database();
  try {
    const rows = await sql`select id, reference, customer_name, email, whatsapp, delivery_method, child_name, age, sex, language, site_language, currency,
      favorite_color, favorite_animal, adventure, superhero, customer_notes, admin_notes, status, created_at, confirmed_at, due_at, delivered_at
      from public.lp_orders order by created_at desc limit 500`;
    const [counts] = await sql`select count(*)::integer as total, count(*) filter (where status = 'new')::integer as pending,
      count(*) filter (where status in ('confirmed','in_progress'))::integer as active,
      count(*) filter (where status = 'delivered')::integer as delivered from public.lp_orders`;
    return <AdminDashboard email={email} initialOrders={JSON.parse(JSON.stringify(rows.map(row=>orderView(row))))} counts={counts}/>;
  } catch { return <main className="login-shell"><div className="login-card"><h1>Orders unavailable</h1><p>The order list could not be loaded. Please refresh in a moment.</p><a href="/admin" className="button">Try again</a></div></main>; }
}
