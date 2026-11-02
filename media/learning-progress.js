/* 학습 기록 저장소(브라우저 안에서만) — 화면(DOM)과 따로 떼어 낸 공용 어댑터.
 *
 *  window.HanqProgress.store    앱이 쓰는 기본 저장소(localStorage, 막히면 이 탭의 메모리)
 *  window.HanqProgress.create() 시험·다른 화면용으로 저장소를 새로 만듦({storage, now, random, listen})
 *
 *  저장 방식
 *  - 채점 한 번 = 바뀌지 않는 기록 하나(attempt). 키 'hanq:att:v1:<attemptId>' 하나에 한 건씩 써서
 *    여러 탭이 동시에 써도 서로 덮어쓰지 않는다. 한 번 쓴 기록은 고치거나 지우지 않는다.
 *  - 풀던 상태(고른 답·묶음·위치)는 화면별 진행 기록 'hanq:progress:v1:<view>' — 쓰기 전에 다시 읽어
 *    문항별로 더 최근(at) 것을 남긴다(read–merge–write).
 *  - 오답 노트(아직 못 푼 오답·해결한 오답·내용이 바뀐 옛 기록)는 저장하지 않고 기록에서 매번 계산한다.
 *    그래서 다른 탭에서 맞혀도 여기서 바로 해결로 보인다. 같은 제출·같은 오답은 과목(subject)·종류(mode)·문항 ID로 묶어
 *    다른 과목의 같은 ID와 섞지 않는다. 같은 내용 버전이라도 지금 문항에 없는 보기·어긋난 정답 표시의 기록은 계산에서 뺀다.
 *  - 기록 ID는 이미 있는 키와 겹치지 않을 때까지 늘려 정하므로, 시계·난수가 같아도 한 번 쓴 기록을 덮어쓰지 않는다.
 *  - 'hanq:' 밖의 키는 읽지도 지우지도 않는다. 깨진 기록·더 새 형식(schema)의 기록은 그대로 두고(지우지 않음)
 *    건너뛰며 알림만 남긴다. 더 새 형식의 진행 기록은 덮어쓰지 않는다(읽기 전용).
 *  - localStorage를 못 쓰면(막힘·SecurityError·용량 초과) 이 탭의 메모리에만 두고, 그 사실을 status()로 알린다.
 *  - ownerId(선택): 서버가 확인한 로그인 계정으로 푼 기록에만 붙는다(앱의 hpRecord가 HanqApi의 signedIn ownerId만 넣음).
 *    예전 기록·게스트 기록에는 없다 — 누구의 기록인지 알 수 없으므로 어느 계정에도 자동으로 보내지 않는다(그대로 보존).
 *  - 보통 연습(빈칸·기출·오답 다시 풀기)은 rankEligible:false. 뒤에 붙일 시간제 회차는 source:'run' · runId ·
 *    submissionId로 같은 기록을 쓴다(순위 계산은 이 파일에 없다).
 */
