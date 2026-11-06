'use strict';
// Isolated synthetic transport tests, never contacts or mutates production.
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const { JSDOM } = require(process.env.JSDOM_PATH || 'jsdom');
const ROOT = path.resolve(__dirname, '..'), ID = '11111111-1111-4111-8111-111111111111', OTHER = '22222222-2222-4222-8222-222222222222', Q = '33333333-3333-4333-8333-333333333333';
const date = '2026-11-05T12:00:00Z', tick = async () => { for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 0)); };
let checks = 0;
function eq(a, b) { checks++; assert.deepEqual(a, b); }
function ok(a) { checks++; assert.ok(a); }
function env(handler, signed = true, query = '') {
  const w = new JSDOM('<!doctype html><body><main id="app"><a id="map" href="/inquiries/">건의·문의</a><div id="host"></div></main></body>', { url: 'https://hanq.test/' + query, runScripts: 'outside-only', pretendToBeVisual: true }).window;
  const state = { signedIn: signed, ownerId: signed ? ID : null, user: signed ? { id: ID } : null, epoch: 1 }, calls = [], listeners = [];
  const api = { state: () => ({ ...state }), init: async () => {}, onChange: fn => listeners.push(fn), portal: async (m, p, b, options) => { calls.push({ m, p, b: b && { ...b }, options }); return handler(m, p, b); } };
  w.HanqApi = api;
  w.eval(fs.readFileSync(path.join(ROOT, 'media/ui-locks.js'), 'utf8'));
  w.eval(fs.readFileSync(path.join(ROOT, 'media/inquiry-ui.js'), 'utf8'));
  return { w, api, calls, state, change: value => { Object.assign(state, value); listeners.forEach(f => f(api.state())); }, close: () => w.close() };
}
function click(x, text) { const n = [...x.w.document.querySelectorAll('button,a')].find(b => b.textContent === text); assert(n, text); n.click(); }
function fill(x, title = '테스트 문의', body = '테스트 내용') { x.w.document.querySelector('#hq-inquiry-title').textContent; x.w.document.querySelector('[name=title]').value = title; x.w.document.querySelector('[name=body]').value = body; }
function send(x) { x.w.document.querySelector('.hq-inquiry-form').dispatchEvent(new x.w.Event('submit', { cancelable: true, bubbles: true })); }
function lifecycle(x, name, persisted) { const e = new x.w.Event(name); Object.defineProperty(e, 'persisted', { value: persisted }); x.w.dispatchEvent(e); }
const list = () => ({ items: [{ id: Q, title: '<img src=x onerror=alert(1)>', created_at: date }], page: 1, total: 1 });
const detail = () => ({ inquiry: { id: Q, user_id: ID }, messages: [{ sender_role: 'member', body: '<script>bad()</script>', created_at: date }, { sender_role: 'admin', body: '답변입니다.\n두 번째 줄', created_at: date }] });
(async () => {
  let x = env(() => { throw Error('no call'); });
  x.w.document.querySelector('#map').focus();
  const mapClick = new x.w.MouseEvent('click', { button: 0, bubbles: true, cancelable: true });
  x.w.document.querySelector('#map').addEventListener('click', e => { eq(e.defaultPrevented, false); e.preventDefault(); }, { once: true });
  x.w.document.querySelector('#map').dispatchEvent(mapClick); eq(x.w.document.querySelector('dialog'), null);
  x.w.HanqInquiries.open(x.w.document.querySelector('#map')); await tick();
  ok(x.w.document.querySelector('dialog[open]')); eq(x.w.location.pathname, '/'); eq(x.w.document.querySelectorAll('dialog input,dialog textarea').length, 2); eq(x.calls.length, 0);
  eq(x.w.document.querySelector('[name=title]').maxLength, 120); eq(x.w.document.querySelector('[name=body]').maxLength, 4000);
  fill(x, '  ', ' '); send(x); await tick(); eq(x.calls.length, 0); ok(x.w.document.querySelector('dialog').textContent.includes('제목과 내용을 입력'));
  x.w.document.querySelector('dialog').dispatchEvent(new x.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); eq(x.w.document.querySelector('dialog'), null); eq(x.w.document.activeElement.id, 'map'); eq(x.w.document.querySelector('#app').inert, false); x.close();

  let resolve; x = env((m, p) => m === 'POST' ? new Promise(r => { resolve = r; }) : { items: [], total: 0 });
  x.w.HanqInquiries.open(); await tick(); fill(x); send(x); send(x); await tick(); eq(x.calls.filter(c => c.m === 'POST').length, 1); ok(x.w.document.querySelector('[name=title]').readOnly);
  click(x, '닫기'); x.w.HanqInquiries.open(); await tick(); ok(x.w.document.querySelector('button[type=submit]').disabled); resolve({ id: Q }); await tick(); ok(x.w.document.querySelector('dialog').textContent.includes('문의를 보냈어요')); eq(x.calls.filter(c => c.m === 'POST').length, 1); x.close();

  let fail = true; x = env((m, p) => { if (m === 'POST') { if (fail) throw { status: 0, code: 'timeout' }; return { id: Q }; } return list(); });
  x.w.HanqInquiries.open(); await tick(); fill(x, ' 제목 ', ' 내용 '); send(x); await tick();
  ok(x.w.document.querySelector('dialog').textContent.includes('전송 결과를 확인하지 못')); ok(x.w.document.querySelector('[name=body]').readOnly); const original = x.calls[0].b;
  fail = false; send(x); await tick(); eq(x.calls[1].b, original); eq(original.title, '제목'); eq(original.body, '내용'); ok(x.w.document.querySelector('dialog').textContent.includes('문의를 보냈어요')); x.close();

  x = env((m, p) => p.includes('?') ? list() : detail()); x.w.HanqInquiries.mount(x.w.document.querySelector('#host'), x.api); await tick();
  ok(x.w.document.querySelector('summary').textContent.includes('<img')); eq(x.w.document.querySelector('img'), null);
  let row = x.w.document.querySelector('details'); row.open = true; await tick();
  eq(x.w.document.querySelectorAll('.hq-inquiry-message').length, 2); ok(x.w.document.body.textContent.includes('<script>bad()')); eq(x.w.document.querySelector('script'), null); ok(x.w.document.body.textContent.includes('관리자 답변'));
  row.open = false; await tick(); row.open = true; await tick(); eq(x.calls.filter(c => c.p.endsWith(Q)).length, 1);
  x.change({ ownerId: OTHER, user: { id: OTHER }, epoch: 2 }); eq(x.w.document.querySelector('#host').textContent, ''); x.close();

  x = env((m, p) => p.includes('?') ? list() : { ...detail(), inquiry: { id: Q, user_id: OTHER } }); x.w.HanqInquiries.mount(x.w.document.querySelector('#host'), x.api); await tick(); x.w.document.querySelector('details').open = true; await tick(); eq(x.w.document.querySelectorAll('.hq-inquiry-message').length, 0); ok(x.w.document.querySelector('.hq-inquiry-messages').textContent.includes('불러오지 못')); x.close();

  x = env(() => new Promise(r => { resolve = r; })); x.w.HanqInquiries.mount(x.w.document.querySelector('#host'), x.api); await tick(); x.change({ signedIn: false, ownerId: null, user: null, epoch: 2 }); resolve(list()); await tick(); eq(x.w.document.querySelector('#host').textContent, ''); x.close();

  x = env(() => new Promise(r => { resolve = r; })); x.w.HanqInquiries.open(); await tick(); fill(x); send(x); await tick(); x.change({ ownerId: OTHER, user: { id: OTHER }, epoch: 2 }); eq(x.w.document.querySelector('dialog'), null); resolve({ id: Q }); await tick(); x.w.HanqInquiries.open(); await tick(); eq(x.w.document.querySelector('[name=title]').value, ''); eq(x.w.document.querySelector('[name=body]').value, ''); x.close();

  x = env(() => { throw Error('not called'); }, false); x.w.HanqInquiries.open(); await tick(); ok(x.w.document.querySelector('dialog').textContent.includes('로그인한 뒤')); eq(x.w.document.querySelector('textarea'), null); eq(x.calls.length, 0); x.close();

  x = env((m, p) => ({ items: [{ id: Q, title: '페이지', created_at: date }], total: 21 })); x.w.HanqInquiries.mount(x.w.document.querySelector('#host'), x.api); await tick(); click(x, '다음'); await tick(); ok(x.calls.some(c => c.p === '/api/v1/inquiries?page=2')); click(x, '이전'); await tick(); eq(x.calls.at(-1).p, '/api/v1/inquiries?page=1'); x.close();

  x = env(() => ({})); const release = x.w.HanqUiLocks.acquire(x.w.document.querySelector('#app')); x.w.HanqInquiries.open(); await tick(); click(x, '닫기'); eq(x.w.document.querySelector('#app').inert, true); release(); eq(x.w.document.querySelector('#app').inert, false); x.close();

  x = env(() => ({}), true, '?inquiry=compose#account/main'); await tick(); ok(x.w.document.querySelector('dialog')); eq(x.w.location.search, ''); x.w.dispatchEvent(new x.w.HashChangeEvent('hashchange')); eq(x.w.document.querySelector('dialog'), null); x.close();
  x = env((m, p) => { if (p === '/api/v1/ops') throw { status: 403 }; if (m === 'POST') return { id: Q }; return list(); });
  Object.assign(x.api, { enabled: () => true, plan: async () => ({ plan: {}, checkout: { available: false } }), me: async () => ({ user: x.state.user, premium: { active: false } }) });
  Object.assign(x.state, { status: 'online', profileStatus: 'error', premium: { active: false } });
  x.w.eval(fs.readFileSync(path.join(ROOT, 'media/account-ui.js'), 'utf8'));
  await x.w.HanqAccountUI.render(x.w.document.querySelector('#host'), { view: 'main', go: () => {}, local: { attempts: () => [] } }); await tick();
  ok(x.w.document.querySelector('#acInquiriesHost .hq-inquiry-item')); eq(x.w.document.querySelector('#acAdminSlot').textContent, '');
  eq([...x.w.document.querySelectorAll('#acInquiriesHost button')].some(n => n.textContent === '문의 보내기'), false);
  x.w.document.querySelector('#acInquiriesHost details').open = true; await tick();
  eq(x.calls.filter(c => c.m === 'POST').length, 0); // The retained list remains read-only.
  x.w.HanqAccountUI.stop(); eq(x.w.document.querySelector('#acInquiriesHost').textContent, ''); x.close();
  const page = fs.readFileSync(path.join(ROOT, 'inquiries/index.html'), 'utf8'); ok(!page.includes('location.replace') && !page.includes('http-equiv="refresh"')); ok(page.includes('hq-inquiry-page-host')); ok(!page.includes('portal-ui.js'));
  x = env((m, p) => { if (m === 'POST') throw { status: 503 }; return list(); });
  x.w.HanqInquiries.mount(x.w.document.querySelector('#host'), x.api); await tick();
  x.w.HanqInquiries.open(); await tick(); fill(x); send(x); await tick(); const pending = x.calls.find(c => c.m === 'POST').b;
  eq(x.calls.find(c => c.m === 'POST').options.feedback, false);
  lifecycle(x, 'pagehide', true); eq(x.w.document.querySelector('#host').textContent, ''); eq(x.w.document.querySelector('dialog'), null);
  lifecycle(x, 'pageshow', true); await tick(); ok(x.w.document.querySelector('.hq-inquiry-item'));
  x.w.HanqInquiries.open(); await tick(); ok(x.w.document.querySelector('[name=title]').readOnly); send(x); await tick(); eq(x.calls.filter(c => c.m === 'POST').at(-1).b, pending);
  lifecycle(x, 'pagehide', true); x.change({ ownerId: OTHER, user: { id: OTHER }, epoch: 2 }); lifecycle(x, 'pageshow', true); await tick();
  x.w.HanqInquiries.open(); await tick(); eq(x.w.document.querySelector('[name=title]').value, ''); eq(x.w.document.querySelector('[name=title]').readOnly, false); x.close();
  x = env(() => ({}), false); x.w.HanqInquiries.open(); await tick(); click(x, '로그인하기'); x.change({ signedIn: true, ownerId: ID, user: { id: ID }, epoch: 2 }); await tick(); eq(x.w.document.querySelector('dialog'), null); eq(x.calls.length, 0); x.w.HanqInquiries.open(); await tick(); ok(x.w.document.querySelector('dialog [name=title]')); x.close();
  console.log('compact inquiry UI: ' + checks + ' checks passed (synthetic transport only)');
})().catch(e => { console.error(e); process.exitCode = 1; });

