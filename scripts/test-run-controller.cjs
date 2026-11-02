#!/usr/bin/env node
/* 모의고사 회차 컨트롤러(media/run-controller.js) 단위 검사 — 가짜 시계·가짜 문항 묶음으로 80분을 기다리지 않고 본다.
 *   node scripts/test-run-controller.cjs
 * 실제 앱 문항(500 기출·빈칸 카탈로그)으로 보는 화면 검사는 verify-hanq.cjs 4절 끝에 있다. */
'use strict';
const path = require('path');
const P = require(path.join(__dirname, '..', 'media', 'learning-progress.js'));
const H = require(path.join(__dirname, '..', 'media', 'run-controller.js'));
let checks = 0, failures = 0;
function ok(c, m) { checks++; if (!c) { failures++; console.log('  ✗ ' + m); } }
function section(t) { console.log('\n■ ' + t); }
const J = JSON.stringify, MIN = 60000;

/* 가짜 문항: 빈칸 q-001…q-040(보기 4, 정답 c) · 기출 제79회 1–50 · 제78회 1–10(배점 1–3, 정답 ③) */
function makeCatalog(opts) {
  opts = opts || {};
  const Q = {}, E = {}, order = [];
  for (let i = 1; i <= 40; i++) { const id = 'q-' + String(i).padStart(3, '0'); Q[id] = { id, v: 'qv1', chapter: 'goryeo', options: ['a', 'b', 'c', 'd'].map(x => ({ id: id + '-' + x, correct: x === 'c' })) }; }
  const rounds = opts.rounds || [[79, 50], [78, 10]];
  rounds.forEach(([r, n]) => { for (let k = 1; k <= n; k++) { const id = 'exam-' + r + '-' + String(k).padStart(2, '0'); E[id] = { id, v: 'mv1', exam: r, number: k, points: (k % 3) + 1, era: 'goryeo', answer: 3, options: [1, 2, 3, 4, 5].map(j => ({ id: id + '-option-' + j, correct: j === 3 })) }; order.push(id); } });
  order.reverse(); // 일부러 섞인 순서로 넘겨도 최신 회차부터 고르는지
  return { Q, E, cat: H.catalogFrom({ questions: Q }, { questions: E, order }) };
}
function setup(opts) {
  opts = opts || {};
  const clock = { t: Date.UTC(2026, 9, 7, 15, 30) }; // 2026-10-08 00:30 KST
  const storage = opts.storage || P.memoryStorage(), C = opts.catalog || makeCatalog(opts);
  const store = P.create({ storage, now: () => clock.t, random: Math.random });
  let seed = 1; const rnd = opts.random || (() => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; });
  const ctl = H.create({ store, catalog: C.cat, now: () => clock.t, random: rnd });
  return { clock, storage, store, ctl, C, rnd };
}
let subN = 0;
function miss(S, mode, id, extra) { // 틀리기(시계를 1초씩 움직여 최근 순서를 만듦)
  S.clock.t += 1000; const it = mode === 'mock' ? S.C.E[id] : S.C.Q[id], wrong = it.options.find(o => !o.correct).id;
  const r = S.store.recordAttempt(Object.assign({ mode, source: mode, questionId: id, contentVersion: it.v, optionId: wrong, correct: false, submissionId: 'miss-' + (++subN) }, extra || {}));
  if (!r.ok) throw new Error('miss failed ' + id);
}
const qid = i => 'q-' + String(i).padStart(3, '0');

section('1. 문턱: 서로 다른 오답 9문제는 만들 수 없고 10문제부터 · 같은 문제를 여러 번 틀려도 1문제');
{
  const S = setup();
  for (let i = 1; i <= 9; i++) miss(S, 'quiz', qid(i));
  miss(S, 'quiz', qid(1)); miss(S, 'quiz', qid(2)); // 다시 틀림 — 수가 늘면 안 됨
  let pf = S.ctl.preflight({ product: 'personal-mini' });
  ok(pf.eligibleWrong === 9 && !pf.canCreate && pf.minWrongs === 10, '오답 9문제(반복 오답 포함) → 만들 수 없음');
  const r9 = S.ctl.createPersonalRun({ product: 'personal-mini' });
  ok(!r9.ok && r9.reason === 'not-enough-wrongs' && S.store.progressViews('run-').length === 0, '9문제로 만들기를 눌러도 회차가 생기지 않음');
  miss(S, 'quiz', qid(10));
  pf = S.ctl.preflight({ product: 'personal-mini' });
  ok(pf.eligibleWrong === 10 && pf.canCreate, '10문제 → 만들 수 있음');
}

section('2. 정원보다 적은 오답: 오답 모두 + 보유 기출 최신 회차부터 보충(겹치는 기출 오답은 다시 넣지 않음)');
{
  const S = setup();
  for (let i = 1; i <= 9; i++) miss(S, 'quiz', qid(i));
  miss(S, 'mock', 'exam-79-01'); miss(S, 'mock', 'exam-78-04'); miss(S, 'mock', 'exam-78-04');
  const pf = S.ctl.preflight({ product: 'personal-mini' });
  ok(pf.eligibleWrong === 11 && pf.quizWrong === 9 && pf.mockWrong === 2 && pf.selectedWrong === 11 && pf.fill === 9 && pf.total === 20 && pf.shortBy === 0 && pf.leftOutWrong === 0, '미리 보기: 오답 11(빈칸·확인 9 + 기출 2) + 최신 기출 보충 9 = 20');
  const c = S.ctl.createPersonalRun({ product: 'personal-mini' });
  ok(c.ok && c.run.items.length === 20, '회차 20문항');
  const fills = c.run.items.filter(x => x.origin === 'fill').map(x => x.questionId);
  ok(J(fills) === J(['exam-79-02', 'exam-79-03', 'exam-79-04', 'exam-79-05', 'exam-79-06', 'exam-79-07', 'exam-79-08', 'exam-79-09', 'exam-79-10']), '보충은 제79회부터 문항 번호 순, 이미 넣은 기출 오답(79-01)은 건너뜀: ' + fills.join(' '));
  const keys = c.run.items.map(x => x.mode + '|' + x.questionId);
  ok(new Set(keys).size === 20 && c.run.items.filter(x => x.origin === 'wrong-mock').length === 2 && c.run.items.filter(x => x.origin === 'wrong-quiz').length === 9, '중복 없음 · 출처 구분(빈칸·확인 오답 / 기출 오답 / 최신 기출 보충)');
  ok(c.run.items.every((x, n) => x.n === n) && c.run.items.filter(x => x.mode === 'mock').every(x => x.points >= 1 && x.points <= 3 && x.pointsKind === 'official' && x.source.exam && x.source.number) && c.run.items.filter(x => x.mode === 'quiz').every(x => x.points === 1 && x.pointsKind === 'practice' && x.source === null),
    '기출은 원래 배점(1–3)·원래 회차·번호, 빈칸·확인문제는 연습 1점(공식 회차·번호를 지어내지 않음)');
}

