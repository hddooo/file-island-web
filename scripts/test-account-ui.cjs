#!/usr/bin/env node
/* 계정·서버 연결(media/api-client.js · media/account-ui.js) 단위 검사 — 배포 파일 아님(.vercelignore로 scripts/ 제외)
 *   node scripts/test-account-ui.cjs
 *   DOM 화면 검사는 jsdom이 있을 때만: JSDOM_PATH=/path/to/node_modules/jsdom node scripts/test-account-ui.cjs
 * 실제 서버·네트워크는 쓰지 않는다(가짜 fetch). 실제 서버와의 동작은 hanq_back의 통합 검사가 맡는다.
 */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const ROOT = path.resolve(__dirname, '..');
let checks = 0, failures = 0;
async function t(name, fn) { checks++; try { await fn(); } catch (e) { failures++; console.log('  ✗ ' + name + '\n    ' + (e && e.message)); } }

const Api = require(path.join(ROOT, 'media', 'api-client.js'));

function memStorage() { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), keys: () => [...m.keys()], map: m }; }
function res(status, body) { return { ok: status >= 200 && status < 300, status, text: () => Promise.resolve(body == null ? '' : JSON.stringify(body)) }; }
function fakeServer(routes) {
  const calls = [];
  const fetch = (url, init) => { calls.push({ url, init }); const key = init.method + ' ' + url.replace(/^https:\/\/api\.test/, ''); const h = routes[key]; if (!h) return Promise.resolve(res(404, { error: { code: 'not_found' } })); return Promise.resolve(h(init, calls)); };
  return { fetch, calls };
}
const cryptoStub = { getRandomValues: b => { for (let i = 0; i < b.length; i++) b[i] = (i * 37 + 11) & 255; return b; } };
const session = (tok) => ({ accessToken: tok, accessTokenExpiresAt: '2030-01-01T00:00:00Z', tokenType: 'Bearer', user: { id: 'u1', email: 'a@b.test', displayName: '한', createdAt: '2026-10-08T00:00:00Z' } });
const meBody = { user: { id: 'u1', email: 'a@b.test', displayName: '한', createdAt: '2026-10-08T00:00:00Z' }, premium: { active: false, expiresAt: null, serverTime: '2026-10-08T00:00:00Z' } };

