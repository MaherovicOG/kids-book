import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hashPassword, verifyPassword, tokenHash } from '../lib/password.mjs';
import { orderSchema, imageMime } from '../lib/validation.mjs';
import { canTransition, deliveryDeadline } from '../lib/order-state.mjs';
import { sameOrigin } from '../lib/security.mjs';
import { stories, availableHeroes } from '../lib/catalog.mjs';
const sample = () => ({ requestId:randomUUID(), customerName:'Parent Name', email:'Parent@example.com', whatsapp:'+212612345678', deliveryMethod:'email', childName:'Lina', age:'6', sex:'female', language:'fr', siteLanguage:'en', currency:'EUR', favoriteColor:'violet', favoriteAnimal:'chat', adventure:'snow', superhero:'supergirl', notes:'', consent:'yes', website:'' });
test('password hashes are salted, verifiable, and never store plaintext',()=>{
  const one=hashPassword('a-secret-password');const two=hashPassword('a-secret-password');
  assert.notEqual(one,two);assert.ok(!one.includes('a-secret-password'));
  assert.equal(verifyPassword('a-secret-password',one),true);assert.equal(verifyPassword('wrong',one),false);
  assert.equal(verifyPassword('wrong','malformed'),false);assert.equal(tokenHash('token').length,64);
});
test('orders validate contacts, ages, consent, catalog choices, and matching hero',()=>{
  assert.equal(orderSchema.parse(sample()).email,'parent@example.com');
  for(const change of [{whatsapp:'0612345678'},{email:'invalid'},{age:1},{age:13},{consent:'no'},{superhero:'batman'},{adventure:'invented'},{website:'spam'},{currency:'USD'},{language:'made-up'},{siteLanguage:'es'}]) assert.equal(orderSchema.safeParse({...sample(),...change}).success,false);
  assert.equal(stories.length,16);assert.ok(availableHeroes('female').every(hero=>hero.sex!=='male'));
});
test('photo type is verified from content, with no SVG or HTML uploads',()=>{
  assert.equal(imageMime(Buffer.from([255,216,255,0])),'image/jpeg');
  assert.equal(imageMime(Buffer.from([137,80,78,71,13,10,26,10])),'image/png');
  assert.equal(imageMime(Buffer.from('<svg onload="evil()">')),null);
  assert.equal(imageMime(Buffer.from('<html>')),null);
});
test('confirmation is required before delivery and the deadline is exactly three hours',()=>{
  assert.equal(canTransition('new','delivered'),false);assert.equal(canTransition('new','confirmed'),true);
  assert.equal(canTransition('confirmed','in_progress'),true);assert.equal(canTransition('in_progress','delivered'),true);
  assert.equal(canTransition('delivered','new'),false);assert.equal(canTransition('cancelled','confirmed'),false);
  assert.equal(deliveryDeadline('2026-11-21T12:00:00Z').toISOString(),'2026-11-21T15:00:00.000Z');
});
test('cross-origin writes are rejected',()=>{
  assert.equal(sameOrigin(new Request('https://books.example/api/orders',{headers:{origin:'https://books.example'}})),true);
  assert.equal(sameOrigin(new Request('https://books.example/api/orders',{headers:{origin:'https://evil.example'}})),false);
  assert.equal(sameOrigin(new Request('https://books.example/api/orders')),false);
});

import { formatMoroccoDate } from '../lib/date.mjs';
test('operational dates use deterministic Morocco formatting',()=>{
 assert.equal(formatMoroccoDate('2026-11-21T12:00:00Z'), '21/11/2026 · 13:00');
 assert.equal(formatMoroccoDate(null), 'Not yet');
});

import { orderView } from '../lib/order-view.mjs';
test('admin snapshots carry server-owned display times and overdue state',()=>{
 const view=orderView({status:'confirmed',created_at:'2026-11-21T12:00:00Z',confirmed_at:'2026-11-21T12:00:00Z',due_at:'2026-11-21T15:00:00Z'},Date.parse('2026-11-21T16:00:00Z'));
 assert.equal(view.display_dates.created_at,'21/11/2026 · 13:00');
 assert.equal(view.display_dates.due_at,'21/11/2026 · 16:00');
 assert.equal(view.is_overdue,true);
 assert.equal(orderView({...view,status:'delivered'}).is_overdue,false);
});
