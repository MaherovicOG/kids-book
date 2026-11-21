'use client';
import { Globe2 } from 'lucide-react';
import { localeNames } from '../lib/i18n.mjs';
export default function LanguageSwitch({ locale, label }) {
  return <div className="language-switch"><Globe2 size={16}/><select aria-label={label} value={locale} onChange={event=>window.location.assign(`/${event.target.value}${window.location.hash}`)}>{Object.entries(localeNames).map(([code,name])=><option key={code} value={code} lang={code}>{name}</option>)}</select></div>;
}
