/* 연결 복구 회귀: iOS에서 헤더만 오고 본문이 멈추면 ‘오프라인 안내 + 불러오는 중’이 영원히 남던 문제.
 * 가짜 시계(window.setTimeout)와 가짜 fetch(AbortController를 무시함)로 api-client raw()와 account-ui renderMain을 함께 본다.
 * 실행: HANQ_JSDOM_PATH=<jsdom> node scripts/test-connection-recovery.cjs
 */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const { JSDOM } = require(process.env.HANQ_JSDOM_PATH || 'jsdom');
let checks = 0;
const ok = (v, n) => { assert(v, n); checks++; };
const flush = async () => { for (let i = 0; i < 30; i++) await new Promise(r => setImmediate(r)); };
const read = f => fs.readFileSync(path.join(__dirname, '../media', f), 'utf8');

const USER = { id: 'u1', email: 'a@example.test', displayName: '한동', createdAt: '2026-01-01T00:00:00Z' };
const ME = { user: USER, premium: { active: false }, growth: { points: 3 }, access: { total: 2, today: false } };
const PREMIUM_ME = { ...ME, premium: { active: true, expiresAt: '2026-12-31T00:00:00Z' } };
const SESSION = { accessToken: 'tok', accessTokenExpiresAt: '2099-01-01T00:00:00Z', user: USER };
const PLAN = { plan: { periodPolicy: 'fixed-days', fixedDays: 30 }, checkout: { available: false } };
const HIST = { items: [{ createdAt: '2026-10-01T00:00:00Z', correct: true, kind: 'quiz', questionId: 'q1', source: 'practice' }], next: null };

/* 응답 모양 */
const never = () => new Promise(() => {});
function res(status, body, o = {}) {
  return { ok: status >= 200 && status < 300, status, headers: { get: k => (k.toLowerCase() === 'content-type' ? (o.type || 'application/json') : null) },
    text: o.text || (() => Promise.resolve(body == null ? '' : JSON.stringify(body))), blob: o.blob || (() => Promise.resolve({ blob: true })) };
}
const json = (body, status = 200) => () => Promise.resolve(res(status, body));
const stallBody = () => () => Promise.resolve(res(200, null, { text: never }));
const failBody = () => () => Promise.resolve(res(200, null, { text: () => Promise.reject(new TypeError('Load failed')) }));
const httpErr = (status, code) => () => Promise.resolve(res(status, { error: { code } }));

function setup(o = {}) {
  const dom = new JSDOM('<main id="c"></main>', { runScripts: 'outside-only', url: 'https://hanq.example.test/' }), w = dom.window;
  let now = 0, seq = 0; const timers = new Map();
  w.setTimeout = (fn, ms) => { const id = ++seq; timers.set(id, { fn, at: now + (ms || 0) }); return id; };
  w.clearTimeout = id => { timers.delete(id); };
  const advance = async ms => {
    const end = now + ms;
    for (;;) { let id = null, t = null; timers.forEach((v, k) => { if (v.at <= end && (!t || v.at < t.at)) { id = k; t = v; } }); if (!t) break; timers.delete(id); now = t.at; t.fn(); await flush(); }
    now = end; await flush();
  };
  const routes = Object.assign({}, o.routes), calls = [], signals = [];
  const fetch = (url, init) => {
    const p = url.replace('https://api.example.test', '').split('?')[0], key = init.method + ' ' + p;
    calls.push(key); signals.push(init.signal);
    const h = routes[key];
    if (!h) return Promise.reject(new TypeError('no route ' + key));
    if (typeof h === 'function') return h(init);
    return h.shift()(init); // 순서대로 다른 응답
  };
  if (o.hint) w.localStorage.setItem('hanqacct:signedIn', '1');
  w.localStorage.setItem('hanq:quiz:progress', '{"q1":"o2"}'); // 게스트 학습 기록(읽기 전용이어야 함)
  // 앱의 캐릭터 모듈 대역: 서버가 성장 정보를 다 줬을 때만 확인됨
  w.HanqCharacters = { confirmed: st => st.profileStatus === 'ready', premium: st => !!(st.premium && st.premium.active), mount: () => {}, stop: () => {} };
  w.eval(read('api-client.js'));
  w.eval(read('account-ui.js'));
  const api = w.HanqApi.create({ base: 'https://api.example.test', fetch, storage: w.localStorage, locks: null, crypto: null });
  w.HanqApi = api;
  const statuses = []; api.onChange(s => statuses.push(s.status));
  const c = w.document.querySelector('#c'), gone = [];
  const ctx = view => ({ view, go: v => gone.push(v), local: { attempts: () => [] }, eraTitle: () => '' });
  const q = s => c.querySelector(s), txt = () => c.textContent;
  return { dom, w, api, routes, calls, signals, statuses, timers, advance, c, ctx, q, txt, gone, close: () => dom.window.close() };
}

