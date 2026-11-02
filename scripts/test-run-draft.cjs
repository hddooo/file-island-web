#!/usr/bin/env node
/* 시간제 오답 복습: 고른 답은 임시(draft) → 이동·제출 때만 저장 — jsdom + 가짜 API(네트워크·실제 계정 없음). 창은 finally에서 닫는다.
 *   JSDOM_PATH=/path/to/node_modules/jsdom node scripts/test-run-draft.cjs */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const ROOT = path.resolve(__dirname, '..');
const { JSDOM } = require(process.env.JSDOM_PATH || 'jsdom');
let checks = 0, failures = 0;
const windows = [];
async function t(name, fn) { checks++; try { await fn(); } catch (e) { failures++; console.log('  ✗ ' + name + '\n    ' + String(e && e.message).split('\n').slice(0, 4).join('\n    ')); } }
const settle = async () => { for (let i = 0; i < 15; i++) await new Promise(r => setTimeout(r, 0)); };
const RID = '88888888-8888-4888-8888-888888888888';
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';
const KEY = owner => 'hanqacct:rundraft:' + owner + ':' + RID;
function gated() { let release, fail; const p = new Promise((a, b) => { release = a; fail = b; }); return { p, release: v => release(v), fail: e => fail(e) }; }

function mkData(o = {}) {
  const now = Date.now();
  return { run: { id: RID, title: '오답 복습', status: 'active', durationMs: 1800000, durationPolicy: 'practice', selection: { mode: 'wrong-note-study' }, serverTime: new Date(now).toISOString(), startedAt: new Date(now - 5000).toISOString(), endsAt: new Date(now + (o.endsIn == null ? 600000 : o.endsIn)).toISOString() },
    items: [0, 1, 2].map(i => ({ position: i, questionId: 'q' + i, version: '1', kind: 'quiz', optionOrder: ['o1', 'o2', 'o3'], item: { id: 'q' + i, q: '문제 ' + i, options: [{ id: 'o1', text: '가' }, { id: 'o2', text: '나' }, { id: 'o3', text: '다' }] }, answerOptionId: (o.saved || {})[i] || null, result: null })) };
}
function fakeApi(data, o = {}) {
  const st = { enabled: true, status: 'online', signedIn: true, ownerId: A, epoch: 1, user: { id: A, email: 'a@example.test', displayName: 'A', createdAt: '2026-10-01T00:00:00Z' }, premium: { active: true, expiresAt: '2099-01-01T00:00:00Z' }, profileStatus: 'ready', growth: { points: 1000 }, access: { total: 1, today: true } };
  const ls = [], calls = { answer: [], submit: 0, run: 0 };
  const api = {
    calls, st, data,
    enabled: () => true, state: () => JSON.parse(JSON.stringify(st)), init: () => Promise.resolve(st), hasSessionHint: () => true,
    onChange: f => { ls.push(f); return () => {}; },
    run: () => { calls.run++; if (o.onRun) o.onRun(data); return Promise.resolve(JSON.parse(JSON.stringify(data))); },
    answerRun: (id, pos, opt) => { calls.answer.push([pos, opt]); const apply = () => { data.items[pos].answerOptionId = opt; return JSON.parse(JSON.stringify(data)); }; return o.answer ? o.answer(pos, opt, apply) : Promise.resolve(apply()); },
    submitRun: () => { calls.submit++; return o.submit ? o.submit() : Promise.resolve(Object.assign(JSON.parse(JSON.stringify(data)), { run: Object.assign({}, data.run, { status: 'final', finalAt: new Date().toISOString(), finalReason: 'submit', score: { correct: 0, wrong: 3, unanswered: 1, rewardEligible: false } }) })); },
    me: () => Promise.resolve({ user: st.user, premium: st.premium, growth: st.growth, access: st.access }), plan: () => Promise.resolve({}), attempts: () => Promise.resolve({ items: [], next: null }),
    emit: () => ls.slice().forEach(f => f(api.state())),
    switchTo: id => { st.ownerId = id; st.user = Object.assign({}, st.user, { id }); st.epoch++; api.emit(); },
    relogin: () => { st.epoch++; api.emit(); },
  };
  return api;
}
async function mount(api, o = {}) {
  const d = new JSDOM('<!doctype html><body><main><section id="acRoot"></section></main></body>', { runScripts: 'outside-only', url: 'https://hanq.example/#account/study/' + RID, pretendToBeVisual: true });
  windows.push(d);
  const w = d.window; w.HanqApi = api;
  if (o.seed) for (const [k, v] of Object.entries(o.seed)) w.sessionStorage.setItem(k, v);
  if (o.quota) { const S = w.Storage.prototype, orig = S.setItem; S.setItem = function (k, v) { if (String(k).startsWith('hanqacct:rundraft:')) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } return orig.call(this, k, v); }; }
  w.setInterval = () => 0; w.clearInterval = () => {};
  for (const f of ['quiz-review.js', 'characters.js', 'account-ui.js']) w.eval(fs.readFileSync(path.join(ROOT, 'media', f), 'utf8'));
  const root = w.document.getElementById('acRoot'), ctx = { view: 'study/' + RID, go: v => { w.__went = v; }, local: { attempts: () => [] }, summaryTargets: () => [] };
  await w.HanqAccountUI.render(root, ctx); await settle();
  const q = s => root.querySelector(s);
  return { w, root, ctx, q,
    pick: async opt => { q('.ac-choice[data-option="' + opt + '"]').click(); await settle(); },
    checked: () => { const b = q('.ac-choice[aria-checked="true"]'); return b && b.getAttribute('data-option'); },
    pos: () => q('.ac-pos').textContent.split(' / ')[0],
    stored: owner => w.sessionStorage.getItem(KEY(owner || A)) };
}

