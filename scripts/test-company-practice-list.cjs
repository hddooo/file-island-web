#!/usr/bin/env node
'use strict';

// Synthetic presentation regression tests, not browser layout/PDF-generation tests.
// Run: NODE_PATH=<test-tools>/node_modules node --test scripts/test-company-practice-list.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const csstree = require('css-tree');
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'media/display-mode.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'media/company-mode.css'), 'utf8');
const selector = 'html[data-company-mode=on] #app#app#app .tc-group-list[data-company-native-directory]>.tc-group-row';
const ast = csstree.parse(css, { positions: true });
const fixes = [];
csstree.walk(ast, { visit: 'Rule', enter(node) {
  if (csstree.generate(node.prelude) === selector) fixes.push(node);
} });
assert.equal(fixes.length, 1, 'one narrowly scoped Practice row override exists');
const fix = fixes[0];
const cssWithoutFix = css.slice(0, fix.loc.start.offset) + css.slice(fix.loc.end.offset);

// Relevant native declarations audited at 45c910d387875984fe5153f0041bb31bb3fdccd0:
// media/toeic-practice-pdf.css lines 2-3, 11, 27-29 and 32. The 100% PDF footer
// must remain present: with the old company flex row it consumes the Part width.
const nativeCss = `
.tc .tc-group-row{display:grid;grid-template-columns:minmax(0,1fr);gap:0;min-width:0}
.tc .tc-group-row>.tc-group{width:100%;min-width:0;text-align:left}
.tc .tc-pdf-tools [hidden]{display:none!important}
html body #app .toeic-learning-page .tc.tc-simple .tc-group-row>.tc-group-exports{display:block;width:100%;border-top:1px solid var(--toeic-row-line,#354c3d);background:transparent!important}
html body #app .toeic-learning-page .tc.tc-simple .tc-group-exports>.tc-pdf-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;width:100%;background:transparent!important}
html body #app .toeic-learning-page .tc.tc-simple .tc-pdf-tools>.tc-pdf-export{width:100%;min-height:44px;margin:0!important;padding:6px 8px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:inherit!important;font-size:12px!important;font-weight:400!important;line-height:1.4!important;text-decoration:none!important}
html body #app .toeic-learning-page .tc.tc-simple .tc-pdf-tools>:is(.tc-pdf-cancel,.tc-pdf-download,.tc-pdf-status){grid-column:1/-1;margin:0!important;padding:8px!important;border:0!important;border-top:1px solid var(--toeic-row-line,#354c3d)!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
`;
const controls = doc => [...doc.querySelectorAll('button,a')];
const flush = () => new Promise(resolve => setTimeout(resolve, 12));
const row = (part, disabled = false, pdf = true) => `
<div class="tc-group-row" data-test-part="${part}">
  <button type="button" class="tool-btn tc-group toeic-list-open" aria-label="Part ${part}, 리뷰 1 / 전체 20문제" aria-pressed="false"${disabled ? ' disabled' : ''}>
    <span class="tc-group-label">Part ${part} - 원본 학습</span><span class="tc-group-count">리뷰 1 / 전체 20문제</span>
  </button>${pdf ? `
  <div class="tc-group-exports"><div class="tc-pdf-tools">
    <button type="button" class="tc-pdf-export" data-sheet="questions">문제 PDF</button>
    <button type="button" class="tc-pdf-export" data-sheet="answers">해설 PDF</button>
    <button type="button" class="tc-pdf-cancel" hidden disabled>취소</button>
    <a class="tc-pdf-download" href="https://fixture.test/synthetic.pdf" download="synthetic.pdf" hidden>저장</a>
    <span class="tc-pdf-status" role="status" aria-live="polite" hidden></span>
  </div></div>` : ''}
</div>`;

function fixture(t, { presentationCss = css, sourceLast = true } = {}) {
  const styles = sourceLast ? presentationCss + nativeCss : nativeCss + presentationCss;
  const dom = new JSDOM('<!doctype html><html data-hanq-theme="terminal"><head><title>Practice original</title><style>' + styles + '</style></head><body><main id="app"><div class="device-content"><section class="toeic-learning-page"><section class="tc tc-simple"><div class="tc-group-list toeic-compact-list">' + row('1') + row('2', true, false) + '</div></section></section></div></main></body></html>', {
    url: 'https://fixture.test/#toeic/wrongnotes', runScripts: 'outside-only', pretendToBeVisual: true
  });
  t.after(() => dom.window.close());
  dom.window.eval(code);
  return { w: dom.window, doc: dom.window.document, mode: dom.window.HanqDisplayMode };
}

