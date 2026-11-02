#!/usr/bin/env node
/* 학습 기록 저장소(media/learning-progress.js) 단위 검사 — 화면 없이 저장소 계약만 본다.
 *   node scripts/test-learning-progress.cjs
 * 실제 브라우저(두 탭·막힌 저장소·용량 초과)는 조정자가 따로 확인한다. 여기서는 같은 동작을 가짜 저장소로 재현한다. */
'use strict';
const path = require('path');
const P = require(path.join(__dirname, '..', 'media', 'learning-progress.js'));
let checks = 0, failures = 0;
function ok(c, m) { checks++; if (!c) { failures++; console.log('  ✗ ' + m); } }
function section(t) { console.log('\n■ ' + t); }

/* 두 탭이 함께 쓰는 진짜 같은 저장소(키 순서·length·key(i)까지 localStorage처럼) */
function sharedStorage(opts) {
  const m = new Map(); opts = opts || {};
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { if (opts.quotaAfter != null && m.size >= opts.quotaAfter && !m.has(k)) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } m.set(k, String(v)); },
    removeItem: k => { m.delete(k); }, key: i => [...m.keys()][i] || null, get length() { return m.size; }, _map: m
  };
}
let clock = Date.UTC(2026, 9, 8, 0, 0, 0); // 2026-10-08 09:00 KST
const now = () => (clock += 1000);
const make = (storage, extra) => P.create(Object.assign({ storage, now, random: Math.random }, extra || {}));
const CAT = { quiz: { 'legacy-goryeo-001': { v: 'v1' }, 'legacy-goryeo-002': { v: 'v1' } }, mock: { 'exam-72-47': { v: 'm1' }, 'exam-70-01': { v: 'm1' } } };
const lookup = (mode, id) => (CAT[mode][id] ? { v: CAT[mode][id].v } : null);
const qa = (id, opt, correct, sub, extra) => Object.assign({ mode: 'quiz', source: 'quiz', questionId: id, contentVersion: CAT.quiz[id] ? CAT.quiz[id].v : 'v1', optionId: opt, correct, submissionId: sub }, extra || {});
const ma = (id, n, correct, sub, extra) => Object.assign({ mode: 'mock', source: 'mock', questionId: id, contentVersion: 'm1', optionId: id + '-option-' + n, choice: n, correct, submissionId: sub }, extra || {});

section('1. 기록 한 건 = 바뀌지 않는 키 하나 · 형식 검사 · rankEligible');
{
  const s = sharedStorage(), A = make(s);
  const r = A.recordAttempt(qa('legacy-goryeo-001', 'o0123456789', false, 's1-1', { chapter: 'goryeo' }));
  ok(r.ok && !r.duplicate && r.persisted && s.getItem(P.KEYS.attempt + r.attempt.id), '기록이 hanq:att:v1:<id> 키 하나로 저장');
  ok(r.attempt.subject === 'history' && r.attempt.rankEligible === false && r.attempt.schema === 1 && r.attempt.kind === 'attempt' && Number.isFinite(r.attempt.ts), '과목 기본값 history · 보통 연습은 rankEligible:false · 실제 시각');
  ok(Object.isFrozen(A.attempts()[0]), '돌려주는 기록은 고칠 수 없음(얼린 객체)');
  const rk = A.recordAttempt(qa('legacy-goryeo-002', 'o1', false, 'x-1', { source: 'quiz', rankEligible: true }));
  ok(rk.ok && rk.attempt.rankEligible === false, '보통 빈칸에 rankEligible:true를 넘겨도 false로 저장');
  const run = A.recordAttempt(ma('exam-70-01', 2, true, 'run1-sub', { source: 'run', runId: 'run1', rankEligible: true }));
  ok(run.ok && run.attempt.rankEligible === true && run.attempt.runId === 'run1', '시간제 회차(source run)만 rankEligible을 실을 수 있음(계산은 다음 단계)');
  ok(!A.recordAttempt(ma('exam-70-01', 6, false, 'bad')).ok && !A.recordAttempt(Object.assign(ma('exam-70-01', 1, false, 'b2'), { optionId: 'exam-70-02-option-1' })).ok, '기출 보기 ID는 같은 문항의 ①–⑤만');
  ok(!A.recordAttempt(qa('legacy-goryeo-001', 'o1', 'no', 's9')).ok && !A.recordAttempt(Object.assign(qa('legacy-goryeo-001', 'o1', false, 's8'), { contentVersion: '' })).ok && !A.recordAttempt(Object.assign(qa('legacy-goryeo-001', 'o1', false, 's7'), { source: 'other' })).ok, '정답 여부·내용 버전·출처가 틀린 기록은 저장하지 않음');
}