(function (root) {
  'use strict';
  var SCHEMA = 1;
  var PREFIX = 'hanq:';
  var ATT = 'hanq:att:v1:';
  var PROG = 'hanq:progress:v1:';
  var MODES = ['quiz', 'mock'];
  var SOURCES = ['quiz', 'mock', 'wrong-retry', 'run'];
  var QUIZ_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{1,120}$/;
  var EXAM_ID = /^exam-\d\d-\d\d$/;
  var VIEW_NAME = /^[a-z][a-z0-9-]{0,40}$/;
  var REF_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,119}$/; // runId·회차 제출 ID: 빈칸·공백·이상한 글자 없이
  var OWNER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/; // 서버 계정 ID(UUID)

  function isObj(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
  function dict() { return Object.create(null); }
  var BAD_KEY = { '__proto__': 1, 'constructor': 1, 'prototype': 1 };
  /* 저장된 데이터에서 온 키: Object.prototype 이름(constructor·__proto__ 등)은 건너뛴다 */
  function safeKey(k) { return typeof k === 'string' && k.length > 0 && !BAD_KEY[k]; }
  /* 같은 과목·종류·문항 = 같은 오답(과목 이름을 앞에 붙여 다른 과목의 같은 ID와 섞이지 않게) */
  function noteKey(subject, mode, questionId) { return (subject || 'history') + '|' + mode + '|' + questionId; }
  function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }
  function deepFreeze(o) { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.keys(o).forEach(function (k) { deepFreeze(o[k]); }); } return o; }

  /* 한국 시간(UTC+9, 서머타임 없음) 날짜·시각 — 기록의 ts(밀리초)를 바꿀 뿐 날짜를 지어내지 않는다 */
  function kst(ts) {
    if (!Number.isFinite(ts)) return null;
    var d = new Date(ts + 9 * 3600 * 1000), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return { date: d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()), time: p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) };
  }

  /* 기록 한 건이 올바른지(형식·종류·ID·버전·보기 ID·시각) */
  function validateAttempt(o) {
    if (!isObj(o) || o.schema !== SCHEMA || o.kind !== 'attempt') return false;
    if (typeof o.id !== 'string' || !/^a[0-9a-z]{6,40}$/.test(o.id)) return false;
    if (MODES.indexOf(o.mode) < 0 || SOURCES.indexOf(o.source) < 0) return false;
    if (typeof o.subject !== 'string' || !/^[a-z][a-z0-9-]{0,30}$/.test(o.subject)) return false;
    if (typeof o.questionId !== 'string' || !(o.mode === 'mock' ? EXAM_ID : QUIZ_ID).test(o.questionId)) return false;
    if (typeof o.contentVersion !== 'string' || !o.contentVersion || o.contentVersion.length > 80) return false;
    if (o.unanswered !== undefined && typeof o.unanswered !== 'boolean') return false;
    if (typeof o.correct !== 'boolean' || typeof o.rankEligible !== 'boolean') return false;
    if (o.runId != null && (typeof o.runId !== 'string' || !REF_ID.test(o.runId))) return false;
    if (o.ownerId !== undefined && (typeof o.ownerId !== 'string' || !OWNER_ID.test(o.ownerId))) return false; // 없으면(예전·게스트 기록) 그대로 유효
    if (o.unanswered === true) {
      /* 답하지 않은 문항(optionId:null)은 모의고사 회차의 최종 채점(source 'run' · 올바른 runId · submissionId)에서만, 늘 오답으로 */
      if (o.optionId !== null || o.source !== 'run' || typeof o.runId !== 'string' || !REF_ID.test(o.submissionId) || o.correct !== false) return false;
    } else {
      if (typeof o.optionId !== 'string' || !o.optionId || o.optionId.length > 120) return false;
      if (o.mode === 'mock' && !new RegExp('^' + o.questionId + '-option-[1-5]$').test(o.optionId)) return false;
    }
    if (!Number.isFinite(o.ts) || o.ts < 1.5e12 || o.ts > 4.1e12) return false;
    if (typeof o.submissionId !== 'string' || !o.submissionId || o.submissionId.length > 120 || /\s/.test(o.submissionId)) return false;
    if (o.rankEligible && o.source !== 'run') return false;
    return true;
  }

  function memoryStorage() {
    var m = {};
    return { getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; }, key: function (i) { return Object.keys(m)[i] || null; }, get length() { return Object.keys(m).length; } };
  }

  function create(opts) {
    opts = opts || {};
    var now = typeof opts.now === 'function' ? opts.now : function () { return Date.now(); };
    var random = typeof opts.random === 'function' ? opts.random : Math.random;
    var ls = null, mem = memoryStorage(), memKeys = {}, notices = [], noticeSeen = {};
    var writeFailed = false, blocked = false, listeners = [], attCache = null, corrupt = {}, future = {}, readOnlyViews = {};
    function notice(code, text) { if (noticeSeen[code]) return; noticeSeen[code] = 1; notices.push({ code: code, text: text }); }
    try {
      ls = Object.prototype.hasOwnProperty.call(opts, 'storage') ? opts.storage : (typeof root.localStorage !== 'undefined' ? root.localStorage : null);
      if (ls) { var probe = PREFIX + 'probe'; ls.setItem(probe, '1'); ls.removeItem(probe); }
    } catch (e) { ls = null; blocked = true; }
    if (!ls) { blocked = true; notice('blocked', '이 브라우저에서 저장 공간을 쓸 수 없어 기록을 이 탭에만 두어요. 탭을 닫거나 새로 고치면 사라져요.'); }

    function rawKeys() {
      var out = {}, i, k;
      if (ls) { try { for (i = 0; i < ls.length; i++) { k = ls.key(i); if (k && k.indexOf(PREFIX) === 0) out[k] = 1; } } catch (e) { notice('read', '저장된 기록 일부를 읽지 못했어요.'); } }
      Object.keys(memKeys).forEach(function (k2) { out[k2] = 1; });
      return Object.keys(out);
    }
    function rawGet(k) {
      if (memKeys[k]) return mem.getItem(k);
      if (!ls) return null;
      try { return ls.getItem(k); } catch (e) { notice('read', '저장된 기록 일부를 읽지 못했어요.'); return null; }
    }
    function rawSet(k, v) {
      if (ls) {
        try { ls.setItem(k, v); if (memKeys[k]) { delete memKeys[k]; mem.removeItem(k); } return true; }
        catch (e) {
          var quota = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014 || /quota/i.test(String(e.message)));
          notice(quota ? 'quota' : 'write', quota ? '저장 공간이 가득 차서 이번 기록부터는 이 탭에만 두어요. 새로 고치면 이 탭에서 남긴 기록은 사라질 수 있어요.' : '기록을 저장하지 못해 이 탭에만 두어요. 새로 고치면 사라질 수 있어요.');
        }
      }
      writeFailed = true; memKeys[k] = 1; mem.setItem(k, v); return false;
    }
    function parse(k) { var raw = rawGet(k); if (raw == null) return { missing: true }; try { return { value: JSON.parse(raw) }; } catch (e) { return { bad: true }; } }

    function loadAttempts() {
      if (attCache) return attCache;
      var list = [], bySub = dict();
      rawKeys().filter(function (k) { return k.indexOf(ATT) === 0; }).forEach(function (k) {
        var p = parse(k); if (p.missing) return;
        var o = p.value;
        if (p.bad || !isObj(o)) { corrupt[k] = 1; return; }
        if (typeof o.schema === 'number' && o.schema > SCHEMA) { future[k] = 1; return; }
        if (!validateAttempt(o) || k !== ATT + o.id) { corrupt[k] = 1; return; }
        delete corrupt[k];
        var sk = noteKey(o.subject, o.mode, o.questionId) + '|' + o.submissionId;
        if (bySub[sk]) return; // 같은 제출(같은 과목·종류·문항·submissionId)은 한 번만
        bySub[sk] = 1; list.push(deepFreeze(o));
      });
      if (Object.keys(corrupt).length) notice('corrupt', '읽을 수 없는 기록 ' + Object.keys(corrupt).length + '건은 지우지 않고 그대로 두었어요(오답 노트 계산에서만 빼요).');
      if (Object.keys(future).length) notice('future', '이 앱보다 새 버전에서 남긴 기록이 있어요. 지우거나 바꾸지 않고 그대로 두었어요.');
      list.sort(function (a, b) { return a.ts - b.ts || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); });
      attCache = list; return list;
    }
    function invalidate() { attCache = null; }
    function emit(ev) { listeners.slice().forEach(function (fn) { try { fn(ev); } catch (e) {} }); }

    /* 기록 ID: 시각 + 난수 + 이 저장소의 일련번호. 시각·난수가 같아도(두 탭·고정된 시계) 이미 있는 키(저장소·메모리·캐시)와 겹치면
       뒤에 번호를 더 붙여, 한 번 쓴 기록을 절대 덮어쓰지 않는다. */
    var seq = 0;
    function idTaken(id) {
      if (rawGet(ATT + id) != null) return true;
      if (attCache) for (var i = 0; i < attCache.length; i++) if (attCache[i].id === id) return true;
      return false;
    }
    function newAttemptId(ts) {
      var r = Number(random()); if (!Number.isFinite(r)) r = 0;
      var base = 'a' + Math.floor(ts).toString(36) + (Math.floor(Math.abs(r) * 1e12) % 1e12).toString(36) + (++seq).toString(36), id = base, n = 0;
      while (idTaken(id)) id = base + 'x' + (++n).toString(36);
      return id;
    }

    /* 채점 한 번을 기록한다. 같은 과목·종류·문항의 같은 submissionId는 다시 쓰지 않는다(버튼을 두 번 눌러도 한 건). */
    function recordAttempt(input) {
      if (!isObj(input)) return { ok: false, error: 'input' };
      // 앞뒤가 맞지 않는 입력(답하지 않았다면서 보기를 고름, unanswered가 참/거짓이 아님)은 고쳐 받지 않고 거절
      if (input.unanswered !== undefined && typeof input.unanswered !== 'boolean') return { ok: false, error: 'invalid' };
      if (input.unanswered === true && input.optionId !== null) return { ok: false, error: 'invalid' };
      if (input.runId != null && typeof input.runId !== 'string') return { ok: false, error: 'invalid' };
      if (input.ownerId != null && (typeof input.ownerId !== 'string' || !OWNER_ID.test(input.ownerId))) return { ok: false, error: 'invalid' };
      var src = SOURCES.indexOf(input.source) >= 0 ? input.source : null, ts = now();
      if (!Number.isFinite(ts)) return { ok: false, error: 'invalid' };
      var o = {
        schema: SCHEMA, kind: 'attempt', id: '',
        subject: typeof input.subject === 'string' && input.subject ? input.subject : 'history',
        mode: input.mode, source: src, questionId: input.questionId, contentVersion: input.contentVersion,
        reviewVersion: typeof input.reviewVersion === 'string' ? input.reviewVersion : null,
        optionId: input.optionId, unanswered: input.unanswered === true,
        choice: Number.isInteger(input.choice) ? input.choice : null,
        correct: input.correct === true ? true : input.correct === false ? false : null,
        chapter: typeof input.chapter === 'string' ? input.chapter : null, era: typeof input.era === 'string' ? input.era : null,
        submissionId: input.submissionId, runId: typeof input.runId === 'string' ? input.runId : null,
        rankEligible: src === 'run' && input.rankEligible === true, ts: ts
      };
      if (input.ownerId != null) o.ownerId = input.ownerId; // 계정 기록만 · 게스트 기록의 모양은 예전과 같다
      o.id = 'a0000000'; // 형식 검사용 자리(진짜 ID는 중복 검사 뒤에)
      if (!validateAttempt(o)) return { ok: false, error: 'invalid' };
      var sk = noteKey(o.subject, o.mode, o.questionId) + '|' + o.submissionId;
      var dup = loadAttempts().filter(function (a) { return noteKey(a.subject, a.mode, a.questionId) + '|' + a.submissionId === sk; })[0];
      if (dup) return { ok: true, duplicate: true, attempt: dup, persisted: !memKeys[ATT + dup.id] };
      o.id = newAttemptId(ts);
      if (!validateAttempt(o)) return { ok: false, error: 'invalid' };
      var persisted = rawSet(ATT + o.id, JSON.stringify(o));
      if (attCache) { attCache.push(deepFreeze(o)); }
      emit({ type: 'attempt', remote: false, attempt: o });
      return { ok: true, duplicate: false, attempt: o, persisted: persisted };
    }

    function attempts(filter) {
      var f = filter || {};
      return loadAttempts().filter(function (a) {
        return (!f.mode || a.mode === f.mode) && (!f.questionId || a.questionId === f.questionId) && (!f.subject || a.subject === f.subject) && (!f.source || a.source === f.source) &&
          (f.ownerId === undefined || (a.ownerId || null) === f.ownerId);
      });
    }

    /* 지금 문항의 보기 목록: lookup이 문항 자체({v, options})를 주든 앱의 감싼 꼴({v, item:{options}})을 주든 */
    function optionsOf(cur) {
      if (Array.isArray(cur.options)) return cur.options;
      if (cur.item && Array.isArray(cur.item.options)) return cur.item.options;
      return null;
    }
    /* 기록 한 건이 지금 문항에 비추어: 'current'(같은 내용·실제 있는 보기·정답 여부도 맞음) · 'invalid'(같은 내용인데 없는 보기이거나
       정답 여부가 실제와 다름 — 지우지 않고 계산에서만 뺌) · 'old'(예전 내용) */
    function judge(a, cur) {
      if (a.contentVersion !== String(cur.v)) return 'old';
      if (a.unanswered === true) return a.optionId === null && a.correct === false ? 'current' : 'invalid'; // 모의고사에서 답하지 않은 문항 = 오답
      var opts = optionsOf(cur); if (!opts) return 'current';
      var o = null;
      for (var i = 0; i < opts.length; i++) if (opts[i] && opts[i].id === a.optionId) { o = opts[i]; break; }
      if (!o) return 'invalid';
      if (typeof o.correct === 'boolean' && o.correct !== a.correct) return 'invalid';
      return 'current';
    }

    /* 오답 노트: lookup(mode, questionId, subject) → 지금 앱에 있는 문항(v와 가능하면 options 포함) 또는 null.
     * 과목·종류·문항마다 하나. opts.subject를 주면 그 과목만.
     *  unresolved — 지금 내용(v)으로 실제 있는 보기를 골라 틀렸고, 그 뒤 같은 내용으로 맞힌 적이 없음
     *  resolved   — 지금 내용으로 틀린 뒤 같은 내용으로 맞힘(기록은 그대로)
     *  stale      — 틀린 기록이 모두 예전 내용(v가 다름): 다시 풀기·해결 계산에서 빼고 옛 기록으로만 보임
     *  invalid    — 지금 내용과 같은 버전이라 적혀 있지만 보기 ID나 정답 여부가 지금 문항과 맞지 않는 기록뿐: 계산에서 뺌
     *  missing    — 지금 앱에 없는 문항(또는 다른 과목처럼 lookup이 모르는 문항) */
    function wrongNotes(lookup, opts) {
      var groups = dict(), order = [], onlySubject = opts && typeof opts.subject === 'string' ? opts.subject : null, anyInvalid = false;
      loadAttempts().forEach(function (a) {
        if (onlySubject && a.subject !== onlySubject) return;
        var k = noteKey(a.subject, a.mode, a.questionId); if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(a);
      });
      var out = [];
      order.forEach(function (k) {
        var list = groups[k], wrongs = list.filter(function (a) { return !a.correct; });
        if (!wrongs.length) return;
        var first = list[0], cur = typeof lookup === 'function' ? lookup(first.mode, first.questionId, first.subject) : null;
        if (!cur || typeof cur !== 'object' || cur.v == null) cur = null;
        var kinds = list.map(function (a) { return cur ? judge(a, cur) : 'old'; });
        var valid = list.filter(function (a, i) { return kinds[i] === 'current'; }), validWrong = valid.filter(function (a) { return !a.correct; });
        var invalidCount = kinds.filter(function (x) { return x === 'invalid'; }).length, oldWrong = list.filter(function (a, i) { return kinds[i] === 'old' && !a.correct; });
        if (invalidCount) anyInvalid = true;
        var status;
        if (!cur) status = 'missing';
        else if (validWrong.length) { var last = validWrong[validWrong.length - 1], idx = valid.indexOf(last); status = valid.slice(idx + 1).some(function (a) { return a.correct; }) ? 'resolved' : 'unresolved'; }
        else status = oldWrong.length ? 'stale' : 'invalid';
        out.push(deepFreeze({
          mode: first.mode, questionId: first.questionId, subject: first.subject, status: status, currentVersion: cur ? String(cur.v) : null,
          wrongCount: wrongs.length, activeWrongCount: validWrong.length, invalidCount: invalidCount, attemptCount: list.length,
          firstWrongAt: wrongs[0].ts, lastWrongAt: wrongs[wrongs.length - 1].ts, lastAttemptAt: list[list.length - 1].ts,
          lastWrongOptionId: validWrong.length ? validWrong[validWrong.length - 1].optionId : null,
          attempts: list.slice()
        }));
      });
      if (anyInvalid) notice('invalid-option', '지금 문제와 맞지 않는 채점 기록(없는 보기·어긋난 정답 표시)은 지우지 않고 오답 계산에서만 뺐어요.');
      out.sort(function (a, b) { return b.lastWrongAt - a.lastWrongAt; });
      return out;
    }

    /* 진행 기록(풀던 상태): 저장 형식 {schema, kind:'progress', view, updatedAt, data} */
    function loadProgress(view) {
      if (!VIEW_NAME.test(view)) return null;
      var p = parse(PROG + view);
      if (p.missing) return null;
      if (p.bad || !isObj(p.value)) { notice('corrupt-progress', '풀던 상태 기록 일부가 깨져 있어 그 부분만 처음부터 시작해요(기록은 지우지 않았어요).'); readOnlyViews[view] = 'corrupt'; return null; }
      var o = p.value;
      if (typeof o.schema === 'number' && o.schema > SCHEMA) { readOnlyViews[view] = 'future'; notice('future-progress', '이 앱보다 새 버전에서 남긴 풀던 상태가 있어 덮어쓰지 않고 이 탭에서만 새로 기록해요.'); return null; }
      if (o.schema !== SCHEMA || o.kind !== 'progress' || o.view !== view || !isObj(o.data)) { readOnlyViews[view] = 'corrupt'; notice('corrupt-progress', '풀던 상태 기록 일부가 깨져 있어 그 부분만 처음부터 시작해요(기록은 지우지 않았어요).'); return null; }
      return clone(o.data);
    }
    /* fn(지금 저장된 data 또는 null) → 새 data. 쓰기 직전에 다시 읽어 다른 탭이 쓴 내용과 합칠 수 있게 한다.
     * 더 새 형식·깨진 진행 기록은 덮어쓰지 않고 이 탭의 메모리에만 둔다. */
    function updateProgress(view, fn) {
      if (!VIEW_NAME.test(view) || typeof fn !== 'function') return { ok: false };
      var prev = loadProgress(view), next = fn(prev);
      if (!isObj(next)) return { ok: false };
      var rec = JSON.stringify({ schema: SCHEMA, kind: 'progress', view: view, updatedAt: now(), data: next });
      if (readOnlyViews[view]) { memKeys[PROG + view] = 1; mem.setItem(PROG + view, rec); return { ok: true, persisted: false, readOnly: readOnlyViews[view] }; }
      return { ok: true, persisted: rawSet(PROG + view, rec) };
    }
    /* 문항별 상태 합치기: 같은 키면 at(밀리초)이 더 큰 쪽 */
    function mergeEntries(a, b) {
      var out = dict();
      [isObj(a) ? a : {}, isObj(b) ? b : {}].forEach(function (src) { Object.keys(src).forEach(function (k) { if (!safeKey(k)) return; var x = src[k]; if (!isObj(x)) return; if (!out[k] || (Number(x.at) || 0) >= (Number(out[k].at) || 0)) out[k] = x; }); });
      var plain = {}; Object.keys(out).forEach(function (k) { plain[k] = out[k]; });
      return plain;
    }

    /* 다시 풀기 줄: 시작할 때 과목·종류·문항 ID·내용 버전을 고정해 둔다. 풀면서 오답이 해결돼도 줄은 줄지 않는다. 같은 문항은 한 번만. */
    function snapshotQueue(items, order) {
      var seen = dict(), list = [];
      (items || []).forEach(function (it) {
        if (!it || !it.currentVersion || MODES.indexOf(it.mode) < 0 || typeof it.questionId !== 'string') return;
        var k = noteKey(it.subject, it.mode, it.questionId); if (seen[k]) return; seen[k] = 1;
        list.push({ subject: it.subject || 'history', mode: it.mode, questionId: it.questionId, contentVersion: it.currentVersion });
      });
      if (order === 'random') for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(random() * (i + 1)), t = list[i]; list[i] = list[j]; list[j] = t; }
      return deepFreeze(list);
    }

    /* 진행 기록 화면 이름 목록(예: prefix 'run-' → 모의고사 회차들). 'hanq:' 키만 본다 */
    function progressViews(prefix) {
      return rawKeys().filter(function (k) { return k.indexOf(PROG) === 0; }).map(function (k) { return k.slice(PROG.length); })
        .filter(function (v) { return VIEW_NAME.test(v) && (!prefix || v.indexOf(prefix) === 0); }).sort();
    }

    function status() {
      loadAttempts();
      return { backend: ls ? 'localStorage' : 'memory', blocked: blocked, persistent: !!ls && !writeFailed, writeFailed: writeFailed,
        corruptKeys: Object.keys(corrupt).sort(), futureKeys: Object.keys(future).sort(), readOnlyViews: clone(readOnlyViews), notices: notices.slice() };
    }
    function onChange(fn) { if (typeof fn === 'function') listeners.push(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; }
    /* 다른 탭의 저장(storage 이벤트) — 'hanq:' 키만 */
    function handleStorageEvent(e) {
      if (!e || (e.key !== null && String(e.key).indexOf(PREFIX) !== 0)) return false;
      invalidate(); emit({ type: 'remote', remote: true, key: e.key }); return true;
    }
    if (opts.listen && root.addEventListener) root.addEventListener('storage', handleStorageEvent);

    return { recordAttempt: recordAttempt, attempts: attempts, wrongNotes: wrongNotes, loadProgress: loadProgress, updateProgress: updateProgress,
      mergeEntries: mergeEntries, snapshotQueue: snapshotQueue, progressViews: progressViews, status: status, onChange: onChange, handleStorageEvent: handleStorageEvent, invalidate: invalidate };
  }

  var api = { SCHEMA: SCHEMA, KEYS: { prefix: PREFIX, attempt: ATT, progress: PROG }, SOURCES: SOURCES.slice(), create: create, validateAttempt: validateAttempt, kst: kst, memoryStorage: memoryStorage,
    noteKey: noteKey, safeKey: safeKey };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined' && root === window) { api.store = create({ listen: true }); root.HanqProgress = api; }
})(typeof window !== 'undefined' ? window : globalThis);
