#!/usr/bin/env node
/* 나의 학습 기록·개인 랭크(media/activity-stats.js) 단위 검사 — 시계를 넣어 기다리지 않고 본다.
 *   node scripts/test-activity-stats.cjs */
'use strict';
const path = require('path');
const S = require(path.join(__dirname, '..', 'media', 'activity-stats.js'));
const P = require(path.join(__dirname, '..', 'media', 'learning-progress.js'));
const H = require(path.join(__dirname, '..', 'media', 'run-controller.js'));
let checks = 0, failures = 0;
function ok(c, m) { checks++; if (!c) { failures++; console.log('  ✗ ' + m); } }
function section(t) { console.log('\n■ ' + t); }
const J = JSON.stringify;
let n = 0; const att = (ts, o) => Object.assign({ id: 'a' + (++n).toString(36).padStart(7, '0'), subject: 'history', mode: 'quiz', questionId: 'q-1', correct: false, ts }, o || {});

section('1. 한국 날짜(UTC+9): 자정 · 해 바뀜 · 윤년 · 기기 시간대와 무관');
ok(S.kstDay(Date.UTC(2026, 9, 7, 14, 59, 59)) === '2026-10-07' && S.kstDay(Date.UTC(2026, 9, 7, 15, 0, 0)) === '2026-10-08', 'UTC 14:59:59 → 10-07, 15:00 → 10-08(한국 자정)');
ok(S.kstDay(Date.UTC(2026, 11, 31, 15, 0)) === '2027-01-01' && S.addDays('2026-12-31', 1) === '2027-01-01' && S.addDays('2027-01-01', -1) === '2026-12-31', '해 바뀜');
ok(S.kstDay(Date.UTC(2028, 1, 28, 15, 0)) === '2028-02-29' && S.addDays('2028-02-28', 1) === '2028-02-29' && S.addDays('2027-02-28', 1) === '2027-03-01', '윤년 2월 29일');
ok(S.kstDay(NaN) === null && S.kstDay(undefined) === null, '시각이 없으면 날짜도 없음');

section('2. 활동: 같은 기록 ID는 한 번 · 같은 문제 다시 풀기는 따로 · 서로 다른 문제 수 · 날짜 모름은 따로');
{
  const now = Date.UTC(2026, 9, 7, 16, 0); // 10-08 01:00 KST
  const a1 = att(Date.UTC(2026, 9, 7, 15, 30), { correct: true }), dup = Object.assign({}, a1);
  const list = [a1, dup, att(Date.UTC(2026, 9, 7, 15, 40)), att(Date.UTC(2026, 9, 7, 15, 50), { questionId: 'q-2', correct: true }), att(Date.UTC(2026, 9, 7, 14, 0)), att(NaN), att(undefined)];
  const A = S.activity(list, { now, days: 70 });
  ok(A.today === '2026-10-08' && A.todayCount === 3 && A.todayUnique === 2 && A.todayCorrect === 2, '오늘(10-08): 풀이 3번(같은 ID 중복 제외) · 서로 다른 문제 2');
  ok(A.total === 4 && A.correct === 2 && A.accuracy === 50 && A.uniqueQuestions === 2, '전체 풀이 4 · 정답률 50% · 서로 다른 문제 2');
  ok(A.dateUnknown === 2 && A.cells.reduce((s, c) => s + c.count, 0) === 4, '시각이 없는 기록 2건은 날짜 모름(잔디에 지어 넣지 않음)');
  ok(A.cells.length === 70 && A.cells[69].day === '2026-10-08' && A.cells[69].today && A.cells[68].day === '2026-10-07' && A.cells[68].count === 1 && A.cells[0].day === '2026-07-31', '잔디 70칸: 맨 끝이 오늘, 바로 앞이 어제(한국 날짜)');
  ok(A.cells[69].level === 2 && S.level(0) === 0 && S.level(2) === 1 && S.level(10) === 4, '색 단계 0 · 1–2 · 3–5 · 6–9 · 10+');
}