section('2. 같은 제출은 한 번 · 같은 문항을 여러 번 틀리면 모두 남김');
{
  const s = sharedStorage(), A = make(s);
  A.recordAttempt(qa('legacy-goryeo-001', 'oA', false, 'sx-1'));
  const d = A.recordAttempt(qa('legacy-goryeo-001', 'oA', false, 'sx-1'));
  ok(d.ok && d.duplicate && A.attempts().length === 1, '같은 submissionId(버튼 두 번)는 한 건');
  A.recordAttempt(qa('legacy-goryeo-001', 'oB', false, 'sx-2'));
  const n = A.wrongNotes(lookup);
  ok(n.length === 1 && n[0].wrongCount === 2 && n[0].attemptCount === 2 && n[0].status === 'unresolved', '두 번 틀리면 기록 둘 · 오답은 문항당 하나(아직 못 풂)');
}

section('3. 맞히면 해결 · 기록은 그대로 · 다시 틀리면 다시 아직 못 풂');
{
  const s = sharedStorage(), A = make(s);
  A.recordAttempt(qa('legacy-goryeo-001', 'oA', false, 'a-1'));
  A.recordAttempt(qa('legacy-goryeo-001', 'oC', true, 'a-2'));
  let n = A.wrongNotes(lookup)[0];
  ok(n.status === 'resolved' && n.attempts.length === 2 && n.wrongCount === 1, '그 뒤에 맞히면 해결, 틀린 기록은 남음');
  A.recordAttempt(qa('legacy-goryeo-001', 'oA', false, 'a-3'));
  n = A.wrongNotes(lookup)[0];
  ok(n.status === 'unresolved' && n.wrongCount === 2, '해결 뒤 다시 틀리면 다시 아직 못 풂');
  A.recordAttempt(qa('legacy-goryeo-002', 'oC', true, 'b-1'));
  ok(!A.wrongNotes(lookup).some(x => x.questionId === 'legacy-goryeo-002'), '틀린 적 없는 문항은 오답노트에 없음');
}

section('4. 내용 버전이 바뀌거나 빠진 문항: 옛 기록으로만, 해결로 세지 않음');
{
  const s = sharedStorage(), A = make(s);
  A.recordAttempt(Object.assign(qa('legacy-goryeo-001', 'oA', false, 'v-1'), { contentVersion: 'v0' }));
  A.recordAttempt(ma('exam-70-01', 3, false, 'm-1'));
  A.recordAttempt(Object.assign(ma('exam-70-01', 2, false, 'm-x'), { questionId: 'exam-71-01', optionId: 'exam-71-01-option-2' }));
  const n = A.wrongNotes(lookup), by = id => n.find(x => x.questionId === id);
  ok(by('legacy-goryeo-001').status === 'stale' && by('legacy-goryeo-001').currentVersion === 'v1', '예전 내용(v0)으로 틀린 기록은 stale(다시 풀기·해결 계산에서 뺌)');
  ok(by('exam-71-01').status === 'missing', '지금 앱에 없는 문항은 missing');
  A.recordAttempt(qa('legacy-goryeo-001', 'oC', true, 'v-2'));
  ok(A.wrongNotes(lookup).find(x => x.questionId === 'legacy-goryeo-001').status === 'stale', '새 버전에서 맞혀도 옛 오답을 ‘해결’로 바꾸지 않음(옛 기록으로 남음)');
}