test('Practice correction is company-scoped and only overrides row grid layout', () => {
  const declarations = [...fix.block.children].map(n => [n.property, csstree.generate(n.value), n.important]);
  assert.deepEqual(declarations, [
    ['display', 'grid', true],
    ['grid-template-columns', 'minmax(0,1fr)', true]
  ]);
  assert.match(selector, /^html\[data-company-mode=on\] /);
  assert.match(selector, /\.tc-group-list\[data-company-native-directory\]>\.tc-group-row$/);
});

for (const sourceLast of [false, true]) {
  test('scoped grid wins the old company flex rule with native CSS loaded ' + (sourceLast ? 'after' : 'before'), async t => {
    const current = fixture(t, { sourceLast });
    const previous = fixture(t, { sourceLast, presentationCss: cssWithoutFix });
    for (const f of [current, previous]) { f.mode.select('company'); await flush(); }
    const currentRow = current.doc.querySelector('.tc-group-row');
    assert.equal(previous.w.getComputedStyle(previous.doc.querySelector('.tc-group-row')).display, 'flex', 'fixture reproduces the original display conflict');
    assert.equal(current.w.getComputedStyle(currentRow).display, 'grid');
    assert.equal(current.w.getComputedStyle(currentRow).gridTemplateColumns, 'minmax(0,1fr)');
    assert.equal(current.w.getComputedStyle(current.doc.querySelector('.tc-group-exports')).width, '100%', 'native full-width PDF footer is retained');
    assert.equal(current.w.getComputedStyle(current.doc.querySelector('.tc-pdf-tools')).display, 'grid');
    assert.equal(current.w.getComputedStyle(current.doc.querySelector('.tc-pdf-tools')).gridTemplateColumns, 'repeat(2,minmax(0,1fr))');
    assert.equal(current.w.getComputedStyle(current.doc.querySelector('.tc-pdf-status')).gridColumn, '1/-1');
  });
}

test('normal mode does not match the correction and three mode cycles restore native markup', async t => {
  const { w, doc, mode } = fixture(t);
  const list = doc.querySelector('.tc-group-list'), original = list.innerHTML, originalControls = controls(doc);
  const partRow = list.firstElementChild;
  for (let i = 0; i < 3; i++) {
    mode.select('company'); await flush();
    assert.equal(partRow.matches(selector), true);
    assert.equal(w.getComputedStyle(partRow).display, 'grid');
    mode.select('default'); await flush();
    assert.equal(partRow.matches(selector), false);
    assert.equal(list.innerHTML, original);
    assert.deepEqual(controls(doc), originalControls);
    assert.equal(w.getComputedStyle(partRow).display, 'grid', 'native normal-mode layout stays grid');
    assert.equal(doc.documentElement.dataset.hanqTheme, 'terminal');
    assert.equal(w.location.hash, '#toeic/wrongnotes');
  }
  // Even a stale decoration cannot make the correction apply outside company mode.
  list.setAttribute('data-company-native-directory', 'stale fixture');
  assert.equal(partRow.matches(selector), false);
});

test('native Part selection, disabled readiness and independent PDF handlers survive refreshes', async t => {
  const { doc, mode } = fixture(t);
  const parts = [...doc.querySelectorAll('.tc-group')], exports = [...doc.querySelectorAll('.tc-pdf-export')];
  const originalControls = controls(doc), actions = [];
  parts[0].onclick = () => { parts[0].setAttribute('aria-pressed', 'true'); actions.push('part'); };
  parts[1].onclick = () => actions.push('disabled-part');
  exports.forEach((button, i) => button.addEventListener('click', () => actions.push('pdf-' + i)));
  mode.select('company'); await flush();
  parts[0].click(); parts[1].click(); exports.forEach(button => button.click());
  assert.deepEqual(actions, ['part', 'pdf-0', 'pdf-1']);
  assert.deepEqual(controls(doc), originalControls);
  assert.equal(parts[0].getAttribute('aria-pressed'), 'true');
  assert.equal(parts[1].disabled, true);
  assert.equal(doc.querySelector('.tc-pdf-cancel').disabled, true);
  assert.equal(doc.querySelector('.tc-pdf-cancel').hidden, true);
  assert.equal(doc.querySelector('.tc-group .tc-pdf-export'), null, 'PDF actions remain siblings, not nested in the Part button');
  parts[0].disabled = true;
  for (let i = 0; i < 3; i++) { mode.refresh(); await flush(); }
  parts[0].click();
  assert.deepEqual(actions, ['part', 'pdf-0', 'pdf-1']);
  assert.equal(parts[0].disabled, true, 'native pending disabled state remains owned by the feature');
  mode.select('default'); await flush();
  assert.equal(parts[0].disabled, true);
  assert.equal(parts[0].getAttribute('aria-pressed'), 'true');
});