section('2-1. 과목: 기본은 한국사(history) · 다른 과목(예: toeic) 기록은 넣지 않음 · 과목이 없던 예전 기록은 한국사');
{
  // 조정자 브라우저 상황: 어제 한국사 오답 1 + 오늘 같은 문제 정답 2 + 오늘 토익 오답 1
  const now = Date.UTC(2026, 9, 8, 3, 0); // 10-08 12:00 KST
  const list = [att(Date.UTC(2026, 9, 7, 3, 0)), att(Date.UTC(2026, 9, 8, 1, 0), { correct: true }), att(Date.UTC(2026, 9, 8, 2, 0), { correct: true }), att(Date.UTC(2026, 9, 8, 2, 30), { subject: 'toeic', questionId: 't-1' })];
  const A = S.activity(list, { now });
  ok(A.todayCount === 2 && A.total === 3 && A.accuracy === 66.7 && A.uniqueQuestions === 1 && A.streak === 2, '한국사만: 오늘 2 · 전체 3 · 정답률 66.7% · 서로 다른 문제 1 · 연속 2일(토익 기록 제외)');
  const noSub = att(Date.UTC(2026, 9, 8, 2, 40)); delete noSub.subject;
  ok(S.activity(list.concat([noSub]), { now }).todayCount === 3, '과목이 없는 예전 기록은 한국사로 셈');
  ok(S.activity(list, { now, subject: 'toeic' }).total === 1 && S.activity([att(NaN, { subject: 'toeic' })], { now }).dateUnknown === 0, '다른 과목을 고르면 그 과목만 · 다른 과목의 날짜 모름도 한국사에 넣지 않음');
}

section('3. 연속 학습 · 빈 기록');
{
  const day = (d, h) => Date.UTC(2026, 9, d, h || 3); // 3시 UTC = 12시 KST
  const now = day(10);
  ok(S.activity([att(day(10)), att(day(9)), att(day(8)), att(day(6))], { now }).streak === 3, '오늘·어제·그제 → 3일(중간에 빈 날 뒤는 끊김)');
  ok(S.activity([att(day(9)), att(day(8))], { now }).streak === 2, '오늘 아직 안 했으면 어제까지 이어진 날');
  ok(S.activity([att(day(7))], { now }).streak === 0, '어제도 안 했으면 0');
  const E = S.activity([], { now });
  ok(E.total === 0 && E.accuracy === null && E.streak === 0 && E.todayCount === 0 && E.cells.every(c => c.count === 0 && c.level === 0), '기록이 없으면 모두 0(지어낸 잔디·숫자 없음)');
}

section('4. 오답 해결: 지금 다시 풀 수 있는 서로 다른 오답 중 해결 · 옛 기록은 빼고 따로');
{
  const W = S.wrongResolution([{ status: 'unresolved' }, { status: 'resolved' }, { status: 'resolved' }, { status: 'stale' }, { status: 'missing' }, { status: 'invalid' }]);
  ok(W.total === 3 && W.resolved === 2 && W.rate === 66.7 && W.excludedOld === 3, '해결 2 / 3(66.7%) · 옛 기록 3은 해결로 치지 않고 따로');
  ok(S.wrongResolution([]).rate === null, '오답이 없으면 비율 없음');
}

