/* Member quiz progress: authoritative saved attempts, owner-bound requests and retry identities.
 * No tokens or server progress in browser storage. Guest practice remains local and free.
 *  - Identity = account (ownerId) + login epoch (api.state().epoch): a late read/save from an earlier login of the SAME account
 *    is rejected too (session_changed), while a token refresh inside one login keeps the epoch.
 *  - A submitted-but-unconfirmed answer stays pending per ACCOUNT (immutable option + submissionId) until the server ACKs it,
 *    also across a logout/login of that account in this tab; retries resend exactly the same payload/id. A progress read never
 *    clears a pending answer (only a confirmed ACK does). */
(function (root) {
  'use strict';
  function create(api) {
    var owner = null, epoch = null, generation = 0, sequence = 0, saveRevision = 0;
    var confirmed = {}, pendingByOwner = {};
    var key = function (p) { return p.questionId + '|' + p.version; };
    function pendingMap() { if (!owner) return {}; return pendingByOwner[owner] || (pendingByOwner[owner] = {}); }
    function syncOwner() {
      var st = api ? api.state() : null, nextOwner = st && st.signedIn ? st.ownerId || null : null, nextEpoch = st ? (st.epoch == null ? null : st.epoch) : null;
      if (nextOwner !== owner || nextEpoch !== epoch) { owner = nextOwner; epoch = nextEpoch; generation++; sequence++; confirmed = {}; saveRevision = 0; }
      return owner;
    }
    syncOwner();
    if (api) api.onChange(syncOwner);
    function error(code) { var e = new Error(code); e.code = code; return e; }
    function same(id, gen) { syncOwner(); if (owner !== id || generation !== gen) throw error('session_changed'); }
    function ready() {
      if (!api || !api.enabled()) return Promise.resolve({ mode: 'guest', ownerId: null });
      return api.init().then(function () {
        syncOwner();
        if (api.state().signedIn && owner) return { mode: 'member', ownerId: owner };
        if (api.hasSessionHint() && api.state().status === 'offline') throw error('session_unavailable');
        return { mode: 'guest', ownerId: null };
      });
    }
    function load(pairs) {
      return ready().then(function (mode) {
        if (mode.mode === 'guest') return mode;
        var id = owner, gen = generation, ticket = ++sequence, readRevision = saveRevision;
        return api.quizProgress(pairs).then(function (d) {
          same(id, gen);
          if (ticket !== sequence) throw error('scope_changed');
          if (!d || !Array.isArray(d.items) || d.items.length !== pairs.length) throw error('invalid_progress');
          var items = d.items.map(function (p, i) {
            if (!p || typeof p !== 'object' || p.questionId !== pairs[i].questionId || p.version !== pairs[i].version || typeof p.answered !== 'boolean' ||
                (p.answered && (typeof p.optionId !== 'string' || typeof p.correct !== 'boolean'))) throw error('invalid_progress');
            var saved = confirmed[key(p)];
            return saved && saved.revision > readRevision ? saved.row : p;
          });
          return { mode: 'member', ownerId: id, items: items };
        });
      });
    }
    function submit(pair, optionId) {
      syncOwner();
      if (!owner || !api || !api.state().signedIn) return Promise.reject(error('unauthorized'));
      var id = owner, gen = generation, k = key(pair), map = pendingMap(), record = map[k];
      if (record && record.optionId !== optionId) return Promise.reject(error('pending_answer'));
      if (!record) record = map[k] = { optionId: optionId, submissionId: api.newSubmissionId('quiz'), resetAt: root.HanqLearningReset && root.HanqLearningReset.token(owner,'history'), promise: null };
      if (record.promise) return record.promise;
      record.promise = api.submitAttempt(pair.questionId, pair.version, optionId, record.submissionId, record.resetAt).then(function (d) {
        same(id, gen);
        var a = d && d.attempt;
        if (!a || a.questionId !== pair.questionId || a.version !== pair.version || a.optionId !== optionId || typeof a.correct !== 'boolean') throw error('invalid_attempt');
        var p = { questionId: a.questionId, version: a.version, answered: true, optionId: a.optionId, correct: a.correct, answeredAt: a.createdAt };
        confirmed[k] = { row: p, revision: ++saveRevision }; if (map[k] === record) delete map[k];
        return { progress: p, attempt: a, review: d.review, growth: d.growth };
      }).then(null, function (e) {
        record.promise = null; // uncertain save: keep the same immutable payload/id for this account and retry it later
        throw e;
      });
      return record.promise;
    }
    return {
      ready: ready, load: load, submit: submit, owner: syncOwner,
      /* 'owner|epoch' of the current login (null when signed out) — screens compare it to drop late results */
      identity: function () { syncOwner(); return owner ? owner + '|' + epoch : null; },
      capturePending: function (id) { var out = {}; Object.keys(pendingByOwner[id] || {}).forEach(function (k) { var r = pendingByOwner[id][k]; out[k] = {optionId: r.optionId, submissionId: r.submissionId}; }); return out; },
      restorePending: function (records) { syncOwner(); if (!owner || !records || typeof records !== 'object') return; var map = pendingMap(); Object.keys(records).slice(0, 1000).forEach(function (k) { var r = records[k]; if (/^[A-Za-z0-9_-]+\|[A-Za-z0-9_.-]+$/.test(k) && r && typeof r.optionId === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(r.optionId) && typeof r.submissionId === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(r.submissionId) && !map[k]) map[k] = {optionId: r.optionId, submissionId: r.submissionId, promise: null}; }); },
      pending: function (p) { syncOwner(); var r = pendingMap()[key(p)]; return r ? { optionId: r.optionId, submissionId: r.submissionId, busy: !!r.promise } : null; }
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { create: create };
  else root.HanqQuizProgress = create(root.HanqApi || null);
})(typeof window !== 'undefined' ? window : globalThis);
