'use strict';
// Standalone route, session and lifecycle tests. Synthetic accounts and transport only.
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const { JSDOM } = require(process.env.JSDOM_PATH || 'jsdom');
const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'inquiries/index.html'), 'utf8');
const code = fs.readFileSync(path.join(ROOT, 'media/inquiry-ui.js'), 'utf8');
const ID = '11111111-1111-4111-8111-111111111111', OTHER = '22222222-2222-4222-8222-222222222222', Q = '33333333-3333-4333-8333-333333333333';
const tick = async () => { for (let i = 0; i < 8; i++) await new Promise(r => setTimeout(r, 0)); };
let checks = 0; const eq = (a, b) => { checks++; assert.deepEqual(a, b); }, ok = a => { checks++; assert.ok(a); };
function env(options = {}) {
  const w = new JSDOM(html, { url: 'https://hanq.test/inquiries/', runScripts: 'outside-only', pretendToBeVisual: true }).window;
  const state = { signedIn: true, ownerId: ID, user: { id: ID }, epoch: 1, ...options.state }, listeners = [], calls = [], sessionCalls = [];
  const api = { state: () => ({ ...state }), onChange: f => listeners.push(f), ensureSession: async force => { sessionCalls.push(force); if (options.ensure) return options.ensure(); }, portal: async (m, p, b, opts) => { calls.push({ m, p, b: { ...b }, opts }); return options.handler ? options.handler(m, p, b) : { id: Q }; } };
  w.HanqApi = api; w.eval(code);
  return { w, api, calls, sessionCalls, state, change: value => { Object.assign(state, value); listeners.forEach(f => f()); }, close: () => w.close() };
}
const host = x => x.w.document.querySelector('#hq-inquiry-page-host');
function fill(x, name, value) { const n = x.w.document.querySelector('[name=' + name + ']'); n.value = value; n.dispatchEvent(new x.w.Event('input')); }
function send(x) { x.w.document.querySelector('form').dispatchEvent(new x.w.Event('submit', { cancelable: true, bubbles: true })); }
function lifecycle(x, name, persisted) { const event = new x.w.Event(name); Object.defineProperty(event, 'persisted', { value: persisted }); x.w.dispatchEvent(event); }
(async () => {
  let x = env(); await tick();
  eq(x.w.location.pathname, '/inquiries/'); eq(x.w.document.querySelector('dialog'), null); eq(x.w.document.querySelector('meta[http-equiv=refresh]'), null);
  eq(x.w.document.querySelector('meta[name=hanq-api-base]').content, 'same-origin');
  eq(x.w.document.querySelectorAll('.hq-inquiry-intro p').length, 3); ok(x.w.document.querySelector('.hq-inquiry-intro').textContent.includes('7일 이내에 가입한 이메일로 답변'));
  eq(x.w.document.querySelectorAll('input,textarea').length, 2); eq(x.w.document.querySelector('[name=title]').maxLength, 120); eq(x.w.document.querySelector('[name=body]').maxLength, 4000);
  eq(x.w.document.querySelector('button[type=submit]').textContent, '보내기'); eq(x.w.document.querySelector('#app').hasAttribute('inert'), false); eq(x.calls.length, 0);
  eq(x.w.document.querySelector('nav a').getAttribute('href'), '/'); eq(x.w.document.querySelectorAll('nav a')[1].getAttribute('href'), '/#account/main');
  const scripts = [...x.w.document.scripts].map(n => new URL(n.src).pathname); eq(scripts, ['/media/api-client.js', '/media/inquiry-ui.js']);
  fill(x, 'title', 'draft'); fill(x, 'body', 'body'); x.change({ profileStatus: 'ready' }); eq(x.w.document.querySelector('[name=title]').value, 'draft');
  x.w.dispatchEvent(new x.w.HashChangeEvent('hashchange')); ok(host(x).querySelector('form'));
  fill(x, 'title', '  '); send(x); await tick(); eq(x.calls.length, 0);
  fill(x, 'title', ' 제목 '); fill(x, 'body', ' 내용 '); send(x); send(x); await tick(); eq(x.calls.length, 1); eq(x.calls[0].b.title, '제목'); eq(x.calls[0].b.body, '내용'); eq(x.calls[0].opts.feedback, false);
  ok(host(x).textContent.includes('문의를 보냈어요')); ok(host(x).textContent.includes('7일 이내에 가입한 이메일')); eq(host(x).querySelector('a').getAttribute('href'), '/#account/main');
  host(x).querySelector('button').click(); eq(x.w.document.querySelector('[name=title]').value, ''); x.close();

  let resolve; x = env({ handler: () => new Promise(r => { resolve = r; }) }); await tick(); fill(x, 'title', 'old owner'); fill(x, 'body', 'private body'); send(x); send(x); await tick(); eq(x.calls.length, 1);
  x.change({ ownerId: OTHER, user: { id: OTHER }, epoch: 2 }); ok(host(x)); eq(host(x).querySelector('[name=title]').value, ''); eq(host(x).querySelector('[name=body]').value, '');
  resolve({ id: Q }); await tick(); ok(!host(x).textContent.includes('문의를 보냈어요')); x.change({ signedIn: false, ownerId: null, user: null, epoch: 3 }); ok(host(x)); eq(host(x).querySelector('textarea'), null); eq(host(x).querySelector('a').getAttribute('href'), '/#account/main');
  x.change({ signedIn: true, ownerId: ID, user: { id: ID }, epoch: 4 }); ok(host(x).querySelector('form')); eq(host(x).querySelector('[name=title]').value, ''); x.close();

  let fail = true; x = env({ handler: () => { if (fail) throw { status: 503 }; return { id: Q }; } }); await tick(); fill(x, 'title', 'preserve'); fill(x, 'body', 'same payload'); send(x); await tick(); const payload = x.calls[0].b;
  ok(host(x).querySelector('input').readOnly); lifecycle(x, 'pagehide', true); eq(host(x).textContent, ''); lifecycle(x, 'pageshow', true); await tick(); eq(x.sessionCalls.at(-1), true); eq(host(x).querySelector('[name=title]').value, 'preserve'); ok(host(x).querySelector('input').readOnly);
  fail = false; send(x); await tick(); eq(x.calls[1].b, payload); ok(host(x).textContent.includes('문의를 보냈어요')); x.close();

  x = env(); await tick(); fill(x, 'title', 'draft before back'); fill(x, 'body', 'body'); lifecycle(x, 'pagehide', true); x.change({ ownerId: OTHER, user: { id: OTHER }, epoch: 2 }); lifecycle(x, 'pageshow', true); await tick(); eq(host(x).querySelector('[name=title]').value, ''); x.close();
  x = env(); await tick(); fill(x, 'title', 'nonpersistent draft'); lifecycle(x, 'pagehide', false); lifecycle(x, 'pageshow', true); await tick(); eq(host(x).querySelector('[name=title]').value, ''); x.close();

  let failed = true; x = env({ ensure: () => { if (failed) throw { status: 503 }; } }); await tick(); ok(host(x).textContent.includes('불러오지 못')); eq(host(x).querySelector('form'), null); failed = false; host(x).querySelector('button').click(); await tick(); ok(host(x).querySelector('form')); eq(x.sessionCalls.at(-1), true); x.close();
  x = env({ state: { signedIn: false, ownerId: null, user: null } }); await tick(); ok(host(x).textContent.includes('로그인한 뒤')); eq(host(x).querySelector('form'), null); eq(x.calls.length, 0); x.close();
  x = env({ ensure: () => new Promise(r => { resolve = r; }) }); await tick(); lifecycle(x, 'pagehide', true); resolve(); await tick(); eq(host(x).textContent, ''); x.close();
  console.log('standalone inquiry page: ' + checks + ' checks passed (synthetic transport only)');
})().catch(e => { console.error(e); process.exitCode = 1; });
