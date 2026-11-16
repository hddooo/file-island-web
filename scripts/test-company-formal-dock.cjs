'use strict';
// CSS/DOM contract fixture. Browser geometry is a separate check.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { JSDOM } = require('jsdom');
const cbt = readFileSync(require.resolve('../media/cbt-results.css'), 'utf8');
const js = readFileSync(require.resolve('../media/formal-exams.js'), 'utf8');
const start = cbt.indexOf('/* Formal mocks in both themes:');
assert(start >= 0);
const fix = cbt.slice(start).replace(/\/\*[\s\S]*?\*\//g, '');
const d = new JSDOM(`<!doctype html><html data-company-mode="on">
<body class="study-global-footer"><main id="app" class="shell"><div class="device-content">
<section id="formalExamHost"><section class="panel fe-active-run">
 <div class="fe-exam-workspace"><div id="feImage"><figure><img class="mock-image" id="question"><img class="mock-image" hidden id="pending"><dialog class="fe-original-dialog"><img id="modal"></dialog></figure></div>
 <div class="fe-exam-answer-side"><button data-option>1</button><button id="fePrev">이전</button><button id="feNext">다음</button></div></div>
</section></section><div><img class="mock-image" id="notExam"></div></div></main><nav class="world-global-nav"></nav></body></html>`);
const doc = d.window.document;
const rule = (suffix) => {
 const m = [...fix.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(([, selector]) => selector.trim().endsWith(suffix));
 assert(m, 'missing rule ' + suffix);
 return m.slice(1);
};
const [sel, img] = rule('#feImage img.mock-image:not([hidden])');
assert.deepEqual([...doc.querySelectorAll(sel)].map(e => e.id), ['question']);
assert.match(img, /width:100%!important;height:auto!important/);
assert.match(img, /max-height:none!important/);
doc.documentElement.removeAttribute('data-company-mode');
assert.deepEqual([...doc.querySelectorAll(sel)].map(e => e.id), ['question']);
doc.documentElement.setAttribute('data-company-mode', 'on');
doc.querySelector('.fe-active-run').classList.remove('fe-active-run');
assert.equal(doc.querySelectorAll(sel).length, 0);
assert.match(fix, /@media\(min-height:460px\)/);
assert.match(rule('.fe-active-run>.fe-exam-workspace')[1], /grid-template-columns:minmax\(0,1fr\)!important/);
assert.match(rule('.fe-active-run>.fe-exam-workspace')[1], /grid-template-rows:minmax\(64px,1fr\) auto!important/);
assert.match(rule('.fe-exam-workspace>#feImage')[1], /overflow:auto!important/);
assert.match(rule('.fe-active-run .fe-exam-answer-side')[1], /position:relative!important;top:auto!important;bottom:auto!important/);
assert.match(rule('.fe-exam-answer-side::after')[1], /display:none!important/);
assert.match(cbt, /\.fe-exam-answer-side\{position:sticky!important;bottom:0;/);
assert.match(fix, /var\(--study-footer-height,76px\)/);
assert.match(js, /id="feImage" role="region"[^>]+tabindex="0"/);
assert.equal(doc.querySelector('#feImage').nextElementSibling.querySelectorAll('button').length, 3);
d.window.close();
console.log('formal mock dock in both themes: layout boundary checks passed');
