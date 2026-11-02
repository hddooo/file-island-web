#!/usr/bin/env node
/* 마이페이지 캐릭터 열 번 누르기 → 기존 본인 전용·계정당 한 번 테스트용 무료 프리미엄(POST /premium/test-free-pass) 검사.
 * jsdom + 가짜 HanqApi(실제 서버·네트워크·계정 없음). 창·타이머는 실패해도 finally에서 닫고, 25초 안에 끝난다.
 *   JSDOM_PATH=/path/to/node_modules/jsdom node scripts/test-mypage-monster.cjs */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const ROOT = path.resolve(__dirname, '..');
const { JSDOM } = require(process.env.JSDOM_PATH || 'jsdom');
let checks = 0, failures = 0;
const windows = [];
async function t(name, fn) { checks++; try { await fn(); } catch (e) { failures++; console.log('  ✗ ' + name + '\n    ' + String(e && e.message).split('\n').slice(0, 4).join('\n    ')); } }
const settle = async () => { for (let i = 0; i < 15; i++) await new Promise(r => setTimeout(r, 0)); };
const SUCCESS = '프리미엄이 활성화되었습니다!';
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';
const FUTURE = '2099-01-01T00:00:00.000Z', PAST = '2000-01-01T00:00:00.000Z';
const userOf = id => ({ id, email: 'member@example.test', displayName: '회원', createdAt: '2026-10-08T00:00:00Z' });

function fakeApi(o = {}) {
  const server = { flag: o.flag !== false, prior: o.prior || null, failClaim: 0, failMe: 0, premium: { active: false, expiresAt: null }, meGate: null, meOverride: null };
  if (server.prior === 'active') server.premium = { active: true, expiresAt: FUTURE };
  const st = { enabled: true, status: 'online', epoch: 1, signedIn: true, restoring: false, ownerId: A, user: userOf(A), premium: { ...server.premium }, growth: { points: 1000 }, access: { total: 1, today: true }, profileStatus: 'ready' };
  const calls = [], ls = [];
  const emit = () => ls.slice().forEach(f => f(api.state()));
  const api = {
    calls, server, st,
    enabled: () => true, state: () => JSON.parse(JSON.stringify(st)), init: () => Promise.resolve(st),
    onChange: f => { ls.push(f); return () => { const i = ls.indexOf(f); if (i >= 0) ls.splice(i, 1); }; },
    plan: () => { calls.push('plan'); return Promise.resolve({ plan: {}, checkout: { available: false }, testFreePass: { available: server.flag } }); },
    testFreePass: () => {
      calls.push('claim');
      if (server.failClaim) { server.failClaim--; return Promise.reject(Object.assign(new Error('x'), { code: 'network' })); }
      let d;
      if (server.prior === 'expired') d = { active: false, expiresAt: PAST, alreadyClaimed: true };
      else if (server.prior === 'active') d = { active: true, expiresAt: FUTURE, alreadyClaimed: true };
      else { server.prior = 'active'; server.premium = { active: true, expiresAt: FUTURE }; d = { active: true, expiresAt: FUTURE, alreadyClaimed: false }; }
      // like the real api-client: the claim response is reflected in state BEFORE /me is re-read
      st.premium = { active: d.active, expiresAt: d.expiresAt }; emit();
      return Promise.resolve(d);
    },
    me: () => {
      calls.push('me');
      const owner = st.ownerId;
      const body = () => server.meOverride ? server.meOverride() : { user: userOf(owner), premium: { ...server.premium }, growth: { points: 1000 }, access: { total: 1, today: true } };
      const finish = () => {
        if (server.failMe) { server.failMe--; return Promise.reject(Object.assign(new Error('x'), { code: 'timeout' })); }
        const d = body();
        if (!st.signedIn || st.ownerId !== d.user.id) return Promise.reject(Object.assign(new Error('x'), { code: 'session_changed' }));
        st.premium = { ...d.premium }; emit(); return Promise.resolve(d);
      };
      return server.meGate ? server.meGate.then(finish) : finish();
    },
    switchTo: id => { st.epoch++; st.ownerId = id; st.user = id ? userOf(id) : null; st.signedIn = !!id; st.premium = { active: false, expiresAt: null }; emit(); },
    relogin: () => { st.epoch++; emit(); },
    updatePoints: points => { st.growth = { points }; emit(); },
    logout: () => { api.switchTo(null); return Promise.resolve({ serverRevoked: true }); },
    importEntries: () => [], attempts: () => Promise.resolve({ items: [], next: null }), growthHistory: () => Promise.resolve({ items: [], next: null }),
  };
  return api;
}
async function mount(api) {
  const d = new JSDOM('<!doctype html><body><header><nav class="header-menu"><button id="headerAccount"><span class="hm-pic"></span></button></nav></header><main><section id="acRoot"></section></main></body>', { runScripts: 'outside-only', url: 'https://hanq.example/#account', pretendToBeVisual: true });
  windows.push(d);
  const w = d.window; w.HanqApi = api;
  for (const f of ['characters.js', 'account-ui.js']) w.eval(fs.readFileSync(path.join(ROOT, 'media', f), 'utf8'));
  const root = w.document.getElementById('acRoot');
  await w.HanqAccountUI.render(root, { view: 'main', go: () => {}, local: { attempts: () => [] } }); await settle();
  const pet = () => root.querySelector('#acCharacter .ac-pet');
  const tap = async (n, wait = true) => { for (let i = 0; i < n; i++) pet().click(); if (wait) await settle(); };
  const say = () => { const el = root.querySelector('.ac-pet-say'); return el ? el.textContent : null; };
  const claims = () => api.calls.filter(c => c === 'claim').length;
  return { w, root, pet, tap, say, claims };
}