section('3. 정원과 같음 · 정원보다 많음(최근 틀린 순 / 무작위) · 실전 50');
{
  const S = setup();
  for (let i = 1; i <= 20; i++) miss(S, 'quiz', qid(i));
  let pf = S.ctl.preflight({ product: 'personal-mini' });
  ok(pf.selectedWrong === 20 && pf.fill === 0 && pf.total === 20, '오답 20 = 정원: 보충 없음');
  for (let i = 21; i <= 25; i++) miss(S, 'quiz', qid(i));
  pf = S.ctl.preflight({ product: 'personal-mini', order: 'recent' });
  ok(pf.eligibleWrong === 25 && pf.selectedWrong === 20 && pf.leftOutWrong === 5 && pf.fill === 0, '오답 25 > 정원 20: 20문제만, 나머지 5문제는 오답노트에 그대로');
  const rec = S.ctl.createPersonalRun({ product: 'personal-mini', order: 'recent' });
  const got = rec.run.items.map(x => x.questionId).sort(), want = Array.from({ length: 20 }, (_, i) => qid(i + 6)).sort();
  ok(J(got) === J(want) && rec.run.items[0].questionId === qid(25), '최근 틀린 순: 마지막에 틀린 q-025부터 20문제(q-006–q-025)');
  const rnd = S.ctl.createPersonalRun({ product: 'personal-mini', order: 'random' });
  const ids = rnd.run.items.map(x => x.questionId);
  ok(rnd.ok && ids.length === 20 && new Set(ids).size === 20 && ids.every(id => +id.slice(2) >= 1 && +id.slice(2) <= 25), '무작위: 25문제 중 겹치지 않게 20문제');
  const S2 = setup(), S3 = setup();
  for (const s of [S2, S3]) for (let i = 1; i <= 25; i++) miss(s, 'quiz', qid(i));
  ok(J(S2.ctl.createPersonalRun({ product: 'personal-mini', order: 'random' }).run.items.map(x => x.questionId)) === J(S3.ctl.createPersonalRun({ product: 'personal-mini', order: 'random' }).run.items.map(x => x.questionId)), '같은 난수 씨앗이면 무작위 고르기도 같음(시험에서 다시 만들 수 있음)');
  const f = S.ctl.createPersonalRun({ product: 'personal-formal' });
  ok(f.ok && f.run.items.length === 50 && f.run.selection.selectedWrong === 25 && f.run.selection.fill === 25 && f.run.product.durationMs === 80 * MIN && f.run.product.size === 50, '실전 50: 오답 25 + 보충 25 · 80분');
}

section('4. 내용이 바뀐 오답·다른 과목 오답은 세지 않음 · 보충할 기출이 모자라면 지어내지 않음');
{
  const C = makeCatalog({ rounds: [[79, 5]] }), S = setup({ catalog: C });
  for (let i = 1; i <= 10; i++) miss(S, 'quiz', qid(i));
  miss(S, 'quiz', qid(11), { contentVersion: 'old-v' }); // 예전 내용으로 틀림
  S.store.recordAttempt({ subject: 'toeic', mode: 'quiz', source: 'quiz', questionId: 'toeic-1', contentVersion: 't', optionId: 'x', correct: false, submissionId: 'tt' });
  const pf = S.ctl.preflight({ product: 'personal-mini' });
  ok(pf.eligibleWrong === 10 && pf.excluded.stale === 1, '예전 내용의 오답 1개는 세지 않고 따로 알림 · 다른 과목 기록은 셈에서 빠짐');
  ok(pf.fill === 5 && pf.total === 15 && pf.shortBy === 5, '보충할 기출이 5문제뿐: 15문제 · 모자란 5문제를 알림');
  const c = S.ctl.createPersonalRun({ product: 'personal-mini' });
  ok(c.ok && c.run.items.length === 15 && c.run.selection.shortBy === 5, '모자란 만큼 문제를 지어내지 않고 15문제로 만듦');
  ok(S.store.attempts().length === 12, '기록은 하나도 지우지 않음');
}

section('5. 회차 기록: 한국 날짜 + 내 회차 번호 · 고정된 문항·순서 · 채점 전에는 정답을 담지 않음');
{
  const S = setup();
  for (let i = 1; i <= 12; i++) miss(S, 'quiz', qid(i));
  const a = S.ctl.createPersonalRun({ product: 'personal-mini' }).run, b = S.ctl.createPersonalRun({ product: 'personal-formal' }).run;
  ok(a.seq === 1 && b.seq === 2 && a.kstDate === '2026-10-08' && a.title === '26/10/08 · 1회차 오답 미니모의고사' && b.title === '26/10/08 · 2회차 오답 실전모의고사', '제목: 한국 날짜 26/10/08 · HanQ 회차 번호 1, 2');
  const raw = S.storage.getItem(P.KEYS.progress + 'run-' + a.id);
  ok(raw && !/correct/i.test(raw) && !/"answer"/.test(raw) && a.status === 'ready' && a.startAt === null && a.final === null, '만든 회차에는 정답·정답 표시가 없음 · 아직 시작 전');
  ok(a.product.rankEligible === false && a.purchase === null && !('futurePriceKRW' in a.product), '오답 회차는 순위 대상 아님 · 구매 정보 없음(가격은 설정에만)');
  const S2 = { store: P.create({ storage: S.storage, now: () => S.clock.t }) }, ctl2 = H.create({ store: S2.store, catalog: S.C.cat, now: () => S.clock.t, random: () => 0.9 });
  ok(J(ctl2.get(a.id).items) === J(a.items), '새로 고침(새 컨트롤러): 같은 문항·보기 순서 그대로(다시 뽑지 않음)');
  ok(H.PRODUCTS['personal-mini'].futurePriceKRW === 500 && H.PRODUCTS['personal-formal'].futurePriceKRW === 1000 && H.PRODUCTS['personal-mini'].durationMin === 30 && H.PRODUCTS['personal-formal'].durationMin === 80 && Object.isFrozen(H.PRODUCTS), '상품 설정 한곳: 20문항 30분(연습) · 50문항 80분(공식) · 앞으로의 가격 500/1000원');
}