section('5. 개인 랭크: 순위 대상 고정 회차의 처음 결과만 · +10/−3 · 0 아래 없음 · 100점마다 레벨');
{
  const fin = (id, at, c, w, o) => Object.assign({ runId: id, product: 'fixed-mini', mode: 'fixed', rankEligible: true, seq: 1, title: id, kstDate: '2026-10-08', finalAt: at, reason: 'submit', submissionId: 'sub-' + id, score: { correct: c, wrong: w } }, o || {});
  ok(S.rank([]).points === 0 && S.rank([]).level === 1 && S.rank([]).events.length === 0, '없으면 0점 · 레벨 1');
  ok(S.rank([fin('rp', 1, 20, 0, { mode: 'personal', rankEligible: false, product: 'personal-mini' })]).points === 0, '개인 오답 모의고사(rankEligible:false)는 0');
  ok(S.rank([fin('rx', 1, 20, 0, { rankEligible: undefined })]).points === 0 && S.rank([fin('ry', 1, 20, 0, { kstDate: '' })]).points === 0, '순위 대상 표시가 없거나 날짜가 없으면 넣지 않음(이름·가격으로 짐작하지 않음)');
  const formal = { product: 'fixed-formal' };
  const one = S.rank([fin('r1', 100, 30, 20, formal)]);
  ok(one.points === 240 && one.level === 3 && one.events[0].delta === 240 && one.events[0].id === 'rank-sub-r1' && one.events[0].rulesVersion === 'hanq-rank-1', '실전 50(fixed-formal): 맞힘 30·틀림 20 → +300−60 = 240점 · 레벨 3 · 사건 id·규칙 버전');
  ok(S.rank([fin('r1', 100, 30, 20, formal), fin('r1', 200, 50, 0, formal)]).points === 240, '같은 회차가 두 번 있어도 처음 결과 한 번만');
  // 맞지 않는 결과는 지어 고치지 않고 건너뜀(상품 문항 수는 HanqRun.PRODUCTS에서)
  const bad = [
    ['모르는 상품', fin('b1', 1, 5, 0, { product: 'unknown' })],
    ['개인 상품인데 fixed로 적힘', fin('b2', 1, 5, 0, { product: 'personal-mini' })],
    ['결과의 종류가 fixed가 아님', fin('b3', 1, 5, 0, { mode: 'personal' })],
    ['음수 맞힘', fin('b4', 1, -1, 0)], ['소수 틀림', fin('b5', 1, 3, 1.5)], ['무한 맞힘', fin('b6', 1, Infinity, 0)], ['NaN 틀림', fin('b7', 1, 1, NaN)], ['문자 맞힘', fin('b8', 1, '5', 0)],
    ['미니 20인데 맞힘+틀림 50', fin('b9', 1, 30, 20)], ['미니 21문항', fin('b10', 1, 20, 1)]];
  bad.forEach(([name, f]) => ok(S.rank([f]).events.length === 0 && S.rank([f]).points === 0, '받지 않음: ' + name));
  ok(S.rank([fin('ok1', 1, 15, 3)]).points === 141, '내용이 바뀌어 채점하지 않은 문항이 있어 20보다 적은 결과(15+3)는 그대로 받음');
  ok(S.rank([fin('x1', 1, 5, 0, { product: 'mine' })], { products: { mine: { mode: 'fixed', rankEligible: true, size: 10 } } }).points === 50 && S.eligibleFinal(fin('x2', 1, 5, 0), null) === false, '상품 설정을 넣어 줄 수 있음 · 설정이 없으면 받지 않음');
  const two = S.rank([fin('r2', 300, 0, 20), fin('r1', 100, 9, 1)]);
  ok(two.events.map(e => e.runId).join(',') === 'r1,r2' && two.events[0].after === 87 && two.events[1].delta === -60 && two.points === 27, '다른 회차는 따로 · 시각 순 · 87 → −60 → 27');
  ok(S.rank([fin('r3', 1, 0, 20)]).points === 0 && S.rank([fin('r3', 1, 0, 20), fin('r4', 2, 10, 0)]).points === 100 && S.rank([fin('r3', 1, 0, 20), fin('r4', 2, 10, 0)]).level === 2, '0 아래로 내려가지 않음 · 100점이면 레벨 2');
}