section('5. 깨진 기록·더 새 형식·남의 키: 지우지 않고 건너뜀');
{
  const s = sharedStorage(); s.setItem('other:app', 'keep'); s.setItem(P.KEYS.attempt + 'abrokenxx', '{not json');
  s.setItem(P.KEYS.attempt + 'afuture01', JSON.stringify({ schema: 2, kind: 'attempt', id: 'afuture01' }));
  s.setItem(P.KEYS.progress + 'quiz', JSON.stringify({ schema: 2, kind: 'progress', view: 'quiz', data: { entries: {} } }));
  const A = make(s);
  A.recordAttempt(qa('legacy-goryeo-001', 'oA', false, 'c-1'));
  const st = A.status();
  ok(st.corruptKeys.includes(P.KEYS.attempt + 'abrokenxx') && st.futureKeys.includes(P.KEYS.attempt + 'afuture01') && st.notices.some(x => x.code === 'corrupt') && st.notices.some(x => x.code === 'future'), '깨진 기록·새 형식 기록을 알림과 함께 건너뜀');
  ok(s.getItem('other:app') === 'keep' && s.getItem(P.KEYS.attempt + 'abrokenxx') === '{not json' && JSON.parse(s.getItem(P.KEYS.attempt + 'afuture01')).schema === 2, '남의 키·깨진 기록·새 형식 기록을 지우거나 바꾸지 않음');
  ok(A.loadProgress('quiz') === null, '새 형식 진행 기록은 읽지 않음');
  const w = A.updateProgress('quiz', () => ({ entries: { x: { at: 1 } } }));
  ok(w.ok && w.persisted === false && w.readOnly === 'future' && JSON.parse(s.getItem(P.KEYS.progress + 'quiz')).schema === 2, '새 형식 진행 기록은 덮어쓰지 않고 이 탭 메모리에만');
  ok(A.wrongNotes(lookup).length === 1, '오답 계산은 올바른 기록만으로');
}

section('6. 저장소가 막힘(SecurityError) · 용량 초과: 메모리로, 알림 한 번, 앱이 멈추지 않음');
{
  const blocked = { getItem() { throw new Error('SecurityError'); }, setItem() { const e = new Error('denied'); e.name = 'SecurityError'; throw e; }, removeItem() {}, key() { return null; }, get length() { return 0; } };
  const A = make(blocked), r = A.recordAttempt(qa('legacy-goryeo-001', 'oA', false, 'z-1'));
  ok(r.ok && r.persisted === false && A.status().backend === 'memory' && A.status().blocked && A.status().notices.some(x => x.code === 'blocked'), '막힌 저장소: 기록은 이 탭 메모리에, persisted:false, 알림');
  ok(A.wrongNotes(lookup).length === 1, '막혀도 이 탭 안에서는 오답노트가 동작');
  const q = sharedStorage({ quotaAfter: 1 }), B = make(q);
  B.recordAttempt(qa('legacy-goryeo-001', 'oA', false, 'q-1'));
  const r2 = B.recordAttempt(qa('legacy-goryeo-002', 'oA', false, 'q-2'));
  ok(r2.ok && r2.persisted === false && B.status().writeFailed && !B.status().persistent && B.status().notices.filter(x => x.code === 'quota').length === 1, '용량 초과: 그 기록부터 메모리 · 알림은 한 번');
  B.recordAttempt(qa('legacy-goryeo-001', 'oA', false, 'q-3'));
  ok(B.status().notices.filter(x => x.code === 'quota').length === 1 && B.wrongNotes(lookup).length === 2, '여러 번 실패해도 알림 한 번 · 기록은 모두 이 탭에서 보임');
}

section('7. 두 탭: 기록이 합쳐지고, 진행 기록은 읽고 합쳐 씀');
{
  const s = sharedStorage(), T1 = make(s), T2 = make(s);
  T1.recordAttempt(qa('legacy-goryeo-001', 'oA', false, 't1-1'));
  T2.recordAttempt(ma('exam-72-47', 2, false, 't2-1'));
  T1.handleStorageEvent({ key: P.KEYS.attempt + 'x' });
  ok(T1.wrongNotes(lookup).length === 2 && T2.wrongNotes(lookup).length === 2, '두 탭의 오답이 서로 덮어쓰지 않고 모두 보임');
  T2.recordAttempt(qa('legacy-goryeo-001', 'oC', true, 't2-2'));
  let seen = null; T1.onChange(e => { seen = e; });
  ok(T1.handleStorageEvent({ key: P.KEYS.attempt + 'y' }) && seen && seen.remote, '다른 탭의 hanq 저장 이벤트를 받아 다시 계산');
  ok(T1.wrongNotes(lookup).find(x => x.questionId === 'legacy-goryeo-001').status === 'resolved', '다른 탭에서 맞히면 이 탭에서도 해결');
  ok(!T1.handleStorageEvent({ key: 'other:app' }), 'hanq 밖의 키 이벤트는 무시');
  T1.updateProgress('quiz', prev => ({ entries: T1.mergeEntries((prev || {}).entries, { a: { selected: 'o1', at: 100 } }) }));
  T2.updateProgress('quiz', prev => ({ entries: T2.mergeEntries((prev || {}).entries, { b: { selected: 'o2', at: 200 }, a: { selected: 'old', at: 50 } }) }));
  const e = T1.loadProgress('quiz').entries;
  ok(e.a.selected === 'o1' && e.b.selected === 'o2', '진행 기록: 쓰기 전에 다시 읽어 합침 · 문항별 더 최근(at) 것을 남김');
}

