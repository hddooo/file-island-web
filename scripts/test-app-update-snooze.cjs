'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync('media/app-update.js', 'utf8');
const key = 'hanq:app-update:snooze-local-day:v1';
const localDate = now => { const d = new Date(now); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
const midnight = now => { const d = new Date(now); d.setHours(24,0,0,0); return d.getTime(); };
const current = 'a'.repeat(40), next = 'b'.repeat(40);
const tick = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
async function fixture({ stored, unavailable = false, now = new Date(2026, 10, 14, 12).getTime() } = {}) {
  const w = new JSDOM('<meta name="hanq-app-version" content="' + current + '"><main></main>', {
    url: 'https://synthetic.invalid/?keep=1#subjects', runScripts: 'outside-only', pretendToBeVisual: true
  }).window;
  let clock = now, version = next, calls = 0, serial = 0;
  const timers = new Map();
  w.Date.now = () => clock;
  w.setTimeout = (fn, ms = 0) => { const id = ++serial; timers.set(id, { fn, at: clock + ms }); return id; };
  w.clearTimeout = id => timers.delete(id);
  w.fetch = async () => { calls++; return { ok: true, json: async () => ({ schema: 1, buildId: version }) }; };
  let activity;
  w.HanqApi = { state: () => ({ restoring: false }), onActivity: callback => { activity = callback; } };
  if (stored !== undefined) w.localStorage.setItem(key, stored);
  w.localStorage.setItem('synthetic-learning', 'preserve-answer');
  w.sessionStorage.setItem('synthetic-auth', 'preserve-session');
  if (unavailable) Object.defineProperty(w, 'localStorage', { get() { throw Error('storage unavailable'); } });
  w.eval(source); await tick();
  return {
    w, panel: w.document.querySelector('.app-update'), apply: w.document.querySelector('[data-apply-update]'),
    dismiss() { w.document.querySelector('[data-dismiss-update]').click(); },
    async resume(event = 'focus') { w.dispatchEvent(new w.Event(event)); await tick(); },
    async advance(ms) {
      const end = clock + ms; let count = 0;
      while (true) {
        const first = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!first) break;
        assert(count++ < 100, 'timer loop'); clock = first[1].at; timers.delete(first[0]); first[1].fn(); await tick();
      }
      clock = end; await tick();
    },
    setVersion(value) { version = value; }, get calls() { return calls; }, get now() { return clock; },
    activity(pending) { activity({ id: 'synthetic-request', pending }); },
    close() { timers.clear(); w.close(); }
  };
}
test('Later suppresses the local calendar day across focus, pageshow, visibility and newer builds', async () => {
  const f = await fixture();
  try {
    assert.equal(f.panel.hidden, false); assert.equal(f.calls, 1);
    f.dismiss(); const deadline = midnight(f.now);
    assert.equal(f.w.localStorage.getItem(key), localDate(f.now)); assert.equal(f.panel.hidden, true);
    await f.resume(); await f.resume('pageshow');
    f.w.document.dispatchEvent(new f.w.Event('visibilitychange')); await tick();
    assert.equal(f.panel.hidden, true);
    f.setVersion('c'.repeat(40)); await f.advance(61000); await f.resume();
    assert.equal(f.calls, 2); assert.equal(f.panel.hidden, true);
    assert.equal(f.w.localStorage.getItem('synthetic-learning'), 'preserve-answer');
    assert.equal(f.w.sessionStorage.getItem('synthetic-auth'), 'preserve-session');
    assert.equal(f.w.location.href, 'https://synthetic.invalid/?keep=1#subjects');
    await f.advance(deadline - f.now - 1); assert.equal(f.panel.hidden, true);
    await f.advance(1); assert.equal(f.panel.hidden, false, 'expiry shows notice without requiring focus');
  } finally { f.close(); }
});
test('a reload restores the same deadline without extending it', async () => {
  const first = await fixture(); first.dismiss(); const stored = first.w.localStorage.getItem(key), now = first.now; first.close();
  const f = await fixture({ stored, now: now + 3600000 });
  try {
    assert.equal(f.panel.hidden, true); await f.resume();
    assert.equal(f.w.localStorage.getItem(key), stored);
    await f.advance(midnight(now) - f.now); assert.equal(f.panel.hidden, false);
  } finally { f.close(); }
});
test('storage events synchronize another tab, including removal and clear', async () => {
  const f = await fixture();
  try {
    f.w.localStorage.setItem(key, localDate(f.now));
    f.w.dispatchEvent(new f.w.StorageEvent('storage', { key })); assert.equal(f.panel.hidden, true);
    f.w.localStorage.removeItem(key); f.w.dispatchEvent(new f.w.StorageEvent('storage', { key }));
    assert.equal(f.panel.hidden, false);
    f.dismiss(); f.w.localStorage.removeItem(key); f.w.dispatchEvent(new f.w.StorageEvent('storage', { key: null }));
    assert.equal(f.panel.hidden, false);
  } finally { f.close(); }
});
test('blocked local storage still honors Later for the current page', async () => {
  const f = await fixture({ unavailable: true });
  try { f.dismiss(); await f.resume(); assert.equal(f.panel.hidden, true); await f.advance(midnight(f.now) - f.now); assert.equal(f.panel.hidden, false); }
  finally { f.close(); }
});
test('readable storage with failed writes keeps the current-page deadline on focus', async () => {
  const f = await fixture();
  try {
    f.w.Storage.prototype.setItem = () => { throw new f.w.DOMException('quota', 'QuotaExceededError'); };
    f.dismiss(); assert.equal(f.w.localStorage.getItem(key), null);
    await f.resume(); await f.resume('pageshow'); assert.equal(f.panel.hidden, true);
    await f.advance(midnight(f.now) - f.now); assert.equal(f.panel.hidden, false);
  } finally { f.close(); }
});
test('storage becoming unreadable after dismissal preserves only the dismissed local day', async () => {
  const f = await fixture();
  try {
    f.dismiss(); assert.equal(f.panel.hidden, true);
    Object.defineProperty(f.w, 'localStorage', { get() { throw Error('storage newly blocked'); } });
    await f.resume(); assert.equal(f.panel.hidden, true);
    await f.advance(midnight(f.now) - f.now); await f.resume(); assert.equal(f.panel.hidden, false);
  } finally { f.close(); }
});
test('invalid or expired storage cannot hide the notice', async () => {
  for (const stored of ['invalid', 'Infinity', '-1', '0', '1799999999999', '2026-11-13', '2026-11-15', '2026-02-30']) {
    const f = await fixture({ stored }); try { assert.equal(f.panel.hidden, false, stored); } finally { f.close(); }
  }
});
test('expiry preserves existing route, dirty input, audio and API activity guards', async () => {
  const f = await fixture();
  try {
    f.dismiss(); f.w.location.hash = '#joseon/quiz'; await f.advance(midnight(f.now) - f.now);
    assert.equal(f.panel.hidden, false); assert.equal(f.apply.disabled, true);
    f.apply.click(); assert.equal(f.w.location.hash, '#joseon/quiz');
    f.w.location.hash = '#subjects'; await f.advance(80); assert.equal(f.apply.disabled, false);
    const input = f.w.document.createElement('input'); f.w.document.querySelector('main').append(input);
    input.value = 'keep'; input.dispatchEvent(new f.w.Event('input', { bubbles: true })); await f.advance(80);
    assert.equal(f.apply.disabled, true); f.apply.click(); assert.equal(input.value, 'keep');
    input.remove(); await f.advance(80); assert.equal(f.apply.disabled, false);
    const audio = f.w.document.createElement('audio'); f.w.document.querySelector('main').append(audio);
    Object.defineProperty(audio, 'paused', { configurable: true, value: false });
    audio.dispatchEvent(new f.w.Event('play')); await f.advance(80); assert.equal(f.apply.disabled, true);
    Object.defineProperty(audio, 'paused', { configurable: true, value: true });
    audio.dispatchEvent(new f.w.Event('pause')); await f.advance(80); assert.equal(f.apply.disabled, false);
    f.activity(true); await f.advance(80); assert.equal(f.apply.disabled, true);
    f.activity(false); await f.advance(80); assert.equal(f.apply.disabled, false);
  } finally { f.close(); }
});

