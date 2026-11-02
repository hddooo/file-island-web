/* Read-only presentation. IDs, source strings, grading and storage stay with their owners. */
(function (root) {
  'use strict';
  var seq = 0, ordinals = ['첫 번째', '두 번째', '세 번째', '네 번째'];
  function node(tag, text, parent, cls) {
    var n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    if (parent) parent.appendChild(n);
    return n;
  }
  function signature(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return text.length + ':' + (h >>> 0).toString(16);
  }
  var types = {'e-mail':'이메일', email:'이메일', advertisement:'광고', 'web page':'웹 페이지', article:'기사', notice:'공지', memo:'메모', letter:'편지', receipt:'영수증', form:'양식', schedule:'일정표', 'text message':'문자 대화', 'text messages':'문자 대화', 'online review':'이용 후기'};
  function documents(text) {
    if (typeof text !== 'string' || !text.trim()) return [];
    var saved = root.HANQ_PASSAGE_LAYOUTS && root.HANQ_PASSAGE_LAYOUTS[signature(text)], parts = [];
    // Reviewed offsets belong to one full-source fingerprint; every start marker is checked too.
    if (saved && saved.parts.every(function (p) { return text.slice(p.start, p.start + p.anchor.length) === p.anchor; })) {
      parts = saved.parts.map(function (p) { return {start:p.start, type:p.type}; });
    } else {
      // Only explicit source document headings may introduce a new document. Paragraphs,
      // speakers, and a quoted email header are never guessed to be separate documents.
      var re = /^DOCUMENT\s+(\d+)\s*[—–:-]\s*([^\n\r]+)/gmi, m;
      while ((m = re.exec(text))) parts.push({start:m.index, type:types[m[2].trim().toLowerCase()] || m[2].trim(), number:Number(m[1])});
      if (!parts.length || parts[0].start !== 0 || parts.some(function (p, i) { return p.number !== i + 1; })) parts = [{start:0, type:'지문'}];
    }
    var seen = {};
    return parts.map(function (p, i) {
      var rank = (seen[p.type] || 0) + 1; seen[p.type] = rank;
      return {start:p.start, end:i + 1 < parts.length ? parts[i + 1].start : text.length, type:p.type, number:i + 1, rank:rank,
        label:'지문 ' + (i + 1) + ' · ' + (p.type === '지문' ? '원문' : (ordinals[rank - 1] || rank + '번째') + ' ' + p.type)};
    });
  }
  function shell(parent, parts) {
    var wrap = node('div', undefined, parent, 'lr-documents'), nav = node('nav', undefined, wrap, 'lr-document-nav');
    nav.setAttribute('aria-label', '지문 바로 가기');
    return parts.map(function (p) {
      var card = node('section', undefined, wrap, 'lr-document'), title = node('h3', p.label, card, 'lr-document-title');
      title.id = 'lr-document-' + (++seq); title.tabIndex = -1; card.setAttribute('aria-labelledby', title.id);
      var b = node('button', p.label, nav); b.type = 'button'; b.onclick = function () { title.focus({preventScroll:true}); title.scrollIntoView({block:'start'}); };
      return card;
    });
  }
  function source(parent, text, cls) {
    // Keep each source character once, including header punctuation and whitespace.
    var lines = text.match(/[^\n]*\n|[^\n]+$/g) || [];
    lines.forEach(function (line) {
      var header = /^(To|From|Date|Sent|Subject|Re|Attachment):\s*/i.exec(line);
      var n = node('span', line, parent, cls || 'lr-source');
      if (header) { n.classList.add('lr-mail-field'); n.dataset.field = header[1].toLowerCase(); }
    });
  }
  function passage(parent, text) {
    var parts = documents(text), cards = shell(parent, parts);
    cards.forEach(function (card, i) { var body = node('div', undefined, card, 'tc-passage lr-document-body'); source(body, text.slice(parts[i].start, parts[i].end)); });
    return cards;
  }
  function navigation(host, passageBox, items) {
    var lastTop = null, pane = host.closest('.device-content'), nav = node('nav', undefined, null, 'lr-question-nav'); passageBox.before(nav); nav.setAttribute('aria-label', '지문과 문제 오가기');
    function back() { var title = passageBox.querySelector('.lr-document-title') || passageBox.querySelector('h2'); title.tabIndex = -1; title.focus({preventScroll:true}); if (lastTop !== null) (pane || root).scrollTo({top:lastTop, behavior:'instant'}); else title.scrollIntoView({block:'start'}); }
    var read = node('button', '읽던 지문', nav); read.type = 'button'; read.onclick = back;
    items.forEach(function (item) {
      var b = node('button', item.displayNumber + '번 문제', nav); b.type = 'button';
      b.onclick = function () { var target = Array.from(host.querySelectorAll('[data-display-number]')).find(function (n) { return n.dataset.displayNumber === item.displayNumber; }); if (target) { if (passageBox.getBoundingClientRect().bottom > (pane ? pane.getBoundingClientRect().top : 0)) lastTop = pane ? pane.scrollTop : root.scrollY; target.tabIndex = -1; target.focus({preventScroll:true}); target.scrollIntoView({block:'start'}); } };
    });
    host.querySelectorAll('.tc-group-item').forEach(function (card) {
      var b = node('button', '지문으로 돌아가기', null, 'lr-back-to-passage'); b.type = 'button';
      b.onclick = back;
      card.insertBefore(b, card.firstChild);
    });
  }
  function historyData(item) {
    var id = item && (item.questionId || item.id), row = root.HANQ_HISTORY_READABLE && root.HANQ_HISTORY_READABLE[id];
    if (!row || row.status !== 'verified-text' || (item.version || item.v) !== row.version || item.exam !== row.exam || item.number !== row.number) return null;
    if (!Array.isArray(item.options) || item.options.length !== 5 || item.options.some(function (o, i) { return o.id !== id + '-option-' + (i + 1) || o.number !== i + 1; })) return null;
    if (row.common && (item.common ? JSON.stringify(item.common.questionNumbers) !== JSON.stringify(row.common.questionNumbers) : item.commonImageSha256 !== row.common.imageSha256)) return null;
    return row;
  }
  function history(item, box) {
    var row = historyData(item);
    if (!row) return null;
    var prose = node('section', undefined, box, 'lr-history-text'); prose.setAttribute('aria-label', item.number + '번 문제 원문');
    function rich(parent, text, underline) { var marks = Array.isArray(underline) ? underline : underline ? [underline] : [], pos = 0; marks.forEach(function (entry) { var mark = typeof entry === 'string' ? entry : entry.text, occurrence = entry.occurrence || 1, at = pos; for (var i = 0; i < occurrence; i++) { at = text.indexOf(mark, at); if (at < 0) return; if (i + 1 < occurrence) at += mark.length; } parent.appendChild(document.createTextNode(text.slice(pos, at))); node('u', mark, parent); pos = at + mark.length; }); parent.appendChild(document.createTextNode(text.slice(pos))); }
    function blocks(items) { items.forEach(function (block) {
      if (block.table) {
        var wrap = node('div', undefined, prose, 'lr-history-material'), table = node('table', undefined, wrap, 'lr-history-table'), head = node('thead', undefined, table), tr = node('tr', undefined, head), body = node('tbody', undefined, table);
        table.setAttribute('role', 'table'); head.setAttribute('role', 'rowgroup'); body.setAttribute('role', 'rowgroup'); tr.setAttribute('role', 'row');
        if (block.table.headers.length > 2) table.classList.add('lr-history-table-wide');
        block.table.headers.forEach(function (label) { var cell = node('th', label, tr); cell.scope = 'col'; cell.setAttribute('role', 'columnheader'); });
        block.table.rows.forEach(function (cells) { var row = node('tr', undefined, body); row.setAttribute('role', 'row'); cells.forEach(function (text, i) {
          var cell = node(i ? 'td' : 'th', undefined, row), label = node('span', block.table.headers[i], cell, 'lr-history-cell-label'); label.setAttribute('aria-hidden', 'true'); node('span', text, cell, 'lr-history-cell-value'); cell.setAttribute('role', i ? 'cell' : 'rowheader'); if (!i) cell.scope = 'row';
        }); });
      }
      else rich(node('p', undefined, prose, 'lr-history-material'), block.text, block.underline);
    }); }
    if (row.common) { node('h3', row.common.label, prose, 'lr-history-common-title'); blocks(row.common.blocks); }
    var stem = node('p', row.number + '. ', prose, 'lr-history-stem'); rich(stem, row.stem, row.stemUnderline);
    blocks(row.blocks);
    if (item.review) { var list = node('ol', undefined, prose, 'lr-history-options'); row.options.forEach(function (o) { node('li', o.text, list); }); }
    var original = node('details', undefined, box, 'lr-history-original'); node('summary', '원본 문제·보기 확인', original);
    return original;
  }
  function choices(item, box) {
    var row = historyData(item); if (!row || !box) return;
    var buttons = Array.from(box.querySelectorAll('button[data-option]'));
    if (!buttons.length || !buttons.every(function (b) { return row.options.some(function (o) { return o.id === b.dataset.option; }); })) return;
    box.classList.add('lr-text-choices'); buttons.forEach(function (b) {
      var o = row.options.find(function (o) { return o.id === b.dataset.option; });
      if (b.querySelector('.lr-choice-text')) return;
      var badge = node('span', ['①','②','③','④','⑤'][o.number - 1], null, 'lr-choice-number');
      var status = Array.from(b.querySelectorAll('small')), priorStatus = (b.getAttribute('aria-label') || '').split(' · ').slice(1); b.replaceChildren(badge); node('span', o.text, b, 'lr-choice-text'); status.forEach(function (s) { b.appendChild(s); });
      var labels = Array.from(new Set(priorStatus.concat(status.map(function (s) { return s.textContent; })).filter(Boolean)));
      b.setAttribute('aria-label', o.number + '번. ' + o.text + (labels.length ? ' · ' + labels.join(' · ') : ''));
    });
  }
  // A battle renderer supplies its already received, versioned question. No request,
  // answer, timer or reward state is owned here. prepare() can keep its old image target.
  function battleQuestion(question, content) {
    if (!question || question.part !== 0 || !Array.isArray(question.items) || question.items.length !== 1) return false;
    var item = question.items[0], first = item.choices && item.choices[0], match = first && /^(exam-\d{2}-\d{2})-option-1$/.exec(first.id), id = match && match[1];
    var q = id && root.HANQ_EXAM_POOL && root.HANQ_EXAM_POOL.questions[id];
    if (!q || question.version !== q.v || item.number !== q.number || JSON.stringify(question.images) !== JSON.stringify([q.commonImage, q.image].filter(Boolean))) return false;
    var sourceItem = {id:id, version:question.version, exam:q.exam, number:q.number, commonImageSha256:q.commonImageSha256, options:(item.choices || []).map(function (c, i) { return {id:c.id, number:i + 1}; })};
    if (!historyData(sourceItem)) return false;
    var material = content.querySelector('.bi-history-materials'), field = content.querySelector('.bi-item');
    if (!material || !field || material.dataset.lrHistory) return false;
    var original = history(sourceItem, material); if (!original) return false;
    material.dataset.lrHistory = '1'; material.classList.remove('bi-history-materials'); original.classList.add('bi-history-materials');
    choices(sourceItem, field); return true;
  }
  var zoom = null;
  function closeImage() { if (!zoom) return; var old = zoom; zoom = null; old.dialog.close(); old.dialog.remove(); document.body.classList.remove('lr-image-open'); if (old.trigger && old.trigger.isConnected) old.trigger.focus({preventScroll:true}); }
  function openImage(img, trigger) {
    closeImage();
    var dialog = node('dialog', undefined, document.body, 'lr-image-dialog'); dialog.setAttribute('aria-label', '원본 이미지 확대');
    var bar = node('div', undefined, dialog, 'lr-image-toolbar'), close = node('button', '닫기', bar), fit = node('button', '화면에 맞추기', bar), original = node('a', '원본 열기', bar);
    close.type = fit.type = 'button'; original.href = img.currentSrc || img.src; original.target = '_blank'; original.rel = 'noopener noreferrer';
    var pane = node('div', undefined, dialog, 'lr-image-pan'), full = node('img', undefined, pane); full.src = original.href; full.alt = img.alt || '원본 이미지';
    full.style.width = Math.max(img.naturalWidth || 720, 720) + 'px';
    fit.setAttribute('aria-pressed', 'false'); fit.onclick = function () { var on = fit.getAttribute('aria-pressed') !== 'true'; fit.setAttribute('aria-pressed', String(on)); full.style.width = on ? '100%' : Math.max(img.naturalWidth || 720, 720) + 'px'; fit.textContent = on ? '크게 보기' : '화면에 맞추기'; };
    close.onclick = closeImage; dialog.addEventListener('cancel', function (e) { e.preventDefault(); closeImage(); });
    zoom = {dialog:dialog, trigger:trigger || img}; document.body.classList.add('lr-image-open'); dialog.showModal(); close.focus();
  }
  function enhanceImages(scope) {
    (scope || document).querySelectorAll('img.mock-image,img.bi-question-image,img.tc-image,img.mr-image').forEach(function (img) {
      if (img.dataset.lrZoom) return; img.dataset.lrZoom = '1';
      var link = img.closest('a');
      if (!link) { img.tabIndex = 0; img.setAttribute('role', 'button'); img.setAttribute('aria-label', (img.alt || '원본 이미지') + ' · 확대 보기'); img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); openImage(img); } }, true); }
      (link || img).addEventListener('click', function (e) { if (e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); e.stopImmediatePropagation(); openImage(img, link || img); }, true);
    });
  }
  function enhanceLegacy(scope) {
    (scope || document).querySelectorAll('.mock-question[data-question]').forEach(function (card) {
      if (card.dataset.lrHistory) return;
      var q = root.HANQ_EXAM_POOL && root.HANQ_EXAM_POOL.questions[card.dataset.question], row = q && historyData(q);
      if (!row || card.dataset.version !== row.version) return;
      var first = card.querySelector('.mock-image-wrap'), options = card.querySelector('.mock-choices'); if (!first || !options) return;
      card.dataset.lrHistory = '1';
      var holder = node('div'); first.before(holder); var original = history(q, holder);
      card.querySelectorAll('.mock-image-wrap,.mock-common').forEach(function (n) { if (!original.contains(n) && !n.closest('.mock-common')) original.appendChild(n); });
      choices(q, options); var label = card.querySelector('.mock-select-title'); if (label) label.textContent = '답을 골라 주세요 · 원본 보기 순서';
    });
  }
  if (root.document) {
    var queued = false;
    function enhance() { queued = false; enhanceLegacy(); enhanceImages(); if (zoom && zoom.trigger && !zoom.trigger.isConnected) closeImage(); }
    function schedule() { if (queued) return; queued = true; root.requestAnimationFrame(enhance); }
    function start() { new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true}); enhance(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
    root.addEventListener('popstate', closeImage); root.addEventListener('hashchange', closeImage);
  }
  root.HanqLearningReader = {signature:signature, documents:documents, shell:shell, source:source, passage:passage, navigation:navigation, historyData:historyData, history:history, choices:choices, battleQuestion:battleQuestion, openImage:openImage, closeImage:closeImage};
})(typeof window !== 'undefined' ? window : globalThis);