test('PDF hidden, cancel disabled and status/download state stay feature-owned through mode changes', async t => {
  const { w, doc, mode } = fixture(t);
  const cancel = doc.querySelector('.tc-pdf-cancel'), download = doc.querySelector('.tc-pdf-download');
  const status = doc.querySelector('.tc-pdf-status'), exports = [...doc.querySelectorAll('.tc-pdf-export')];
  const states = [
    { name: 'idle', busy: false, cancelHidden: true, cancelDisabled: true, downloadHidden: true, statusHidden: true, text: '' },
    { name: 'pending', busy: true, cancelHidden: false, cancelDisabled: false, downloadHidden: true, statusHidden: false, text: '문제 PDF 준비 중' },
    { name: 'cancelled', busy: false, cancelHidden: true, cancelDisabled: true, downloadHidden: true, statusHidden: false, text: '생성을 취소했습니다.' },
    { name: 'failed', busy: false, cancelHidden: true, cancelDisabled: true, downloadHidden: true, statusHidden: false, text: '생성 실패. 다시 시도해 주세요.' },
    { name: 'ready', busy: false, cancelHidden: true, cancelDisabled: true, downloadHidden: false, statusHidden: false, text: '저장할 수 있습니다.' }
  ];
  let cancellations = 0;
  cancel.onclick = () => cancellations++;
  for (const state of states) {
    exports.forEach(button => { button.disabled = state.busy; });
    cancel.hidden = state.cancelHidden; cancel.disabled = state.cancelDisabled;
    download.hidden = state.downloadHidden;
    status.hidden = state.statusHidden; status.textContent = state.text;
    for (const appearance of ['company', 'default']) {
      mode.select(appearance); await flush(); mode.refresh(); await flush();
      assert.equal(cancel.hidden, state.cancelHidden, state.name);
      assert.equal(cancel.disabled, state.cancelDisabled, state.name);
      assert.equal(download.hidden, state.downloadHidden, state.name);
      assert.equal(status.hidden, state.statusHidden, state.name);
      assert.equal(status.textContent, state.text, state.name);
      exports.forEach(button => assert.equal(button.disabled, state.busy, state.name));
      for (const node of [cancel, download, status]) {
        if (node.hidden) assert.equal(w.getComputedStyle(node).display, 'none', state.name + ': hidden PDF controls must remain hidden');
        else assert.notEqual(w.getComputedStyle(node).display, 'none', state.name + ': visible native state stays visible');
      }
      assert.equal(download.getAttribute('href'), 'https://fixture.test/synthetic.pdf');
      assert.equal(download.download, 'synthetic.pdf');
      cancel.click();
    }
  }
  assert.equal(cancellations, 2, 'only enabled pending cancel can invoke its original handler');
});

test('async Part replacement is decorated once and retains new native listeners and hidden PDF controls', async t => {
  const { w, doc, mode } = fixture(t);
  mode.select('company'); await flush();
  const list = doc.querySelector('.tc-group-list');
  list.innerHTML = row('3.4', false, true) + row('5,6', true, false);
  const parts = [...list.querySelectorAll('.tc-group')], originalControls = controls(doc);
  let clicks = 0; parts[0].onclick = () => clicks++;
  await flush();
  assert.equal(list.dataset.companyNativeDirectory, 'english / practice / 2 files');
  assert.deepEqual([...list.querySelectorAll('.company-native-file')].map(node => node.textContent), ['part-3-4.json', 'part-5-6.json']);
  for (let i = 0; i < 3; i++) { mode.refresh(); await flush(); }
  assert.equal(list.querySelectorAll('[data-company-added]').length, 2);
  assert.deepEqual(controls(doc), originalControls);
  assert.equal(parts[1].disabled, true);
  assert.equal(doc.querySelector('.tc-pdf-cancel').hidden, true);
  assert.equal(w.getComputedStyle(list.firstElementChild).display, 'grid');
  parts[0].click(); assert.equal(clicks, 1);
  mode.select('default'); await flush();
  assert.equal(list.querySelector('[data-company-added]'), null);
  assert.deepEqual(controls(doc), originalControls);
  parts[0].click(); assert.equal(clicks, 2);
});