section('6. 시작 · 답 저장 · 이동 · 새로 고침 · 잘못된 보기');
{
  const S = setup();
  for (let i = 1; i <= 12; i++) miss(S, 'quiz', qid(i));
  const id = S.ctl.createPersonalRun({ product: 'personal-mini' }).run.id;
  ok(S.ctl.answer(id, 0, S.ctl.get(id).items[0].optionIds[0]).reason === 'not-started', '시작 전에는 답을 받지 않음');
  const t0 = S.clock.t, st = S.ctl.start(id);
  ok(st.run.status === 'active' && st.run.startAt === t0 && st.run.endAt === t0 + 30 * MIN, '시작: startAt·endAt(30분)을 절대 시각으로 저장');
  S.clock.t += 5 * MIN; ok(S.ctl.start(id).run.endAt === t0 + 30 * MIN, '다시 시작을 눌러도 마감은 그대로(다시 시작하지 않음)');
  const it0 = S.ctl.get(id).items[0], it5 = S.ctl.get(id).items[5];
  S.ctl.answer(id, 0, it0.optionIds[1]); S.ctl.go(id, 5); S.ctl.answer(id, 5, it5.optionIds[2]);
  ok(!S.ctl.answer(id, 5, 'nope').ok && S.ctl.answer(id, 99, it0.optionIds[0]).reason === 'index', '없는 보기·없는 번호는 받지 않음');
  const ctl2 = H.create({ store: P.create({ storage: S.storage, now: () => S.clock.t }), catalog: S.C.cat, now: () => S.clock.t });
  const r2 = ctl2.get(id);
  ok(r2.answers['0'].optionId === it0.optionIds[1] && r2.answers['5'].optionId === it5.optionIds[2] && r2.current === 5 && r2.endAt === t0 + 30 * MIN, '새로 고침: 답·지금 문제·마감 그대로');
  ok(S.ctl.answer(id, 0, null).ok && S.ctl.get(id).answers['0'].optionId === null, '답 지우기(null)');
  ok(!S.store.attempts().some(a => a.source === 'run'), '답을 고르는 것만으로는 채점 기록이 생기지 않음');
}

section('7. 일시정지: 화면만 가림 · 시간은 계속 · 한 번 최대 5분 · 3번까지 · 새로 고침·두 탭에서도 3번');
{
  const S = setup();
  for (let i = 1; i <= 12; i++) miss(S, 'quiz', qid(i));
  const id = S.ctl.createPersonalRun({ product: 'personal-mini' }).run.id; S.ctl.start(id);
  const end = S.ctl.get(id).endAt, it = S.ctl.get(id).items[0];
  let p = S.ctl.pause(id);
  ok(p.ok && S.ctl.pauseState(p.run).paused && p.run.pause.log[0].until === S.clock.t + 5 * MIN && p.run.endAt === end, '일시정지 1: 5분 · 마감은 그대로');
  ok(S.ctl.answer(id, 0, it.optionIds[0]).reason === 'paused' && S.ctl.go(id, 3).reason === 'paused', '가린 동안에는 답·이동을 받지 않음');
  ok(S.ctl.pause(id).reason === 'paused' && S.ctl.get(id).pause.count === 1, '가린 채 다시 눌러도 횟수가 늘지 않음');
  S.clock.t += 5 * MIN; // 5분이 지나면 저절로 풀림
  ok(!S.ctl.pauseState(S.ctl.get(id)).paused && S.ctl.answer(id, 0, it.optionIds[0]).ok, '5분 뒤 저절로 풀림 → 답을 받음');
  p = S.ctl.pause(id); S.clock.t += MIN; ok(S.ctl.resume(id).ok && !S.ctl.pauseState(S.ctl.get(id)).paused, '일시정지 2: 일찍 다시 풀기');
  const other = H.create({ store: P.create({ storage: S.storage, now: () => S.clock.t }), catalog: S.C.cat, now: () => S.clock.t }); // 다른 탭
  ok(other.pause(id).ok, '다른 탭에서 일시정지 3');
  other.resume(id);
  ok(S.ctl.pause(id).reason === 'limit' && other.pause(id).reason === 'limit' && S.ctl.get(id).pause.count === 3, '두 탭 모두 4번째는 거절(횟수는 저장된 값 기준)');
  ok(S.ctl.get(id).endAt === end, '일시정지를 3번 해도 마감은 늘지 않음');
  // 마감 2분 전 일시정지: 마감까지만, 가린 채 마감이 오면 채점
  const S2 = setup(); for (let i = 1; i <= 12; i++) miss(S2, 'quiz', qid(i));
  const id2 = S2.ctl.createPersonalRun({ product: 'personal-mini' }).run.id; S2.ctl.start(id2);
  const it2 = S2.ctl.get(id2).items[0]; S2.ctl.answer(id2, 0, it2.optionIds[0]);
  S2.clock.t = S2.ctl.get(id2).endAt - 2 * MIN; const p2 = S2.ctl.pause(id2);
  ok(p2.run.pause.log[0].until === p2.run.endAt, '마감 2분 전 일시정지: 마감 시각까지만');
  S2.clock.t += 2 * MIN;
  const g2 = S2.ctl.get(id2);
  ok(g2.status === 'final' && g2.final.reason === 'expired' && g2.final.graded[0].optionId === it2.optionIds[0], '가린 채 마감: 저장된 답으로 채점');
}