(async () => {
  console.log('\n■ api-client.js');
  await t('주소는 https 또는 개발용 localhost만, 자격 증명·쿼리 붙은 주소는 거절', () => {
    assert.equal(Api.normalizeBase(''), '');
    assert.equal(Api.normalizeBase('http://api.example.com'), '');
    assert.equal(Api.normalizeBase('https://api.example.com/'), 'https://api.example.com');
    assert.equal(Api.normalizeBase('http://localhost:3000'), 'http://localhost:3000');
    assert.equal(Api.normalizeBase('https://u:p@api.example.com'), '');
    assert.equal(Api.normalizeBase('https://api.example.com/?x=1'), '');
    assert.equal(Api.normalizeBase('javascript:alert(1)'), '');
  });
  await t('기본(주소 없음)은 꺼짐: 서버를 한 번도 부르지 않는다', async () => {
    const s = fakeServer({});
    const c = Api.create({ base: '', fetch: s.fetch, storage: memStorage(), locks: null });
    assert.equal(c.enabled(), false);
    assert.equal(c.state().status, 'disabled');
    await assert.rejects(c.me(), e => e.code === 'disabled');
    await c.init();
    assert.equal(s.calls.length, 0);
  });
  await t('로그인: 접근 토큰은 메모리에만, 저장소에는 비밀 없는 로그인 흔적·탭 무효화만 · 쿠키 요청은 credentials + CSRF 머리글', async () => {
    const st = memStorage();
    const s = fakeServer({ 'POST /api/v1/auth/signin': () => res(200, session('tok1')), 'GET /api/v1/me': () => res(200, meBody) });
    const c = Api.create({ base: 'https://api.test', fetch: s.fetch, storage: st, locks: null, crypto: cryptoStub });
    await c.signin('a@b.test', 'pw-1234567890');
    assert.deepEqual(st.keys(), ['hanqacct:signedIn', 'hanq:auth-invalidation:v1']);
    assert.ok(![...st.map.values()].some(v => v.includes('tok1')));
    const signin = s.calls[0].init;
    assert.equal(signin.credentials, 'include');
    assert.equal(signin.headers['X-HanQ-CSRF'], '1');
    assert.equal(signin.headers.Authorization, undefined);
    assert.equal(s.calls[1].init.headers.Authorization, 'Bearer tok1');
    assert.equal(c.state().signedIn, true);
    assert.equal(JSON.stringify(c.state()).includes('tok1'), false, 'state()에 토큰을 내지 않음');
  });
  await t('401이면 세션을 종료하고 동시에 실패한 요청도 자동 갱신·재전송하지 않는다', async () => {
    let valid = 'old', refreshes = 0, k = 0;
    const authed = (init, body) => (init.headers.Authorization === 'Bearer ' + valid ? res(200, body) : res(401, { error: { code: 'invalid_token' } }));
    const s = fakeServer({
      'POST /api/v1/auth/signin': () => res(200, session('old')),
      'GET /api/v1/me': (init) => authed(init, meBody),
      'GET /api/v1/attempts': (init) => authed(init, { items: [], next: null }),
      'POST /api/v1/auth/refresh': (init) => { refreshes++; assert.equal(init.headers['X-HanQ-CSRF'], '1'); assert.equal(init.credentials, 'include'); valid = 't' + (++k); return new Promise(r => setTimeout(() => r(res(200, session(valid))), 20)); },
    });
    const c = Api.create({ base: 'https://api.test', fetch: s.fetch, storage: memStorage(), locks: null });
    await c.signin('a@b.test', 'x');
    assert.equal(refreshes, 0);
    valid = 'expired-on-server';
    const out = await Promise.allSettled([c.me(), c.attempts(), c.me()]);
    assert(out.every(x => x.status === 'rejected'));
    assert.equal(refreshes, 0);
    assert.equal(c.state().signedIn, false);
    assert.equal(s.calls.filter(x => x.init.headers.Authorization === 'Bearer t1').length, 0);
  });
  await t('갱신 실패(401)면 세션을 지우고 로그인 흔적도 지운다', async () => {
    const st = memStorage();
    const s = fakeServer({ 'POST /api/v1/auth/signin': () => res(200, session('t')), 'GET /api/v1/me': () => res(401, { error: { code: 'invalid_token' } }), 'POST /api/v1/auth/refresh': () => res(401, { error: { code: 'refresh_reused' } }) });
    const c = Api.create({ base: 'https://api.test', fetch: s.fetch, storage: st, locks: null });
    await c.signin('a@b.test', 'x').catch(() => null);
    await assert.rejects(c.me(), e => e.status === 401);
    assert.equal(c.state().signedIn, false);
    assert.equal(st.getItem('hanqacct:signedIn'), null);
  });
  await t('Web Locks가 있으면 갱신을 잠금 안에서(탭 사이 한 번에 하나)', async () => {
    const names = [];
    const locks = { request: (name, fn) => { names.push(name); return Promise.resolve(fn()); } };
    const s = fakeServer({ 'POST /api/v1/auth/refresh': () => res(200, session('z')) });
    const c = Api.create({ base: 'https://api.test', fetch: s.fetch, storage: memStorage(), locks });
    assert.equal(await c.refresh(), true);
    assert.deepEqual(names, ['hanq:auth:cookie']);
  });
  await t('네트워크 오류는 offline 상태와 network 코드로', async () => {
    const c = Api.create({ base: 'https://api.test', fetch: () => Promise.reject(new TypeError('failed')), storage: memStorage(), locks: null });
    await assert.rejects(c.plan(), e => e.code === 'network' && e.status === 0);
    assert.equal(c.state().status, 'offline');
  });
  await t('가져오기 항목: 맞음 여부(correct)는 보내지 않고, 다른 과목·형식이 틀린 기록·중복은 뺀다', () => {
    const out = Api.importEntries([
      { id: 'a1234567', mode: 'quiz', subject: 'history', questionId: 'legacy-x-001', contentVersion: 'v1', optionId: 'o1', correct: true, ts: 1791000000000.5 },
      { id: 'a1234567', mode: 'quiz', subject: 'history', questionId: 'dup', contentVersion: 'v1', optionId: 'o1' },
      { id: 'a7654321', mode: 'mock', subject: 'math', questionId: 'exam-70-01', contentVersion: 'v', optionId: 'exam-70-01-option-1' },
      { id: 'bad', mode: 'quiz', questionId: 'q', contentVersion: 'v', optionId: 'o' },
      { id: 'a9999999', mode: 'mock', questionId: 'exam-70-02', contentVersion: 'v', optionId: null, unanswered: true },
    ]);
    assert.deepEqual(out, [
      { localId: 'a1234567', mode: 'quiz', questionId: 'legacy-x-001', contentVersion: 'v1', optionId: 'o1', ts: 1791000000000 },
      { localId: 'a9999999', mode: 'mock', questionId: 'exam-70-02', contentVersion: 'v', optionId: null, ts: undefined },
    ]);
  });
  await t('가져오기 키는 이 브라우저에 하나(43자)로 고정되고 hanq: 학습 기록 키는 건드리지 않는다', async () => {
    const st = memStorage(); st.setItem('hanq:att:v1:a1', '{"keep":1}');
    const bodies = [];
    const s = fakeServer({ 'POST /api/v1/auth/signin': () => res(200, session('t')), 'GET /api/v1/me': () => res(200, meBody), 'POST /api/v1/imports/local-attempts': (init) => { bodies.push(JSON.parse(init.body)); return res(201, { imported: 0, alreadyImported: 0, skipped: [], skippedCount: 0 }); } });
    const c = Api.create({ base: 'https://api.test', fetch: s.fetch, storage: st, locks: null, crypto: cryptoStub });
    await c.signin('a@b.test', 'x');
    await c.importLocal([]); await c.importLocal([]);
    assert.match(bodies[0].importKey, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(bodies[0].importKey, bodies[1].importKey);
    assert.equal(st.getItem('hanq:att:v1:a1'), '{"keep":1}');
    assert.deepEqual(st.keys().sort(), ['hanq:att:v1:a1', 'hanq:auth-invalidation:v1', 'hanqacct:importKey', 'hanqacct:signedIn']);
  });
  await t('저장소를 쓸 수 없으면 가져오기 키를 만들지 않고 가져오기를 거절한다(요청도 보내지 않음)', async () => {
    const userB = { id: 'u1', email: 'a@b.test', displayName: '한', createdAt: '2026-10-08T00:00:00Z' };
    const mk = (storage) => {
      const s = fakeServer({ 'POST /api/v1/auth/signin': () => res(200, Object.assign(session('t'), { user: userB })), 'GET /api/v1/me': () => res(200, meBody), 'POST /api/v1/imports/local-attempts': () => res(201, { imported: 1, alreadyImported: 0, skipped: [], skippedCount: 0 }) });
      return { s, c: Api.create({ base: 'https://api.test', fetch: s.fetch, storage, locks: null, crypto: cryptoStub }) };
    };
    const throwing = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); }, removeItem: () => {} };
    const forgetful = { getItem: () => null, setItem: () => {}, removeItem: () => {} }; // accepts writes but keeps nothing
    for (const storage of [null, throwing, forgetful]) {
      const { s, c } = mk(storage);
      await c.signin('a@b.test', 'x');
      await assert.rejects(c.importLocal([{ localId: 'a1234567', mode: 'quiz', questionId: 'q', contentVersion: 'v', optionId: 'o' }]), (e) => e.code === 'no-import-key');
      assert.equal(s.calls.filter((x) => x.url.endsWith('/imports/local-attempts')).length, 0);
    }
  });
  await t('A의 변경 요청이 401이면 쿠키의 다른 계정으로 자동 복원·재전송하지 않는다', async () => {
    const userA = { id: 'uA', email: 'a@x.test', displayName: 'A', createdAt: '2026-10-08T00:00:00Z' };
    const userB = { id: 'uB', email: 'b@x.test', displayName: 'B', createdAt: '2026-10-08T00:00:00Z' };
    let validToken = 'tokA';
    const posts = [];
    const s = fakeServer({
      'POST /api/v1/auth/signin': () => res(200, { accessToken: 'tokA', accessTokenExpiresAt: '2030-01-01T00:00:00Z', user: userA }),
      'GET /api/v1/me': (init) => (init.headers.Authorization === 'Bearer ' + validToken ? res(200, { user: validToken === 'tokA' ? userA : userB, premium: { active: false } }) : res(401, { error: { code: 'invalid_token' } })),
      // the shared cookie now belongs to B (another tab signed in as B)
      'POST /api/v1/auth/refresh': () => { validToken = 'tokB'; return res(200, { accessToken: 'tokB', accessTokenExpiresAt: '2030-01-01T00:00:00Z', user: userB }); },
      'PATCH /api/v1/me': (init) => { posts.push(init.headers.Authorization); return init.headers.Authorization === 'Bearer ' + validToken ? res(200, { user: Object.assign({}, userB, { displayName: JSON.parse(init.body).displayName }) }) : res(401, { error: { code: 'invalid_token' } }); },
    });
    const c = Api.create({ base: 'https://api.test', fetch: s.fetch, storage: memStorage(), locks: null });
    const owners = [];
    c.onChange((st) => owners.push(st.ownerId));
    await c.signin('a@x.test', 'pw');
    assert.equal(c.state().ownerId, 'uA');
    validToken = 'expired-A';
    await assert.rejects(c.updateProfile('A의 새 이름'), (e) => e.status === 401);
    assert.deepEqual(posts, ['Bearer tokA'], 'A\'s request was sent once with A\'s token and never replayed with B\'s');
    assert.equal(c.state().ownerId, null);
    assert.ok(owners.includes('uA') && !owners.includes('uB'));
    assert.equal(s.calls.filter(x => x.url.endsWith('/auth/refresh')).length, 0);
    assert.equal(c.state().premium, null, 'A\'s premium state is not shown for B');
  });
  await t('같은 계정의 만료된 변경 요청도 재전송하지 않고 재로그인을 기다린다', async () => {
    const user = { id: 'u1', email: 'a@b.test', displayName: '한', createdAt: '2026-10-08T00:00:00Z' };
    let valid = 't1';
    const s = fakeServer({
      'POST /api/v1/auth/signin': () => res(200, { accessToken: 't1', accessTokenExpiresAt: '2030-01-01T00:00:00Z', user }),
      'GET /api/v1/me': () => res(200, { user, premium: { active: false } }),
      'POST /api/v1/auth/refresh': () => { valid = 't2'; return res(200, { accessToken: 't2', accessTokenExpiresAt: '2030-01-01T00:00:00Z', user }); },
      'PATCH /api/v1/me': (init) => (init.headers.Authorization === 'Bearer ' + valid ? res(200, { user }) : res(401, { error: { code: 'invalid_token' } })),
    });
    const c = Api.create({ base: 'https://api.test', fetch: s.fetch, storage: memStorage(), locks: null });
    await c.signin('a@b.test', 'pw');
    valid = 'expired';
    await assert.rejects(c.updateProfile('한'), e => e.status === 401);
    assert.deepEqual(s.calls.filter((x) => x.init.method === 'PATCH').map((x) => x.init.headers.Authorization), ['Bearer t1']);
    assert.equal(c.state().signedIn, false);
    assert.equal(s.calls.filter(x => x.url.endsWith('/auth/refresh')).length, 0);
  });
  await t('로그아웃: 서버가 끊었는지(serverRevoked)를 정직하게 돌려주고, 이 탭의 로그인 정보는 언제나 지운다', async () => {
    const ok = fakeServer({ 'POST /api/v1/auth/signin': () => res(200, session('t')), 'GET /api/v1/me': () => res(200, meBody), 'POST /api/v1/auth/logout': () => res(204, null) });
    const c1 = Api.create({ base: 'https://api.test', fetch: ok.fetch, storage: memStorage(), locks: null });
    await c1.signin('a@b.test', 'x');
    assert.deepEqual(await c1.logout(), { serverRevoked: true });
    assert.equal(c1.state().signedIn, false);
    let down = false;
    const st = memStorage();
    const flaky = (url, init) => (down ? Promise.reject(new TypeError('offline')) : fakeServer({ 'POST /api/v1/auth/signin': () => res(200, session('t')), 'GET /api/v1/me': () => res(200, meBody) }).fetch(url, init));
    const c2 = Api.create({ base: 'https://api.test', fetch: flaky, storage: st, locks: null });
    await c2.signin('a@b.test', 'x');
    down = true;
    assert.deepEqual(await c2.logout(), { serverRevoked: false });
    assert.equal(c2.state().signedIn, false);
    assert.equal(st.getItem('hanqacct:signedIn'), null);
  });
  /* 늦게 도착하는 성공 응답: A로 보낸 요청이 대기하는 동안 B로 로그인(또는 로그아웃)한 뒤 그 응답을 풀어 준다 */
  function deferredServer() {
    const uA = { id: 'uA', email: 'a@x.test', displayName: 'A', createdAt: '2026-10-08T00:00:00Z' };
    const uB = { id: 'uB', email: 'b@x.test', displayName: 'B', createdAt: '2026-10-08T00:00:00Z' };
    let release; const gate = new Promise((r) => { release = r; });
    const ctl = { holdA: false, release: () => release(), uA, uB };
    const who = (init) => (init.headers.Authorization === 'Bearer tokA' ? uA : init.headers.Authorization === 'Bearer tokB' ? uB : null);
    const later = (init, r) => (ctl.holdA && who(init) === uA ? gate.then(() => r) : r);
    ctl.server = fakeServer({
      'POST /api/v1/auth/signin': (init) => { const a = JSON.parse(init.body).email === 'a@x.test'; return res(200, { accessToken: a ? 'tokA' : 'tokB', accessTokenExpiresAt: '2030-01-01T00:00:00Z', user: a ? uA : uB }); },
      'POST /api/v1/auth/logout': () => res(204, null),
      'GET /api/v1/me': (init) => { const u = who(init); return u ? later(init, res(200, { user: u, premium: { active: u === uA, expiresAt: u === uA ? '2026-11-08T00:00:00Z' : null } })) : res(401, { error: { code: 'invalid_token' } }); },
      'PATCH /api/v1/me': (init) => { const u = who(init); return u ? later(init, res(200, { user: Object.assign({}, u, { displayName: JSON.parse(init.body).displayName }) })) : res(401, { error: { code: 'invalid_token' } }); },
      'GET /api/v1/premium': (init) => { const u = who(init); return u ? later(init, res(200, { active: u === uA, expiresAt: u === uA ? '2026-11-08T00:00:00Z' : null, serverTime: '2026-10-08T00:00:00Z', grants: [] })) : res(401, { error: { code: 'invalid_token' } }); },
    });
    return ctl;
  }
  await t('늦게 온 A의 /me 성공 응답: B로 로그인한 뒤에는 session_changed로 거절되고 지금 계정·이용권은 B 그대로', async () => {
    const d = deferredServer();
    const c = Api.create({ base: 'https://api.test', fetch: d.server.fetch, storage: memStorage(), locks: null });
    await c.signin('a@x.test', 'pw');
    d.holdA = true;
    const lateMe = c.me();
    const lateP = c.premium();
    await c.signin('b@x.test', 'pw');
    assert.equal(c.state().ownerId, 'uB');
    d.release();
    await assert.rejects(lateMe, (e) => e.code === 'session_changed');
    await assert.rejects(lateP, (e) => e.code === 'session_changed');
    const st = c.state();
    assert.equal(st.ownerId, 'uB');
    assert.equal(st.user.email, 'b@x.test');
    assert.equal(st.premium.active, false, 'A의 이용권이 B 위에 덮이지 않음');
  });
  await t('늦게 온 A의 이름 바꾸기(PATCH) 성공 응답도 B의 상태를 바꾸지 않는다', async () => {
    const d = deferredServer();
    const c = Api.create({ base: 'https://api.test', fetch: d.server.fetch, storage: memStorage(), locks: null });
    await c.signin('a@x.test', 'pw');
    d.holdA = true;
    const latePatch = c.updateProfile('A의 새 이름');
    await c.signin('b@x.test', 'pw');
    d.release();
    await assert.rejects(latePatch, (e) => e.code === 'session_changed');
    assert.equal(c.state().user.displayName, 'B');
    assert.equal(c.state().ownerId, 'uB');
  });
  await t('A의 요청이 대기하는 동안 로그아웃하면, 늦은 성공 응답이 로그인 상태를 되살리지 않는다', async () => {
    const d = deferredServer();
    const c = Api.create({ base: 'https://api.test', fetch: d.server.fetch, storage: memStorage(), locks: null });
    await c.signin('a@x.test', 'pw');
    d.holdA = true;
    const lateMe = c.me();
    await c.logout();
    d.release();
    await assert.rejects(lateMe, (e) => e.code === 'session_changed');
    assert.equal(c.state().signedIn, false);
    assert.equal(c.state().user, null);
  });
  await t('로그인 전에는 로그인이 필요한 요청을 보내지 않는다', async () => {
    const d = deferredServer();
    const c = Api.create({ base: 'https://api.test', fetch: d.server.fetch, storage: memStorage(), locks: null });
    await assert.rejects(c.me(), (e) => e.code === 'unauthorized');
    assert.equal(d.server.calls.length, 0);
  });

  console.log('\n■ index.html 연결');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  await t('배포 기본값: same-origin rewrite를 사용하고 /api/v1은 클라이언트가 붙임', () => {
    const m = /<meta name="hanq-api-base" content="([^"]*)">/.exec(html);
    assert.ok(m, 'meta가 있음');
    assert.equal(m[1], 'same-origin');
    assert.equal(Api.readBase({location:{hostname:'hanq.vercel.app',origin:'https://hanq.vercel.app',protocol:'https:'},document:{querySelector:()=>({getAttribute:()=>m[1]})}}), 'https://hanq.vercel.app');
  });
  await t('readBase: meta 기본값 · 이 기기(localhost 계열)에서만 개발용 저장 주소가 앞섬 · 배포 사이트는 저장 주소를 무시 · 안전하지 않으면 버림', () => {
    const win = (host, meta, stored) => ({
      location: { hostname: host },
      document: { querySelector: (s) => (s === 'meta[name="hanq-api-base"]' && meta != null ? { getAttribute: () => meta } : null) },
      localStorage: { getItem: (k) => (k === 'hanqdev.apiBase' ? stored : null) },
    });
    const PROD = 'https://hanq-api.onrender.com';
    assert.equal(Api.readBase(win('hanq.vercel.app', PROD, null)), PROD);
    assert.equal(Api.readBase(win('hanq.vercel.app', PROD, 'http://localhost:3000')), PROD, '배포 사이트는 저장된 개발 주소를 읽지 않음');
    assert.equal(Api.readBase(win('hanq.vercel.app', PROD, 'https://evil.example')), PROD);
    assert.equal(Api.readBase(win('localhost', PROD, 'http://localhost:3000')), 'http://localhost:3000', 'meta가 채워져 있어도 이 기기에서는 개발 주소');
    assert.equal(Api.readBase(win('127.0.0.1', PROD, 'http://127.0.0.1:3000/api/v1/')), 'http://127.0.0.1:3000', '/api/v1을 붙여 넣어도 겹치지 않게 뗌');
    assert.equal(Api.readBase(win('[::1]', PROD, 'http://[::1]:3000')), 'http://[::1]:3000');
    for (const bad of ['http://192.168.0.5:3000', 'javascript:alert(1)', 'https://u:p@x.example', 'https://x.example/?a=1', 'ftp://x.example', '   ']) {
      assert.equal(Api.readBase(win('localhost', PROD, bad)), PROD, '안전하지 않은 개발 주소는 버리고 meta: ' + bad);
    }
    assert.equal(Api.readBase(win('hanq.vercel.app', '', null)), '', 'meta를 비우면 의도된 오프라인 모드');
    assert.equal(Api.readBase(win('localhost', '', 'http://localhost:3000')), 'http://localhost:3000');
    assert.equal(Api.readBase(win('hanq.vercel.app', PROD + '/api/v1', null)), PROD, 'meta에 /api/v1이 붙어 있어도 겹치지 않음');
    assert.equal(Api.normalizeBase('https://hanq-api.onrender.com/'), PROD);
  });
  await t('요청 주소는 base + /api/v1/… 한 번(겹치지 않음) · 꺼짐(base 빈 값)은 그대로 disabled', async () => {
    const urls = [];
    const c = Api.create({ base: 'https://hanq-api.onrender.com/api/v1', fetch: (u) => { urls.push(u); return Promise.resolve(res(200, { plan: {}, checkout: {} })); }, storage: memStorage(), locks: null });
    await c.plan();
    assert.deepEqual(urls, ['https://hanq-api.onrender.com/api/v1/premium/plan']);
    const off = Api.create({ base: '', fetch: () => { throw new Error('must not fetch'); }, storage: memStorage(), locks: null });
    assert.equal(off.enabled(), false);
    await assert.rejects(off.plan(), (e) => e.code === 'disabled');
    await assert.rejects(off.me(), (e) => e.code === 'disabled');
  });
  await t('스크립트 순서: activity-stats → api-client → account-ui, 계정 CSS 연결', () => {
    // 주석 속 글자가 아니라 실제 <script src="…"> 태그의 순서로 본다
    const srcs = [...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/script>/g)].map((m) => m[1].split('?')[0]);
    const at = (f) => srcs.indexOf(f);
    for (const f of ['media/activity-stats.js', 'media/api-client.js', 'media/account-ui.js']) assert.equal(srcs.filter((s) => s === f).length, 1, f + ' 태그는 하나');
    assert.ok(at('media/activity-stats.js') < at('media/api-client.js') && at('media/api-client.js') < at('media/account-ui.js'), '실제 순서: ' + srcs.slice(-4).join(' → '));
    assert.equal(at('media/quiz-review.js') < at('media/account-ui.js'), true, '계정 화면의 풀이 그리기(quiz-review)가 먼저 로드됨');
    assert.match(html, /<link rel="stylesheet" href="media\/account-ui\.css(?:\?[^"<>]*)?">/);
  });
  await t('localStorage 전체 지우기(clear) 호출이 없다', () => {
    for (const f of ['index.html', 'media/api-client.js', 'media/account-ui.js']) assert.ok(!/localStorage\.clear\(|\.clear\(\)\s*;?\s*\/\/\s*storage/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')), f);
  });

  let JSDOM = null;
  try { JSDOM = require(process.env.JSDOM_PATH || 'jsdom').JSDOM; } catch (e) { JSDOM = null; }
  if (!JSDOM) { console.log('\n(jsdom 없음 — 화면 검사는 건너뜀. JSDOM_PATH를 주면 실행)'); return done(); }

  console.log('\n■ account-ui.js 화면 (jsdom, 가짜 서버 창구)');
  function dom(api) {
    const d = new JSDOM('<!doctype html><html><body><main id="app"><section id="acRoot"></section></main></body></html>', { runScripts: 'outside-only', url: 'https://hanq.example/#account' });
    const w = d.window;
    w.eval(fs.readFileSync(path.join(ROOT, 'media', 'quiz-review.js'), 'utf8'));
    w.eval(fs.readFileSync(path.join(ROOT, 'media', 'account-ui.js'), 'utf8'));
    if (api) w.HanqApi = api;
    return w;
  }
  /* 실제 시작 경로: 창 안에서 api-client.js를 그대로 실행(가짜 fetch, 네트워크 없음) → window.HanqApi.base()·init()이 부른 주소 */
  const indexMeta = (/<meta name="hanq-api-base" content="([^"]*)">/.exec(html) || [])[1];
  function apiWindow(url, meta, stored) {
    const d = new JSDOM('<!doctype html><html><head>' + (meta == null ? '' : '<meta name="hanq-api-base" content="' + meta + '">') + '</head><body></body></html>', { runScripts: 'outside-only', url });
    const w = d.window, calls = [];
    if (stored != null) w.localStorage.setItem('hanqdev.apiBase', stored);
    w.fetch = (u, init) => { calls.push({ u, method: init.method, credentials: init.credentials }); return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ plan: { priceKRW: 5000 }, checkout: { available: false } })) }); };
    w.eval(fs.readFileSync(path.join(ROOT, 'media', 'api-client.js'), 'utf8'));
    return { w, calls };
  }
  await t('시작(배포 사이트 hanq.vercel.app): index의 meta로 켜지고, 저장된 개발 주소는 무시, 공개 요청 하나만 /api/v1에 한 번', async () => {
    const { w, calls } = apiWindow('https://hanq.vercel.app/', indexMeta, 'http://localhost:3000');
    assert.equal(w.HanqApi.enabled(), true);
    assert.equal(w.HanqApi.base(), 'https://hanq.vercel.app');
    await w.HanqApi.init();
    assert.deepEqual(calls.map((c) => c.method + ' ' + c.u), ['GET https://hanq.vercel.app/api/v1/premium/plan'], '로그인 흔적이 없으면 인증 요청 없이 공개 요청만');
    assert.ok(!calls.some((c) => /localhost|\/api\/v1\/api\/v1/.test(c.u)));
    assert.equal(w.HanqApi.state().signedIn, false);
  });
  await t('시작(이 기기 localhost): 저장된 안전한 개발 주소가 meta보다 앞섬', async () => {
    const { w, calls } = apiWindow('http://localhost:8080/index.html', indexMeta, 'http://localhost:3000');
    assert.equal(w.HanqApi.base(), 'http://localhost:3000');
    await w.HanqApi.init();
    assert.deepEqual(calls.map((c) => c.u), ['http://localhost:3000/api/v1/premium/plan']);
  });
  await t('시작(이 기기 127.0.0.1): 안전하지 않은 저장 주소는 버리고 meta 그대로', async () => {
    const { w } = apiWindow('http://127.0.0.1:5500/', indexMeta, 'http://10.0.0.7:3000');
    assert.equal(w.HanqApi.base(), 'http://127.0.0.1:5500');
  });
  await t('시작(meta 비움 = 의도된 오프라인 모드): 서버를 전혀 부르지 않는다', async () => {
    const { w, calls } = apiWindow('https://hanq.vercel.app/', '', 'http://localhost:3000');
    assert.equal(w.HanqApi.enabled(), false);
    await w.HanqApi.init();
    await assert.rejects(w.HanqApi.plan(), (e) => e.code === 'disabled');
    assert.equal(calls.length, 0);
  });
  const tick = () => new Promise(r => setTimeout(r, 0));
  async function settle() { for (let i = 0; i < 10; i++) await tick(); }
  function fakeApi(o) {
    const st = { enabled: true, base: 'https://api.test', status: 'online', signedIn: !!o.signedIn, user: o.signedIn ? meBody.user : null, premium: o.premium || { active: false } };
    const log = [];
    const api = {
      log,
      enabled: () => o.enabled !== false, state: () => JSON.parse(JSON.stringify(st)), init: () => Promise.resolve(st), onChange: () => () => {},
      plan: () => Promise.resolve({ plan: { id: 'premium-1m', priceKRW: 5000, currency: 'KRW', renewal: 'none', periodPolicy: 'calendar-month', policyStatus: 'pending-owner-confirmation' }, checkout: o.checkout || { available: false, provider: null, testMode: false } }),
      me: () => Promise.resolve({ user: meBody.user, premium: st.premium }),
      wrongNotes: () => Promise.resolve({ counts: { unresolved: 12, resolved: 1, everWrong: 13, stale: 0 }, items: [], stale: [] }),
      replays: () => Promise.resolve({ replays: [] }), runs: () => Promise.resolve({ runs: [] }), attempts: () => Promise.resolve({ items: [], next: null }),
      importEntries: Api.importEntries,
      importLocal: (entries) => { log.push(['import', entries]); return Promise.resolve({ received: entries.length, imported: 1, alreadyImported: 0, skipped: [{ localId: 'a2', reason: 'unknown-question-or-version' }], skippedCount: 1 }); },
      newSubmissionId: () => 'rp-test-0001',
      replay: () => Promise.resolve(o.replay),
      answerReplay: (id, pos, opt, sid) => { log.push(['answer', id, pos, opt, sid]); o.replay.items[pos].result = { optionId: opt, correct: false, correctOptionId: 'o-right', review: { correctOptionId: 'o-right', item: { id: 'q1', v: '1', q: '문제', options: [{ id: 'o-right', text: '정답', correct: true, review: ['맞는 까닭'] }, { id: 'o-wrong', text: '오답', correct: false, review: ['틀린 까닭'] }], overview: { answer: '정답', reason: ['까닭'] } } } }; o.replay.replay.answered = 1; return Promise.resolve({}); },
    };
    return api;
  }
  const ctx = (w, extra) => Object.assign({ view: 'main', go: v => { w.__went = v; }, local: { attempts: () => [{ id: 'a1234567', mode: 'quiz', subject: 'history', questionId: 'legacy-x-001', contentVersion: 'v1', optionId: 'o1', correct: true, ts: 1791000000000 }, { id: 'a2234567', mode: 'quiz', subject: 'history', questionId: 'gone', contentVersion: 'v0', optionId: 'o9', correct: false, ts: 1791000000000 }] } }, extra || {});

  await t('서버 연결이 꺼져 있으면 로그인·결제 없이 ‘이 기기에만 저장’ 안내만', async () => {
    const w = dom(null), root = w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root, ctx(w)); await settle();
    assert.match(root.textContent, /서버 연결이 필요해요/);
    assert.match(root.textContent, /기존 학습 기록은 보존/);
    assert.equal(root.querySelector('form'), null);
    assert.equal(w.HanqAccountUI.notesBannerHtml(), '');
  });
  await t('로그인 전: 라벨 붙은 이메일·비밀번호 입력(자동완성 값), 회원가입으로 바꾸기', async () => {
    const w = dom(fakeApi({})), root = w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root, ctx(w)); await settle();
    const email = root.querySelector('#acEmail'), pw = root.querySelector('#acPw');
    assert.equal(email.type, 'email'); assert.equal(pw.type, 'password'); assert.equal(pw.getAttribute('autocomplete'), 'current-password');
    assert.ok(root.querySelector('label[for="acEmail"]') && root.querySelector('label[for="acPw"]'));
    root.querySelector('#acModeUp').click(); await settle();
    assert.equal(root.querySelector('#acPw').getAttribute('autocomplete'), 'new-password');
    assert.ok(root.querySelector('#acName'));
    assert.equal(root.querySelector('#acPremTitle'),null);
  });
  await t('결제 준비 전: 구매 버튼은 꺼지고 ‘준비 중 · 결제되지 않음’을 정직하게', async () => {
    const w = dom(fakeApi({ signedIn: true })), root = w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root, ctx(w,{view:'notes'})); await settle();
    assert.match(root.textContent, /온라인 결제는 아직 준비 중이에요/);
    assert.match(root.textContent, /1개월 5,000원/);
    assert.equal(root.querySelector('#acBuyTest'), null);
    assert.ok([...root.querySelectorAll('button')].some(b => b.disabled && /구매 준비 중/.test(b.textContent)));
  });
  await t('서버가 테스트 모드라고 알려 줄 때만 ‘개발용 테스트 결제(실제 결제 아님)’', async () => {
    const w = dom(fakeApi({ signedIn: true, checkout: { available: true, provider: 'test', testMode: true } })), root = w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root, ctx(w,{view:'notes'})); await settle();
    assert.ok(root.querySelector('#acBuyTest'));
    assert.match(root.querySelector('.ac-test').textContent, /개발용 테스트 결제 — 실제 결제가 아니에요/);
  });
  await t('판매 안내는 로그인 후 이용권 없는 오답노트에서만 표시', async()=>{
    for(const signedIn of [false,true]){const w=dom(fakeApi({signedIn})),root=w.document.getElementById('acRoot');await w.HanqAccountUI.render(root,ctx(w));await settle();assert.equal(root.querySelector('#acPremTitle'),null);await w.HanqAccountUI.render(root,ctx(w,{view:'notes'}));await settle();assert.equal(!!root.querySelector('#acPremTitle'),signedIn);assert.equal(root.querySelector('#acRunCreate,#acReplayRandom'),null);assert.doesNotMatch(root.textContent,/운영자 확정 전|오답으로 만든 모의고사/);}
  });
  await t('마이페이지에는 캐릭터·점수·출석·닫힌 설정만: 가져오기·프리미엄·오답노트·기록·로그아웃 단추 없음(오답노트 화면에 보존)', async () => {
    const api = fakeApi({ signedIn: true }), w = dom(api), root = w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root, ctx(w)); await settle();
    for (const sel of ['#acImpGo', '#acImpOk', '.ac-records', '#acPremTitle', '#acToNotes', '#acLogout', '#acLogoutAll', '#acPremiumOpen', '.ac-hist'])
      assert.equal(root.querySelector(sel), null, sel);
    assert.ok(root.querySelector('#acAttendance'));
    assert.equal(root.querySelector('details.ac-settings').open, false);
    assert.ok(!api.log.some(x => x[0] === 'import'), '수동 가져오기 요청 없음');
    await w.HanqAccountUI.render(root, ctx(w, { view: 'notes' })); await settle();
    assert.ok(root.querySelector('.ac-records') && root.querySelector('#acPremTitle'), '기록·이용권 안내는 오답노트 화면에');
  });
  await t('서버 다시 풀기: 채점 전엔 정답 표시가 없고, 서버 채점 뒤에만 풀이', async () => {
    const replay = { replay: { id: '11111111-1111-4111-8111-111111111111', order: 'recent', answered: 0, size: 1 }, items: [{ position: 0, questionId: 'q1', version: '1', kind: 'quiz', optionOrder: ['o-wrong', 'o-right'], item: { id: 'q1', prompt: '왕을 쓰세요', q: '문제', options: [{ id: 'o-right', text: '정답' }, { id: 'o-wrong', text: '오답' }] }, result: null }] };
    const api = fakeApi({ signedIn: true, premium: { active: true }, replay }), w = dom(api), root = w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root, ctx(w, { view: 'replay/11111111-1111-4111-8111-111111111111' })); await settle();
    assert.equal(root.querySelectorAll('.is-correct,.right').length, 0);
    assert.ok(!/✓ 정답/.test(root.textContent));
    assert.equal(root.querySelector('#acCheck').disabled, true);
    root.querySelector('.ac-choice[data-option="o-wrong"]').click(); await settle();
    assert.equal(root.querySelector('.ac-choice[data-option="o-wrong"]').getAttribute('aria-checked'), 'true');
    root.querySelector('#acCheck').click(); await settle();
    assert.deepEqual(api.log.find(x => x[0] === 'answer').slice(2), [0, 'o-wrong', 'rp-test-0001']);
    assert.match(root.textContent, /× 틀렸어요/);
    assert.ok(root.querySelector('.qc-option-brief'));
    assert.equal(root.querySelector('.mock-review details'), null, '긴 상세 해설을 펼치지 않음');
  });
  /* 계정이 바뀌는 상황을 흉내 내는 가짜 창구: state·onChange·계정별 풀이 기록 */
  function switchingApi(active=false) {
    const users = { uA: { id: 'uA', email: 'a@x.test', displayName: 'A', createdAt: '2026-10-08T00:00:00Z' }, uB: { id: 'uB', email: 'b@x.test', displayName: 'B', createdAt: '2026-10-08T00:00:00Z' } };
    const hist = { uA: [{ id: 'h-a', questionId: 'exam-70-01', kind: 'mock', correct: false, source: 'practice', createdAt: '2026-10-08T00:00:00Z' }], uB: [{ id: 'h-b', questionId: 'exam-71-02', kind: 'mock', correct: true, source: 'practice', createdAt: '2026-10-08T00:00:00Z' }] };
    const st = { enabled: true, status: 'online', signedIn: true, user: users.uA, premium: { active: active } };
    const ls = [];
    const api = Object.assign(fakeApi({ signedIn: true }), {
      state: () => JSON.parse(JSON.stringify(Object.assign({}, st, { ownerId: st.user ? st.user.id : null }))),
      onChange: (f) => { ls.push(f); return () => {}; },
      me: () => Promise.resolve({ user: st.user, premium: st.premium }),
      attempts: () => Promise.resolve({ items: st.user ? hist[st.user.id] : [], next: null }),
      logout: () => { st.signedIn = false; st.user = null; ls.forEach(f => f(api.state())); return Promise.resolve({ serverRevoked: api.revokeOk }); },
      switchTo: (id) => { st.user = users[id]; st.signedIn = true; ls.forEach(f => f(api.state())); },
      revokeOk: true,
    });
    return api;
  }
  await t('계정이 바뀌면(다른 탭 로그인) 이전 계정의 서버 기록을 지우고 새 계정 것만 보인다', async () => {
    const api = switchingApi(), w = dom(api), root = w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root, ctx(w, { view: 'notes' })); await settle();
    assert.match(root.querySelector('.ac-hist').textContent, /제70회 1번/);
    api.switchTo('uB');
    // jsdom 창의 배열은 Node와 다른 realm이라 길이·내용으로 비교한다
    assert.equal(w.HanqAccountUI._ui.hist.length, 0, '이전 계정의 기록 캐시는 바로 비움');
    assert.equal(w.HanqAccountUI._ui.histCursor, null);
    await w.HanqAccountUI.render(root, ctx(w, { view: 'notes' })); await settle();
    assert.match(root.querySelector('.ac-hist').textContent, /제71회 2번/);
    assert.doesNotMatch(root.textContent, /제70회 1번/);
    assert.match(root.textContent, /b@x\.test/);
  });
  await t('내 계정 화면이 보이는 채로 계정이 바뀌면: 곧바로 A의 내용을 지우고, 다시 render를 부르지 않아도 B로 다시 그린다', async () => {
    const api = switchingApi();
    let meCalls = 0;
    const base = api.me;
    api.me = (...a) => { meCalls++; return base(...a); };
    const w = dom(api), root = w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root, ctx(w)); await settle();
    assert.match(root.textContent, /a@x\.test/);
    const before = meCalls;
    api.switchTo('uB');
    assert.doesNotMatch(root.textContent, /a@x\.test/);
    assert.match(root.textContent, /계정이 바뀌었어요/);
    await settle();
    assert.match(root.textContent, /b@x\.test/);
    assert.doesNotMatch(root.textContent, /a@x\.test/);
    assert.match(root.querySelector('.ac-notice').textContent, /계정이 바뀌었어요/);
    assert.equal(meCalls - before, 1, 'B의 내 정보는 한 번만');
    assert.equal(w.__went, undefined);
    await settle();
    assert.equal(meCalls - before, 1);
  });
  await t('다시 풀기 화면을 연 채로 계정이 바뀌면 그 화면을 닫고 안내한다', async () => {
    const replay = { replay: { id: '22222222-2222-4222-8222-222222222222', order: 'recent', answered: 0, size: 1 }, items: [{ position: 0, questionId: 'q1', version: '1', kind: 'quiz', optionOrder: ['o1', 'o2'], item: { id: 'q1', prompt: '', q: '문제', options: [{ id: 'o1', text: '하나' }, { id: 'o2', text: '둘' }] }, result: null }] };
    const api = Object.assign(switchingApi(true), { replay: () => Promise.resolve(replay) }), w = dom(api), root = w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root, ctx(w, { view: 'replay/22222222-2222-4222-8222-222222222222' })); await settle();
    root.querySelector('.ac-choice[data-option="o2"]').click(); await settle();
    assert.equal(w.HanqAccountUI._ui.replaySel['22222222-2222-4222-8222-222222222222:0'], 'o2');
    api.switchTo('uB');
    assert.equal(w.__went, 'notes');
    assert.deepEqual(Object.keys(w.HanqAccountUI._ui.replaySel), [], 'A가 고른 답은 B에게 남지 않음');
    assert.deepEqual(Object.keys(w.HanqAccountUI._ui.replaySubs), [], 'A의 제출 번호도 B에게 남지 않음');
  });
  await t('로그아웃 결과를 정직하게(헤더 단추 → HanqAccountUI.logout): 지운 화면 기능을 가리키지 않는다', async () => {
    const api = switchingApi(); api.revokeOk = false;
    const w = dom(api), root = w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root, ctx(w)); await settle();
    assert.equal(root.querySelector('#acLogout,#acLogoutAll'), null, '마이페이지에 로그아웃 단추 없음');
    await w.HanqAccountUI.logout(); await w.HanqAccountUI.render(root, ctx(w)); await settle();
    assert.match(root.textContent, /서버에 알리지 못했어요/);
    assert.doesNotMatch(root.textContent, /서버의 이 로그인도 끝냈어요|모든 기기에서 로그아웃/);
    const api2 = switchingApi(), w2 = dom(api2), r2 = w2.document.getElementById('acRoot');
    await w2.HanqAccountUI.render(r2, ctx(w2)); await settle();
    await w2.HanqAccountUI.logout(); await w2.HanqAccountUI.render(r2, ctx(w2)); await settle();
    assert.match(r2.textContent, /서버의 이 로그인도 끝냈어요/);
  });
  await t('다시 풀기: 라벨 붙은 바로 가기로 문제를 고르고, 고르기만으로는 채점하지 않는다', async () => {
    const mk = (i) => ({ position: i, questionId: 'q' + i, version: '1', kind: 'quiz', optionOrder: ['a' + i, 'b' + i], item: { id: 'q' + i, prompt: '', q: '문제 ' + i, options: [{ id: 'a' + i, text: '가' }, { id: 'b' + i, text: '나' }] }, result: null });
    const replay = { replay: { id: '33333333-3333-4333-8333-333333333333', order: 'recent', answered: 0, size: 3 }, items: [mk(0), mk(1), mk(2)] };
    const api = fakeApi({ signedIn: true, premium: { active: true }, replay }), w = dom(api), root = w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root, ctx(w, { view: 'replay/33333333-3333-4333-8333-333333333333' })); await settle();
    const sel = root.querySelector('#acRpJump');
    assert.ok(sel && root.querySelector('label[for="acRpJump"]'));
    sel.value = '2'; sel.dispatchEvent(new w.Event('change')); await settle();
    assert.match(root.querySelector('.ac-pos').textContent, /^3 \/ 3/);
    root.querySelector('.ac-choice[data-option="b2"]').click(); await settle();
    assert.equal(api.log.filter(x => x[0] === 'answer').length, 0, '고르기만으로는 서버 채점 요청을 보내지 않음');
    assert.equal(root.querySelector('.ac-choice[data-option="b2"]').getAttribute('aria-checked'), 'true');
  });
  function gated() { let release; const p = new Promise((r) => { release = r; }); return { p, release: (v) => release(v) }; }
  await t('오답 시험: 상단 제출·계정 복귀 없음, 마지막 하단 다음만 제출로 바뀌며 저장·확인·중복 제출 보호', async () => {
    const RID = '66666666-6666-4666-8666-666666666666', submitted = gated(), answer = gated();
    const data = { run: { id:RID, title:'오답 시험', status:'active', durationMs:1800000, durationPolicy:'practice', selection:{}, serverTime:new Date().toISOString(), startedAt:new Date().toISOString(), endsAt:new Date(Date.now()+600000).toISOString() }, items:[0,1,2].map(i=>({position:i,questionId:'q'+i,version:'1',kind:'quiz',optionOrder:['o1','o2'],item:{id:'q'+i,q:'문제 '+i,options:[{id:'o1',text:'가'},{id:'o2',text:'나'}]},answerOptionId:null,result:null})) };
    let count=0;
    let saves=0;const api=Object.assign(fakeApi({signedIn:true,premium:{active:true}}),{run:async()=>data,answerRun:(id,pos,opt)=>{saves++;data.items[pos].answerOptionId=opt;return answer.p;},submitRun:()=>{count++;return submitted.p;}});
    const w=dom(api),root=w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root,ctx(w,{view:'study/'+RID}));await settle();
    assert.equal(root.querySelector('#acSubmit'),null);assert.equal(root.querySelector('.rc-tools'),null);assert.equal(root.querySelector('#acBackMain'),null);
    assert.match(root.querySelector('.quiz-nav #acNext').textContent,/다음/);root.querySelector('#acNext').click();await settle();
    assert.equal(root.querySelector('#acSubmit'),null);root.querySelector('#acNext').click();await settle();
    assert.equal(root.querySelector('#acNext'),null);assert.equal(root.querySelector('.quiz-nav #acSubmit').textContent,'제출하기');
    root.querySelector('.ac-choice[data-option="o2"]').click();await settle();assert.equal(saves,0,'고르기만으로는 저장 요청 없음');assert.equal(root.querySelector('#acSubmit').disabled,false);
    root.querySelector('#acSubmit').click();await settle();assert.equal(saves,1,'제출하기가 먼저 마지막 답을 저장');assert.equal(root.querySelector('#acSubmit').disabled,true);assert.equal(root.querySelector('#acCfYes'),null,'저장 확인 전 제출 확인 없음');
    answer.release(data);await settle();
    assert.match(root.querySelector('#acCfD').textContent,/답하지 않은 문제 2개/);
    root.querySelector('#acCfNo').click();await settle();assert.equal(root.querySelector('#acCfYes'),null);assert.equal(root.querySelector('#acSubmit').disabled,false);
    root.querySelector('#acSubmit').click();await settle();const yes=root.querySelector('#acCfYes');yes.click();yes.dispatchEvent(new w.Event('click'));await settle();assert.equal(count,1);assert.equal(root.querySelector('#acCfNo').disabled,true);
    data.run.status='final';data.run.finalAt=new Date().toISOString();data.run.finalReason='submitted';data.run.score={correct:0,wrong:3,unanswered:2,rewardEligible:false};
    submitted.release(data);await settle();assert.ok(root.querySelector('.ac-run[data-status="final"]'));assert.match(root.textContent,/미응답 2/);
  });
  await t('오답 시험: 마지막 버튼 변경과 무관하게 서버 마감이 지나면 서버 회차를 다시 읽어 자동 종료 결과를 표시', async () => {
    const RID='77777777-7777-4777-8777-777777777777',now=new Date().toISOString();
    const data={run:{id:RID,title:'오답 시험',status:'active',durationMs:1800000,selection:{},serverTime:now,startedAt:now,endsAt:new Date(Date.now()-1000).toISOString()},items:[{position:0,questionId:'q1',version:'1',kind:'quiz',optionOrder:['o1'],item:{id:'q1',q:'문제',options:[{id:'o1',text:'가'}]},answerOptionId:null,result:null}]};
    let reads=0,submits=0,clockTick;
    const api=Object.assign(fakeApi({signedIn:true,premium:{active:true}}),{run:async()=>{if(++reads>1){data.run.status='final';data.run.finalAt=now;data.run.finalReason='expired';data.run.score={correct:0,wrong:1,unanswered:1,rewardEligible:false};}return data;},submitRun:()=>{submits++;throw Error('no manual submit');}});
    const w=dom(api),root=w.document.getElementById('acRoot');w.setInterval=fn=>{clockTick=fn;return 1;};w.clearInterval=()=>{};
    await w.HanqAccountUI.render(root,ctx(w,{view:'study/'+RID}));await settle();assert.ok(root.querySelector('.ac-run[data-status="active"]'));
    clockTick();await settle();assert.equal(reads,2);assert.equal(submits,0);assert.ok(root.querySelector('.ac-run[data-status="final"]'));assert.match(root.textContent,/자동 채점/);
  });
  await t('모의고사: 답 저장 응답이 오기 전에 화면을 떠나면, 늦은 응답이 모의고사 화면을 다시 그리지 않는다', async () => {
    const RID = '44444444-4444-4444-8444-444444444444';
    const mkRun = (ans) => ({ run: { id: RID, title: '1회차 오답 미니모의고사', status: 'active', durationMs: 1800000, durationPolicy: 'practice', selection: {}, serverTime: new Date().toISOString(), endsAt: new Date(Date.now() + 600000).toISOString() },
      items: [{ position: 0, questionId: 'q1', version: '1', kind: 'quiz', optionOrder: ['o1', 'o2'], item: { id: 'q1', prompt: '', q: '문제', options: [{ id: 'o1', text: '가' }, { id: 'o2', text: '나' }] }, answerOptionId: ans, result: null }] });
    const g = gated();
    const api = Object.assign(fakeApi({ signedIn: true, premium: { active: true } }), { run: () => Promise.resolve(mkRun(null)), answerRun: () => g.p });
    const w = dom(api), root = w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root, ctx(w, { view: 'study/' + RID })); await settle();
    assert.ok(root.querySelector('.ac-run[data-status="active"]'));
    root.querySelector('.ac-choice[data-option="o2"]').click(); await settle();
    root.querySelector('#acSubmit').click(); await settle(); // 저장은 이동·제출 때만(고르기만으로는 요청 없음)
    await w.HanqAccountUI.render(root, ctx(w, { view: 'main' })); await settle();
    assert.ok(root.querySelector('#acMeTitle'));
    g.release(mkRun('o2')); await settle();
    assert.equal(root.querySelector('.ac-run'), null, '떠난 모의고사 화면이 되살아나지 않음');
    assert.ok(root.querySelector('#acMeTitle'));
  });
  await t('다시 풀기: 채점 응답이 오기 전에 화면을 떠나면, 늦은 응답이 다시 풀기 화면을 다시 그리지 않는다', async () => {
    const PID = '55555555-5555-4555-8555-555555555555';
    const replay = { replay: { id: PID, order: 'recent', answered: 0, size: 1 }, items: [{ position: 0, questionId: 'q1', version: '1', kind: 'quiz', optionOrder: ['o1', 'o2'], item: { id: 'q1', prompt: '', q: '문제', options: [{ id: 'o1', text: '가' }, { id: 'o2', text: '나' }] }, result: null }] };
    const g = gated(); let replayCalls = 0;
    const api = Object.assign(fakeApi({ signedIn: true, premium: { active: true }, replay }), { replay: () => { replayCalls++; return Promise.resolve(replay); }, answerReplay: () => g.p });
    const w = dom(api), root = w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root, ctx(w, { view: 'replay/' + PID })); await settle();
    root.querySelector('.ac-choice[data-option="o1"]').click(); await settle();
    root.querySelector('#acCheck').click(); await settle();
    await w.HanqAccountUI.render(root, ctx(w, { view: 'main' })); await settle();
    const before = replayCalls;
    g.release({}); await settle();
    assert.equal(root.querySelector('.ac-replay'), null);
    assert.ok(root.querySelector('#acMeTitle'));
    assert.equal(replayCalls, before, '떠난 뒤에는 다시 풀기를 다시 불러오지도 않음');
  });
  await t('회원 퀴즈 저장과 게스트·실전 모의 기기 기록을 구분한다', async () => {
    const w = dom(fakeApi({ signedIn: true })), root = w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root, ctx(w, { view: 'notes' })); await settle();
    const all = root.textContent + w.HanqAccountUI.notesBannerHtml();
    assert.doesNotMatch(all, /서버에도 쌓여요|서버에도 남아요/);
    assert.match(root.textContent, /회원 기록으로 제출한 퀴즈/);
    // 기능 이름은 ‘퀴즈’(예전 ‘빈칸’ 이름이 계정 화면에 남지 않음)
    assert.doesNotMatch(root.textContent + w.HanqAccountUI.notesBannerHtml(), /빈칸/);
    const w2 = dom(fakeApi({})); await w2.HanqAccountUI.render(w2.document.getElementById('acRoot'), ctx(w2)); await settle();
    assert.match(w2.HanqAccountUI.notesBannerHtml(), /무료 체험은 이 기기에, 프리미엄 풀이는 회원 기록에 저장돼요/);
    assert.doesNotMatch(html, /로그인한 퀴즈 답안은 서버에 저장/);
  });
  await t('오류 문구는 고정된 한국어(서버의 원문·내부 값을 그대로 내지 않음)', () => {
    const w = dom(null);
    assert.match(w.HanqAccountUI._errMsg({ code: 'premium_required' }), /프리미엄/);
    assert.equal(w.HanqAccountUI._errMsg({ code: '<img src=x onerror=alert(1)>' }).includes('<img'), false);
  });
  await t('파트 수는 서버 고유 수이며 노트 입장은 시험을 시작하지 않고 연습 연타를 막는다',async()=>{
    const api=fakeApi({signedIn:true,premium:{active:true}});let starts=0,resolve,calls=[];
    api.wrongParts=async()=>({total:21,parts:[{id:'ancient',label:'고대사',count:21},{id:'goryeo',label:'고려',count:0}]});
    api.study=async()=>{starts++;throw Error('must be explicit');};
    api.createReplay=body=>{calls.push(body);return new Promise(r=>resolve=r);};
    const w=dom(api),root=w.document.getElementById('acRoot');
    await w.HanqAccountUI.render(root,ctx(w,{view:'notes'}));await settle();
    assert.equal(starts,0);assert.match(root.textContent,/21/);assert.equal(root.querySelector('[data-part="goryeo"]').disabled,true);
    const b=root.querySelector('[data-part="ancient"]');b.click();b.click();assert.equal(calls.length,1);assert.deepEqual(JSON.parse(JSON.stringify(calls[0])),{list:'all',order:'random',era:'ancient',size:100});
    resolve({replay:{id:'fixture-replay'}});await settle();assert.equal(w.__went,'replay/fixture-replay');
    await w.HanqAccountUI.render(root,ctx(w,{view:'notes'}));await settle();root.querySelector('[data-part="ancient"]').click();assert.equal(calls.length,2,'re-entry can start a new practice');resolve({replay:{id:'fixture-again'}});await settle();
  });
  done();

  function done() { console.log('\n검사 ' + checks + '개 · 실패 ' + failures + '개'); process.exit(failures ? 1 : 0); }
})();
