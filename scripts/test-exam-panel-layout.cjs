'use strict';
// Synthetic prose only. No source pages, private fixtures, API or browser startup.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require(process.env.JSDOM_PATH || '../.test-tools/node_modules/jsdom');
const reader = require('../media/textbook-semantic.js');
const dom = new JSDOM('<main></main>');
const host = dom.window.document.querySelector('main');
let checks = 0;
function cell(r, c, text, extra = {}) {
  return { id: `synthetic-r${r}-c${c}`, rowIndex: r, columnIndex: c, header: false, lines: [{ spans: [{ text, sourceCharIds: [`synthetic-${r}-${c}`] }] }], ...extra };
}
function fixture(columns) {
  return { schemaVersion: 'hanq-semantic/1', pdfPage: 111, blocks: [{ id: 'synthetic-panel', type: 'table', layoutRole: 'source-exam-panel', columnCount: columns, rows: columns === 2 ? [
    { cells: [cell(0, 0, 'Synthetic label', { header: true, scope: 'row', rowSpan: 2 }), cell(0, 1, 'Synthetic sentence (parentheses), list A and list B. END.')] },
    { cells: [cell(1, 1, 'Synthetic next line\nSynthetic final line END.')] }
  ] : [
    { cells: [cell(0, 0, 'Synthetic label', { header: true, scope: 'row', rowSpan: 2 }), cell(0, 1, 'Synthetic sentence (parentheses), list A and list B. END.', { colSpan: columns - 1 })] },
    { cells: Array.from({ length: columns - 1 }, (_, c) => cell(1, c + 1, `Synthetic subcell ${c + 1} END.`)) }
  ] }] };
}
function snapshot(model) {
  return model.blocks[0].rows.flatMap(row => row.cells.map(c => [c.id, c.lines.map(l => l.spans.map(s => s.text).join('')).join('\n'), c.colSpan || 1, c.rowSpan || 1]));
}
function render(model) {
  const original = JSON.stringify(model);
  reader.render(host, model);
  assert.equal(JSON.stringify(model), original); checks++;
  const table = host.querySelector('table');
  assert.deepEqual([...table.querySelectorAll('td,th')].map(c => [c.dataset.sourceCell, c.textContent, c.colSpan, c.rowSpan]), snapshot(model)); checks++;
  return table;
}
const css = fs.readFileSync(path.join(__dirname, '../media/history-notes-design.css'), 'utf8');
const prefixSelector = '.textbook-source-exam-panel[data-source-column-count="2"] col:first-child';
const headerSelector = '.textbook-source-exam-panel[data-source-column-count="2"] th[scope="row"]';
assert(css.includes(prefixSelector)); assert(css.includes(headerSelector)); checks += 2;
for (const columns of [2, 3, 5]) {
  const model = fixture(columns), table = render(model), region = table.parentElement;
  assert.equal(table.dataset.sourceColumnCount, String(columns));
  assert.equal(region.getAttribute('role'), 'region');
  assert.equal(region.tabIndex, 0);
  assert.equal(host.querySelectorAll('.textbook-exam-scroll-hint').length, columns > 2 ? 1 : 0);
  if (columns > 2) assert.equal(table.style.minWidth, columns * 190 + 'px');
  else assert.match(table.style.minWidth, /^0(?:px)?$/);
  assert.equal(table.querySelector('th').matches(headerSelector), columns === 2);
  assert(!table.hasAttribute('data-reviewed-exam-panel'));
  checks += 7;
  if (columns === 2) {
    assert.deepEqual([...table.querySelectorAll('col')].map(c => c.style.width), ['24%', '76%']);
    assert(table.querySelector('col').matches(prefixSelector)); checks += 2;
  } else {
    assert.equal(table.querySelectorAll('colgroup').length, 0); checks++;
    Object.defineProperties(region, { scrollWidth: { value: 1200 }, clientWidth: { value: 300 } });
    for (const [key, expected] of [['ArrowRight', 48], ['ArrowRight', 96], ['ArrowLeft', 48]]) {
      region.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      assert.equal(region.scrollLeft, expected); checks++;
    }
  }
}
// No text-based join or implicit audit/wrap path, including false split cells.
const split = fixture(3);
split.blocks[0].rows = [{ cells: [cell(0, 0, 'Synthetic label'), cell(0, 1, 'Synthetic sentence pre'), cell(0, 2, 'fix END.')] }];
render(split); assert.equal(host.querySelectorAll('td').length, 3); checks++;
const other = fixture(3); other.blocks[0].layoutRole = 'source-answer-grid';
render(other); assert.equal(host.querySelectorAll('.textbook-exam-scroll-hint').length, 0); checks++;
console.log(JSON.stringify({ checks, failures: 0, scope: 'synthetic DOM, selector scoping, source cell preservation and keyboard scrolling; no browser visual or source fidelity assertion' }));
dom.window.close();
