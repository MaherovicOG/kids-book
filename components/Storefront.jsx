import Image from 'next/image';
import { Sparkles, BookOpen, Clock3, Mail, Heart, Globe2, Check, Camera, MessageCircle, FileDown, ShieldCheck, Star } from 'lucide-react';
import Brand from './Brand';
import OrderForm from './OrderForm';
import LanguageSwitch from './LanguageSwitch';
import { getDictionary } from '../lib/i18n.mjs';
export default function Storefront({ locale }) {
  const t=getDictionary(locale);
  const benefitIcons=[Camera,BookOpen,Globe2,Mail];
  const stepIcons=[Camera,MessageCircle,FileDown];
  const galleryImages=['garden','costume','lantern'];
  return <>
    <div className="announcement">{t.announcement} <span>{t.announcementDetail}</span></div>
    <header className="site-header container"><Brand locale={locale}/><nav aria-label={t.nav}><a href="#inside">{t.book}</a><a href="#how">{t.how}</a><a href="#faq">{t.questions}</a></nav><LanguageSwitch locale={locale} label={t.siteLanguage}/><a className="button button-small" href="#order">{t.create}<Sparkles size={16}/></a></header>
    <main>
      <section className="hero container">
        <div className="hero-copy"><div className="eyebrow"><span className="tiny-star">✦</span>{t.heroEyebrow}</div><h1>{t.heroTitle}<br/>{t.heroPrefix}<em>{t.heroEm}</em></h1><p className="hero-description">{t.heroDescription}</p>
          <div className="hero-actions"><a className="button" href="#order">{t.makeStory}<Sparkles size={18}/></a><div className="hero-price"><strong><bdi>5 €</bdi></strong><span>{t.alternativeCurrency}<br/>{t.noSubscription}</span></div></div>
          <div className="hero-checks"><span><Check size={15}/>{t.languageChoice}</span><span><Check size={15}/>{t.ages}</span></div><div className="hero-note"><Clock3 size={17}/><span>{t.deliveryShort}</span></div>
        </div>
        <div className="hero-art"><span className="orbit orbit-one"/><span className="orbit orbit-two"/><Star className="art-star" size={30}/><span className="art-spark">✳</span><div className="floating-label"><Heart size={17} fill="currentColor"/>{t.madeFor}</div><div className="book-scene"><div className="book-pages"/><div className="book-cover"><Image src="/images/hero.jpg" alt={t.alts.hero} width={1024} height={1024} priority/><div className="book-spine"/></div></div><div className="sample-peek"><Image src="/images/adventure.jpg" alt={t.alts.adventure} width={1024} height={1024}/></div><div className="pdf-badge"><span><FileDown size={22}/></span><div><strong>{t.pdfTitle}</strong><small>{t.pdfSubtitle}</small></div></div><p className="mockup-caption">{t.previewCaption}</p></div>
      </section>
      <div className="benefits"><div className="container benefits-inner">{t.benefits.map((text,i)=>{const Icon=benefitIcons[i];return <span key={i}><Icon/>{text}</span>;})}</div></div>
      <section className="inside-section container" id="inside"><div className="section-heading"><div><div className="eyebrow">{t.insideEyebrow}</div><h2>{t.insideTitle}<br/><em>{t.insideEm}</em></h2></div><p>{t.insideDescription}</p></div><div className="gallery">{galleryImages.map((name,i)=><article className="gallery-card" key={name}><div className="gallery-image"><Image src={`/images/${name}.jpg`} alt={t.alts[name]} width={1024} height={1024}/><span>{t.galleryTags[i]}</span></div><h3>{t.galleryTitles[i]}</h3><p>{t.galleryCopy[i]}</p></article>)}</div><div className="digital-note"><FileDown size={24}/><p>{t.digitalNote}</p></div></section>
      <section className="how-section" id="how"><div className="container"><div className="center-heading"><div className="eyebrow">{t.howEyebrow}</div><h2>{t.howTitle}<em>{t.howEm}</em></h2></div><div className="steps-grid">{t.stepsTitles.map((title,i)=>{const Icon=stepIcons[i];return <article key={i}><span className={`step-icon ${['peach','lavender','green'][i]}`}><Icon/></span><h3>{title}</h3><p>{t.stepsCopy[i]}</p></article>;})}</div></div></section>
      <section className="order-section container" id="order"><div className="order-aside"><div className="eyebrow">{t.orderEyebrow}</div><h2>{t.orderTitle}<br/><em>{t.orderEm}</em></h2><p>{t.orderCopy}</p><div className="order-preview"><Image src="/images/friends.jpg" alt={t.alts.friends} width={1024} height={1024}/><span><Heart size={16}/>{t.worthKeeping}</span></div><div className="included"><h3>{t.includedTitle}</h3>{t.included.map(text=><p key={text}><Check/>{text}</p>)}</div><div className="order-price"><span>{t.oneTime}</span><strong>{t.priceOptions}</strong><p>{t.digitalOnly}</p></div><div className="privacy-note"><ShieldCheck size={19}/><span>{t.privatePhoto}</span></div></div><OrderForm locale={locale}/></section>
      <section className="faq-section container" id="faq"><div><div className="eyebrow">{t.faqEyebrow}</div><h2>{t.faqTitle}<br/><em>{t.faqEm}</em></h2></div><div className="faq-items">{t.faq.map(([question,answer])=><details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>
    </main>
    <footer className="site-footer container"><Brand locale={locale}/><p>{t.footer}</p><div><span>© {new Date().getUTCFullYear()} Little Hero Books</span><a href="/admin">{t.admin}</a></div></footer>
  </>;
}
