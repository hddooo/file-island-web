#!/usr/bin/env node
/* Semantic/group integration unit tests. Synthetic source by default.
 * --private [semantic-root] checks local source metadata without uploading or
 * claiming real-browser, raster decoding, authentication, or visual fidelity QA.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('../.test-tools/node_modules/jsdom');
const semantic = require('../media/textbook-semantic');
const figureGroups = require('../media/textbook-figure-groups');
let checks = 0;
function ok(value, message) { assert.ok(value, message); checks++; }
function same(actual, expected, message) { assert.deepEqual(actual, expected, message); checks++; }
function line(text, extras = {}) { return { spans: [{ text, ...extras }] }; }
function text(id, value, extras = {}) { return { id, type: 'text', lines: [line(value)], ...extras }; }
function figure(id, bbox, extras = {}) { return { id, type: 'figure', assetId: id, bbox, alt: '가상 그림 ' + id, ...extras }; }
function fixture() {
  const shared = { captionBlockId: 'caption', sourceCompositeGroupId: 'artwork', associationReviewStatus: 'source-render-checked' };
  return {
    schemaVersion: 'hanq-semantic/1', pdfPage: 7, printedPage: 2, width: 600, height: 800,
    blocks: [
      text('intro', '시작  문장.'),
      figure('strip-a', [100, 100, 200, 140], shared),
      text('middle', '그림 조각 사이의 원문.'),
      figure('strip-b', [100, 140, 200, 200], shared),
      text('caption', '안전한 설명 <img src=x onerror=alert(1)>', { role: 'figure-caption', reviewStatus: 'verified', associatedAssetIds: ['strip-a', 'strip-b'], lines: [line('안전한 설명 <img src=x onerror=alert(1)>', { bold: true }), line('둘째\t줄.')] }),
      figure('whole', [300, 300, 400, 420], { captionBlockId: 'caption-whole', sourceCompositeGroupId: 'whole-artwork', associationReviewStatus: 'source-render-checked' }),
      text('caption-whole', '한 장짜리 그림 설명.', { role: 'figure-caption', reviewStatus: 'verified', associatedAssetIds: ['whole'] }),
      text('end', '마지막 원문.')
    ], sourceBlanks: [], generatedPractice: []
  };
}
function displayLine(value) { return value.spans.map(span => typeof span.renderText === 'string' && span.mappingAudit?.verified === true ? span.renderText : span.text).join(''); }
function nativeLines(page) {
  return page.blocks.flatMap(block => block.type === 'table' ? block.rows.flatMap(row => row.cells.flatMap(cell => cell.lines.map(displayLine))) : (block.lines || []).map(displayLine));
}
function renderedLines(host) { return [...host.querySelectorAll('.textbook-semantic-content .textbook-semantic-line')].map(el => el.textContent); }
function sourceFigures(page) { return page.blocks.flatMap(block => block.type === 'table' ? block.figures || [] : block.type === 'figure' ? [block] : []); }
function baseOptions(extras = {}) { return { figureGroups, ...extras }; }
function findByBlock(host, id) { return [...host.querySelectorAll('[data-source-block]')].find(el => el.dataset.sourceBlock === id); }
async function syntheticChecks() {
  const dom = new JSDOM('<main></main><aside></aside>', { url: 'https://fixture.test/' });
  const window = dom.window, host = window.document.querySelector('main'), otherHost = window.document.querySelector('aside');
  const created = [], revoked = []; let sequence = 0, controller, otherController;
  window.URL.createObjectURL = () => { const url = 'blob:integration-' + (++sequence); created.push(url); return url; };
  window.URL.revokeObjectURL = url => revoked.push(url);
  const blob = () => new Blob(['synthetic pixels'], { type: 'image/png' });
  const settle = () => new Promise(resolve => setImmediate(resolve));
  try {
    const page = fixture(), original = JSON.stringify(page), calls = [];
    controller = semantic.render(host, page, baseOptions({ resolveFigure: f => { calls.push(f.assetId); return blob(); } }));
    same(await controller.ready, { cancelled: false, warnings: [] }, 'group resolver completion joins semantic readiness');
    same(calls, ['strip-a', 'strip-b', 'whole'], 'each actual source image resolved once');
    same(host.querySelectorAll('.textbook-figure-group').length, 2, 'two strips become one illustration plus whole artwork');
    same(host.querySelectorAll('.textbook-figure-group-part').length, 3, 'all three actual image assets retained');
    same([...host.querySelectorAll('.textbook-semantic-content > [data-source-block]')].map(el => el.dataset.sourceBlock), ['intro', 'strip-a', 'middle', 'caption', 'whole', 'caption-whole', 'end'], 'composite anchored at first source figure without moving text');
    same(renderedLines(host), nativeLines(page), 'every native source line remains exactly once and in order');
    same(host.querySelectorAll('figcaption').length, 0, 'linked native captions not duplicated inside figure');
    same(findByBlock(host, 'strip-a').dataset.sourceFigureBlocks, 'strip-a strip-b', 'composite retains both source block identities');
    ok(!findByBlock(host, 'strip-b'), 'later fragment slot consumed only once');
    same(host.querySelectorAll('script,iframe').length, 0, 'caption source text never becomes active markup');
    same(host.querySelectorAll('img').length, 3, 'unsafe text cannot create an extra image');
    for (const figureNode of host.querySelectorAll('figure[aria-describedby]')) {
      const caption = window.document.getElementById(figureNode.getAttribute('aria-describedby'));
      ok(caption && host.contains(caption), 'verified caption ARIA link resolves in same reader');
      same(caption.dataset.sourceCaption, figureNode.dataset.sourceCaption, 'DOM association names exact source caption');
      same(caption.style.fontSize, '16px', 'source-position caption remains at least 16px');
      same(figureNode.dataset.captionPlacement, 'source-order', 'caption remains in native reading order');
    }
    same(host.querySelectorAll('figure[aria-describedby]').length, 2, 'singleton composite identity normalized to intact illustration');
    const canvas = findByBlock(host, 'strip-a').querySelector('.textbook-figure-group-canvas');
    same(canvas.style.visibility, 'hidden', 'atomic group not exposed until every image loads');
    const strips = [...findByBlock(host, 'strip-a').querySelectorAll('img')];
    strips[0].dispatchEvent(new window.Event('load'));
    same(canvas.style.visibility, 'hidden', 'first loaded strip cannot show incomplete image');
    strips[1].dispatchEvent(new window.Event('load'));
    same(canvas.style.visibility, 'visible', 'complete synthetic load reveals composition');
    same(JSON.stringify(page), original, 'semantic integration never mutates source page');

    otherController = semantic.render(otherHost, page, baseOptions({ isFigureAvailable: () => false }));
    await otherController.ready;
    const firstCaptionIds = new Set([...host.querySelectorAll('[id]')].map(el => el.id));
    ok([...otherHost.querySelectorAll('[id]')].every(el => !firstCaptionIds.has(el.id)), 'two readers have distinct caption anchor IDs');
    otherController.cleanup();
    controller.cleanup(); controller.cleanup();
    same(revoked.length, created.length, 'semantic cleanup revokes all grouped owned URLs');
    same(host.children.length, 0, 'semantic cleanup removes composed reader');

    const unavailableCalls = [];
    controller = semantic.render(host, page, baseOptions({ isFigureAvailable: f => f.assetId !== 'strip-b', resolveFigure: f => { unavailableCalls.push(f.assetId); return blob(); } }));
    const unavailable = await controller.ready;
    same(unavailableCalls, ['whole'], 'one unavailable strip prevents doomed fetches for entire composite');
    ok(unavailable.warnings.includes('figure_unavailable'), 'child availability warning reaches semantic ready result');
    same(findByBlock(host, 'strip-a').querySelectorAll('img').length, 0, 'unavailable atomic group shows no partial image');
    ok(findByBlock(host, 'strip-a').textContent.includes('원문 그림 준비 중'), 'unavailable group has explicit placeholder');
    same(renderedLines(host), nativeLines(page), 'unavailable group preserves all native captions and text');
    same(host.querySelectorAll('figure[aria-describedby]').length, 2, 'caption association survives missing image');

    controller = semantic.render(host, page, baseOptions({ resolveFigure: f => f.assetId === 'strip-b' ? Promise.reject(new Error('unavailable')) : blob() }));
    ok((await controller.ready).warnings.includes('figure_load_failed'), 'resolver failure propagates to semantic warnings');
    same(findByBlock(host, 'strip-a').querySelectorAll('img').length, 0, 'failed composite discards already resolved sibling');
    ok(findByBlock(host, 'strip-a').textContent.includes('불러오지 못했어요'), 'failed group remains visible as explicit status');
    same(renderedLines(host), nativeLines(page), 'failure never removes source captions');

    let finish;
    const delayed = new Promise(resolve => { finish = resolve; });
    controller = semantic.render(host, page, baseOptions({ resolveFigure: () => delayed }));
    await settle();
    const prior = controller, beforeLate = created.length;
    controller = semantic.render(host, page, baseOptions({ isFigureAvailable: () => false }));
    finish(blob());
    ok((await prior.ready).cancelled, 'replaced semantic reader reports cancellation');
    await controller.ready;
    same(created.length, beforeLate, 'late resolver creates no orphaned URL');
    same(host.querySelectorAll('img').length, 0, 'late image never enters replacement reader');
    same(host.querySelectorAll('article').length, 1, 'only current semantic reader survives');

    const unverified = fixture(); unverified.blocks.find(b => b.id === 'caption').reviewStatus = 'unverified';
    controller = semantic.render(host, unverified, baseOptions({ isFigureAvailable: () => false }));
    await controller.ready;
    same(host.querySelectorAll('[data-top-level-group-fallback]').length, 2, 'unverified composite explicitly split into source-position fallbacks');
    same(host.querySelectorAll('figure[aria-describedby]').length, 1, 'unverified caption association is never linked');
    ok(findByBlock(host, 'strip-a') && findByBlock(host, 'strip-b'), 'unsupported group retains both original source figure positions');
    same(renderedLines(host), nativeLines(unverified), 'unverified captions and intervening text remain unchanged');

    const missingCaption = fixture(); missingCaption.blocks = missingCaption.blocks.filter(b => b.id !== 'caption');
    controller = semantic.render(host, missingCaption, baseOptions({ isFigureAvailable: () => false }));
    await controller.ready;
    ok(findByBlock(host, 'strip-b'), 'missing source caption cannot authorize a join');
    same(renderedLines(host), nativeLines(missingCaption), 'missing metadata never hides unrelated source lines');

    const badGeometry = fixture(); badGeometry.blocks.find(b => b.id === 'strip-b').bbox[1] = 160;
    controller = semantic.render(host, badGeometry, baseOptions({ isFigureAvailable: () => false }));
    await controller.ready;
    ok(findByBlock(host, 'strip-b'), 'source geometry gap cannot be silently joined');
    same(renderedLines(host), nativeLines(badGeometry), 'geometry fallback preserves source caption order');

    const duplicated = fixture(); duplicated.blocks[3].assetId = 'strip-a'; const duplicateCalls = [];
    controller = semantic.render(host, duplicated, baseOptions({ resolveFigure: f => { duplicateCalls.push(f.assetId); return blob(); } }));
    const ambiguous = await controller.ready;
    same(duplicateCalls, ['whole'], 'ambiguous asset identity is never resolved multiple times');
    ok(ambiguous.warnings.includes('ambiguous_figure_asset'), 'ambiguous identities produce explicit warning');
    same(renderedLines(host), nativeLines(duplicated), 'ambiguous image identity preserves every native text line');

    const ownCaption = fixture(); ownCaption.blocks.push(figure('plain', [10, 600, 50, 650], { caption: '원래 그림 속성 설명' }));
    controller = semantic.render(host, ownCaption, baseOptions({ isFigureAvailable: () => false }));
    await controller.ready;
    same(host.querySelectorAll('figcaption').length, 1, 'unreferenced inline caption is still rendered');
    same(host.querySelector('figcaption').textContent, '원래 그림 속성 설명', 'original inline caption wording retained');

    controller = semantic.render(host, page, { isFigureAvailable: () => false });
    await controller.ready;
    same(host.querySelectorAll('.textbook-semantic-figure').length, 3, 'legacy renderer remains available without helper');
    same(renderedLines(host), nativeLines(page), 'legacy no-helper path keeps original native text');
    controller.cleanup();
    same(new Set(revoked).size, revoked.length, 'owned URLs revoked at most once');
    same(revoked.length, created.length, 'all synthetic object URLs released after interrupted flows');
  } finally { controller?.cleanup(); otherController?.cleanup(); dom.window.close(); }
}

async function privateChecks(directory) {
  const dom = new JSDOM('<main></main>'), host = dom.window.document.querySelector('main');
  let controller;
  try {
    for (const [number, groupCount, linkCount] of [[9, 6, 0], [11, 3, 0], [47, 2, 0], [54, 17, 0], [79, 11, 11], [103, 10, 10], [114, 2, 2], [115, 2, 2], [137, 14, 0], [138, 16, 0], [139, 0, 0], [140, 0, 0]]) {
      const page = JSON.parse(fs.readFileSync(path.join(directory, 'pages', 'page-' + String(number).padStart(3, '0') + '.json'), 'utf8'));
      const original = JSON.stringify(page), assets = sourceFigures(page).map(f => f.assetId);
      let fetches = 0;
      controller = semantic.render(host, page, baseOptions({ isFigureAvailable: () => false, resolveFigure: () => { fetches++; throw new Error('Private unit checks never resolve source pixels'); } }));
      await controller.ready;
      same(fetches, 0, 'PDF ' + number + ': no image fetch without availability');
      same(host.querySelectorAll('.textbook-figure-group').length, groupCount, 'PDF ' + number + ': expected logical illustrations');
      same(host.querySelectorAll('figure[aria-describedby]').length, linkCount, 'PDF ' + number + ': expected checked caption associations');
      same(host.querySelectorAll('[data-top-level-group-fallback]').length, 0, 'PDF ' + number + ': no unsupported standalone associations');
      same(renderedLines(host), nativeLines(page), 'PDF ' + number + ': every native line once in original reading order');
      const displayedAssets = [...host.querySelectorAll('.textbook-figure-group-part')].map(el => el.dataset.sourceAsset);
      same(displayedAssets.slice().sort(), assets.slice().sort(), 'PDF ' + number + ': all source assets accounted for exactly once');
      same(new Set(displayedAssets).size, assets.length, 'PDF ' + number + ': no duplicated source image');
      for (const element of host.querySelectorAll('figure[aria-describedby]')) {
        const caption = dom.window.document.getElementById(element.getAttribute('aria-describedby'));
        ok(caption && host.contains(caption), 'PDF ' + number + ': checked caption anchor exists');
        const source = page.blocks.find(b => b.id === caption.dataset.sourceCaption);
        same(caption.textContent, source.lines.map(displayLine).join('\n'), 'PDF ' + number + ': exact checked caption text retained');
        same(caption.style.fontSize, '16px', 'PDF ' + number + ': checked captions remain 16px');
      }
      if (number === 79) {
        const tiger = [...host.querySelectorAll('[data-source-figure-blocks]')].find(el => el.dataset.sourceFigureBlocks.includes('p079-figure-7'));
        same(tiger.querySelectorAll('.textbook-figure-group-part').length, 4, 'PDF 79: all four tiger strips form one logical image');
        same(tiger.querySelector('figure').dataset.sourceCaption, 'p079-outside-21-caption-3', 'PDF 79: tiger keeps exact checked source caption');
        ok(!findByBlock(host, 'p079-figure-8') && !findByBlock(host, 'p079-figure-9') && !findByBlock(host, 'p079-figure-10'), 'PDF 79: later tiger strips never appear as independent artworks');
      }
      if (number === 115) {
        const map = [...host.querySelectorAll('[data-source-figure-blocks]')].find(el => el.dataset.sourceFigureBlocks.includes('p115-figure-1'));
        same(map.querySelectorAll('.textbook-figure-group-part').length, 3, 'PDF 115: map forms one three-fragment image');
      }
      if (number === 54) same(host.querySelectorAll('figcaption').length, 0, 'PDF 54: table caption text not duplicated during standalone integration');
      same(JSON.stringify(page), original, 'PDF ' + number + ': source metadata untouched');
      controller.cleanup();
    }
  } finally { controller?.cleanup(); dom.window.close(); }
}

(async () => {
  await syntheticChecks();
  const index = process.argv.indexOf('--private');
  if (index !== -1) await privateChecks(path.resolve(process.argv[index + 1] || path.join(__dirname, '../../hanq-semantic-preview')));
  console.log('PASS: ' + checks + ' semantic top-level figure DOM assertions' + (index !== -1 ? ', including 12 private source pages' : '') + '. No real-browser or decoded-image QA claimed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