section('8. 마감: 지난 뒤의 모든 변경은 먼저 채점 · 늦은 답 거절 · 다시 들어올 때 채점(tickAll)');
{
  const S = setup();
  for (let i = 1; i <= 12; i++) miss(S, 'quiz', qid(i));
  const id = S.ctl.createPersonalRun({ product: 'personal-mini' }).run.id; S.ctl.start(id);
  const r = S.ctl.get(id); S.ctl.answer(id, 1, r.items[1].optionIds[0]);
  S.clock.t = r.endAt; // 정확히 마감
  const late = S.ctl.answer(id, 2, r.items[2].optionIds[0]);
  ok(!late.ok && late.reason === 'expired' && late.run.status === 'final' && late.run.final.at === r.endAt && late.run.final.graded[2].optionId === null && late.run.final.graded[1].optionId === r.items[1].optionIds[0], 'now = endAt: 늦은 답은 거절, 그 전 답으로 채점(final.at = endAt)');
  ok(S.ctl.pause(id).reason === 'expired' && S.ctl.go(id, 0).reason === 'expired', '끝난 뒤 일시정지·이동도 거절');
  // 브라우저를 닫았다가 한참 뒤 다시 열기
  const S2 = setup(); for (let i = 1; i <= 12; i++) miss(S2, 'quiz', qid(i));
  const id2 = S2.ctl.createPersonalRun({ product: 'personal-formal' }).run.id; S2.ctl.start(id2);
  S2.clock.t += 3 * 3600 * 1000;
  const reopen = H.create({ store: P.create({ storage: S2.storage, now: () => S2.clock.t }), catalog: S2.C.cat, now: () => S2.clock.t });
  ok(J(reopen.tickAll()) === J([id2]) && reopen.get(id2).status === 'final' && reopen.get(id2).final.reason === 'expired', '닫았다가 다시 열면 바로 채점(시간 종료)');
}

section('9. 제출 · 점수(기출 원래 배점 / 빈칸·확인 연습 1점 / HanQ 연습 백분율) · 오답노트에 정확히 한 번');
{
  const S = setup();
  for (let i = 1; i <= 10; i++) miss(S, 'quiz', qid(i));
  miss(S, 'mock', 'exam-78-02');
  const id = S.ctl.createPersonalRun({ product: 'personal-mini' }).run.id; S.ctl.start(id);
  const r = S.ctl.get(id);
  const right = it => it.mode === 'mock' ? it.questionId + '-option-3' : it.optionIds.find(x => x.endsWith('-c')), wrong = it => it.optionIds.find(x => x !== right(it));
  // 빈칸·확인 오답 앞 5문제 맞힘, 뒤 5문제 틀림, 기출 오답 맞힘, 보충 기출 앞 4문제 맞힘 · 나머지 답 없음
  let qi = 0;
  r.items.forEach((it, n) => {
    if (it.origin === 'wrong-quiz') S.ctl.answer(id, n, qi++ < 5 ? right(it) : wrong(it));
    else if (it.origin === 'wrong-mock') S.ctl.answer(id, n, right(it));
    else if (it.origin === 'fill' && r.items.filter((x, k) => k < n && x.origin === 'fill').length < 4) S.ctl.answer(id, n, right(it));
  });
  S.clock.t += MIN;
  const s1 = S.ctl.submit(id), F = s1.run.final, sc = F.score;
  const mocks = r.items.filter(x => x.mode === 'mock'), correctMocks = r.items.filter((x, n) => x.mode === 'mock' && F.graded[n].correct);
  const offMax = mocks.reduce((s, x) => s + x.points, 0), offEarn = correctMocks.reduce((s, x) => s + x.points, 0);
  ok(s1.ok && s1.run.status === 'final' && F.reason === 'submit' && typeof s1.run.submissionId === 'string', '제출 → 끝(직접 제출)');
  ok(sc.correct === 10 && sc.wrong === 10 && sc.unanswered === 5 && sc.answered === 15, '맞힘 10 · 틀림 10(답하지 않은 5 포함)');
  ok(sc.official.count === 10 && sc.official.max === offMax && sc.official.earned === offEarn && sc.practice.count === 10 && sc.practice.max === 10 && sc.practice.earned === 5, '기출은 원래 배점 합, 빈칸·확인은 1문제 1점');
  ok(sc.total.max === offMax + 10 && sc.total.percent === Math.round((offEarn + 5) / (offMax + 10) * 1000) / 10, '연습 백분율 = (기출 점수 + 연습 점수) / 이 회차 문항 배점 합');
  const runAtt = () => S.store.attempts({ source: 'run' });
  ok(runAtt().length === 20 && runAtt().every(a => a.runId === id && a.rankEligible === false) && runAtt().filter(a => a.unanswered).length === 5 && runAtt().filter(a => a.unanswered).every(a => a.optionId === null && a.correct === false), '문항별 채점 기록 20건(답하지 않은 5건은 optionId:null · unanswered) · 순위 대상 아님');
  ok(S.ctl.submit(id).already && S.ctl.tickAll().length === 0 && runAtt().length === 20, '다시 제출·다시 들어오기: 결과·기록이 늘지 않음');
  const again = H.create({ store: P.create({ storage: S.storage, now: () => S.clock.t }), catalog: S.C.cat, now: () => S.clock.t });
  ok(J(again.get(id).final) === J(F) && P.create({ storage: S.storage }).attempts({ source: 'run' }).length === 20, '새로 고침 뒤에도 같은 결과 · 기록 그대로');
  const notes = S.store.wrongNotes(S.C.cat.lookup, { subject: 'history' }), st = id => (notes.find(n => n.questionId === id) || {}).status;
  // 최근 틀린 순으로 들어가 앞 5문제 = q-010…q-006(맞힘), 뒤 5문제 = q-005…q-001(틀림)
  ok(st('exam-78-02') === 'resolved' && st(qid(10)) === 'resolved' && st(qid(6)) === 'resolved' && st(qid(1)) === 'unresolved' && st(qid(5)) === 'unresolved', '맞힌 오답은 해결 · 또 틀린 오답은 그대로');
  const unansweredFill = r.items.find((it, n) => it.origin === 'fill' && !F.graded[n].answered);
  ok(st(unansweredFill.questionId) === 'unresolved', '보충 기출에서 답하지 않은 문제도 새 오답으로(답하지 않음 = 틀림)');
  ok(S.ctl.answer(id, 0, r.items[0].optionIds[0]).reason === 'final', '끝난 회차는 읽기만');
}