async function rawSuite() {
  // 1) 헤더는 왔는데 본문이 끝나지 않음 → 15초 뒤 timeout · offline, 타이머 정리
  let t = setup({ routes: { 'GET /api/v1/premium/plan': stallBody() } });
  let err = null; t.api.plan().catch(e => { err = e; }); await flush();
  ok(!err && t.timers.size === 1, 'headers received: deadline still armed while body pending');
  await t.advance(14999); ok(!err, 'not timed out early');
  await t.advance(1); ok(err && err.code === 'timeout' && err.status === 0 && t.api.state().status === 'offline', 'stalled body times out as timeout/offline');
  ok(t.timers.size === 0 && t.signals[0] && t.signals[0].aborted, 'timer cleared and native request aborted');
  ok(!t.statuses.includes('online'), 'headers alone never reported online');
  t.close();

  // 2) 본문 읽기 실패(iOS ‘Load failed’) → network · offline
  t = setup({ routes: { 'GET /api/v1/premium/plan': failBody() } });
  err = null; await t.api.plan().catch(e => { err = e; });
  ok(err.code === 'network' && err.status === 0 && t.api.state().status === 'offline' && t.timers.size === 0, 'body read failure maps to network/offline and clears timer');
  t.close();

  // 3) 진짜 HTTP 오류는 원래 코드 + 연결됨
  t = setup({ routes: { 'GET /api/v1/premium/plan': httpErr(503, 'schema_not_ready') } });
  err = null; await t.api.plan().catch(e => { err = e; });
  ok(err.code === 'schema_not_ready' && err.status === 503 && t.api.state().status === 'online' && t.timers.size === 0, 'HTTP 503 schema_not_ready stays server error, connected');
  t.close();
  t = setup({ hint: true, routes: { 'POST /api/v1/auth/refresh': httpErr(401, 'invalid_refresh') } });
  ok(await t.api.refresh() === false && t.api.state().sessionError === 'invalid_refresh' && t.api.state().status === 'online', 'refresh 401 keeps invalid_refresh code and online');
  ok(t.calls.length === 1, 'refresh not retried');
  t.close();

  // 4) 이미지(바이너리): 헤더 OK · blob 멈춤 → timeout. AbortController를 무시하는 fetch에서도 끝남. 콘텐츠 유형 검사 유지
  t = setup({ routes: { 'POST /api/v1/auth/signin': json(SESSION), 'GET /api/v1/me': json(ME) } });
  await t.api.signin('a@example.test', 'pw-0123456789');
  const img = '/api/v1/cbt/runs/00000000-0000-4000-8000-000000000001/questions/3/image';
  t.routes['GET ' + img] = () => Promise.resolve(res(200, null, { type: 'image/webp', blob: never }));
  err = null; t.api.cbtImage(img).catch(e => { err = e; }); await flush();
  await t.advance(15000); ok(err && err.code === 'timeout' && t.api.state().status === 'offline', 'binary blob stall times out');
  t.routes['GET ' + img] = () => Promise.resolve(res(200, null, { type: 'text/html' }));
  err = null; await t.api.cbtImage(img).catch(e => { err = e; }); ok(err.code === 'invalid_image_response' && err.status === 502, 'binary content-type check preserved');
  t.routes['GET ' + img] = () => Promise.resolve(res(200, null, { type: 'image/webp; q=1', blob: () => Promise.resolve('BLOB') }));
  ok(await t.api.cbtImage(img) === 'BLOB' && t.api.state().status === 'online', 'binary success returns blob');
  t.close();

  // 5) 마감 뒤 늦게 끝난 응답은 결과도 'online'도 되살리지 못함 → 다음 요청이 성공해야 online
  t = setup();
  let release; t.routes['GET /api/v1/premium/plan'] = () => Promise.resolve(res(200, null, { text: () => new Promise(r => { release = r; }) }));
  let got = 'none'; err = null; t.api.plan().then(v => { got = v; }, e => { err = e; }); await flush();
  await t.advance(15000); ok(err && err.code === 'timeout', 'deadline wins');
  const seen = t.statuses.length; release(JSON.stringify(PLAN)); await flush();
  ok(got === 'none' && t.api.state().status === 'offline' && t.statuses.length === seen, 'late body completion does not resolve or set online');
  t.routes['GET /api/v1/premium/plan'] = json(PLAN);
  const again = await t.api.plan(); ok(again.plan.fixedDays === 30 && t.api.state().status === 'online' && t.timers.size === 0, 'successful retry sets online and clears timer');
  t.close();

  // 6) 쓰기는 자동 재시도하지 않고, 로그인 흔적은 연결 실패로 지우지 않음
  t = setup({ routes: { 'POST /api/v1/auth/signin': json(SESSION), 'GET /api/v1/me': json(ME), 'POST /api/v1/quiz/progress': stallBody() } });
  await t.api.signin('a@example.test', 'pw-0123456789');
  err = null; t.api.quizProgress([]).catch(e => { err = e; }); await flush(); await t.advance(15000);
  ok(err.code === 'timeout' && t.calls.filter(x => x === 'POST /api/v1/quiz/progress').length === 1, 'timed-out write sent once');
  ok(t.api.state().signedIn && t.w.localStorage.getItem('hanqacct:signedIn') === '1', 'session and sign-in hint kept on transport failure');
  t.close();
}

