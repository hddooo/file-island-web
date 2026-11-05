'use strict';
// Real API-client and request-status code, entirely synthetic HTTP responses and accounts.
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const { JSDOM } = require(process.env.JSDOM_PATH || 'jsdom');
const Api = require('../media/api-client.js');
const ROOT = path.resolve(__dirname, '..'), ID = '11111111-1111-4111-8111-111111111111', Q = '33333333-3333-4333-8333-333333333333';
const user = { id: ID, email: 'fixture@example.test', displayName: 'Synthetic user', createdAt: '2026-11-05T12:00:00Z' };
const response = (status, body) => ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) });
const tick = () => new Promise(r => setTimeout(r, 20));
let checks = 0; const eq = (a, b) => { checks++; assert.deepEqual(a, b); }, ok = a => { checks++; assert.ok(a); };
(async () => {
  const calls = [], activity = []; let gate = null;
  const api = Api.create({ base: 'https://fixture.example', storage: null, locks: null, now: () => Date.parse('2026-11-05T13:00:00Z'), fetch: async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/auth/signin')) return response(200, { accessToken: 'synthetic-not-a-secret', accessTokenExpiresAt: '2030-01-01T00:00:00Z', tokenType: 'Bearer', user });
    if (url.endsWith('/me')) return response(200, { user, premium: { active: false }, growth: { points: 1000 }, access: { total: 1, today: true } });
    if (url.endsWith('/inquiries') && gate) return gate;
    if (url.endsWith('/inquiries') || url.endsWith('/messages')) return response(201, { id: Q });
    return response(200, { items: [], total: 0 });
  } });
  await api.signin(user.email, 'synthetic-password-only');
  api.onActivity(e => activity.push(e));
  const data = { requestId: Q, title: 'Synthetic title', body: 'Synthetic body' };
  await api.portal('POST', '/api/v1/inquiries', data, { feedback: false, auth: false });
  eq(activity.some(e => e.pending && e.foreground), false);
  eq(calls.at(-1).init.headers.Authorization, 'Bearer synthetic-not-a-secret');
  eq(JSON.parse(calls.at(-1).init.body), data); eq(calls.at(-1).init.credentials, 'include');
  activity.length = 0;
  await api.portal('POST', '/api/v1/ops/inquiries/' + Q + '/messages', { requestId: Q, body: 'Synthetic reply' });
  ok(activity.some(e => e.pending && e.foreground));
  const before = calls.length; await assert.rejects(api.portal('POST', '/api/v1/me', data, { feedback: false }), e => e.code === 'invalid_path'); checks++; eq(calls.length, before);
  const guestCalls = [];
  const guest = Api.create({ base: 'https://fixture.example', storage: null, locks: null, fetch: (...args) => { guestCalls.push(args); return response(200, {}); } });
  await assert.rejects(guest.portal('POST', '/api/v1/inquiries', data, { feedback: false, auth: false }), e => e.status === 401); checks++; eq(guestCalls.length, 0);

  const w = new JSDOM('<!doctype html><body><main class="shell" id="app"><a id="open" href="/inquiries/">건의·문의</a></main></body>', { url: 'https://fixture.example/', runScripts: 'outside-only', pretendToBeVisual: true }).window;
  try {
    w.HanqApi = api;
    for (const file of ['ui-locks.js', 'request-status.js', 'inquiry-ui.js']) w.eval(fs.readFileSync(path.join(ROOT, 'media', file), 'utf8'));
    w.document.querySelector('#open').click(); await tick();
    eq(w.document.querySelectorAll('dialog input,dialog textarea').length, 2);
    w.document.querySelector('[name=title]').value = 'Real client synthetic title'; w.document.querySelector('[name=body]').value = 'Real client synthetic body';
    let release; gate = new Promise(r => { release = r; });
    const submit = () => w.document.querySelector('.hq-inquiry-form').dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true }));
    const beforeSend = calls.length; submit(); submit(); await new Promise(r => setTimeout(r, 230));
    eq(calls.length, beforeSend + 1); eq(w.document.querySelector('.request-wait').hidden, true); ok(w.document.querySelector('dialog').textContent.includes('보내는 중'));
    ok(w.document.querySelector('[name=title]').readOnly); eq(w.document.querySelector('#app').inert, true);
    const original = JSON.parse(calls.at(-1).init.body); release(response(503, { error: { code: 'unavailable' } })); await tick(); await tick();
    ok(w.document.querySelector('dialog').textContent.includes('전송 결과를 확인하지')); eq(w.document.querySelector('.request-wait').hidden, true);
    gate = null; submit(); await tick(); await tick(); eq(JSON.parse(calls.at(-1).init.body), original);
    ok(w.document.querySelector('dialog').textContent.includes('문의를 보냈어요')); ok(w.document.activeElement.textContent.includes('문의를 보냈어요'));
    w.document.querySelector('dialog').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); eq(w.document.querySelector('dialog'), null); eq(w.document.querySelector('#app').inert, false); eq(w.document.activeElement.id, 'open');
  } finally { w.close(); }
  console.log('inquiry real-client integration: ' + checks + ' checks passed (synthetic HTTP only)');
})().catch(e => { console.error(e); process.exitCode = 1; });
