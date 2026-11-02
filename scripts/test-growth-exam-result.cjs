#!/usr/bin/env node
/* 성장점수 옆 최종 시험 결과(서버가 저장한 점수·정답 수·문항 수) — 성장점수 기록 창 · 오답 복습 결과/기록 · CBT 결과/기록.
 * jsdom + 가짜 API(실제 서버·네트워크 없음). 점수는 서버 값만 쓰고, 모양이 이상하면 쪽 전체를 버리거나 점수를 빼고 보여 준다.
 *   JSDOM_PATH=/path/to/node_modules/jsdom node scripts/test-growth-exam-result.cjs */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const ROOT = path.resolve(__dirname, '..');
const { JSDOM } = require(process.env.JSDOM_PATH || 'jsdom');
let checks = 0, failures = 0;
const windows = [];
async function t(name, fn) { checks++; try { await fn(); } catch (e) { failures++; console.log('  ✗ ' + name + '\n    ' + String(e && e.stack || e).split('\n').slice(0, 5).join('\n    ')); } }
const settle = async () => { for (let i = 0; i < 15; i++) await new Promise(r => setTimeout(r, 0)); };
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222', RID = '88888888-8888-4888-8888-888888888888';
const USER = { id: A, email: 'a@x.test', displayName: '한동', createdAt: '2026-10-08T00:00:00Z' };

function fakeApi(o = {}) {
  const st = { enabled: true, status: 'online', epoch: 1, signedIn: true, restoring: false, ownerId: A, user: USER, premium: o.premium || { active: false, expiresAt: null },
    growth: { points: 1150 }, access: { total: 3, today: false }, profileStatus: 'ready', profileError: null };
  const calls = [], ls = [];
  const api = {
    calls, st,
    enabled: () => true, state: () => JSON.parse(JSON.stringify(st)), init: () => Promise.resolve(st), hasSessionHint: () => true,
    onChange: f => { ls.push(f); return () => { const i = ls.indexOf(f); if (i >= 0) ls.splice(i, 1); }; },
    emit: () => ls.slice().forEach(f => f(api.state())),
    plan: () => Promise.resolve({ plan: {}, checkout: { available: false } }),
    me: () => Promise.resolve({ user: USER, premium: st.premium, growth: st.growth, access: st.access }),
    attempts: () => Promise.resolve({ items: [], next: null }),
    runs: () => { calls.push('runs'); return Promise.resolve({ runs: o.runs || [] }); },
    wrongNotes: () => Promise.resolve({ counts: { unresolved: 0, resolved: 0 }, items: [] }),
    replays: () => Promise.resolve({ replays: [] }),
    study: () => Promise.resolve({ run: null, reason: 'empty' }),
    growthHistory: (cursor, limit) => { calls.push(['growth', cursor, limit]); return o.pages(cursor); },
    run: () => Promise.resolve(JSON.parse(JSON.stringify(o.run))),
    cbt: (m, p) => { calls.push(['cbt', m, p]); return Promise.resolve(JSON.parse(JSON.stringify(o.cbt[p]))); },
    importEntries: () => [],
  };
  return api;
}
function dom(api, url, files) {
  const d = new JSDOM('<!doctype html><body><main><section id="acRoot"></section></main></body>', { runScripts: 'outside-only', url: url || 'https://hanq.example/#account', pretendToBeVisual: true });
  windows.push(d);
  const w = d.window;
  let writes = 0; w.Storage.prototype.setItem = function () { writes++; };
  w.fetch = () => { throw new Error('no network'); };
  w.setInterval = () => 0; w.clearInterval = () => {};
  w.HanqApi = api;
  for (const f of files || ['characters.js', 'account-ui.js']) w.eval(fs.readFileSync(path.join(ROOT, 'media', f), 'utf8'));
  return { w, root: w.document.getElementById('acRoot'), writes: () => writes };
}
const ctx = (view = 'main') => ({ view, go: () => {}, local: { attempts: () => [] }, summaryTargets: () => [] });
const row = (reason, points, createdAt, examResult) => (examResult === undefined ? { reason, points, createdAt } : { reason, points, createdAt, examResult });
const ex = (score, correct, total) => ({ score, maxScore: 100, correct, total });
async function openDialog(pages) {
  const api = fakeApi({ pages: c => Promise.resolve(JSON.parse(JSON.stringify(typeof pages === 'function' ? pages(c) : pages[c || '']))) }), d = dom(api);
  await d.w.HanqAccountUI.render(d.root, ctx()); await settle();
  d.root.querySelector('#acScore').click(); await settle();
  const dlg = d.w.document.getElementById('acGrowthDialog');
  return { api, d, dlg, rows: () => [...dlg.querySelectorAll('.ac-gd-item')].map(li => [li.querySelector('.ac-gd-reason').textContent, li.querySelector('.ac-gd-exam') ? li.querySelector('.ac-gd-exam').textContent : null, li.querySelector('.ac-gd-points').textContent]) };
}