(async () => {
  try {
    console.log('\n■ 마이페이지 캐릭터 열 번 → 테스트용 무료 프리미엄');
    await t('진짜 캐릭터 단추(키보드로 누를 수 있는 native button)이고 숨은 안내 글이 없다 · 헤더 그림은 세지 않는다', async () => {
      const api = fakeApi(), m = await mount(api);
      const p = m.pet();
      assert.equal(p.tagName, 'BUTTON'); assert.equal(p.type, 'button'); assert.equal(p.disabled, false); assert.equal(p.tabIndex, 0);
      assert.ok(p.getAttribute('aria-label'), '캐릭터 이름이 접근 가능한 이름');
      assert.doesNotMatch(m.root.textContent, /열 번|10번|누르면 프리미엄|숨은/);
      for (let i = 0; i < 12; i++) m.w.document.getElementById('headerAccount').click();
      await settle();
      assert.equal(api.calls.filter(c => c === 'plan' || c === 'claim').length, 1, '헤더를 눌러도 요청 없음(첫 그리기의 plan 하나뿐)');
    });
    await t('같은 계정 서버 점수 변경은 열린 마이페이지와 진화에 반영하고 키보드 포커스·클릭 수를 보존한다', async () => {
      const api = fakeApi(), m = await mount(api);
      await m.tap(4); m.pet().focus(); api.updatePoints(1200); await settle();
      assert.equal(m.root.querySelector('.ac-progress-label').textContent, '0 / 300 XP');
      assert.equal(m.pet().getAttribute('aria-label'), '그레이몬');
      assert.equal(m.w.document.activeElement, m.pet());
      await m.tap(6); assert.equal(m.claims(), 1); assert.equal(m.say(), SUCCESS);
    });
    await t('아홉 번까지는 요청 없음 · 열 번째: plan 확인 → 요청 한 번 → /me 다시 확인 뒤에만 정확한 말풍선', async () => {
      const api = fakeApi(), m = await mount(api), base = api.calls.length;
      await m.tap(9);
      assert.equal(api.calls.length, base); assert.equal(m.say(), null);
      await m.tap(1);
      assert.deepEqual(api.calls.slice(base, base + 3), ['plan', 'claim', 'me'], '켜짐 확인 → 요청 → 내 정보 다시 확인');
      assert.equal(m.say(), SUCCESS);
      assert.equal(m.root.querySelector('.ac-pet-say').getAttribute('role'), 'status');
      assert.equal(m.claims(), 1);
    });
    await t('말풍선은 /me가 확인하기 전에는 나오지 않는다(요청 응답이 먼저 상태에 반영돼도)', async () => {
      const api = fakeApi(); let open;
      const m = await mount(api); api.server.meGate = new Promise(r => { open = r; });
      await m.tap(10);
      assert.equal(m.claims(), 1);
      assert.equal(m.say(), null, '요청 응답만으로는 성공이라 하지 않음');
      api.server.meGate = null; open(); await settle();
      assert.equal(m.say(), SUCCESS);
    });
    await t('빠르게 여러 번 눌러도 요청은 하나(진행 중에는 더 세지 않음)', async () => {
      const api = fakeApi(); let open;
      const m = await mount(api); api.server.meGate = new Promise(r => { open = r; });
      await m.tap(25);
      assert.equal(m.claims(), 1);
      api.server.meGate = null; open(); await settle();
      assert.equal(m.say(), SUCCESS);
      assert.equal(m.claims(), 1);
    });
    await t('기능이 꺼져 있으면(plan available false) 요청하지 않고 성공도 없다 · 켜지면 다음 누름에서 다시', async () => {
      const api = fakeApi({ flag: false }), m = await mount(api);
      await m.tap(10);
      assert.equal(m.claims(), 0); assert.equal(m.say(), null);
      await m.tap(1);
      assert.equal(m.claims(), 0);
      api.server.flag = true;
      await m.tap(1);
      assert.equal(m.claims(), 1); assert.equal(m.say(), SUCCESS);
    });
    await t('요청 실패·내 정보 확인 실패면 성공 없음 · 다음 한 번 누름으로 다시 시도(기록은 서버가 한 번만)', async () => {
      const api = fakeApi(), m = await mount(api);
      api.server.failClaim = 1;
      await m.tap(10);
      assert.equal(m.say(), null); assert.equal(m.claims(), 1);
      api.server.failMe = 1;
      await m.tap(1);
      assert.equal(m.say(), null, '내 정보 다시 확인 실패');
      await m.tap(1);
      assert.equal(m.say(), '이미 프리미엄이 활성화되어 있어요.', '두 번째 요청은 서버가 이미 준 체험을 그대로 알림(새로 켰다고 하지 않음)');
    });
    await t('예전에 쓰고 끝난 체험: 다시 켜거나 늘리지 않고 성공이라 하지 않는다', async () => {
      const api = fakeApi({ prior: 'expired' }), m = await mount(api);
      await m.tap(10);
      assert.equal(m.claims(), 1);
      assert.equal(m.say(), null);
      assert.equal(api.calls.filter(c => c === 'me').length, 1, '끝난 체험이면 성공 확인 단계로 가지 않음(첫 그리기 me 하나)');
    });
    await t('이미 켜진 체험: 사실대로만 말하고 정확한 새 활성화 문구는 쓰지 않는다', async () => {
      const api = fakeApi({ prior: 'active' }), m = await mount(api);
      await m.tap(10);
      assert.equal(m.say(), '이미 프리미엄이 활성화되어 있어요.');
      assert.notEqual(m.say(), SUCCESS);
    });
    await t('/me가 프리미엄 꺼짐·만료·다른 계정이면 성공 없음', async () => {
      for (const bad of [
        () => ({ user: userOf(A), premium: { active: false, expiresAt: null } }),
        () => ({ user: userOf(A), premium: { active: true, expiresAt: PAST } }),
        () => ({ user: userOf(A), premium: { active: true, expiresAt: 'not a date' } }),
      ]) {
        const api = fakeApi(), m = await mount(api);
        api.server.meOverride = bad;
        await m.tap(10);
        assert.equal(m.say(), null, JSON.stringify(bad()));
      }
    });
    await t('확인 중에 다른 계정으로 바뀌거나 같은 계정이 다시 로그인(epoch)하면 늦은 결과는 버리고 셈도 새로', async () => {
      for (const change of ['swap', 'relogin']) {
        const api = fakeApi(); let open;
        const m = await mount(api); api.server.meGate = new Promise(r => { open = r; });
        await m.tap(10);
        if (change === 'swap') api.switchTo(B); else api.relogin();
        api.server.meGate = null; open(); await settle();
        await m.w.HanqAccountUI.render(m.root, { view: 'main', go: () => {}, local: { attempts: () => [] } }); await settle();
        assert.equal(m.say(), null, change);
        const before = m.claims();
        await m.tap(9);
        assert.equal(m.claims(), before, change + ': 새 로그인은 처음부터 열 번');
      }
    });
    await t('셈은 같은 로그인에서 다시 그려도 이어지고, 로그아웃하면 사라진다 · 말풍선은 다시 그려도 유지되고 정리된다', async () => {
      const api = fakeApi(), m = await mount(api), ctx = { view: 'main', go: () => {}, local: { attempts: () => [] } };
      await m.tap(6);
      await m.w.HanqAccountUI.render(m.root, ctx); await settle();
      await m.tap(4);
      assert.equal(m.say(), SUCCESS, '다시 그린 뒤에도 6 + 4 = 10');
      await m.w.HanqAccountUI.render(m.root, ctx); await settle();
      assert.equal(m.say(), SUCCESS, '말풍선은 다시 그려도 유지');
      await m.w.HanqAccountUI.logout(); await settle();
      assert.equal(m.root.querySelector('.ac-pet-say'), null);
      assert.equal(m.w.HanqAccountUI._ui.petSay, null);
      assert.equal(m.w.HanqAccountUI._ui.pet, null, '로그아웃하면 셈도 사라짐');
    });
    await t('성장점수 기록: 퀴즈·기출·CBT 사유와 부호 있는 점수, 허용 밖 점수면 그 쪽 전체 거절', async () => {
      const page = { items: [
        { reason: 'practice-quiz', points: 1, createdAt: '2026-10-09T05:00:00.000Z' }, { reason: 'practice-quiz', points: -1, createdAt: '2026-10-09T04:00:00.000Z' },
        { reason: 'practice-mock', points: 5, createdAt: '2026-10-09T03:00:00.000Z' }, { reason: 'practice-mock', points: -5, createdAt: '2026-10-09T02:00:00.000Z' },
        { reason: 'cbt-exam', points: 150, createdAt: '2026-10-09T01:00:00.000Z' }], next: null };
      const api = fakeApi(); api.growthHistory = () => Promise.resolve(JSON.parse(JSON.stringify(page)));
      const m = await mount(api);
      m.root.querySelector('#acScore').click(); await settle();
      const rows = [...m.w.document.querySelectorAll('.ac-gd-item')].map(li => li.querySelector('.ac-gd-reason').textContent + ' ' + li.querySelector('.ac-gd-points').textContent);
      assert.deepEqual(rows, ['퀴즈 정답 +1점', '퀴즈 오답 -1점', '기출 정답 +5점', '기출 오답 -5점', 'CBT 실전 최종 점수 +150점']);
      m.w.HanqAccountUI.stop();
      const bad = fakeApi(); bad.growthHistory = () => Promise.resolve({ items: [{ reason: 'practice-quiz', points: 5, createdAt: '2026-10-09T05:00:00.000Z' }], next: null });
      const m2 = await mount(bad);
      m2.root.querySelector('#acScore').click(); await settle();
      assert.equal(m2.w.document.querySelectorAll('.ac-gd-item').length, 0, '퀴즈는 ±1만');
    });
  } finally {
    windows.forEach(d => { try { d.window.HanqAccountUI && d.window.HanqAccountUI.stop(); } catch (e) {} try { d.window.close(); } catch (e) {} });
  }
  console.log('\n검사 ' + checks + '개 · 실패 ' + failures + '개');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); windows.forEach(d => { try { d.window.close(); } catch (x) {} }); process.exit(1); });