async function uiSuite() {
  // A) iOS 게스트: plan 본문이 멈춤(초기 확인 + 화면 불러오기 둘 다)
  let t = setup({ routes: { 'GET /api/v1/premium/plan': stallBody() } });
  const busy = () => t.c.getAttribute('aria-busy');
  t.w.HanqAccountUI.render(t.c, t.ctx('main')); await flush();
  ok(t.txt().includes('로그인 정보를 확인하고 있어요'), 'restoring status first');
  await t.advance(15000); // init의 plan 시간 초과 → renderMain
  ok(t.api.state().status === 'offline', 'offline after first timeout');
  ok(busy() === 'true' && t.c.querySelectorAll('[role="status"]').length === 1 && !t.q('.ac-conn.is-off') && t.q('.ac-loading'), 'loading shows one short status without offline paragraph');
  await t.advance(15000);
  ok(busy() === 'false' && !t.q('.ac-loading') && !t.txt().includes('불러오는 중'), 'loading and aria-busy cleared after failure');
  ok(t.c.querySelectorAll('.ac-conn.is-off').length === 1 && !!t.q('#acConnectionRetry') && !!t.q('#acAuthForm'), 'one offline notice, retry button, sign-in form still usable');
  ok(t.w.localStorage.getItem('hanq:quiz:progress') === '{"q1":"o2"}', 'guest study data untouched');
  const n = t.calls.length; await t.advance(120000); ok(t.calls.length === n, 'no automatic request loop while offline');
  t.routes['GET /api/v1/premium/plan'] = json(PLAN);
  t.q('#acConnectionRetry').click(); await flush();
  ok(t.calls.length === n + 1 && t.api.state().status === 'online' && t.txt().includes('서버 연결됨') && !t.q('#acConnectionRetry') && busy() === 'false', 'retry rerenders main view once and recovers');
  t.close();

  // B) 로그인 흔적 있는 사용자: me 503 schema_not_ready · 기록 본문 실패 → 거짓 ‘기록 없음’ 대신 실패 안내, 흔적 유지, 프로필 재시도
  t = setup({ hint: true, routes: {
    'POST /api/v1/auth/refresh': json(SESSION), 'GET /api/v1/premium/plan': json(PLAN),
    'GET /api/v1/me': [json(ME), httpErr(503, 'schema_not_ready'), json(ME), json(ME)],
    'GET /api/v1/attempts': [failBody(), json(HIST)] } });
  t.w.HanqAccountUI.render(t.c, t.ctx('main')); await flush(); await flush();
  ok(t.c.getAttribute('aria-busy') === 'false' && t.txt().includes('서버 저장소 설정이 완료되지 않아'), 'schema_not_ready keeps accurate wording');
  ok(!!t.q('#acProfileRetry') && !t.q('#acConnectionRetry'), 'existing profile retry kept, no duplicate retry');
  ok(!t.calls.includes('GET /api/v1/attempts') && !t.q('.ac-hist') && !t.txt().includes('풀이 기록'), 'minimal main page: no history request or hidden-panel failure');
  ok(t.txt().includes('미확인') && t.w.localStorage.getItem('hanqacct:signedIn') === '1' && t.api.state().signedIn, 'no fabricated attendance; hint and session kept');
  t.q('#acProfileRetry').click(); await flush();
  ok(t.txt().includes('누적 2일') && !t.q('#acProfileRetry'), 'profile retry recovers profile');
  t.w.HanqAccountUI.render(t.c, t.ctx('notes')); await flush(); await flush();
  ok(t.txt().includes('서버 풀이 기록을 불러오지 못했어요') && !t.txt().includes('아직 서버에 남은 풀이 기록이 없어요'), 'failed history (now on the notes route) is not shown as empty');
  t.close();

  // C) 오답노트(프리미엄): study 연결 실패 → 기존 재시도 경로
  t = setup({ hint: true, routes: {
    'POST /api/v1/auth/refresh': json(SESSION), 'GET /api/v1/premium/plan': json(PLAN), 'GET /api/v1/me': json(PREMIUM_ME),
    'GET /api/v1/wrong-notes': json({ counts: { unresolved: 0, resolved: 0 }, items: [] }), 'GET /api/v1/wrong-notes/replays': json({ replays: [] }),
    'GET /api/v1/runs': json({ runs: [] }), 'GET /api/v1/attempts': json(HIST),
    'POST /api/v1/wrong-notes/study': [failBody(), json({ run: null, reason: 'none' })] } });
  t.w.HanqAccountUI.render(t.c, t.ctx('notes')); await flush(); await flush();
  ok(t.txt().includes('서버에 연결하지 못했어요') && !!t.q('#acStudyRetry'), 'notes study failure shows retry');
  t.q('#acStudyRetry').click(); await flush(); await flush();
  ok(t.txt().includes('아직 틀린 문제가 없어요') && t.calls.filter(x => x === 'POST /api/v1/wrong-notes/study').length === 2, 'notes retry succeeds');
  t.close();

  // D) 사용자가 떠난 뒤 온 응답은 그리지 않음(다른 화면 render로 tok 증가 · 컨테이너 분리)
  t = setup({ routes: { 'GET /api/v1/premium/plan': [json(PLAN), stallBody(), json(PLAN)] } });
  t.w.HanqAccountUI.render(t.c, t.ctx('main')); await flush();
  ok(!!t.q('.ac-loading'), 'second load pending');
  t.w.HanqAccountUI.render(t.c, t.ctx('main')); await flush();
  const after = t.c.innerHTML; await t.advance(15000);
  ok(t.c.innerHTML === after && !t.q('#acConnectionRetry'), 'stale timed-out load does not overwrite newer view');
  t.routes['GET /api/v1/premium/plan'] = stallBody();
  t.q('#acModeUp').click(); await flush(); t.c.remove(); const left = t.c.innerHTML;
  await t.advance(15000); ok(t.c.innerHTML === left, 'response after leaving is suppressed');
  t.close();

  // E) 동기 예외: plan()이 던짐 · init()이 던짐 → 무한 대기 없이 재시도 단추
  t = setup({ routes: { 'GET /api/v1/premium/plan': json(PLAN) } });
  t.w.HanqAccountUI.render(t.c, t.ctx('main')); await flush();
  const realPlan = t.api.plan; t.api.plan = () => { throw new Error('boom'); };
  t.q('#acModeUp').click(); await flush();
  ok(t.c.getAttribute('aria-busy') === 'false' && !t.q('.ac-loading') && !!t.q('#acAuthForm'), 'sync plan throw settles main view');
  t.api.plan = realPlan;
  const realInit = t.api.init; t.api.init = () => { throw new Error('init boom'); };
  t.c.setAttribute('aria-busy', 'true');
  t.w.HanqAccountUI.render(t.c, t.ctx('main')); await flush();
  ok(t.c.getAttribute('aria-busy') === 'false' && !t.txt().includes('불러오는 중'), 'sync init throw does not hang');
  t.api.init = realInit;
  t.close();

  // F) 복원 실패 화면은 aria-busy를 끈다
  t = setup({ hint: true, routes: { 'POST /api/v1/auth/refresh': failBody() } });
  t.c.setAttribute('aria-busy', 'true');
  t.w.HanqAccountUI.render(t.c, t.ctx('main')); await flush();
  ok(!!t.q('#acRestoreRetry') && t.c.getAttribute('aria-busy') === 'false' && t.w.localStorage.getItem('hanqacct:signedIn') === '1', 'restore error clears busy and keeps hint');
  t.close();
}

(async () => {
  await rawSuite(); const raw = checks;
  console.log('raw() deadline/transport', raw, 'PASS');
  await uiSuite();
  console.log('account UI connection recovery', checks - raw, 'PASS');
})().catch(e => { console.error(e); process.exit(1); });
