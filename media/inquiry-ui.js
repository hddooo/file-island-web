/* Compact inquiries use the existing authenticated portal contract. No private data is persisted. */
(function (root) {
  'use strict';
  var doc = root.document, active = null, composer = null, draft = null, watched = null, restoreList = null, pageHost = null;
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function session(api) { var s = api.state(); return s.signedIn && s.ownerId && s.user && s.user.id === s.ownerId ? s.ownerId + ':' + s.epoch : null; }
  function el(tag, text, parent, cls) { var n = doc.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; }
  function button(text, parent, fn) { var b = el('button', text, parent, 'tool-btn'); b.type = 'button'; b.onclick = fn; return b; }
  function when(iso) { return Number.isFinite(Date.parse(iso)) ? new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : ''; }
  function errorText(e) { return e && e.status === 401 ? '로그인 상태를 확인하고 다시 열어 주세요.' : e && e.status === 403 ? '이 문의에 접근할 권한이 없어요.' : '불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.'; }
  function watch(api) {
    if (watched === api) return;
    watched = api;
    api.onChange(function () {
      var key = session(api);
      if (draft && draft.key !== key) draft = null;
      if (composer && composer.key !== key && !composer.loading) {
        if (composer.isPage) { composer.key = key; paintComposer(composer, api); }
        else if (composer.key) close(false);
      }
      if (active && active.key !== key) stop();
    });
  }
  function close(focus) {
    if (!composer) return;
    var old = composer; composer = null;
    old.release();
    if (old.isPage) old.node.replaceChildren(); else old.node.remove();
    if (focus) { var target = old.trigger && old.trigger.isConnected ? old.trigger : doc.querySelector('#acInquiriesHost button'); if (target) target.focus(); }
  }
  function paintComposer(c, api) {
    if (composer !== c || !c.node.isConnected) return;
    var box = c.body; box.replaceChildren();
    if (!c.key || c.key !== session(api)) {
      el('p', '로그인한 뒤 건의·문의를 다시 열어 주세요. 보낸 문의와 답변은 MY PAGE에서 확인할 수 있어요.', box);
      var login = el('a', '로그인하기', box, 'tool-btn'); login.href = c.isPage ? '/#account/main' : '#account/main';
      login.onclick = function () { if (!c.isPage) close(false); };
      return;
    }
    if (!draft || draft.key !== c.key) draft = { key: c.key, title: '', body: '', payload: null, sending: false, id: null, message: '' };
    var d = draft;
    if (d.id) {
      var confirmed = el('p', '문의를 보냈어요. 7일 이내에 가입한 이메일로 답변드려요. 보낸 문의는 MY PAGE에서도 확인할 수 있어요.', box); confirmed.setAttribute('role', 'status'); confirmed.tabIndex = -1;
      var link = el('a', '내 문의 보기', box, 'tool-btn'); link.href = c.isPage ? '/#account/main' : '#account/main';
      link.onclick = function () { if (!c.isPage) close(false); if (active) active.load(); };
      button('새 문의 쓰기', box, function () { draft = null; paintComposer(c, api); });
      confirmed.focus();
      return;
    }
    var form = el('form', null, box, 'hq-inquiry-form');
    function field(label, name, tag, max) {
      var l = el('label', label, form), input = el(tag, null, form);
      input.id = 'hq-inquiry-' + name; l.htmlFor = input.id; input.name = name;
      input.required = true; input.maxLength = max; input.value = d[name]; input.readOnly = !!d.payload;
      input.oninput = function () { if (!d.payload) d[name] = input.value; };
      return input;
    }
    var title = field('제목', 'title', 'input', 120), body = field('내용', 'body', 'textarea', 4000);
    var submit = el('button', d.sending ? '보내는 중…' : d.payload ? '같은 문의 다시 확인' : '보내기', form, 'check-one');
    submit.type = 'submit'; submit.disabled = d.sending;
    var status = el('p', d.message, form); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    if (d.message) { status.tabIndex = -1; status.focus(); }
    form.onsubmit = function (ev) {
      ev.preventDefault();
      if (d.sending || draft !== d || composer !== c || session(api) !== d.key) return;
      if (!d.payload) {
        d.title = title.value.trim(); d.body = body.value.trim();
        if (!d.title || !d.body || d.title.length > 120 || d.body.length > 4000) { status.textContent = '제목과 내용을 입력해 주세요. 제목은 120자, 내용은 4,000자까지 쓸 수 있어요.'; return; }
        if (!root.crypto || typeof root.crypto.randomUUID !== 'function') { status.textContent = '안전한 전송 번호를 만들 수 없어요. 브라우저를 업데이트한 뒤 다시 시도해 주세요.'; return; }
        d.payload = { requestId: root.crypto.randomUUID(), title: d.title, body: d.body };
      }
      d.sending = true; d.message = '보내는 중이에요…'; paintComposer(c, api);
      Promise.resolve().then(function () {
        if (session(api) !== d.key || draft !== d) throw { status: 401 };
        return api.portal('POST', '/api/v1/inquiries', d.payload, { feedback: false });
      }).then(function (r) {
        if (draft !== d || session(api) !== d.key) return;
        if (!r || !UUID.test(r.id)) throw { code: 'invalid_response' };
        d.id = r.id; d.sending = false; if (active && active.key === d.key) active.load();
        if (composer && composer.key === d.key) paintComposer(composer, api);
      }).catch(function (e) {
        if (draft !== d || session(api) !== d.key) return;
        d.sending = false;
        // Only explicit validation rejection permits edits. Unknown outcomes keep exactly the same request and payload.
        if (e && e.status === 400 && e.code !== 'invalid_response') { d.payload = null; d.message = '입력 내용을 확인하고 다시 보내 주세요.'; }
        else if (e && e.status === 409) d.message = '이 전송 번호의 기존 문의와 내용이 달라요. MY PAGE의 내 문의를 확인해 주세요.';
        else d.message = '전송 결과를 확인하지 못했어요. 같은 문의 다시 확인을 누르면 중복 없이 확인할 수 있어요.';
        if (composer && composer.key === d.key) paintComposer(composer, api);
      });
    };
  }
  function introduction(parent) {
    var intro = el('div', null, parent, 'hq-inquiry-intro');
    el('p', 'HanQ를 이용하며 느낀 불편이나 개선 의견을 남겨 주세요.', intro);
    el('p', '제목과 내용을 작성해 보내면 접수돼요.', intro);
    el('p', '접수한 문의는 7일 이내에 가입한 이메일로 답변드려요.', intro);
  }
  function mountPage(host, api, force) {
    if (!host || !api || typeof api.portal !== 'function') return false;
    close(false); watch(api); pageHost = host;
    var c = { node: host, body: host, key: null, isPage: true, loading: true, release: function () {} };
    composer = c; el('p', '로그인 상태를 확인하고 있어요.', host).setAttribute('role', 'status');
    Promise.resolve().then(function () { return api.ensureSession ? api.ensureSession(!!force) : api.init(); }).then(function () {
      if (composer !== c) return;
      c.loading = false; c.key = session(api); paintComposer(c, api);
    }).catch(function (e) {
      if (composer !== c) return;
      c.loading = false; host.replaceChildren(); el('p', errorText(e), host).setAttribute('role', 'status');
      button('다시 확인', host, function () { mountPage(host, api, true); });
    });
    return true;
  }
  function open(trigger) {
    var api = root.HanqApi;
    if (!api || typeof api.portal !== 'function') return false;
    if (composer) { composer.node.focus(); return true; }
    watch(api);
    var dialog = el('dialog', null, doc.body, 'hq-inquiry-dialog'); dialog.setAttribute('aria-labelledby', 'hq-inquiry-heading-title'); dialog.tabIndex = -1;
    var head = el('header', null, dialog, 'hq-inquiry-heading'); el('h2', '건의·문의', head).id = 'hq-inquiry-heading-title';
    var dismiss = button('닫기', head, function () { close(true); }); dismiss.setAttribute('aria-label', '문의 창 닫기');
    introduction(dialog);
    var box = el('div', null, dialog), c = { node: dialog, body: box, key: session(api), trigger: trigger || doc.activeElement, release: root.HanqUiLocks ? root.HanqUiLocks.acquire(doc.querySelector('#app')) : function () {} };
    composer = c; el('p', '로그인 상태를 확인하고 있어요.', box).setAttribute('role', 'status');
    dialog.addEventListener('cancel', function (ev) { ev.preventDefault(); close(true); });
    dialog.addEventListener('click', function (ev) { if (ev.target === dialog) close(true); });
    dialog.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); close(true); return; }
      if (ev.key !== 'Tab') return;
      var items = [].slice.call(dialog.querySelectorAll('button:not(:disabled),a[href],input,textarea')), first = items[0], last = items[items.length - 1];
      if (ev.shiftKey && (doc.activeElement === first || doc.activeElement === dialog)) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && doc.activeElement === last) { ev.preventDefault(); first.focus(); }
    });
    try { if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', ''); } catch (e) { dialog.setAttribute('open', ''); }
    dismiss.focus();
    Promise.resolve().then(function () { return api.ensureSession ? api.ensureSession() : api.init(); }).then(function () {
      if (composer !== c) return; c.key = session(api); paintComposer(c, api);
      var input = box.querySelector('input'); if (input) input.focus();
    }).catch(function (e) { if (composer === c) { box.replaceChildren(); el('p', errorText(e), box).setAttribute('role', 'status'); button('다시 확인', box, function () { close(false); open(trigger); }); } });
    return true;
  }
  function stop() { if (active) { active.dead = true; active.host.replaceChildren(); active = null; } }
  function mount(host, api) {
    stop(); if (!host || !api || typeof api.portal !== 'function' || !session(api)) return;
    watch(api);
    var state = { host: host, api: api, key: session(api), page: 1, seq: 0, dead: false, load: load }; active = state;
    function alive(seq) { return active === state && !state.dead && host.isConnected && session(api) === state.key && (seq == null || seq === state.seq); }
    function load() {
      if (!alive()) return;
      var seq = ++state.seq; host.replaceChildren();
      var top = el('div', null, host, 'hq-inquiry-heading'); button('문의 보내기', top, function (ev) { open(ev.currentTarget); });
      var status = el('p', '불러오는 중이에요…', host); status.setAttribute('role', 'status');
      Promise.resolve().then(function () { if (!alive(seq)) throw {}; return api.portal('GET', '/api/v1/inquiries?page=' + state.page); }).then(function (r) {
        if (!alive(seq)) return;
        if (!r || !Array.isArray(r.items) || r.items.length > 20 || !Number.isSafeInteger(r.total) || r.total < 0 || r.items.some(function (x) { return !x || !UUID.test(x.id) || typeof x.title !== 'string' || !when(x.created_at); })) throw {};
        status.textContent = r.items.length ? '' : '아직 보낸 문의가 없어요.';
        r.items.forEach(function (item) {
          var row = el('details', null, host, 'hq-inquiry-item'), summary = el('summary', null, row);
          el('strong', item.title, summary); var date = el('time', when(item.created_at), summary); date.dateTime = item.created_at;
          var content = el('div', null, row, 'hq-inquiry-messages'), loading = false, loaded = false;
          function read() {
            if (!alive(seq) || loading || loaded) return; loading = true; content.replaceChildren(); el('p', '불러오는 중이에요…', content).setAttribute('role', 'status');
            Promise.resolve().then(function () { if (!alive(seq)) throw {}; return api.portal('GET', '/api/v1/inquiries/' + encodeURIComponent(item.id)); }).then(function (d) {
              if (!alive(seq)) return;
              if (!d || !d.inquiry || d.inquiry.id !== item.id || d.inquiry.user_id !== api.state().ownerId || !Array.isArray(d.messages) || d.messages.some(function (m) { return !m || ['member', 'admin'].indexOf(m.sender_role) < 0 || typeof m.body !== 'string' || !when(m.created_at); })) throw {};
              content.replaceChildren(); d.messages.forEach(function (m) { var article = el('article', null, content, 'hq-inquiry-message'); el('strong', m.sender_role === 'admin' ? '관리자 답변' : '내 문의', article); el('p', m.body, article); var time = el('time', when(m.created_at), article); time.dateTime = m.created_at; });
              if (!d.messages.some(function (m) { return m.sender_role === 'admin'; })) el('p', '아직 답변이 없어요.', content);
              loaded = true; loading = false;
            }).catch(function (e) { if (!alive(seq)) return; loading = false; content.replaceChildren(); el('p', errorText(e), content).setAttribute('role', 'status'); button('다시 확인', content, read); });
          }
          row.addEventListener('toggle', function () { if (row.open) read(); });
        });
        if (state.page > 1 || r.total > 20) { var nav = el('nav', null, host, 'hq-inquiry-pages'); nav.setAttribute('aria-label', '내 문의 페이지'); button('이전', nav, function () { state.page--; load(); }).disabled = state.page === 1; el('span', state.page + '페이지', nav); button('다음', nav, function () { state.page++; load(); }).disabled = state.page * 20 >= r.total; }
      }).catch(function (e) { if (!alive(seq)) return; status.textContent = errorText(e); button('다시 확인', host, load); });
    }
    load();
  }
  // Inquiry links navigate to the standalone page; MY PAGE keeps its compact dialog.
  root.addEventListener('hashchange', function () { if (!composer || !composer.isPage) close(false); });
  root.addEventListener('pagehide', function (event) {
    restoreList = event.persisted && active ? { host: active.host, api: active.api } : null;
    close(false); stop();
    // BFCache keeps this document alive: an unresolved write must retain its original requestId.
    if (!event.persisted) draft = null;
  });
  root.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    if (pageHost && pageHost.isConnected) { mountPage(pageHost, root.HanqApi, true); return; }
    var saved = restoreList, api = saved ? saved.api : root.HanqApi; restoreList = null;
    if (!api) return;
    Promise.resolve().then(function () { return api.ensureSession ? api.ensureSession(true) : api.init(); }).then(function () {
      if (draft && draft.key !== session(api)) draft = null;
      if (saved && saved.host.isConnected && !active) mount(saved.host, api);
    }).catch(function () {
      if (!saved || !saved.host.isConnected || active) return;
      el('p', '로그인 상태를 확인하지 못했어요. 다시 확인해 주세요.', saved.host).setAttribute('role', 'status');
      button('다시 확인', saved.host, function () { mount(saved.host, api); });
    });
  });
  root.HanqInquiries = { open: open, mount: mount, mountPage: mountPage, stop: stop };
  var inlineHost = doc.querySelector('#hq-inquiry-page-host');
  if (inlineHost) mountPage(inlineHost, root.HanqApi);
  var initial = new URL(root.location.href);
  if (!inlineHost && initial.searchParams.get('inquiry') === 'compose') { initial.searchParams.delete('inquiry'); root.history.replaceState(root.history.state, '', initial.pathname + initial.search + initial.hash); open(); }
})(window);
