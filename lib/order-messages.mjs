import { translate, priceLabel, siteLocales } from './i18n.mjs';
export function confirmationMessage(order, formattedDate) {
  const locale=siteLocales.includes(order.site_language)?order.site_language:'en';
  const values={name:order.customer_name,reference:order.reference,child:order.child_name,price:priceLabel(order.currency),date:formattedDate,
    delivery:order.delivery_method==='email'?translate(locale,'form.email'):'WhatsApp'};
  const confirmed=order.confirmed_at&&order.status!=='cancelled';
  return `${translate(locale,'message.greeting',values)} ${translate(locale,confirmed?'message.confirmed':'message.pending',values)}`;
}
