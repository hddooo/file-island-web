#!/usr/bin/env node
/* 계정 기록 자동 동기화(media/account-sync.js) 검사 — 가짜 서버·메모리 저장소만(실제 서버·네트워크·.env 없음).
 *   node scripts/test-account-sync.cjs
 * 서버 흉내: scope 'account'의 submissionId = 'imp-' + sha256('hanq-import-account|<user>|<localId>')[0..40] (api import.service와 같은 식) */
'use strict';
const path = require('path'), assert = require('assert/strict'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const Api = require(path.join(ROOT, 'media', 'api-client.js'));
const LP = require(path.join(ROOT, 'media', 'learning-progress.js'));
const Sync = require(path.join(ROOT, 'media', 'account-sync.js'));
let checks = 0, failures = 0;
async function t(name, fn) { checks++; try { await fn(); } catch (e) { failures++; console.log('  ✗ ' + name + '\n    ' + (e && e.stack || e).toString().split('\n').slice(0, 3).join('\n    ')); } }
// SubtleCrypto 해시는 스레드 풀에서 끝나므로 마이크로태스크만이 아니라 실제 타이머 차례도 기다린다(부하가 있어도 흔들리지 않게)
const settle = async () => { for (let r = 0; r < 4; r++) { for (let i = 0; i < 20; i++) await new Promise(q => setImmediate(q)); await new Promise(q => setTimeout(q, 10)); } };
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';
const canon = (user, localId) => 'imp-' + crypto.createHash('sha256').update('hanq-import-account|' + user + '|' + localId).digest('hex').slice(0, 40);

function memStorage(o = {}) {
  const m = new Map();
  return { m, get length() { return m.size; }, key: i => [...m.keys()][i] ?? null, getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { if (o.failWrite && o.failWrite(k)) throw new Error('QuotaExceededError'); m.set(k, String(v)); }, removeItem: k => m.delete(k) };
}
let clock = Date.parse('2026-10-09T00:00:00Z');
function world() {
  const storage = memStorage();
  const store = LP.create({ storage, now: () => ++clock, random: Math.random });
  const server = { rows: new Map(), skip: {}, failImport: null, failList: null, gate: null, reply: null };
  const calls = [];
  const st = { signedIn: false, restoring: false, user: null, ownerId: null, epoch: 0 };
  const ls = [];
  const emit = () => ls.slice().forEach(f => f(api.state()));
  const api = {
    enabled: () => true, importEntries: Api.importEntries,
    state: () => JSON.parse(JSON.stringify(st)),
    onChange: f => { ls.push(f); return () => {}; },
    attempts: (cursor, limit) => {
      calls.push(['list', cursor, limit, st.ownerId]);
      if (server.failList) return Promise.reject(Object.assign(new Error('x'), { code: server.failList }));
      const mine = [...server.rows.values()].filter(r => r.user === st.ownerId).reverse();
      const start = cursor ? Number(cursor) : 0, page = mine.slice(start, start + limit);
      return Promise.resolve({ items: page.map(r => ({ submissionId: r.id, questionId: r.questionId, optionId: r.optionId, version: r.version || 'v1', kind: r.kind || 'quiz', source: r.source || 'import' })), next: start + limit < mine.length ? String(start + limit) : null });
    },
    importAttempts: (key, entries) => {
      const user = st.ownerId;
      calls.push(['import', key, entries.map(e => e.localId), user, entries]);
      const run = () => {
        if (server.failImport) { const c = server.failImport; if (typeof c === 'string') return Promise.reject(Object.assign(new Error(c), { code: c })); }
        if (server.reply) return Promise.resolve(server.reply(entries));
        let imported = 0, already = 0; const skipped = [];
        entries.forEach(e => {
          if (server.skip[e.localId]) { skipped.push({ localId: e.localId, reason: server.skip[e.localId] }); return; }
          const id = canon(user, e.localId);
          if (server.rows.has(id)) { already++; return; }
          server.rows.set(id, { id, user, questionId: e.questionId, optionId: e.optionId, version: e.contentVersion, kind: e.mode, source: 'import' }); imported++;
        });
        return Promise.resolve({ received: entries.length, imported, alreadyImported: already, skipped, skippedCount: skipped.length, grantsPremium: false });
      };
      return server.gate ? server.gate.then(run) : run();
    },
    login: (id) => { st.signedIn = true; st.user = { id }; st.ownerId = id; st.epoch++; emit(); },
    logout: () => { st.signedIn = false; st.user = null; st.ownerId = null; st.epoch++; emit(); },
    ping: () => emit(), // 같은 로그인 안의 다른 상태 변화(토큰 갱신 등)
  };
  const sync = Sync.create({ api, store, storage, locks: null, crypto: globalThis.crypto });
  const events = []; sync.onChange(s => events.push(s));
  let n = 0;
  const rec = (owner, extra = {}) => {
    const r = store.recordAttempt(Object.assign({ mode: 'quiz', source: 'quiz', questionId: 'q-' + (++n), contentVersion: 'v1', optionId: 'o1', correct: true, submissionId: 's-' + n }, owner ? { ownerId: owner } : {}, extra));
    assert.ok(r.ok, 'record ok'); return r.attempt;
  };
  const ck = owner => JSON.parse(storage.getItem('hanqacct:sync:' + owner) || '{"acked":{},"skipped":{}}');
  const gate = () => { let open; server.gate = new Promise(r => { open = r; }); return () => { server.gate = null; open(); }; };
  return { storage, store, server, calls, api, sync, events, rec, ck, gate };
}

(async () => {
  console.log('\n■ account-sync.js');
  await t('로그인하면(마이페이지 밖에서도) 이 계정 표시 기록만 보낸다: 예전·게스트·다른 계정·시간제 회차·순위·답 없는 기록은 제외, 원본 보존', async () => {
    const w = world();
    const mine = [w.rec(A), w.rec(A, { mode: 'mock', questionId: 'exam-70-01', optionId: 'exam-70-01-option-2', choice: 2 })];
    w.rec(null); w.rec(B); // 예전·게스트(계정 표시 없음) · 다른 계정
    w.rec(A, { source: 'run', runId: 'r1', rankEligible: true }); // 시간제 회차·순위
    w.rec(A, { source: 'run', runId: 'r2', optionId: null, unanswered: true, correct: false, mode: 'mock', questionId: 'exam-70-02' });
    const before = [...w.storage.m.entries()].filter(([k]) => k.startsWith('hanq:att:'));
    w.sync.watch(); w.api.login(A); await settle();
    const imports = w.calls.filter(c => c[0] === 'import');
    assert.equal(imports.length, 1);
    assert.deepEqual(imports[0][2].sort(), mine.map(a => a.id).sort());
    assert.ok(imports[0][4].every(e => !('correct' in e) && !('ownerId' in e)), '정답 표시·점수·계정 ID를 보내지 않음');
    assert.equal(w.calls[0][0], 'list', '보내기 전에 서버의 내 최근 기록을 먼저 확인');
    assert.equal(w.sync.state().phase, 'done');
    assert.equal(w.sync.state().imported, 2);
    assert.deepEqual(Object.keys(w.ck(A).acked).sort(), mine.map(a => a.id).sort());
    assert.deepEqual([...w.storage.m.entries()].filter(([k]) => k.startsWith('hanq:att:')), before, '이 기기의 원본 기록은 그대로');
    assert.equal(w.sync.unownedCount(), 1);
  });
  await t('같은 로그인의 다른 상태 변화로는 다시 보내지 않고, 같은 계정이라도 로그아웃→로그인이면 서버 확인을 다시 한다(보낼 것 없음)', async () => {
    const w = world(); w.rec(A); w.sync.watch(); w.api.login(A); await settle();
    const n0 = w.calls.length;
    w.api.ping(); w.api.ping(); await settle();
    assert.equal(w.calls.length, n0, '토큰 갱신 등으로는 다시 시작하지 않음');
    w.api.logout(); w.api.login(A); await settle();
    const after = w.calls.slice(n0);
    assert.deepEqual(after.map(c => c[0]), ['list'], '다시 로그인: 서버 확인만, 이미 확인된 기록은 다시 보내지 않음');
    assert.equal(w.sync.state().phase, 'done');
  });
  await t('보낼 기록이 없어도 서버 확인이 성공해야 완료 · 확인 실패면 완료라고 하지 않음', async () => {
    const w = world(); w.sync.watch(); w.server.failList = 'network'; w.api.login(A); await settle();
    assert.equal(w.sync.state().phase, 'error');
    assert.equal(w.calls.filter(c => c[0] === 'import').length, 0);
    w.server.failList = null; await w.sync.sync();
    assert.deepEqual(w.calls.map(c => c[0]), ['list', 'list']);
    assert.equal(w.sync.state().phase, 'done');
  });
  await t('서버 확인은 정확한 submissionId로만: 같은 ID가 있으면 보내지 않고 확인, 문제·답만 같은 다른 기록은 그대로 보낸다', async () => {
    const w = world(); const a1 = w.rec(A), a2 = w.rec(A, { questionId: 'q-same', optionId: 'o2' }), a3 = w.rec(A, { questionId: 'q-same', optionId: 'o2' });
    w.server.rows.set(canon(A, a1.id), { id: canon(A, a1.id), user: A, questionId: a1.questionId, optionId: 'o1' }); // 확인 표시를 잃었지만 서버엔 있음
    w.server.rows.set('imp-legacy-other', { id: 'imp-legacy-other', user: A, questionId: 'q-same', optionId: 'o2' }); // 문제·답만 같은 다른 기록
    w.sync.watch(); w.api.login(A); await settle();
    const sent = w.calls.filter(c => c[0] === 'import').flatMap(c => c[2]);
    assert.deepEqual(sent.sort(), [a2.id, a3.id].sort(), '같은 문제를 같은 답으로 다시 푼 정상 기록도 각각 보냄');
    assert.equal(w.ck(A).acked[a1.id], 1, '서버에 정확히 있는 기록은 보내지 않고 확인');
    assert.equal(w.sync.state().alreadyImported, 1);
  });
  await t('서버 ID만 같고 답안 내용이 다르면 확인하지 않고 서버의 충돌 검증에 맡긴다', async () => {
    const w = world(), a = w.rec(A);
    w.server.rows.set(canon(A, a.id), { id: canon(A, a.id), user: A, questionId: a.questionId, optionId: 'different-option' });
    w.server.reply = () => ({ received: 1, imported: 0, alreadyImported: 0, skippedCount: 1, skipped: [{ localId: a.id, reason: 'conflicts-with-earlier-import' }] });
    w.sync.watch(); w.api.login(A); await settle();
    assert.equal(w.calls.filter(c => c[0] === 'import').length, 1);
    assert.equal(w.ck(A).acked[a.id], undefined);
    assert.equal(w.ck(A).skipped[a.id], 'conflicts-with-earlier-import');
    assert.equal(w.store.attempts().length, 1);
  });
  await t('응답 검사(엄격): 음수·초과 개수, 같은 건너뜀 ID 반복, 묶음에 없는 ID면 확인 표시를 하나도 쓰지 않는다', async () => {
    const bads = [
      e => ({ received: e.length, imported: -1, alreadyImported: e.length + 1, skipped: [], skippedCount: 0 }),
      e => ({ received: e.length, imported: e.length + 1, alreadyImported: -1, skipped: [], skippedCount: 0 }),
      e => ({ received: e.length, imported: e.length - 2, alreadyImported: 0, skipped: [{ localId: e[0].localId, reason: 'unknown-option' }, { localId: e[0].localId, reason: 'unknown-option' }], skippedCount: 2 }),
      e => ({ received: e.length, imported: e.length - 1, alreadyImported: 0, skipped: [{ localId: 'a0000000zz', reason: 'unknown-option' }], skippedCount: 1 }),
      e => ({ received: e.length, imported: 1.5, alreadyImported: e.length - 1.5, skipped: [], skippedCount: 0 }),
      () => null,
    ];
    for (const bad of bads) {
      const w = world(); w.rec(A); w.rec(A); w.rec(A); w.server.reply = bad; w.sync.watch(); w.api.login(A); await settle();
      assert.equal(w.sync.state().phase, 'error'); assert.equal(w.sync.state().error, 'invalid_response');
      assert.equal(w.storage.getItem('hanqacct:sync:' + A), null, '확인 표시 없음');
    }
  });
  await t('건너뛴 기록은 사유와 함께 보관·보고하고 다시 보내지 않는다(상한 건너뜀도 무한 재시도 없음)', async () => {
    const w = world(); const a1 = w.rec(A), a2 = w.rec(A), a3 = w.rec(A);
    w.server.skip[a2.id] = 'unknown-question-or-version'; w.server.skip[a3.id] = 'import-cap-reached';
    w.sync.watch(); w.api.login(A); await settle();
    assert.deepEqual(w.ck(A).skipped, { [a2.id]: 'unknown-question-or-version', [a3.id]: 'import-cap-reached' });
    assert.equal(w.ck(A).acked[a1.id], 1);
    assert.equal(w.sync.state().skippedTotal, 2);
    assert.ok(w.store.attempts({ ownerId: A }).some(a => a.id === a2.id), '건너뛴 기록은 이 기기에 그대로');
    const n0 = w.calls.filter(c => c[0] === 'import').length;
    await w.sync.sync();
    assert.equal(w.calls.filter(c => c[0] === 'import').length, n0, '다시 보내지 않음');
  });
  await t('여러 묶음(500건씩) · 중간 실패: 앞 묶음만 확인, 실패한 묶음은 같은 키로 다시 보내고 성공이라 말하지 않음', async () => {
    const w = world(); for (let i = 0; i < 1100; i++) w.rec(A);
    let k = 0; const real = w.api.importAttempts;
    w.api.importAttempts = (key, e) => (++k === 2 ? Promise.reject(Object.assign(new Error('x'), { code: 'timeout' })) : real(key, e));
    w.sync.watch(); w.api.login(A); await settle();
    assert.equal(w.sync.state().phase, 'error'); assert.equal(w.sync.state().error, 'timeout');
    assert.equal(Object.keys(w.ck(A).acked).length, 500);
    assert.equal(w.sync.state().pending, 600);
    const keys = new Set(w.calls.filter(c => c[0] === 'import').map(c => c[1]));
    await w.sync.sync();
    const imports = w.calls.filter(c => c[0] === 'import');
    assert.deepEqual(imports.map(c => c[2].length), [500, 500, 100], "1차 500건 확인 · 실패한 2차부터 다시");
    assert.deepEqual(new Set(imports.map(c => c[1])), keys, '계정 키는 하나로 유지');
    assert.equal(Object.keys(w.ck(A).acked).length, 1100);
    assert.equal(w.server.rows.size, 1100, '서버 행 중복 없음');
    assert.equal(w.sync.state().phase, 'done');
  });
  await t('저장 공간을 못 쓰면 보내지 않는다(fail closed) · 원본 기록은 그대로', async () => {
    const w = world(); w.rec(A);
    w.storage.setItem = (k) => { throw new Error('SecurityError ' + k); };
    w.sync.watch(); w.api.login(A); await settle();
    assert.equal(w.sync.state().phase, 'blocked');
    assert.equal(w.calls.length, 0);
  });
  await t('A→B→A(그리고 같은 계정 로그아웃→로그인): 이전 A 흐름은 확인 표시·상태를 건드리지 못하고 새 A 동기화를 막지 않는다', async () => {
    const w = world(); const a1 = w.rec(A), a2 = w.rec(A); w.rec(B);
    w.sync.watch();
    const openOld = w.gate(); w.api.login(A); await settle(); // 이전 A의 보내기가 서버에서 멈춤
    let replyForOld = null;
    w.api.login(B); await settle();
    const openB = w.gate(); openOld(); await settle(); // 이전 A 응답은 B 동안 도착
    replyForOld = w.calls.filter(c => c[0] === 'import' && c[3] === A).length;
    assert.equal(replyForOld, 1);
    assert.equal(w.storage.getItem('hanqacct:sync:' + A), null, 'B로 바뀐 뒤 도착한 A 응답은 확인 표시를 쓰지 않음');
    openB(); await settle();
    w.api.login(A); await settle(); // 같은 A, 새 로그인(epoch)
    assert.equal(w.sync.state().ownerId, A);
    assert.equal(w.sync.state().phase, 'done', '새 A 동기화가 이전 흐름에 막히지 않음');
    assert.deepEqual(Object.keys(w.ck(A).acked).sort(), [a1.id, a2.id].sort());
    assert.ok(!w.ck(B).acked[a1.id]);
    // 다른 세대의 늦은 응답: 이번엔 아직 열려 있는 이전 흐름이 모두 ‘건너뜀’이라고 답해도 새 확인 표시를 덮지 않는다
    const w2 = world(); const b1 = w2.rec(A); w2.sync.watch();
    const open1 = w2.gate(); w2.api.login(A); await settle();
    w2.api.logout(); w2.api.login(A); await settle(); // 새 A 흐름도 같은 문 앞에서 대기
    w2.server.reply = e => ({ received: e.length, imported: 0, alreadyImported: 0, skipped: e.map(x => ({ localId: x.localId, reason: 'unknown-option' })), skippedCount: e.length });
    const ev0 = w2.events.length;
    open1(); await settle();
    assert.equal(w2.ck(A).skipped[b1.id], 'unknown-option', '새 흐름의 결과만 기록');
    const statuses = w2.events.slice(ev0).filter(s => s.phase === 'done');
    assert.equal(statuses.length, 1, '완료는 새 흐름에서 한 번만 알림');
  });
  await t('A 동기화 중 B로 바뀌면 A는 멈추고, B 화면 상태에는 A 숫자가 보이지 않는다', async () => {
    const w = world(); w.rec(A); w.rec(B); w.sync.watch();
    const open = w.gate(); w.api.login(A); await settle();
    w.api.login(B); await settle();
    open(); await settle();
    assert.equal(w.sync.state().ownerId, B);
    assert.equal(w.sync.state().imported, 1, 'B의 기록 1건만');
    assert.equal(w.server.rows.size, 2);
  });
  await t('같은 계정·같은 로그인 안에서는 한 번에 하나(탭 안 Promise 공유)', async () => {
    const w = world(); w.rec(A); w.sync.watch();
    const open = w.gate(); w.api.login(A); await settle();
    const p1 = w.sync.sync(), p2 = w.sync.sync();
    assert.equal(p1, p2);
    open(); await p1; await settle();
    assert.equal(w.calls.filter(c => c[0] === 'import').length, 1);
  });
  console.log('\n■ api-client.js 로그인 수명(epoch)');
  const res = (status, body) => ({ ok: status >= 200 && status < 300, status, text: () => Promise.resolve(JSON.stringify(body)) });
  const user = { id: A, email: 'a@x.test', displayName: 'A', createdAt: '2026-10-08T00:00:00Z' };
  const mem = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
  await t('같은 계정이라도 로그아웃→다시 로그인 전에 보낸 요청의 응답은 넘기지 않는다(session_changed)', async () => {
    let tok = 0, hold = null;
    const fetch = (url, init) => {
      if (/signin$/.test(url)) return Promise.resolve(res(200, { accessToken: 't' + (++tok), accessTokenExpiresAt: '2099-01-01T00:00:00Z', user }));
      if (/logout$/.test(url)) return Promise.resolve(res(200, {}));
      if (/\/me$/.test(url)) return Promise.resolve(res(200, { user, premium: { active: false }, growth: { points: 1 }, access: { total: 0 } }));
      if (/attempts/.test(url)) return new Promise(r => { hold = () => r(res(200, { items: [], next: null })); });
      return Promise.resolve(res(404, {}));
    };
    const c = Api.create({ base: 'https://api.test', fetch, storage: mem(), locks: null });
    await c.signin('a', 'b'); const e0 = c.state().epoch;
    const old = c.attempts(null, 10); await settle();
    await c.logout(); await c.signin('a', 'b');
    assert.notEqual(c.state().epoch, e0);
    hold();
    await assert.rejects(old, e => e.code === 'session_changed');
  });
  await t('이전 로그인 요청의 늦은 401은 새 로그인의 쿠키를 갱신하거나 요청을 재전송하지 않는다', async () => {
    let held, attemptCalls = 0, refreshCalls = 0;
    const fetch = (url) => {
      if (/signin$/.test(url)) return Promise.resolve(res(200, { accessToken: 't', accessTokenExpiresAt: '2099-01-01T00:00:00Z', user }));
      if (/logout$/.test(url)) return Promise.resolve(res(200, {}));
      if (/\/me$/.test(url)) return Promise.resolve(res(200, { user, premium: { active: false }, growth: { points: 1 }, access: { total: 0 } }));
      if (/refresh$/.test(url)) { refreshCalls++; return Promise.resolve(res(200, { accessToken: 'new', user })); }
      if (/attempts/.test(url)) { attemptCalls++; return new Promise(r => { held = () => r(res(401, { error: { code: 'invalid_token' } })); }); }
      return Promise.resolve(res(404, {}));
    };
    const c = Api.create({ base: 'https://api.test', fetch, storage: mem(), locks: null });
    await c.signin('a', 'b'); const old = c.attempts(null, 10); await settle();
    await c.logout(); await c.signin('a', 'b'); held();
    await assert.rejects(old, e => e.code === 'session_changed');
    assert.equal(refreshCalls, 0); assert.equal(attemptCalls, 1);
  });
  await t('현재 로그인 요청의 401은 만료 처리하며 쿠키 갱신·재전송 없이 재로그인을 기다린다', async () => {
    let rejected=false,attemptCalls=0,refreshCalls=0;
    const fetch = (url) => {
      if (/signin$/.test(url)) return Promise.resolve(res(200, { accessToken: 't1', accessTokenExpiresAt: '2099-01-01T00:00:00Z', user }));
      if (/refresh$/.test(url)) { refreshCalls++; return Promise.resolve(res(200, { accessToken: 't2', accessTokenExpiresAt: '2099-01-01T00:00:00Z', user })); }
      if (/\/me$/.test(url)) return Promise.resolve(res(200, { user, premium: { active: false }, growth: { points: 1 }, access: { total: 0 } }));
      if (/attempts/.test(url)) { attemptCalls++;return Promise.resolve(rejected?res(401,{error:{code:'invalid_token'}}):res(200,{items:[],next:null})); }
      return Promise.resolve(res(404, {}));
    };
    const c = Api.create({ base: 'https://api.test', fetch, storage: mem(), locks: null });
    await c.signin('a', 'b'); const e0 = c.state().epoch;rejected=true;
    await assert.rejects(c.attempts(null,10),e=>e.code==='invalid_token');
    assert.equal(c.state().signedIn,false);assert.equal(c.state().ownerId,null);assert.equal(c.state().authReason,'expired');assert.notEqual(c.state().epoch,e0);
    assert.equal(attemptCalls,1);assert.equal(refreshCalls,0);
  });
  await t('자동 동기화 요청은 scope account로 보낸다(서버 ID = 계정 + localId, 키와 무관)', async () => {
    let body = null;
    const fetch = (url, init) => {
      if (/signin$/.test(url)) return Promise.resolve(res(200, { accessToken: 't1', accessTokenExpiresAt: '2099-01-01T00:00:00Z', user }));
      if (/\/me$/.test(url)) return Promise.resolve(res(200, { user, premium: { active: false }, growth: { points: 1 }, access: { total: 0 } }));
      if (/local-attempts$/.test(url)) { body = JSON.parse(init.body); return Promise.resolve(res(201, { received: 0, imported: 0, alreadyImported: 0, skipped: [], skippedCount: 0 })); }
      return Promise.resolve(res(404, {}));
    };
    const c = Api.create({ base: 'https://api.test', fetch, storage: mem(), locks: null });
    await c.signin('a', 'b');
    await c.importAttempts('k'.repeat(43), []);
    assert.equal(body.scope, 'account');
    await assert.rejects(c.importAttempts('short', []), e => e.code === 'no-import-key');
  });
  console.log('\n검사 ' + checks + '개 · 실패 ' + failures + '개');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