section('10. 두 탭이 함께 제출 · 마감 동시: 결과 하나 · 기록 한 번 · 다른 탭 답을 잃지 않음');
{
  const S = setup();
  for (let i = 1; i <= 12; i++) miss(S, 'quiz', qid(i));
  const id = S.ctl.createPersonalRun({ product: 'personal-mini' }).run.id; S.ctl.start(id);
  const B = H.create({ store: P.create({ storage: S.storage, now: () => S.clock.t }), catalog: S.C.cat, now: () => S.clock.t });
  const r = S.ctl.get(id);
  S.ctl.answer(id, 0, r.items[0].optionIds[0]); B.answer(id, 1, r.items[1].optionIds[1]);
  ok(S.ctl.get(id).answers['1'] && B.get(id).answers['0'], '두 탭의 답이 모두 남음');
  S.clock.t += MIN; const a = S.ctl.submit(id); S.clock.t += 1000; const b = B.submit(id);
  ok(a.ok && b.already && J(a.run.final) === J(b.run.final), '먼저 낸 결과 하나만(나중 제출은 그대로 돌려줌)');
  ok(P.create({ storage: S.storage }).attempts({ source: 'run' }).length === 20, '문항별 기록은 20건 한 번');
}

section('11. 만든 뒤 문항 내용이 바뀜: 그 문항은 채점하지 않고 표시(기록도 남기지 않음)');
{
  const S = setup();
  for (let i = 1; i <= 12; i++) miss(S, 'quiz', qid(i));
  const run = S.ctl.createPersonalRun({ product: 'personal-mini' }).run, id = run.id; S.ctl.start(id);
  const it = run.items[0]; S.ctl.answer(id, 0, it.optionIds[0]);
  S.C.Q[it.questionId].v = 'qv2'; // 내용이 바뀜
  ok(S.ctl.answer(id, 0, it.optionIds[1]).reason === 'mismatch', '바뀐 문항에는 새 답을 받지 않음');
  const F = S.ctl.submit(id).run.final;
  ok(F.graded[0].mismatch && !F.graded[0].correct && F.graded[0].optionId === it.optionIds[0] && F.score.mismatch === 1 && F.score.graded === 19, '바뀐 문항: 고른 답은 남기고 채점·점수에서 뺌');
  ok(!S.store.attempts({ source: 'run' }).some(a => a.questionId === it.questionId), '바뀐 문항은 채점 기록을 남기지 않음');
}

section('12. 깨진 회차 기록·같은 문제가 두 번 든 기록은 열지도 덮어쓰지도 않음 · 고정 회차 · 순위 도우미');
{
  const S = setup();
  for (let i = 1; i <= 12; i++) miss(S, 'quiz', qid(i));
  const run = S.ctl.createPersonalRun({ product: 'personal-mini' }).run, key = P.KEYS.progress + 'run-' + run.id;
  const rec = JSON.parse(S.storage.getItem(key)); rec.data.items[1] = Object.assign({}, rec.data.items[0], { n: 1 });
  const bad = JSON.stringify(rec); S.storage.setItem(key, bad);
  const C2 = H.create({ store: P.create({ storage: S.storage, now: () => S.clock.t }), catalog: S.C.cat, now: () => S.clock.t });
  ok(C2.get(run.id) === null && C2.start(run.id).reason === 'corrupt' && S.storage.getItem(key) === bad && C2.list().corrupt === 1, '같은 문제 두 번: 열지 않고 그대로 둠(알림용 수)');
  const personal = H.validRun(Object.assign({}, JSON.parse(S.storage.getItem(key)).data, { items: run.items, product: Object.assign({}, run.product, { rankEligible: true }) }));
  ok(personal === false, '오답 회차에 rankEligible:true가 적힌 기록은 받지 않음');
  const fx = S.ctl.createFixedRun({ product: 'fixed-formal', round: 79 });
  ok(fx.ok && fx.run.items.length === 50 && fx.run.items.every((x, n) => x.questionId === 'exam-79-' + String(n + 1).padStart(2, '0') && x.origin === 'fixed') && fx.run.product.rankEligible === true, '고정 실전(제79회 50문항): 원래 번호 순 · 순위 대상은 설정에 명시된 것만');
  S.ctl.start(fx.run.id); S.clock.t += MIN; S.ctl.submit(fx.run.id);
  const p2 = S.ctl.createPersonalRun({ product: 'personal-mini' }).run; S.ctl.start(p2.id); S.ctl.submit(p2.id);
  const all = S.ctl.finalResults(), elig = S.ctl.finalResults({ eligibleOnly: true });
  const max79 = Object.values(S.C.E).filter(q => q.exam === 79).reduce((s, q) => s + q.points, 0);
  ok(all.length === 2 && elig.length === 1 && elig[0].runId === fx.run.id && elig[0].score.official.max === max79, '순위 도우미: 끝난 회차 결과 · 순위 대상만 고르기(오답 회차 제외) · 원래 배점 합(' + max79 + ')');
}

