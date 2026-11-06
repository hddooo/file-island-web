'use strict';
// Synthetic collections only. No production endpoint is contacted.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(path.join(__dirname, '../media/rainbow-island.js'), 'utf8');
const characters = fs.readFileSync(path.join(__dirname, '../media/characters.js'), 'utf8');
const owner = '11111111-1111-4111-8111-111111111111';
const first = '22222222-2222-4222-8222-222222222222';
const egg = '33333333-3333-4333-8333-333333333333';
function initial(coinBalance = 0) {
  return { signedIn: true, restoring: false, profileStatus: 'ready', ownerId: owner, user: { id: owner }, epoch: 1, growth: { points: 1000 }, premium: { active: true }, partners: {
    version: 1, claimEnabled: true, equipEnabled: true, purchaseEnabled: true, hatchEnabled: true, hatchSeconds: 60,
    serverNow: '2026-11-06T00:00:00Z', coinBalance, revision: 1, totalPoints: 1000, equippedId: first,
    items: [
      { id: first, family: 'agumon', character: 'agumon', points: 1000, stage: 2, revision: 0, equipped: true, firstPartner: true, nextCharacter: 'greymon', nextThreshold: 1200, eligible: false, final: false },
      { id: egg, family: 'gabumon', character: 'digitama', points: 0, stage: -1, revision: 1, equipped: false, firstPartner: false, nextCharacter: null, nextThreshold: null, hatchStartedAt: null, hatchReadyAt: null, hatchedAt: null, eligible: false, final: false }
    ]
  } };
}
function fixture(state) {
  const d = new JSDOM('<main><section class="ac-inventory" id="inventory"></section></main>', { url: 'https://fixture.test/#account', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = d.window, listeners = new Set(), writes = []; let tick, elapsed = 0, reads = 0;
  w.matchMedia = () => ({ matches: true }); w.setInterval = f => { tick = f; return 1; }; w.clearInterval = () => { tick = null; };
  Object.defineProperty(w.performance, 'now', { value: () => elapsed });
  const api = { state: () => structuredClone(state), onChange: f => { listeners.add(f); return () => listeners.delete(f); }, me: () => { reads++; return Promise.resolve(); }, partnerAction: (action, body) => { writes.push({ action, ...body }); return Promise.resolve(); } };
  w.eval(characters); w.eval(source);
  const host = w.document.querySelector('#inventory'); w.HanqCollection.mountInventory(host, api);
  return { d, w, host, writes, api, state, get reads() { return reads; }, get listenerCount() { return listeners.size; }, emit: () => [...listeners].forEach(f => f()), advance: ms => { elapsed += ms; if (tick) tick(); } };
}
let checks = 0;
function check(value, message) { assert(value, message); checks++; }
function copy(f) {
  check(!/MY PARTNERS|부화 안내|처음 꺼낸 서버 시각|새로고침하거나 나중에 돌아와도|장착한 한 마리만 XP를 받아요\./.test(f.host.textContent), 'requested explanatory and duplicate heading copy is absent');
  check(f.host.querySelectorAll('.ac-inventory-heading h2').length === 1 && f.host.querySelector('.ac-inventory-heading h2').textContent === '디지몬 보관함', 'one Korean inventory heading remains');
  check(!f.host.querySelector('.ac-inventory-info'), 'no empty hatch disclosure remains');
}
async function run() {
  for (const coins of [0, 73]) {
    const f = fixture(initial(coins));
    try {
      const before = JSON.stringify(f.state); copy(f);
      check(f.host.querySelector('.ac-inventory-summary').textContent === '계정 총 XP · 1,000 XP', 'summary keeps real account XP without Coin copy');
      check(f.w.HanqCollection.ready(f.state), 'collection readiness and coin contract remain valid');
      check(f.state.partners.coinBalance === coins && JSON.stringify(f.state) === before, 'rendering does not change balance, XP, or collection state');
      check(f.host.querySelectorAll('.ac-partner-card').length === 2, 'partner and egg cards remain');
      check(f.host.querySelector('[data-hatch-countdown]').textContent === '알을 꺼내면 60초 뒤 부화해요', 'unstarted egg status remains');
      f.host.querySelector('[data-inventory="wardrobe"]').click();
      check(f.host.classList.contains('is-wardrobe') && f.host.querySelector('.ac-inventory-main').inert, 'wardrobe navigation remains');
      f.w.history.replaceState({}, ''); f.w.HanqCollection.handlePopState();
      check(!f.host.classList.contains('is-wardrobe') && f.w.document.activeElement.dataset.inventory === 'wardrobe', 'wardrobe back restores focus');
      f.host.querySelector('[data-id="' + egg + '"]').click(); await Promise.resolve(); await Promise.resolve();
      check(f.writes.length === 1 && f.writes[0].action === 'equip' && f.writes[0].id === egg && f.writes[0].revision === 1 && !!f.writes[0].requestId, 'egg equip action and request contract remain');
      const p = f.state.partners.items[1]; p.hatchStartedAt = f.state.partners.serverNow; p.hatchReadyAt = '2026-11-06T00:01:00Z'; f.emit();
      check(f.host.querySelector('[data-hatch-countdown]').textContent === '부화까지 60초', 'server countdown starts at 60 seconds');
      f.advance(15000); check(f.host.querySelector('[data-hatch-countdown]').textContent === '부화까지 45초', 'countdown continues');
      f.advance(45000); await Promise.resolve(); await Promise.resolve();
      check(f.reads === 1 && f.host.querySelector('[data-hatch-countdown]').textContent.includes('서버에서 부화를 확인'), 'expiry still refreshes authoritative server state');
      Object.assign(p, { stage: 0, character: 'punimon', nextCharacter: 'tsunomon', nextThreshold: 500, hatchedAt: '2026-11-06T00:01:00Z' }); f.emit();
      check(f.host.querySelector('[data-partner="' + egg + '"] h3').textContent === '푸니몬' && !f.host.querySelector('[data-hatch-countdown]'), 'confirmed hatch replaces egg with existing partner');
      copy(f);
      f.state.profileStatus = 'error'; f.emit();
      check(f.host.textContent.includes('서버에서 디지몬 보관함을 확인하지 못했어요.') && !!f.host.querySelector('[data-inventory="refresh"]'), 'real error and retry remain');
      f.state.profileStatus = 'ready'; f.state.ownerId = 'different-owner'; f.emit();
      check(!f.host.querySelector('[data-partner]'), 'owner mismatch clears personal cards');
      f.host.remove(); await Promise.resolve();
      check(f.listenerCount === 0, 'detached inventory unsubscribes');
    } finally { f.w.close(); }
  }
  const legacyState = initial(); delete legacyState.partners;
  const legacy = fixture(legacyState); try { copy(legacy); check(legacy.host.textContent.includes('준비 중'), 'legacy capability notice remains'); check(legacy.writes.length === 0 && legacy.reads === 0, 'legacy rendering has no server writes or reads'); } finally { legacy.w.close(); }
  check(source.includes("c.coinBalance<0") && source.includes("priceCoin:0") && source.includes("0 Coin · 구매 확인"), 'validation, payment price, and shop price display are unchanged');
  console.log('PASS ' + checks + ' inventory copy and lifecycle checks');
}
if (require.main === module) run().catch(e => { console.error(e); process.exitCode = 1; });
module.exports = { initial };
