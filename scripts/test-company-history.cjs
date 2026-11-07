#!/usr/bin/env node
'use strict';

// Presentation contract tests. Synthetic fixtures never call account/data APIs.
// Run: NODE_PATH=<test-tools>/node_modules node --test scripts/test-company-history.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const csstree = require('css-tree');
// Native control structure audited against hddooo/file-island-web commit
// 8100f8359261f6eac62aca15e20e0ee22be77be4 (readers, formal exam, wrong notebook, textbook).
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'media/display-mode.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'media/company-mode.css'), 'utf8');
const marker = '/* History uses native document tabs';
assert.ok(css.includes(marker), 'History CSS marker exists');
const historyCss = css.slice(css.indexOf(marker));
const flush = () => new Promise(resolve => setTimeout(resolve, 12));

function fixture(t, html, hash = '#chapter/goryeo/webtoon') {
  const dom = new JSDOM('<!doctype html><html data-hanq-theme="terminal"><head><title>HanQ original</title></head><body><main id="app"><div class="device-content">' + html + '</div></main></body></html>', {
    url: 'https://fixture.test/' + hash,
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  t.after(() => dom.window.close());
  dom.window.eval(code);
  return { w: dom.window, doc: dom.window.document, mode: dom.window.HanqDisplayMode };
}
const names = node => [...node.querySelectorAll('[data-company-added]')].map(n => n.textContent);
const directory = node => node.getAttribute('data-company-native-directory');
const controls = doc => [...doc.querySelectorAll('button,input,select,textarea,a,details,summary')];
const nativeText = node => [...node.childNodes].filter(n => n.nodeType !== 1 || !n.hasAttribute('data-company-added')).map(n => n.textContent).join('');
function assertUndecorated(node) {
  assert.equal(node.hasAttribute('data-company-native-directory'), false);
  assert.equal(node.querySelector('[data-company-added],[data-company-native-row]'), null);
}

const catalogs = '<section id="eras" class="toc"><button class="period ready" data-id="prehistory"><span class="number">01</span><span class="period-text"><strong>선사</strong><small>시대 자료</small></span></button><button class="period" data-id="goryeo" disabled>고려</button><div><button class="period" data-id="not-direct">외부</button></div></section><section id="reviews" class="toc hanq-rm__toc" role="group" aria-label="시대 선택"><button class="period ready" data-group="goryeo"><span class="number">01</span><span class="period-text"><strong>고려</strong><small>복습 자료</small></span></button><button class="period ready" data-group="joseon">조선</button><div><button class="period" data-group="not-direct">외부</button></div></section>';

test('era data-id and review data-group catalogs receive distinct correct filenames and direct-child counts', async t => {
  const { doc, mode } = fixture(t, catalogs, '#past-exams');
  mode.select('company'); await flush();
  assert.equal(directory(doc.querySelector('#eras')), 'history / chapters / 2 files');
  assert.equal(directory(doc.querySelector('#reviews')), 'history / reviews / 2 files');
  assert.deepEqual(names(doc.querySelector('#eras')), ['01-prehistory.md', '02-goryeo.md']);
  assert.deepEqual(names(doc.querySelector('#reviews')), ['goryeo.md', 'joseon.md']);
  assert.equal(doc.querySelector('[data-id="not-direct"] [data-company-added]'), null);
  assert.equal(doc.querySelector('[data-group="not-direct"] [data-company-added]'), null);
  doc.querySelectorAll('[data-company-added]').forEach(n => assert.equal(n.getAttribute('aria-hidden'), 'true'));
});

test('era/review native listeners, readiness, content and node identity survive four mode cycles', async t => {
  const { doc, mode } = fixture(t, catalogs, '#reviews');
  const lists = [...doc.querySelectorAll('.toc')], before = lists.map(n => n.innerHTML), originalControls = controls(doc);
  const actions = [];
  doc.querySelector('[data-id="prehistory"]').addEventListener('click', () => actions.push('era'));
  doc.querySelector('[data-group="goryeo"]').onclick = () => actions.push('review');
  doc.querySelector('[data-id="goryeo"]').onclick = () => actions.push('disabled');
  for (let i = 0; i < 4; i++) {
    mode.select('company'); await flush();
    doc.querySelector('[data-id="prehistory"]').click(); doc.querySelector('[data-group="goryeo"]').click(); doc.querySelector('[data-id="goryeo"]').click();
    assert.deepEqual(controls(doc), originalControls);
    mode.select('default'); await flush();
    lists.forEach((n, j) => assert.equal(n.innerHTML, before[j]));
    assert.equal(doc.querySelector('[data-id="goryeo"]').disabled, true);
  }
  assert.deepEqual(actions, Array.from({ length: 4 }, () => ['era', 'review']).flat());
});

test('history steps keep current/disabled ownership and map all native document modes', async t => {
  const expected = ['concept.md', 'summary.md', 'quiz.json', 'practice.json', 'review.md', 'culture.md', 'blank-quiz.md', 'exam-patterns.md', 'source-quiz.md'];
  const { doc, mode } = fixture(t, '<div class="steps">' + expected.map((_, i) => '<button class="step ' + (i === 1 ? 'current' : '') + '" data-step="' + i + '"' + (i === 1 ? ' aria-current="step"' : '') + (i === 8 ? ' disabled' : '') + '><span>' + (i + 1) + '</span> 원본 탭 ' + i + '</button>').join('') + '</div>');
  const list = doc.querySelector('.steps'), before = list.innerHTML, buttons = [...list.children];
  let step = 1; buttons[2].onclick = () => { step = 2; };
  mode.select('company'); await flush();
  assert.equal(directory(list), 'history / documents / 9 files'); assert.deepEqual(names(list), expected);
  assert.equal(buttons[1].getAttribute('aria-current'), 'step'); assert.equal(buttons[1].className, 'step current');
  assert.equal(buttons[8].disabled, true); buttons[2].click(); assert.equal(step, 2);
  assert.equal(nativeText(buttons[2]), '3 원본 탭 2');
  mode.select('default'); await flush(); assert.equal(list.innerHTML, before);
  assert.deepEqual([...list.children], buttons);
});

test('empty, hidden and non-history steps are skipped rather than shown as empty file directories', async t => {
  const { doc, mode } = fixture(t, '<div class="steps" id="empty"></div><div hidden><div class="steps" id="ancestor-hidden"><button class="step" data-step="1">숨김</button></div></div><div class="steps" id="self-hidden" hidden><button class="step" data-step="0">숨김</button></div>');
  mode.select('company'); await flush(); doc.querySelectorAll('.steps').forEach(assertUndecorated);
  const other = fixture(t, '<div class="steps"><button class="step" data-step="1">TOEIC</button></div>', '#toeic/grammar');
  other.mode.select('company'); await flush(); assertUndecorated(other.doc.querySelector('.steps'));
});

for (const [prefix, name] of [['gsr', 'goryeo'], ['jsr', 'joseon'], ['osr', 'opening']]) {
  test(name + ' topics and modes preserve native selection while legacy hidden toc stays untouched', async t => {
    const { doc, mode } = fixture(t, '<section class="' + name + '-script-reader"><div class="' + prefix + '-topics"><button data-topic="politics" aria-current="true">정치</button><button data-topic="culture" aria-current="false">문화</button></div><div class="' + prefix + '-modes"><button data-mode="read" data-navigation-number="1" aria-current="true">개념</button><button data-mode="blank" data-navigation-number="2" aria-current="false">빈칸</button></div><nav class="' + prefix + '-toc" style="display:none"><button data-target="legacy">기존 목차</button></nav><textarea>작성 중</textarea></section>');
    const topics = doc.querySelector('.' + prefix + '-topics'), modes = doc.querySelector('.' + prefix + '-modes'), toc = doc.querySelector('.' + prefix + '-toc');
    const snapshots = [topics, modes, toc].map(n => n.innerHTML), originalControls = controls(doc), answer = doc.querySelector('textarea');
    answer.value = '기존 답안'; let chosen = '';
    topics.lastElementChild.onclick = () => { chosen = 'culture'; };
    mode.select('company'); await flush();
    assert.equal(directory(topics), 'history / ' + name + ' / topics / 2 files');
    assert.equal(directory(modes), 'history / ' + name + ' / modes / 2 files');
    assert.deepEqual(names(topics), ['politics.md', 'culture.md']); assert.deepEqual(names(modes), ['read.md', 'blank.md']);
    assert.equal(topics.firstElementChild.getAttribute('aria-current'), 'true'); assert.equal(modes.firstElementChild.getAttribute('aria-current'), 'true');
    assertUndecorated(toc); assert.equal(toc.innerHTML, snapshots[2]); assert.equal(toc.style.display, 'none');
    topics.lastElementChild.click(); assert.equal(chosen, 'culture'); assert.equal(answer.value, '기존 답안');
    assert.deepEqual(controls(doc), originalControls);
    mode.select('default'); await flush(); [topics, modes, toc].forEach((n, i) => assert.equal(n.innerHTML, snapshots[i]));
  });
}

test('hidden reader topic/mode groups and hidden textbook tabs never acquire file presentation', async t => {
  const { doc, mode } = fixture(t, '<div hidden><div class="gsr-topics"><button data-topic="hidden">숨김</button></div><div class="jsr-modes"><button data-mode="hidden">숨김</button></div><div class="textbook-controls"><div role="tablist"><button data-mode="source">원문</button></div></div></div><div class="textbook-controls"><div role="tablist" hidden><button data-mode="source-quiz">퀴즈</button></div><div role="tablist" id="empty-tabs"></div></div>');
  const containers = [...doc.querySelectorAll('.gsr-topics,.jsr-modes,[role=tablist]')], before = containers.map(n => n.outerHTML);
  mode.select('company'); await flush(); containers.forEach((n, i) => { assertUndecorated(n); assert.equal(n.outerHTML, before[i]); });
});

test('visible textbook tabs and supplement links retain hrefs, original labels and handlers', async t => {
  const { doc, mode } = fixture(t, '<div class="textbook-controls"><div role="tablist"><button role="tab" data-mode="source" aria-selected="true">원문 읽기</button><button role="tab" data-mode="source-quiz" aria-selected="false">빈칸 퀴즈</button></div></div><nav class="textbook-supplement-links"><a href="#textbook/goryeo">고려 부록</a><a href="#textbook/joseon">조선 부록</a><a href="#account">계정</a></nav>', '#textbook/goryeo');
  const tabs = doc.querySelector('[role=tablist]'), links = doc.querySelector('.textbook-supplement-links'), before = [tabs.innerHTML, links.innerHTML], nodes = controls(doc);
  let selected = ''; tabs.lastElementChild.onclick = () => { selected = 'source-quiz'; };
  mode.select('company'); await flush();
  assert.equal(directory(tabs), 'history / source / 2 files'); assert.equal(directory(links), 'history / reference / 2 files');
  assert.deepEqual(names(tabs), ['source.md', 'source-quiz.md']); assert.deepEqual(names(links), ['goryeo.md', 'joseon.md']);
  assert.equal(doc.querySelector('a[href="#account"]').hasAttribute('data-company-native-row'), false);
  assert.equal(tabs.firstElementChild.getAttribute('aria-selected'), 'true');
  assert.deepEqual([...links.querySelectorAll('a')].map(a => a.getAttribute('href')), ['#textbook/goryeo', '#textbook/joseon', '#account']);
  tabs.lastElementChild.click(); assert.equal(selected, 'source-quiz'); assert.deepEqual(controls(doc), nodes);
  mode.select('default'); await flush(); assert.equal(tabs.innerHTML, before[0]); assert.equal(links.innerHTML, before[1]);
});

const formal = '<div id="formalExamHost"><div class="fe-rounds"><div class="fe-round"><button type="button" id="feRound79" data-round="79" data-available="1">제79회 - 한국사능력검정</button><small class="fe-round-status"></small><label class="fe-review-toggle"><span>오답만 풀기</span><input type="checkbox" role="switch" data-review-only="79" checked aria-label="제79회 오답만 풀기"><b>ON</b></label></div><div class="fe-round"><button type="button" id="feRound78" data-round="78" data-available="0" disabled>제78회 - 한국사능력검정</button><small class="fe-round-status">확인 지연</small><label class="fe-review-toggle"><span>오답만 풀기</span><input type="checkbox" role="switch" data-review-only="78" aria-label="제78회 오답만 풀기"><b>OFF</b></label><button type="button" id="feRoundRetry78" data-round-retry="78">다시 확인</button></div></div><button id="feHistoryPrev" disabled>이전</button><button id="feHistoryNext">다음</button><div class="fe-runs-scroll"><table class="fe-runs-table"><tbody><tr><td><button data-run="stable-run">결과 보기</button></td></tr></tbody></table></div></div>';

test('formal exam file rows decorate only round start buttons, preserving switch/retry/pagination ownership', async t => {
  const { doc, mode } = fixture(t, formal, '#formal-exams');
  const rows = doc.querySelector('.fe-rounds'), before = rows.innerHTML, nodes = controls(doc), actions = [];
  doc.querySelector('#feRound79').onclick = () => actions.push('start79');
  doc.querySelector('#feRound78').onclick = () => actions.push('disabled78');
  doc.querySelector('[data-round-retry]').onclick = () => actions.push('retry78');
  doc.querySelector('[data-run]').onclick = () => actions.push('result');
  const toggle = doc.querySelector('[data-review-only="79"]'); toggle.onchange = () => actions.push('review=' + toggle.checked);
  mode.select('company'); await flush();
  assert.equal(directory(rows), 'history / exams / 2 files'); assert.deepEqual(names(rows), ['round-79.json', 'round-78.json']);
  assert.equal(doc.querySelectorAll('[data-company-native-row]').length, 2);
  assert.equal(doc.querySelector('#feRound78').disabled, true); assert.equal(doc.querySelector('#feHistoryPrev').disabled, true);
  for (const n of doc.querySelectorAll('[data-round-retry],[data-review-only],[data-run],#feHistoryPrev,#feHistoryNext')) assert.equal(n.hasAttribute('data-company-native-row'), false);
  assert.equal(toggle.checked, true); assert.equal(toggle.getAttribute('role'), 'switch');
  doc.querySelector('#feRound79').click(); doc.querySelector('#feRound78').click(); doc.querySelector('[data-round-retry]').click(); doc.querySelector('[data-run]').click(); toggle.click();
  assert.deepEqual(actions, ['start79', 'retry78', 'result', 'review=false']); assert.deepEqual(controls(doc), nodes);
  mode.select('default'); await flush(); assert.equal(rows.innerHTML, before); assert.equal(toggle.checked, false);
});

test('formal request-pending disabled states and checked values are never reset by repeated appearance refreshes', async t => {
  const { doc, mode } = fixture(t, formal, '#formal-exams');
  const host = doc.querySelector('#formalExamHost'), nodes = controls(doc); host.setAttribute('aria-busy', 'true');
  nodes.forEach(n => { if ('disabled' in n) n.disabled = true; });
  const checkbox = doc.querySelector('[data-review-only="78"]'); checkbox.checked = true;
  for (let i = 0; i < 3; i++) {
    mode.select('company'); await flush(); mode.refresh(); await flush();
    nodes.forEach(n => { if ('disabled' in n) assert.equal(n.disabled, true); });
    assert.equal(host.getAttribute('aria-busy'), 'true'); assert.equal(checkbox.checked, true);
    mode.select('default'); await flush(); assert.deepEqual(controls(doc), nodes);
  }
});

test('wrongnote round replay buttons retain notebook identity, native actions and disabled state', async t => {
  const { doc, mode } = fixture(t, '<section id="cbtWrongNotebookHost"><div class="fe-rounds"><button data-notebook-round="79" data-notebook-action="review">제79회 오답 풀기</button><button data-notebook-round="77" data-notebook-action="review" disabled>제77회 준비 중</button><div><button data-notebook-round="70">외부</button></div></div><button id="retryNotebook">다시 불러오기</button></section>', '#wrongnotes');
  const list = doc.querySelector('.fe-rounds'), original = list.innerHTML, replay = doc.querySelector('[data-notebook-round="79"]');
  let calls = 0; replay.onclick = () => calls++;
  for (let i = 0; i < 3; i++) {
    mode.select('company'); await flush(); assert.equal(directory(list), 'history / review / 2 files');
    assert.deepEqual(names(list), ['round-79-wrong.json', 'round-77-wrong.json']);
    assert.equal(doc.querySelector('[data-notebook-round="70"] [data-company-added]'), null);
    assert.equal(replay.dataset.notebookRound, '79'); assert.equal(replay.dataset.notebookAction, 'review'); replay.click();
    assert.equal(doc.querySelector('[data-notebook-round="77"]').disabled, true);
    mode.select('default'); await flush(); assert.equal(list.innerHTML, original); assert.equal(doc.querySelector('[data-notebook-round="79"]'), replay);
  }
  assert.equal(calls, 3);
});

for (const host of ['formalExamHost', 'cbtWrongNotebookHost']) {
  test(host + ' question summaries preserve native details and use stable round/question names', async t => {
    const { doc, mode } = fixture(t, '<section id="' + host + '"><ul class="fe-reviews"><li class="fe-review"><details data-position="0"><summary><strong>제79회 2번</strong> · 선택오답</summary><div class="fe-review-body"></div></details></li><li class="fe-review"><details data-position="1" open><summary>추가 해설</summary><div class="fe-review-body"><input value="기존 답"></div></details></li></ul></section>', host === 'formalExamHost' ? '#formal-exams' : '#wrongnotes');
    const list = doc.querySelector('.fe-reviews'), details = [...doc.querySelectorAll('details')], summaries = [...doc.querySelectorAll('summary')], before = summaries.map(n => n.innerHTML), body = doc.querySelector('.fe-review-body');
    let fills = 0;
    details[0].ontoggle = () => { if (details[0].open && !details[0].dataset.filled) { fills++; details[0].dataset.filled = '1'; const input = doc.createElement('input'); input.value = 'lazy answer'; body.append(input); } };
    mode.select('company'); await flush();
    assert.equal(directory(list), 'history / questions / 2 files'); assert.deepEqual(names(list), ['round-79-q002.md', 'question-002.md']);
    assert.equal(details[0].open, false); assert.equal(details[1].open, true); assert.equal(body.childNodes.length, 0); assert.equal(fills, 0);
    summaries[0].click(); await flush(); assert.equal(details[0].open, true); assert.equal(fills, 1);
    const lazyInput = body.firstElementChild; lazyInput.value = 'user answer';
    for (let i = 0; i < 3; i++) {
      mode.refresh(); await flush(); assert.deepEqual(names(list), ['round-79-q002.md', 'question-002.md']);
      mode.select('default'); await flush(); summaries.forEach((n, j) => assert.equal(n.innerHTML, before[j]));
      assert.equal(details[0].open, true); assert.equal(details[0].dataset.filled, '1'); assert.equal(body.firstElementChild, lazyInput); assert.equal(lazyInput.value, 'user answer');
      mode.select('company'); await flush();
    }
    summaries[0].click(); await flush(); assert.equal(details[0].open, false); summaries[0].click(); await flush();
    assert.equal(fills, 1); assert.deepEqual([...doc.querySelectorAll('details')], details); assert.deepEqual([...doc.querySelectorAll('summary')], summaries);
  });
}

test('async native route replacement is decorated once and refresh reaches a mutation-free steady state', async t => {
  const { w, doc, mode } = fixture(t, '<div class="steps"><button class="step" data-step="0">개념</button></div>');
  mode.select('company'); await flush();
  const pane = doc.querySelector('.device-content');
  pane.innerHTML = '<div id="cbtWrongNotebookHost"><div class="fe-rounds"><button data-notebook-round="79">복습</button></div></div>';
  await flush(); assert.deepEqual(names(pane), ['round-79-wrong.json']); assert.equal(pane.querySelectorAll('.company-codebar').length, 1);
  for (let i = 0; i < 3; i++) mode.refresh(); await flush();
  assert.equal(pane.querySelectorAll('[data-company-added]').length, 1);
  let mutations = 0; const observer = new w.MutationObserver(records => { mutations += records.length; }); observer.observe(pane, { subtree: true, childList: true, attributes: true });
  await flush(); observer.disconnect(); assert.equal(mutations, 0);
  mode.select('default'); await flush(); assert.equal(pane.querySelector('[data-company-added],[data-company-native-directory],[data-company-native-row],.company-codebar'), null);
});

test('body-level dialog image notes clear on both mode-off and non-history navigation without changing source media', async t => {
  const { w, doc, mode } = fixture(t, '<article><img src="inline-source.jpg" alt="원본 교재"></article>');
  const dialog = doc.createElement('dialog'); dialog.open = true;
  dialog.innerHTML = '<img id="dialog-source" src="dialog-source.jpg" alt="고려 청자 상세"><button>닫기</button>';
  doc.body.append(dialog);
  const image = dialog.querySelector('img'), button = dialog.querySelector('button'), before = dialog.innerHTML;
  let closes = 0; button.onclick = () => closes++;
  mode.select('company'); await flush();
  assert.equal(doc.querySelectorAll('.company-image-note').length, 2);
  assert.equal(image.nextElementSibling.textContent, '// image: 고려 청자 상세');
  mode.refresh(); await flush(); assert.equal(dialog.querySelectorAll('.company-image-note').length, 1);
  mode.select('default'); await flush();
  assert.equal(doc.querySelector('.company-image-note'), null); assert.equal(dialog.innerHTML, before);
  assert.equal(dialog.querySelector('img'), image); assert.equal(image.getAttribute('src'), 'dialog-source.jpg'); assert.equal(image.alt, '고려 청자 상세');
  mode.select('company'); await flush(); assert.equal(dialog.querySelectorAll('.company-image-note').length, 1);
  w.location.hash = '#toeic/grammar'; await flush();
  assert.equal(doc.querySelector('.company-image-note'), null); assert.equal(doc.documentElement.hasAttribute('data-company-history'), false);
  assert.equal(dialog.innerHTML, before); assert.equal(dialog.open, true); assert.equal(dialog.querySelector('img'), image);
  button.click(); assert.equal(closes, 1);
});

test('image-only figure wrappers keep raster nodes, native caption/status and inline geometry through mode cycles', async t => {
  const { doc, mode } = fixture(t, '<figure class="textbook-figure-group"><div class="textbook-figure-group-canvas" style="position:relative;width:100%;max-width:600px;aspect-ratio:3 / 2"><div class="textbook-figure-group-part" data-source-asset="source-1" style="position:absolute;left:25%;top:10%;width:30%;height:45%"><img src="source-figure.jpg" alt="원본 유물"></div></div><div class="textbook-figure-group-status"><p role="status">원본 자료 상태</p></div><figcaption class="textbook-figure-group-caption">원문 그림 설명</figcaption></figure>');
  const figure = doc.querySelector('figure'), canvas = figure.querySelector('.textbook-figure-group-canvas'), part = canvas.firstElementChild, image = part.querySelector('img'), status = figure.querySelector('[role=status]'), caption = figure.querySelector('figcaption');
  const canvasStyle = canvas.getAttribute('style'), partStyle = part.getAttribute('style');
  for (let i = 0; i < 3; i++) {
    mode.select('company'); await flush();
    assert.equal(part.querySelectorAll('.company-image-note').length, 1); assert.equal(part.querySelector('img'), image);
    assert.equal(canvas.getAttribute('style'), canvasStyle); assert.equal(part.getAttribute('style'), partStyle);
    assert.equal(status.textContent, '원본 자료 상태'); assert.equal(caption.textContent, '원문 그림 설명');
    assert.equal(canvas.contains(status), false); assert.equal(canvas.contains(caption), false);
    mode.select('default'); await flush();
    assert.equal(part.querySelector('.company-image-note'), null); assert.equal(part.firstElementChild, image);
    assert.equal(figure.querySelector('[role=status]'), status); assert.equal(figure.querySelector('figcaption'), caption);
  }
});

test('all company CSS parses and every added history rule is scoped to company mode', () => {
  const errors = []; csstree.parse(css, { onParseError: e => errors.push(e.message) }); assert.deepEqual(errors, []);
  let rules = 0;
  csstree.walk(csstree.parse(historyCss), { visit: 'Rule', enter(node) {
    rules++; assert.equal(node.prelude.type, 'SelectorList'); node.prelude.children.forEach(selector => assert.match(csstree.generate(selector), /^html\[data-company-mode=on\]/));
  } });
  assert.ok(rules >= 20, 'history rules were actually checked');
});

test('history density CSS preserves table widths/scrolling and actual coordinate/timeline/crop geometry', () => {
  const coordinate = /textbook-coordinate-diagram|textbook-source-timeline|textbook-crop|coordinate-diagram/;
  const geometric = /^(?:position|inset(?:-.+)?|top|right|bottom|left|width|min-width|max-width|height|min-height|max-height|aspect-ratio|transform|display|overflow(?:-.+)?|grid(?:-.+)?|flex(?:-.+)?)$/;
  csstree.walk(csstree.parse(historyCss), { visit: 'Rule', enter(node) {
    const selector = csstree.generate(node.prelude);
    node.block.children.forEach(declaration => {
      if (declaration.type !== 'Declaration') return;
      if (coordinate.test(selector)) assert.equal(geometric.test(declaration.property), false, 'coordinate geometry: ' + selector + ' ' + declaration.property);
      if (/table|runs-scroll/.test(selector)) assert.equal(/^(?:min-width|max-width|width|table-layout|overflow(?:-.+)?)$/.test(declaration.property), false, 'table layout: ' + selector + ' ' + declaration.property);
    });
  } });
  // Image-only figure wrappers may collapse after image hiding; text-coordinate wrappers may not.
  assert.doesNotMatch(historyCss, /\.textbook-coordinate-diagram-canvas|\.textbook-source-timeline|\.textbook-crop/);
});

test('history CSS keeps current tabs, hidden controls, expandable summaries and narrow round layouts explicit', () => {
  assert.match(historyCss, /\[hidden\][^{}]*\{display:none!important\}/);
  assert.match(historyCss, /aria-current=true.*aria-current=step.*aria-selected=true/);
  assert.match(historyCss, /details\[open\]>summary::after\{content:'−'/);
  assert.match(historyCss, /summary::after\{content:'\+'/);
  assert.match(historyCss, /@media\(max-width:600px\)/);
  assert.match(historyCss, /\.fe-review-toggle\{grid-column:1!important;grid-row:auto!important/);
  assert.match(historyCss, /\[data-round-retry\]\{grid-column:1!important;grid-row:auto!important/);
  assert.doesNotMatch(historyCss, /pointer-events\s*:|\border\s*:/);
});

test('native hidden changes after decoration still win over every history tab flex rule', async t => {
  const { w, doc, mode } = fixture(t, '<div class="steps"><button class="step" data-step="1">요약</button></div><div class="gsr-topics"><button data-topic="culture">문화</button></div><div class="jsr-modes"><button data-mode="blank">빈칸</button></div><div class="textbook-controls"><div role="tablist"><button data-mode="source">원문</button></div></div><nav class="textbook-supplement-links"><a href="#textbook/goryeo">부록</a></nav>');
  const style = doc.createElement('style'); style.textContent = historyCss; doc.head.append(style);
  mode.select('company'); await flush();
  const lists = [...doc.querySelectorAll('[data-company-native-directory]')], rows = [...doc.querySelectorAll('[data-company-native-row]')];
  assert.equal(lists.length, 5); assert.equal(rows.length, 5);
  for (const row of rows) {
    row.hidden = true;
    assert.equal(w.getComputedStyle(row).display, 'none', 'hidden row must remain hidden: ' + row.parentElement.className);
    row.hidden = false;
  }
  for (const list of lists) {
    list.hidden = true;
    assert.equal(w.getComputedStyle(list).display, 'none', 'hidden list must remain hidden: ' + (list.className || list.getAttribute('role')));
  }
  mode.refresh(); await flush(); lists.forEach(list => assert.equal(list.hidden, true));
});

test('display presentation code does not take over routes, network requests or learning storage', () => {
  assert.doesNotMatch(code, /fetch\s*\(|XMLHttpRequest|localStorage\.clear|removeItem\s*\(|innerHTML\s*=|location\.(?:hash|href)\s*=/);
  const writes = code.match(/localStorage\.setItem\([^;]+/g) || [];
  assert.deepEqual(writes, ['localStorage.setItem(KEY,mode)']);
});
