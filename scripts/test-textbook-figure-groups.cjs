#!/usr/bin/env node
/* Synthetic DOM/unit tests. --private [semantic-root] additionally checks local
 * private source geometry without copying assets or claiming browser QA.
 * node scripts/test-textbook-figure-groups.cjs
 * node scripts/test-textbook-figure-groups.cjs --private ../hanq-semantic-preview
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('../.test-tools/node_modules/jsdom');
const renderer = require('../media/textbook-figure-groups');
let checks = 0;
function ok(value, message) { assert.ok(value, message); checks++; }
function same(actual, expected, message) { assert.deepEqual(actual, expected, message); checks++; }
function near(actual, expected, message) { ok(Math.abs(actual - expected) < 0.000001, message); }
function copy(value) { return JSON.parse(JSON.stringify(value)); }
function line(text, bold = false) { return { spans: [{ text, bold }] }; }
function fixture() {
  const figures = [
    { id: 'f1', assetId: 'upper', type: 'figure', bbox: [200, 100, 300, 150], alt: '합성 연습 위쪽', sourceRowIndices: [1] },
    { id: 'f2', assetId: 'lower', type: 'figure', bbox: [200, 150, 300, 250], alt: '합성 연습 아래쪽', sourceRowIndices: [1] }
  ];
  const group = { assetIds: ['upper', 'lower'], relationship: 'vertical-contiguous-fragments-of-one-source-illustration', reviewStatus: 'verified', captionCellId: 'caption', sourceBBox: [200, 100, 300, 250] };
  const table = { id: 'table', type: 'table', figures, figureGroups: [group], rows: [{ cells: [{ id: 'caption', rowIndex: 1, columnIndex: 1, bbox: [150, 90, 350, 290], lines: [line('본문은 그대로 둠'), line('정확한  설명 <img src=x onerror=alert(1)>', true), line('두 번째\t줄')], sourceAssociations: [{ kind: 'source-figure-caption', assetIds: ['upper', 'lower'], startLine: 1, endLineExclusive: 3, reviewStatus: 'verified' }] }] }] };
  return { page: { pdfPage: 4, width: 600, height: 800, blocks: [table] }, group, table, figures };
}
function standalone() {
  const p = { pdfPage: 5, width: 600, height: 800, blocks: [] };
  for (let i = 0; i < 3; i++) p.blocks.push({ id: 'part' + i, assetId: 'part' + i, type: 'figure', bbox: [100, 100 + i * 30, 180, 130 + i * 30], sourceCompositeGroupId: 'caption', captionBlockId: 'caption', associationReviewStatus: 'source-render-checked' });
  p.blocks.push({ id: 'caption', role: 'figure-caption', type: 'text', reviewStatus: 'verified', associatedAssetIds: ['part0', 'part1', 'part2'], lines: [line('검증된 원문 설명')] });
  return p;
}
async function domChecks() {
  const dom = new JSDOM('<!doctype html><main></main>', { url: 'https://fixture.test/' });
  const window = dom.window, host = window.document.querySelector('main');
  let counter = 0; const revoked = [], made = [];
  window.URL.createObjectURL = () => { const url = 'blob:owned-' + (++counter); made.push(url); return url; };
  window.URL.revokeObjectURL = url => revoked.push(url);
  const raster = () => new Blob(['synthetic raster'], { type: 'image/png' });
  const settle = () => new Promise(resolve => setImmediate(resolve));
  let current;
  try {
    const { page, group, table } = fixture(), original = JSON.stringify(page);
    const info = renderer.describe(page, group);
    ok(info.supported, 'reviewed vertical group supported');
    same(info.bbox, [200, 100, 300, 250], 'union uses original source coordinates');
    same(info.caption.startLine, 1, 'caption uses exact associated range');
    same(info.caption.endLineExclusive, 3, 'caption range end retained');
    same(info.targetCell, { id: 'caption', tableId: 'table', rowIndex: 1, columnIndex: 1, method: 'exact-source-bbox-containment' }, 'unique source cell containment');
    same(renderer.groupsFor(page, table).length, 1, 'table grouping consumes fragments once');
    same(renderer.groupsFor(page).length, 0, 'top-level grouping does not duplicate table images');
    const called = [];
    current = renderer.render(host, page, group, { resolveFigure: f => { called.push(f.assetId); return raster(); } });
    same(await current.ready, { cancelled: false, warnings: [], supported: true }, 'ready waits for resolver work');
    same(called, ['upper', 'lower'], 'resolver called once in source order');
    same(host.querySelectorAll('.textbook-figure-group-canvas').length, 1, 'one figure-only canvas');
    const parts = [...host.querySelectorAll('.textbook-figure-group-part')];
    same(parts.map(e => e.dataset.sourceAsset), ['upper', 'lower'], 'source order retained');
    near(parseFloat(parts[0].style.top), 0, 'first strip top');
    near(parseFloat(parts[0].style.height), 100 / 3, 'first strip exact source height');
    near(parseFloat(parts[1].style.top), 100 / 3, 'unequal second strip top');
    near(parseFloat(parts[1].style.height), 200 / 3, 'unequal second strip height');
    same(parts.map(e => e.style.width), ['100%', '100%'], 'fragment widths are unsliced');
    same(host.querySelector('figcaption').style.fontSize, '16px', 'caption minimum size explicitly 16px');
    same(host.querySelector('figcaption').textContent, '정확한  설명 <img src=x onerror=alert(1)>\n두 번째\t줄', 'caption exact text and whitespace');
    same(host.querySelectorAll('img').length, 2, 'caption markup cannot create extra image');
    same(host.querySelectorAll('script,iframe').length, 0, 'source content never interpreted as HTML');
    same(host.querySelectorAll('figcaption strong').length, 1, 'source bold preserved');
    ok(!host.textContent.includes('본문은 그대로 둠'), 'unassociated body line is not moved as caption');
    same(host.querySelectorAll('.textbook-figure-part-status').length, 2, 'ready does not claim decoded images');
    [...host.querySelectorAll('img')].forEach(img => img.dispatchEvent(new window.Event('load')));
    same(host.querySelectorAll('.textbook-figure-part-status').length, 0, 'actual load removes statuses');
    same(JSON.stringify(page), original, 'input page remains unchanged');
    current.cleanup(); current.cleanup();
    same(revoked.length, 2, 'each owned Blob URL revoked once');
    same(host.children.length, 0, 'cleanup removes owned DOM');

    const reverse = copy(group); reverse.assetIds.reverse();
    same(renderer.describe(page, reverse).members.map(f => f.assetId), ['upper', 'lower'], 'descriptor order cannot reorder source figure DOM');
    for (const [name, mutate, code] of [
      ['unknown relation', f => { f.group.relationship = 'guess-a-grid'; }, 'unsupported_group_relationship'],
      ['unverified join', f => { f.group.reviewStatus = 'unverified'; }, 'unverified_fragment_association'],
      ['overlap', f => { f.figures[1].bbox[1] = 145; }, 'fragment_gap_or_overlap'],
      ['gap', f => { f.figures[1].bbox[1] = 160; }, 'fragment_gap_or_overlap'],
      ['width mismatch', f => { f.figures[1].bbox[0] = 210; }, 'fragment_width_mismatch'],
      ['invalid numbers', f => { f.figures[1].bbox[1] = NaN; }, 'invalid_figure_bbox'],
      ['out of page', f => { f.figures[1].bbox[3] = 900; }, 'figure_outside_page'],
      ['wrong source union', f => { f.group.sourceBBox[3] = 251; }, 'source_bbox_mismatch'],
      ['duplicate IDs', f => { f.group.assetIds.push('upper'); }, 'duplicate_asset_ids'],
      ['missing member', f => { f.group.assetIds.push('absent'); }, 'missing_figure_asset'],
      ['wrong caption range', f => { f.table.rows[0].cells[0].sourceAssociations[0].endLineExclusive = 20; }, 'invalid_caption_range'],
      ['unverified caption', f => { f.table.rows[0].cells[0].sourceAssociations[0].reviewStatus = 'unverified'; }, 'unverified_caption_association']
    ]) {
      const f = fixture(); mutate(f);
      const d = renderer.describe(f.page, f.group);
      ok(!d.supported && d.errors.includes(code), name + ' gets explicit unsupported result');
      current = renderer.render(host, f.page, f.group, { isFigureAvailable: () => false, resolveFigure: () => { throw new Error('doomed fetch'); } });
      await current.ready;
      ok(host.querySelector('.textbook-figure-group-fallback'), name + ' has visible fallback notice');
      same(host.querySelectorAll('.textbook-figure-group-canvas').length, 0, name + ' never guesses geometry');
      same(host.querySelectorAll('.textbook-figure-group-part').length, 2, name + ' retains both actual figure records');
    }
    const unavailable = [];
    current = renderer.render(host, page, group, { isFigureAvailable: f => f.assetId !== 'lower', resolveFigure: f => { unavailable.push(f.assetId); return 'https://authenticated.example.test/image.png'; } });
    ok((await current.ready).warnings.includes('figure_unavailable'), 'unavailable member remains explicit');
    same(unavailable, [], 'unavailable group never triggers partial fetch');
    same(host.querySelector('[data-source-asset=lower][data-figure-state]').dataset.figureState, 'figure_unavailable', 'missing fragment position preserved');
    ok(host.textContent.includes('정확한  설명'), 'captions remain readable with missing images');
    const beforeTrustedCleanup = revoked.length;
    current.cleanup();
    same(revoked.length, beforeTrustedCleanup, 'caller-supplied HTTPS URL not revoked');

    for (const bad of ['javascript:alert(1)', 'data:image/png;base64,aA==', 'http://insecure.test/x', 'https://valid.test/a\ninvalid', { url: 'javascript:alert(1)' }, new Blob(['<svg/>'], { type: 'image/svg+xml' }), null]) {
      current = renderer.render(host, page, group, { resolveFigure: () => bad });
      ok((await current.ready).warnings.includes('figure_load_failed'), 'unsafe or invalid resolver result rejected');
      same(host.querySelectorAll('img').length, 0, 'rejected URL never reaches image src');
    }
    current = renderer.render(host, page, group, { resolveFigure: () => ({ url: 'blob:caller-owned' }) });
    await current.ready; current.cleanup();
    ok(!revoked.includes('blob:caller-owned'), 'caller-supplied blob URL never revoked');

    current = renderer.render(host, page, group, { resolveFigure: raster });
    await current.ready;
    const failedUrl = host.querySelector('img').src, revokesBeforeError = revoked.length;
    host.querySelector('img').dispatchEvent(new window.Event('error'));
    same(revoked.length, revokesBeforeError + 2, 'one fragment load error promptly releases entire group');
    same(host.querySelectorAll('img').length, 0, 'decode failure never leaves the other half visible');
    ok(host.textContent.includes('일부를 불러오지 못했어요'), 'partial asset failure visible');
    current.cleanup();
    same(revoked.filter(url => url === failedUrl).length, 1, 'cleanup cannot double-revoke failed URL');

    current = renderer.render(host, page, group, { resolveFigure: raster });
    await current.ready;
    const atomicStage = host.querySelector('.textbook-figure-group-canvas');
    const atomicImages = [...host.querySelectorAll('img')];
    same(atomicStage.style.visibility, 'hidden', 'complete fetch alone does not reveal un-decoded halves');
    atomicImages[0].dispatchEvent(new window.Event('load'));
    same(atomicStage.style.visibility, 'hidden', 'first decoded half remains hidden');
    atomicImages[1].dispatchEvent(new window.Event('load'));
    same(atomicStage.style.visibility, 'visible', 'all decoded fragments reveal together');
    current.cleanup();
    current = renderer.render(host, page, group, { resolveFigure: f => f.assetId === 'lower' ? Promise.reject(new Error('503')) : raster() });
    await current.ready;
    same(host.querySelectorAll('img').length, 0, 'fetch failure removes every fragment');
    same(host.querySelector('.textbook-figure-group-canvas').style.visibility, 'hidden', 'fetch failure group stays hidden');

    let started = 0;
    current = renderer.render(host, page, group, { resolveFigure: () => { started++; return raster(); } });
    current.cleanup();
    ok((await current.ready).cancelled, 'cleanup before resolver cancels view');
    same(started, 0, 'cancelled view does not begin unnecessary asset work');
    let finish; const deferred = new Promise(resolve => { finish = resolve; });
    current = renderer.render(host, page, group, { resolveFigure: () => deferred });
    await settle();
    const old = current, createdBeforeLate = made.length;
    current = renderer.render(host, page, group, { isFigureAvailable: () => false });
    finish(raster());
    ok((await old.ready).cancelled, 'replacement cancels old result');
    await current.ready;
    same(made.length, createdBeforeLate, 'late Blob resolution creates no leaked URL');
    same(host.querySelectorAll('img').length, 0, 'old image cannot enter new view');
    same(host.querySelectorAll('figure').length, 1, 'replacement owns only current view');

    current = renderer.render(host, page, group, { isFigureAvailable: () => { throw new Error('offline'); }, resolveFigure: () => { throw new Error('must not run'); } });
    ok((await current.ready).warnings.includes('figure_availability_failed'), 'availability failure explicit');
    const full = fixture(); full.figures[0].bbox = [0, 0, 600, 800];
    const fullCalls = [];
    current = renderer.render(host, full.page, full.group, { resolveFigure: f => { fullCalls.push(f.assetId); return raster(); } });
    ok((await current.ready).warnings.includes('not_figure_only'), 'full-page raster forbidden');
    same(fullCalls, [], 'unsafe member blocks entire group before resolution');
    const cover = fixture(); cover.figures[0].classification = 'fragmented-cover-raster';
    ok(renderer.describe(cover.page, cover.group).errors.includes('not_figure_only'), 'cover fragments never reconstructed');

    const p = standalone(), groups = renderer.groupsFor(p);
    same(groups.length, 1, 'checked caption-linked fragments become one group');
    ok(renderer.describe(p, groups[0]).supported, 'checked reciprocal caption association permits source join');
    p.blocks[3].associatedAssetIds.pop();
    ok(!renderer.describe(p, groups[0]).supported, 'broken reciprocal caption association rejects join');

    const conflicting = fixture();
    conflicting.table.figureGroups.push({ assetIds: ['upper'], relationship: 'one-source-illustration' });
    const conflictingGroups = renderer.groupsFor(conflicting.page, conflicting.table);
    same(conflictingGroups.flatMap(g => g.assetIds), ['upper', 'lower'], 'overlapping groups preserve every actual figure once');
    ok(conflictingGroups.every(g => !renderer.describe(conflicting.page, g).supported), 'conflicting groups stay explicit fallbacks');
    const multirow = fixture(); multirow.figures.forEach(f => { f.sourceRowIndices = [1, 2]; });
    same(renderer.describe(multirow.page, multirow.group).targetCell, null, 'multirow group never guessed into one feature cell');
    const ambiguousCell = fixture(); ambiguousCell.table.rows[0].cells.push({ id: 'overlapping-cell', rowIndex: 1, columnIndex: 0, bbox: [150, 90, 350, 290], lines: [] });
    same(renderer.describe(ambiguousCell.page, ambiguousCell.group).targetCell, null, 'ambiguous source-cell containment returns no target');
    same(new Set(revoked).size, revoked.length, 'all object URL revocations unique');
    assert.throws(() => renderer.render(null, page, group), /DOM host/); checks++;
    const code = fs.readFileSync(path.join(__dirname, '../media/textbook-figure-groups.js'), 'utf8');
    ok(!/\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/.test(code), 'helper has no independent network or storage operations');
  } finally { if (current) current.cleanup(); dom.window.close(); }
}

async function privateChecks(directory) {
  const load = n => JSON.parse(fs.readFileSync(path.join(directory, 'pages', 'page-' + String(n).padStart(3, '0') + '.json'), 'utf8'));
  const dom = new JSDOM('<main></main>'), host = dom.window.document.querySelector('main');
  let current;
  try {
    for (const [number, expectedGroups, expectedAssets] of [[47, 2, 3], [54, 17, 28], [79, 11, 14]]) {
      const page = load(number), before = JSON.stringify(page);
      const groups = renderer.groupsFor(page).concat(...page.blocks.filter(b => b.type === 'table').map(b => renderer.groupsFor(page, b)));
      same(groups.length, expectedGroups, 'private page ' + number + ' logical figure count');
      same(new Set(groups.flatMap(g => g.assetIds)).size, expectedAssets, 'private page ' + number + ' no missing image assets');
      for (const group of groups) {
        const d = renderer.describe(page, group);
        ok(d.supported, 'private page ' + number + ' source grouping supported: ' + group.assetIds.join(','));
        for (const member of d.members) {
          const inventory = page.imageInventory.find(item => item.assetId === member.assetId);
          ok(inventory && fs.existsSync(path.join(directory, inventory.path)), 'private source asset exists: ' + member.assetId);
          same(member.bbox, inventory.sourceBbox, 'figure geometry matches extracted source inventory');
        }
        current = renderer.render(host, page, group, { isFigureAvailable: () => false, resolveFigure: () => { throw new Error('Private checks must not load or publish assets'); } });
        await current.ready;
        same(host.querySelectorAll('.textbook-figure-group-part').length, group.assetIds.length, 'each source fragment retains a position');
        if (d.caption) {
          const native = d.caption.lines.map(l => l.spans.map(s => typeof s.renderText === 'string' && s.mappingAudit?.verified === true ? s.renderText : s.text).join('')).join('\n');
          same(host.querySelector('figcaption').textContent, native, 'private caption exact source range preserved');
          same(host.querySelector('figcaption').style.fontSize, '16px', 'private caption remains 16px');
        }
        for (const [i, part] of [...host.querySelectorAll('.textbook-figure-group-part')].entries()) {
          const bbox = d.members[i].bbox, width = d.bbox[2] - d.bbox[0], height = d.bbox[3] - d.bbox[1];
          near(parseFloat(part.style.left), 100 * (bbox[0] - d.bbox[0]) / width, 'private fragment exact left');
          near(parseFloat(part.style.top), 100 * (bbox[1] - d.bbox[1]) / height, 'private fragment exact top');
          near(parseFloat(part.style.width), 100 * (bbox[2] - bbox[0]) / width, 'private fragment exact width');
          near(parseFloat(part.style.height), 100 * (bbox[3] - bbox[1]) / height, 'private fragment exact height');
        }
      }
      same(JSON.stringify(page), before, 'private source input never modified');
    }
    const stone = load(9), table = stone.blocks.find(b => b.type === 'table');
    const stoneGroups = renderer.groupsFor(stone, table);
    const targets = stoneGroups.map(g => renderer.describe(stone, g).targetCell);
    same(targets.map(t => t && t.rowIndex), [1, 2, 3, 3, 4], 'PDF 9 six table assets form five groups in exact feature rows');
    ok(targets.every(t => t && t.columnIndex === 1), 'PDF 9 exact feature column retained');
    const photoPanel = stoneGroups.find(g => g.assetIds.length === 2);
    same(photoPanel.assetIds, ['p009-figure-4', 'p009-figure-5'], 'PDF 9 two source photo strips stay together');
    ok(renderer.describe(stone, photoPanel).supported, 'PDF 9 verified photo panel passes contiguous geometry checks');
    current = renderer.render(host, stone, photoPanel, { isFigureAvailable: () => false });
    await current.ready;
    const photoParts = [...host.querySelectorAll('.textbook-figure-group-part')];
    same(photoParts.length, 2, 'PDF 9 preserves both original strip assets');
    near(parseFloat(photoParts[0].style.top) + parseFloat(photoParts[0].style.height), parseFloat(photoParts[1].style.top), 'PDF 9 joined photo panel has no gap');
    const map = load(12), mapTable = map.blocks.find(b => b.type === 'table');
    same(renderer.describe(map, renderer.groupsFor(map, mapTable)[0]).targetCell, null, 'PDF 12 multirow map must remain contextual, no guessed country');
  } finally { if (current) current.cleanup(); dom.window.close(); }
}

(async () => {
  const single=standalone();single.blocks.splice(1,2);single.blocks[1].associatedAssetIds=['part0'];
  const sg=renderer.groupsFor(single)[0];
  same(sg.relationship,'one-source-illustration','single image with composite identifier remains a singleton');
  ok(renderer.describe(single,sg).supported,'verified singleton caption is supported');
  const spanning=fixture();spanning.figures.forEach(f=>f.sourceRowIndices=[1,2]);spanning.table.rows[0].cells[0].rowSpan=2;
  same(renderer.describe(spanning.page,spanning.group).targetCell.id,'caption','multirow image stays in its exact merged caption cell');
  spanning.table.rows[0].cells[0].rowSpan=1;
  same(renderer.describe(spanning.page,spanning.group).targetCell,null,'multirow image never guessed into a single row');
  const reviewed=fixture();reviewed.figures.forEach(f=>{f.sourceCaptionCellId='caption';});reviewed.table.rows[0].cells[0].bbox=[210,90,350,290];
  same(renderer.describe(reviewed.page,reviewed.group).targetCell.method,'verified-source-caption-association','verified captions survive approximate gallery envelopes');
  reviewed.table.rows[0].cells[0].sourceAssociations[0].reviewStatus='unverified';
  same(renderer.describe(reviewed.page,reviewed.group).targetCell,null,'unverified caption cannot assign an image to a cell');
  await domChecks();
  const index = process.argv.indexOf('--private');
  if (index !== -1) await privateChecks(path.resolve(process.argv[index + 1] || path.join(__dirname, '../../hanq-semantic-preview')));
  console.log('PASS: ' + checks + ' figure-group DOM/geometry assertions' + (index !== -1 ? ' (including private source checks)' : '') + '. No real-browser or decoded-image QA claimed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
