#!/usr/bin/env node
'use strict';

// Synthetic storage/route regression. No browser storage or account API is used.
// Run: node --test scripts/test-company-storage.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const progressSource = fs.readFileSync(path.join(root, 'media/learning-progress.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const listenerStart = 'if(HPS)HPS.onChange(function(ev){if(!ev||!ev.remote)return;try{if(wnOpen)';
const start = indexSource.indexOf(listenerStart);
assert.ok(start >= 0, 'Existing legacy remote refresh listener exists');
assert.equal(indexSource.indexOf(listenerStart, start + 1), -1, 'Listener is uniquely identified');
const end = indexSource.indexOf('/* ===== 오답으로 모의고사', start);
assert.ok(end > start, 'Listener has its existing next-section boundary');
const listenerSource = indexSource.slice(start, end).trim();
const events = [
  { key: 'hanq:company-mode:v1', oldValue: 'default', newValue: 'company' },
  { key: 'hanq:company-mode:v1', oldValue: 'company', newValue: 'default' },
  { key: 'hanq:probe', oldValue: null, newValue: '1' },
  { key: 'hanq:probe', oldValue: '1', newValue: null },
  { key: 'hanq:att:v1:synthetic-attempt' },
  { key: 'hanq:progress:v1:quiz' },
  { key: 'hanq:progress:v1:mock' },
  { key: 'hanq:progress:v1:read' },
  { key: null, oldValue: null, newValue: null }
];

function fixture(options = {}) {
  const data = new Map(), writes = [], handlers = new Map(), emitted = [];
  const storage = {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { writes.push(['set', key]); data.set(key, String(value)); },
    removeItem(key) { writes.push(['remove', key]); data.delete(key); },
    key(i) { return [...data.keys()][i] || null; },
    get length() { return data.size; }
  };
  const window = { localStorage: storage, addEventListener(type, fn) {
    handlers.set(type, [...(handlers.get(type) || []), fn]);
  }};
  vm.runInNewContext(progressSource, { window }, { filename: 'learning-progress.js' });
  const store = window.HanqProgress.store;
  store.onChange(event => emitted.push(JSON.parse(JSON.stringify(event))));
  writes.length = 0; // Existing initialization probe affects only this memory store.
  const serverHost = { id: 'cbtWrongNotebookHost', questionCount: 76, pageSize: 20 };
  const legacyPanel = { className: 'wn-panel' };
  const calls = [], selected = [], errors = [];
  let routeListener, screen = options.legacy ? legacyPanel : serverHost;
  const context = {
    HPS: { onChange(fn) { routeListener = fn; return store.onChange(fn); } },
    wnOpen: options.wnOpen !== false,
    wnRun: options.wnRun || null,
    current: options.current || null,
    step: options.step || 0,
    app: { querySelector(selector) {
      selected.push(selector);
      if (selector === '.wn-panel') return screen === legacyPanel ? legacyPanel : null;
      if (selector === '#cbtWrongNotebookHost') return screen === serverHost ? serverHost : null;
      throw new Error('Unexpected selector: ' + selector);
    }},
    document: {
      activeElement: { id: 'synthetic-focus' },
      getElementById(id) { assert.equal(id, 'synthetic-focus'); return { focus() { calls.push('focus'); } }; }
    },
    renderWrongNotes() { screen = legacyPanel; calls.push('legacy-render'); },
    currentQuizKey() { return 'synthetic-quiz'; },
    restoreQuiz(remote, key) { calls.push(['restore-quiz', remote, key]); },
    quizEntries() { return ['quiz-entry']; },
    syncQuizJump(entries) { calls.push(['quiz-jump', ...entries]); },
    updateQuizProgress() { calls.push('quiz-progress'); },
    currentMockKey() { return 'synthetic-mock'; },
    restoreMock(remote, key) { calls.push(['restore-mock', remote, key]); },
    mockEntries() { return ['mock-entry']; },
    syncMockJump(entries) { calls.push(['mock-jump', ...entries]); },
    updateMockProgress() { calls.push('mock-progress'); }
  };
  vm.runInNewContext(listenerSource, context, { filename: 'index-legacy-storage-listener.js' });
  return {
    store, data, writes, emitted, calls, selected, errors, serverHost, legacyPanel,
    screen: () => screen,
    deliver: event => routeListener(event),
    dispatch(event) { (handlers.get('storage') || []).forEach(fn => fn(event)); }
  };
}