section('6. 실제 저장소·회차 컨트롤러와 함께: 보통 풀이는 기록만 · 고정 회차 처음 결과만 랭크 · 다시 제출해도 한 번');
{
  let t = Date.UTC(2026, 9, 7, 16, 0);
  const Q = {}, E = {}, order = [];
  for (let i = 1; i <= 12; i++) { const id = 'q-' + String(i).padStart(3, '0'); Q[id] = { id, v: 'qv1', chapter: 'goryeo', options: ['a', 'b', 'c'].map(x => ({ id: id + '-' + x, correct: x === 'c' })) }; }
  for (let k = 1; k <= 50; k++) { const id = 'exam-79-' + String(k).padStart(2, '0'); E[id] = { id, v: 'mv1', exam: 79, number: k, points: 2, era: 'goryeo', answer: 3, options: [1, 2, 3, 4, 5].map(j => ({ id: id + '-option-' + j, correct: j === 3 })) }; order.push(id); }
  const storage = P.memoryStorage(), store = P.create({ storage, now: () => t }), ctl = H.create({ store, catalog: H.catalogFrom({ questions: Q }, { questions: E, order }), now: () => t, random: () => 0.3 });
  for (let i = 1; i <= 12; i++) { t += 1000; store.recordAttempt({ mode: 'quiz', source: 'quiz', questionId: 'q-' + String(i).padStart(3, '0'), contentVersion: 'qv1', optionId: 'q-' + String(i).padStart(3, '0') + '-a', correct: false, submissionId: 's' + i }); }
  t += 1000; store.recordAttempt({ mode: 'quiz', source: 'wrong-retry', questionId: 'q-001', contentVersion: 'qv1', optionId: 'q-001-c', correct: true, submissionId: 'r1', runId: 'rwrong1' });
  const pr = ctl.createPersonalRun({ product: 'personal-mini' }); ctl.start(pr.run.id); t += 1000; ctl.submit(pr.run.id);
  ok(S.rank(ctl.finalResults({ eligibleOnly: true })).points === 0 && S.rank(ctl.finalResults()).points === 0, '빈칸·오답 다시 풀기·개인 오답 모의고사만 했으면 랭크 0');
  const A1 = S.activity(store.attempts(), { now: t });
  ok(A1.total === 12 + 1 + 20 && A1.todayCount === 33, '활동에는 빈칸 12 + 다시 풀기 1 + 오답 모의고사 20 = 33번(모두 오늘)');
  const fx = ctl.createFixedRun({ product: 'fixed-mini', questionIds: order.slice(0, 20) }); ctl.start(fx.run.id);
  for (let k = 0; k < 15; k++) ctl.answer(fx.run.id, k, fx.run.items[k].questionId + '-option-3');
  for (let k = 15; k < 18; k++) ctl.answer(fx.run.id, k, fx.run.items[k].questionId + '-option-1');
  t += 1000; ctl.submit(fx.run.id); ctl.submit(fx.run.id); ctl.tickAll();
  const K = S.rank(ctl.finalResults({ eligibleOnly: true }));
  ok(K.events.length === 1 && K.events[0].correct === 15 && K.events[0].wrong === 5 && K.points === 135 && K.level === 2, '고정 미니(순위 대상) 처음 결과: 맞힘 15 · 틀림 5(답하지 않음 2 포함) → 150−15 = 135점 · 레벨 2 · 다시 제출해도 한 번');
  const again = H.create({ store: P.create({ storage, now: () => t }), catalog: H.catalogFrom({ questions: Q }, { questions: E, order }), now: () => t });
  ok(S.rank(again.finalResults({ eligibleOnly: true })).points === 135, '새로 고침(새 컨트롤러)해도 같은 랭크');
  const fx2 = ctl.createFixedRun({ product: 'fixed-mini', questionIds: order.slice(20, 40) }); ctl.start(fx2.run.id); t += 1000; ctl.submit(fx2.run.id);
  ok(S.rank(ctl.finalResults({ eligibleOnly: true })).points === 75 && S.rank(ctl.finalResults({ eligibleOnly: true })).events.length === 2, '두 번째 고정 회차는 따로 들어감(모두 답하지 않음: −60 → 75)');
  // 다른 탭이 남긴 기록도 같은 저장소에서 다시 계산
  const other = P.create({ storage, now: () => t }); t += 1000; other.recordAttempt({ mode: 'quiz', source: 'quiz', questionId: 'q-005', contentVersion: 'qv1', optionId: 'q-005-c', correct: true, submissionId: 'tab2' });
  store.invalidate(); ok(S.activity(store.attempts(), { now: t }).total === S.activity(other.attempts(), { now: t }).total, '다른 탭의 기록도 합쳐 다시 계산');
  const before = S.activity(store.attempts({ subject: 'history' }), { now: t }).total;
  t += 1000; store.recordAttempt({ subject: 'toeic', mode: 'quiz', source: 'quiz', questionId: 'toeic-1', contentVersion: 't1', optionId: 'x', correct: false, submissionId: 'toeic-1' });
  ok(S.activity(store.attempts({ subject: 'history' }), { now: t }).total === before && S.activity(store.attempts(), { now: t }).total === before && store.attempts({ subject: 'toeic' }).length === 1, '실제 저장소에 토익 기록이 있어도 한국사 활동은 그대로(앱처럼 subject 걸러 읽어도, 모두 읽어도) · 토익 기록은 지우지 않음');
  // 더 새 형식의 기록은 세지 않음(저장소가 건너뜀)
  storage.setItem(P.KEYS.attempt + 'afuture99', J({ schema: 9, kind: 'attempt', id: 'afuture99', ts: t }));
  store.invalidate(); ok(S.activity(store.attempts(), { now: t }).total === S.activity(other.attempts(), { now: t }).total, '더 새 형식 기록은 활동에 넣지 않음(지우지도 않음)');
  // 저장소가 막혀도(메모리) 이 탭의 기록으로 계산
  const blocked = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() {}, key() { return null; }, get length() { return 0; } };
  const M = P.create({ storage: blocked, now: () => t }); M.recordAttempt({ mode: 'quiz', source: 'quiz', questionId: 'q-001', contentVersion: 'qv1', optionId: 'q-001-a', correct: false, submissionId: 'm1' });
  ok(S.activity(M.attempts(), { now: t }).todayCount === 1 && M.status().backend === 'memory', '저장소가 막혀도 이 탭 기록으로 계산(알림은 저장소가 그대로)');
}

console.log('\n검사 ' + checks + ' · 실패 ' + failures);
process.exit(failures ? 1 : 0);
