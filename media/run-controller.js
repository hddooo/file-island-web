/* HanQ 모의고사 회차 컨트롤러 — 화면(DOM)과 떼어 낸 하나의 회차 구조(만들기 · 답 저장 · 시간 · 일시정지 · 최종 채점).
 *
 *  window.HanqRun.create({store, catalog, now, random})   store = HanqProgress 저장소, catalog = 문항 찾기(아래)
 *  window.HanqRun.PRODUCTS                                  상품(문항 수 · 시간 · 앞으로의 가격 · 순위 대상 여부)을 한곳에
 *
 *  - 회차 하나 = 진행 기록 'hanq:progress:v1:run-<runId>' 하나. 바꿀 때마다 저장된 최신 상태를 다시 읽어 그 위에서만 바꾼다
 *    (여러 탭이 같은 회차를 열어도 답이 사라지거나 최종 결과가 덮어써지지 않음).
 *  - 모든 변경(답 고르기 · 이동 · 일시정지 · 제출)은 먼저 마감 시각을 확인한다. now ≥ endAt이면 그때까지 저장된 답으로 채점하고 끝낸다.
 *  - 최종 결과는 한 번만 정해지고(먼저 쓴 쪽), 문항별 채점 기록(source 'run', submissionId '<회차 제출 ID>-<번호>')도
 *    저장소의 같은 제출 한 번 규칙으로 정확히 한 번만 남는다.
 *  - 시계는 이 기기의 시계다. 시계를 바꾸는 조작을 막는 보안 장치가 아니다.
 *
 *  catalog: { lookup(mode, questionId, subject) → 문항({v, options:[{id, correct}], points?, exam?, number?, chapter?, era?}) | null,
 *             official() → 기출 문항 ID 목록 }
 */
