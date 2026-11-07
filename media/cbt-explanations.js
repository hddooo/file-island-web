/* Final CBT results only. Reviewed explanations replace display text, never saved exam data. */
(function (root) {
  'use strict';
  function array(x) { return Array.isArray(x) ? x : []; }
  function optionsValid(xs) { return Array.isArray(xs) && xs.length === 5 && xs.every(function(o) { return o && typeof o === 'object' && !Array.isArray(o); }); }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function md(x) { return esc(x).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'); }
  function lines(xs) { return array(xs).filter(function(x) { return typeof x === 'string' && x.trim(); }); }
  function list(xs) { return '<ul>' + lines(xs).map(function(x) { return '<li>' + md(x) + '</li>'; }).join('') + '</ul>'; }
  function matching(q, entry) {
    var v = q && q.review, old = v && v.item;
    if (!entry || !optionsValid(entry.options) || !Number.isInteger(entry.answer) || entry.answer < 1 || entry.answer > 5 || !v || !old || !['correct','wrong','unanswered'].includes(v.status)) return false;
    if (q.questionId !== entry.id || old.id !== entry.id || q.version !== entry.v || old.v !== entry.v ||
        q.exam !== entry.exam || q.number !== entry.number || old.exam !== entry.exam || old.number !== entry.number || q.points !== entry.points || old.points !== entry.points ||
        old.answer !== entry.answer || v.correctNumber !== entry.answer || v.correctOptionId !== entry.options[entry.answer - 1].id) return false;
    var opts = array(old.options), pub = array(q.options), graded = array(v.options);
    if (!optionsValid(opts) || !optionsValid(pub) || !optionsValid(graded)) return false;
    return entry.options.every(function(o, i) {
      return pub[i].id === o.id && pub[i].number === i + 1 && opts[i].id === o.id && opts[i].number === i + 1 &&
        opts[i].text === o.text && opts[i].correct === o.correct && graded[i].id === o.id && graded[i].number === i + 1 && graded[i].correct === o.correct;
    });
  }
  function resolve(q, status) {
    if (status !== 'final') return null;
    var data = root.HANQ_CBT_EXPLANATIONS, extra = root.HANQ_CBT_EXPLANATIONS_80;
    var entry = q && ((data && data.items && data.items[q.questionId]) || (extra && extra.items && extra.items[q.questionId]));
    return matching(q, entry) ? entry : null;
  }
  function render(q, legacy, status) {
    if (status !== 'final' || !q || !q.review) return '';
    var entry = resolve(q, status), item = entry || q.review.item || {}, o = item.overview || {}, opts = array(item.options);
    // Unknown/old schemas keep the established renderer; never substitute another question.
    if (!lines(o.reason).length || !optionsValid(opts)) {
      try { return legacy && legacy.render ? legacy.render(item, q.selectedOptionId || null) : ''; } catch (e) { return ''; }
    }
    var key = 'fe-exp-' + String(q.exam) + '-' + String(q.position).replace(/[^a-z0-9_-]/gi, ''), selected = q.selectedOptionId || null;
    var reason = lines(o.reason), extra = reason.slice(3).concat(lines(o.context));
    var html = '<article class="fe-explanation" data-reviewed="' + (entry ? 'true' : 'false') + '">' +
      '<section class="fe-stem-analysis" aria-labelledby="' + key + '-stem"><h4 id="' + key + '-stem">지문 분석</h4>' +
      '<div class="fe-exp-meaning">' + list(reason.slice(0, 1)) + '</div>' +
      (reason.length > 1 ? '<div class="fe-exp-core">' + list(reason.slice(1, 3)) + '</div>' : '') +
      '<p class="fe-exp-answer"><b>정답 연결</b> ' + md(o.answer) + '</p>' +
      (lines(o.contrast).length ? '<div class="fe-exp-contrast"><b>헷갈림 구분</b>' + list(lines(o.contrast).slice(0, 1)) + '</div>' : '') +
      '<details class="fe-exp-context"><summary>핵심어·배경 더 보기</summary>' +
      (lines(o.clue).length ? '<p class="fe-exp-keywords"><b>결정 단서</b> ' + lines(o.clue).map(function(s) { return '<span>' + md(s) + '</span>'; }).join(' ') + '</p>' : '') +
      (lines(o.memory).length ? '<p class="fe-exp-keywords"><b>함께 외울 말</b> ' + lines(o.memory).map(function(s) { return '<span>' + md(s) + '</span>'; }).join(' ') + '</p>' : '') +
      list(extra.concat(lines(o.contrast).slice(1))) + '</details></section>' +
      '<section class="fe-option-analysis" aria-labelledby="' + key + '-options"><h4 id="' + key + '-options">보기 분석</h4><ol>';
    html += opts.map(function(p, i) {
      var good = p.correct === true, chosen = p.id === selected;
      return '<li class="fe-exp-option ' + (good ? 'is-correct' : 'is-incorrect') + (chosen ? ' is-selected' : '') + '" data-option-id="' + esc(p.id) + '">' +
        '<p class="fe-exp-option-heading"><b>' + '①②③④⑤'[i] + '</b><span>' + (good ? '정답' : '오답 보기') + (chosen ? ' · 내가 고른 답' : '') + '</span></p>' + list(lines(p.review).slice(0, 1)) +
        (lines(p.review).length > 1 ? '<details class="fe-exp-context"><summary>설명 더 보기</summary>' + list(lines(p.review).slice(1)) + '</details>' : '') + '</li>';
    }).join('');
    html += '</ol></section>';
    if (entry && entry.references && entry.references.length) html += '<details class="fe-exp-sources"><summary>해설 근거</summary><ul>' + entry.references.map(function(r) {
      return '<li>' + (/^https:\/\/[^\s/]+\//.test(r.url || '') ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.label) + '</a>' : esc(r.label)) + '</li>';
    }).join('') + '</ul></details>';
    return html + '</article>';
  }
  // Wrong-note replay/study APIs reveal this item only after grading. The independently
  // returned correct option is still required; this adapter never grades or saves an answer.
  function renderGraded(saved, selected, correctId, position, displayed) {
    var item = saved && saved.item, options = item && array(item.options), visible = displayed && displayed.item;
    if (!item || !/^exam-(?:7[0-9]|80)-[0-9]{2}$/.test(item.id || '') || !optionsValid(options) || !correctId || !visible || displayed.kind !== 'mock') return '';
    if (displayed.questionId !== item.id || displayed.version !== item.v || visible.id !== item.id || visible.v !== item.v ||
        visible.exam !== item.exam || visible.number !== item.number || visible.points !== item.points ||
        (displayed.points != null && displayed.points !== item.points) || !optionsValid(visible.options)) return '';
    var order = array(displayed.optionOrder);
    if (order.length !== 5 || !options.every(function(o, i) { return order[i] === o.id && visible.options[i].id === o.id && visible.options[i].text === o.text; })) return '';
    var number = options.findIndex(function(o) { return o.id === correctId; }) + 1;
    if (!number) return '';
    var q = { questionId:item.id, version:item.v, exam:item.exam, number:item.number, points:item.points,
      position:position == null ? item.number : position, selectedOptionId:selected || null,
      options:options.map(function(o) { return {id:o.id,number:o.number}; }),
      review:{item:item, status:selected ? (selected === correctId ? 'correct' : 'wrong') : 'unanswered',
        correctNumber:number, correctOptionId:correctId, options:options} };
    return resolve(q, 'final') ? render(q, null, 'final') : '';
  }
  root.HanqCbtExplanations = { resolve: resolve, render: render, renderGraded: renderGraded };
})(window);
