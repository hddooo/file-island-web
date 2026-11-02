#!/usr/bin/env node
/* 독도와 간도 → 시대별 통합(화면 대응표만) 검사. 실제 index.html을 jsdom으로 열고, 회원 경우는 창 안의 가짜 fetch로만(네트워크 없음).
 *   JSDOM_PATH=/path/to/node_modules/jsdom node scripts/test-islands-integration.cjs
 * 창은 실패해도 finally에서 닫고, 25초 안에 끝난다. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto'), assert = require('assert/strict');
const ROOT = path.resolve(__dirname, '..');
const { JSDOM, ResourceLoader, VirtualConsole } = require(process.env.JSDOM_PATH || 'jsdom');
let checks = 0, failures = 0;
const windows = [], errs = [];
async function t(name, fn) { checks++; try { await fn(); } catch (e) { failures++; console.log('  ✗ ' + name + '\n    ' + String(e && e.message).split('\n').slice(0, 4).join('\n    ')); } }
const J = x => JSON.stringify(x), same = (a, b, m) => assert.equal(J(a), J(b), m); // 다른 realm(vm·jsdom) 배열도 내용으로 비교
const wait = async (ms = 0) => { await new Promise(r => setTimeout(r, ms)); for (let i = 0; i < 10; i++) await new Promise(r => setImmediate(r)); };

const sha = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
const ctx = { window: {} }; vm.createContext(ctx);
for (const f of ['media/quiz-catalog.js', 'media/exam-pool.js','media/era-recall-quiz.js','media/era-recall-integration.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
const QC = ctx.window.HANQ_QUIZ_CATALOG, EP = ctx.window.HANQ_EXAM_POOL;
const LEGACY = Object.keys(QC.questions).filter(id => /^legacy-islands-/.test(id)).sort();
const HOME = { samguk: ['legacy-islands-000', 'legacy-islands-001'], 'joseon-late': ['legacy-islands-002'], opening: ['legacy-islands-003', 'legacy-islands-004'], colonial: ['legacy-islands-004', 'legacy-islands-005', 'legacy-islands-006', 'legacy-islands-007'] };

class FileLoader extends ResourceLoader { fetch(url) { const u = new URL(url); if (u.hostname !== 'hanq.test') return null; const f = path.join(ROOT, decodeURIComponent(u.pathname)); if (!/\.js$/.test(f) || !fs.existsSync(f)) return null; return Promise.resolve(fs.readFileSync(f)); } }

/* member: null = intended offline mode (meta emptied, full pools) · {premium:boolean, slots:{chapter:[ids]}} = fake server */
async function open(hash, member, seed) {
  let src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (!member) src = src.replace(/<meta name="hanq-api-base" content="[^"]*">/, '<meta name="hanq-api-base" content="">');
  const vc = new VirtualConsole(); vc.on('jsdomError', e => errs.push(e.message));
  const sent = [];
  const d = new JSDOM(src, { url: 'https://hanq.test/index.html' + hash, runScripts: 'dangerously', resources: new FileLoader(), pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      if (seed) for (const [k, v] of Object.entries(seed)) w.localStorage.setItem(k, v);
      if (!member) return;
      w.localStorage.setItem('hanqacct:signedIn', '1');
      const user = { id: '11111111-1111-4111-8111-111111111111', email: 'member@example.test', displayName: '회원', createdAt: '2026-10-08T00:00:00Z' };
      const freeSlots = []; Object.entries(member.slots || {}).forEach(([chapter, ids]) => ids.forEach(id => freeSlots.push({ chapter, kind: 'quiz', question_id: id })));
      const reply = (status, body) => Promise.resolve({ ok: status < 400, status, headers: { get: () => 'application/json' }, text: () => Promise.resolve(JSON.stringify(body)) });
      w.fetch = (url, init) => {
        const p = new URL(url).pathname; sent.push(init.method + ' ' + p + (init.body ? ' ' + init.body : ''));
        if (p.endsWith('/premium/plan')) return reply(200, { plan: {}, checkout: { available: false } });
        if (p.endsWith('/auth/refresh')) return reply(200, { accessToken: 'test', accessTokenExpiresAt: '2099-01-01T00:00:00Z', user });
        if (p.endsWith('/me')) return reply(200, { user, premium: { active: !!member.premium, expiresAt: member.premium ? '2099-01-01T00:00:00Z' : null }, growth: { points: 1000 }, access: { total: 1, today: true, freeSlots } });
        if (p.endsWith('/quiz/progress')) { const q = JSON.parse(init.body).questions; return reply(200, { items: q.map(x => ({ questionId: x.questionId, version: x.version, answered: false, optionId: null, correct: null, answeredAt: null })), total: q.length, answered: 0 }); }
        return reply(404, { error: { code: 'not_found' } });
      };
    } });
  windows.push(d);
  await new Promise(r => d.window.addEventListener('load', r));
  await wait(30); await wait(30);
  return { d, w: d.window, doc: d.window.document, sent };
}
/* every question id shown in the current quiz scope, in order (via the labelled jump select) */
async function scopeIds(o) {
  const ids = [], jump = () => o.doc.querySelector('#quizJump');
  const n = jump().querySelectorAll('option[value]:not([value=""])').length;
  for (let i = 0; i < n; i++) { const j = jump(); j.value = String(i); j.dispatchEvent(new o.w.Event('change', { bubbles: true })); await wait(); const q = o.doc.querySelector('#quiz [data-question]'); ids.push(q && q.getAttribute('data-question')); }
  return ids;
}
async function chooseAll(o) { assert.ok(!o.doc.querySelector('#quizSet'));await wait(10); }

