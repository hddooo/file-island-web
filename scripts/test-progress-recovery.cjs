#!/usr/bin/env node
/* 퀴즈·기출 기록 읽기 복구 · 채점 판정 · 간단 풀이 — 실제 index.html(jsdom) + 창 안의 가짜 서버만(네트워크·실제 계정·토큰 없음).
 *   JSDOM_PATH=/path/to/node_modules/jsdom node scripts/test-progress-recovery.cjs
 * 시간: 창의 setTimeout에서 1초 이상인 지연만 1/50로 줄인다(6초 안내 → 120ms, 2초 넘김 → 40ms, API 15초 제한 → 300ms). 창은 finally에서 닫는다. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const ROOT = path.resolve(__dirname, '..');
const { JSDOM, ResourceLoader, VirtualConsole } = require(process.env.JSDOM_PATH || 'jsdom');
let checks = 0, failures = 0;
const windows = [], errs = [];
async function t(name, fn) { checks++; try { await fn(); } catch (e) { failures++; console.log('  ✗ ' + name + '\n    ' + String(e && e.message).split('\n').slice(0, 4).join('\n    ')); } }
const J = x => JSON.stringify(x), same = (a, b, m) => assert.equal(J(a), J(b), m);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const tick = async (ms = 0) => { await sleep(ms); for (let i = 0; i < 12; i++) await new Promise(r => setImmediate(r)); };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

const ctx = { window: {} }; vm.createContext(ctx);
for (const f of ['media/quiz-catalog.js', 'media/exam-pool.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
const API_OLD=JSON.parse(JSON.stringify(ctx.window.HANQ_QUIZ_CATALOG.questions));
for(const f of ['media/era-recall-quiz.js','media/era-recall-integration.js','media/reviewed-quiz.js','media/reviewed-quiz-integration.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx);
const QC = ctx.window.HANQ_QUIZ_CATALOG, EP = ctx.window.HANQ_EXAM_POOL;
const ERA = 'goryeo', FREE_Q = QC.chapters[ERA].pool.slice(0, 5), FREE_M = EP.eras[ERA].pool.slice(0, 5);
const correctOpt = id => QC.questions[id].options.find(o => o.correct).id, wrongOpt = id => QC.questions[id].options.find(o => !o.correct).id;
const USER = { A: { id: '11111111-1111-4111-8111-111111111111', email: 'a@example.test', displayName: 'A', createdAt: '2026-10-01T00:00:00Z' }, B: { id: '22222222-2222-4222-8222-222222222222', email: 'b@example.test', displayName: 'B', createdAt: '2026-10-01T00:00:00Z' } };

class FileLoader extends ResourceLoader { fetch(url) { const u = new URL(url); if (u.hostname !== 'hanq.test') return null; const f = path.join(ROOT, decodeURIComponent(u.pathname)); if (!/\.js$/.test(f) || !fs.existsSync(f)) return null; return Promise.resolve(fs.readFileSync(f)); } }

/* srv: null → intended offline/guest mode. Otherwise a scripted fake server: srv.user, srv.premium, srv.progress(kind, body) → Promise<{status, body}|'network'>,
   srv.attempt(body) → same, srv.refresh() → same (default 200). Every request is logged (method + path + body) for assertions. */
