(function (root) {
  'use strict';

  // Only index the app's existing study notes and glossary, not private PDF bytes,
  // account data, recall answers, or exam questions.
  function folded(value) {
    return String(value || '').normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  }
  function indexChapters(chapters, sources) {
    var cards = new Map();
    chapters.forEach(function (chapter) {
      if (!chapter.hidden) cards.set(chapter.id, []);
    });
    function add(id, values) {
      var list = cards.get(id);
      if (!list) return;
      values.forEach(function (value) {
        if (typeof value !== 'string') return;
        var text = value.trim().normalize('NFC'), key = folded(text);
        if (key && !list.some(function (item) { return item.key === key; })) list.push({ text: text, key: key });
      });
    }
    chapters.forEach(function (c) {
      var id = c.studyAlias || c.partOf || c.id;
      add(id, [c.title, c.desc]);
      (c.note || []).forEach(function (note) { add(id, [note.title].concat(note.items || [])); });
      var concept = (sources.concepts || {})[c.id] || {};
      (concept.core || []).concat(concept.compare || []).forEach(function (group) {
        add(id, [group.g, group.title]);
        (group.rows || []).forEach(function (row) { if (Array.isArray(row)) add(id, row); });
      });
      var summary = (sources.summaries || {})[c.id] || {};
      (summary.sections || []).forEach(function (section) {
        add(id, [section.title]);
        (section.groups || []).forEach(function (group) {
          add(id, [group.title]);
          (group.rows || []).forEach(function (row) { add(id, [row.key, row.fact]); });
        });
      });
    });
    (sources.terms || []).forEach(function (term) {
      var sourceChapter = chapters.find(function (chapter) { return chapter.id === term.era; });
      if (sourceChapter) {
        add(sourceChapter.partOf || sourceChapter.studyAlias || sourceChapter.id,
          [term.term, term.phrase, term.summary].concat(term.aliases || []));
      }
    });
    return cards;
  }
  function matchSpan(text, keyword) {
    var key = '', starts = [], ends = [], offset = 0;
    for (var char of text) {
      var normalized = folded(char);
      for (var i = 0; i < normalized.length; i++) {
        starts.push(offset);
        ends.push(offset + char.length);
      }
      offset += char.length;
      key += normalized;
    }
    var found = key.indexOf(keyword);
    return found === -1 ? null : [starts[found], ends[found + keyword.length - 1]];
  }
  function paint(node, text, keyword) {
    var span = keyword && matchSpan(text, keyword), doc = node.ownerDocument;
    if (!span) { node.textContent = text; return false; }
    var mark = doc.createElement('mark');
    mark.textContent = text.slice(span[0], span[1]);
    node.replaceChildren(doc.createTextNode(text.slice(0, span[0])), mark, doc.createTextNode(text.slice(span[1])));
    return true;
  }
  function mount(app, chapters) {
    var field = app.querySelector('[data-era-search]'), toc = app.querySelector('.toc');
    if (!field || !toc) return;
    var input = field.querySelector('input'), reset = field.querySelector('button'), status = field.querySelector('[role="status"]');
    var data = indexChapters(chapters, {
      concepts: root.HANQ_TEXTBOOK, summaries: root.HANQ_ERA_FULL_SUMMARIES,
      terms: ((root.HanqHistory81VerifiedGlossary || {}).definitions || []).concat((root.HanqHistory81TermData || {}).entries || [])
    });
    var rows = Array.from(toc.querySelectorAll('.period[data-id]')).map(function (card) {
      var title = card.querySelector('.period-text strong'), desc = card.querySelector('.period-text small');
      var note = field.ownerDocument.createElement('span');
      note.className = 'era-search-hit'; note.hidden = true;
      desc.after(note);
      return { card: card, title: title, desc: desc, note: note, titleText: title.textContent.normalize('NFC'), descText: desc.textContent.normalize('NFC'), terms: data.get(card.dataset.id) || [] };
    });
    function update() {
      var raw = input.value.trim(), keyword = folded(raw), count = 0;
      reset.hidden = !input.value;
      rows.forEach(function (r) {
        var hit = keyword && r.terms.filter(function (item) { return item.key.includes(keyword); })
          .reduce(function (best, item) { return !best || (item.key === keyword && best.key !== keyword) ||
              (best.key !== keyword && item.text.length < best.text.length) ? item : best; }, null);
        r.card.classList.toggle('era-search-match', !!hit);
        var titleHit = paint(r.title, r.titleText, hit ? keyword : '');
        var descHit = paint(r.desc, r.descText, hit ? keyword : '');
        r.note.hidden = !hit || titleHit || descHit;
        if (r.note.hidden) r.note.textContent = '';
        if (hit) {
          count++;
          if (!r.note.hidden) {
            var span = matchSpan(hit.text, keyword);
            if (span) {
              var start = Math.max(0, span[0] - 19), end = Math.min(hit.text.length, span[1] + 24);
              paint(r.note, (start ? '…' : '') + hit.text.slice(start, end) + (end < hit.text.length ? '…' : ''), keyword);
            }
          }
        }
      });
      status.textContent = !raw ? '' : count ? '일치하는 시대 ' + count + '곳' : '일치하는 시대가 없어요.';
      status.hidden = !raw;
    }
    function clear() { input.value = ''; update(); input.focus(); }
    input.addEventListener('input', function (event) { if (!event.isComposing) update(); });
    input.addEventListener('compositionend', update);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !event.isComposing && input.value) { event.preventDefault(); clear(); }
    });
    reset.addEventListener('click', clear);
    update();
  }
  var api = { indexChapters: indexChapters, folded: folded, matchSpan: matchSpan, mount: mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HanqHistoryEraSearch = api;
})(typeof window === 'undefined' ? globalThis : window);