section('8. 다시 풀기 줄: 시작할 때 고정 · 첫 문제를 맞혀도 둘째를 건너뛰지 않음 · 무작위 중복 없음');
{
  const s = sharedStorage(), A = make(s);
  A.recordAttempt(qa('legacy-goryeo-001', 'oA', false, 'r-1'));
  A.recordAttempt(ma('exam-72-47', 1, false, 'r-2'));
  A.recordAttempt(qa('legacy-goryeo-002', 'oA', false, 'r-3'));
  const notes = A.wrongNotes(lookup).filter(n => n.status === 'unresolved');
  const queue = A.snapshotQueue(notes, 'fixed');
  ok(queue.length === 3 && Object.isFrozen(queue) && queue.every(x => x.contentVersion), '줄은 문항 ID·내용 버전을 고정한 얼린 배열');
  // 첫 문제를 맞히면 전체 오답에서는 빠지지만, 줄은 그대로라 다음은 원래 둘째
  let idx = 0;
  A.recordAttempt(Object.assign(queue[idx].mode === 'mock' ? ma(queue[idx].questionId, 1, true, 'run-' + idx) : qa(queue[idx].questionId, 'oC', true, 'run-' + idx), { source: 'wrong-retry' }));
  idx++;
  ok(A.wrongNotes(lookup).filter(n => n.status === 'unresolved').length === 2 && queue.length === 3 && queue[idx].questionId === notes[1].questionId, '첫 문제를 맞혀 오답이 줄어도 다음 문제는 원래 둘째(건너뛰지 않음)');
  A.recordAttempt(Object.assign(queue[idx].mode === 'mock' ? ma(queue[idx].questionId, 3, false, 'run-' + idx) : qa(queue[idx].questionId, 'oA', false, 'run-' + idx), { source: 'wrong-retry' }));
  idx++;
  A.recordAttempt(Object.assign(queue[idx].mode === 'mock' ? ma(queue[idx].questionId, 1, true, 'run-' + idx) : qa(queue[idx].questionId, 'oC', true, 'run-' + idx), { source: 'wrong-retry' }));
  const left = A.wrongNotes(lookup).filter(n => n.status === 'unresolved');
  ok(left.length === 1 && left[0].questionId === queue[1].questionId && A.attempts({ source: 'wrong-retry' }).length === 3, '다시 틀린 문제만 남고, 다시 풀기 기록 3건 모두 남음');
  let i = 0; const seq = [0.9, 0.1, 0.5, 0.3, 0.7];
  const R = P.create({ storage: sharedStorage(), now, random: () => seq[i++ % seq.length] });
  const rq = R.snapshotQueue(notes.concat(notes), 'random');
  ok(rq.length === 3 && new Set(rq.map(x => x.questionId)).size === 3, '무작위 줄: 같은 문항을 두 번 넣지 않음');
  ok(A.snapshotQueue(notes.map(n => Object.assign({}, n, { currentVersion: null })), 'fixed').length === 0, '지금 버전이 없는(빠진) 문항은 줄에 넣지 않음');
}

section('9. 진행 기록 형식 · 깨진 진행 기록 · 한국 시간');
{
  const s = sharedStorage(); s.setItem(P.KEYS.progress + 'mock', '{oops');
  const A = make(s);
  ok(A.loadProgress('mock') === null && A.status().notices.some(x => x.code === 'corrupt-progress'), '깨진 진행 기록은 읽지 않고 알림');
  const w = A.updateProgress('mock', () => ({ entries: {} }));
  ok(w.persisted === false && s.getItem(P.KEYS.progress + 'mock') === '{oops', '깨진 진행 기록은 덮어쓰지 않음(지우지 않고 보존)');
  A.updateProgress('quiz', () => ({ entries: { a: { at: 1 } } }));
  const raw = JSON.parse(s.getItem(P.KEYS.progress + 'quiz'));
  ok(raw.schema === 1 && raw.kind === 'progress' && raw.view === 'quiz' && Number.isFinite(raw.updatedAt), '진행 기록 형식 {schema:1, kind, view, updatedAt, data}');
  const k = P.kst(Date.UTC(2026, 9, 7, 15, 30));
  ok(k.date === '2026-10-08' && k.time === '00:30' && P.kst(NaN) === null, '한국 시간: UTC 15:30 → 다음 날 00:30 · 시각이 없으면 날짜를 만들지 않음');
}

