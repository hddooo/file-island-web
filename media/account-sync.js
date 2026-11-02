/* 계정 기록 자동 동기화 — window.HanqAccountSync
 *
 *  로그인·쿠키 복원으로 서버가 확인한 계정(ownerId)이 생기면, 마이페이지가 아니어도 이 기기에서 ‘그 계정으로’ 푼 기록을 서버에 보낸다.
 *  - 보내는 기록: learning-progress의 attempt 중 ownerId가 지금 계정과 정확히 같은 것만(앱의 hpRecord가 서버 확인 계정일 때만 붙임).
 *    ownerId가 없는 예전·게스트 기록, 다른 계정의 기록, 시간제 회차(source 'run')·순위 기록(rankEligible)은 절대 보내지 않는다.
 *    예전 기록에는 누가 풀었는지 남아 있지 않아 한 계정에 붙일 근거가 없기 때문이다(기록은 지우거나 고치지 않고 그대로 둔다).
 *  - 서버의 중복 기준은 계정 + localId(scope 'account': submissionId = 'imp-' + sha256('hanq-import-account|<userId>|<localId>')의 앞 40자).
 *    가져오기 키와 무관하므로, 두 탭이 저마다 키를 만들어도 같은 기록은 한 번만 저장된다.
 *  - 끝났다고 말하기 전에 서버를 확인한다: 내 최근 풀이 기록(GET /api/v1/attempts, 최대 5쪽)의 submissionId를 위 정확한 ID와 비교해
 *    이미 있는 기록은 보내지 않고 확인 표시만 한다(문제+답으로 비교하지 않음). 보낼 기록이 없어도 이 확인이 성공해야 ‘완료’.
 *    이 브라우저에 SubtleCrypto가 없으면 비교는 건너뛰고(확인 요청은 그대로) 서버의 멱등 처리에 맡긴다.
 *  - 서버(POST /api/v1/imports/local-attempts)가 문제·버전·보기를 다시 확인하고 직접 채점한다. 클라이언트의 정답 표시·점수는 보내지 않고,
 *    가져오기는 프리미엄·성장점수를 주지 않는다. 중복 판단은 기록 ID(localId → 서버의 결정적 submissionId)로만 한다 —
 *    같은 문제를 같은 답으로 다시 푼 것은 정상적인 별개 기록이라 문제+답으로 비교하지 않는다.
 *  - 가져오기 키: 계정마다 저장된 무작위 키 'hanqacct:ikey:<ownerId>'(이 브라우저 공용 예전 키 'hanqacct:importKey'와 별개).
 *    저장했다가 다시 읽어 같은 값일 때만 쓴다. 저장할 수 없으면 보내지 않는다(fail closed).
 *  - 확인 표시(checkpoint) 'hanqacct:sync:<ownerId>': 서버가 imported/alreadyImported로 응답에 넣어 확인한 기록만 acked,
 *    건너뛴 기록은 사유와 함께 skipped(다시 보내지 않고 이 기기에 보관 · 사유를 알려 줌). 실패한 묶음은 아무것도 표시하지 않고
 *    다음 동기화 때 같은 키·같은 ID로 다시 보낸다(서버가 alreadyImported로 멱등 처리). 자동 반복 재시도는 하지 않는다.
 *  - 한 계정에 한 번에 하나: 탭 안에서는 같은 Promise, 탭 사이에서는 navigator.locks가 있으면 잠금(없으면 서버 멱등성이 막아 줌).
 *    묶음(최대 500건)을 보내기 전·응답을 받은 뒤·확인 표시를 쓰기 전마다 지금도 ‘같은 로그인’(계정 + 세션 번호 epoch + 이 모듈의 세대)인지 본다 —
 *    A→B→A나 같은 계정의 로그아웃→로그인 뒤에는 이전 흐름이 확인 표시·상태를 건드리지 못하고, 새 흐름을 막지도 않는다.
 */