section('12-1. 날짜별 모의고사(준비 회차): 회차마다 미니 20(원래 1–20번)·실전 50 · 처음 열기는 하나 · 다시 풀기는 랭크 제외');
{
  const S = setup();
  const sets = S.ctl.preparedSets();
  ok(sets.length === 2 && sets.map(s => s.product + '@' + s.round).join(',') === 'fixed-mini@79,fixed-formal@79' && sets[0].ids.length === 20 && sets[0].ids[0] === 'exam-79-01' && sets[0].ids[19] === 'exam-79-20' && sets[1].ids.length === 50 && sets[0].durationMin === 30 && sets[1].durationMin === 80,
    '제79회(50문항): 미니(원래 1–20번)·실전(1–50번) · 제78회는 1–10번뿐이라 묶음을 지어내지 않음 · 문항 수·시간은 상품 설정에서');
  const key = sets[0].key;
  ok(S.ctl.preparedSets()[0].key === key && /^fixed-mini\|r79\|[0-9a-f]{8}$/.test(key), '묶음 key는 상품·회차·원래 문항 ID로 늘 같음');
  const a = S.ctl.openPrepared({ key }), b = S.ctl.openPrepared({ key });
  ok(a.ok && !a.existing && b.ok && b.existing && a.run.id === b.run.id && a.run.product.rankEligible === true && H.validRun(a.run) && a.run.items.every((x, i) => x.questionId === sets[0].ids[i] && x.origin === 'fixed'), '처음 열기: 순위 대상 회차 하나 · 두 번 눌러도 같은 회차');
  ok(!S.ctl.openPrepared({ key, review: true }).ok && S.ctl.openPrepared({ key, review: true }).reason === 'no-final' && !S.ctl.openPrepared({ key: 'nope' }).ok, '끝나기 전 다시 풀기는 안 됨 · 모르는 묶음은 안 됨');
  S.ctl.start(a.run.id); S.ctl.answer(a.run.id, 0, 'exam-79-01-option-3'); S.clock.t += MIN; S.ctl.submit(a.run.id);
  ok(S.ctl.openPrepared({ key }).run.id === a.run.id && S.ctl.openPrepared({ key }).run.status === 'final', '끝난 뒤 다시 열면 같은 회차(결과·풀이)');
  const r1 = S.ctl.openPrepared({ key, review: true }), r1b = S.ctl.openPrepared({ key, review: true });
  ok(r1.ok && !r1.existing && r1.run.reviewOf === a.run.id && r1.run.product.rankEligible === false && H.validRun(r1.run) && r1b.run.id === r1.run.id && J(r1.run.items.map(x => x.questionId)) === J(sets[0].ids), '다시 풀기: 같은 문항 · rankEligible:false · reviewOf=처음 회차 · 안 끝났으면 같은 다시 풀기');
  S.ctl.start(r1.run.id); S.clock.t += MIN; S.ctl.submit(r1.run.id);
  const r2 = S.ctl.openPrepared({ key, review: true });
  ok(r2.ok && !r2.existing && r2.run.id !== r1.run.id, '다시 풀기가 끝나면 새 다시 풀기');
  const elig = S.ctl.finalResults({ eligibleOnly: true });
  ok(elig.length === 1 && elig[0].runId === a.run.id && S.ctl.finalResults().length === 2, '랭크 대상 결과는 처음 회차 하나뿐(다시 풀기는 제외)');
  const f = S.ctl.openPrepared({ key: sets[1].key });
  ok(f.ok && f.run.product.key === 'fixed-formal' && f.run.items.length === 50 && f.run.product.rankEligible === true && f.run.id !== a.run.id, '같은 회차의 실전 50은 다른 묶음이라 따로 순위 대상');
  // 저장된 다시 풀기 기록의 앞뒤: reviewOf 없이 rankEligible:false인 고정 회차·자기 자신·개인 상품·true인 다시 풀기는 받지 않음
  const mutate = (base, fn) => { const q = JSON.parse(J(base)); fn(q); return q; };
  ok(!H.validRun(mutate(a.run, q => { q.product.rankEligible = false; })) && !H.validRun(mutate(r1.run, q => { q.reviewOf = q.id; })) && !H.validRun(mutate(r1.run, q => { q.product.rankEligible = true; })) && !H.validRun(mutate(r1.run, q => { q.reviewOf = 'bad id'; })),
    'rankEligible:false 고정 회차는 올바른 reviewOf가 있을 때만 · 다시 풀기를 순위 대상으로 바꿀 수 없음');
  // 준비 회차 표시(묶음 key·회차·문항 수·문항 출처)가 실제 문항과 맞지 않으면 받지 않음
  const otherKey = 'fixed-mini|r78|' + sets[0].key.split('|')[2];
  for (const [name, fn] of [
    ['다른 회차의 묶음 key로 바꿈', q => { q.selection.preparedKey = otherKey; }],
    ['실전 묶음 key로 바꿈', q => { q.selection.preparedKey = sets[1].key; }],
    ['해시를 바꿈', q => { q.selection.preparedKey = q.selection.preparedKey.replace(/[0-9a-f]{8}$/, '00000000'); }],
    ['회차 번호를 바꿈', q => { q.selection.round = 78; }],
    ['회차 번호가 정수가 아님', q => { q.selection.round = '79'; }],
    ['문항 수를 바꿈', q => { q.selection.questionIds = 19; }],
    ['문항 출처 번호가 다름', q => { q.items[0].source.number = 2; }],
    ['문항 출처 회차가 다름', q => { q.items[3].source.exam = 78; }],
    ['문항 순서를 바꿈', q => { const t0 = q.items[0]; q.items[0] = Object.assign({}, q.items[1], { n: 0 }); q.items[1] = Object.assign({}, t0, { n: 1 }); }]
  ]) ok(!H.validRun(mutate(a.run, fn)), '받지 않음(준비 회차): ' + name);
  ok(!H.validRun(mutate(r1.run, q => { delete q.selection.preparedKey; })) && !H.validRun(mutate(r1.run, q => { q.selection = { round: 79, questionIds: 20 }; })), '다시 풀기에 준비 회차 표시가 없으면 받지 않음');
  ok(H.validRun(a.run) && H.validRun(r1.run), '실제로 만든 준비 회차·다시 풀기는 그대로 올바름');
  const legacy = S.ctl.createFixedRun({ product: 'fixed-mini', questionIds: sets[0].ids });
  ok(legacy.ok && legacy.run.product.rankEligible === true && legacy.run.selection.preparedKey === undefined && H.validRun(legacy.run), '준비 표시가 없는 예전 createFixedRun 회차는 예전처럼 순위 대상으로 받음');
  // 저장된 처음 회차의 key를 다른 묶음으로 바꾸면: 열지 않고, 다른 묶음에서 다시 쓰지도 않음(지우지 않음)
  const keyA = P.KEYS.progress + 'run-' + a.run.id, recA = JSON.parse(S.storage.getItem(keyA));
  recA.data.selection.preparedKey = sets[1].key; S.storage.setItem(keyA, J(recA));
  const ff = S.ctl.openPrepared({ key: sets[1].key }), mm = S.ctl.openPrepared({ key });
  ok(ff.run.id === f.run.id && mm.ok && mm.run.id !== a.run.id && S.storage.getItem(keyA) === J(recA), '손댄 회차는 실전 묶음에서 쓰이지 않고(원래 실전 회차 그대로) 미니 묶음에서도 열리지 않음 · 기록은 그대로');
  // 두 탭이 동시에 처음 열기: 잠금 창구 안에서 하나만
  (async () => {
    const S2 = setup(), locks = { tails: {}, request(n, o, cb) { if (typeof o === 'function') cb = o; const prev = this.tails[n] || Promise.resolve(); const p = prev.then(() => cb()); this.tails[n] = p.then(() => {}, () => {}); return p; } };
    const tab = () => H.createSerialized({ store: P.create({ storage: S2.storage, now: () => S2.clock.t }), catalog: S2.C.cat, now: () => S2.clock.t, random: () => 0.5, locks });
    const k2 = S2.ctl.preparedSets()[1].key, [x, y] = await Promise.all([tab().openPrepared({ key: k2 }), tab().openPrepared({ key: k2 })]);
    ok(x.ok && y.ok && x.run.id === y.run.id && [x.existing, y.existing].sort().join() === 'false,true' && S2.ctl.list().runs.length === 1, '두 탭이 동시에 처음 열어도 처음 회차는 하나(잠금 안에서 찾고 없으면 만듦)');
  })();
}