(async () => {
  try {
    console.log('\n■ 오답 복습: 임시 답 → 이동·제출 때 저장');
    await t('빠르게 고르고 바꾸고 지워도 요청·잠금 없음 · 저장 전 표시 · 정답 노출 없음', async () => {
      const api = fakeApi(mkData()), m = await mount(api);
      await m.pick('o1'); await m.pick('o2'); await m.pick('o3');
      assert.equal(m.checked(), 'o3');
      assert.equal(m.q('#acDraftMark').textContent, '고른 답 · 아직 저장 전');
      assert.equal(m.q('#acNext').disabled, false);
      m.q('#acClear').click(); await settle();
      assert.equal(m.checked(), null);
      await m.pick('o2');
      assert.equal(api.calls.answer.length, 0, '요청 없음');
      assert.equal(m.root.querySelectorAll('.is-correct,.qreview,.is-wrong').length, 0, '채점 전 정답·풀이 없음');
      assert.match(m.q('.rc-count').textContent, /답한 문제 0 \/ 3 · 저장 전 1/);
      assert.ok(JSON.parse(m.stored()).items['0'].o === 'o2', '이 계정·회차의 임시 답');
    });
    await t('다음: 마지막으로 고른 답 하나만 저장하고, 확인(ACK) 뒤에만 이동 · 두 번 눌러도 요청 하나', async () => {
      const g = gated(), api = fakeApi(mkData(), { answer: (p, o, apply) => g.p.then(apply) }), m = await mount(api);
      await m.pick('o1'); await m.pick('o3');
      m.q('#acNext').click(); m.q('#acNext').click(); await settle();
      assert.equal(api.calls.answer.length, 1);
      assert.deepEqual(api.calls.answer[0], [0, 'o3']);
      assert.equal(m.pos(), '1', '확인 전엔 그대로');
      assert.equal(m.q('#acNext').disabled, true, '저장하는 동안만 잠금');
      g.release(); await settle();
      assert.equal(m.pos(), '2');
      assert.equal(m.stored(), null, '저장 확인된 임시 답은 지움');
      assert.match(m.q('.rc-count').textContent, /답한 문제 1 \/ 3$/);
      m.q('#acPrev').click(); await settle();
      assert.equal(m.pos(), '1'); assert.equal(m.q('#acDraftMark').textContent, '저장된 답');
      assert.equal(api.calls.answer.length, 1, '바뀐 답 없는 이동은 요청 없음');
    });
    await t('이전·바로 가기도 먼저 저장 · 실패하면 그 자리·고른 답 유지, 다시 누르면 같은 답으로 저장', async () => {
      let n = 0; const api = fakeApi(mkData(), { answer: (p, o, apply) => (++n === 1 ? Promise.reject(Object.assign(new Error('x'), { code: 'network' })) : Promise.resolve(apply())) }), m = await mount(api);
      m.q('#acNext').click(); await settle(); assert.equal(m.pos(), '2');
      await m.pick('o2');
      const j = m.q('#acJump'); j.value = '2'; j.dispatchEvent(new m.w.Event('change')); await settle();
      assert.equal(m.pos(), '2', '실패: 이동하지 않음');
      assert.equal(m.checked(), 'o2', '고른 답 유지');
      assert.equal(m.q('#acJump').value, '1', '바로 가기 선택은 지금 문제로');
      assert.match(m.q('#acRunMsg').textContent, /다시 누르면 같은 답으로 저장/);
      m.q('#acPrev').click(); await settle();
      assert.deepEqual(api.calls.answer, [[1, 'o2'], [1, 'o2']]);
      assert.equal(m.pos(), '1');
    });
    await t('저장 중에 (강제로) 다른 답을 고르면 그 답은 임시로 남고, 앞 요청의 확인이 덮어쓰지 않는다', async () => {
      const g = gated(), api = fakeApi(mkData(), { answer: (p, o, apply) => g.p.then(apply) }), m = await mount(api);
      await m.pick('o1'); m.q('#acNext').click(); await settle();
      const b = m.q('.ac-choice[data-option="o3"]'); b.disabled = false; b.click(); await settle(); // forged while frozen
      g.release(); await settle();
      assert.equal(m.pos(), '2');
      assert.equal(JSON.parse(m.stored()).items['0'].o, 'o3', '새 임시 답이 남음');
      assert.equal(api.calls.answer.length, 1);
    });
    await t('마지막 제출: 저장 실패면 제출 확인·최종 제출 없음 → 성공 뒤 확인(미응답 수) → 바뀐 답은 한 번 더 저장 → 두 번 눌러도 제출 하나', async () => {
      let n = 0; const sub = gated(), data = mkData();
      const api = fakeApi(data, { answer: (p, o, apply) => (++n === 1 ? Promise.reject(Object.assign(new Error('x'), { code: 'timeout' })) : Promise.resolve(apply())), submit: () => sub.p }), m = await mount(api);
      m.q('#acNext').click(); await settle(); m.q('#acNext').click(); await settle();
      await m.pick('o1');
      m.q('#acSubmit').click(); await settle();
      assert.equal(m.q('#acCfYes'), null, '저장 실패: 확인 창 없음');
      assert.equal(api.calls.submit, 0);
      m.q('#acSubmit').click(); await settle();
      assert.match(m.q('#acCfD').textContent, /답하지 않은 문제 2개/);
      await m.pick('o2'); // 확인 창이 열린 뒤 바꿈
      const yes = m.q('#acCfYes'); yes.click(); yes.dispatchEvent(new m.w.Event('click')); await settle();
      assert.deepEqual(api.calls.answer.slice(-1)[0], [2, 'o2'], '제출 전에 바뀐 답 저장');
      assert.equal(api.calls.submit, 1);
      sub.release(Object.assign(JSON.parse(JSON.stringify(data)), { run: Object.assign({}, data.run, { status: 'final', finalAt: new Date().toISOString(), finalReason: 'submit', score: { correct: 0, wrong: 3, unanswered: 2, rewardEligible: false } }) }));
      await settle();
      assert.ok(m.q('.ac-run[data-status="final"]'));
      assert.equal(m.stored(), null);
    });
    await t('서버 마감이 지났으면 임시 답을 보내지 않고 서버 회차를 다시 읽어 최종 결과만', async () => {
      const data = mkData({ endsIn: -1000 }), seed = { [KEY(A)]: JSON.stringify({ schema: 1, owner: A, run: RID, items: { 0: { q: 'q0', v: '1', o: 'o2' } } }) };
      const api = fakeApi(data, { onRun: dd => { if (api.calls.run > 1) Object.assign(dd.run, { status: 'final', finalAt: new Date().toISOString(), finalReason: 'expired', score: { correct: 0, wrong: 3, unanswered: 3, rewardEligible: false } }); } });
      const m = await mount(api, { seed });
      m.q('#acNext').click(); await settle();
      assert.equal(api.calls.answer.length, 0, '마감 뒤 저장 요청 없음');
      assert.ok(m.q('.ac-run[data-status="final"]'));
      assert.equal(m.stored(), null, '최종 회차에 임시 답을 다시 쓰지 않음');
    });
    await t('저장이 run_expired로 거절되면 저장했다고 하지 않고 서버 최종 상태를 읽는다', async () => {
      const data = mkData();
      const api = fakeApi(data, { answer: () => Promise.reject(Object.assign(new Error('x'), { code: 'run_expired' })), onRun: dd => { if (api.calls.run > 1) Object.assign(dd.run, { status: 'final', finalAt: new Date().toISOString(), finalReason: 'expired', score: { correct: 0, wrong: 3, unanswered: 3, rewardEligible: false } }); } });
      const m = await mount(api); await m.pick('o1'); m.q('#acNext').click(); await settle();
      assert.ok(m.q('.ac-run[data-status="final"]'));
      assert.match(m.root.textContent, /자동 채점/);
    });
    await t('늦은 확인: 다른 계정·같은 계정 다시 로그인·화면 떠남이면 그 화면·커서를 건드리지 않는다', async () => {
      for (const change of ['owner', 'relogin', 'leave']) {
        const g = gated(), api = fakeApi(mkData(), { answer: (p, o, apply) => g.p.then(apply) }), m = await mount(api);
        await m.pick('o1'); m.q('#acNext').click(); await settle();
        if (change === 'owner') api.switchTo(B); else if (change === 'relogin') api.relogin(); else await m.w.HanqAccountUI.render(m.root, { view: 'main', go: () => {}, local: { attempts: () => [] } });
        await settle(); const before = m.root.innerHTML;
        g.release(); await settle();
        if (change === 'relogin') { assert.equal(m.pos(), '1', 'relogin: 이동 안 함'); assert.ok(m.stored(), 'relogin: 내 임시 답 유지'); }
        else assert.equal(m.root.innerHTML, before, change + ': 화면 그대로');
        assert.equal(m.w.sessionStorage.getItem(KEY(B)), null, 'B에게 A의 임시 답 없음');
      }
    });
    await t('새로 고침: 내 임시 답만 그 회차·버전에서 되살림 · 다른 계정·다른 버전·깨진 값은 쓰지 않음 · 서버 저장 답과 구분', async () => {
      const seed = { [KEY(A)]: JSON.stringify({ schema: 1, owner: A, run: RID, items: { 0: { q: 'q0', v: '1', o: 'o2' }, 1: { q: 'q1', v: 'OLD', o: 'o1' }, 2: { q: 'q2', v: '1', o: 'evil' } } }), 'hanq:other': 'keep' };
      const m = await mount(fakeApi(mkData({ saved: { 0: 'o1' } })), { seed });
      assert.equal(m.checked(), 'o2', '임시 답 표시');
      assert.equal(m.q('#acDraftMark').textContent, '고른 답 · 아직 저장 전');
      assert.match(m.q('.rc-count').textContent, /답한 문제 1 \/ 3 · 저장 전 1/, '서버 저장 1 + 임시 1');
      assert.deepEqual(Object.keys(JSON.parse(m.stored()).items), ['0'], '다른 버전·없는 보기는 버림');
      assert.equal(m.w.sessionStorage.getItem('hanq:other'), 'keep');
      const b = fakeApi(mkData({ saved: { 0: 'o1' } })); b.st.ownerId = B; b.st.user.id = B;
      const mb = await mount(b, { seed });
      assert.equal(mb.checked(), 'o1', 'B는 A 임시 답 없이 서버 답만');
      assert.equal(mb.q('#acDraftMark').textContent, '저장된 답');
      const mbad = await mount(fakeApi(mkData()), { seed: { [KEY(A)]: '{not json' } });
      assert.equal(mbad.checked(), null);
    });
    await t('저장 공간을 못 쓰면 이 탭에서만 기억한다고 알리고, 이동 때 그 답을 저장', async () => {
      const api = fakeApi(mkData()), m = await mount(api, { quota: true });
      await m.pick('o3');
      assert.match(m.q('#acRunMsg').textContent, /이 탭에서만 기억해요/);
      assert.equal(m.checked(), 'o3');
      m.q('#acNext').click(); await settle();
      assert.deepEqual(api.calls.answer, [[0, 'o3']]);
    });
    await t('다른 버전 ACK는 임시 답을 지우거나 다음으로 이동하지 않는다 · 떠났다가 같은 회차를 다시 연 화면은 늦은 ACK가 이동시키지 않는다', async () => {
      const bad=fakeApi(mkData(),{answer:(p,o,apply)=>{const d=apply();d.items[p].version='OLD';return Promise.resolve(d);}}),m=await mount(bad);
      await m.pick('o2');m.q('#acNext').click();await settle();assert.equal(m.pos(),'1');assert.ok(m.stored());assert.match(m.q('#acRunMsg').textContent,/저장하지 못/);
      const g=gated(),api=fakeApi(mkData(),{answer:(p,o,apply)=>g.p.then(apply)}),r=await mount(api);
      await r.pick('o1');r.q('#acNext').click();await settle();
      await r.w.HanqAccountUI.render(r.root,{view:'main',go:()=>{},local:{attempts:()=>[]}});await settle();
      await r.w.HanqAccountUI.render(r.root,r.ctx);await settle();const before=r.root.innerHTML;
      g.release();await settle();assert.equal(r.pos(),'1','새로 연 화면의 위치 유지');assert.equal(r.root.innerHTML,before,'이전 화면 ACK로 새 화면을 다시 그리지 않음');
    });
    await t('준비 화면 안내: 이동·제출 때 저장', async () => {
      const data = mkData(); data.run.status = 'ready'; delete data.run.startedAt;
      const m = await mount(fakeApi(data));
      assert.match(m.root.textContent, /답은 다음이나 다른 문제로 이동할 때 저장돼요\. 마지막 답은 제출할 때 저장돼요\./);
      assert.doesNotMatch(m.root.textContent, /고를 때마다 서버에 저장/);
    });
  } finally {
    windows.forEach(d => { try { d.window.HanqAccountUI && d.window.HanqAccountUI.stop(); } catch (e) {} try { d.window.close(); } catch (e) {} });
  }
  console.log('\n검사 ' + checks + '개 · 실패 ' + failures + '개');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); windows.forEach(d => { try { d.window.close(); } catch (x) {} }); process.exit(1); });