(function (root) {
  'use strict';
  var OWNER = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  var KEY_PREFIX = 'hanqacct:ikey:', CK_PREFIX = 'hanqacct:sync:', BATCH = 500, KEY_RE = /^[A-Za-z0-9_-]{43}$/;

  function b64url(bytes) { var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return root.btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function err(code) { var e = new Error(code); e.code = code; return e; }

  /* create({api, store, storage, locks, crypto}) — 시험에서 가짜 서버·저장소를 넣을 수 있게 */
  function create(o) {
    o = o || {};
    var api = o.api, store = o.store, storage = o.storage, locks = o.locks || null, cryptoObj = o.crypto || null;
    var flights = Object.create(null), listeners = [], seen = null, gen = 0;
    var status = { ownerId: null, gen: 0, phase: 'idle', imported: 0, alreadyImported: 0, skipped: 0, skippedTotal: 0, reasons: {}, pending: 0, error: null };

    function snapshot() { return JSON.parse(JSON.stringify(status)); }
    function emit() { var s = snapshot(); listeners.slice().forEach(function (f) { try { f(s); } catch (e) {} }); }
    function current() { var st = api && api.state(); return st && st.signedIn && !st.restoring && typeof st.ownerId === 'string' && OWNER.test(st.ownerId) && st.user && st.user.id === st.ownerId ? st.ownerId : null; }
    function lifeKey() { var st = api && api.state(), o = current(); return o ? o + '|' + (st.epoch == null ? '' : st.epoch) : ''; }
    /* 로그인 수명(계정 + epoch)이 바뀌면 세대를 올린다. 흐름은 시작할 때의 세대를 쥐고, 세대가 다르면 아무것도 쓰거나 알리지 않는다 */
    function observe() { var k = lifeKey(); if (k !== seen) { seen = k; gen++; } return gen; }
    function still(owner, g) { return observe() === g && current() === owner; }
    function setStatus(owner, g, patch) { if (!still(owner, g) || status.ownerId !== owner || status.gen !== g) return; Object.keys(patch).forEach(function (k) { status[k] = patch[k]; }); emit(); }
    function blank(owner, g) { return { ownerId: owner, gen: g, phase: 'idle', imported: 0, alreadyImported: 0, skipped: 0, skippedTotal: 0, reasons: {}, pending: 0, error: null }; }
    /* 서버가 저장할 정확한 ID(계정 + localId). SubtleCrypto가 없으면 null(비교 생략) */
    function canonicalIds(owner, entries) {
      var subtle = cryptoObj && cryptoObj.subtle, Enc = root.TextEncoder;
      if (!subtle || typeof subtle.digest !== 'function' || typeof Enc !== 'function') return Promise.resolve(null);
      return Promise.all(entries.map(function (e) {
        return subtle.digest('SHA-256', new Enc().encode('hanq-import-account|' + owner + '|' + e.localId)).then(function (buf) {
          var b = new Uint8Array(buf), h = ''; for (var i = 0; i < b.length; i++) h += (b[i] < 16 ? '0' : '') + b[i].toString(16);
          return 'imp-' + h.slice(0, 40);
        });
      })).then(null, function () { return null; });
    }
    /* 서버 확인: 내 최근 풀이 기록(최대 5쪽 × 100)의 submissionId. 모양이 이상하면 실패(확인 표시 없음) */
    function serverIds(owner, g) {
      var ids = Object.create(null), pages = 0, seenCursor = Object.create(null);
      var page = function (cursor) {
        return api.attempts(cursor, 100).then(function (d) {
          if (!still(owner, g)) throw err('session_changed');
          if (!d || !Array.isArray(d.items) || (d.next !== null && typeof d.next !== 'string')) throw err('invalid_response');
          d.items.forEach(function (a) { if (a && typeof a.submissionId === 'string') ids[a.submissionId] = a; });
          pages++;
          if (!d.next || pages >= 5) return ids;
          if (seenCursor[d.next]) throw err('invalid_response');
          seenCursor[d.next] = 1;
          return page(d.next);
        });
      };
      return page(null);
    }

    /* 계정별 가져오기 키: 저장 → 다시 읽어 같을 때만. 저장소·난수가 없으면 null(보내지 않음) */
    function keyFor(owner) {
      if (!storage) return null;
      try {
        var k = storage.getItem(KEY_PREFIX + owner);
        if (k && KEY_RE.test(k)) return k;
        if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') return null;
        var b = new Uint8Array(32); cryptoObj.getRandomValues(b); k = b64url(b);
        storage.setItem(KEY_PREFIX + owner, k);
        return storage.getItem(KEY_PREFIX + owner) === k ? k : null;
      } catch (e) { return null; }
    }
    /* 확인 표시 읽기: 없으면 빈 것, 깨졌으면 빈 것(다시 보내도 서버가 멱등으로 처리), 저장소를 못 읽으면 null(보내지 않음) */
    function readCk(owner) {
      if (!storage) return null;
      var raw;
      try { raw = storage.getItem(CK_PREFIX + owner); } catch (e) { return null; }
      var ck = { v: 1, acked: {}, skipped: {} };
      if (!raw) return ck;
      try {
        var d = JSON.parse(raw);
        if (d && d.v === 1 && d.acked && typeof d.acked === 'object' && d.skipped && typeof d.skipped === 'object') {
          Object.keys(d.acked).forEach(function (id) { if (/^a[0-9a-z]{6,40}$/.test(id) && d.acked[id] === 1) ck.acked[id] = 1; });
          Object.keys(d.skipped).forEach(function (id) { if (/^a[0-9a-z]{6,40}$/.test(id) && typeof d.skipped[id] === 'string') ck.skipped[id] = d.skipped[id].slice(0, 64); });
        }
      } catch (e) { /* 깨진 표시: 비운 채로 다시 확인 */ }
      return ck;
    }
    function writeCk(owner, ck) {
      try { var s = JSON.stringify(ck); storage.setItem(CK_PREFIX + owner, s); return storage.getItem(CK_PREFIX + owner) === s; } catch (e) { return false; }
    }
    function ownedEntries(owner) {
      var list = [];
      try { list = store && typeof store.attempts === 'function' ? store.attempts({ subject: 'history' }) : []; } catch (e) { list = []; }
      return api.importEntries(list.filter(function (a) { return a && a.ownerId === owner && a.source !== 'run' && a.rankEligible !== true && typeof a.optionId === 'string'; }));
    }
    function validReply(d, batch) {
      if (!d || typeof d !== 'object') return false;
      var n = batch.length, ids = Object.create(null);
      batch.forEach(function (e) { ids[e.localId] = 1; });
      var count = function (x) { return Number.isInteger(x) && x >= 0 && x <= n; };
      if (d.received !== n || !count(d.imported) || !count(d.alreadyImported) || !count(d.skippedCount) || !Array.isArray(d.skipped)) return false;
      if (d.imported + d.alreadyImported + d.skippedCount !== n || d.skipped.length !== d.skippedCount) return false;
      var once = Object.create(null);
      return d.skipped.every(function (s) {
        if (!s || ids[s.localId] !== 1 || once[s.localId] || typeof s.reason !== 'string' || !/^[a-z0-9-]{1,64}$/.test(s.reason)) return false;
        once[s.localId] = 1; return true;
      });
    }

    function run(owner, g) {
      if (!still(owner, g)) return Promise.resolve(null);
      var key = keyFor(owner), ck = readCk(owner);
      if (!key || !ck) { setStatus(owner, g, { phase: 'blocked', error: 'storage' }); return Promise.resolve(null); }
      var owned = ownedEntries(owner), todo = [], i = 0;
      var tally = { imported: 0, alreadyImported: 0, skipped: 0, reasons: {} };
      setStatus(owner, g, { phase: 'running', imported: 0, alreadyImported: 0, skipped: 0, reasons: {}, error: null, pending: 0, skippedTotal: Object.keys(ck.skipped).length });
      var next = function () {
        if (!still(owner, g)) return null; // 로그인 수명이 바뀜: 멈추고 아무것도 표시하지 않음
        if (i >= todo.length) { setStatus(owner, g, { phase: 'done', pending: 0 }); return tally; }
        var batch = todo.slice(i, i + BATCH);
        return api.importAttempts(key, batch).then(function (d) {
          if (!still(owner, g)) return null;
          if (!validReply(d, batch)) throw err('invalid_response');
          var skippedIds = Object.create(null);
          d.skipped.forEach(function (s) { skippedIds[s.localId] = s.reason; });
          var latest = readCk(owner); // 다른 탭이 그 사이에 쓴 표시와 합친다
          if (!latest) throw err('storage');
          batch.forEach(function (e) { if (skippedIds[e.localId]) latest.skipped[e.localId] = skippedIds[e.localId]; else latest.acked[e.localId] = 1; });
          if (!still(owner, g)) return null;
          if (!writeCk(owner, latest)) throw err('storage');
          i += batch.length;
          tally.imported += d.imported; tally.alreadyImported += d.alreadyImported; tally.skipped += d.skippedCount;
          d.skipped.forEach(function (s) { tally.reasons[s.reason] = (tally.reasons[s.reason] || 0) + 1; });
          setStatus(owner, g, { imported: tally.imported, alreadyImported: tally.alreadyImported, skipped: tally.skipped, reasons: tally.reasons, pending: todo.length - i, skippedTotal: Object.keys(latest.skipped).length });
          return next();
        });
      };
      var waiting = owned.filter(function (e) { return !ck.acked[e.localId] && !ck.skipped[e.localId]; });
      // 1) 서버 확인(보낼 것이 없어도) → 2) 서버에 정확히 같은 ID가 있는 기록은 보내지 않고 확인 표시 → 3) 나머지를 묶음으로
      return Promise.all([serverIds(owner, g), canonicalIds(owner, waiting)]).then(function (r) {
        if (!still(owner, g)) return null;
        var ids = r[0], expect = r[1], found = [];
        if (expect) waiting.forEach(function (e, k) {
          var a = ids[expect[k]];
          if (a && a.source === 'import' && a.kind === e.mode && a.questionId === e.questionId && a.version === e.contentVersion && a.optionId === e.optionId) found.push(e);
        });
        if (found.length) {
          var latest = readCk(owner);
          if (!latest) throw err('storage');
          found.forEach(function (e) { latest.acked[e.localId] = 1; });
          if (!still(owner, g)) return null;
          if (!writeCk(owner, latest)) throw err('storage');
          tally.alreadyImported += found.length;
        }
        todo = waiting.filter(function (e) { return found.indexOf(e) < 0; });
        setStatus(owner, g, { alreadyImported: tally.alreadyImported, pending: todo.length });
        return next();
      }).then(null, function (e) {
        if (still(owner, g) && !(e && e.code === 'session_changed')) setStatus(owner, g, { phase: 'error', error: e && typeof e.code === 'string' ? e.code : 'internal_error', pending: todo.length ? todo.length - i : waiting.length });
        return null;
      });
    }

    /* 한 계정에 한 번에 하나(탭 안 Promise 공유 · 탭 사이 Web Locks) */
    function sync() {
      var owner = current();
      if (!owner || !api || !api.enabled() || typeof api.importAttempts !== 'function') return Promise.resolve(null);
      var g = observe(), fk = owner + '|' + g;
      if (flights[fk]) return flights[fk];
      if (status.ownerId !== owner || status.gen !== g) status = blank(owner, g);
      setStatus(owner, g, { phase: 'running', error: null });
      var go = function () { return run(owner, g); };
      var p;
      try { p = locks && typeof locks.request === 'function' ? Promise.resolve(locks.request('hanq:account-sync:' + owner, go)) : go(); } catch (e) { p = go(); }
      var f = flights[fk] = p.then(function (v) { if (flights[fk] === f) delete flights[fk]; return v; }, function () { if (flights[fk] === f) delete flights[fk]; return null; });
      return f;
    }

    /* 로그인·쿠키 복원으로 계정이 새로 확인될 때만 자동으로(같은 계정의 다른 상태 변화로는 다시 보내지 않음). 로그아웃하면 상태를 비운다 */
    function watch() {
      if (!api || typeof api.onChange !== 'function') return;
      var last = null;
      var check = function () {
        var k = lifeKey(), g = observe();
        if (k === last) return;
        last = k;
        if (!k) { status = blank(null, g); emit(); return; }
        sync();
      };
      api.onChange(check);
      check();
    }

    return {
      sync: sync, watch: watch,
      state: function () { var g = observe(), s = snapshot(); return s.ownerId && s.ownerId === current() && s.gen === g ? s : blank(null, g); },
      onChange: function (f) { listeners.push(f); return function () { listeners = listeners.filter(function (x) { return x !== f; }); }; },
      /* 이 기기의 계정 표시 없는(예전·게스트) 기록 수 — 보내지 않고 보존한다는 안내용 */
      unownedCount: function () { try { return store.attempts({ subject: 'history' }).filter(function (a) { return !a.ownerId; }).length; } catch (e) { return 0; } }
    };
  }

  var out = { create: create };
  if (typeof module !== 'undefined' && module.exports) module.exports = out;
  if (typeof window !== 'undefined' && root === window) {
    var inst = root.HanqApi && root.HanqApi.enabled && root.HanqApi.enabled() && root.HanqProgress && root.HanqProgress.store
      ? create({ api: root.HanqApi, store: root.HanqProgress.store, storage: (function () { try { return root.localStorage; } catch (e) { return null; } })(), locks: root.navigator && root.navigator.locks || null, crypto: root.crypto || null })
      : null;
    root.HanqAccountSync = inst ? { create: create, sync: inst.sync, state: inst.state, onChange: inst.onChange, unownedCount: inst.unownedCount, start: inst.watch } : { create: create, sync: function () { return Promise.resolve(null); }, state: function () { return { ownerId: null, phase: 'off' }; }, onChange: function () { return function () {}; }, unownedCount: function () { return 0; }, start: function () {} };
  }
})(typeof window !== 'undefined' ? window : globalThis);
