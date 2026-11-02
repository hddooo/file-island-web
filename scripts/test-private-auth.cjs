'use strict';
const assert = require('node:assert/strict');
const { create } = require('../media/api-client');
let checks = 0;
const ok = (value, message) => { assert(value, message); checks++; };
const tick = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
const json = data => ({ ok: true, status: 200, text: async () => JSON.stringify(data) });
const session = owner => ({ accessToken: 'fixture-token-' + owner, accessTokenExpiresAt: '2030-01-01T00:00:00Z', user: { id: owner } });
const profile = owner => ({ user: { id: owner }, growth: { points: 1 }, access: { total: 1 }, premium: { active: false } });
const events = () => {
  const listeners = {};
  return {
    addEventListener: (type, fn) => (listeners[type] || (listeners[type] = [])).push(fn),
    dispatch: (type, event) => (listeners[type] || []).forEach(fn => fn(event))
  };
};

// One shared FIFO reproduces the browser's cross-tab lock request ordering.
function fifoLocks() {
  let tail = Promise.resolve(), active = 0;
  const requested = [], acquired = [];
  return {
    requested, acquired,
    request(name, run) {
      const position = requested.push(name);
      const next = tail.then(async () => {
        assert.equal(active, 0, 'cookie operations never overlap');
        active++;
        acquired.push(position);
        try { return await run(); } finally { active--; }
      });
      tail = next.catch(() => {});
      return next;
    }
  };
}

async function invalidationAndFallback() {
  const aEvents = events(), bEvents = events(), values = new Map();
  let broadcast = true;
  const store = other => ({
    getItem: key => values.get(key) || null,
    setItem(key, value) { values.set(key, value); if (broadcast) other.dispatch('storage', { key, newValue: value }); },
    removeItem(key) { values.delete(key); if (broadcast) other.dispatch('storage', { key, newValue: null }); }
  });
  let release, request, logoutMode = 'stall';
  const fetch = async (url, init) => {
    if (url.endsWith('/signin')) return json(session('owner'));
    if (url.endsWith('/me')) return json(profile('owner'));
    if (url.endsWith('/logout')) {
      request = init;
      if (logoutMode === 'stall') return new Promise(resolve => { release = resolve; });
      throw Error('offline');
    }
    return json({});
  };
  const a = create({ base: 'https://fixture.test', fetch, locks: null, eventTarget: aEvents, storage: store(bEvents) });
  const b = create({ base: 'https://fixture.test', fetch, locks: null, eventTarget: bEvents, storage: store(aEvents) });
  broadcast = false;
  await a.signin('fixture', 'fixture');
  await b.signin('fixture', 'fixture');
  broadcast = true;
  let notices = 0;
  b.onChange(() => notices++);
  const pending = a.logout();
  ok(!a.state().signedIn, 'local signedout before network settles');
  ok(!b.state().signedIn, 'other tab immediately invalidated');
  ok(notices > 0, 'other tab reader notified');
  await tick();
  ok(request.headers.Authorization === 'Bearer fixture-token-owner', 'server revocation retains original auth');
  release(json({}));
  ok((await pending).serverRevoked === true, 'server outcome retained');
  await a.signin('fixture', 'fixture');
  broadcast = false;
  await b.signin('fixture', 'fixture');
  broadcast = true;
  logoutMode = 'offline';
  const fail = a.logout();
  ok(!a.state().signedIn && !b.state().signedIn, 'failure never retains visible content');
  ok((await fail).serverRevoked === false, 'failure disclosed');
  await a.signin('fixture', 'fixture');
  broadcast = false;
  await b.signin('fixture', 'fixture');
  broadcast = true;
  await a.signin('fixture', 'fixture');
  ok(a.state().signedIn && !b.state().signedIn, 'account change invalidates other tab without clearing new login');
  ok(![...values.values()].some(value => value.includes('fixture-token') || value.includes('"owner"')), 'no tokens or owner IDs broadcast/stored');

  logoutMode = 'stall';
  const old = a.logout();
  await tick();
  const signing = a.signin('fixture', 'fixture');
  await tick();
  ok(!a.state().signedIn, 'fallback queue keeps signin behind pending same-tab logout');
  release(json({}));
  await old;
  await signing;
  ok(a.state().signedIn, 'fallback queue permits new login after old logout response');
}

