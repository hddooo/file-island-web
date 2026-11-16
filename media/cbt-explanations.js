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
  // Official question and answer-sheet archival pages; not third-party explanatory PDFs.
  var examArchive={70:'1000030012',71:'1000030032',72:'1000030043',73:'1000030052',74:'1000030069',75:'1000030080',76:'1000030098',77:'1000030110',78:'1000030119',79:'1000030131',80:'1000030154'};
  // Independently checked against the current 81st-edition learning material and original crops.
  // Textbook PDF SHA-256: d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de
  var currentBookNotes={
    'exam-70-01':{pages:'9–10', printed:'2–3', topic:'선사 · 청동기 시대',
      reason:['그림에 체크된 **비파형 동검**과 지문의 **사유 재산·계급 발생**은 둘 다 청동기 단서예요. 학습자료에서 도구와 생활 모습을 같은 시대에 묶어 기억하면 돼요.',
        '청동기에 생긴 지배층은 많은 사람을 동원해 무덤인 **고인돌**을 만들었어요. 그래서 계급이 생겼다는 단서와 이어지는 ③이 정답이에요.']},
    'exam-70-02':{pages:'12–13', printed:'5–6', topic:'선사 · 철기 시대 여러 나라',
      reason:['표에서 부여의 가축 이름 관직과 삼한의 철 수출은 비교용이에요. **(가) 행의 단궁·과하마·반어피**가 학습자료의 동예 특산물과 일치해요.',
        '동예의 제천 행사는 **10월 무천**이에요. 여러 나라에 가을 제천 행사가 있었으니 달만 보지 말고 행사 이름까지 확인하면 ③을 고를 수 있어요.']},
    'exam-70-03':{pages:'17, 19–20, 22–23', printed:'10, 12–13, 15–16', topic:'삼국 · 백제 개로왕에서 동성왕까지',
      reason:['도림과 문주가 나오는 자료는 **장수왕의 한성 공격과 개로왕 전사**를 가리켜요. 문제는 원인이 아니라 이 사건 **이후의 영향**을 묻고 있어요.',
        '학습자료에서 백제의 흐름을 **한성 함락 → 문주왕의 웅진 천도 → 동성왕의 혼인 동맹**으로 잡으면 돼요. 눌지왕·비유왕 때 이미 맺은 동맹을 동성왕이 신라 소지 마립간과의 혼인으로 강화한 ②가 그 뒤의 일이에요.']},
    'exam-70-04':{pages:'17, 19', printed:'10, 12', topic:'삼국 · 고구려의 소수림왕',
      reason:['학습자료의 고구려 왕 표에서 **율령·태학·전진**이 함께 나오는 왕은 **소수림왕**이에요. 법과 교육으로 통치 체제를 갖추고 전진과 교류했어요.',
        '지문의 외교 칸을 이어 보면 전진에서 온 승려 **순도**가 불교를 전했어요. 소수림왕 때의 일인 ①이 정답이에요.']},
    'exam-70-05':{pages:'18, 21', printed:'11, 14', topic:'삼국 · 도교',
      reason:['그림 속 **사신도와 산수무늬 벽돌**, 강연의 **신선·불로장생**을 함께 보면 **도교**예요. 학습자료에서도 사신도는 도교 유물로 구분해요.',
        '고구려는 연개소문 때 당에 **도사 파견**을 요청했어요. 도교와 연결되는 ②가 정답이고, 불교 경전이나 유교 관련 보기는 종교가 달라요.']},
    'exam-70-06':{pages:'24, 32', printed:'17, 25', topic:'삼국·남북국 · 신라의 승려',
      reason:['학습자료의 신라 승려 표에서 **일심·화쟁**을 함께 내세운 인물은 **원효**예요. 문항에 나온 《금강삼매경론》과 《대승기신론소》도 원효의 저술이에요.',
        '원효는 **무애가**로 백성에게 불교를 쉽게 전했어요. 같은 승려라도 혜초는 인도 순례, 의상은 화엄 사상으로 구별하면 ③을 고를 수 있어요.']},
    'exam-70-07':{pages:'35, 37', printed:'28, 30', topic:'남북국 · 발해의 건국과 지방 제도',
      reason:['자료의 **조영**은 고구려 계승 세력의 **대조영**이에요. 학습자료에서 대조영이 세운 나라가 발해임을 먼저 찾아요.',
        '문제는 대조영 개인의 업적이 아니라 **발해의 제도**를 묻고 있어요. 발해가 지방을 **5경 15부 62주**로 편성했다는 ④가 정답이에요.']},
    'exam-70-08':{pages:'31–32, 34', printed:'24–25, 27', topic:'남북국 · 신라 말의 최치원',
      reason:['당에 유학한 6두품이라는 설명만으로는 인물을 확정할 수 없어요. 학습자료에서 **진성 여왕에게 시무책 10여 조를 올렸다**는 단서를 찾으면 **최치원**이에요.',
        '최치원은 당에서 황소의 난 때 쓴 **격황소서**로 이름을 떨쳤어요. 시무책과 격황소서를 같은 인물의 활동으로 묶으면 ③이 정답이에요.']}
  };
  function groundedOverview(entry) {
    var overview=entry&&entry.overview||{}, note=entry&&currentBookNotes[entry.id];
    return note?Object.assign({},overview,{reason:note.reason.slice()}):overview;
  }
  function reviewedReferences(entry, note) {
    var base=array(entry.references).slice(), archived=examArchive[entry.exam];
    if (!archived) return base;
    var examRef=array(entry.overview&&entry.overview.refs).find(function(r){return r&&r.kind==='exam'&&r.exam===entry.exam&&r.number===entry.number&&Number.isSafeInteger(r.page)&&r.page>0;});
    var first={label:'제'+entry.exam+'회 '+entry.number+'번 · 공식 문제지'+(examRef?' '+examRef.page+'쪽':'')+'·정답표',url:'https://www.historyexam.go.kr/pst/view.do?bbs=dat&pst_sno='+archived};
    base=base.filter(function(r){return r&&!(r.url===first.url||/원문·공식 정답/.test(r.label||'')||note&&/^교재 근거/.test(r.label||''));});
    if(note)base.unshift({label:'81회 대비 시대별 학습자료 · '+note.topic+' · PDF '+note.pages+'쪽 (인쇄 '+note.printed+'쪽)'});
    return [first].concat(base);
  }
  function render(q, legacy, status) {
    if (status !== 'final' || !q || !q.review) return '';
    var entry = resolve(q, status), item = entry || q.review.item || {}, o = entry ? groundedOverview(entry) : item.overview || {}, opts = array(item.options);
    // Unknown/old schemas keep the established renderer; never substitute another question.
    if (!lines(o.reason).length || !optionsValid(opts)) {
      try { return legacy && legacy.render ? legacy.render(item, q.selectedOptionId || null) : ''; } catch (e) { return ''; }
    }
    var key = 'fe-exp-' + String(q.exam) + '-' + String(q.position).replace(/[^a-z0-9_-]/gi, ''), selected = q.selectedOptionId || null;
    var bookNote = entry && currentBookNotes[entry.id], reason = lines(o.reason), extra = reason.slice(3).concat(lines(o.context));
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
    var references=entry?reviewedReferences(entry,bookNote):[];
    if (references.length) html += '<details class="fe-exp-sources"><summary>해설 근거</summary><ul>' + references.map(function(r) {
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
  root.HanqCbtExplanations = { resolve: resolve, render: render, renderGraded: renderGraded, groundedOverview: groundedOverview };
})(window);
