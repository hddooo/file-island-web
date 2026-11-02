#!/usr/bin/env node
/* 마이페이지(최소 화면) · 성장점수 기록 창 · 헤더 로그아웃 검사 — jsdom + 가짜 HanqApi(실제 서버·네트워크 없음)
 *   JSDOM_PATH=/path/to/node_modules/jsdom node scripts/test-mypage.cjs
 * 창·타이머는 실패해도 finally에서 닫고, 실패하면 곧바로 끝낸다(멈춘 채 남지 않게). */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const ROOT = path.resolve(__dirname, '..');
const { JSDOM } = require(process.env.JSDOM_PATH || 'jsdom');
let checks = 0, failures = 0;
const windows = [];
async function t(name, fn) { checks++; try { await fn(); } catch (e) { failures++; console.log('  ✗ ' + name + '\n    ' + String(e && e.message).split('\n').slice(0, 4).join('\n    ')); } }
const settle = async () => { for (let i = 0; i < 12; i++) await new Promise(r => setTimeout(r, 0)); };
const USER = { id: '11111111-1111-4111-8111-111111111111', email: 'a@x.test', displayName: '한동', createdAt: '2026-10-08T00:00:00Z' };

function fakeApi(o = {}) {
  const ok = o.meFails !== true;
  const st = { enabled: true, status: 'online', epoch: 1, signedIn: true, restoring: false, ownerId: USER.id, user: USER, premium: { active: false, expiresAt: null },
    growth: ok ? { points: 1150 } : null, access: ok ? { total: 3, today: false } : null, profileStatus: ok ? 'ready' : 'error', profileError: ok ? null : 'internal_error' };
  const calls = []; const ls = [];
  const api = {
    calls, st,
    enabled: () => true, state: () => JSON.parse(JSON.stringify(st)), init: () => Promise.resolve(st), onChange: f => { ls.push(f); return () => { const i = ls.indexOf(f); if (i >= 0) ls.splice(i, 1); }; },
    plan: () => { calls.push('plan'); return Promise.resolve({ plan: {}, checkout: { available: false } }); },
    me: () => { calls.push('me'); return ok ? Promise.resolve({ user: USER, premium: st.premium, growth: st.growth, access: st.access }) : Promise.reject(Object.assign(new Error('x'), { code: 'internal_error', status: 500 })); },
    attempts: () => { calls.push('attempts'); return Promise.resolve({ items: [], next: null }); },
    runs: () => { calls.push('runs'); return Promise.resolve({ runs: [] }); },
    wrongNotes: () => { calls.push('wrongNotes'); return Promise.resolve({ counts: { unresolved: 0, resolved: 0 }, items: [] }); },
    replays: () => { calls.push('replays'); return Promise.resolve({ replays: [] }); },
    growthHistory: (cursor, limit) => { calls.push(['growth', cursor, limit]); return o.pages(cursor); },
    logout: () => { st.signedIn = false; st.user = null; st.ownerId = null; st.epoch++; ls.slice().forEach(f => f(api.state())); return Promise.resolve({ serverRevoked: o.revoke !== false }); },
    importEntries: () => [],
  };
  return api;
}
function dom(api) {
  const d = new JSDOM('<!doctype html><body><header><button id="outside">x</button></header><main><section id="acRoot"></section></main></body>', { runScripts: 'outside-only', url: 'https://hanq.example/#account', pretendToBeVisual: true });
  windows.push(d);
  const w = d.window;
  w.HanqApi = api;w.Date.now=()=>Date.parse('2026-10-08T12:00:00Z');
  for (const f of ['characters.js', 'account-ui.js']) w.eval(fs.readFileSync(path.join(ROOT, 'media', f), 'utf8'));
  return { w, root: w.document.getElementById('acRoot') };
}
const ctx = (view = 'main') => ({ view, go: () => {}, local: { attempts: () => [] } });
const row = (reason, points, createdAt) => ({ reason, points, createdAt });