section('10. 기록 ID 충돌: 시계·난수가 같아도 덮어쓰지 않음(두 저장소·새로 고침)');
{
  const s = sharedStorage(), fixed = () => 1791417600000, A = P.create({ storage: s, now: fixed, random: () => 0.25 }), B = P.create({ storage: s, now: fixed, random: () => 0.25 });
  const r1 = A.recordAttempt(qa('legacy-goryeo-001', 'oA', false, 'c-1')), r2 = B.recordAttempt(ma('exam-70-01', 2, false, 'c-2')), r3 = A.recordAttempt(qa('legacy-goryeo-002', 'oA', false, 'c-3'));
  ok(r1.attempt.id !== r2.attempt.id && r2.attempt.id !== r3.attempt.id && r1.attempt.id !== r3.attempt.id, '같은 시각·같은 난수라도 기록 ID가 모두 다름');
  ok(P.create({ storage: s, now: fixed, random: () => 0.25 }).attempts().length === 3, '새로 고침 뒤에도 세 건 모두 남음(먼저 쓴 기록을 덮어쓰지 않음)');
  ok(P.validateAttempt(JSON.parse(s.getItem(P.KEYS.attempt + r3.attempt.id))), '늘린 ID도 형식 검사 통과');
}

section('11. 과목(subject) 구분: 같은 ID·같은 제출이라도 다른 과목이면 따로 · 다른 과목의 정답이 한국사 오답을 해결하지 않음');
{
  const s = sharedStorage(), A = make(s);
  A.recordAttempt(qa('legacy-goryeo-001', 'oA', false, 'same', { subject: 'history' }));
  const t = A.recordAttempt(qa('legacy-goryeo-001', 'oC', true, 'same', { subject: 'toeic' }));
  ok(t.ok && !t.duplicate && A.attempts().length === 2, '과목이 다르면 같은 submissionId라도 따로 기록');
  ok(A.recordAttempt(qa('legacy-goryeo-001', 'oA', false, 'same', { subject: 'history' })).duplicate, '같은 과목·같은 제출은 여전히 한 건');
  A.recordAttempt(qa('legacy-goryeo-001', 'oC', true, 'other', { subject: 'toeic' }));
  A.recordAttempt(qa('legacy-goryeo-002', 'oA', false, 'tw', { subject: 'toeic' }));
  const all = A.wrongNotes(lookup), hist = A.wrongNotes(lookup, { subject: 'history' });
  ok(all.some(n => n.subject === 'history' && n.questionId === 'legacy-goryeo-001' && n.status === 'unresolved'), '다른 과목에서 맞혀도 한국사 오답은 아직 못 풂');
  ok(hist.length === 1 && hist[0].subject === 'history' && all.some(n => n.subject === 'toeic'), 'subject로 거르면 한국사만 · 다른 과목 기록은 지우지 않고 그대로');
  const q = A.snapshotQueue(all, 'fixed');
  ok(q.length === 2 && q.every(e => e.subject), '다시 풀기 줄 항목에 과목이 함께 고정됨');
  ok(P.noteKey('history', 'quiz', 'x') !== P.noteKey('toeic', 'quiz', 'x') && P.noteKey(undefined, 'quiz', 'x') === P.noteKey('history', 'quiz', 'x'), 'noteKey: 과목이 없으면 history');
}

