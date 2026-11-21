import { formatMoroccoDate } from './date.mjs';
// The server owns operational times. Browser timezone databases can differ,
// so send the exact display strings with each initial snapshot and update.
export function orderView(order, now = Date.now()) {
  return {
    ...order,
    display_dates: Object.fromEntries(['created_at','confirmed_at','due_at','delivered_at'].map(field=>[field,formatMoroccoDate(order[field])])),
    is_overdue:Boolean(order.due_at && ['confirmed','in_progress'].includes(order.status) && new Date(order.due_at).getTime() < now)
  };
}