async function sharedFifoRegression(logoutMethod, loginMethod) {
  const locks = fifoLocks(), requests = [];
  let release, cookie = 'initial';
  const fetchA = async url => {
    if (url.endsWith('/refresh')) {
      requests.push('refresh');
      await new Promise(resolve => { release = resolve; });
      cookie = 'refreshed-A';
      return json(session('A'));
    }
    if (url.endsWith('/logout') || url.endsWith('/logout-all')) {
      requests.push(logoutMethod);
      cookie = null;
      return json({});
    }
    throw Error('unexpected A request: ' + url);
  };
  const fetchB = async url => {
    if (url.endsWith('/signin') || url.endsWith('/signup')) {
      requests.push(loginMethod);
      cookie = 'new-B';
      return json(session('B'));
    }
    if (url.endsWith('/me')) return json(profile('B'));
    throw Error('unexpected B request: ' + url);
  };
  const a = create({ base: 'https://fixture.test', fetch: fetchA, locks, storage: null, eventTarget: null });
  const b = create({ base: 'https://fixture.test', fetch: fetchB, locks, storage: null, eventTarget: null });
  const refreshing = a.refresh();
  await tick();
  const signingOut = a[logoutMethod]();
  const signingIn = b[loginMethod]('fixture', 'fixture');
  await tick();
  const requestsWhileHeld = locks.requested.length;
  const requestsBeforeRelease = requests.slice();
  release();
  const [refreshed] = await Promise.all([refreshing, signingOut, signingIn]);
  const label = logoutMethod + ' -> ' + loginMethod;
  ok(requestsWhileHeld === 3, label + ': every operation joins the shared queue immediately');
  ok(JSON.stringify(requestsBeforeRelease) === '["refresh"]', label + ': active refresh keeps its lock until it settles');
  ok(JSON.stringify(requests) === JSON.stringify(['refresh', logoutMethod, loginMethod]), label + ': cross-tab cookie writes retain invocation order');
  ok(locks.requested.every(name => name === 'hanq:auth:cookie'), label + ': all cookie mutations share one lock');
  ok(JSON.stringify(locks.acquired) === '[1,2,3]', label + ': FIFO lock mock granted each operation once');
  ok(cookie === 'new-B' && b.state().ownerId === 'B', label + ': old logout cannot erase the later login cookie');
  ok(refreshed === false && !a.state().signedIn, label + ': obsolete refresh cannot restore A');
}

async function rejectedLockDoesNotBypassOrdering() {
  let rejectLocks = false, fetches = 0;
  const locks = { request(name, run) { if (rejectLocks) throw Error('lock unavailable'); return Promise.resolve().then(run); } };
  const api = create({
    base: 'https://fixture.test', locks, storage: null, eventTarget: null,
    fetch: async url => { fetches++; return json(url.endsWith('/signin') ? session('A') : profile('A')); }
  });
  await api.signin('fixture', 'fixture');
  const before = fetches;
  rejectLocks = true;
  const pending = api.logout();
  ok(!api.state().signedIn, 'synchronous lock failure still clears local auth immediately');
  ok((await pending).serverRevoked === false, 'lock acquisition failure is reported as unconfirmed server logout');
  ok(fetches === before, 'failed shared lock never falls back to an unlocked request');
}

(async () => {
  await invalidationAndFallback();
  for (const logoutMethod of ['logout', 'logoutAll']) {
    for (const loginMethod of ['signin', 'signup']) await sharedFifoRegression(logoutMethod, loginMethod);
  }
  await rejectedLockDoesNotBypassOrdering();
  console.log(JSON.stringify({ checks, failures: 0, scope: 'synthetic cross-tab FIFO auth locks, invalidation and same-tab fallback', noActualNetwork: true }));
})().catch(error => { console.error(error); process.exitCode = 1; });
