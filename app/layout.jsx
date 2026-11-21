import { headers } from 'next/headers';
import './globals.css';
export const metadata = { title:'Little Hero Books', description:'Personalized digital storybooks · 5 € or 5 USDT.' };
export default async function RootLayout({ children }) {
  const locale=(await headers()).get('x-site-locale') || 'en';
  return <html lang={locale} dir={locale==='ar'?'rtl':'ltr'}><body>{children}</body></html>;
}
