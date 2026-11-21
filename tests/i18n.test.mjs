import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { dictionaries, translate, priceLabel, siteLocales } from '../lib/i18n.mjs';
import { languageNames } from '../lib/catalog.mjs';
import { orderSchema } from '../lib/validation.mjs';
import { confirmationMessage } from '../lib/order-messages.mjs';
function flatten(value,path='') {
  return typeof value==='string'?{[path]:value}:Object.assign({},...Object.entries(value).map(([key,item])=>flatten(item,path?`${path}.${key}`:key)));
}
test('all three website translations cover every screen, message and placeholder',()=>{
  const source=flatten(dictionaries.en);
  for(const locale of siteLocales){
    const translated=flatten(dictionaries[locale]);
    assert.deepEqual(Object.keys(translated).sort(),Object.keys(source).sort());
    for(const [key,text] of Object.entries(translated)){
      assert.ok(text.trim(),`${locale}.${key} is empty`);
      assert.deepEqual((text.match(/\{\w+\}/g)||[]).sort(),(source[key].match(/\{\w+\}/g)||[]).sort(),`${locale}.${key} placeholders`);
      assert.ok(!text.includes('$5')&&!/\bUSD\b/.test(text),`${locale}.${key} still advertises dollars`);
    }
  }
});
test('every supported book language is accepted independently of website language and currency',()=>{
  assert.equal(Object.keys(languageNames).length,9);
  for(const language of Object.keys(languageNames))for(const siteLanguage of siteLocales)for(const currency of ['EUR','USDT']){
    const input={requestId:randomUUID(),customerName:'Parent',email:'parent@example.com',whatsapp:'+212612345678',deliveryMethod:'email',childName:'Lina',age:6,sex:'female',favoriteColor:'azul',favoriteAnimal:'gato',adventure:'snow',superhero:'supergirl',consent:'yes',language,siteLanguage,currency};
    const order=orderSchema.parse(input);
    assert.equal(order.language,language);assert.equal(order.siteLanguage,siteLanguage);assert.equal(order.currency,currency);
    assert.equal(orderSchema.safeParse({...input,currency:'USD'}).success,false);
    assert.equal(orderSchema.safeParse({...input,language:'unknown'}).success,false);
  }
});
test('confirmation messages use the saved currency and the customer website language',()=>{
  for(const site_language of siteLocales)for(const currency of ['EUR','USDT']){
    const order={site_language,currency,customer_name:'Parent',child_name:'Lina',reference:'LHB-EXAMPLE',status:'new',confirmed_at:null,delivery_method:'email'};
    const message=confirmationMessage(order,'21/11/2026 · 16:00');
    assert.ok(message.includes(priceLabel(currency)));assert.ok(!message.includes('$5'));
    assert.ok(message.includes('LHB-EXAMPLE'));
    const confirmed=confirmationMessage({...order,status:'confirmed',confirmed_at:'2026-11-21T12:00:00Z'},'21/11/2026 · 16:00');
    assert.ok(confirmed.includes('21/11/2026 · 16:00'));
    assert.ok(confirmed.includes(translate(site_language,'form.email')));
  }
  assert.equal(priceLabel('USD'),'$5 (legacy)');
});