test('guard matches existing API-init ownership check and production scripts parse', () => {
  assert.match(listenerSource, /if\(!wnRun&&app\.querySelector\('\.wn-panel'\)\)/);
  assert.match(indexSource, /if\(wnOpen&&!wnRun&&app\.querySelector\('\.wn-panel'\)\)renderWrongNotes\(\)/);
  assert.doesNotThrow(() => new vm.Script(progressSource));
  assert.doesNotThrow(() => new vm.Script(listenerSource));
  const inline = [...indexSource.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/\bsrc\s*=/.test(match[1]) && match[2].trim());
  assert.ok(inline.length > 0);
  inline.forEach((match, i) => assert.doesNotThrow(() => new vm.Script(match[2], { filename: 'index-inline-' + i })));
});

test('company, probe, learning and clear events still reach HPS without writes or deletion', () => {
  const f = fixture();
  f.data.set('hanq:progress:v1:quiz', 'synthetic-existing-value');
  events.forEach(event => f.dispatch(event));
  assert.deepEqual(f.emitted, events.map(event => ({ type: 'remote', remote: true, key: event.key })));
  assert.deepEqual(f.writes, []);
  assert.equal(f.data.get('hanq:progress:v1:quiz'), 'synthetic-existing-value');
});

test('actual index listener preserves server CBT host on cross-tab ON/OFF, probe, learning and clear', () => {
  const f = fixture();
  events.forEach(event => {
    f.dispatch(event);
    assert.strictEqual(f.screen(), f.serverHost);
    assert.equal(f.serverHost.questionCount, 76);
    assert.equal(f.serverHost.pageSize, 20);
  });
  assert.deepEqual(f.calls, []);
  assert.deepEqual(f.selected, events.map(() => '.wn-panel'));
});

test('existing local wrongnotes still refresh and restore focus on every remote event', () => {
  const f = fixture({ legacy: true });
  events.forEach(event => f.dispatch(event));
  assert.strictEqual(f.screen(), f.legacyPanel);
  assert.deepEqual(f.calls, events.flatMap(() => ['legacy-render', 'focus']));
});

test('in-progress legacy retry run is not replaced by a storage event', () => {
  const run = { id: 'synthetic-run' }, f = fixture({ legacy: true, wnRun: run });
  events.forEach(event => f.dispatch(event));
  assert.strictEqual(f.screen(), f.legacyPanel);
  assert.deepEqual(f.calls, []);
  assert.deepEqual(f.selected, []);
});

test('missing and local notifications do not redraw any route', () => {
  const f = fixture({ legacy: true });
  [null, undefined, {}, { remote: false, key: 'hanq:progress:v1:quiz' }].forEach(event => f.deliver(event));
  assert.deepEqual(f.calls, []);
  assert.deepEqual(f.selected, []);
});

test('chapter quiz remote refresh keeps its existing restore, jump and progress behavior', () => {
  const f = fixture({ wnOpen: false, current: { id: 'prehistory' }, step: 2 });
  f.dispatch({ key: 'hanq:progress:v1:quiz' });
  assert.deepEqual(f.calls, [
    ['restore-quiz', true, 'synthetic-quiz'], ['quiz-jump', 'quiz-entry'], 'quiz-progress'
  ]);
  assert.deepEqual(f.selected, []);
});

test('chapter mock remote refresh keeps its existing restore, jump and progress behavior', () => {
  const f = fixture({ wnOpen: false, current: { id: 'prehistory' }, step: 3 });
  f.dispatch({ key: 'hanq:progress:v1:mock' });
  assert.deepEqual(f.calls, [
    ['restore-mock', true, 'synthetic-mock'], ['mock-jump', 'mock-entry'], 'mock-progress'
  ]);
  assert.deepEqual(f.selected, []);
});

test('inactive route and non-hanq storage changes remain inert', () => {
  const f = fixture({ wnOpen: false });
  f.dispatch({ key: 'hanq:progress:v1:quiz' });
  assert.deepEqual(f.calls, []);
  assert.equal(f.store.handleStorageEvent({ key: 'unrelated-key' }), false);
  assert.equal(f.emitted.length, 1);
});