section('13. 저장된 회차의 앞뒤 맞춤(손으로 바꾸거나 깨진 기록은 열지 않고 순위 결과에도 넣지 않음)');
{
  const S = setup();
  for (let i = 1; i <= 10; i++) miss(S, 'quiz', qid(i));
  miss(S, 'mock', 'exam-78-02');
  const ready = S.ctl.createPersonalRun({ product: 'personal-mini' }).run; S.ctl.start(ready.id);
  const active = S.ctl.get(ready.id); S.ctl.answer(ready.id, 0, active.items[0].optionIds[0]); S.ctl.pause(ready.id); S.ctl.resume(ready.id);
  const active2 = S.ctl.get(ready.id); S.clock.t += MIN; S.ctl.submit(ready.id); const fin = S.ctl.get(ready.id);
  const readyCopy = Object.assign(JSON.parse(J(active)), { status: 'ready', startAt: null, endAt: null, answers: {}, pause: { count: 0, log: [] }, current: 0 });
  ok(H.validRun(readyCopy) && H.validRun(active2) && H.validRun(fin), '실제로 만든 시작 전·진행 중·끝난 회차는 올바름');
  const mut = (base, fn) => { const q = JSON.parse(J(base)); fn(q); return q; };
  const bad = [
    ['개인 회차를 고정(순위 대상)으로 바꿈', readyCopy, q => { q.product.mode = 'fixed'; q.product.rankEligible = true; }],
    ['모르는 상품 key', readyCopy, q => { q.product.key = 'unknown-product'; }],
    ['상품 문항 수를 바꿈', readyCopy, q => { q.product.size = 30; q.selection.shortBy += 10; }],
    ['보기 ID가 겹침', readyCopy, q => { const it = q.items.find(x => x.mode === 'quiz'); it.optionIds[1] = it.optionIds[0]; }],
    ['기출 보기 ID 순서가 원래와 다름', readyCopy, q => { const it = q.items.find(x => x.mode === 'mock'); it.optionIds.reverse(); }],
    ['문항 번호(n)가 자리와 다름', readyCopy, q => { q.items[1].n = 0; }],
    ['출처와 종류가 맞지 않음(보충인데 빈칸)', readyCopy, q => { q.items.find(x => x.mode === 'quiz').origin = 'fill'; }],
    ['기출 배점을 바꿈(1–3 밖)', readyCopy, q => { q.items.find(x => x.mode === 'mock').points = 5; }],
    ['고른 수·보충 수가 실제와 다름', readyCopy, q => { q.selection.fill += 1; }],
    ['모자란 수(shortBy)를 숨김', readyCopy, q => { q.items.pop(); }],
    ['다른 과목 회차를 한국사로', readyCopy, q => { q.subject = 'toeic'; }],
    ['제목·한국 날짜가 회차와 다름', readyCopy, q => { q.title = '26/01/01 · 1회차 오답 미니모의고사'; }],
    ['시작 전인데 답이 있음', readyCopy, q => { q.answers['0'] = { optionId: q.items[0].optionIds[0], at: q.createdAt }; }],
    ['마감을 늘림(일시정지로 연장)', active2, q => { q.endAt += 5 * MIN; }],
    ['일시정지 끝 시각을 늘림', active2, q => { q.pause.log[0].until += MIN; }],
    ['일시정지 횟수와 기록이 다름', active2, q => { q.pause.count = 0; }],
    ['없는 번호의 답', active2, q => { q.answers['25'] = { optionId: null, at: q.startAt }; }],
    ['끝난 점수(맞힌 수)를 바꿈', fin, q => { q.final.score.correct = 999; }],
    ['점수 분모를 바꿈', fin, q => { q.final.score.total.max = 999; }],
    ['채점 줄의 문항 ID가 회차와 다름', fin, q => { q.final.graded[0].questionId = 'exam-70-50'; }],
    ['채점 줄 번호가 겹침', fin, q => { q.final.graded[1].n = 0; }],
    ['채점 줄의 맞힘을 바꿈', fin, q => { const g = q.final.graded.find(x => !x.correct && !x.mismatch); g.correct = true; g.earned = g.points; }],
    ['제출 ID가 빔', fin, q => { q.submissionId = ''; }],
    ['채점 시각이 숫자가 아님', fin, q => { q.final.at = 'yesterday'; }],
    ['규칙 버전을 모르는 값으로', fin, q => { q.product.rulesVersion = 'hanq-run-99'; q.final.rulesVersion = 'hanq-run-99'; }],
    ['구매 정보를 지어 넣음', fin, q => { q.purchase = { paid: true }; }]
  ];
  bad.forEach(([name, base, fn]) => ok(!H.validRun(mut(base, fn)), '받지 않음: ' + name));
  // 가격 설정이 바뀌어도(회차에는 가격이 없음) 지난 회차는 그대로 올바름
  ok(!('futurePriceKRW' in fin.product) && H.validRun(fin) && H.validRun(mut(fin, q => { q.updatedAt += 1; })), '가격은 회차에 없어 설정 가격이 바뀌어도 지난 회차는 그대로');
  // 손으로 고친 끝난 회차는 순위 도우미에 나오지 않음
  const key = P.KEYS.progress + 'run-' + fin.id, rec = JSON.parse(S.storage.getItem(key));
  rec.data.product.mode = 'fixed'; rec.data.product.rankEligible = true; S.storage.setItem(key, J(rec));
  ok(S.ctl.finalResults({ eligibleOnly: true }).length === 0 && S.ctl.finalResults().length === 0 && S.ctl.list().corrupt === 1 && S.storage.getItem(key) === J(rec), '순위 대상으로 위조한 기록: 순위·결과 목록에 나오지 않고 지우지도 않음');
}

