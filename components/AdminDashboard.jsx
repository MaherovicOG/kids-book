'use client';
import { useState } from 'react';
import { CheckCircle2, Clock3, Download, FileDown, LogOut, Mail, MessageCircle, RefreshCw, Search, X } from 'lucide-react';
import Brand from './Brand';
import { stories, heroes, languageNames } from '../lib/catalog.mjs';
import { statusNames, canTransition } from '../lib/order-state.mjs';
import { priceLabel, localeNames } from '../lib/i18n.mjs';
import { confirmationMessage } from '../lib/order-messages.mjs';
const date = (order, field) => order.display_dates?.[field] || 'Not yet';

export default function AdminDashboard({ email, initialOrders, counts }) {
  const [orders,setOrders] = useState(initialOrders);
  const [totals,setTotals] = useState(counts);
  const [filter,setFilter] = useState('all');
  const [query,setQuery] = useState('');
  const [selected,setSelected] = useState(null);
  const [notes,setNotes] = useState('');
  const [status,setStatus] = useState('new');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const visible = orders.filter(order => (filter==='all'||order.status===filter) && `${order.reference} ${order.customer_name} ${order.child_name} ${order.email} ${order.whatsapp}`.toLowerCase().includes(query.toLowerCase()));
  function open(order) { setSelected(order); setNotes(order.admin_notes); setStatus(order.status); setError(''); }
  async function save() {
    setBusy(true);setError('');
    try {
      const response = await fetch(`/api/admin/orders/${selected.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status,adminNotes:notes}) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      const updated = {...selected,...payload,admin_notes:notes};
      const group = value => value === 'new' ? 'pending' : ['confirmed','in_progress'].includes(value) ? 'active' : value === 'delivered' ? 'delivered' : null;
      setTotals(values => {
        const next = {...values};
        const before = group(selected.status), after = group(updated.status);
        if (before) next[before]--;
        if (after) next[after]++;
        return next;
      });
      setOrders(values=>values.map(order=>order.id===selected.id?updated:order));setSelected(updated);
    } catch(err) {setError(err.message || 'Could not update.');}
    finally {setBusy(false);}
  }
  async function logout() {
    const response = await fetch('/api/admin/logout',{method:'POST'});
    if (response.ok) window.location.assign('/admin/login');
    else setError('Could not sign out. Please try again.');
  }

  return <div className="admin-shell"><header className="admin-header"><Brand/><div><span>{email}</span><button className="button button-outline button-small" onClick={logout}><LogOut size={16}/> Sign out</button></div></header><main className="admin-main"><div className="admin-title"><div><div className="eyebrow">YOUR WORKSPACE</div><h1>A little order.<br/>A big adventure.</h1><p>Confirm each request on WhatsApp, prepare the PDF, and deliver it through the customer’s chosen channel.</p></div><button className="button button-outline" onClick={()=>window.location.reload()}><RefreshCw size={16}/> Refresh orders</button></div>
    <div className="stat-grid">{[['All orders',totals.total],['Awaiting confirmation',totals.pending],['In production',totals.active],['Delivered',totals.delivered]].map(([label,value])=><div className="stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className="admin-filter"><div className="search-box"><Search size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search name, email, or order reference" aria-label="Search orders"/></div><select value={filter} onChange={event=>setFilter(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option>{Object.entries(statusNames).map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></div>
    {error&&!selected&&<p className="form-error" role="alert">{error}</p>}
    <div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>Order</th><th>Child</th><th>Customer</th><th>Price</th><th>Delivery</th><th>Status</th><th>Due · Morocco time</th><th/></tr></thead><tbody>{visible.map(order=><tr key={order.id}><td><strong>{order.reference}</strong><small>{date(order,'created_at')}</small></td><td><strong>{order.child_name}</strong><small>{order.age} years · {languageNames[order.language]}</small></td><td>{order.customer_name}<small>{order.whatsapp}</small></td><td><bdi>{priceLabel(order.currency)}</bdi></td><td>{order.delivery_method==='email'?<Mail size={17}/>:<MessageCircle size={17}/>} {order.delivery_method}</td><td><span className={`status-badge ${order.status}`}>{statusNames[order.status]}</span></td><td className={order.is_overdue?'overdue':''}>{order.due_at?date(order,'due_at'):'After confirmation'}</td><td><button className="button button-small button-outline" onClick={()=>open(order)}>View order</button></td></tr>)}</tbody></table>{!visible.length&&<div className="empty-orders"><FileDown size={32}/><h3>{orders.length?'No matching orders':'Your first little adventure is on its way'}</h3><p>{orders.length?'Try another search or status.':'Customer requests will appear here after they submit the form.'}</p></div>}</div><p className="admin-note">Showing the latest {orders.length} orders (up to 500). Delivery is manual: confirm the order, send the finished PDF via the selected channel, then mark it delivered. Dates use Morocco time.</p>
    </main>{selected&&<div className="drawer-overlay" onClick={event=>{if(event.target===event.currentTarget&&!busy)setSelected(null)}}><section className="order-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><div className="drawer-heading"><div><div className="eyebrow">ORDER DETAILS · {priceLabel(selected.currency)}</div><h2 id="drawer-title">{selected.reference}</h2></div><button className="icon-button" onClick={()=>setSelected(null)} disabled={busy} aria-label="Close order"><X/></button></div><div className="drawer-child"><img src={`/api/admin/orders/${selected.id}/photo`} alt={`${selected.child_name} private reference photo`}/><div><h3>{selected.child_name}</h3><p>{selected.age} years · {selected.sex==='female'?'Girl':'Boy'} · {languageNames[selected.language]}</p><a href={`/api/admin/orders/${selected.id}/photo`} download={`${selected.reference}-photo.jpg`}><Download size={15}/> Download reference</a></div></div><dl className="order-details"><dt>Price / currency</dt><dd>{priceLabel(selected.currency)}</dd><dt>Website language</dt><dd>{localeNames[selected.site_language] || 'English'}</dd><dt>Book language</dt><dd>{languageNames[selected.language]}</dd><dt>Story</dt><dd>{stories.find(s=>s.id===selected.adventure)?.names.en||selected.adventure}</dd><dt>Superhero</dt><dd>{heroes.find(h=>h.id===selected.superhero)?.name||selected.superhero}</dd><dt>Favorite color</dt><dd>{selected.favorite_color}</dd><dt>Favorite animal</dt><dd>{selected.favorite_animal}</dd><dt>Customer</dt><dd>{selected.customer_name}</dd><dt>Email</dt><dd>{selected.email}</dd><dt>WhatsApp</dt><dd>{selected.whatsapp}</dd><dt>Deliver by</dt><dd>{selected.delivery_method}</dd><dt>Requested</dt><dd>{date(selected,'created_at')}</dd><dt>Confirmed</dt><dd>{date(selected,'confirmed_at')}</dd><dt>Delivery deadline</dt><dd>{date(selected,'due_at')}</dd></dl>{selected.customer_notes&&<div className="customer-note"><strong>Customer’s notes</strong><p>{selected.customer_notes}</p></div>}
    <div className="contact-actions"><a className="button whatsapp-button" href={`https://wa.me/${selected.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(confirmationMessage(selected, date(selected,'due_at')))}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={17}/> Open WhatsApp</a><a className="button button-outline" href={`mailto:${selected.email}?subject=${encodeURIComponent(`Your Little Hero Books order ${selected.reference}`)}`}><Mail size={17}/> Open email</a></div><p className="muted">These buttons open your messaging app; nothing is sent automatically. Attach the finished PDF yourself.</p><div className="form-divider"/><label className="field">Order status<select value={status} onChange={event=>setStatus(event.target.value)}>{Object.entries(statusNames).filter(([id])=>canTransition(selected.status,id)).map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label><label className="field">Private admin notes<textarea value={notes} onChange={event=>setNotes(event.target.value)} rows={4} maxLength={4000}/></label><div className="confirmation-note"><Clock3 size={20}/><span>Saving “Confirmed” starts the 3-hour delivery deadline. Confirm only after agreeing the details with the customer.</span></div>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button submit-button" onClick={save} disabled={busy}>{busy?'Saving…':'Save order'}</button></section></div>}</div>;
}