async function open(hash, srv, o = {}) {
  let src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (!srv) src = src.replace(/<meta name="hanq-api-base" content="[^"]*">/, '<meta name="hanq-api-base" content="">');
  const vc = new VirtualConsole(); vc.on('jsdomError', e => errs.push(e.message));
  const log = [], scrolls = [];
  const d = new JSDOM(src, { url: 'https://hanq.test/index.html' + hash, runScripts: 'dangerously', resources: new FileLoader(), pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      const st = w.setTimeout.bind(w); w.setTimeout = (fn, ms, ...a) => st(fn, ms >= 1000 ? Math.round(ms / 50) : ms, ...a);
      w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function (opt) { scrolls.push(opt && opt.behavior); };
      w.matchMedia = q => ({ matches: !!o.reducedMotion && /reduce/.test(q), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      if (!srv) return;
      w.localStorage.setItem('hanqacct:signedIn', '1');
      const reply = (status, body) => ({ ok: status < 400, status, headers: { get: () => 'application/json' }, text: () => Promise.resolve(JSON.stringify(body)) });
      const run = r => Promise.resolve(r).then(x => x === 'network' ? Promise.reject(new TypeError('Failed to fetch')) : x === 'hang' ? new Promise(() => {}) : reply(x.status, x.body));
      w.fetch = (url, init) => {
        const p = new URL(url).pathname, body = init.body ? JSON.parse(init.body) : null; log.push({ m: init.method, p, body });
        const u = USER[srv.user || 'A'];
        if (p.endsWith('/premium/plan')) return run({ status: 200, body: { plan: {}, checkout: { available: false } } });
        if (p.endsWith('/auth/refresh')) return run(srv.refresh ? srv.refresh() : { status: 200, body: { accessToken: 'test-' + (srv.user || 'A'), accessTokenExpiresAt: '2099-01-01T00:00:00Z', user: u } });
        if (p.endsWith('/auth/signin')) return run({ status: 200, body: { accessToken: 'test-' + (srv.user || 'A'), accessTokenExpiresAt: '2099-01-01T00:00:00Z', user: u } });
        if (p.endsWith('/auth/logout')) return run({ status: 200, body: {} });
        if (p.endsWith('/me')) return run({ status: 200, body: { user: u, premium: { active: !!srv.premium, expiresAt: srv.premium ? '2099-01-01T00:00:00Z' : null }, growth: { points: 1000 }, access: { total: 1, today: true, freeSlots: [...FREE_Q.map(id => ({ chapter: ERA, kind: 'quiz', question_id: id })), ...FREE_M.map(id => ({ chapter: ERA, kind: 'mock', question_id: id }))] } } });
        if (p.endsWith('/questions')) return run(srv.catalog ? srv.catalog(new URL(url).searchParams.get('after')) : {status:404,body:{error:{code:'not_found'}}});
        if (p.endsWith('/quiz/progress')) return run(srv.progress('quiz', body));
        if (p.endsWith('/mock/progress')) return run(srv.progress('mock', body));
        if (p.endsWith('/attempts') && init.method === 'POST') return run(srv.attempt(body));
        return run({ status: 404, body: { error: { code: 'not_found' } } });
      };
    } });
  windows.push(d);
  await new Promise(r => d.window.addEventListener('load', r));
  await tick(20); await tick(20);
  const doc = d.window.document;
  return { d, w: d.window, doc, log, scrolls,
    q: s => doc.querySelector(s), qa: s => [...doc.querySelectorAll(s)],
    qid: () => { const x = doc.querySelector('#quiz [data-question]'); return x && x.getAttribute('data-question'); },
    notice: () => { const n = doc.querySelector('#quizReadNotice'); return n && !n.hidden ? n.textContent : ''; },
    pick: async (optionId) => { doc.querySelector('#quiz .qchoice[data-option="' + optionId + '"]').click(); await tick(); },
    check: async () => { doc.querySelector('#checkAnswer').click(); await tick(); },
    next: async () => { doc.querySelector('#nextQuestion').click(); await tick(); },
    prev: async () => { doc.querySelector('#prevQuestion').click(); await tick(); },
    attempts: () => log.filter(x => x.m === 'POST' && x.p.endsWith('/attempts')),
    close: () => d.window.close() };
}
const unanswered = body => ({ status: 200, body: { items: body.questions.map(x => ({ questionId: x.questionId, version: x.version, answered: false, optionId: null, correct: null, answeredAt: null })), total: body.questions.length, answered: 0 } });
const answeredRow = (x, optionId, correct) => ({ questionId: x.questionId, version: x.version, answered: true, optionId, correct, answeredAt: '2026-10-08T00:00:00Z' });
const grade = body => { const q = QC.questions[body.questionId] || EP.questions[body.questionId]; const ok = !!q.options.find(o => o.id === body.optionId && o.correct) || !!(EP.questions[body.questionId] && body.optionId === body.questionId + '-option-' + EP.questions[body.questionId].answer); return { status: 201, body: { attempt: { id: 'att-' + body.submissionId, submissionId: body.submissionId, questionId: body.questionId, version: body.version, optionId: body.optionId, correct: ok, createdAt: '2026-10-09T00:00:00Z' }, replayed: false, review: {}, growth: { delta: ok ? 1 : -1, points: ok ? 1001 : 999 } } }; };

(async () => {
  try {
    console.log('\n■ 기록 읽기 복구 · 채점 판정 · 간단 풀이');
    await t('기록 읽기가 끝나지 않아도 무료 회원은 허용된 5문항을 바로 고르고 넘길 수 있다(완료·총계 단정 없음)', async () => {
      const read = deferred(), o = await open('#chapter/' + ERA + '/quiz', { progress: () => read.promise, attempt: grade });
      assert.ok(o.qid(), '문제가 바로 보임');
      assert.match(o.notice(), /풀이 기록 확인 중 · 문제는 계속 풀 수 있어요/);
      assert.equal(o.qa('#quizJump option[value]:not([value=""])').length, 5, '무료 5문항 범위');
      assert.ok(FREE_Q.includes(o.qid()));
      await o.pick(wrongOpt(o.qid()));
      assert.equal(o.q('#quiz .qchoice[aria-checked="true"]').getAttribute('data-option'), wrongOpt(o.qid()));
      for (let i = 0; i < 6; i++) await o.next();
      assert.equal(o.qid(), FREE_Q[4], '끝에서 멈춤');
      assert.equal(o.q('#nextQuestion').disabled, true, '기록 모를 때 마지막에서 결과 화면으로 가지 않음');
      assert.match(o.q('#quizScore').textContent, /서버 기록 확인 전/);
      assert.ok(!o.q('.result-screen'));
      await tick(200);
      assert.match(o.notice(), /늦어지고 있어요/, '6초 뒤 늦어짐 안내 + 다시 확인');
      assert.ok(o.q('#quizReadRetry'));
      o.close();
    });
    for (const [label, reply, re] of [
      ['503 schema_not_ready', { status: 503, body: { error: { code: 'schema_not_ready' } } }, /서버가 기록을 잠시 불러오지 못했어요/],
      ['500', { status: 500, body: { error: { code: 'internal_error' } } }, /서버가 기록을 잠시 불러오지 못했어요/],
      ['network', 'network', /인터넷 연결이 끊겨/],
      ['timeout', 'hang', /서버 응답이 늦어/],
      ['409 stale scope', { status: 409, body: { error: { code: 'stale_quiz_scope' } } }, /문제 내용이 새로 바뀌어/],
      ['401 after refresh', { status: 401, body: { error: { code: 'invalid_token' } } }, /로그인 상태를 확인하지 못했어요/],
      ['invalid shape', { status: 200, body: { items: [] } }, /올바르지 않았어요/],
    ]) {
      await t('읽기 실패(' + label + '): 원인별 안내 + 다시 확인, 문제는 계속 풀 수 있고 다시 확인하면 합쳐진다', async () => {
        let failing = true;
        const o = await open('#chapter/' + ERA + '/quiz', { progress: (k, body) => (failing ? reply : { status: 200, body: { items: body.questions.map((x, i) => i === 0 ? answeredRow(x, correctOpt(x.questionId), true) : unanswered(body).body.items[i]), total: 5, answered: 1 } }), attempt: grade });
        await tick(400);
        assert.match(o.notice(), re, o.notice());
        assert.match(o.notice(), /문제는 계속 풀 수 있어요/);
        assert.ok(o.qid(), '문제는 그대로');
        failing = false; o.q('#quizReadRetry').click(); await tick(30);
        assert.equal(o.notice(), '', '성공하면 안내가 사라짐');
        assert.match(o.q('#quizJump option[value="0"]').textContent, /✓/, '서버 기록이 합쳐짐');
        o.close();
      });
    }
    await t('늦게 온 기록: 사용자가 옮겨 고른 문제·번호는 그대로, 고르지 않은 문제만 합쳐진다', async () => {
      const read = deferred(), o = await open('#chapter/' + ERA + '/quiz', { progress: () => read.promise, attempt: grade });
      await o.next(); await o.next();
      const here = o.qid(); assert.equal(here, FREE_Q[2]);
      await o.pick(correctOpt(here));
      read.resolve({ status: 200, body: { items: FREE_Q.map((id, i) => i === 0 ? answeredRow({ questionId: id, version: QC.questions[id].v }, wrongOpt(id), false) : i === 2 ? answeredRow({ questionId: id, version: QC.questions[id].v }, wrongOpt(id), false) : { questionId: id, version: QC.questions[id].v, answered: false, optionId: null, correct: null }), total: 5, answered: 2 } });
      await tick(30);
      assert.equal(o.qid(), here, '번호가 옮겨지지 않음');
      assert.equal(o.q('#quiz .qchoice[aria-checked="true"]').getAttribute('data-option'), correctOpt(here), '내 새 고르기가 남음');
      assert.match(o.q('#quizJump option[value="0"]').textContent, /×/, '첫 문제는 서버 기록으로');
      assert.match(o.q('#quizJump option[value="2"]').textContent, /×/, '서버는 답했다고 알려 줌(완료 표시)');
      o.close();
    });
    await t('저장 중에 온 기록은 그 답을 덮지 않고, 저장 확인(ACK) 뒤에만 판정이 보인다', async () => {
      const read = deferred(), save = deferred();
      const o = await open('#chapter/' + ERA + '/quiz', { progress: () => read.promise, attempt: () => save.promise });
      const id = o.qid();
      await o.pick(correctOpt(id)); await o.check();
      assert.ok(!/맞았습니다|틀렸습니다/.test(o.q('#quizFeedback').textContent), '저장 확인 전 판정 없음');
      read.resolve(unanswered({ questions: FREE_Q.map(x => ({ questionId: x, version: QC.questions[x].v })) }));
      await tick(20);
      assert.equal(o.qid(), id);
      save.resolve(grade({ submissionId: o.attempts()[0].body.submissionId, questionId: id, version: QC.questions[id].v, optionId: correctOpt(id) }));
      await tick(10);
      assert.match(o.q('#quizFeedback').textContent, /⭕ 맞았습니다/);
      o.close();
    });
    await t('저장 실패: 판정·점수 없음, 같은 답·같은 제출 번호로만 다시 저장(두 번 눌러도 요청 하나)', async () => {
      let n = 0; const gate = deferred();
      const o = await open('#chapter/' + ERA + '/quiz', { progress: (k, b) => unanswered(b), attempt: b => (++n === 1 ? { status: 503, body: { error: { code: 'internal_error' } } } : n === 2 ? gate.promise.then(() => grade(b)) : grade(b)) });
      const id = o.qid();
      await o.pick(wrongOpt(id)); await o.check();
      assert.ok(!/맞았습니다|틀렸습니다/.test(o.q('#quizFeedback').textContent), '판정 없음');
      assert.match(o.q('#quizFeedback').textContent, /저장을 확인하지 못해/);
      assert.equal(o.w.HanqApi.state().growth.points, 1000, '점수 그대로');
      await o.pick(correctOpt(id));
      assert.equal(o.q('#quiz .qchoice[aria-checked="true"]').getAttribute('data-option'), wrongOpt(id), '저장 대기 중 답은 바뀌지 않음');
      o.q('#checkAnswer').click(); o.q('#checkAnswer').click(); await tick();
      gate.resolve(); await tick(10);
      const posts = o.attempts();
      assert.equal(posts.length, 2, '실패 1 + 다시 저장 1(두 번 눌러도 하나)');
      same(posts.map(x => [x.body.submissionId, x.body.optionId]), [[posts[0].body.submissionId, wrongOpt(id)], [posts[0].body.submissionId, wrongOpt(id)]]);
      assert.match(o.q('#quizFeedback').textContent, /❌ 틀렸습니다/);
      assert.equal(o.w.HanqApi.state().growth.points, 999, '확인된 서버 총점만');
      o.close();
    });
    await t('형식이 틀린 저장 응답(정답 여부 없음)은 확인으로 치지 않는다: 판정·점수 없이 같은 답 대기', async () => {
      const o = await open('#chapter/' + ERA + '/quiz', { progress: (k, b) => unanswered(b), attempt: b => { const r = grade(b); delete r.body.attempt.correct; return r; } });
      const id = o.qid(); await o.pick(correctOpt(id)); await o.check(); await tick(10);
      assert.ok(!/맞았습니다|틀렸습니다/.test(o.q('#quizFeedback').textContent));
      assert.equal(o.q('#checkAnswer').textContent, '같은 답안 저장 다시 시도');
      assert.equal(o.w.HanqApi.state().growth.points, 1000);
      o.close();
    });
    await t('같은 계정 다시 로그인·다른 계정: 이전 로그인의 늦은 기록은 버린다', async () => {
      const first = deferred(); let n = 0; const srv = { progress: (k, b) => (++n === 1 ? first.promise : unanswered(b)), attempt: grade };
      const o = await open('#chapter/' + ERA + '/quiz', srv);
      await o.w.HanqApi.logout(); await o.w.HanqApi.signin('a@example.test', 'pw'); await tick(30);
      first.resolve({ status: 200, body: { items: FREE_Q.map(id => answeredRow({ questionId: id, version: QC.questions[id].v }, correctOpt(id), true)), total: 5, answered: 5 } });
      await tick(30);
      assert.ok(!o.qa('#quizJump option').some(x => /✓/.test(x.textContent)), '이전 로그인의 기록이 합쳐지지 않음');
      srv.user = 'B'; await o.w.HanqApi.logout(); await o.w.HanqApi.signin('b@example.test', 'pw'); await tick(30);
      assert.ok(o.qid() && !o.q('.result-screen'));
      o.close();
    });
    await t('로그인 복원 중: 문제는 보고 고를 수 있지만 채점·저장은 하지 않는다(게스트 채점으로 바꾸지 않음)', async () => {
      const r = deferred();
      const o = await open('#chapter/' + ERA + '/quiz', { refresh: () => r.promise, progress: (k, b) => unanswered(b), attempt: grade });
      assert.ok(o.qid());
      assert.match(o.notice(), /로그인 확인 중/);
      await o.pick(o.qa('#quiz .qchoice')[0].getAttribute('data-option'));
      assert.equal(o.q('#checkAnswer').disabled, true);
      assert.equal(o.attempts().length, 0);
      assert.ok(!Object.keys(o.w.localStorage).some(k => k.startsWith('hanq:att:')), '이 기기 채점 기록도 없음');
      o.close();
    });
    await t('확인된 프리미엄은 전체 풀, 일반 회원은 5문항(기록 읽기 전에도)', async () => {
      const read = deferred();
      const prem = await open('#chapter/' + ERA + '/quiz', { premium: true, progress: () => read.promise, attempt: grade });
      assert.ok(prem.qa('#quizJump option[value]:not([value=""])').length > 5);
      prem.close();
    });
    await t('게스트: 이 기기 채점 · ⭕ 맞았습니다가 보이고 다음 버튼으로만 다음 문제 · 키보드 포커스는 새 문제로', async () => {
      const o = await open('#chapter/' + ERA + '/quiz', null);
      const id = o.qid();
      o.q('#quiz .qchoice').focus();
      await o.pick(correctOpt(id)); o.q('#checkAnswer').focus(); await o.check();
      assert.match(o.q('#quizFeedback').textContent, /⭕ 맞았습니다/);
      assert.equal(o.q('#quizFeedback').getAttribute('aria-live'), 'polite');
      await tick(10);
      assert.equal(o.qid(), id, '바로 넘어가지 않음');
      await tick(60);
      assert.equal(o.qid(), id, '기존2초 타이머보다 오래 지나도 문항 유지');
      o.q('#nextQuestion').click();await tick(10);
      assert.notEqual(o.qid(), id, '다음 버튼을 눌러야 이동');
      assert.equal(o.doc.activeElement && o.doc.activeElement.id, 'quizQText');
      assert.ok(Object.keys(o.w.localStorage).some(k => k.startsWith('hanq:att:')), '게스트 기록은 이 기기에');
      o.close();
    });
    await t('정답 뒤 넘김 전에 다른 문제로 옮기면 넘김 취소 · 오답은 ❌ 틀렸습니다 + 정답이 남는다 · 줄인 동작이면 스크롤 auto', async () => {
      const o = await open('#chapter/' + ERA + '/quiz', null, { reducedMotion: true });
      const a = o.qid(); await o.pick(correctOpt(a)); await o.check();
      await o.next(); const b = o.qid(); assert.notEqual(b, a);
      await tick(80);
      assert.equal(o.qid(), b, '취소된 넘김이 다시 옮기지 않음');
      await o.pick(wrongOpt(b)); await o.check();
      assert.match(o.q('#quizFeedback').textContent, /❌ 틀렸습니다/);
      assert.match(o.q('#quizFeedback .verdict-answer').textContent, /정답 · /);
      await tick(80);
      assert.equal(o.qid(), b, '오답은 머묾');
      assert.ok(o.scrolls.length && o.scrolls.every(x => x === 'auto' || x === undefined), J(o.scrolls));
      o.close();
    });
    await t('오답 해설: 기존 근거의 정답/선택오답 핵심 각2줄 이내, 관련 개념은 접힘', async () => {
      const o = await open('#chapter/' + ERA + '/quiz', null), id = o.qid(), item = QC.questions[id];
      await o.pick(wrongOpt(id)); await o.check();
      const c = o.q('#quizFeedback .quiz-brief-feedback'); assert.ok(c);
      const points = c.querySelectorAll('.qb-core li'); assert.ok(points.length >= 1 && points.length <= 5);
      assert.equal(c.querySelectorAll('.qb-option.is-selected').length,1);
      assert.ok(o.qa('#quiz .qexp').every(x => x.hidden), '긴 선지 원문을 따로 펼치지 않음');
      assert.equal(c.querySelector('details[open]'), null, '관련 개념은 사용자가 펼침');
      const contract = o.w.HanqQuizReview.contract(item, wrongOpt(id));
      same(contract.overview.reason, item.overview.reason, '원본 이유 보존');
      assert.ok(c.querySelector('.qb-option.is-selected').textContent.includes(item.options.find(x=>x.id===wrongOpt(id)).text),'선택 오답만 실제 개념 표시');
      o.close();
    });
    await t('기출 회원: 기록 읽기 중에도 문제 그림·보기, 저장 실패면 판정 없이 같은 답·같은 번호로 다시 · 정답 핵심과 오답 선지별 짧은 이유만', async () => {
      const read = deferred(); let n = 0;
      const o = await open('#chapter/' + ERA + '/mock', { progress: (k) => (k === 'mock' ? read.promise : { status: 200, body: { items: [] } }), attempt: b => (++n === 1 ? 'network' : grade(b)) });
      const host = o.q('#mock');
      assert.ok(host.querySelector('.mock-image'), '그림 바로');
      assert.match(o.doc.querySelector('#mockReadNotice').textContent, /풀이 기록 확인 중/);
      host.querySelector('.mock-choice[data-choice="2"]').click(); await tick();
      o.q('#checkMock').click(); await tick(20);
      assert.ok(!o.q('.mock-feedback'), '판정 없음');
      assert.match(o.q('.mock-save-fail').textContent, /같은 답안/);
      o.q('.mock-choice[data-choice="3"]').click(); await tick();
      assert.equal(o.q('.mock-choice[aria-checked="true"]').getAttribute('data-choice'), '2', '저장 대기 답 고정');
      o.q('#checkMock').click(); await tick(20);
      const posts = o.attempts();
      same(posts.map(x => [x.body.submissionId, x.body.optionId]), [[posts[0].body.submissionId, posts[0].body.optionId], [posts[0].body.submissionId, posts[0].body.optionId]]);
      assert.match(o.q('.mock-feedback').textContent, /맞았습니다|틀렸습니다/);
      assert.ok(o.q('.mock-feedback .qb-core ul'));
      assert.ok(o.qa('.mock-feedback .qb-option.is-selected').length<=1);
      assert.equal(o.q('.mock-feedback details[open]'), null, '기출 관련 개념은 접힘');
      read.resolve({ status: 200, body: { items: FREE_M.map(id => ({ questionId: id, version: EP.questions[id].v, answered: false, optionId: null, correct: null })) } });
      await tick(20);
      assert.match(o.q('.mock-feedback').textContent, /맞았습니다|틀렸습니다/, '늦은 기록(미풀이)이 확인된 저장을 덮지 않음');
      o.close();
    });
    await t('기출 늦은 저장 응답은 현재 문제·고른 답을 다시 그리지 않고, 다른 버전 응답은 채점·점수로 인정하지 않는다', async () => {
      const save = deferred();
      const o = await open('#chapter/' + ERA + '/mock', { progress: (k,b) => unanswered(b), attempt: () => save.promise });
      o.q('.mock-choice[data-choice="2"]').click(); o.q('#checkMock').click(); await tick();
      const posted = o.attempts()[0].body;
      o.q('#nextMock').click(); await tick();
      const article = o.q('.mock-question'), currentId = article.dataset.question;
      o.q('.mock-choice[data-choice="3"]').focus(); o.q('.mock-choice[data-choice="3"]').click();
      save.resolve(grade(posted)); await tick(20);
      assert.equal(o.q('.mock-question'), article, '늦은 응답으로 현재 화면을 다시 만들지 않음');
      assert.equal(o.q('.mock-question').dataset.question, currentId);
      assert.equal(o.q('.mock-choice[aria-checked="true"]').dataset.choice, '3');
      o.close();
      const bad = await open('#chapter/' + ERA + '/mock', { progress: (k,b) => unanswered(b), attempt: b => { const d = grade(b); d.body.attempt.version = 'wrong-version'; return d; } });
      bad.q('.mock-choice[data-choice="2"]').click(); bad.q('#checkMock').click(); await tick(20);
      assert.ok(!bad.q('.mock-feedback'), '다른 버전 판정 숨김');
      assert.equal(bad.w.HanqApi.state().growth.points, 1000, '다른 버전 점수 반영 안 함');
      assert.ok(bad.q('.mock-save-fail'), '동일 답안 재시도 유지');
      bad.close();
    });
    await t('기억할 기존 사실 3~5항목과 각 오답 선지 한 문장만 노출하며 긴 배경은 UI에서 제외하고 원본에 보존', async () => {
      const o = await open('#chapter/' + ERA + '/quiz', null);
      const item = JSON.parse(JSON.stringify(QC.questions[o.qid()]));
      item.overview.reason = ['확인된 이유입니다. 긴 배경 설명입니다.'];
      item.overview.memory = ['핵심 키워드', '시기 구분']; item.overview.clue = ['사건 단서']; item.overview.contrast = ['혼동 구분'];
      item.overview.context = ['더 긴 배경입니다.'];
      item.options.filter(x => !x.correct).forEach(x => { x.review = ['이 선지는 다른 내용입니다. 긴 선지 배경입니다.']; });
      const host = o.doc.createElement('div'); host.innerHTML = o.w.HanqQuizReview.renderCompact(item, wrongOpt(item.id));
      assert.equal(host.querySelectorAll('.qc-keypoints li').length, 5);
      assert.match(host.textContent, /핵심 키워드/); assert.match(host.textContent, /시기 구분/);
      assert.equal(host.querySelectorAll('.qc-option').length, item.options.filter(x => !x.correct).length);
      host.querySelectorAll('.qc-option span').forEach(x => assert.equal(x.textContent, '이 선지는 다른 내용입니다.'));
      assert.doesNotMatch(host.textContent, /긴 배경|긴 선지 배경|더 긴 배경/);
      assert.equal(host.querySelector('details'), null);
      const original = o.w.HanqQuizReview.contract(item, wrongOpt(item.id));
      assert.match(original.overview.reason[0], /긴 배경/); assert.match(original.options.find(x => !x.correct).lines[0], /긴 선지 배경/);
      o.close();
    });

    await t('stale scope: 703 seed against 990 front recovers exact versions into same era50 without grading',async()=>{
      const available=Object.values(API_OLD).map(q=>({questionId:q.id,version:q.v,kind:'quiz',current:true}));let reads=0;
      const o=await open('#chapter/'+ERA+'/quiz',{premium:true,catalog:()=>({status:200,body:{items:available,next:null}}),progress:(kind,b)=>{reads++;return b.questions.some(p=>!API_OLD[p.questionId])?{status:409,body:{error:{code:'stale_quiz_scope'}}}:unanswered(b);},attempt:grade});
      await tick(50);assert.ok(reads>=2);assert.equal(o.log.filter(x=>x.p.endsWith('/questions')).length,1);assert.equal(o.qa('#quizJump option').length,o.w.HANQ_UNIFIED_QUIZ_SELECTION.eras[ERA].length+1);assert.equal(o.attempts().length,0);assert.equal(o.notice(),'');assert.ok(o.log.filter(x=>x.p.endsWith('/quiz/progress')).at(-1).body.questions.every(p=>QC.questions[p.questionId]&&String(QC.questions[p.questionId].v)===String(p.version)));o.close();
    });
    await t('stale scope: mismatching server versions never get mapped and bounded recovery does not grade',async()=>{
      let reads=0;const o=await open('#chapter/'+ERA+'/quiz',{premium:true,catalog:()=>({status:200,body:{items:Object.values(QC.questions).map(q=>({questionId:q.id,version:'different',kind:'quiz',current:true})),next:null}}),progress:()=>{reads++;return {status:409,body:{error:{code:'stale_quiz_scope'}}};},attempt:grade});await tick(50);assert.equal(o.log.filter(x=>x.p.endsWith('/questions')).length,1);const settled=reads;await tick(50);assert.equal(reads,settled);assert.match(o.notice(),/문제 내용/);assert.equal(o.attempts().length,0);o.close();
    });
    await t('stale scope: excluded uncertain submission stays reachable with its original SID, no automatic resubmit',async()=>{
      let fail=false;const srv={premium:true,progress:(kind,b)=>fail?{status:409,body:{error:{code:'stale_quiz_scope'}}}:unanswered(b),attempt:()=> 'network'};const o=await open('#chapter/'+ERA+'/quiz',srv),id=o.qid(),pair={questionId:id,version:QC.questions[id].v};await o.w.HanqQuizProgress.submit(pair,correctOpt(id)).catch(()=>{});const pending=o.w.HanqQuizProgress.pending(pair);fail=true;srv.catalog=()=>({status:200,body:{items:Object.values(QC.questions).filter(q=>q.id!==id).map(q=>({questionId:q.id,version:q.v,kind:'quiz',current:true})),next:null}});o.q('.steps [data-step="3"]').click();await tick(10);o.q('.steps [data-step="2"]').click();await tick(50);assert.equal(o.qa('#quizJump option').length,o.w.HANQ_UNIFIED_QUIZ_SELECTION.eras[ERA].length+1);assert.equal(o.w.HanqQuizProgress.pending(pair).submissionId,pending.submissionId);assert.equal(o.attempts().length,1);assert.ok(o.w.HANQ_UNIFIED_QUIZ_SELECTION.eras[ERA].includes(id));assert.match(o.notice(),/문제 내용/);o.close();
    });
    await t('stale scope: free member keeps fixed slots and never substitutes catalogue IDs',async()=>{
      const o=await open('#chapter/'+ERA+'/quiz',{premium:false,progress:()=>({status:409,body:{error:{code:'stale_quiz_scope'}}}),attempt:grade});await tick(30);assert.equal(o.log.filter(x=>x.p.endsWith('/questions')).length,0);assert.equal(o.qa('#quizJump option').length,6);assert.equal(o.attempts().length,0);o.close();
    });
    for(const kind of ['quiz','mock']){
      await t(kind+' 오답목록: 다른번호의 늦은 저장기록도 목록 갱신, 현재 미응답 유지',async()=>{const gate=deferred(),o=await open('#chapter/'+ERA+'/'+kind,{progress:()=>gate.promise,attempt:grade});const first=kind==='quiz'?o.qid():o.q('.mock-question').dataset.question;o.q('#'+kind+'PartialTools [data-partial-wrong]').click();await tick(10);assert.ok(!o.q('#'+kind));assert.match(o.q('.era-inline-wrong').textContent,/확인하고 있어요/);const body=o.log.filter(x=>x.p.endsWith('/'+kind+'/progress')).at(-1).body;const other=body.questions[1],opt=kind==='quiz'?wrongOpt(other.questionId):other.questionId+'-option-'+(EP.questions[other.questionId].answer%5+1);const response=unanswered(body);response.body.items[1]=answeredRow(other,opt,false);gate.resolve(response);await tick(30);assert.equal(o.qa('.era-inline-wrong .review-item').length,1);assert.equal(o.q('.era-inline-wrong .review-item').dataset.question,other.questionId);assert.ok(!o.q('#'+kind));o.q('#'+kind+'PartialTools [data-partial-wrong]').click();await tick(30);assert.equal(kind==='quiz'?o.qid():o.q('.mock-question').dataset.question,first);assert.ok(!o.q(kind==='quiz'?'#quiz .qchoice[aria-checked="true"]':'.mock-choice[aria-checked="true"]'));o.close();});
      await t(kind+' 오답목록: 계정변경 뒤 이전계정의 늦은 기록 표시 금지',async()=>{const gate=deferred(),srv={user:'A',progress:(k,b)=>srv.user==='A'?gate.promise:unanswered(b),attempt:grade},o=await open('#chapter/'+ERA+'/'+kind,srv);o.q('#'+kind+'PartialTools [data-partial-wrong]').click();await tick(10);const body=o.log.filter(x=>x.p.endsWith('/'+kind+'/progress')).at(-1).body;srv.user='B';await o.w.HanqApi.logout();await o.w.HanqApi.signin(USER.B.email,'fixture-only');await tick(30);const response=unanswered(body),other=body.questions[1],opt=kind==='quiz'?wrongOpt(other.questionId):other.questionId+'-option-'+(EP.questions[other.questionId].answer%5+1);response.body.items[1]=answeredRow(other,opt,false);gate.resolve(response);await tick(30);assert.equal(o.w.HanqApi.state().ownerId,USER.B.id);assert.equal(o.qa('.era-inline-wrong .review-item').length,0);assert.ok(!o.q('#'+kind));o.close();});
    }
    await t('스크립트 오류 없음', () => same(errs.filter(e => !/Not implemented/.test(e)), []));
  } finally {
    windows.forEach(d => { try { d.window.close(); } catch (e) {} });
  }
  console.log('\n검사 ' + checks + '개 · 실패 ' + failures + '개');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); windows.forEach(d => { try { d.window.close(); } catch (x) {} }); process.exit(1); });
