import { BookOpen } from 'lucide-react';
import { getDictionary } from '../lib/i18n.mjs';
export default function Brand({ locale = 'en' }) {
  const t=getDictionary(locale);
  return <a className="brand" href={`/${locale}`} aria-label={t.home}><span className="brand-icon"><BookOpen size={23} strokeWidth={1.7}/></span><span>little hero<span className="brand-sub">{t.brandSub}</span></span></a>;
}
