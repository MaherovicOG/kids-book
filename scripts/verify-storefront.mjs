import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { database } from '../lib/db.mjs';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { getDictionary, priceLabel } from '../lib/i18n.mjs';
import { rateBucket } from '../lib/security.mjs';

if(process.argv.includes('--inspect')) {
  const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  for(const locale of ['en','fr','ar']) {
    await page.goto(`http://localhost:3001/${locale}`,{waitUntil:'networkidle'});
    console.log(locale,await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,classes:typeof e.className==='string'?e.className:'svg',left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right})).filter(e=>e.left < -1 || e.right>innerWidth+1).slice(0,18)})));
    await page.screenshot({path:`/tmp/little-hero-${locale}-mobile-before.png`});
  }
  await browser.close();process.exit(0);
}

process.stdout.write('Ready for admin password on stdin (input hidden).\n');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');
const password=await new Promise(resolve=>{
  let input='';
  function read(chunk){input+=chunk;if(/[\r\n]/.test(input)){process.stdin.off('data',read);resolve(input.split(/[\r\n]/)[0]);}}
  process.stdin.on('data',read);process.stdin.resume();
});
if(process.stdin.isTTY)process.stdin.setRawMode(false);
process.stdin.pause();
const sql=database(),email=`qa-${randomUUID()}@example.com`,ip=`qa-${randomUUID()}`;
let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000},extraHTTPHeaders:{'x-forwarded-for':ip}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push({url:page.url(),message:error.message}));
  for(const locale of ['en','fr','ar']){
    const t=getDictionary(locale);
    await page.goto(`http://localhost:3001/${locale}`,{waitUntil:'networkidle'});
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    await expect(page.locator('html')).toHaveAttribute('dir',locale==='ar'?'rtl':'ltr');
    await expect(page.getByRole('heading',{level:1})).toContainText(t.heroTitle);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,`${locale} desktop overflow`);
    await expect(page.locator('select[name="language"] option')).toHaveCount(9);
    await page.locator('select[name="language"]').selectOption('es');
    await expect(page.getByRole('heading',{level:1})).toContainText(t.heroTitle);
    await page.locator('input[name="currency"][value="USDT"]').check();
    await expect(page.locator('.price-pill')).toContainText('5 USDT');
    assert.ok(!/\$5|\bUSD\b/.test(await page.locator('body').innerText()));
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`/tmp/little-hero-${locale}-desktop.png`});
    console.log(`PASS: ${locale} website, localized form, independent Spanish book language, USDT selection.`);
  }
  await page.locator('.language-switch select').selectOption('fr');
  await expect(page).toHaveURL('http://localhost:3001/fr');
  await expect(page.locator('html')).toHaveAttribute('lang','fr');
  await page.goto('http://localhost:3001/ar',{waitUntil:'networkidle'});
  await page.locator('input[name="sex"][value="female"]').check();
  await expect(page.locator('.hero-choice')).toHaveCount(9);
  await page.locator('input[name="childName"]').fill('QA Little Hero');
  await page.locator('select[name="age"]').selectOption('7');
  await page.locator('select[name="language"]').selectOption('es');
  await page.locator('input[name="favoriteColor"]').fill('azul');
  await page.locator('input[name="favoriteAnimal"]').fill('gato');
  await page.locator('select[name="adventure"]').selectOption('snow');
  await page.locator('input[name="heroChoice"][value="wonderwoman"]').check();
  await page.locator('#child-photo').setInputFiles('public/images/adventure.jpg');
  await expect(page.getByText(getDictionary('ar').form.photoReady,{exact:true})).toBeVisible();
  await page.locator('input[name="customerName"]').fill('QA Integration Test');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="whatsapp"]').fill('+212600000000');
  await page.locator('input[name="deliveryMethod"][value="whatsapp"]').check();
  await page.locator('input[name="currency"][value="USDT"]').check();
  await page.locator('input[name="consent"]').check();
  const submitted=page.waitForResponse(response=>response.url().endsWith('/api/orders')&&response.request().method()==='POST');
  await page.locator('button[type="submit"]').click();
  const response=await submitted;
  assert.equal(response.status(),201,await response.text());
  const payload=await response.json();
  await expect(page.getByText(payload.reference,{exact:true})).toBeVisible();
  await expect(page.locator('#order-success')).toContainText('5 USDT');
  const [order]=await sql`select id,status,confirmed_at,email,superhero,sex,delivery_method,request_id,currency,language,site_language,octet_length(child_photo) as size from public.lp_orders where email=${email}`;
  assert.equal(order.status,'new');assert.equal(order.confirmed_at,null);assert.equal(order.sex,'female');assert.equal(order.superhero,'wonderwoman');assert.equal(order.delivery_method,'whatsapp');assert.ok(order.size>1000);
  assert.equal(order.currency,'USDT');assert.equal(order.language,'es');assert.equal(order.site_language,'ar');
  const duplicate=await page.request.post('http://localhost:3001/api/orders',{headers:{Origin:'http://localhost:3001','x-site-language':'ar'},multipart:{requestId:order.request_id,customerName:'QA Integration Test',email,whatsapp:'+212600000000',deliveryMethod:'whatsapp',childName:'QA Little Hero',age:'7',sex:'female',language:'es',siteLanguage:'ar',currency:'USDT',favoriteColor:'azul',favoriteAnimal:'gato',adventure:'snow',superhero:'wonderwoman',consent:'yes',website:'',photo:{name:'reference.jpg',mimeType:'image/jpeg',buffer:await readFile('public/images/adventure.jpg')}}});
  assert.equal(duplicate.status(),201);assert.equal((await duplicate.json()).reference,payload.reference);
  const [count]=await sql`select count(*)::int as total from public.lp_orders where email=${email}`;assert.equal(count.total,1);
  assert.equal((await page.request.get(`http://localhost:3001/api/admin/orders/${order.id}/photo`)).status(),401);
  const crossOrigin=await page.request.post('http://localhost:3001/api/orders',{headers:{Origin:'https://untrusted.example','x-site-language':'ar'},data:{}});
  assert.equal(crossOrigin.status(),403);assert.equal((await crossOrigin.json()).error,getDictionary('ar').errors.origin);
  console.log('PASS: Supabase saved Arabic website + Spanish book + USDT, duplicate retry protection, private photo, localized cross-origin rejection.');
  await page.goto('http://localhost:3001/admin');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByRole('textbox',{name:'Email',exact:true}).fill(process.env.ADMIN_EMAIL);
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page).toHaveURL('http://localhost:3001/admin');
  const row=page.getByRole('row').filter({hasText:payload.reference});
  await expect(row).toContainText('Español');await expect(row).toContainText('5 USDT');
  await row.getByRole('button',{name:'View order'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect.poll(()=>page.locator('.drawer-child img').evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true);
  const wa=await page.getByRole('link',{name:'Open WhatsApp'}).getAttribute('href');
  assert.ok(wa.startsWith('https://wa.me/212600000000?text='));assert.ok(decodeURIComponent(wa).includes('مرحبًا'));assert.ok(decodeURIComponent(wa).includes('5 USDT'));
  await page.getByLabel('Order status').selectOption('confirmed');
  let saved=page.waitForResponse(response=>response.request().method()==='PATCH');
  await page.getByRole('button',{name:'Save order',exact:true}).click();
  const confirmation=await(await saved).json();
  assert.equal(new Date(confirmation.due_at)-new Date(confirmation.confirmed_at),10800000);
  await expect(page.getByRole('button',{name:'Save order',exact:true})).toBeEnabled();
  saved=page.waitForResponse(response=>response.request().method()==='PATCH');
  await page.getByRole('button',{name:'Save order',exact:true}).click();
  assert.equal((await(await saved).json()).due_at,confirmation.due_at);
  await page.screenshot({path:'/tmp/little-hero-admin.png'});
  await page.getByRole('button',{name:'Close order'}).click();
  await page.getByRole('button',{name:'Sign out'}).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  assert.equal((await page.request.get(`http://localhost:3001/api/admin/orders/${order.id}/photo`)).status(),401);
  for(const locale of ['en','fr','ar']){
    await page.setViewportSize({width:390,height:844});
    await page.goto(`http://localhost:3001/${locale}`,{waitUntil:'networkidle'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,`${locale} mobile overflow`);
    await page.screenshot({path:`/tmp/little-hero-${locale}-mobile.png`});
    await page.locator('.hero-options').scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,`${locale} mobile form overflow`);
    if(locale==='ar')await page.screenshot({path:'/tmp/little-hero-ar-mobile-form.png'});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: all three desktop/mobile storefronts, Arabic RTL, language switching, expanded book languages, currency display/storage, admin login/photo protection, localized WhatsApp message, exact three-hour deadline, and logout. No browser errors.');
}finally{
  await sql`delete from public.lp_orders where email=${email} and customer_name='QA Integration Test'`;
  const req=new Request('http://localhost:3001',{headers:{'x-forwarded-for':ip}});
  await sql`delete from public.lp_rate_limits where bucket in (${rateBucket(req,'orders')},${rateBucket(req,'login')})`;
  await sql.end();if(browser)await browser.close();
}