(function (root) {
  'use strict';
  var SCHEMA = 1;
  var RULES_VERSION = 'hanq-run-1';
  var MIN_WRONGS = 10;                 // 오답 모의고사를 만들 수 있는 서로 다른 오답 수
  var PAUSE_MAX = 3;                   // 회차당 일시정지 횟수
  var PAUSE_MS = 5 * 60 * 1000;        // 일시정지 한 번의 최대 길이(시험 시간은 계속 흐름)
  var VIEW_PREFIX = 'run-';
  var RUN_ID = /^r[0-9a-z]{6,40}$/;

  function deepFreeze(o) { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.keys(o).forEach(function (k) { deepFreeze(o[k]); }); } return o; }
  function isObj(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
  function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }
  function own(o, k) { return o && typeof k === 'string' && k !== '__proto__' && Object.prototype.hasOwnProperty.call(o, k) ? o[k] : null; }
  function okKey(k) { return typeof k === 'string' && k.length > 0 && k !== '__proto__' && k !== 'constructor' && k !== 'prototype'; }
  function noteKey(subject, mode, id) { return (subject || 'history') + '|' + mode + '|' + id; }

  /* 상품 설정은 여기 한곳. 가격은 앞으로의 계획(지금은 결제·구매 기능이 없음). 순위 대상 여부(rankEligible)는 가격·이름으로 짐작하지 않고
     여기서 명시한 값만 쓴다. 개인 오답 회차는 언제나 false. 만든 회차에는 그때의 문항 수·시간·규칙을 복사해 두므로 설정을 바꿔도 지난 회차는 그대로다. */
  var PRODUCTS = deepFreeze({
    'personal-mini': { key: 'personal-mini', mode: 'personal', subject: 'history', size: 20, durationMin: 30, durationPolicy: 'practice',
      label: '오답 미니모의고사', rankEligible: false, futurePriceKRW: 500, rulesVersion: RULES_VERSION },
    'personal-formal': { key: 'personal-formal', mode: 'personal', subject: 'history', size: 50, durationMin: 80, durationPolicy: 'official-advanced',
      label: '오답 실전모의고사', rankEligible: false, futurePriceKRW: 1000, rulesVersion: RULES_VERSION },
    'fixed-mini': { key: 'fixed-mini', mode: 'fixed', subject: 'history', size: 20, durationMin: 30, durationPolicy: 'practice',
      label: '미니모의고사', rankEligible: true, futurePriceKRW: null, rulesVersion: RULES_VERSION },
    'fixed-formal': { key: 'fixed-formal', mode: 'fixed', subject: 'history', size: 50, durationMin: 80, durationPolicy: 'official-advanced',
      label: '실전모의고사', rankEligible: true, futurePriceKRW: null, rulesVersion: RULES_VERSION }
  });
  /* 공식 시간 근거(실전 50문항 80분): 한국사능력검정시험 심화 시험 안내 https://www.historyexam.go.kr/pageLink.do?link=apyexmInfo
     미니 20문항 30분은 HanQ 연습 규칙이며 공식 시험 시간이 아니다. */
  var POLICY = deepFreeze({ minWrongs: MIN_WRONGS, pauseMax: PAUSE_MAX, pauseMinutes: PAUSE_MS / 60000, practicePointsPerCustomQuestion: 1,
    officialDurationSource: 'https://www.historyexam.go.kr/pageLink.do?link=apyexmInfo', officialScoringSource: 'https://www.historyexam.go.kr/pageLink.do?link=examGuideline' });

  function kstParts(ts) {
    var d = new Date(ts + 9 * 3600 * 1000), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return { y: d.getUTCFullYear(), date: d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()), short: String(d.getUTCFullYear()).slice(2) + '/' + p(d.getUTCMonth() + 1) + '/' + p(d.getUTCDate()) };
  }
  function runTitle(seq, createdAt, label) { return kstParts(createdAt).short + ' · ' + seq + '회차 ' + label; }

  function shuffle(list, random) {
    for (var i = list.length - 1; i > 0; i--) { var r = Number(random()); if (!Number.isFinite(r) || r < 0 || r >= 1) r = 0; var j = Math.floor(r * (i + 1)), t = list[i]; list[i] = list[j]; list[j] = t; }
    return list;
  }

  /* 문항을 회차에 넣을 수 있는 꼴로(과목·종류·ID·내용 버전·보기 ID 순서·배점·출처). 정답은 회차 기록에 넣지 않는다(채점할 때 문항에서 확인). */
  function buildItem(mode, id, L, origin, random) {
    if (!L || L.v == null || !Array.isArray(L.options) || L.options.length < 2 || L.options.length > 6) return null;
    var ids = L.options.map(function (o) { return o && typeof o.id === 'string' ? o.id : null; });
    if (ids.some(function (x) { return !x; }) || ids.filter(function (x, i) { return ids.indexOf(x) === i; }).length !== ids.length) return null;
    if (L.options.filter(function (o) { return o.correct === true; }).length !== 1) return null;
    if (mode === 'mock') {
      if (ids.length !== 5 || !ids.every(function (x, i) { return x === id + '-option-' + (i + 1); })) return null;
      var pts = Number(L.points); if ([1, 2, 3].indexOf(pts) < 0) return null;
      return { subject: 'history', mode: mode, questionId: id, contentVersion: String(L.v), origin: origin, pointsKind: 'official', points: pts,
        source: { exam: Number(L.exam) || null, number: Number(L.number) || null }, chapter: null, era: typeof L.era === 'string' ? L.era : null, optionIds: ids };
    }
    return { subject: 'history', mode: 'quiz', questionId: id, contentVersion: String(L.v), origin: origin, pointsKind: 'practice', points: 1,
      source: null, chapter: typeof L.chapter === 'string' ? L.chapter : null, era: null, optionIds: shuffle(ids.slice(), random) };
  }

  /* 채점한 줄들로 점수를 계산(저장된 점수가 줄과 맞는지 다시 볼 때도 같은 함수) */
  function summarize(graded) {
    var sum = function (f) { return graded.filter(f); }, part = function (kind) { var g = sum(function (x) { return !x.mismatch && x.pointsKind === kind; }); return { count: g.length, correct: g.filter(function (x) { return x.correct; }).length, earned: g.reduce(function (s, x) { return s + x.earned; }, 0), max: g.reduce(function (s, x) { return s + x.points; }, 0) }; };
    var off = part('official'), pr = part('practice'), max = off.max + pr.max, earned = off.earned + pr.earned, ok = sum(function (x) { return !x.mismatch; });
    return { questions: graded.length, graded: ok.length, correct: ok.filter(function (x) { return x.correct; }).length,
      wrong: ok.filter(function (x) { return !x.correct; }).length, answered: ok.filter(function (x) { return x.answered; }).length, unanswered: ok.filter(function (x) { return !x.answered; }).length,
      mismatch: graded.length - ok.length, official: off, practice: pr, total: { earned: earned, max: max, percent: max ? Math.round(earned / max * 1000) / 10 : null } };
  }

  /* 상품 key마다 바뀌지 않는 성격(종류·순위 대상·넣을 수 있는 문항 출처). 가격·이름·시간 설정이 바뀌어도 이 표는 그대로라 지난 회차 판단이 바뀌지 않는다 */
  var KEY_CLASS = deepFreeze({
    'personal-mini': { mode: 'personal', rankEligible: false, size: 20, origins: ['wrong-quiz', 'wrong-mock', 'fill'] },
    'personal-formal': { mode: 'personal', rankEligible: false, size: 50, origins: ['wrong-quiz', 'wrong-mock', 'fill'] },
    'fixed-mini': { mode: 'fixed', rankEligible: true, size: 20, origins: ['fixed'] },
    'fixed-formal': { mode: 'fixed', rankEligible: true, size: 50, origins: ['fixed'] }
  });
  var KNOWN_RULES = ['hanq-run-1'];
  var SUBJECTS = ['history']; // 지금 지원하는 과목(다른 과목 회차는 한국사로 그리지 않음)
  var DURATION_POLICIES = ['practice', 'official-advanced'];
  var ORIGIN_MODE = { 'wrong-quiz': 'quiz', 'wrong-mock': 'mock', 'fill': 'mock', 'fixed': 'mock' };
  function finiteNum(x) { return typeof x === 'number' && Number.isFinite(x); }
  function hashIds(ids) { var h = 2166136261, s = ids.join(','); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ('0000000' + (h >>> 0).toString(16)).slice(-8); }

  /* 회차 기록이 스스로 앞뒤가 맞는지(깨졌거나 손으로 바꾼 기록은 열지도 덮어쓰지도, 순위 결과에 넣지도 않음).
     설정(PRODUCTS)의 지금 값이 아니라 회차에 복사해 둔 값과 key의 성격(KEY_CLASS)으로 본다 — 가격을 바꿔도 지난 회차는 그대로 유효.
     브라우저 저장소를 손으로 고치는 것을 막는 보안 장치는 아니다. */
  function validRun(r) {
    if (!isObj(r) || r.schema !== SCHEMA || r.kind !== 'run' || typeof r.id !== 'string' || !RUN_ID.test(r.id)) return false;
    if (SUBJECTS.indexOf(r.subject) < 0) return false;
    var p = r.product, kc = isObj(p) ? own(KEY_CLASS, p.key) : null;
    if (!kc || p.mode !== kc.mode || p.size !== kc.size) return false;
    // 같은 준비 회차를 끝낸 뒤 ‘다시 풀기’ 회차만: 고정 상품 · rankEligible:false · 처음 회차 id(reviewOf). 그 밖에는 key의 순위 대상 값 그대로
    if (r.reviewOf != null) { if (kc.mode !== 'fixed' || typeof r.reviewOf !== 'string' || !RUN_ID.test(r.reviewOf) || r.reviewOf === r.id || p.rankEligible !== false) return false; }
    else if (p.rankEligible !== kc.rankEligible) return false;
    if (!finiteNum(p.durationMs) || p.durationMs <= 0 || p.durationMs % 60000 || p.durationMs > 3 * 3600 * 1000 || DURATION_POLICIES.indexOf(p.durationPolicy) < 0) return false;
    if (typeof p.label !== 'string' || !p.label || KNOWN_RULES.indexOf(p.rulesVersion) < 0) return false;
    if (!Number.isInteger(r.seq) || r.seq < 1 || !finiteNum(r.createdAt) || r.kstDate !== kstParts(r.createdAt).date || r.title !== runTitle(r.seq, r.createdAt, p.label)) return false;
    if (r.purchase !== null || typeof r.recorded !== 'boolean') return false;
    if (!Array.isArray(r.items) || !r.items.length || r.items.length > p.size) return false;
    if (p.mode === 'fixed' && r.items.length !== p.size) return false;
    var seen = Object.create(null), counts = { 'wrong-quiz': 0, 'wrong-mock': 0, 'fill': 0, 'fixed': 0 };
    for (var i = 0; i < r.items.length; i++) {
      var it = r.items[i];
      if (!isObj(it) || it.n !== i || it.subject !== r.subject || (it.mode !== 'quiz' && it.mode !== 'mock') || !okKey(it.questionId) || typeof it.contentVersion !== 'string' || !it.contentVersion) return false;
      if (kc.origins.indexOf(it.origin) < 0 || ORIGIN_MODE[it.origin] !== it.mode) return false;
      if (it.mode === 'mock') {
        if (it.pointsKind !== 'official' || [1, 2, 3].indexOf(it.points) < 0 || !isObj(it.source)) return false;
        if (!Array.isArray(it.optionIds) || it.optionIds.length !== 5 || !it.optionIds.every(function (x, j) { return x === it.questionId + '-option-' + (j + 1); })) return false;
      } else {
        if (it.pointsKind !== 'practice' || it.points !== 1 || it.source !== null) return false;
        if (!Array.isArray(it.optionIds) || it.optionIds.length < 2 || it.optionIds.length > 6 || it.optionIds.some(function (x) { return typeof x !== 'string' || !x; })) return false;
      }
      if (it.optionIds.filter(function (x, j) { return it.optionIds.indexOf(x) === j; }).length !== it.optionIds.length) return false;
      var k = noteKey(it.subject, it.mode, it.questionId); if (seen[k]) return false; seen[k] = 1;
      counts[it.origin]++;
    }
    // 준비 회차(날짜별 모의고사): 묶음 key가 상품·회차·실제 문항 ID와 정확히 맞아야 하고, 문항은 그 회차 원래 1–N번 순서 그대로.
    // 다시 풀기(reviewOf)는 반드시 준비 회차 표시가 있어야 함. 준비 표시가 없는 예전 createFixedRun 회차는 예전 그대로 받음
    var sel = r.selection;
    if (r.reviewOf != null && !(isObj(sel) && typeof sel.preparedKey === 'string')) return false;
    if (isObj(sel) && sel.preparedKey != null) {
      if (p.mode !== 'fixed' || typeof sel.preparedKey !== 'string' || !Number.isInteger(sel.round) || sel.round < 10 || sel.round > 99 || sel.questionIds !== r.items.length) return false;
      if (sel.preparedKey !== p.key + '|r' + sel.round + '|' + hashIds(r.items.map(function (it) { return it.questionId; }))) return false;
      for (var q = 0; q < r.items.length; q++) {
        var x0 = r.items[q], num = q + 1;
        if (x0.mode !== 'mock' || x0.origin !== 'fixed' || x0.questionId !== 'exam-' + sel.round + '-' + (num < 10 ? '0' : '') + num || !isObj(x0.source) || x0.source.exam !== sel.round || x0.source.number !== num) return false;
      }
    }
    if (p.mode === 'personal') { // 고른 수·보충 수·모자란 수가 실제 문항과 맞아야(부분 회차도 정직하게)
      var s = r.selection;
      if (!isObj(s) || s.selectedQuiz !== counts['wrong-quiz'] || s.selectedMock !== counts['wrong-mock'] || s.selectedWrong !== counts['wrong-quiz'] + counts['wrong-mock'] || s.fill !== counts.fill || s.shortBy !== p.size - r.items.length) return false;
    }
    if (['ready', 'active', 'final'].indexOf(r.status) < 0) return false;
    if (!Number.isInteger(r.current) || r.current < 0 || r.current >= r.items.length) return false;
    if (!isObj(r.answers) || !isObj(r.pause) || !Array.isArray(r.pause.log) || r.pause.count !== r.pause.log.length || r.pause.count > PAUSE_MAX) return false;
    if (r.status === 'ready') return r.startAt === null && r.endAt === null && r.submissionId === null && r.final === null && !Object.keys(r.answers).length && r.pause.count === 0 && r.recorded === false;
    // 시작한 회차: 마감 = 시작 + 회차에 복사해 둔 시간(일시정지로 늘지 않음)
    if (!finiteNum(r.startAt) || !finiteNum(r.endAt) || r.endAt - r.startAt !== p.durationMs) return false;
    if (Object.keys(r.answers).some(function (k) { var a = r.answers[k], n = Number(k); return !/^(0|[1-9]\d?)$/.test(k) || n >= r.items.length || !isObj(a) || !finiteNum(a.at) || (a.optionId !== null && r.items[n].optionIds.indexOf(a.optionId) < 0); })) return false;
    if (r.pause.log.some(function (x) { return !isObj(x) || !finiteNum(x.at) || x.at >= r.endAt || x.until !== Math.min(x.at + PAUSE_MS, r.endAt) || !(x.endedAt === null || (finiteNum(x.endedAt) && x.endedAt >= x.at)); })) return false;
    if (r.status === 'active') return r.final === null && r.submissionId === null && r.recorded === false;
    // 끝난 회차: 제출 ID · 시각 · 줄마다 회차 문항과 맞는지 · 점수가 줄의 합과 같은지
    var F = r.final;
    if (r.submissionId !== 'sub-' + r.id || !isObj(F) || !finiteNum(F.at) || F.rulesVersion !== p.rulesVersion) return false;
    if (F.reason === 'expired') { if (F.at !== r.endAt) return false; } else if (F.reason !== 'submit' || F.at < r.startAt || F.at >= r.endAt) return false;
    if (!Array.isArray(F.graded) || F.graded.length !== r.items.length) return false;
    for (var n = 0; n < F.graded.length; n++) {
      var g = F.graded[n], x = r.items[n];
      if (!isObj(g) || g.n !== n || g.mode !== x.mode || g.questionId !== x.questionId || g.origin !== x.origin || g.pointsKind !== x.pointsKind || g.points !== x.points) return false;
      if (typeof g.mismatch !== 'boolean' || typeof g.correct !== 'boolean' || typeof g.answered !== 'boolean') return false;
      if (!(g.optionId === null || x.optionIds.indexOf(g.optionId) >= 0) || g.answered !== (g.optionId !== null)) return false;
      if (g.mismatch ? (g.correctOptionId !== null || g.correct) : x.optionIds.indexOf(g.correctOptionId) < 0) return false;
      if (g.correct !== (!g.mismatch && g.answered && g.optionId === g.correctOptionId) || g.earned !== (g.correct ? g.points : 0)) return false;
    }
    return JSON.stringify(F.score) === JSON.stringify(summarize(F.graded));
  }

  function isPaused(r, t) {
    var last = r.pause && r.pause.log[r.pause.log.length - 1];
    return !!last && r.status === 'active' && t < Math.min(last.until, last.endedAt == null ? Infinity : last.endedAt);
  }

  function create(opts) {
    opts = opts || {};
    var store = opts.store, catalog = opts.catalog;
    var now = typeof opts.now === 'function' ? opts.now : function () { return Date.now(); };
    var random = typeof opts.random === 'function' ? opts.random : Math.random;
    if (!store || !catalog || typeof catalog.lookup !== 'function') throw new Error('HanqRun.create: store와 catalog가 필요해요');
    var lookup = function (mode, id, subject) { try { return catalog.lookup(mode, id, subject || 'history') || null; } catch (e) { return null; } };
    var viewOf = function (id) { return VIEW_PREFIX + id; };

    function loadRun(id) { if (typeof id !== 'string' || !RUN_ID.test(id)) return null; var r = store.loadProgress(viewOf(id)); return validRun(r) ? r : null; }
    function allRuns() {
      var out = [], bad = 0;
      store.progressViews(VIEW_PREFIX).forEach(function (v) { var r = store.loadProgress(v); if (validRun(r) && viewOf(r.id) === v) out.push(r); else bad++; });
      out.sort(function (a, b) { return b.createdAt - a.createdAt || (a.id < b.id ? 1 : -1); });
      return { runs: out, bad: bad };
    }

    /* ---- 고르기(오답 → 정원 → 최신 기출 보충) ---- */
    function officialLatest() {
      var ids = typeof catalog.official === 'function' ? catalog.official() || [] : [], out = [], seen = Object.create(null);
      ids.forEach(function (id) { if (!okKey(id) || seen[id]) return; seen[id] = 1; var L = lookup('mock', id, 'history'); if (!buildItem('mock', id, L, 'fill', function () { return 0; })) return; out.push({ id: id, exam: Number(L.exam), number: Number(L.number) }); });
      out.sort(function (a, b) { return b.exam - a.exam || a.number - b.number || (a.id < b.id ? -1 : 1); }); // 회차 번호가 클수록 최근 시험(제79회 → 제70회), 회차 안에서는 문항 번호 순
      return out;
    }
    function wrongPool(scope) {
      var notes = store.wrongNotes(lookup, { subject: 'history' }), pool = [], ex = { resolved: 0, stale: 0, invalid: 0, missing: 0, unbuildable: 0 };
      notes.forEach(function (n) {
        var inScope = n.status === 'unresolved' || (scope === 'all' && n.status === 'resolved');
        if (!inScope) { if (ex[n.status] != null) ex[n.status]++; return; }
        var L = lookup(n.mode, n.questionId, n.subject);
        if (!L || String(L.v) !== n.currentVersion || !buildItem(n.mode, n.questionId, L, 'x', function () { return 0; })) { ex.unbuildable++; return; }
        pool.push(n);
      });
      return { pool: pool, excluded: ex };
    }
    function recentSort(list) {
      return list.slice().sort(function (a, b) { var ka = noteKey(a.subject, a.mode, a.questionId), kb = noteKey(b.subject, b.mode, b.questionId); return b.lastWrongAt - a.lastWrongAt || (ka < kb ? -1 : ka > kb ? 1 : 0); });
    }
    function pick(pool, size, order, rnd) {
      var sorted = recentSort(pool);
      if (sorted.length <= size) return sorted;
      return order === 'random' ? shuffle(sorted, rnd).slice(0, size) : sorted.slice(0, size);
    }
    function plan(o, rnd) {
      var p = own(PRODUCTS, o && o.product); if (!p || p.mode !== 'personal') return null;
      var scope = o.scope === 'all' ? 'all' : 'unresolved', order = o.order === 'random' ? 'random' : 'recent';
      var wp = wrongPool(scope), chosen = pick(wp.pool, p.size, order, rnd || random), taken = Object.create(null);
      chosen.forEach(function (n) { if (n.mode === 'mock') taken[n.questionId] = 1; });
      var latest = officialLatest().filter(function (x) { return !taken[x.id]; }), need = Math.max(0, p.size - chosen.length), fill = latest.slice(0, need);
      var rounds = latest.map(function (x) { return x.exam; });
      return {
        product: p.key, size: p.size, durationMin: p.durationMin, durationPolicy: p.durationPolicy, scope: scope, order: order, minWrongs: MIN_WRONGS,
        eligibleWrong: wp.pool.length, quizWrong: wp.pool.filter(function (n) { return n.mode === 'quiz'; }).length, mockWrong: wp.pool.filter(function (n) { return n.mode === 'mock'; }).length,
        selectedWrong: chosen.length, selectedQuiz: chosen.filter(function (n) { return n.mode === 'quiz'; }).length, selectedMock: chosen.filter(function (n) { return n.mode === 'mock'; }).length,
        leftOutWrong: Math.max(0, wp.pool.length - chosen.length), fill: fill.length, fillAvailable: latest.length, total: chosen.length + fill.length,
        shortBy: Math.max(0, p.size - chosen.length - fill.length), canCreate: wp.pool.length >= MIN_WRONGS, excluded: wp.excluded,
        fillRounds: fill.length ? { from: fill[0].exam, to: fill[fill.length - 1].exam } : null, poolRounds: rounds.length ? { newest: Math.max.apply(null, rounds), oldest: Math.min.apply(null, rounds) } : null,
        _chosen: chosen, _fill: fill
      };
    }
    /* 만들기 전 미리 보기(수만 — 무작위로 고를 때도 몇 문제가 들어가는지는 같다) */
    function preflight(o) { var pl = plan(o || {}, function () { return 0; }); if (!pl) return null; delete pl._chosen; delete pl._fill; return deepFreeze(pl); }

    function nextSeq() { var m = 0; allRuns().runs.forEach(function (r) { if (r.seq > m) m = r.seq; }); return m + 1; }
    function newRunId(t) {
      for (var i = 0; i < 50; i++) {
        var r = Number(random()); if (!Number.isFinite(r)) r = 0;
        var id = 'r' + Math.floor(t).toString(36) + (Math.floor(Math.abs(r) * 1e9) % 1e9).toString(36) + (i ? 'x' + i.toString(36) : '');
        if (!store.loadProgress(viewOf(id)) && store.progressViews(viewOf(id)).indexOf(viewOf(id)) < 0) return id;
      }
      return null;
    }
    function writeNew(run) {
      var w = store.updateProgress(viewOf(run.id), function (prev) { return prev ? null : run; }); // 이미 있으면 쓰지 않음
      return !!(w && w.ok);
    }
    function baseRun(p, items, selection, t, reviewOf) {
      var id = newRunId(t); if (!id) return null;
      var seq = nextSeq();
      var run = { schema: SCHEMA, kind: 'run', id: id, subject: 'history',
        product: { key: p.key, mode: p.mode, size: p.size, durationMs: p.durationMin * 60000, durationPolicy: p.durationPolicy, label: p.label,
          rankEligible: p.mode === 'personal' || reviewOf ? false : p.rankEligible === true, rulesVersion: p.rulesVersion },
        seq: seq, createdAt: t, kstDate: kstParts(t).date, title: runTitle(seq, t, p.label), selection: selection,
        items: items.map(function (it, n) { it.n = n; return it; }), status: 'ready', startAt: null, endAt: null, current: 0, answers: {},
        pause: { count: 0, log: [] }, submissionId: null, final: null, recorded: false, purchase: null, updatedAt: t };
      if (reviewOf) run.reviewOf = reviewOf;
      return run;
    }

    /* 오답 모의고사 만들기. 서로 다른 오답(지금 내용으로 다시 풀 수 있는 것)이 10문제 이상일 때만 */
    function createPersonalRun(o) {
      var t = now(), pl = plan(o || {}, random);
      if (!pl) return { ok: false, reason: 'product' };
      if (!pl.canCreate) { delete pl._chosen; delete pl._fill; return { ok: false, reason: 'not-enough-wrongs', preflight: pl }; }
      var p = PRODUCTS[pl.product], items = [];
      pl._chosen.forEach(function (n) { var it = buildItem(n.mode, n.questionId, lookup(n.mode, n.questionId, n.subject), n.mode === 'quiz' ? 'wrong-quiz' : 'wrong-mock', random); if (it) items.push(it); });
      pl._fill.forEach(function (x) { var it = buildItem('mock', x.id, lookup('mock', x.id, 'history'), 'fill', random); if (it) items.push(it); });
      var cnt = function (o) { return items.filter(function (x) { return x.origin === o; }).length; }; // 실제로 넣은 문항으로 센다
      var selection = { scope: pl.scope, order: pl.order, eligibleWrong: pl.eligibleWrong, quizWrong: pl.quizWrong, mockWrong: pl.mockWrong,
        selectedWrong: cnt('wrong-quiz') + cnt('wrong-mock'), selectedQuiz: cnt('wrong-quiz'), selectedMock: cnt('wrong-mock'), leftOutWrong: pl.leftOutWrong,
        fill: cnt('fill'), shortBy: Math.max(0, p.size - items.length), fillRule: 'latest-official-round-desc', fillRounds: pl.fillRounds, poolRounds: pl.poolRounds };
      var run = baseRun(p, items, selection, t);
      if (!run || !writeNew(run)) return { ok: false, reason: 'storage' };
      return { ok: true, run: deepFreeze(clone(loadRun(run.id) || run)) };
    }
    /* 일반 고정 회차(순위 대상이 될 수 있음): 공식 기출 한 회차(실전 50) 또는 고른 기출 ID 목록. 화면의 ‘날짜별 모의고사’는 아래 openPrepared를 쓴다 */
    function createFixedRun(o) {
      var t = now(), p = own(PRODUCTS, o && o.product); if (!p || p.mode !== 'fixed') return { ok: false, reason: 'product' };
      var ids = Array.isArray(o.questionIds) ? o.questionIds.slice() : officialLatest().filter(function (x) { return x.exam === Number(o.round); }).map(function (x) { return x.id; });
      if (ids.length !== p.size || ids.filter(function (x, i) { return ids.indexOf(x) === i; }).length !== ids.length) return { ok: false, reason: 'size' };
      var items = ids.map(function (id) { return buildItem('mock', id, lookup('mock', id, 'history'), 'fixed', random); });
      if (items.some(function (x) { return !x; })) return { ok: false, reason: 'question' };
      var run = baseRun(p, items, { round: Number(o.round) || null, questionIds: ids.length }, t);
      if (!run || !writeNew(run)) return { ok: false, reason: 'storage' };
      return { ok: true, run: deepFreeze(clone(loadRun(run.id))) };
    }

    /* ---- 준비된 날짜별 모의고사(앱에 수록된 제70–79회 기출만) ----
       회차마다 실전 50 = 원래 1–50번 전부, 미니 20 = 원래 1–20번(HanQ가 정한 부분 묶음, 시간은 연습 규칙 30분).
       묶음 key = 상품 + 회차 + 정확한 원래 문항 ID 목록의 해시 — 새로 고침·다른 탭에서도 같다. */
    function preparedSets() {
      var by = Object.create(null), out = [];
      officialLatest().forEach(function (x) { (by[x.exam] = by[x.exam] || []).push(x); });
      Object.keys(by).map(Number).sort(function (a, b) { return b - a; }).forEach(function (round) {
        var nums = Object.create(null); by[round].forEach(function (x) { nums[x.number] = x.id; });
        ['fixed-mini', 'fixed-formal'].forEach(function (k) {
          var p = own(PRODUCTS, k); if (!p) return;
          var ids = []; for (var i = 1; i <= p.size; i++) { if (!nums[i]) return; ids.push(nums[i]); }
          out.push({ key: k + '|r' + round + '|' + hashIds(ids), product: k, round: round, ids: ids, size: p.size, durationMin: p.durationMin, durationPolicy: p.durationPolicy, label: p.label });
        });
      });
      return out;
    }
    /* 준비 회차 열기(잠금 창구 안에서 한 번에 찾고 없으면 만듦 — 두 번 누르거나 두 탭이어도 처음 회차는 하나).
       review:true는 처음 회차가 끝난 뒤에만, rankEligible:false인 ‘다시 풀기’ 회차(아직 안 끝난 것이 있으면 그것)를 연다 */
    function openPrepared(o) {
      var set = preparedSets().filter(function (s) { return s.key === (o && o.key); })[0];
      if (!set) return { ok: false, reason: 'unknown-set' };
      var mine = allRuns().runs.filter(function (r) { return r.selection && r.selection.preparedKey === set.key; }).sort(function (a, b) { return a.createdAt - b.createdAt || (a.id < b.id ? -1 : 1); });
      var first = mine.filter(function (r) { return r.reviewOf == null && r.product.key === set.product; })[0] || null;
      if (!o.review) { if (first) return { ok: true, existing: true, run: deepFreeze(clone(first)) }; return makePrepared(set, null); }
      if (!first || first.status !== 'final') return { ok: false, reason: 'no-final' };
      var open = mine.filter(function (r) { return r.reviewOf === first.id && r.status !== 'final'; })[0];
      if (open) return { ok: true, existing: true, run: deepFreeze(clone(open)) };
      return makePrepared(set, first.id);
    }
    function makePrepared(set, reviewOf) {
      var t = now(), p = own(PRODUCTS, set.product);
      var items = set.ids.map(function (id) { return buildItem('mock', id, lookup('mock', id, 'history'), 'fixed', random); });
      if (items.some(function (x) { return !x; })) return { ok: false, reason: 'question' };
      var run = baseRun(p, items, { round: set.round, questionIds: set.ids.length, preparedKey: set.key }, t, reviewOf);
      if (!run || !validRun(run) || !writeNew(run)) return { ok: false, reason: 'storage' };
      return { ok: true, existing: false, run: deepFreeze(clone(loadRun(run.id))) };
    }

    /* ---- 채점 ---- */
    function grade(r, at) {
      var graded = r.items.map(function (it, n) {
        var a = own(r.answers, String(n)), L = lookup(it.mode, it.questionId, it.subject), correctId = null;
        var opt = a && typeof a.optionId === 'string' && a.at < r.endAt && a.at <= at && it.optionIds.indexOf(a.optionId) >= 0 ? a.optionId : null;
        // 내용 버전이 다르거나, 같은 버전인데 보기 묶음·정답이 회차와 맞지 않으면 채점하지 않음(옛 답을 지어내 채점하지 않음)
        var mismatch = !L || String(L.v) !== it.contentVersion || !Array.isArray(L.options) || L.options.length !== it.optionIds.length ||
          !L.options.every(function (o) { return o && it.optionIds.indexOf(o.id) >= 0; });
        if (!mismatch) { var c = L.options.filter(function (o) { return o && o.correct === true; }); if (c.length !== 1) mismatch = true; else correctId = c[0].id; }
        var correct = !mismatch && opt !== null && opt === correctId;
        return { n: n, mode: it.mode, questionId: it.questionId, origin: it.origin, optionId: opt, answered: opt !== null, correct: correct, mismatch: mismatch,
          correctOptionId: mismatch ? null : correctId, pointsKind: it.pointsKind, points: it.points, earned: correct ? it.points : 0 };
      });
      return { graded: graded, score: summarize(graded) };
    }
    function finalizeInPlace(r, at, reason) {
      var g = grade(r, at);
      r.status = 'final'; r.submissionId = r.submissionId || ('sub-' + r.id);
      r.final = { at: at, reason: reason, graded: g.graded, score: g.score, rulesVersion: r.product.rulesVersion };
    }
    /* 처음 끝난 회차의 문항별 채점 기록(같은 제출 한 번 규칙으로 다시 불러도 늘지 않음). 내용이 바뀐 문항은 남기지 않는다 */
    function recordFinal(r) {
      var allOk = true;
      r.final.graded.forEach(function (g) {
        if (g.mismatch) return;
        var it = r.items[g.n], k = g.optionId ? Number(String(g.optionId).slice(-1)) : null;
        var res = store.recordAttempt({ subject: it.subject || 'history', mode: it.mode, source: 'run', questionId: it.questionId, contentVersion: it.contentVersion,
          optionId: g.optionId, unanswered: !g.answered, choice: it.mode === 'mock' && g.optionId ? k : undefined, correct: g.correct,
          chapter: it.chapter || undefined, era: it.era || undefined, submissionId: r.submissionId + '-' + g.n, runId: r.id, rankEligible: r.product.rankEligible });
        if (!res || !res.ok) allOk = false;
      });
      if (allOk) store.updateProgress(viewOf(r.id), function (prev) { if (!validRun(prev) || prev.status !== 'final' || prev.recorded) return null; var x = clone(prev); x.recorded = true; return x; });
    }

    /* 바꾸기: 저장된 최신 상태를 읽어 → 마감 확인 → op → (바뀌었을 때만) 쓰기 */
    function mutate(id, op) {
      var res = { ok: false, reason: 'missing' }, t = now();
      if (typeof id !== 'string' || !RUN_ID.test(id)) return res;
      store.updateProgress(viewOf(id), function (prev) {
        if (!validRun(prev)) { res = { ok: false, reason: prev ? 'corrupt' : 'missing' }; return null; }
        var r = clone(prev), before = JSON.stringify(prev);
        if (r.status === 'active' && t >= r.endAt) finalizeInPlace(r, r.endAt, 'expired');
        res = (op ? op(r, t) : null) || { ok: true };
        if (JSON.stringify(r) === before) return null;
        r.updatedAt = t;
        if (!validRun(r)) { res = { ok: false, reason: 'internal' }; return null; } // 앞뒤가 맞지 않는 상태는 쓰지 않음
        return r;
      });
      var run = loadRun(id);
      if (run && run.status === 'final' && !run.recorded) { recordFinal(run); run = loadRun(id); }
      res.run = run ? deepFreeze(clone(run)) : null;
      return res;
    }
    function refuse(r, t) {
      if (r.status === 'final') return { ok: false, reason: r.final.reason === 'expired' ? 'expired' : 'final' };
      if (r.status === 'ready') return { ok: false, reason: 'not-started' };
      if (isPaused(r, t)) return { ok: false, reason: 'paused' };
      return null;
    }

    var api = {
      preflight: preflight, createPersonalRun: createPersonalRun, createFixedRun: createFixedRun, preparedSets: preparedSets, openPrepared: openPrepared,
      /* 읽기만(마감이 지났어도 채점하지 않음): 화면의 남은 시간 표시처럼 잠금 없이 읽어도 되는 곳에서만 */
      peek: function (id) { var r = loadRun(id); return r ? deepFreeze(clone(r)) : null; },
      get: function (id) { var r = loadRun(id); if (!r) return null; if ((r.status === 'active' && now() >= r.endAt) || (r.status === 'final' && !r.recorded)) return mutate(id).run; return deepFreeze(clone(r)); },
      list: function () { var a = allRuns(); return { runs: a.runs.map(function (r) { return deepFreeze(clone(r)); }), corrupt: a.bad }; },
      /* 다시 들어왔을 때 등: 마감이 지난 진행 중 회차를 모두 채점 */
      tickAll: function () { var t = now(), done = []; allRuns().runs.forEach(function (r) { if ((r.status === 'active' && t >= r.endAt) || (r.status === 'final' && !r.recorded)) { mutate(r.id); done.push(r.id); } }); return done; },
      tick: function (id) { return mutate(id); },
      start: function (id) { return mutate(id, function (r, t) { if (r.status !== 'ready') return { ok: r.status === 'active', reason: r.status }; r.status = 'active'; r.startAt = t; r.endAt = t + r.product.durationMs; }); },
      answer: function (id, n, optionId) {
        return mutate(id, function (r, t) {
          var no = refuse(r, t); if (no) return no;
          var it = Number.isInteger(n) ? r.items[n] : null; if (!it) return { ok: false, reason: 'index' };
          if (optionId !== null && it.optionIds.indexOf(optionId) < 0) return { ok: false, reason: 'option' };
          var L = lookup(it.mode, it.questionId, it.subject); if (!L || String(L.v) !== it.contentVersion) return { ok: false, reason: 'mismatch' };
          r.answers[String(n)] = { optionId: optionId, at: t }; r.current = n;
        });
      },
      go: function (id, n) { return mutate(id, function (r, t) { var no = refuse(r, t); if (no) return no; if (!Number.isInteger(n) || n < 0 || n >= r.items.length) return { ok: false, reason: 'index' }; r.current = n; }); },
      pause: function (id) {
        return mutate(id, function (r, t) {
          var no = refuse(r, t); if (no) return no;
          if (r.pause.count >= PAUSE_MAX) return { ok: false, reason: 'limit' };
          r.pause.log.push({ at: t, until: Math.min(t + PAUSE_MS, r.endAt), endedAt: null }); r.pause.count = r.pause.log.length;
        });
      },
      resume: function (id) {
        return mutate(id, function (r, t) { if (!isPaused(r, t)) return { ok: false, reason: 'not-paused' }; r.pause.log[r.pause.log.length - 1].endedAt = t; });
      },
      submit: function (id) {
        return mutate(id, function (r, t) {
          if (r.status === 'final') return { ok: true, already: true, reason: r.final.reason };
          if (r.status === 'ready') return { ok: false, reason: 'not-started' };
          finalizeInPlace(r, t, 'submit');
        });
      },
      /* 화면용 도우미 */
      remaining: function (r) { return r && r.status === 'active' ? Math.max(0, r.endAt - now()) : 0; },
      pauseState: function (r) { var t = now(), last = r && r.pause.log[r.pause.log.length - 1], on = !!r && isPaused(r, t);
        return { paused: on, until: on ? Math.min(last.until, last.endedAt == null ? Infinity : last.endedAt) : null, left: on ? Math.min(last.until, last.endedAt == null ? Infinity : last.endedAt) - t : 0, used: r ? r.pause.count : 0, max: PAUSE_MAX }; },
      /* 다음 단계(순위·학습 기록)용: 끝난 회차의 결과(회차마다 하나, 처음 정해진 결과 그대로). eligibleOnly면 순위 대상 회차만 */
      finalResults: function (o) {
        return allRuns().runs.filter(function (r) { return r.status === 'final' && (!(o && o.eligibleOnly) || r.product.rankEligible === true); })
          .map(function (r) { return deepFreeze({ runId: r.id, product: r.product.key, mode: r.product.mode, rankEligible: r.product.rankEligible, seq: r.seq, title: r.title, kstDate: r.kstDate,
            finalAt: r.final.at, reason: r.final.reason, submissionId: r.submissionId, score: clone(r.final.score) }); })
          .sort(function (a, b) { return a.finalAt - b.finalAt; });
      }
    };
    return api;
  }

  /* ===== 브라우저용 잠금 창구(facade) =====
     localStorage의 ‘읽고 → 고치고 → 쓰기’는 실제 브라우저의 여러 탭(서로 다른 렌더러) 사이에서 한 덩어리로 실행되지 않는다.
     그래서 화면은 회차를 바꾸거나 마감이 지나 채점될 수 있는 모든 호출(만들기 · 시작 · 답 · 이동 · 일시정지 · 다시 풀기 · 제출 · tick ·
     tickAll · get)을 이 창구로 부르고, 창구는 origin 전체에서 하나뿐인 Web Locks 잠금 'hanq:run:<subject>' 안에서 위의 동기 컨트롤러를 부른다.
     잠금을 얻은 뒤에 시각·마감·상태를 확인하므로, 잠금을 기다리던 늦은 답은 마감 뒤라면 거절된다. 잠금 안에서 다시 잠금을 청하지 않는다.
     - mode 'locks'       : navigator.locks(또는 넣어 준 locks)로 탭 사이 직렬화
     - mode 'memory'      : 저장소가 이 탭의 메모리뿐(다른 탭과 나누지 않음) → 이 탭 안의 줄 세우기로 충분
     - mode 'unavailable' : 여러 탭이 나누는 localStorage인데 잠금이 없음 → 모의고사 회차를 바꾸는 호출은 모두 거절(reason 'no-lock').
                            안전하지 않은 동기 쓰기로 몰래 넘어가지 않는다. 읽기(peek · list · finalResults · preflight)는 된다.
     잠금 이름은 하나라서 만들기(회차 번호·ID)와 모든 회차 변경이 한 줄로 선다. 시계·저장소를 손으로 바꾸는 것을 막는 보안 장치는 아니다. */
  function createSerialized(opts) {
    opts = opts || {};
    var core = opts.core || create(opts), store = opts.store, subject = opts.subject || 'history';
    var lockName = opts.lockName || ('hanq:run:' + subject);
    var locks = Object.prototype.hasOwnProperty.call(opts, 'locks') ? opts.locks : (root.navigator && root.navigator.locks) || null;
    var memoryOnly = !!(store && typeof store.status === 'function' && store.status().backend === 'memory');
    var mode = memoryOnly ? 'memory' : (locks && typeof locks.request === 'function' ? 'locks' : 'unavailable');
    var queue = Promise.resolve(), busy = 0;
    function inLock(fn) {
      var body = function () { busy++; try { if (store && typeof store.invalidate === 'function') store.invalidate(); return fn(); } finally { busy--; } };
      if (busy) return Promise.reject(new Error('HanqRun: 잠금 안에서 다시 잠금을 청하지 않아요')); // 같은 탭 안 겹침(교착 방지)
      if (mode === 'locks') return Promise.resolve(locks.request(lockName, { mode: 'exclusive' }, function () { return body(); }));
      if (mode === 'memory') { var p = queue.then(body); queue = p.catch(function () {}); return p; }
      return Promise.resolve({ ok: false, reason: 'no-lock', run: null });
    }
    function guarded(name) { return function () { var a = arguments; return inLock(function () { return core[name].apply(null, a); }); }; }
    var facade = {
      lockName: lockName, mode: mode, crossTabSafe: mode !== 'unavailable',
      createPersonalRun: guarded('createPersonalRun'), createFixedRun: guarded('createFixedRun'), openPrepared: guarded('openPrepared'), preparedSets: core.preparedSets,
      get: guarded('get'), tick: guarded('tick'), tickAll: function () { return mode === 'unavailable' ? Promise.resolve([]) : inLock(function () { return core.tickAll(); }); },
      start: guarded('start'), answer: guarded('answer'), go: guarded('go'), pause: guarded('pause'), resume: guarded('resume'), submit: guarded('submit'),
      /* 잠금 없이 읽기만(숨은 변경 없음) */
      peek: core.peek, list: core.list, finalResults: core.finalResults, preflight: core.preflight, remaining: core.remaining, pauseState: core.pauseState
    };
    if (mode === 'unavailable') facade.get = function (id) { return Promise.resolve(core.peek(id)); }; // 읽기만, 마감 채점은 하지 않음
    return Object.freeze(facade);
  }

  /* 앱의 문항 묶음(빈칸 카탈로그 · 기출 풀)을 컨트롤러가 쓰는 꼴로 */
  function catalogFrom(QC, EP) {
    return {
      lookup: function (mode, id, subject) {
        if (subject && subject !== 'history') return null;
        var it = mode === 'mock' ? own(EP && EP.questions, id) : mode === 'quiz' ? own(QC && QC.questions, id) : null;
        return it && it.v != null && Array.isArray(it.options) ? it : null;
      },
      official: function () { return EP && Array.isArray(EP.order) ? EP.order.slice() : []; }
    };
  }

  var api = { SCHEMA: SCHEMA, RULES_VERSION: RULES_VERSION, PRODUCTS: PRODUCTS, POLICY: POLICY, KEY_CLASS: KEY_CLASS, create: create, createSerialized: createSerialized,
    catalogFrom: catalogFrom, validRun: validRun, summarize: summarize, kstParts: kstParts, runTitle: runTitle };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined' && root === window) root.HanqRun = api;
})(typeof window !== 'undefined' ? window : globalThis);
