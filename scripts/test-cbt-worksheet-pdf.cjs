// Run with node cbt-worksheet-pdf.test.cjs. No DOM or image codec required.
const assert = require('node:assert/strict');
const pages = [];
let labels = [], cells = 0;
const ctx = {
  fillRect() {}, strokeRect() { cells++; },
  measureText(s) { return {width: s.length * 30}; },
  fillText(s) { labels.push(s); }
};
const canvas = {
  getContext: () => ctx,
  toBlob(done) {
    pages.push(labels);
    labels = [];
    done(new Blob([Uint8Array.of(255, 216, 255, 217)], {type: 'image/jpeg'}));
  }
};
global.window = {Blob, document: {createElement: () => canvas}};
if(process.env.HANQ_PDF_WRITER)require('node:vm').runInThisContext(process.env.HANQ_PDF_WRITER);else require('../media/cbt-worksheet-pdf.js');

(async () => {
  const items = Array.from({length: 700}, (_, i) => ({
    exam: 67 + Math.floor(i / 50), number: 1 + i % 50,
    review: {correctNumber: 1 + i % 5}
  }));
  const long = '가'.repeat(5000) + '끝';
  items[0].parts = {stem: [long]};
  const pdf = await window.HanqCbtWorksheetPdf.create(window, items, null, 'explanations');
  assert.equal(pdf.type, 'application/pdf');
  assert.equal(cells, 700);
  assert.equal(pages[0].length, 1401);
  assert.equal(pages[0].at(-2), '700');
  assert.equal(pages.flat().filter(s => /가|끝/.test(s)).join(''), '지문 해설 ' + long);
  const bytes = Buffer.from(await pdf.arrayBuffer()).toString('latin1');
  const start = Number(/startxref\n(\d+)\n%%EOF/.exec(bytes)[1]);
  const rows = bytes.slice(start).split('\n');
  assert.equal(rows[0], 'xref');
  const objects = 2 + 3 * pages.length;
  assert.equal(rows[1], '0 ' + (objects + 1));
  for (let id = 1; id <= objects; id++) {
    assert.ok(bytes.startsWith(id + ' 0 obj\n', Number(rows[id + 2].slice(0, 10))));
  }
  for (const match of bytes.matchAll(/\/Length (\d+) >>\nstream\n/g)) {
    const end = match.index + match[0].length + Number(match[1]);
    assert.match(bytes.slice(end), /^\n?endstream/);
  }
  process.stdout.write('PDF structure and 700-entry pagination passed\n');
})().catch(e => { console.error(e); process.exitCode = 1; });
