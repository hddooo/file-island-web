(function (root) {
  'use strict';
  var active = null, memory = null;
  var parts = [['', '전체 Part'], ['1', 'Part 1'], ['2', 'Part 2'], ['3-4', 'Part 3·4'], ['5-6', 'Part 5·6'], ['7', 'Part 7'], ['unclassified', '분류 미지정']];
  function batches(notes, part, includeEmpty) {
    var eligible = notes.filter(function (n) { return (includeEmpty || n.meaning.trim()) && (!part || n.part === part); }).slice().sort(function (a, b) {
      return String(a.createdAt || '').localeCompare(String(b.createdAt || '')) || a.id.localeCompare(b.id);
    });
    var out = [];
    for (var i = 0; i < eligible.length; i += 100) out.push(eligible.slice(i, i + 100));
    return out;
  }
  function stop() { if (active) active.stop(); active = null; }
  function mount(host, opts) {
    stop();
    var api = opts.api, owner = opts.owner, session = root.HanqAuthSession, alive = true, loaded = false;
    var view = {part: '', batch: 0}, progress = {}, timers = {}, inflight = {}, rows = {}, viewChain = Promise.resolve(), unregister, visible = {}, opened = {};
    var restored = session && session.takeDraft('toeic-recall', owner) || memory && memory.owner === owner && memory.draft;
    function valid() { var s = api.state(); return alive && s.signedIn && s.ownerId === owner; }
    function el(tag, text, parent) { var n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (parent) parent.appendChild(n); return n; }
    function button(text, fn, parent) { var b = el('button', text, parent); b.type = 'button'; b.onclick = fn; return b; }
    function message(text) { var n = host.querySelector('.tr-status'); if (n) n.textContent = text; }
    function snapshot() {
      var entries = {};
      Object.keys(progress).forEach(function (id) { var p = progress[id]; if (p.dirty) entries[id] = JSON.parse(JSON.stringify(p)); });
      return {entries: entries, view: {part: view.part, batch: view.batch}};
    }
    function hasPending() { return Object.keys(progress).some(function (id) { return progress[id].dirty; }); }
    function remember() { var s = api.state(); memory = hasPending() && (s.authReason === 'expired' || s.signedIn && s.ownerId === owner) ? {owner: owner, draft: snapshot()} : null; }
    function entry(note) {
      if (!progress[note.id] || progress[note.id].noteRevision !== note.revision) progress[note.id] = {noteId: note.id, noteRevision: note.revision, revision: 0, answer: '', revealed: false, evaluation: '', dirty: false, version: 0};
      return progress[note.id];
    }
    function status(id) {
      var r = rows[id], p = progress[id]; if (!r || !p) return;
      r.status.textContent = p.error || (p.dirty ? (inflight[id] ? '저장 중…' : '저장 대기') : p.revision ? '내 계정에 저장됨' : '');
      r.retry.hidden = !p.error;
    }
    function feedback(note) {
      var r=rows[note.id],p=entry(note);if(!r)return;
      var show=!!visible[note.id];
      r.check.disabled=false;r.check.textContent=show?'뜻 가리기':'뜻 보기';r.check.setAttribute('aria-expanded',String(show));r.feedback.id='tr-context-'+note.id;r.check.setAttribute('aria-controls',r.feedback.id);r.feedback.replaceChildren();
      if(show){el('strong','문맥상 뜻',r.feedback);el('p',note.meaning,r.feedback);if(note.synonyms&&note.synonyms.length){el('strong','동의어·유사표현',r.feedback);note.synonyms.forEach(function(x){el('p',x,r.feedback);});}}
      var lines=(note.example||'').split('\n'),en=lines.filter(function(x){return !/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(x);}).join('\n'),ko=note.translation||lines.filter(function(x){return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(x);}).join('\n');
      if(en){var original=el('p',undefined,r.feedback);original.className='tn-original';var literal=note.expression.replace(/\s*[~]$/,'').trim(),at=en.toLowerCase().indexOf(literal.toLowerCase());if(at<0){var expressionKey=note.expression.toLowerCase(),variant=expressionKey==='be suspended from ~'?/\bsuspended from\b/i:expressionKey==='range from a to b'?/\brang(?:e|es|ed|ing) from\b[\s\S]*?\bto\b/i:null,match=variant&&variant.exec(en);if(match){at=match.index;literal=match[0];}}if(at>=0){original.appendChild(document.createTextNode(en.slice(0,at)));el('strong',en.slice(at,at+literal.length),original).className='tn-expression-highlight';original.appendChild(document.createTextNode(en.slice(at+literal.length)));}else original.textContent=en;}if(opened[note.id]){var extra=el('div',undefined,r.feedback);extra.className='tn-open-detail';if(note.structure)el('p',note.structure,extra);if(note.confusion)el('p',note.confusion,extra);}
      if(!show)return;
      if(ko)el('p',ko,r.feedback).className='tn-translation';
      var choices=el('div',undefined,r.feedback);choices.className='tr-evaluations';choices.hidden=!p.answer.trim();
      [['known','기억했어요'],['review','다시 볼게요']].forEach(function(choice){var b=button(choice[1],function(){p.evaluation=choice[0];changed(note);feedback(note);var selected=rows[note.id].feedback.querySelector('[data-evaluation="'+choice[0]+'"]');if(selected)selected.focus({preventScroll:true});},choices);b.dataset.evaluation=choice[0];b.setAttribute('aria-pressed',String(p.evaluation===choice[0]));});

    }
    async function save(note) {
      var p = entry(note), id = note.id;
      if (!valid() || !p.dirty || inflight[id] || p.error) return;
      var version = p.version, payload = {noteRevision: p.noteRevision, revision: p.revision, answer: p.answer, revealed: p.revealed, evaluation: p.evaluation};
      inflight[id] = true; status(id);
      try {
        var d = await api.saveToeicRecall(id, payload);
        if (!valid()) return;
        p.revision = d.progress.revision;
        p.dirty = p.version !== version;
        p.error = null;
      } catch (e) {
        if (!valid()) return;
        p.error = e && (e.code === 'recall_conflict' || e.code === 'note_conflict') ? '다른 탭이나 노트가 바뀌었어요. 입력을 보관한 뒤 새로 불러와 비교해 주세요.' : '저장을 확인하지 못했어요. 입력은 유지됩니다.';
      } finally {
        inflight[id] = false; if (alive) remember();
        if (valid()) { status(id); if (p.dirty && !p.error) save(note); }
      }
    }
    function updateCounts() {
      var n = host.querySelector('.tr-progress'); if (!n) return;
      var set = (batches(opts.notes, view.part)[view.batch] || []), entered = 0, evaluated = 0;
      set.forEach(function (note) { var p = entry(note); if (p.answer.trim()) entered++; if (p.evaluation) evaluated++; });
      n.textContent = '입력 ' + entered + ' / ' + set.length + ' · 자기평가 ' + evaluated + ' / ' + set.length;
    }
    function changed(note) {
      var p = entry(note); p.dirty = true; p.version++; p.error = null;
      clearTimeout(timers[note.id]); timers[note.id] = setTimeout(function () { save(note); }, 550);
      status(note.id); updateCounts(); remember();
    }
    function saveView() {
      var v = {part: view.part, batch: view.batch};
      viewChain = viewChain.catch(function () {}).then(function () { if (valid()) return api.saveToeicRecallView(v); }).catch(function () { if (valid()) message('묶음 위치를 저장하지 못했어요. 입력한 뜻은 각 단어별로 저장돼요.'); });
    }
    var searchQuery = '';
    function draw() {
      if (!valid()) return;
      if(opts.onBeforeRender)opts.onBeforeRender();
      rows = {}; host.replaceChildren(); host.classList.add('tr');


      var notice = el('p', '', host); notice.className = 'tr-status'; notice.setAttribute('role', 'status'); notice.setAttribute('aria-live', 'polite');
      if (!loaded) { message('내 계정의 연습 기록을 확인하고 있어요…'); return; }
      var controls = el('div', undefined, host); controls.className = 'tr-controls';
      view.part='';
      var label=el('label','검색',controls), search=el('input',undefined,label);search.type='search';search.setAttribute('aria-label','단어장 검색');search.value=searchQuery;search.oninput=function(){var pos=search.selectionStart;searchQuery=search.value;view.batch=0;draw();var next=host.querySelector('[aria-label="단어장 검색"]');next.focus();next.setSelectionRange(pos,pos);};
      var filtered=opts.notes.filter(function(n){return !searchQuery||[n.expression,n.meaning,n.example].join(' ').toLowerCase().includes(searchQuery.toLowerCase());});
      var sets=batches(filtered,'',opts.includeEmpty);view.batch=Math.max(0,Math.min(view.batch,sets.length-1));
      if (!sets.length) {
        el('h3', '아직 연습할 단어가 없어요', host);
        el('p', '사용자가 알려 준 단어와 뜻이 등록되면 여기에 나타나요. 모르는 단어를 보내 주거나 노트 관리에서 추가해 주세요.', host);
        if (opts.notes.some(function (n) { return !n.meaning.trim(); })) el('p', '뜻이 비어 있는 노트는 뜻을 추가한 뒤 연습할 수 있어요.', host);
        if(opts.onRendered)opts.onRendered();return;
      }
      var current=sets[view.batch];
      var headings = el('div', undefined, host); headings.className = 'tr-column-head'; headings.setAttribute('aria-hidden', 'true'); el('strong', '영어 단어', headings); el('strong', '한국어 뜻 적기', headings);
      var list = el('div', undefined, host); list.className = 'tr-rows';
      current.forEach(function (note, index) {
        var p = entry(note), row = el('article', undefined, list); row.className = 'tr-row'; row.dataset.noteId = note.id;
        var header=el('div',undefined,row);header.className='tr-card-header';var word = el('div', undefined, header); word.className = 'tr-word';  el('strong', note.expression, word);el('small',note.partOfSpeech||'품사 미지정',word);var pattern=({'a portion of':'a portion of + 명사','range from a to b':'range from A to B','be suspended from ~':'be suspended from + 명사','refer to':'refer to + 명사','in exchange for':'in exchange for + 명사'})[note.expression.toLowerCase()];if(pattern)el('strong',pattern,word).className='tn-pattern';
        var answer = el('div', undefined, row); answer.className = 'tr-answer';
        var input = el('input', undefined, answer); input.type = 'text'; input.lang = 'ko'; input.autocomplete = 'off'; input.spellcheck = false; input.maxLength = 6000; input.value = p.answer; input.className = 'tr-input'; input.setAttribute('aria-label', note.expression + ' 한국어 뜻'); input.setAttribute('aria-keyshortcuts', 'Control+Enter');
        var composing = false;
        function typed() { if (!valid() || composing) return; p.answer = input.value; p.revealed = false; p.evaluation = ''; visible[note.id]=false; changed(note); feedback(note); }
        input.addEventListener('compositionstart', function () { composing = true; clearTimeout(timers[note.id]); });
        input.addEventListener('compositionend', function () { composing = false; typed(); });
        input.oninput = typed;
        input.onblur = function () { if (!composing) { clearTimeout(timers[note.id]); save(note); } };
        input.onkeydown = function (e) {
          if (composing || e.isComposing || e.keyCode === 229) return;
          if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); reveal(); return; }
          if (e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey) return;
          // Before reveal, Tab moves directly between meaning inputs; afterwards native Tab reaches self-evaluation controls.
          if (visible[note.id]) return;
          var inputs = Array.from(host.querySelectorAll('.tr-input')), next = inputs[inputs.indexOf(input) + (e.shiftKey ? -1 : 1)];
          if (next) { e.preventDefault(); next.focus(); }
        };
        input.placeholder='뜻 입력';var tools = el('div', undefined, header); tools.className = 'tr-row-tools';
        function reveal() { if (composing) return; if(visible[note.id])visible[note.id]=false;else{visible[note.id]=true;if(p.answer.trim()&&!p.revealed){p.revealed=true;changed(note);}}feedback(note); }
        var check = button('뜻 보기', reveal, tools);
        var saving = el('span', '', answer); saving.className = 'tr-save-state'; saving.setAttribute('aria-live', 'polite');
        button('열기',function(){opened[note.id]=!opened[note.id];feedback(note);},tools).setAttribute('aria-label',note.expression+' 세부내용 열기');if(opts.onEdit)button('편집',async function(){if(inflight[note.id]){message('입력 저장이 끝난 뒤 편집해 주세요.');return;}clearTimeout(timers[note.id]);if(entry(note).dirty)await save(note);if(valid()&&!entry(note).error)opts.onEdit(note,JSON.parse(JSON.stringify(entry(note))));},tools);
        var retry = button('저장 다시 시도', function () { p.error = null; save(note); }, answer); retry.hidden = true;
        var result = el('div', undefined, row); result.className = 'tr-feedback';
        rows[note.id] = {status: saving, retry: retry, check: check, feedback: result}; feedback(note); status(note.id);
      });
      if(sets.length>1){var nav = el('nav', undefined, host); nav.className = 'tr-navigation'; nav.setAttribute('aria-label', '연습 묶음 이동');
      var prev = button('← 이전 묶음', function () { view.batch--; saveView(); draw(); }, nav); prev.disabled = view.batch === 0;
      var next = button('다음 묶음 →', function () { view.batch++; saveView(); draw(); }, nav); next.disabled = view.batch >= sets.length - 1; updateCounts();}
      if(opts.onRendered)opts.onRendered();
    }
    async function load() {
      try {
        var d = await api.toeicRecall(); if (!valid()) return;
        d.progress.forEach(function (p) { progress[p.noteId] = Object.assign({}, p, {dirty: false, version: 0}); });
        view = d.view;
        if (restored) {
          view = restored.view || view;
          Object.keys(restored.entries || {}).forEach(function (id) { var p = restored.entries[id], note = opts.notes.find(function (n) { return n.id === id && n.revision === p.noteRevision; }); if (note) progress[id] = Object.assign({}, p, {dirty: true, error: '복원한 입력입니다. 저장 다시 시도를 눌러 보관해 주세요.'}); });
        }
        loaded = true; draw();
      } catch (e) { if (valid()) { message('연습 기록을 불러오지 못했어요. 이전 기록을 덮어쓰지 않도록 입력을 잠시 멈췄어요.'); button('연습 기록 다시 불러오기', load, host); } }
    }
    function beforeUnload(e) { if (hasPending()) { e.preventDefault(); e.returnValue = ''; } }
    if (session) unregister = session.register('toeic-recall', {ownerId: owner, capture: snapshot});
    root.addEventListener('beforeunload', beforeUnload);
    active = {stop: function () { remember(); alive = false; Object.keys(timers).forEach(function (id) { clearTimeout(timers[id]); }); if (unregister) unregister(); root.removeEventListener('beforeunload', beforeUnload); host.replaceChildren(); }};
    draw(); load(); return active;
  }
  if (root.HanqApi && root.HanqApi.onChange) root.HanqApi.onChange(function (s) { if (s.authReason === 'logout' || s.authReason === 'remote' || s.signedIn && memory && memory.owner !== s.ownerId) memory = null; });
  root.HanqToeicRecall = {mount: mount, stop: stop, batches: batches};
})(typeof window !== 'undefined' ? window : globalThis);