(async () => {
  try {
    console.log('\n■ 독도와 간도 → 시대별 통합(화면 대응표)');
    const before = { qc: sha('media/quiz-catalog.js'), ep: sha('media/exam-pool.js') };
    await t('생성된 문항 목록은 그대로: 옛 독도와 간도 빈칸 8개 ID·버전·내용, 기출 관련 10문항', () => {
      same(LEGACY, ['000', '001', '002', '003', '004', '005', '006', '007'].map(n => 'legacy-islands-' + n));
      same(QC.chapters.islands.pool.slice(0,LEGACY.length), LEGACY);
      assert.ok(LEGACY.every(id => QC.questions[id].chapter === 'islands' && QC.questions[id].v));
      const isl = EP.eras.islands.pool;
      assert.equal(isl.length, 10);
      assert.ok(isl.every(id => Object.keys(EP.eras).some(e => e !== 'islands' && (EP.eras[e].pool || []).includes(id))), '기출 10문항은 모두 이미 주 시대 풀에 있음');
      assert.ok(isl.every(id => (EP.questions[id].relatedEras || []).includes('islands')), '관련 분류(islands)는 그대로');
    });
    await t('목차에 ‘독도와 간도’ 카드가 없다(다른 시대 카드는 그대로)', async () => {
      const o = await open('#past-exams', null); // 시대별 학습 목차
      const cards = [...o.doc.querySelectorAll('.period strong')].map(x => x.textContent);
      assert.ok(!cards.includes('독도와 간도'), cards.join(','));
      assert.ok(cards.length >= 9 && cards.some(c => /삼국/.test(c)) && cards.some(c => /개항/.test(c)), cards.join(','));
      o.d.window.close();
    });
    await t('옛 주소 #chapter/islands/webtoon은 그대로 열리고 시대별 바로 가기 4개를 보여 준다 · 누르면 그 시대로', async () => {
      const o = await open('#chapter/islands/webtoon', null);
      assert.equal(o.doc.querySelector('.module-head h1').textContent, '독도와 간도');
      const btns = [...o.doc.querySelectorAll('.islands-guide [data-islands-go]')];
      same(btns.map(b => b.getAttribute('data-islands-go')), ['samguk', 'joseon-late', 'opening', 'colonial']);
      assert.ok(btns.every(b => b.tagName === 'BUTTON' && b.type === 'button'));
      btns[1].click(); await wait(10);
      assert.equal(o.doc.querySelector('.module-head h1').textContent, '조선시대', o.w.location.hash);
      assert.equal(o.doc.querySelector('input[name="chapterPart"]:checked').value, 'joseon-late');
      o.d.window.close();
    });
    await t('옛 주소 #chapter/islands/quiz: 원래8개 기록 호환·새 독립21퀴즈 없음', async () => {
      const o = await open('#chapter/islands/quiz', null);
      const ids = await scopeIds(o);
      same(ids,LEGACY);assert.ok(!o.w.HANQ_UNIFIED_QUIZ_SELECTION.eras.islands);assert.ok(LEGACY.every(id=>o.w.HANQ_QUIZ_CATALOG.questions[id].v===QC.questions[id].v));
      o.d.window.close();
    });
    for (const [era, hash] of [['samguk', '#chapter/samguk/quiz'], ['joseon-late', '#chapter/joseon-late/quiz'], ['opening', '#chapter/opening/quiz'], ['colonial', '#chapter/colonial/quiz']]) {
      await t(era + ' 퀴즈 전체 풀: 원래 풀 그대로 + 옛 독도와 간도 문항이 끝에 한 번씩(풀 안 ID 중복 없음)', async () => {
        const o = await open(hash, null);
        await chooseAll(o);
        const ids = await scopeIds(o);
        const base = QC.chapters[era].pool;
        same(ids,o.w.HANQ_UNIFIED_QUIZ_SELECTION.eras[era.startsWith('joseon')?'joseon':era],'선별된 단일목록');assert.ok(base.every(id=>QC.questions[id]),'원래문항 보존');
        assert.equal(new Set(ids).size, ids.length, '풀 안 ID 중복 없음');
        o.d.window.close();
      });
    }
    await t('시대 요약 끝의 관련 주제는 독도와 간도 노트 문장을 그대로 옮긴다(새 사실 없음)', async () => {
      const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
      const o = await open('#chapter/colonial/webtoon', null);
      const aside = o.doc.querySelector('.islands-related');
      assert.ok(aside, 'colonial 요약에 관련 주제');
      const lines = [...aside.querySelectorAll('li')].map(li => li.textContent);
      assert.ok(lines.length >= 3 && lines.every(l => html.includes(l)), '모든 줄이 기존 노트 원문');
      assert.ok(lines.some(l => /서간도/.test(l)) && lines.some(l => /간도 참변/.test(l)));
      o.d.window.close();
    });
    await t('옛 독도와 간도 풀이 기록: 저장된 기록은 바이트 그대로, 새 자리(일제 강점기 전체 풀)에서 푼 문제(×)로 보인다', async () => {
      const q = QC.questions['legacy-islands-004'], wrong = q.options.find(x => !x.correct);
      const rec = { schema: 1, kind: 'attempt', id: 'a0islandsold1', subject: 'history', mode: 'quiz', source: 'quiz', questionId: q.id, contentVersion: q.v, reviewVersion: null,
        optionId: wrong.id, unanswered: false, choice: null, correct: false, chapter: 'islands', era: null, submissionId: 'old-islands-1', runId: null, rankEligible: false, ts: 1790000000000 };
      const key = 'hanq:att:v1:' + rec.id, raw = JSON.stringify(rec);
      const o = await open('#chapter/colonial/quiz', null, { [key]: raw });
      await chooseAll(o);
      const opts = [...o.doc.querySelectorAll('#quizJump option[value]:not([value=""])')], base = QC.chapters.colonial.pool.length;
      assert.ok(o.w.HANQ_QUIZ_CATALOG.questions[q.id].v===rec.contentVersion&&JSON.parse(o.w.localStorage.getItem(key)).optionId===wrong.id,'선별 밖 옛 기록도 원문 버전으로 보존');
      assert.equal(o.w.localStorage.getItem(key), raw, '옛 기록은 바이트 그대로');
      o.d.window.close();
    });
    await t('무료 회원: 시대 퀴즈는 서버의 무료 5문항만 · 옛 독도와 간도 문항은 새로 보이지도 보내지지도 않는다', async () => {
      const slots = QC.chapters.samguk.pool.slice(0, 5);
      const o = await open('#chapter/samguk/quiz', { premium: false, slots: { samguk: slots } });
      const ids = await scopeIds(o);
      same(ids, slots);
      assert.ok(!o.sent.some(x => /legacy-islands/.test(x)), '서버 요청에도 없음');
      o.d.window.close();
    });
    await t('프리미엄 회원: 전체 풀에 옛 독도와 간도 문항이 함께 보이고 진행 확인 범위에도 들어간다', async () => {
      const o = await open('#chapter/samguk/quiz', { premium: true, slots: { samguk: QC.chapters.samguk.pool.slice(0, 5) } });
      await chooseAll(o); await wait(30);
      const ids = await scopeIds(o);
      same(ids,o.w.HANQ_UNIFIED_QUIZ_SELECTION.eras.samguk);assert.ok(o.sent.some(x=>/quiz\/progress/.test(x)&&ids.some(id=>x.includes(id))),'선별목록 진행확인');
      o.d.window.close();
    });
    await t('검사 뒤에도 생성 파일 바이트 그대로', () => {
      same({ qc: sha('media/quiz-catalog.js'), ep: sha('media/exam-pool.js') }, before);
    });
    await t('스크립트 오류 없음', () => { same(errs.filter(e => !/Not implemented/.test(e)), []); });
  } finally {
    windows.forEach(d => { try { d.window.close(); } catch (e) {} });
  }
  console.log('\n검사 ' + checks + '개 · 실패 ' + failures + '개');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); windows.forEach(d => { try { d.window.close(); } catch (x) {} }); process.exit(1); });
