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
        label:parts.length === 1 ? (p.type === '지문' ? '원문' : p.type) : '지문 ' + (i + 1) + ' · ' + (p.type === '지문' ? '원문' : (ordinals[rank - 1] || rank + '번째') + ' ' + p.type)};
    });
  }
  function shell(parent, parts) {
    var wrap = node('div', undefined, parent, 'lr-documents');
    return parts.map(function (p) {
      var card = node('section', undefined, wrap, 'lr-document'), title = node('h3', p.label, card, 'lr-document-title');
      title.id = 'lr-document-' + (++seq); title.tabIndex = -1; card.setAttribute('aria-labelledby', title.id);
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
  // Past exams are presented only as their connected original images. Keep the
  // reviewed data/identity helper for consumers, without replacing source or choices.
  function history() { return null; }
  function choices() {}
  function battleQuestion() { return false; }
  var zoom = null;
  function closeImage() {
    if (!zoom) return;
    var old = zoom; zoom = null;
    if (old.viewport) { old.viewport.removeEventListener('resize', old.resize); old.viewport.removeEventListener('scroll', old.resize); }
    old.dialog.close(); old.dialog.remove(); document.body.classList.remove('lr-image-open');
    if (old.trigger && old.trigger.isConnected) old.trigger.focus({preventScroll:true});
  }
  // Owners call this before revoking a blob, including route/account changes. A
  // late decode may never leave a detached full-screen copy of private material.
  function releaseImage(url) { if (zoom && zoom.src === url) closeImage(); }
  function tapToClose(target, close) {
    var start = null, moved = false, ignoreUntil = 0;
    target.addEventListener('pointerdown', function (e) { start = {x:e.clientX,y:e.clientY}; moved = false; });
    target.addEventListener('pointermove', function (e) { if (start && (Math.abs(e.clientX-start.x)>8 || Math.abs(e.clientY-start.y)>8)) moved = true; });
    target.addEventListener('pointerup', function () { if (moved) ignoreUntil = Date.now()+700; start = null; });
    target.addEventListener('pointercancel', function () { start = null; ignoreUntil = Date.now()+700; });
    target.addEventListener('touchstart', function (e) { if (e.touches.length>1) ignoreUntil = Date.now()+700; }, {passive:true});
    target.addEventListener('touchmove', function () { ignoreUntil = Date.now()+700; }, {passive:true});
    target.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); if (!moved && Date.now()>=ignoreUntil) close(); });
    target.addEventListener('keydown', function (e) { if (e.key==='Enter' || e.key===' ') { e.preventDefault(); e.stopPropagation(); close(); } });
    target.tabIndex = 0; target.setAttribute('role','button'); target.setAttribute('aria-label','확대 이미지 닫기');
  }
  function openImage(img, trigger) {
    closeImage();
    var src = img.currentSrc || img.src; if (!src) return;
    var dialog = node('dialog', undefined, document.body, 'lr-image-dialog'); dialog.setAttribute('aria-label', '원본 이미지 확대 · 이미지를 다시 누르면 닫기');
    if (img.closest('.formal-exams') || img.hasAttribute('data-company-exam-image')) dialog.setAttribute('data-company-exam', '');
    var bar = node('div', undefined, dialog, 'lr-image-toolbar'), close = node('button', '닫기', bar), fit = node('button', '화면에 맞추기', bar), original = node('a', '원본 열기', bar);
    close.type = fit.type = 'button'; original.href = src; original.target = '_blank'; original.rel = 'noopener noreferrer';
    var pane = node('div', undefined, dialog, 'lr-image-pan'), full = node('img', undefined, pane); full.src = src; full.alt = img.alt || '원본 이미지';
    full.style.width = Math.max(img.naturalWidth || 720, 720) + 'px'; tapToClose(full, closeImage);
    fit.setAttribute('aria-pressed', 'false'); fit.onclick = function () { var on = fit.getAttribute('aria-pressed') !== 'true'; fit.setAttribute('aria-pressed', String(on)); full.style.width = on ? '100%' : Math.max(img.naturalWidth || 720, 720) + 'px'; fit.textContent = on ? '크게 보기' : '화면에 맞추기'; };
    close.onclick = closeImage; dialog.addEventListener('cancel', function (e) { e.preventDefault(); closeImage(); });
    dialog.addEventListener('close', function () { if (zoom && zoom.dialog===dialog) closeImage(); });
    var viewport = root.visualViewport;
    function resize() { if (!viewport) return; dialog.style.top=viewport.offsetTop+'px'; dialog.style.left=viewport.offsetLeft+'px'; dialog.style.right='auto'; dialog.style.bottom='auto'; dialog.style.width=viewport.width+'px'; dialog.style.height=viewport.height+'px'; }
    zoom = {dialog:dialog, trigger:trigger || img, src:src, viewport:viewport, resize:resize};
    if (viewport) { viewport.addEventListener('resize',resize); viewport.addEventListener('scroll',resize); resize(); }
    document.body.classList.add('lr-image-open'); dialog.showModal(); close.focus({preventScroll:true});
  }
  function enhanceImages(scope) {
    (scope || document).querySelectorAll('img.mock-image,img.bi-question-image,img.tc-image,img.mr-image,img[data-company-exam-image],.mock-zoom img').forEach(function (img) {
      // Only connected exam assets receive the company-mode exception.
      if (/^media\/exam(?:-expanded)?\/\d{2}-(?:\d{2}|common\d{2}-\d{2})\.webp$/.test(img.getAttribute('src') || '')) img.setAttribute('data-company-exam-image','');
      if (img.dataset.lrZoom) return; img.dataset.lrZoom = '1';
      var question = /^media\/exam(?:-expanded)?\/(\d{2})-(\d{2})\.webp$/.exec(img.getAttribute('src') || '');
      if (question && img.classList.contains('mock-image') && !img.closest('dialog,.mock-zoom')) {
        function trimStatic() { root.HanqQuestionPreview?.apply(img, {exam:+question[1], number:+question[2]}); }
        if (img.complete && img.naturalWidth) trimStatic();
        else img.addEventListener('load', trimStatic, {once:true});
      }
      if (img.closest('.mock-zoom')) { tapToClose(img, function () { if (root.HanqImageViewer) root.HanqImageViewer.close(); }); return; }
      var link = img.closest('a');
      if (!link) { img.tabIndex = 0; img.setAttribute('role', 'button'); img.setAttribute('aria-label', (img.alt || '원본 이미지') + ' · 확대 보기'); img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); openImage(img); } }, true); }
      else { link.setAttribute('aria-haspopup','dialog'); link.addEventListener('keydown', function(e) { if(e.key===' ') { e.preventDefault(); e.stopImmediatePropagation(); openImage(img,link); } },true); }
      (link || img).addEventListener('click', function (e) { if (e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); e.stopImmediatePropagation(); openImage(img, link || img); }, true);
      if (img.classList.contains('mock-image') && !img.dataset.lrError) {
        img.dataset.lrError='1'; function failed() {
          if (!img.isConnected || img.parentElement.querySelector('.lr-image-error')) return;
          var note=node('p',(img.alt || '이 문항')+' 원본 이미지를 불러오지 못했어요. 이미지 다시 확인 또는 새로고침 후에도 같으면 이 회차·문항의 원본 연결을 복구해 주세요.',img.parentElement,'lr-image-error'); note.setAttribute('role','alert');
        }
        img.addEventListener('error',failed); if(img.complete && !img.naturalWidth && img.getAttribute('src')) failed();
      }
    });
  }
  if (root.document) {
    var queued = false;
    function enhance() { queued = false; enhanceImages(); if (zoom && zoom.trigger && !zoom.trigger.isConnected) closeImage(); }
    function schedule() { if (queued) return; queued = true; root.requestAnimationFrame(enhance); }
    function start() { new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['src']}); enhance(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
    root.addEventListener('popstate', closeImage); root.addEventListener('hashchange', closeImage); root.addEventListener('pagehide', closeImage);
  }
  root.HanqLearningReader = {signature:signature, documents:documents, shell:shell, source:source, passage:passage, navigation:navigation, historyData:historyData, history:history, choices:choices, battleQuestion:battleQuestion, openImage:openImage, closeImage:closeImage, releaseImage:releaseImage};
})(typeof window !== 'undefined' ? window : globalThis);


