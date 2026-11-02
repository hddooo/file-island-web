/* 한국사 한눈에 · 확인 문제 풀이(공용)
 * 문항 카탈로그(media/quiz-catalog.js)의 문항 풀이 카드(overview)와 보기별 풀이를 ‘안정 보기 ID’로 묶어 돌려준다. 앱의 빈칸(객관식) 화면이 쓰고,
 * 뒤에 만들 오답 다시 풀기·마이페이지도 같은 계약(contract)과 그리기(render · renderOverview)를 그대로 쓴다. 저장은 하지 않는다.
 *
 * contract(item, selectedOptionId) → {
 *   schema:2, questionId, contentVersion, reviewVersion, chapter, shape, ask, question,
 *   selectedOptionId, correctOptionId, correct(bool|null: 고르지 않았으면 null),
 *   overview:{answer, ask, reason[], clue[], context[], memory[], contrast[], refs[]} — 문항 풀이 카드(정답 · 왜 · 결정 단서 · 흐름 · 외울 말 · 헷갈림 · 근거),
 *   options:[{optionId, text, correct, selected, verdict:'correct'|'selected-wrong'|'other', lines:[‘**굵게**’ 표시가 든 짧은 줄]}],
 *   sources:[{id, chapterTitle, prompt, number, line, pdfPage(문제가 실린 실제 PDF 쪽, 증명 못 하면 null), bookPage, rawAnswer, answer, correctedFrom?, clarified?}](감사용 원래 기록), legacyId|null, cue
 * }
 * renderOverview(item) → 문항 풀이 카드 HTML. render(item, selectedOptionId) → 카드 + 보기마다 ✓/× 표시와 풀이(한 줄씩 쌓임).
 * renderCompact(item, selectedOptionId) → 정답 관련 암기 핵심 3~5항목 + 각 오답 선지의 검증된 한 문장. 긴 배경·전체 원문은 학습 UI에서 제외.
 * 화면의 출처는 짧게(‘교재 확인 문제 · 장 n번 · PDF n쪽’), 정정·문맥 보완이 있을 때만 접힌 ‘출처와 정정 기록’을 붙인다. 원문 행·내부 ID는 화면에 내지 않는다.
 * 채점 전에는 부르지 않는다(정답·풀이가 미리 보이지 않게).
 */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function md(s) { return esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'); }
  function correctOf(item) { return (item.options || []).filter(function (o) { return o.correct; })[0] || null; }
  function sourceRefs(item) {
    return (item.sources || []).map(function (s) {
      var r = { id: s.id, chapterTitle: s.chapterTitle, prompt: s.prompt, number: s.number, line: s.line, pdfPage: s.pdfPage || null, bookPage: s.bookPage || null, answer: s.answer, rawAnswer: s.rawAnswer };
      if (s.correction) r.correctedFrom = { rawAnswer: s.correction.raw_answer, pdfPage: s.correction.source_pdf_page, bookPage: s.correction.source_book_page };
      if (s.clarification) r.clarified = { rawQuestion: s.clarification.raw_question, pdfPage: s.clarification.source_pdf_page, bookPage: s.clarification.source_book_page };
      return r;
    });
  }
  function overviewOf(item) {
    var o = item.overview || {};
    function arr(x) { return Array.isArray(x) ? x.slice() : []; }
    return { answer: o.answer || '', ask: o.ask || null, reason: arr(o.reason), clue: arr(o.clue), context: arr(o.context), memory: arr(o.memory), contrast: arr(o.contrast), refs: arr(o.refs) };
  }
  function contract(item, selectedOptionId) {
    var c = correctOf(item), sel = selectedOptionId || null;
    return {
      schema: 2, questionId: item.id, contentVersion: item.v, reviewVersion: item.rv || null, chapter: item.chapter, shape: item.shape, ask: item.ask || null, question: item.q,
      selectedOptionId: sel, correctOptionId: c ? c.id : null, correct: sel ? !!(c && c.id === sel) : null,
      overview: overviewOf(item),
      options: (item.options || []).map(function (o) {
        return { optionId: o.id, text: o.text, correct: !!o.correct, selected: o.id === sel, verdict: o.correct ? 'correct' : (o.id === sel ? 'selected-wrong' : 'other'), lines: (o.review || []).slice() };
      }),
      sources: sourceRefs(item), legacyId: item.legacy ? item.id : null, cue: item.cue || ''
    };
  }
  function linesHtml(lines) { return '<ul class="qexp-lines">' + lines.map(function (l) { return '<li>' + md(l) + '</li>'; }).join('') + '</ul>'; }
  function optionHtml(o) {
    var mark = o.verdict === 'correct' ? '<span class="qverdict ok" aria-label="정답">✓ 정답</span>' : (o.verdict === 'selected-wrong' ? '<span class="qverdict no" aria-label="고른 오답">× 내가 고른 답</span>' : '<span class="qverdict other">다른 보기</span>');
    return '<li class="qreview-opt ' + o.verdict + '" data-option="' + esc(o.optionId) + '"><p class="qreview-head">' + mark + '<b>' + esc(o.text) + '</b></p>' + linesHtml(o.lines) + '</li>';
  }
  /* 객관식 화면의 지시문: 원래 ‘쓰세요·적으세요’는 카탈로그·문서에 그대로 두고 화면에서만 ‘고르세요’ */
  function mcPrompt(s) { return String(s == null ? '' : s).replace(/^\d+\)\s*/, '').replace(/(?:적어\s*보세요|적으세요|쓰세요)/g, '고르세요'); }
  /* 화면용 짧은 출처: 원문 행·ID·해시 없이 사람이 찾아볼 수 있는 말만. 문제가 실린 쪽은 교재 글에서 하나로 증명된 것만 */
  function shortSource(r) {
    var g = mcPrompt(r.prompt);
    if (g.length > 26) g = g.slice(0, 25) + '…';
    return '교재 확인 문제 · ' + esc(r.chapterTitle) + (g ? ' · ' + esc(g) : '') + (r.number ? ' ' + esc(r.number) + '번' : '');
  }
  function sourcesHtml(refs) {
    if (!refs.length) return '';
    var seen = {}, list = [];
    refs.forEach(function (r) { var t = shortSource(r); if (!seen[t]) { seen[t] = 1; list.push(t); } });
    var notes = refs.filter(function (r) { return r.correctedFrom || r.clarified; }).map(function (r) {
      var t = shortSource(r);
      if (r.correctedFrom) t += ' — 정답 표기 정정(교재 정답표 대조): ‘' + esc(r.correctedFrom.rawAnswer || '(빈칸)') + '’ → ‘' + esc(r.answer) + '’';
      if (r.clarified) t += ' — 묻는 대상 밝힘(교재 표 대조). 원래 문장: ‘' + esc(r.clarified.rawQuestion) + '’';
      return '<li>' + t + '</li>';
    });
    return '<p class="qsrc">출처 · ' + list.join(' / ') + '</p>' +
      (notes.length ? '<details class="qsrc-more"><summary>출처와 정정 기록</summary><ul>' + notes.join('') + '</ul></details>' : '');
  }
  /* 카드의 근거 줄: 교재 쪽 · 흐름 카드 이름 · 핵심 개념 · 기존 풀이 · 강의(행 번호는 내지 않음) */
  function refsText(refs) {
    var out = [], seen = {};
    function add(t) { if (t && !seen[t]) { seen[t] = 1; out.push(t); } }
    refs.forEach(function (r) {
      if (r.kind === 'textbook') add(r.section ? '교재 ‘' + r.section + '’' : '교재 본문');
      else if (r.kind === 'flow') add('흐름 카드 ‘' + r.flow + '’');
      else if (r.kind === 'notes') add('교재 핵심 개념');
      else if (r.kind === 'legacy-why') add('기존 풀이');
      else if (r.kind === 'teacher') add('강의');
      else if (r.kind === 'confirm-answer') add('교재 확인 문제 정답');
      else if (r.kind === 'exam') add('기출 원문 제' + r.exam + '회 ' + r.number + '번 · 공식 정답');
      else if (r.kind === 'legacy-mock') add('예전 실전 모의 풀이');
    });
    return out.map(esc).join(' · ');
  }
  function chips(xs, cls) { return '<p class="qcard-chips ' + cls + '">' + xs.map(function (x) { return '<span>' + md(x) + '</span>'; }).join('') + '</p>'; }
  function block(title, body) { return body ? '<div class="qcard-row"><h4>' + title + '</h4>' + body + '</div>' : ''; }
  function renderOverview(item) {
    var o = overviewOf(item);
    if (!o.reason.length) return '';
    var r = refsText(o.refs);
    return '<section class="qcard" aria-label="문항 풀이">' +
      '<p class="qcard-ans"><span class="qcard-tag">정답</span><b>' + esc(o.answer) + '</b>' + (o.ask ? '<small>' + esc(o.ask) + '</small>' : '') + '</p>' +
      block('왜', linesHtml(o.reason)) +
      block('결정 단서', o.clue.length ? chips(o.clue, 'is-clue') : '') +
      block('흐름', o.context.length ? linesHtml(o.context) : '') +
      block('외울 말', o.memory.length ? chips(o.memory, 'is-memo') : '') +
      block('헷갈림', o.contrast.length ? linesHtml(o.contrast) : '') +
      (r ? '<p class="qcard-src">근거 · ' + r + '</p>' : '') +
      '</section>';
  }
  function render(item, selectedOptionId) {
    var k = contract(item, selectedOptionId);
    return renderOverview(item) + '<ol class="qreview" aria-label="보기별 풀이">' + k.options.map(optionHtml).join('') + '</ol>' + sourcesHtml(k.sources);
  }
  /* 간단한 학습 해설: 정답 관련 핵심 최대 5항목과 오답 선지별 한 문장. 원본 계약·전체 render API는 그대로 보존한다. */
  function firstReasonSentence(line) {
    var text = String(line || ''), sentence = text.match(/^([\s\S]*?[가-힣][.!?])(?:\s|$)/);
    return sentence ? sentence[1] : text; // 날짜의 숫자 마침표는 문장 끝으로 자르지 않는다. 원문 나머지는 자세히 보기에 보존.
  }
  function renderCompact(item, selectedOptionId) {
    var o = overviewOf(item), k = contract(item, selectedOptionId), points = [], seen = {};
    function add(line) {
      if (!line || points.length >= 5) return;
      var text = firstReasonSentence(line), normalized = text.replace(/\*\*/g, '').replace(/\s/g, '');
      if (normalized && !seen[normalized]) { seen[normalized] = true; points.push(text); }
    }
    // 검증된 정답 관련 필드만. 긴 배경(context)과 원문 전체는 학습 화면에 펼치지 않는다.
    add(o.reason[0]); add(o.memory[0]); add(o.clue[0]); add(o.contrast[0]);
    o.memory.slice(1).forEach(add); o.reason.slice(1).forEach(add); o.clue.slice(1).forEach(add); o.contrast.slice(1).forEach(add);
    if (!points.length && item.cue) add(item.cue);
    var c = correctOf(item), wrong = k.options.filter(function (x) { return !x.correct; });
    var briefs = wrong.map(function (x) {
      // 각 선지에 이미 연결된 검증된 풀이의 첫 완결 문장만. 새 역사 사실은 만들지 않는다.
      var line = x.lines.filter(function (l) { return String(l || '').trim(); })[0];
      return '<li class="qc-option' + (x.selected ? ' is-selected' : '') + '" data-option="' + esc(x.optionId) + '"><b>' + esc(x.text) + '</b>' + (line ? '<span>' + md(firstReasonSentence(line)) + '</span>' : '') + '</li>';
    }).join('');
    return '<section class="qcompact" aria-label="정답 핵심과 오답 선지 해설">' +
      '<p class="qc-answer"><span class="qcard-tag">정답</span><b>' + esc(o.answer || (c ? c.text : '')) + '</b></p>' +
      (points.length ? '<ul class="qc-keypoints" aria-label="정답 암기 핵심">' + points.map(function (line) { return '<li>' + md(line) + '</li>'; }).join('') + '</ul>' : '') +
      (briefs ? '<div class="qc-options"><h4>오답 선지 · 틀린 이유</h4><ul class="qc-option-brief">' + briefs + '</ul></div>' : '') +
      (k.sources.length ? '<p class="qsrc">출처 · ' + shortSource(k.sources[0]) + '</p>' : '') + '</section>';
  }
  /* 화면의 보기 바로 아래에 붙일 풀이(같은 계약에서 보기 하나만) */
  function optionLinesHtml(item, optionId, selectedOptionId) {
    var k = contract(item, selectedOptionId), o = k.options.filter(function (x) { return x.optionId === optionId; })[0];
    return o ? linesHtml(o.lines) : '';
  }
  window.HanqQuizReview = {
    contract: contract, render: render, renderCompact: renderCompact, renderOverview: renderOverview, overview: overviewOf, optionLinesHtml: optionLinesHtml,
    sourcesHtml: function (item) { return sourcesHtml(sourceRefs(item)); }, mcPrompt: mcPrompt, md: md
  };
})();