(async () => {
  try {
    console.log('\n■ 마이페이지 · 성장점수 기록');
    await t('최소 화면: 캐릭터 · 닉네임 · 지금 점수(한 번) → 출석 → 닫힌 설정. 기록·이용권·오답노트·가져오기·로그아웃 없음, 기록 요청도 없음', async () => {
      const api = fakeApi({ pages: () => Promise.resolve({ items: [], next: null }) }), { w, root } = dom(api);
      await w.HanqAccountUI.render(root, ctx()); await settle();
      const text = root.textContent;
      assert.equal(text.split('계정 성장 기준 · 1,150 XP').length - 1, 1, '개체 계약이 없는 막대는 계정 기준으로 한 번만 표시');
      assert.ok(root.querySelector('#acCharacter .ac-pet'), '실제 진화 단계 캐릭터');
      assert.equal(root.querySelector('.ac-hero-tier'), null, '따로 된 회원 등급 줄 없음');
      assert.match(root.querySelector('#acNameNow').textContent, /한동/);
      const order = [...root.querySelectorAll('#acCharacter .ac-pet, .ac-attendance, details.ac-settings')].map(e => e.matches('.ac-pet')?'character':e.matches('.ac-attendance')?'attendance':'settings');
      assert.deepEqual(order, ['character', 'attendance', 'settings']);
      assert.equal(root.querySelector('details.ac-settings').open, false);assert.equal(root.querySelector('#acActivity'),null);assert.equal(root.querySelector('[href="#wrongnotes"]'),null);assert.equal(root.querySelector('[href="#battle/history"]'),null);assert.equal(root.querySelector('label[for=acPwNew]').textContent,'새 비밀번호');assert(root.textContent.includes('비밀번호를 변경하면 다른 기기의 로그인 세션이 종료됩니다.'));assert.equal(root.querySelector('.ac-me-body').firstElementChild.className,'ac-attendance ac-streak-card');
      for (const sel of ['.ac-records', '#acPremTitle', '#acToNotes', '#acImpGo', '#acLogout', '#acLogoutAll', '.ac-hist', '#acTestFreePass'])
        assert.equal(root.querySelector(sel), null, sel);
      assert.ok(!api.calls.some(c => ['attempts', 'runs', 'wrongNotes', 'replays'].includes(c)), '숨긴 기록 패널의 요청 없음');
      assert.equal(root.querySelector('.ac-load-err'), null);
    });
    await t('내 정보(/me) 실패: 점수·캐릭터를 지어내지 않고 다시 확인 단추만', async () => {
      const api = fakeApi({ meFails: true, pages: () => Promise.resolve({ items: [], next: null }) }), { w, root } = dom(api);
      await w.HanqAccountUI.render(root, ctx()); await settle();
      assert.equal(root.querySelector('#acCharacter .ac-pet'), null);
      assert.equal(root.querySelector('#acCharacter').children.length, 0, '아바타 없음');
      assert.ok(root.querySelector('#acProfileRetry'));
      assert.match(root.textContent, /미확인/);
    });
    await t('점수 창: 최신순 날짜 · 사유 · 부호 있는 점수, 더 보기로 다음 쪽, Esc로 닫으면 점수 단추로 포커스', async () => {
      const pages = { '': { items: [row('wrong-note-study', 150, '2026-10-08T05:00:00.000Z'), row('wrong-note-study', -100, '2026-10-08T04:00:00.000Z')], next: 'c2' },
        c2: { items: [row('signup', 1000, '2026-10-08T03:00:00.000Z')], next: null } };
      const api = fakeApi({ pages: c => Promise.resolve(JSON.parse(JSON.stringify(pages[c || '']))) }), { w, root } = dom(api);
      await w.HanqAccountUI.render(root, ctx()); await settle();
      const btn = root.querySelector('#acCharacter .ac-pet'); btn.focus(); btn.click(); await settle();
      const dlg = w.document.getElementById('acGrowthDialog');
      assert.ok(dlg && dlg.hasAttribute('open'));
      assert.equal(dlg.getAttribute('aria-labelledby'), 'acGrowthTitle');
      assert.equal(w.document.activeElement.id, 'acGrowthTitle');
      const items = () => [...dlg.querySelectorAll('.ac-gd-item')].map(li => li.querySelector('.ac-gd-reason').textContent + ' ' + li.querySelector('.ac-gd-points').textContent);
      assert.deepEqual(items(), ['오답노트 도전 결과 +150점', '오답노트 도전 결과 -100점']);
      assert.ok(dlg.querySelector('time[datetime="2026-10-08T05:00:00.000Z"]'));
      assert.ok(dlg.querySelector('.ac-gd-scroll[tabindex="0"]'), '키보드로 스크롤할 수 있는 목록');
      dlg.querySelector('#acGrowthMore').click(); await settle();
      assert.deepEqual(items(), ['오답노트 도전 결과 +150점', '오답노트 도전 결과 -100점', '회원가입 보너스 +1,000점']);
      assert.equal(dlg.querySelector('#acGrowthMore').hidden, true);
      dlg.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await settle();
      assert.equal(w.document.getElementById('acGrowthDialog'), null);
      assert.equal(w.document.activeElement, root.querySelector('#acCharacter .ac-pet'), '닫으면 연 단추로');
    });
    await t('잘못된 쪽은 한 줄도 붙이지 않는다(사유·정수 점수·날짜·반복 커서) · 앞 쪽은 그대로 · 다시 시도해도 중복 없음', async () => {
      let broken = true;
      const good1 = { items: [row('wrong-note-study', 50, '2026-10-08T06:00:00.000Z')], next: 'c2' };
      const page2 = () => broken
        ? { items: [row('wrong-note-study', 100, '2026-10-08T05:00:00.000Z'), row('mystery', 7, '2026-10-08T04:00:00.000Z')], next: null }
        : { items: [row('wrong-note-study', 100, '2026-10-08T05:00:00.000Z')], next: null };
      const api = fakeApi({ pages: c => Promise.resolve(c ? page2() : good1) }), { w, root } = dom(api);
      await w.HanqAccountUI.render(root, ctx()); await settle();
      root.querySelector('#acCharacter .ac-pet').click(); await settle();
      const dlg = w.document.getElementById('acGrowthDialog'), n = () => dlg.querySelectorAll('.ac-gd-item').length;
      assert.equal(n(), 1);
      dlg.querySelector('#acGrowthMore').click(); await settle();
      assert.equal(n(), 1, '이상한 줄이 섞인 쪽은 통째로 버림');
      assert.equal(dlg.querySelector('#acGrowthStatus').getAttribute('data-error'), '1');
      assert.doesNotMatch(dlg.textContent, /아직 성장점수 기록이 없어요/);
      broken = false;
      dlg.querySelector('#acGrowthMore').click(); await settle();
      assert.equal(n(), 2, '다시 시도: 같은 쪽을 한 번만');
      assert.equal(api.calls.filter(c => Array.isArray(c) && c[1] === 'c2').length, 2);
      w.HanqAccountUI.stop();
      for (const bad of [
        { items: [row('signup', 1.5, '2026-10-08T03:00:00.000Z')], next: null },
        { items: [row('signup', 1000, 'yesterday')], next: null },
        { items: [row('signup', 0, '2026-10-08T03:00:00.000Z')], next: null },
        { items: [row('signup', 1000, '2026-10-08T03:00:00.000Z')], next: 'bad cursor!' },
        { items: 'x', next: null },
      ]) {
        const a2 = fakeApi({ pages: () => Promise.resolve(bad) }), d2 = dom(a2);
        await d2.w.HanqAccountUI.render(d2.root, ctx()); await settle();
        d2.root.querySelector('#acCharacter .ac-pet').click(); await settle();
        const g = d2.w.document.getElementById('acGrowthDialog');
        assert.equal(g.querySelectorAll('.ac-gd-item').length, 0, JSON.stringify(bad));
        assert.equal(g.querySelector('#acGrowthStatus').getAttribute('data-error'), '1');
      }
      const rep = fakeApi({ pages: c => Promise.resolve({ items: [row('wrong-note-study', 50, '2026-10-08T06:00:00.000Z')], next: 'same' }) }), d3 = dom(rep);
      await d3.w.HanqAccountUI.render(d3.root, ctx()); await settle();
      d3.root.querySelector('#acCharacter .ac-pet').click(); await settle();
      const g3 = d3.w.document.getElementById('acGrowthDialog');
      g3.querySelector('#acGrowthMore').click(); await settle();
      assert.equal(g3.querySelectorAll('.ac-gd-item').length, 1, '같은 커서를 다시 주면 반복해 붙이지 않음');
      assert.equal(g3.querySelector('#acGrowthStatus').getAttribute('data-error'), '1');
    });
    await t('로그아웃(헤더 → HanqAccountUI.logout)하면 열린 점수 창을 닫고 늦은 쪽 응답을 버린다 · 실패 안내는 정직하게', async () => {
      let release; const api = fakeApi({ revoke: false, pages: () => new Promise(r => { release = () => r({ items: [row('signup', 1000, '2026-10-08T03:00:00.000Z')], next: null }); }) }), { w, root } = dom(api);
      await w.HanqAccountUI.render(root, ctx()); await settle();
      root.querySelector('#acCharacter .ac-pet').click(); await settle();
      await w.HanqAccountUI.logout(); await settle();
      assert.equal(w.document.getElementById('acGrowthDialog'), null);
      release(); await settle();
      assert.equal(w.document.querySelectorAll('.ac-gd-item').length, 0);
      await w.HanqAccountUI.render(root, ctx()); await settle();
      assert.match(root.textContent, /서버에 알리지 못했어요/);
      assert.doesNotMatch(root.textContent, /모든 기기에서 로그아웃/);
    });
    await t('동기화는 자동 유지, 실제 실패만 설정 밖에 표시하며 비밀번호 길이 검증 유지', async () => {
      const api=fakeApi({pages:()=>Promise.resolve({items:[],next:null})}),{w,root}=dom(api);let syncListener,refresh=0,retries=0,passwords=0;
      let state={ownerId:USER.id,phase:'idle',imported:0};w.HanqAccountSync={state:()=>state,onChange:f=>{syncListener=f;},sync:()=>{retries++;}};w.HanqMyRecords={mount:()=>{},refresh:()=>{refresh++;}};api.changePassword=()=>{passwords++;return Promise.resolve({revokedOtherSessions:0});};
      await w.HanqAccountUI.render(root,ctx());await settle();assert(root.querySelector('#acSync').hidden);assert(!root.textContent.includes('이 기기 기록 동기화'));assert(!root.querySelector('#acSync').closest('details'));
      state={ownerId:USER.id,phase:'error',error:'network',pending:2};syncListener();assert(!root.querySelector('#acSync').hidden);assert(!root.querySelector('#acSyncRetry').hidden);root.querySelector('#acSyncRetry').click();assert.equal(retries,1);
      state={ownerId:'other',phase:'error',error:'network'};syncListener();assert(root.querySelector('#acSync').hidden);
      state={ownerId:USER.id,phase:'done',imported:2};syncListener();assert(root.querySelector('#acSync').hidden);assert.equal(refresh,1);
      root.querySelector('#acPwCur').value='synthetic-current';root.querySelector('#acPwNew').value='short';root.querySelector('#acPwForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(passwords,0);assert(root.querySelector('#acPwMsg').textContent.includes('10'));
    });
    await t('앱 헤더: 로그아웃 UI는 제거하고 인증 처리 유지, 계정 화면 소스에 모든 기기 로그아웃 UI 없음 · 퀴즈는 로그인하면 서버 저장', async () => {
      const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), ui = fs.readFileSync(path.join(ROOT, 'media', 'account-ui.js'), 'utf8');
      assert.equal((html.match(/id=\\?"headerLogout\\?"/g) || []).length, 0);
      assert.match(html, /closest\('#headerLogout'\)/);
      assert.doesNotMatch(ui, /acLogoutAll|모든 기기에서 로그아웃<\/button>/);
      assert.match(html, /function quizServerActive\(\)\{var a=window\.HanqApi,st=a&&a\.state\(\);return !!\(a&&a\.enabled\(\)&&st&&st\.signedIn\);\}/, '일반 회원도 서버 저장(이용권 조건 없음)');
      assert.match(html, /<script src="media\/account-sync\.js"><\/script>/);
      assert.match(html, /HanqAccountSync\.start\(\)/);
    });
  } finally {
    windows.forEach(d => { try { d.window.HanqAccountUI && d.window.HanqAccountUI.stop(); } catch (e) {} try { d.window.close(); } catch (e) {} });
  }
  console.log('\n검사 ' + checks + '개 · 실패 ' + failures + '개');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); windows.forEach(d => { try { d.window.close(); } catch (x) {} }); process.exit(1); });
