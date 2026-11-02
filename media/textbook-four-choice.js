/* Derived practice only: original source blanks remain independently available. */
(function (root) {
  'use strict';
  function valid(data) {
    return !!data && data.schemaVersion === 'hanq-source-four-choice/1' && Array.isArray(data.items) && data.items.length > 0 && data.items.length <= 200 &&
      new Set(data.items.map(function (i) { return i && i.id; })).size === data.items.length && data.items.every(function (i) {
        return i && typeof i.id === 'string' && i.reviewStatus === 'verified' && i.sourceQuestion && typeof i.sourceQuestion.sourceText === 'string' &&
          i.sourceQuestion.source && Number.isInteger(i.sourceQuestion.source.pdfPage) && Array.isArray(i.options) && i.options.length === 4 &&
          i.options.every(function (o) { return o && typeof o.id === 'string' && typeof o.text === 'string' && o.text.trim(); }) &&
          new Set(i.options.map(function (o) { return o.id; })).size === 4 &&
          new Set(i.options.map(function (o) { return o.text.normalize('NFKC').replace(/\s/g, ''); })).size === 4 &&
          i.options.filter(function (o) { return o.id === i.correctOptionId; }).length === 1;
      });
  }
  function render(host, data) {
    if (!valid(data)) throw new Error('invalid_four_choice_data');
    var doc = host.ownerDocument, alive = true, cursor = 0, answers = new Map(), graded = new Set(), indices = data.items.map(function (_, i) { return i; });
    var shell = doc.createElement('section'); shell.className = 'textbook-four-choice'; host.replaceChildren(shell);
    function el(tag, text) { var n = doc.createElement(tag); if (text != null) n.textContent = text; return n; }
    function button(label, action) { var b = el('button', label); b.type = 'button'; b.addEventListener('click', function () { if (alive) action(); }); return b; }
    function draw() {
      if (!alive) return;
      shell.replaceChildren();
      shell.appendChild(el('h3', '교재 기반 4지선다 연습'));
      shell.appendChild(el('p', '원문 빈칸에 교재에서 확인한 보기를 붙인 연습이에요. 전체 빈칸은 ‘교재 빈칸’에서 볼 수 있어요.'));
      shell.appendChild(el('p', '풀이 결과는 이 화면에서만 유지돼요. 화면을 나가면 초기화돼요.'));
      var item = data.items[indices[cursor]], q = item.sourceQuestion, done = graded.has(item.id), selected = answers.get(item.id);
      var count = el('p', (cursor + 1) + ' / ' + indices.length + '문항');
      count.setAttribute('data-choice-position', ''); shell.appendChild(count);
      if (q.subtopicTitle) shell.appendChild(el('h4', q.subtopicTitle));
      var question = el('p', q.sourceText); question.style.whiteSpace = 'pre-wrap'; question.style.fontSize = '17px'; question.setAttribute('data-source-question', ''); question.setAttribute('data-source-item-id', item.sourceItemId || item.id); shell.appendChild(question);
      var group = el('fieldset'), legend = el('legend', '정답 하나를 선택하세요'); group.appendChild(legend);
      item.options.forEach(function (option, index) {
        var label = el('label'); label.style.display = 'block'; label.style.padding = '12px'; label.style.cursor = 'pointer';
        var radio = el('input'); radio.type = 'radio'; radio.name = 'source-choice'; radio.value = option.id; radio.checked = selected === option.id; radio.disabled = done;
        radio.addEventListener('change', function () { if (alive && !graded.has(item.id)) { answers.set(item.id, option.id); submit.disabled = false; } });
        label.appendChild(radio); label.appendChild(doc.createTextNode(' ' + (index + 1) + '. ' + option.text)); group.appendChild(label);
      }); shell.appendChild(group);
      var submit = button('정답 확인', function () { if (!answers.has(item.id)) return; graded.add(item.id); draw(); }); submit.disabled = done || !selected; shell.appendChild(submit);
      if (done) {
        var result = el('div'); result.setAttribute('role', 'status'); result.setAttribute('data-choice-result', '');
        var correct = item.options.find(function (o) { return o.id === item.correctOptionId; });
        result.appendChild(el('strong', selected === item.correctOptionId ? '정답이에요.' : '다시 확인해 보세요.'));
        result.appendChild(el('p', '교재 정답: ' + correct.text));
        var sourcePages = [];
        item.options.forEach(function (o) { (o.evidenceRefs || []).forEach(function (ref) { if (Number.isInteger(ref.pdfPage) && sourcePages.indexOf(ref.pdfPage) === -1) sourcePages.push(ref.pdfPage); }); });
        // Source page metadata remains in item.options evidenceRefs; omit page labels from study UI.
        item.options.forEach(function (o) {
          if (o.id !== item.correctOptionId && typeof o.whyIncorrect === 'string' && o.whyIncorrect) result.appendChild(el('p', o.text + ': ' + o.whyIncorrect));
        }); shell.appendChild(result);
      }
      var nav = el('div'); nav.className = 'textbook-controls';
      var prev = button('이전', function () { cursor--; draw(); }); prev.disabled = cursor === 0; nav.appendChild(prev);
      var next = button('다음', function () { cursor++; draw(); }); next.disabled = cursor === indices.length - 1; nav.appendChild(next);
      var retry = button('이 화면에서 틀린 문제 다시 풀기', function () {
        indices = data.items.map(function (_, i) { return i; }).filter(function (i) { var item = data.items[i]; return graded.has(item.id) && answers.get(item.id) !== item.correctOptionId; });
        if (!indices.length) return;
        indices.forEach(function (i) { graded.delete(data.items[i].id); answers.delete(data.items[i].id); }); cursor = 0; draw();
      });
      retry.disabled = !data.items.some(function (i) { return graded.has(i.id) && answers.get(i.id) !== i.correctOptionId; }); nav.appendChild(retry);
      nav.appendChild(button('전체 연습으로', function () { indices = data.items.map(function (_, i) { return i; }); cursor = 0; draw(); })); shell.appendChild(nav);
    }
    draw();
    return { element: shell, ready: Promise.resolve(), cleanup: function () { alive = false; answers.clear(); graded.clear(); shell.replaceChildren(); shell.remove(); } };
  }
  var exported = { render: render, valid: valid };
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  root.HanqTextbookFourChoice = exported;
})(typeof window !== 'undefined' ? window : globalThis);