section('14. 잠금 창구(createSerialized): 같은 잠금 이름 하나로 모든 회차 변경을 한 줄로');
{
  const S = setup();
  for (let i = 1; i <= 12; i++) miss(S, 'quiz', qid(i));
  // 실제 navigator.locks처럼: 같은 이름은 하나씩, 콜백이 돌려준 Promise가 끝나야 다음
  const mkLocks = () => { const tails = {}, log = []; let holding = 0, maxHold = 0; return { log, get maxHold() { return maxHold; }, request(name, o, cb) { if (typeof o === 'function') cb = o; const prev = tails[name] || Promise.resolve();
    const p = prev.then(async () => { holding++; maxHold = Math.max(maxHold, holding); log.push(name); try { return await cb({ name }); } finally { holding--; } }); tails[name] = p.then(() => {}, () => {}); return p; } }; };
  const locks = mkLocks();
  const tab = () => H.createSerialized({ store: P.create({ storage: S.storage, now: () => S.clock.t }), catalog: S.C.cat, now: () => S.clock.t, random: S.rnd, locks });
  (async () => {
    const A = tab(), B = tab();
    ok(A.mode === 'locks' && A.lockName === 'hanq:run:history' && A.crossTabSafe && Object.isFrozen(A), '창구: mode locks · 잠금 이름 hanq:run:history');
    const [c1, c2] = await Promise.all([A.createPersonalRun({ product: 'personal-mini' }), B.createPersonalRun({ product: 'personal-mini' })]);
    ok(c1.ok && c2.ok && c1.run.id !== c2.run.id && J([c1.run.seq, c2.run.seq].sort()) === J([1, 2]), '두 탭이 같은 시각에 만들어도 ID·회차 번호가 겹치지 않음');
    const id = c1.run.id; await A.start(id);
    const it = A.peek(id).items;
    const res = await Promise.all([A.answer(id, 0, it[0].optionIds[0]), B.answer(id, 1, it[1].optionIds[1]), A.answer(id, 2, it[2].optionIds[0]), B.answer(id, 3, it[3].optionIds[0])]);
    const ans = A.peek(id).answers;
    ok(res.every(r => r.ok) && ['0', '1', '2', '3'].every(k => ans[k] && ans[k].optionId) && locks.maxHold === 1, '두 탭이 동시에 낸 답 4개가 모두 남음 · 잠금은 한 번에 하나');
    const pz = []; for (let i = 0; i < 5; i++) { const pair = await Promise.all([A.pause(id), B.pause(id)]); pz.push(pair.filter(x => x.ok).length); await B.resume(id); }
    ok(J(pz) === J([1, 1, 1, 0, 0]) && A.peek(id).pause.count === 3, '두 탭이 동시에 일시정지: 3번까지만');
    // 잠금을 기다리는 동안 마감: 잠금을 얻은 뒤 시각을 보므로 늦은 답은 거절, 결과는 하나
    // 잠금을 실제로 얻었다는 신호(콜백이 release를 정할 때 알림)를 기다린 뒤에만 명령을 줄 세우고 시계를 바꾸고 놓는다
    let release, signalHeld; const held = new Promise(r => { signalHeld = r; });
    const hold = locks.request('hanq:run:history', () => new Promise(r => { release = r; signalHeld(); }));
    await held;
    const q1 = A.answer(id, 4, it[4].optionIds[0]), q2 = B.submit(id), q3 = A.submit(id);
    S.clock.t = A.peek(id).endAt; release(); await hold;
    const [r1, r2, r3] = await Promise.all([q1, q2, q3]);
    ok(!r1.ok && r1.reason === 'expired' && r2.already && r3.already && r1.run.final.reason === 'expired' && J(r2.run.final) === J(r1.run.final), '마감 뒤 잠금을 얻은 답·제출: 답은 거절, 결과는 시간 종료 하나');
    ok(P.create({ storage: S.storage }).attempts({ source: 'run' }).length === 20, '동시 마감·제출에도 문항별 기록은 20건 한 번');
    // 잠금 안에서 다시 잠금 청하지 않음(교착 방지) — 동기 컨트롤러는 잠금을 쓰지 않음
    ok(typeof H.create === 'function' && !('lockName' in S.ctl), '동기 컨트롤러(순수 검사용)와 잠금 창구는 따로');
    // Web Locks가 없고 여러 탭이 나누는 저장소: 회차를 바꾸는 호출은 거절(안전한 척하지 않음)
    const U = H.createSerialized({ store: P.create({ storage: S.storage, now: () => S.clock.t }), catalog: S.C.cat, now: () => S.clock.t, locks: null });
    const u1 = await U.createPersonalRun({ product: 'personal-mini' }), u2 = await U.answer(c2.run.id, 0, null), u3 = await U.tickAll();
    ok(U.mode === 'unavailable' && !U.crossTabSafe && !u1.ok && u1.reason === 'no-lock' && u2.reason === 'no-lock' && J(u3) === '[]' && U.list().runs.length === 2, 'Web Locks 없음: 만들기·답·채점 거절(no-lock) · 읽기는 됨');
    // 저장소가 이 탭 메모리뿐: 다른 탭과 나누지 않으므로 이 탭 안의 줄 세우기로
    const blocked = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() {}, key() { return null; }, get length() { return 0; } };
    const Ms = P.create({ storage: blocked, now: () => S.clock.t });
    for (let i = 1; i <= 10; i++) { const q = S.C.Q[qid(i)]; Ms.recordAttempt({ mode: 'quiz', source: 'quiz', questionId: q.id, contentVersion: q.v, optionId: q.options[0].id, correct: false, submissionId: 'm-' + i }); }
    const M = H.createSerialized({ store: Ms, catalog: S.C.cat, now: () => S.clock.t, locks: null });
    const mc = await M.createPersonalRun({ product: 'personal-mini' });
    ok(M.mode === 'memory' && M.crossTabSafe && mc.ok, '메모리 저장소: 이 탭 안에서 차례로(다른 탭과 나누지 않음)');
    console.log('\n검사 ' + checks + ' · 실패 ' + failures);
    process.exit(failures ? 1 : 0);
  })().catch(e => { console.log('  ✗ 예외 ' + e.stack); process.exit(1); });
}
