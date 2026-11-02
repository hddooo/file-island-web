#!/usr/bin/env node
/* Original, tiny synthetic fixtures only. No textbook files or network needed.
 * node scripts/test-textbook-semantic.cjs          DOM + real Chromium checks
 * node scripts/test-textbook-semantic.cjs --dom   DOM checks only
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('../.test-tools/node_modules/jsdom');
const reader = require('../media/textbook-semantic');
const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'media/textbook-semantic.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'media/textbook-semantic.css'), 'utf8');
let checks = 0;
function ok(condition, label) { assert.ok(condition, label); checks++; }
function same(actual, expected, label) { assert.deepEqual(actual, expected, label); checks++; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function lines(text, bold = false) { return [{ spans: [{ text, bold }] }]; }
function cell(rowIndex, columnIndex, text, extras = {}) {
  return { rowIndex, columnIndex, lines: lines(text), ...extras };
}
function fixture() {
  return {
    schemaVersion: 'hanq-semantic/1', pdfPage: 3, printedPage: 'ii', reviewStatus: 'verified',
    blocks: [
      { id: 'heading', type: 'heading', level: 2, lines: lines('작은 연습 자료') },
      { id: 'native', type: 'text', lines: [
        { spans: [{ text: '가  나\t', bold: false }, { text: '강조', bold: true }, { text: ' <img src=x onerror=alert(1)>' }] },
        { spans: [{ text: '다음 줄.  끝.' }] }
      ] },
      { id: 'grid', type: 'table', columnCount: 3, caption: '가상 표', rows: [
        { cells: [cell(0, 0, '첫 범주', { rowSpan: 2, header: true, scope: 'rowgroup' }), cell(0, 1, '위 두 열', { colSpan: 2 })] },
        { cells: [cell(1, 1, '왼쪽'), cell(1, 2, '오른쪽', { lines: lines('오른쪽', true) })] },
        { cells: [cell(2, 0, ''), cell(2, 1, '아래 두 열', { colSpan: 2 })] }
      ] },
      { id: 'tail', type: 'text', lines: lines('마지막 문장.') }
    ], sourceBlanks: [], generatedPractice: []
  };
}
function addFigure(page, extras = {}) {
  page.blocks.push({ id: 'figure', type: 'figure', assetId: 'private-figure', alt: '가상 원', caption: '연습 그림', ...extras });
  return page;
}

async function domChecks() {
  const dom = new JSDOM('<!doctype html><main></main>', { url: 'https://fixture.test/' });
  const { window } = dom, host = window.document.querySelector('main');
  const revoked = []; let made = 0, controller;
  window.URL.createObjectURL = () => 'blob:owned-' + (++made);
  window.URL.revokeObjectURL = url => revoked.push(url);
  const blob = () => new Blob(['synthetic pixels'], { type: 'image/png' });
  try {
    const page = fixture(), before = JSON.stringify(page);
    ok(reader.validatePage(page), 'valid schema');
    controller = reader.render(host, page);
    same(await controller.ready, { cancelled: false, warnings: [] }, 'ready without figures');
    same(JSON.stringify(page), before, 'input is never mutated');
    same([...host.querySelector('.textbook-semantic-content').children].map(e => e.dataset.sourceBlock), ['heading', 'native', 'grid', 'tail'], 'block order preserved');
    same(host.querySelector('[data-source-block=native]').textContent, '가  나\t강조 <img src=x onerror=alert(1)>\n다음 줄.  끝.', 'exact source whitespace and text');
    ok(!host.querySelector('img,script,iframe'), 'source text cannot create HTML');
    same(host.querySelectorAll('strong').length, 2, 'only source bold rendered as strong');
    same(host.querySelector('h2').textContent, '작은 연습 자료', 'source heading');
    same(host.querySelector('table').rows.length, 3, 'row count');
    same([...host.querySelector('table').rows[1].cells].map(e => e.textContent), ['왼쪽', '오른쪽'], 'column source order');
    same(host.querySelector('table').rows[0].cells[0].rowSpan, 2, 'merged row preserved');
    same(host.querySelector('table').rows[0].cells[1].colSpan, 2, 'merged columns preserved');
    same(host.querySelector('table').rows[2].cells[0].textContent, '', 'explicit empty cell preserved');
    same(host.querySelector('th').getAttribute('scope'), 'rowgroup', 'header semantics');
    ok(!host.querySelector('th strong'), 'semantic header does not invent source bold');
    ok(host.querySelector('.textbook-semantic-table-scroll[tabindex="0"][role="region"]'), 'keyboard-accessible table scroller');
    ok(!/PDF 3쪽|교재 ii쪽/.test(host.textContent), 'source page labels omitted from study UI'); same(page.pdfPage,3,'original PDF metadata retained'); same(page.printedPage,'ii','original printed metadata retained');
    ok(host.querySelector('[data-review-status=verified]'), 'explicit verified label');
    ok(!host.querySelector('details'), 'does not invent exercises');

    for (const [name, mutate] of [
      ['schema', p => { p.schemaVersion = 'wrong'; }],
      ['page number', p => { p.pdfPage = 0; }],
      ['unsafe text value', p => { p.blocks[0].lines[0].spans[0].text = {}; }],
      ['heading level', p => { p.blocks[0].level = 7; }],
      ['unknown block', p => { p.blocks.push({ type: 'html', html: '<script></script>' }); }],
      ['reordered columns', p => { p.blocks[2].rows[1].cells.reverse(); }],
      ['reordered rows', p => { p.blocks[2].rows.reverse(); }],
      ['missing column', p => { p.blocks[2].rows[1].cells.pop(); }],
      ['span overflow', p => { p.blocks[2].rows[0].cells[1].colSpan = 3; }],
      ['overlap rowspan', p => { p.blocks[2].rows[1].cells[0].columnIndex = 0; }],
      ['invalid span', p => { p.blocks[2].rows[0].cells[0].rowSpan = 0; }]
    ]) {
      const invalid = fixture(); mutate(invalid);
      assert.throws(() => reader.render(host, invalid), /Invalid semantic textbook/, name); checks++;
      ok(host.contains(controller.element), 'invalid replacement leaves previous view: ' + name);
    }
    assert.throws(() => reader.render(null, page), /DOM host/); checks++;

    const unverified = fixture(); delete unverified.reviewStatus; unverified.printedPage = null;
    unverified.blocks[3].reviewStatus = 'unverified';
    controller = reader.render(host, unverified);
    ok(host.textContent.includes('원문 대조 검수 전'), 'missing verification never means verified');
    ok(!host.textContent.includes('인쇄 쪽 없음'), 'missing print page is not a study UI label'); same(unverified.printedPage,null,'missing print metadata retained');
    ok(host.textContent.includes('이 구간은 원문 대조 검수 전'), 'block-level warning');
    same(host.querySelectorAll('article').length, 1, 'rerender replaces prior view');

    const mapped = fixture();
    mapped.blocks[1].lines = [{ spans: [
      { text: '\uf09f', renderText: '•', mappingAudit: { verified: true, sourceCodePoint: 'U+F09F', renderCodePoint: 'U+2022' } },
      { text: '\uf09f', renderText: '<unsafe substitute>' }
    ] }];
    controller = reader.render(host, mapped);
    same(host.querySelector('[data-source-block=native]').textContent, '•\uf09f', 'only explicitly verified source glyph mapping');
    ok((await controller.ready).warnings.includes('unverified_glyph_mapping'), 'unverified glyph replacement reported');

    const quoted = fixture();
    const quoteCell = quoted.blocks[2].rows[1].cells[0];
    quoteCell.lines = ['앞 문장', '인용 첫째 줄', '인용 둘째 줄', '뒤 문장'].map(text => ({ spans: [{ text }] }));
    quoteCell.lineGroups = [{ kind: 'source-quote', startLine: 1, endLineExclusive: 3, borderStyle: 'dotted' }];
    controller = reader.render(host, quoted);
    same(host.querySelector('tr:nth-child(2) td').textContent, '앞 문장\n인용 첫째 줄\n인용 둘째 줄\n뒤 문장', 'quote grouping does not alter text or line order');
    same(host.querySelector('[data-source-line-group]').textContent, '인용 첫째 줄\n인용 둘째 줄', 'exact source quote boundary');
    same(host.querySelector('[data-source-line-group]').style.borderStyle, 'dotted', 'source quote dotted border preserved');
    const inset = clone(quoted);inset.blocks[2].rows[1].cells[0].lineGroups[0].kind='source-inset';
    controller=reader.render(host,inset);
    same(host.querySelector('[data-source-line-group]').getAttribute('data-source-line-group'),'source-inset','source inset retains its type');
    same(host.querySelector('tr:nth-child(2) td').textContent,'앞 문장\n인용 첫째 줄\n인용 둘째 줄\n뒤 문장','source inset preserves all native text');
    const overlappingQuote = clone(quoted);
    overlappingQuote.blocks[2].rows[1].cells[0].lineGroups.push({ kind: 'source-quote', startLine: 2, endLineExclusive: 4 });
    assert.throws(() => reader.validatePage(overlappingQuote), /lineGroup/); checks++;

    const exercisePage = fixture();
    exercisePage.sourceBlanks = [
      { id: 's1', displayText: '원문의 (  )', answer: '확인된 답', answerVerified: true, source: { pdfPage: 4, printedPage: 2 } },
      { id: 's2', displayText: '원문의 [  ]', answer: '미확인 정답을 숨김', answerVerified: false }
    ];
    exercisePage.generatedPractice = [
      { id: 'g1', prompt: '별도 학습용 ___', answer: '학습 정답', verified: true },
      { id: 'g2', prompt: '검수하지 않은 ___', answer: '누출하면 안 됨' }
    ];
    controller = reader.render(host, exercisePage);
    same(host.querySelectorAll('details').length, 2, 'explicitly verified answers only');
    ok(!host.textContent.includes('미확인 정답을 숨김') && !host.textContent.includes('누출하면 안 됨'), 'unverified answers not in DOM');
    same([...host.querySelectorAll('[data-exercise-kind]')].map(e => e.dataset.exerciseKind), ['source-blank', 'generated-cloze'], 'source blanks clearly distinct from generated cloze');
    ok([...host.querySelectorAll('details')].every(e => !e.open), 'answers collapsed initially');
    ok(!/PDF 4쪽|교재 2쪽/.test(host.textContent), 'exercise page labels omitted');

    controller = reader.render(host, addFigure(fixture(), { assetPath: 'https://unsafe.example/image.png', url: 'javascript:alert(1)' }));
    ok((await controller.ready).warnings.includes('figure_resolver_missing'), 'figure only through resolver');
    ok(!host.querySelector('img'), 'never trusts raw source URL');
    controller = reader.render(host, addFigure(fixture()), { resolveFigure: (block, source) => {
      same(block.assetId, 'private-figure', 'resolver sees asset identity');
      same(source.pdfPage, 3, 'resolver sees source page');
      return blob();
    } });
    await controller.ready;
    same(host.querySelector('img').getAttribute('src'), 'blob:owned-1', 'raster Blob supported');
    host.querySelector('img').dispatchEvent(new window.Event('load'));
    ok(!host.querySelector('.textbook-semantic-figure-status'), 'loaded figure clears status');
    same(host.querySelector('figcaption').textContent, '연습 그림', 'figure caption preserved');
    const ownedController = controller;
    controller = reader.render(host, fixture());
    same(revoked, ['blob:owned-1'], 'rerender revokes owned blob');
    ownedController.cleanup();
    same(revoked, ['blob:owned-1'], 'cleanup idempotent');
    ok(host.contains(controller.element), 'old cleanup cannot remove current view');

    controller = reader.render(host, addFigure(fixture()), { resolveFigure: () => 'blob:caller-owned' });
    await controller.ready; controller.cleanup();
    same(revoked, ['blob:owned-1'], 'supplied blob URL remains caller owned');
    same(host.children.length, 0, 'cleanup removes private content');
    controller = reader.render(host, addFigure(fixture()), { resolveFigure: () => ({ url: 'https://private.example/short-lived-figure' }) });
    await controller.ready;
    ok(host.querySelector('img').src.startsWith('https://private.example/'), 'trusted resolver HTTPS URL accepted');
    same(host.querySelector('img').getAttribute('referrerpolicy'), 'no-referrer', 'figure requests omit referrer');
    host.querySelector('img').dispatchEvent(new window.Event('error'));
    ok(!host.querySelector('img') && host.textContent.includes('불러오지 못했어요'), 'figure network failure shown');

    for (const result of [null, 'javascript:alert(1)', 'data:image/png;base64,AA==', 'http://insecure.example/p.png', new Blob(['<svg/>'], { type: 'image/svg+xml' })]) {
      controller = reader.render(host, addFigure(fixture()), { resolveFigure: () => result });
      ok((await controller.ready).warnings.includes('figure_load_failed'), 'unsafe figure result fails closed');
      ok(!host.querySelector('img'), 'unsafe result is not assigned');
    }
    controller = reader.render(host, addFigure(fixture()), { resolveFigure: () => { throw new Error('offline'); } });
    ok((await controller.ready).warnings.includes('figure_load_failed'), 'sync resolver failure handled');
    controller = reader.render(host, addFigure(fixture()), { resolveFigure: () => Promise.reject(new Error('expired session')) });
    ok((await controller.ready).warnings.includes('figure_load_failed'), 'async resolver failure handled');

    let finish;
    controller = reader.render(host, addFigure(fixture()), { resolveFigure: () => new Promise(resolve => { finish = resolve; }) });
    await Promise.resolve();
    controller.cleanup(); finish(blob());
    ok((await controller.ready).cancelled, 'pending figure cancelled');
    same(made, 1, 'late Blob cannot create orphan object URL');
    same(host.children.length, 0, 'late completion cannot revive private content');
    let called = false;
    controller = reader.render(host, addFigure(fixture()), { resolveFigure: () => { called = true; return blob(); } });
    controller.cleanup(); await controller.ready;
    ok(!called, 'immediate cleanup prevents resolver request');
    const withMap = fixture();
    withMap.blocks[2].figures = [{ type: 'figure', assetId: 'shared-map', alt: '두 행과 관련된 지도', sourceRowIndices: [0, 1] }];
    controller = reader.render(host, withMap, { resolveFigure: () => 'blob:shared-map' });
    await controller.ready;
    same(host.querySelector('.textbook-semantic-table-group figure').dataset.sourceRows, '0,1', 'table figure associated with all its original rows');
    same(host.querySelector('.textbook-semantic-table-group img').alt, '두 행과 관련된 지도', 'shared figure source caption preserved');
    same(window.localStorage.length, 0, 'no private text persisted');
  } finally { if (controller) controller.cleanup(); window.close(); }
}

async function browserChecks() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  let count = 0;
  try {
    const page = await browser.newPage();
    const errors = [], requests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => requests.push(r.url()));
    for (const width of [320, 360, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent('<!doctype html><html lang="ko"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px;font-family:Arial,sans-serif}main{max-width:1120px;margin:auto;min-width:0}</style><main></main></html>');
      await page.addStyleTag({ content: css });
      await page.addScriptTag({ content: js });
      await page.evaluate(data => { window.testView = HanqTextbookSemantic.render(document.querySelector('main'), data); }, fixture());
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no document overflow at ' + width); count++;
      ok(await page.locator('.textbook-semantic-text,td,th').evaluateAll(nodes => nodes.every(n => parseFloat(getComputedStyle(n).fontSize) >= 16)), 'body and table at least 16px at ' + width); count++;
      same(await page.locator('strong').first().evaluate(n => getComputedStyle(n).color), 'rgb(10, 60, 130)', 'source bold deep blue at ' + width); count++;
      same(await page.locator('tr').nth(1).locator('td').allTextContents(), ['왼쪽', '오른쪽'], 'same column order at ' + width); count++;
      if (width < 600) {
        ok(await page.locator('.textbook-semantic-table-scroll').evaluate(n => n.scrollWidth > n.clientWidth), 'table scrolls at ' + width); count++;
        await page.locator('.textbook-semantic-table-scroll').focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(150);
        ok(await page.locator('.textbook-semantic-table-scroll').evaluate(n => n.scrollLeft > 0), 'keyboard table scroll at ' + width); count++;
      }
      const positions = await page.locator('tr').nth(1).locator('td').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().left));
      ok(positions[0] < positions[1], 'columns not visually reordered at ' + width); count++;
      await page.evaluate(() => testView.cleanup());
      same(await page.locator('main').textContent(), '', 'cleanup clears browser DOM at ' + width); count++;
      const narrow = fixture();
      narrow.blocks[2] = { type: 'table', columnCount: 2, rows: [
        { cells: [cell(0, 0, '왼쪽 범주', { rowSpan: 2 }), cell(0, 1, '오른쪽 내용은 작은 화면에서 자연스럽게 여러 줄로 읽을 수 있도록 그대로 유지합니다.')] },
        { cells: [cell(1, 1, '다음 내용도 같은 오른쪽 열입니다.')] }
      ] };
      await page.evaluate(data => { window.testView = HanqTextbookSemantic.render(document.querySelector('main'), data); }, narrow);
      ok(await page.locator('.textbook-semantic-table-scroll').evaluate(n => n.scrollWidth <= n.clientWidth + 1), 'two-column source table fits viewport at ' + width); count++;
      same(await page.locator('tr').first().locator('td').allTextContents(), ['왼쪽 범주', '오른쪽 내용은 작은 화면에서 자연스럽게 여러 줄로 읽을 수 있도록 그대로 유지합니다.'], 'two-column source order unchanged at ' + width); count++;
      same(await page.locator('tr').first().locator('td').first().evaluate(n => n.rowSpan), 2, 'two-column merged cell unchanged at ' + width); count++;
    }
    same(errors, [], 'no browser runtime exceptions'); count++;
    same(requests, [], 'text-only page makes zero network requests'); count++;
  } finally { await browser.close(); }
  return count;
}

(async () => {
  await domChecks();
  const dom = checks;
  const browser = process.argv.includes('--dom') ? null : await browserChecks();
  console.log(JSON.stringify({ checks, failures: 0, domChecks: dom, browserChecks: browser, widths: browser == null ? [] : [320, 360, 390, 430, 768, 1440], fixtures: 'original synthetic text only', scope: 'isolated semantic renderer; not source fidelity, live authentication, or integration' }, null, 2));
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