test('a dismissal immediately before midnight expires at the calendar boundary', async () => {
  for (const [year, month, day] of [[2026, 10, 14], [2026, 11, 31], [2028, 1, 29]]) {
    const now = new Date(year, month, day, 23, 59, 59, 900).getTime();
    const f = await fixture({ now });
    try {
      f.dismiss(); await f.advance(99); assert.equal(f.panel.hidden, true);
      await f.advance(1); assert.equal(f.panel.hidden, false);
      await f.resume(); assert.equal(f.panel.hidden, false);
    } finally { f.close(); }
  }
});
test('first observation after midnight ignores yesterday and old rolling values', async () => {
  const now = new Date(2027, 0, 1, 0, 0, 1).getTime();
  const f = await fixture({ now, stored: '2026-12-31' });
  try { assert.equal(f.panel.hidden, false); } finally { f.close(); }
  const old = await fixture({ now });
  try {
    old.w.localStorage.setItem('hanq:app-update:snooze-until', String(now + 86400000));
    await old.resume(); assert.equal(old.panel.hidden, false);
  } finally { old.close(); }
});
test('local midnight follows both DST transitions instead of adding 24 hours', async () => {
  const previous = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    for (const [month, day, hours] of [[2, 8, 23], [10, 1, 25]]) {
      const now = new Date(2026, month, day, 0, 0, 0).getTime();
      assert.equal(midnight(now) - now, hours * 3600000);
      const f = await fixture({ now });
      try {
        f.dismiss(); await f.advance(hours * 3600000 - 1); assert.equal(f.panel.hidden, true);
        await f.advance(1); assert.equal(f.panel.hidden, false);
      } finally { f.close(); }
    }
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});
