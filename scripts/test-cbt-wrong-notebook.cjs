#!/usr/bin/env node
/* Synthetic authenticated-CBT transport and DOM only. No live user records,
 * network requests, source-image upload, browser, or image-decoding claim. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require(process.env.HANQ_JSDOM_PATH || '../.test-tools/node_modules/jsdom');
const code = fs.readFileSync(path.join(__dirname, '../media/cbt-wrong-notebook.js'), 'utf8');
const RUN = '10000000-0000-4000-8000-000000000001';
const REVIEW = '20000000-0000-4000-8000-000000000001';
let checks = 0;
const clone = value => JSON.parse(JSON.stringify(value));
function ok(value, label) { assert.ok(value, label); checks++; }
function same(a, b, label) { assert.deepEqual(clone(a), clone(b), label); checks++; }
const settle = async () => { for (let n = 0; n < 3; n++) await new Promise(resolve => setImmediate(resolve)); };
function row(number = 1, exam = 79, version = 'saved-v1') {
  const id = 'exam-' + exam + '-' + String(number).padStart(2, '0');
  const options = Array.from({ length: 5 }, (_, i) => ({ id: id + '-option-' + (i + 1), number: i + 1 }));
  const item = { id, v: version, exam, number, points: 2, answer: 1, q: '가상 문항', options: options.map((o, i) => ({ ...o, text: '가상 선택 ' + (i + 1), correct: i === 0, review: ['저장된 가상 설명'] })), overview: { answer: '가상 선택 1', reason: ['저장된 가상 근거'] } };
  return { questionId: id, version, exam, number, position: number - 1, runId: RUN, points: 2, image: '/api/v1/cbt/runs/' + RUN + '/questions/' + (number - 1) + '/image', common: null, selectedOptionId: options[1].id, options, review: { status: 'wrong', correct: false, correctNumber: 1, correctOptionId: options[0].id, item, options: item.options } };
}
function response(items = [row()], extras = {}) { return { scope: 'finalized-exam-selected-wrong', limit: 500, hasMore: false, items, ...extras }; }
function harness(config = {}) {
  const dom = new JSDOM('<main></main>', { url: 'https://fixture.test/', runScripts: 'outside-only' });
  const w = dom.window, host = w.document.querySelector('main'), calls = [], images = [], routes = [], made = [], revoked = [], explanationCalls = [];
  let state = { signedIn: true, ownerId: 'owner-A', epoch: 1 }, listeners = [], keyCount = 0, storageTouches = 0;
  for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(w, name, { configurable: true, get() { storageTouches++; throw new Error('Notebook must not read legacy/device storage'); } });
  w.URL.createObjectURL = () => { const url = 'blob:cbt-notebook-' + (made.length + 1); made.push(url); return url; };
  w.URL.revokeObjectURL = url => revoked.push(url);
  w.HanqCbtExplanations = { resolve(q, status) { explanationCalls.push({ questionId: q.questionId, version: q.version, status }); return q.review.item; } };
  const api = {
    enabled: () => config.enabled !== false,
    state: () => state,
    init: () => config.init ? config.init() : Promise.resolve(),
    onChange(fn) { listeners.push(fn); return () => { listeners = listeners.filter(f => f !== fn); }; },
    newSubmissionId(prefix) { return prefix + '-fixture-' + (++keyCount); },
    cbt(method, endpoint, body) {
      calls.push({ method, endpoint, body });
      if (method === 'GET' && endpoint === '/api/v1/cbt/notebook') return config.read ? config.read(state) : Promise.resolve(response());
      if (method === 'POST' && endpoint === '/api/v1/cbt/reviews') return config.create ? config.create(body, state) : Promise.resolve({ run: { id: REVIEW, kind: 'review', round: body.round }, items: [] });
      throw new Error('Unexpected or legacy endpoint: ' + endpoint);
    },
    cbtImage(p) { images.push(p); return config.image ? config.image(p, state) : Promise.resolve(new Blob(['synthetic'], { type: 'image/webp' })); },
    wrongNotes() { throw new Error('Legacy wrong notes forbidden'); },
    createReplay() { throw new Error('Legacy replay forbidden'); }
  };
  if (config.guest) state = { signedIn: false, ownerId: null, epoch: 1 };
  w.eval(code);
  const options = { api, onHome: () => routes.push('home'), onAccount: () => routes.push('account'), onReview: route => routes.push(route) };
  const controller = w.HanqCbtWrongNotebook.mount(host, options);
  return { dom, w, host, api, options, controller, calls, images, routes, made, revoked, explanationCalls,
    emit(next) { state = next; listeners.slice().forEach(fn => fn(state)); },
    listeners: () => listeners.length, keys: () => keyCount, storageTouches: () => storageTouches,
    close() { w.HanqCbtWrongNotebook.stop(); dom.window.close(); }
  };
}
async function open(h, selector = 'details[data-notebook-question]') { const detail = h.host.querySelector(selector); assert.ok(detail, 'detail exists'); detail.open = true; detail.dispatchEvent(new h.w.Event('toggle')); await settle(); return detail; }

(async () => {
  let h;
  try {
    const original = response([row(1), row(2)]), before = JSON.stringify(original);
    original.items[0].common = { image: '/api/v1/cbt/runs/' + RUN + '/questions/0/common', questionNumbers: [1, 2] };
    const withCommon = JSON.stringify(original);
    h = harness({ read: async () => original });
    same(await h.controller.ready, { count: 2, rejected: 0 }, 'bounded notebook load');
    same(h.calls.map(c => c.endpoint), ['/api/v1/cbt/notebook'], 'single bounded endpoint, no runs fanout');
    same(h.images.length, 0, 'original images lazy until question expanded');
    ok(h.host.textContent.includes('답을 골라 틀린 문제만'), 'answered-wrong scope is explicit');
    ok(h.host.textContent.includes('나중에 맞혀도'), 'cumulative original mistakes retention is explicit');
    await open(h);
    same(h.images, [original.items[0].common.image, original.items[0].image], 'authenticated common and question images requested');
    same(h.host.querySelectorAll('img').length, 2, 'source and common images rendered');
    same(h.host.querySelectorAll('img[data-company-exam-image]').length, 2, 'both mounted source images carry company visibility exception');
    same(h.explanationCalls.length,0,'answer explanation hidden until explicit button');
    h.host.querySelector('[data-notebook-show-answer]').click();
    same(h.explanationCalls, [{ questionId: 'exam-79-01', version: 'saved-v1', status: 'final' }], 'saved final wrong item passed to established explanation renderer');
    ok(h.host.textContent.includes('내 선택 2번 · 정답 1번'), 'selected and correct option comparison');
    const sameDetails = h.host.querySelector('details'); sameDetails.open = false; sameDetails.open = true; sameDetails.dispatchEvent(new h.w.Event('toggle')); await settle();
    same(h.images.length, 2, 'reopening detail does not duplicate asset requests');
    await open(h, '[data-notebook-question="exam-79-02"]');
    const ids = [...h.host.querySelectorAll('[id]')].map(el => el.id);
    same(new Set(ids).size, ids.length, 'established explanation IDs are uniquely scoped per card');
    for (const element of h.host.querySelectorAll('[aria-labelledby]')) ok(h.w.document.getElementById(element.getAttribute('aria-labelledby')), 'explanation label references resolve after scoping');
    same(JSON.stringify(original), withCommon, 'source response never mutated');
    same(h.storageTouches(), 0, 'no local or legacy storage accesses');
    h.controller.stop(); h.controller.stop();
    same(h.revoked.length, h.made.length, 'all owned image URLs revoked on stop');
    same(h.listeners(), 0, 'auth observer detached on stop');
    same(h.host.children.length, 0, 'stop removes private notebook contents');
    h.close();

    h = harness({ guest: true }); await h.controller.ready;
    same(h.calls.length, 0, 'guest makes no private API request');
    ok(h.host.querySelector('[data-notebook-login]'), 'guest sees login');
    h.emit({ signedIn: true, ownerId: 'owner-A', epoch: 2 }); await settle();
    same(h.host.querySelectorAll('details[data-notebook-question]').length, 1, 'sign-in loads owner notebook without remount');
    h.emit({ signedIn: false, ownerId: null, epoch: 3 });
    ok(h.host.querySelector('[data-notebook-login]') && !h.host.querySelector('details'), 'logout immediately clears questions');
    h.close();

    let lateRead;
    h = harness({ read: state => state.ownerId === 'owner-A' ? new Promise(resolve => { lateRead = resolve; }) : Promise.resolve(response([row(3)])) });
    await settle();
    h.emit({ signedIn: true, ownerId: 'owner-B', epoch: 2 }); await settle();
    ok(h.host.querySelector('[data-notebook-question="exam-79-03"]'), 'new owner sees their own notebook');
    lateRead(response([row(1)])); await h.controller.ready; await settle();
    ok(!h.host.querySelector('[data-notebook-question="exam-79-01"]'), 'late previous-owner notebook ignored');
    const beforeEpoch = h.calls.length;
    h.emit({ signedIn: true, ownerId: 'owner-B', epoch: 3 }); await settle();
    same(h.calls.length, beforeEpoch + 1, 'same-owner new session epoch invalidates and reloads notebook');
    h.close();

    let lateImage;
    h = harness({ image: () => new Promise(resolve => { lateImage = resolve; }) });
    await h.controller.ready; await open(h);
    h.emit({ signedIn: true, ownerId: 'owner-B', epoch: 2 }); await settle();
    lateImage(new Blob(['late'], { type: 'image/png' })); await settle();
    same(h.made.length, 0, 'late previous-owner image creates no URL');
    same(h.host.querySelectorAll('img').length, 0, 'late previous-owner pixels cannot enter new notebook');
    h.close();

    h = harness(); await h.controller.ready; await open(h);
    ok(h.made.length === 1, 'image URL created for authenticated owner');
    h.emit({ signedIn: false, ownerId: null, epoch: 2 });
    same(h.revoked.length, 1, 'logout immediately releases existing private source image');
    h.close();

    let postFinish;
    h = harness({ create: () => new Promise(resolve => { postFinish = resolve; }) }); await h.controller.ready;
    const replay = h.host.querySelector('[data-notebook-round]'); replay.click(); replay.click(); await settle();
    const posts = h.calls.filter(c => c.method === 'POST');
    same(posts.length, 1, 'double click makes only one replay request');
    same(posts[0].body, { round: 79, idempotencyKey: 'cbt-notebook-fixture-1', selection: 'exam-wrong-only' }, 'replay requests exclusively original finalized exam wrongs');
    h.emit({ signedIn: true, ownerId: 'owner-B', epoch: 2 }); await settle();
    postFinish({ run: { id: REVIEW, kind: 'review', round: 79 } }); await settle();
    same(h.routes.length, 0, 'late previous-owner replay creation never navigates');
    h.close();

    let attempts = 0;
    h = harness({ create: async body => { attempts++; if (attempts === 1) throw { code: 'network_error' }; return { run: { id: REVIEW, kind: 'review', round: body.round } }; } });
    await h.controller.ready; h.host.querySelector('[data-notebook-round]').click(); await settle();
    ok(h.host.textContent.includes('요청 결과를 확인하지 못했어요'), 'uncertain create outcome shown honestly');
    ok(h.host.querySelector('[data-notebook-previous]').disabled, 'failed create restores existing disabled pagination');
    h.host.querySelector('[data-notebook-round]').click(); await settle();
    const retried = h.calls.filter(c => c.method === 'POST');
    same(retried[0].body.idempotencyKey, retried[1].body.idempotencyKey, 'retry reuses same idempotency key after uncertain result');
    same(h.keys(), 1, 'retry never generates a fresh create intent');
    same(h.routes, ['review-' + REVIEW], 'created review opens established formal-exam route');
    same(h.listeners(), 0, 'successful handoff stops notebook observer');
    h.close();

    h = harness({ create: async () => { throw { code: 'review_empty' }; } }); await h.controller.ready;
    h.host.querySelector('[data-notebook-round]').click(); await settle();
    ok(h.host.textContent.includes('다시 풀 수 있는 선택 오답이 없어요'), 'empty replay eligibility clear');
    same(h.calls.filter(c => c.method === 'POST').length, 1, 'empty replay does not fall back to stars or other notes');
    h.close();

    const selected = row(1, 79, 'saved-old-version');
    const duplicate = row(1, 79, 'different-version');
    const correct = row(2); correct.review.status = 'correct'; correct.review.correct = true;
    const unanswered = row(3); unanswered.selectedOptionId = null; unanswered.review.status = 'unanswered';
    const era = row(4); era.questionId = 'goryeo-01';
    const badImage = row(5); badImage.image = 'https://untrusted.test/private.png';
    const mismatched = row(6); mismatched.review.item.v = 'wrong-version';
    const data = response([selected, duplicate, correct, unanswered, era, badImage, mismatched], { hasMore: true });
    h = harness({ read: async () => data }); await h.controller.ready;
    same(h.host.querySelectorAll('[data-notebook-question]').length, 1, 'dedup and answered-wrong validation exclude unrelated/malformed records');
    same(h.host.querySelector('[data-notebook-question]').dataset.notebookVersion, 'saved-old-version', 'latest stored wrong version is not forced to current version');
    ok(h.host.querySelector('[data-notebook-has-more]'), 'bounded-result hasMore metadata visible');
    ok(h.host.textContent.includes('일부 기록의 형식'), 'rejected records disclosed rather than silently omitted');
    await open(h); same(h.images.length, 1, 'malformed/unrelated source rows never request images');
    h.close();

    h = harness({ read: async () => response(Array.from({ length: 25 }, (_, i) => row(i + 1))) }); await h.controller.ready;
    same(h.host.querySelectorAll('[data-notebook-question]').length, 20, 'notebook renders a bounded 20-card page');
    await open(h); const urlsBeforePage = h.made.length;
    h.host.querySelector('[data-notebook-next]').click();
    same(h.host.querySelectorAll('[data-notebook-question]').length, 5, 'next page shows remaining source questions');
    same(h.revoked.length, urlsBeforePage, 'page navigation releases previous source images');
    h.host.querySelector('[data-notebook-previous]').click();
    same(h.host.querySelectorAll('[data-notebook-question]').length, 20, 'previous page works');
    h.close();

    h = harness({ read: async () => response([row(1, 79), row(2, 78)]) }); await h.controller.ready;
    same(h.host.querySelectorAll('[data-notebook-round]').length, 2, 'only rounds with answered wrong records offer replay');
    const select = h.host.querySelector('select'); select.value = '78'; select.dispatchEvent(new h.w.Event('change'));
    same(h.host.querySelectorAll('[data-notebook-question]').length, 1, 'round filter restricts cards');
    same(h.host.querySelector('[data-notebook-round]').dataset.notebookRound, '78', 'round filter keeps correct replay target');
    h.close();

    h = harness({ read: async () => response([]) }); await h.controller.ready;
    ok(h.host.querySelector('.cbt-notebook-empty'), 'genuine empty notebook state');
    same(h.host.querySelectorAll('[data-notebook-round]').length, 0, 'empty notebook cannot create unrelated review');
    h.close();
    for (const read of [async () => { throw new Error('offline'); }, async () => ({ ...response(), scope: 'legacy-notes' })]) {
      h = harness({ read }); await h.controller.ready;
      ok(h.host.querySelector('[data-notebook-retry]'), 'transport/schema error offers bounded retry');
      ok(!h.host.querySelector('.cbt-notebook-empty'), 'failed load is never misrepresented as no wrong answers');
      h.close();
    }
    h = harness({ image: async () => new Blob(['<svg/>'], { type: 'image/svg+xml' }) }); await h.controller.ready; await open(h);
    same(h.made.length, 0, 'non-raster image rejected before URL creation');
    ok(h.host.querySelector('[data-notebook-image-retry]'), 'image MIME failure has explicit retry');
    h.close();

    h = harness(); await h.controller.ready; await open(h);
    const failed = h.host.querySelector('img'); failed.dispatchEvent(new h.w.Event('error'));
    same(h.revoked.length, 1, 'decoded-image failure releases owned URL immediately');
    h.host.querySelector('[data-notebook-image-retry]').click(); await settle();
    same(h.images.length, 2, 'explicit image retry uses authenticated CBT path again');
    h.controller.stop(); same(new Set(h.revoked).size, h.revoked.length, 'image retry/stop never double-revokes URLs'); h.close();

    let finishInit;
    h = harness({ init: () => new Promise(resolve => { finishInit = resolve; }) }); await settle(); h.controller.stop(); finishInit(); await h.controller.ready;
    same(h.calls.length, 0, 'stop during auth initialization starts no notebook request'); h.close();
    h = harness({ enabled: false }); await h.controller.ready; same(h.calls.length, 0, 'disabled API performs no private work'); same(await h.controller.reload(), { enabled: false }, 'disabled reload remains safe'); h.close();

    // Exercise the real, established source explanation renderer with its
    // already-shipped reference item; image transport remains synthetic.
    h = harness({ read: () => new Promise(() => {}) });
    for (const file of ['exam-pool.js', 'quiz-review.js', 'cbt-explanation-data.js', 'cbt-explanations.js']) h.w.eval(fs.readFileSync(path.join(__dirname, '../media', file), 'utf8'));
    const item = clone(h.w.HANQ_EXAM_POOL.questions['exam-79-13']);
    const actual = row(13, 79, item.v); actual.points = item.points; actual.review.item = item;
    actual.options = item.options.map((o, i) => ({ id: o.id, number: i + 1 }));
    actual.review.options = item.options;
    actual.review.correctNumber = item.answer; actual.review.correctOptionId = item.options[item.answer - 1].id; actual.selectedOptionId = item.options[item.answer % 5].id;
    h.api.cbt = async (method, endpoint) => { assert.equal(method, 'GET'); assert.equal(endpoint, '/api/v1/cbt/notebook'); return response([actual]); };
    await h.controller.ready; await open(h);

    h.host.querySelector('[data-notebook-show-answer]').click();
    const verified=h.w.HanqCbtExplanations.resolve(actual,'final');
    ok(verified,'real existing reviewed CBT explanation resolves with exact mapping');
    ok(h.host.querySelector('.fe-review-body').textContent.includes(verified.overview.reason[0].replace(/\*\*/g,'')),'verified source explanation retained');
    same(h.host.querySelectorAll('.fe-review-body h4').length,5,'five option explanation groups retained');
    ok(h.host.querySelector('.fe-answer-compare').textContent.includes('정답 '+item.answer+'번'),'saved answer mapping retained');
    h.close();
    console.log('PASS: ' + checks + ' CBT-only wrong notebook DOM/transport assertions. No live account, browser, or decoded-image QA claimed.');
  } finally { if (h) h.close(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