(async () => {
  try {
    console.log('\n■ 성장점수 옆 최종 시험 결과');
    await t('기록 창: 오답노트 45/100점 · 9/20문항 정답 → 성장점수 -100점 · CBT 82/100점 · 41/50문항 · 높은 점수 · 0점 · 예전 기록은 원래 사유만', async () => {
      const { dlg, rows, d } = await openDialog({ '': { items: [
        row('wrong-note-study', -100, '2026-10-09T06:00:00.000Z', ex(45, 9, 20)),
        row('cbt-exam', 150, '2026-10-09T05:00:00.000Z', ex(82, 41, 50)),
        row('wrong-note-study', 200, '2026-10-09T04:00:00.000Z', ex(95, 19, 20)),
        row('wrong-note-study', -100, '2026-10-09T03:00:00.000Z', ex(0, 0, 20)),
        row('wrong-note-study', 50, '2026-10-08T05:00:00.000Z', null),
        row('cbt-exam', 100, '2026-10-08T04:30:00.000Z'),
        row('signup', 1000, '2026-10-08T03:00:00.000Z'),
      ], next: null } });
      assert.deepEqual(rows(), [
        ['오답노트 도전 결과', '45/100점 · 9/20문항 정답 → 성장점수', '-100점'],
        ['모의고사 성장점수', '82/100점 · 41/50문항 정답 → 성장점수', '+150점'],
        ['오답노트 도전 결과', '95/100점 · 19/20문항 정답 → 성장점수', '+200점'],
        ['오답노트 도전 결과', '0/100점 · 0/20문항 정답 → 성장점수', '-100점'],
        ['오답노트 도전 결과', null, '+50점'],
        ['모의고사 성장점수', null, '+100점'],
        ['회원가입 보너스', null, '+1,000점'],
      ]);
      assert.ok(dlg.querySelector('.ac-gd-item.is-minus .ac-gd-exam'), '차감 줄에도 시험 결과');
      assert.ok(!/%|퍼센트/.test(dlg.textContent), '퍼센트를 지어내지 않음');
      assert.equal(d.writes(), 0, '저장소 기록 없음');
    });
    await t('잘못된 examResult가 한 줄이라도 있으면 쪽 전체를 붙이지 않음(사유·키·범위·정수·CBT 50문항·문자열)', async () => {
      const bads = [
        row('signup', 1000, '2026-10-08T03:00:00.000Z', ex(45, 9, 20)),
        row('practice-quiz', 1, '2026-10-08T03:00:00.000Z', ex(45, 9, 20)),
        row('wrong-note-study', -100, '2026-10-08T03:00:00.000Z', Object.assign(ex(45, 9, 20), { runId: RID })),
        row('wrong-note-study', -100, '2026-10-08T03:00:00.000Z', { score: 45, correct: 9, total: 20 }),
        row('wrong-note-study', -100, '2026-10-08T03:00:00.000Z', ex(101, 9, 20)),
        row('wrong-note-study', -100, '2026-10-08T03:00:00.000Z', ex(-1, 9, 20)),
        row('wrong-note-study', -100, '2026-10-08T03:00:00.000Z', ex(45.5, 9, 20)),
        row('wrong-note-study', -100, '2026-10-08T03:00:00.000Z', ex('45', 9, 20)),
        row('wrong-note-study', -100, '2026-10-08T03:00:00.000Z', ex(45, 21, 20)),
        row('wrong-note-study', -100, '2026-10-08T03:00:00.000Z', ex(45, 9, 0)),
        row('wrong-note-study', -100, '2026-10-08T03:00:00.000Z', Object.assign(ex(45, 9, 20), { maxScore: 50 })),
        row('cbt-exam', 150, '2026-10-08T03:00:00.000Z', ex(82, 41, 20)),
        row('cbt-exam', 150, '2026-10-08T03:00:00.000Z', '<img src=x onerror=alert(1)>'),
        row('cbt-exam', 150, '2026-10-08T03:00:00.000Z', [82, 41, 50]),
      ];
      for (const bad of bads) {
        const { dlg, d } = await openDialog({ '': { items: [row('signup', 1000, '2026-10-08T03:00:00.000Z'), bad], next: null } });
        assert.equal(dlg.querySelectorAll('.ac-gd-item').length, 0, JSON.stringify(bad));
        assert.equal(dlg.querySelector('#acGrowthStatus').getAttribute('data-error'), '1');
        assert.equal(dlg.querySelector('img'), null);
        d.w.HanqAccountUI.stop();
      }
    });
    await t('쪽 넘김: 시험 결과가 있는 다음 쪽은 한 번만 붙고, 실패한 쪽을 다시 시도해도 중복 없음 · 계정이 바뀌면 늦은 쪽 버림', async () => {
      let broken = true;
      const { dlg, rows, api, d } = await openDialog(c => (!c ? { items: [row('wrong-note-study', -100, '2026-10-09T06:00:00.000Z', ex(45, 9, 20))], next: 'c2' }
        : broken ? { items: [row('cbt-exam', 150, '2026-10-09T05:00:00.000Z', ex(82, 41, 49))], next: null }
          : { items: [row('cbt-exam', 150, '2026-10-09T05:00:00.000Z', ex(82, 41, 50))], next: null }));
      dlg.querySelector('#acGrowthMore').click(); await settle();
      assert.equal(rows().length, 1, '이상한 다음 쪽은 버림');
      broken = false;
      dlg.querySelector('#acGrowthMore').click(); await settle();
      assert.deepEqual(rows().map(r => r[1]), ['45/100점 · 9/20문항 정답 → 성장점수', '82/100점 · 41/50문항 정답 → 성장점수']);
      dlg.querySelector('#acGrowthMore').hidden = false;
      api.st.ownerId = B; api.st.user = Object.assign({}, USER, { id: B }); api.st.epoch++; api.emit(); await settle();
      assert.equal(d.w.document.getElementById('acGrowthDialog'), null, '다른 계정이 되면 창을 닫음');
    });
    await t('오답 복습 결과 화면: 서버가 저장한 시험점수·정답 수와 차감 이유가 분명함 · 예전 기록은 점수를 지어내지 않음', async () => {
      const mk = score => ({ run: { id: RID, title: '1회차 오답 복습', status: 'final', durationMs: 1800000, durationPolicy: 'practice', selection: { mode: 'wrong-note-study', challenge: true }, serverTime: '2026-10-09T03:20:00.000Z', startedAt: '2026-10-09T03:00:00.000Z', endsAt: '2026-10-09T03:30:00.000Z', finalAt: '2026-10-09T03:10:00.000Z', finalReason: 'submit', score },
        items: Array.from({ length: 20 }, (_, i) => ({ position: i, questionId: 'q' + i, version: '1', kind: 'quiz', optionOrder: ['o1', 'o2'], item: { id: 'q' + i, q: '문제', options: [{ id: 'o1', text: '가' }, { id: 'o2', text: '나' }] }, answerOptionId: 'o1', result: { correct: i < 9, correctOptionId: i < 9 ? 'o1' : 'o2' } })) });
      const view = async score => { const api = fakeApi({ premium: { active: true, expiresAt: '2099-01-01T00:00:00Z' }, run: mk(score), pages: () => Promise.resolve({ items: [], next: null }) }); const d = dom(api, 'https://hanq.example/#account/study/' + RID, ['quiz-review.js', 'characters.js', 'account-ui.js']); await d.w.HanqAccountUI.render(d.root, ctx('study/' + RID)); await settle(); const text = d.root.textContent; d.w.HanqAccountUI.stop(); return text; };
      const text = await view({ questions: 20, correct: 9, wrong: 11, answered: 20, unanswered: 0, examScore: 45, growthReward: -100, rewardEligible: true });
      assert.match(text, /시험점수 45 \/ 100점/);
      assert.match(text, /성장점수 -100점 — 시험점수 45점\(9\/20문항 정답\) · 60점 미만이라 차감 · 회차당 한 번 정산/);
      assert.match(text, /기준: 60점 미만 −100 · 60~69점 \+50/);
      const high = await view({ questions: 20, correct: 19, wrong: 1, answered: 20, unanswered: 0, examScore: 95, growthReward: 200, rewardEligible: true });
      assert.match(high, /성장점수 \+200점 — 시험점수 95점\(19\/20문항 정답\) · 90점 이상 구간 보상/);
      const legacy = await view({ questions: 20, correct: 9, wrong: 11, answered: 20, unanswered: 0, rewardEligible: true, growthReward: -100 });
      assert.doesNotMatch(legacy, /시험점수 \d+ \/ 100점/, '저장된 시험점수가 없으면 9×100/20을 계산해 보이지 않음');
      assert.match(legacy, /저장된 점수 정보가 완전하지 않아요/);
      const practice = await view({ questions: 20, correct: 9, wrong: 11, answered: 20, unanswered: 0, examScore: 45, growthReward: 0, rewardEligible: false });
      assert.match(practice, /성장점수 변동 없음/);
    });
    await t('완료한 오답 복습 기록: 회차마다 저장된 시험점수·정답 수·성장점수 · 이상한 값은 빼고 보여 줌', async () => {
      const runs = [
        { id: RID, title: '3회차 오답 복습', status: 'final', finalAt: '2026-10-09T03:10:00.000Z', score: { questions: 20, correct: 9, examScore: 45, growthReward: -100, rewardEligible: true } },
        { id: '99999999-9999-4999-8999-999999999999', title: '2회차 오답 복습', status: 'final', finalAt: '2026-10-08T03:10:00.000Z', score: { questions: 20, correct: 9 } },
        { id: '77777777-7777-4777-8777-777777777777', title: '1회차 오답 복습', status: 'final', finalAt: '2026-10-07T03:10:00.000Z', score: { questions: 20, correct: '<b>9</b>', examScore: 450 } },
      ];
      const api = fakeApi({ premium: { active: true, expiresAt: '2099-01-01T00:00:00Z' }, runs, pages: () => Promise.resolve({ items: [], next: null }) }), d = dom(api, 'https://hanq.example/#account/notes');
      await d.w.HanqAccountUI.render(d.root, ctx('notes')); await settle();
      const s = [...d.root.querySelectorAll('.ac-study-score')].map(x => x.textContent);
      assert.deepEqual(s, ['시험점수 45/100점 · 9/20문항 정답 → 성장점수 -100점', '9/20문항 정답'], '예전 기록은 정답 수만 · 깨진 값은 아무것도 안 보임');
      assert.equal(d.root.querySelectorAll('.ac-study-result').length, 3, '결과 다시 보기 단추는 그대로');
      assert.equal(d.root.querySelector('b b'), null);
    });
    await t('CBT: 결과 성장점수 유지 · 기록은 회차/점수/정답수/응시일시·상태 다섯 열 · 이상한 결과 생략', async () => {
      const result = { round: 75, total: 50, maxScore: 100, score: 45, correct: 22, wrong: 28, unanswered: 0, answered: 50, grade: null, passed: false, growthReward: -100, stats: { eras: { buckets: [], excluded: { count: 0, positions: [] } }, parts: { buckets: [] } } };
      const runs = [{ id: RID, round: 75, status: 'final', createdAt: '2026-10-09T03:00:00.000Z', result },
        { id: '99999999-9999-4999-8999-999999999999', round: 74, status: 'final', createdAt: '2026-10-08T03:00:00.000Z', result: Object.assign({}, result, { total: 20 }) },
        { id: '77777777-7777-4777-8777-777777777777', round: 73, status: 'active', createdAt: '2026-10-07T03:00:00.000Z', result: null }];
      const api = fakeApi({ pages: () => Promise.resolve({ items: [], next: null }), cbt: { '/api/v1/cbt/rounds': { rounds: [], imagesConfigured: true }, '/api/v1/cbt/runs': { runs }, '/api/v1/cbt/reviews': {reviews:[]}, ['/api/v1/cbt/runs/'+RID+'/stars']:{signature:'[]',flags:[]}, ['/api/v1/cbt/runs/' + RID]: { run: runs[0], items: [] } } });
      const d = new JSDOM('<!doctype html><body><main id="h"></main></body>', { runScripts: 'outside-only', url: 'https://hanq.example/#formal-exams', pretendToBeVisual: true });
      windows.push(d);
      const w = d.window; w.setInterval = () => 0; w.clearInterval = () => {};
      w.eval(fs.readFileSync(path.join(ROOT, 'media', 'formal-exams.js'), 'utf8'));
      const host = w.document.getElementById('h');
      w.HanqFormalExams.mount(host, { api, review: {}, onRoute: () => {}, onHome: () => {}, onAccount: () => {}, onNotes: () => {}, onLearn: () => {} });
      await settle();
      const btns = [...host.querySelectorAll('[data-run]')].map(b => b.textContent);
      assert.match(btns[0], /결과 보기/);
      assert.match(btns[1], /결과 보기/);
      const table=host.querySelector('.fe-runs-table');
      assert.equal(table.querySelectorAll('thead th').length,5);
      assert.equal(table.querySelector('tbody tr td').textContent,'제75회');
      assert.equal(table.querySelector('tbody tr td:nth-child(2)').textContent,'45 / 100점');
      assert.equal(table.querySelector('tbody tr td:nth-child(3)').textContent,'22 / 50');
      assert.equal(table.querySelectorAll('tbody tr')[1].querySelectorAll('td')[1].textContent,'—');
      assert.doesNotMatch(table.textContent,/성장점수/);
      assert.match(btns[2], /이어서 풀기/);
      host.querySelector('[data-run="' + RID + '"]').click(); await settle();
      const fin = host.querySelector('.fe-growth');
      assert.ok(fin, '결과 화면 ' + host.textContent.slice(0, 200));
      assert.match(fin.textContent, /성장점수 -100점 — 최종 점수 45\/100점\(22\/50문항 정답\)이 60점 미만이라 차감/);
      assert.match(fin.textContent, /기준: 60점 미만 −100/);
      w.HanqFormalExams.stop();
    });
    await t('CSS: 시험 결과 줄은 기록 창 격자 안 · 고정 폭 없음(작은 화면에서 줄바꿈)', async () => {
      const css = fs.readFileSync(path.join(ROOT, 'media', 'account-ui.css'), 'utf8');
      assert.match(css, /grid-template-areas:"reason points" "exam points" "time points"/);
      assert.match(css, /\.ac-gd-exam\{grid-area:exam;font-size:14px;color:#3b4252;overflow-wrap:anywhere\}/);
    });
  } finally {
    windows.forEach(d => { try { d.window.close(); } catch (e) {} });
  }
  console.log('Growth exam result ' + checks + '개 · 실패 ' + failures + '개');
  process.exit(failures ? 1 : 0);
})();
