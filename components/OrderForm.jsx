'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, Clock3, LoaderCircle, LockKeyhole, Mail, MessageCircle, Sparkles, Upload } from 'lucide-react';
import { stories, availableHeroes, languageNames, favoriteExamples } from '../lib/catalog.mjs';
import { getDictionary, interpolate, priceLabel, heroLabel } from '../lib/i18n.mjs';

async function preparePhoto(file) {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('fileType');
  if (file.size > 10 * 1024 * 1024) throw new Error('fileLarge');
  const bitmap=await createImageBitmap(file);
  const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const context=canvas.getContext('2d');
  if (!context) {bitmap.close();throw new Error('prepare');}
  context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.88));
  canvas.width=1;canvas.height=1;
  if(!blob||blob.size>3*1024*1024)throw new Error('smallPhoto');
  return new File([blob],'child-reference.jpg',{type:'image/jpeg'});
}
export default function OrderForm({locale='en'}) {
  const dictionary=getDictionary(locale),f=dictionary.form,e=dictionary.errors;
  const [sex,setSex]=useState('male'),[hero,setHero]=useState('superman');
  const [language,setLanguage]=useState(locale),[currency,setCurrency]=useState('EUR');
  const [delivery,setDelivery]=useState('email'),[photo,setPhoto]=useState(null),[preview,setPreview]=useState('');
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[preparing,setPreparing]=useState(false),[success,setSuccess]=useState(null);
  const requestId=useRef(null),fileInput=useRef(null);
  useEffect(()=>{if(success)document.querySelector('#order-success')?.focus();},[success]);
  const choices=availableHeroes(sex),price=priceLabel(success?.currency||currency);
  const examples=favoriteExamples[language];
  function changeSex(value){setSex(value);if(!availableHeroes(value).some(item=>item.id===hero))setHero(availableHeroes(value)[0].id);}
  async function choosePhoto(event){
    const file=event.target.files?.[0];if(!file)return;
    setError('');setPreparing(true);
    try{const ready=await preparePhoto(file);if(preview)URL.revokeObjectURL(preview);setPhoto(ready);setPreview(URL.createObjectURL(ready));}
    catch(err){setError(e[err.message]||e.prepare);event.target.value='';}
    finally{setPreparing(false);}
  }
  async function submit(event){
    event.preventDefault();setError('');
    if(!photo){setError(e.photoRequired);fileInput.current?.focus();return;}
    setBusy(true);
    try{
      const body=new FormData(event.currentTarget);requestId.current||=crypto.randomUUID();
      body.set('requestId',requestId.current);body.set('photo',photo);body.set('superhero',hero);body.set('siteLanguage',locale);
      const response=await fetch('/api/orders',{method:'POST',headers:{'x-site-language':locale},body});
      const payload=await response.json();if(!response.ok)throw new Error(payload.error||e.submit);
      setSuccess(payload);if(preview)URL.revokeObjectURL(preview);
    }catch(err){setError(err.message||e.submit);}finally{setBusy(false);}
  }
  if(success)return <div className="order-card success-card" id="order-success" tabIndex={-1}><span className="success-icon"><CheckCircle2 size={42}/></span><div className="eyebrow">{f.successEyebrow}</div><h2>{f.successTitle}<br/><em>{f.successEm}</em></h2><p>{interpolate(f.successCopy,{price})}</p><div className="reference-box"><small>{f.reference}</small><strong dir="ltr">{success.reference}</strong></div><div className="success-timing"><Clock3/><p>{interpolate(f.successTiming,{delivery:(success.deliveryMethod||delivery)==='email'?f.email:'WhatsApp'})}</p></div><p className="muted">{f.successNote}</p></div>;
  return <form className="order-card" onSubmit={submit}>
    <div className="form-heading"><div><div className="eyebrow">{f.eyebrow}</div><h3>{f.title}</h3></div><span className="price-pill"><bdi>{price}</bdi> · PDF</span></div>
    <fieldset disabled={busy||preparing} className="form-fields"><div className="form-grid">
      <label className="field">{f.childName}<input name="childName" required maxLength={80} placeholder={f.namePlaceholder} dir={language==='ar'?'rtl':'ltr'}/></label>
      <label className="field">{f.age}<select aria-label={f.age} name="age" defaultValue="5">{Array.from({length:11},(_,i)=><option value={i+2} key={i}>{locale==='ar'?String(i+2).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]):i+2} {f.years}</option>)}</select></label>
      <fieldset className="field choice-field"><legend>{f.child}</legend><div className="segmented"><label><input type="radio" name="sex" value="male" checked={sex==='male'} onChange={()=>changeSex('male')}/><span>{f.boy}</span></label><label><input type="radio" name="sex" value="female" checked={sex==='female'} onChange={()=>changeSex('female')}/><span>{f.girl}</span></label></div></fieldset>
      <label className="field">{f.bookLanguage}<select aria-label={f.bookLanguage} name="language" value={language} onChange={event=>setLanguage(event.target.value)}>{Object.entries(languageNames).map(([code,label])=><option value={code} key={code} lang={code}>{label}</option>)}</select></label>
      <label className="field">{f.color}<input name="favoriteColor" required maxLength={60} placeholder={examples[0]} dir={language==='ar'?'rtl':'ltr'}/></label>
      <label className="field">{f.animal}<input name="favoriteAnimal" required maxLength={60} placeholder={examples[1]} dir={language==='ar'?'rtl':'ltr'}/></label>
      <label className="field full">{f.adventure}<select aria-label={f.adventure} name="adventure" defaultValue="snow">{stories.map(story=><option value={story.id} key={story.id}>{story.names[locale]}</option>)}</select><small>{f.storyHint}</small></label>
    </div>
    <fieldset className="hero-picker"><legend>{f.hero}</legend><div className="hero-options">{choices.map(item=><label className={`hero-choice ${hero===item.id?'selected':''}`} key={item.id}><input type="radio" name="heroChoice" value={item.id} checked={hero===item.id} onChange={()=>setHero(item.id)}/><img src={item.image} alt={`${f.hero}: ${heroLabel(item,locale)}`} loading="lazy"/><span>{heroLabel(item,locale)}</span>{hero===item.id&&<Check size={14} className="selected-tick"/>}</label>)}</div><small>{f.heroHint}</small></fieldset>
    <div className="photo-field"><label htmlFor="child-photo">{f.photo} <span>*</span></label><div className={`photo-upload ${preview?'has-photo':''}`}>{preview?<><img src={preview} alt={f.selectedPhoto}/><div><strong>{f.photoReady}</strong><p>{f.photoReadyHint}</p><button type="button" className="text-button" onClick={()=>fileInput.current?.click()}>{f.changePhoto}</button></div></>:<label htmlFor="child-photo"><Upload size={24}/><strong>{preparing?f.preparing:f.upload}</strong><span>{f.photoTypes}</span></label>}<input ref={fileInput} id="child-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} aria-label={f.uploadLabel}/></div><small>{f.photoHint}</small></div>
    <div className="form-divider"/><div className="form-heading compact"><h3>{f.contactTitle}</h3></div>
    <div className="form-grid"><label className="field full">{f.yourName}<input name="customerName" autoComplete="name" required minLength={2} maxLength={100} placeholder={f.parentPlaceholder}/></label><label className="field">{f.email}<input name="email" type="email" autoComplete="email" dir="ltr" required maxLength={254} placeholder="you@example.com"/></label><label className="field">{f.whatsapp}<input name="whatsapp" type="tel" autoComplete="tel" dir="ltr" required pattern="\+[1-9][0-9]{7,14}" maxLength={16} title={f.phoneTitle} placeholder="+212612345678"/><small>{f.phoneHint}</small></label></div>
    <fieldset className="delivery-choice"><legend>{f.currency}</legend><div className="delivery-options currency-options">{['EUR','USDT'].map(code=><label key={code}><input type="radio" name="currency" value={code} checked={currency===code} onChange={()=>setCurrency(code)}/><bdi>{priceLabel(code)}</bdi><span className="currency-code">{code}</span></label>)}</div><small>{f.currencyHint}</small></fieldset>
    <fieldset className="delivery-choice"><legend>{f.delivery}</legend><div className="delivery-options"><label><input type="radio" name="deliveryMethod" value="email" checked={delivery==='email'} onChange={()=>setDelivery('email')}/><Mail size={19}/><span>{f.email}</span></label><label><input type="radio" name="deliveryMethod" value="whatsapp" checked={delivery==='whatsapp'} onChange={()=>setDelivery('whatsapp')}/><MessageCircle size={19}/><span>WhatsApp</span></label></div></fieldset>
    <label className="field">{f.notes}<span className="optional">{f.optional}</span><textarea name="notes" maxLength={1500} rows={3} placeholder={f.notesPlaceholder}/></label>
    <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <label className="consent"><input type="checkbox" name="consent" value="yes" required/><span>{interpolate(f.consent,{price})}</span></label>
    <div className="confirmation-note"><Clock3 size={20}/><span>{f.confirmation}</span></div>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <button className="button submit-button" type="submit" disabled={busy||preparing}>{busy?<><LoaderCircle className="spin" size={20}/>{f.saving}</>:<>{interpolate(f.submit,{price})}<Sparkles size={18}/></>}</button><p className="form-footnote"><LockKeyhole size={13}/>{f.footnote}</p>
    </fieldset>
  </form>;
}
