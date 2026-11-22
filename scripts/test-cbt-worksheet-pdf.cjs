// Run with node cbt-worksheet-pdf.test.cjs. No DOM or image codec required.
const assert = require('node:assert/strict');
const pages = [];
let labels = [], cells = 0, draws = [], pageDraws = [];
const ctx = {
  drawImage(img, x, y, width, height) { draws.push([img.src, x, y, width, height]); },
  fillRect() {}, strokeRect() { cells++; },
  measureText(s) { return {width: s.length * 30}; },
  fillText(s) { labels.push(s); }
};
const canvas = {
  getContext: () => ctx,
  toBlob(done) {
    pages.push(labels);
    pageDraws.push(draws);
    draws = [];
    labels = [];
    done(new Blob([Uint8Array.of(255, 216, 255, 217)], {type: 'image/jpeg'}));
  }
};
class Image {set src(value) {this.url = value; this.naturalWidth = this.naturalHeight = 1; this.onload();} get src() {return this.url;}}
global.window = {Blob, Image, document: {createElement: () => canvas}};
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
  pages.length = pageDraws.length = 0;
  const ratios = [1.44, 1.12, 1.04, 1.44, 0.81, 0.89, 1.01, 1.15, 1.19];
  const questions = ratios.map((_, i) => ({exam: 76, number: i + 1, image: 'q' + i}));
  questions.push({exam: 72, number: 47, image: 'tall', common: {image: 'common'}});
  const pictures = new Map([...ratios.map((r, i) => ['q' + i, {url: 'blob:q' + i, ratio: r}]),
    ['tall', {url: 'blob:tall', ratio: 2}], ['common', {url: 'blob:common', ratio: 1.5}]]);
  await window.HanqCbtWorksheetPdf.create(window, questions, pictures, 'questions');
  assert.ok(pages.every(page => page[0] === '문제지' && page.every(s => !s.includes('내 답'))));
  assert.deepEqual(pages.flat().filter(s => /^\d+$/.test(s)).map(Number), questions.map((_,i) => i + 1));
  assert.ok(pages[0].includes('(76회-1번)') && pages.at(-1).includes('(72회-47번)'));
  assert.ok(pages.slice(0, 2).every(page => [4, 5].includes(page.filter(s => /^\d+$/.test(s)).length)));
  assert.deepEqual(pageDraws.flat().map(row => row[0]),
    [...ratios.map((_,i) => 'blob:q'+i), 'blob:common', 'blob:tall']);
  for (const [url, x, y, width, height] of pageDraws.flat()) {
    assert.ok(x >= 90 && x + width <= 1590 && y + height <= 2286);
    assert.equal(height, width * pictures.get(url.slice(5)).ratio);
    if (url.startsWith('blob:q')) assert.ok(width >= 732 * 0.9);
  }
  process.stdout.write('PDF structure, 700-entry answer pagination, and question layout passed\n');
})().catch(e => { console.error(e); process.exitCode = 1; });