section('12. 지금 문항에 실제 있는 보기만: 없는 보기·어긋난 정답 표시는 오답 계산에서 뺌(지우지 않음)');
{
  const item = { v: 'v1', options: [{ id: 'oA', correct: false }, { id: 'oB', correct: false }, { id: 'oC', correct: true }] };
  const L1 = (mode, id) => (id === 'legacy-goryeo-001' ? item : null), L2 = (mode, id) => (id === 'legacy-goryeo-001' ? { v: 'v1', item } : null);
  const s = sharedStorage(), A = make(s);
  A.recordAttempt(qa('legacy-goryeo-001', 'nonexistent-option', false, 'i-1'));
  ok(A.wrongNotes(L1)[0].status === 'invalid' && A.wrongNotes(L2)[0].status === 'invalid' && A.attempts().length === 1, '없는 보기 ID: 아직 못 푼 오답이 아님(문항 그대로·{v,item} 감싼 꼴 모두) · 기록은 남음');
  ok(A.snapshotQueue(A.wrongNotes(L1).filter(n => n.status === 'unresolved'), 'fixed').length === 0, '맞지 않는 기록은 다시 풀기 줄에 들어가지 않음');
  ok(A.status().notices.some(x => x.code === 'invalid-option'), '맞지 않는 기록은 알림');
  A.recordAttempt(qa('legacy-goryeo-001', 'oA', true, 'i-2')); // 오답 보기인데 맞았다고 적힌 기록
  ok(A.wrongNotes(L1)[0].status === 'invalid', '실제로는 오답인 보기를 ‘맞힘’이라 적은 기록으로 해결되지 않음');
  A.recordAttempt(qa('legacy-goryeo-001', 'oB', false, 'i-3'));
  let n = A.wrongNotes(L1)[0];
  ok(n.status === 'unresolved' && n.activeWrongCount === 1 && n.invalidCount === 2 && n.lastWrongOptionId === 'oB', '실제 오답 보기를 고른 기록만 아직 못 푼 오답 · 마지막 오답 보기 ID');
  A.recordAttempt(qa('legacy-goryeo-001', 'oC', true, 'i-4'));
  n = A.wrongNotes(L1)[0];
  ok(n.status === 'resolved' && n.wrongCount === 2 && n.attemptCount === 4, '실제 정답 보기로 맞히면 해결 · 틀린 기록(맞지 않는 것 포함)은 그대로');
}

section('13. 저장된 진행 기록의 이상한 키(constructor·__proto__)');
{
  const A = make(sharedStorage());
  const m = A.mergeEntries(JSON.parse('{"__proto__":{"at":9},"constructor":{"at":9},"ok":{"at":1}}'), { b: { at: 2 } });
  ok(Object.keys(m).sort().join(',') === 'b,ok' && Object.getPrototypeOf(m) === Object.prototype && !P.safeKey('constructor') && P.safeKey('legacy-goryeo-001'), 'mergeEntries는 Object.prototype 이름 키를 건너뜀(프로토타입이 바뀌지 않음)');
}

section('14. 답하지 않은 문항 기록: 모의고사 회차의 최종 채점에서만 · 앞뒤가 안 맞는 입력은 고쳐 받지 않고 거절');
{
  const A = make(sharedStorage());
  const base = { mode: 'mock', source: 'run', questionId: 'exam-70-01', contentVersion: 'm1', optionId: null, unanswered: true, correct: false, runId: 'rqa123456', submissionId: 'sub-rqa123456-0' };
  const r = A.recordAttempt(base);
  ok(r.ok && r.attempt.optionId === null && r.attempt.unanswered === true && r.attempt.correct === false, '회차 최종 채점의 답하지 않은 문항: optionId null · unanswered · 오답');
  const no = [['보통 기출에서', { source: 'mock' }], ['runId 공백', { runId: ' ' }], ['runId 앞뒤 공백', { runId: ' rqa1 ' }], ['runId 없음', { runId: null }], ['맞았다고 함', { correct: true }],
    ['보기를 골랐다고 함', { optionId: 'exam-70-01-option-1' }], ['unanswered가 참/거짓이 아님', { unanswered: 'yes' }], ['제출 ID에 공백', { submissionId: 'sub 1' }], ['optionId를 빼먹음', { optionId: undefined }]];
  no.forEach(([name, extra], i) => ok(!A.recordAttempt(Object.assign({}, base, { submissionId: 'sub-x-' + i }, extra)).ok, '거절: ' + name));
  ok(!A.recordAttempt({ mode: 'quiz', source: 'quiz', questionId: 'legacy-goryeo-001', contentVersion: 'v1', optionId: 'oA', unanswered: true, correct: false, submissionId: 'q-u' }).ok, '보통 빈칸의 임시 답은 답하지 않음으로도 기록되지 않음');
  ok(A.recordAttempt(qa('legacy-goryeo-001', 'oA', false, 'q-old')).attempt.unanswered === false && P.validateAttempt(Object.assign({}, r.attempt, { unanswered: undefined, optionId: 'exam-70-01-option-1', source: 'mock', runId: null })), '예전 기록(unanswered 없음)도 그대로 올바름');
  ok(A.wrongNotes(lookup).find(n => n.questionId === 'exam-70-01').status === 'unresolved', '답하지 않음은 오답노트에 아직 못 푼 오답으로');
}

console.log('\n검사 ' + checks + ' · 실패 ' + failures);
process.exit(failures ? 1 : 0);
