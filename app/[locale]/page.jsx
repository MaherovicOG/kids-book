import { notFound } from 'next/navigation';
import Storefront from '../../components/Storefront';
import { getDictionary, siteLocales } from '../../lib/i18n.mjs';
export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!siteLocales.includes(locale)) return {};
  const t=getDictionary(locale);
  return { title:t.metaTitle, description:t.metaDescription, alternates:{languages:{en:'/en',fr:'/fr',ar:'/ar'}} };
}
export default async function LocalizedHome({ params }) {
  const { locale } = await params;
  if (!siteLocales.includes(locale)) notFound();
  return <Storefront locale={locale}/>;
}
