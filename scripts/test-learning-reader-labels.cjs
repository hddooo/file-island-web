'use strict';
// Synthetic fixtures only. The labels must not imply multiple documents for a single source.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..'), ctx = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'media/learning-reader.js'), 'utf8'), ctx);
const reader = ctx.window.HanqLearningReader;
function parts(text) {
  const rows = JSON.parse(JSON.stringify(reader.documents(text)));
  assert.equal(rows.map(p => text.slice(p.start, p.end)).join(''), text);
  rows.forEach((p, i) => { assert.equal(p.number, i + 1); assert(p.start < p.end); });
  return rows;
}
for (const empty of ['', ' \n ', null, undefined, 0]) assert.equal(reader.documents(empty).length, 0);
const types = ['공지', '이메일', '기사', '문자 대화', '메모', '편지', '광고', '웹 페이지', '일정표', '양식', '영수증', '이용 후기'];
for (const type of types) {
  const text = 'Synthetic ' + type + '\n\nAn original paragraph.\nA second paragraph.\n';
  ctx.window.HANQ_PASSAGE_LAYOUTS = {[reader.signature(text)]: {parts: [{start: 0, type, anchor: text.slice(0, 12)}]}};
  assert.deepEqual(parts(text), [{start: 0, end: text.length, type, number: 1, rank: 1, label: type}]);
}
ctx.window.HANQ_PASSAGE_LAYOUTS = {};
const explicitTypes = {'notice':'공지', 'E-mail':'이메일', 'article':'기사', 'memo':'메모', 'Custom type':'Custom type'};
for (const [header, type] of Object.entries(explicitTypes)) {
  const text = 'DOCUMENT 1 — ' + header + '\nA synthetic document.';
  const rows = parts(text);
  assert.equal(rows.length, 1); assert.equal(rows[0].type, type); assert.equal(rows[0].label, type);
}
for (const text of [
  'From: A\nTo: B\n\nA quoted message:\nFrom: C\nTo: D',
  'DOCUMENT 1 — E-mail\nX\nDOCUMENT 3 — E-mail\nY',
  'one\n\ntwo\n\nthree'
]) {
  const rows = parts(text); assert.equal(rows.length, 1); assert.equal(rows[0].label, '원문');
}
const unmatched = 'Synthetic notice\nSource has changed.';
ctx.window.HANQ_PASSAGE_LAYOUTS = {[reader.signature(unmatched)]: {parts: [{start: 0, type: '공지', anchor: 'Different source'}]}};
assert.equal(parts(unmatched)[0].label, '원문', 'unmatched reviewed anchors keep the safe fallback');
ctx.window.HANQ_PASSAGE_LAYOUTS = {};
const multi = 'DOCUMENT 1 — E-mail\nFirst.\nDOCUMENT 2 — notice\nSecond.\nDOCUMENT 3 — E-mail\nThird.';
assert.deepEqual(parts(multi).map(p => p.label), ['지문 1 · 첫 번째 이메일', '지문 2 · 첫 번째 공지', '지문 3 · 두 번째 이메일']);
assert.deepEqual(parts(multi).map(p => p.rank), [1, 1, 2]);
const many = Array.from({length: 5}, (_, i) => 'DOCUMENT ' + (i + 1) + ' — notice\nSynthetic document ' + (i + 1) + '.').join('\n');
assert.deepEqual(parts(many).map(p => p.label), ['지문 1 · 첫 번째 공지', '지문 2 · 두 번째 공지', '지문 3 · 세 번째 공지', '지문 4 · 네 번째 공지', '지문 5 · 5번째 공지']);
const reviewed = 'Synthetic first notice.\n\nSynthetic second notice.';
const second = reviewed.indexOf('Synthetic second');
ctx.window.HANQ_PASSAGE_LAYOUTS = {[reader.signature(reviewed)]: {parts: [{start: 0, type: '공지', anchor: 'Synthetic first'}, {start: second, type: '공지', anchor: 'Synthetic second'}]}};
assert.deepEqual(parts(reviewed), [
  {start: 0, end: second, type: '공지', number: 1, rank: 1, label: '지문 1 · 첫 번째 공지'},
  {start: second, end: reviewed.length, type: '공지', number: 2, rank: 2, label: '지문 2 · 두 번째 공지'}
]);
console.log(JSON.stringify({passed: true, singleDocumentTypes: types.length, explicitSingleTypes: Object.keys(explicitTypes).length, sourceAndOffsetsPreserved: true, multiDocumentNumbersAndRanksPreserved: true, fallbackGuardsPreserved: true}));
