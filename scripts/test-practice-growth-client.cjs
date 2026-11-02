#!/usr/bin/env node
/* 보통 퀴즈·기출 채점 응답의 성장점수 반영(api-client) — 가짜 fetch만(실제 서버·네트워크 없음). Node 전용, 타이머 없음.
 *   node scripts/test-practice-growth-client.cjs */
'use strict';
const path = require('path'), assert = require('assert/strict');
const Api = require(path.join(path.resolve(__dirname, '..'), 'media', 'api-client.js'));
let checks = 0, failures = 0;
async function t(name, fn) { checks++; try { await fn(); } catch (e) { failures++; console.log('  ✗ ' + name + '\n    ' + String(e && e.message).split('\n').slice(0, 3).join('\n    ')); } }
const U = { id: '11111111-1111-4111-8111-111111111111', email: 'member@example.test', displayName: '회원', createdAt: '2026-10-08T00:00:00Z' };
const res = (status, body) => ({ ok: status >= 200 && status < 300, status, text: () => Promise.resolve(JSON.stringify(body)) });
const mem = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };

function client(attemptReply) {
  let hold = null;
  const fetch = (url) => {
    if (/signin$/.test(url)) return Promise.resolve(res(200, { accessToken: 't', accessTokenExpiresAt: '2099-01-01T00:00:00Z', user: U }));
    if (/logout$/.test(url)) return Promise.resolve(res(200, {}));
    if (/\/me$/.test(url)) return Promise.resolve(res(200, { user: U, premium: { active: false }, growth: { points: 1000 }, access: { total: 1 } }));
    if (/\/attempts$/.test(url)) return new Promise(r => { hold = () => r(res(201, attemptReply)); });
    return Promise.resolve(res(404, {}));
  };
  const c = Api.create({ base: 'https://api.test', fetch, storage: mem(), locks: null });
  // fetch는 한 박자 뒤에 불리므로, 보류된 응답이 생길 때까지(최대 50번) 기다렸다가 놓아 준다
  const release = async () => { for (let i = 0; i < 50 && !hold; i++) await new Promise(r => setImmediate(r)); if (!hold) throw new Error('request never sent'); hold(); };
  return { c, release };
}
const reply = (points, delta) => ({ attempt: { id: 'x', questionId: 'q', version: '1', optionId: 'o', correct: delta > 0 }, replayed: false, review: {}, growth: { delta, points } });

(async () => {
  console.log('\n■ 보통 연습 성장점수(api-client)');
  await t('같은 계정·같은 로그인이면 서버가 준 지금 총점으로 바꾸고 알린다(클라이언트 계산 없음)', async () => {
    const { c, release } = client(reply(1005, 5)); await c.signin('a', 'b');
    const seen = []; c.onChange(s => seen.push(s.growth && s.growth.points));
    const p = c.submitAttempt('q', '1', 'o', 'sid-000000001'); await release(); await p;
    assert.equal(c.state().growth.points, 1005);
    assert.ok(seen.includes(1005));
  });
  await t('보내는 사이 로그아웃→다시 로그인(epoch 바뀜)이면 늦은 총점을 쓰지 않는다', async () => {
    const { c, release } = client(reply(999, -1)); await c.signin('a', 'b');
    const p = c.submitAttempt('q', '1', 'o', 'sid-000000002');
    await c.logout(); await c.signin('a', 'b');
    await release();
    await assert.rejects(p, e => e.code === 'session_changed');
    assert.equal(c.state().growth.points, 1000);
  });
  await t('이상한 growth(소수·문자열)는 무시하고 응답은 그대로 넘긴다', async () => {
    for (const g of [{ delta: 1, points: 1000.5 }, { delta: 1, points: '1001' }, { delta: 'x', points: 1001 }]) {
      const { c, release } = client({ ...reply(0, 1), growth: g }); await c.signin('a', 'b');
      const p = c.submitAttempt('q', '1', 'o', 'sid-000000003'); await release(); const d = await p;
      assert.equal(c.state().growth.points, 1000, JSON.stringify(g));
      assert.deepEqual(d.growth, g);
    }
  });
  await t('음수 총점도 서버 값 그대로(지어내거나 0으로 막지 않음)', async () => {
    const { c, release } = client(reply(-3, -5)); await c.signin('a', 'b');
    const p = c.submitAttempt('q', '1', 'o', 'sid-000000004'); await release(); await p;
    assert.equal(c.state().growth.points, -3);
  });
  await t('CBT 결과 뒤 refreshProfile: 로그인하지 않았으면 아무 요청도 하지 않는다', async () => {
    const { c } = client(reply(0, 1));
    assert.equal(await c.refreshProfile(), null);
  });
  console.log('\n검사 ' + checks + '개 · 실패 ' + failures + '개');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
