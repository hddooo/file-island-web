/* CBT-only answered-wrong notebook. All data and images come from the current
 * authenticated CBT API. No legacy notes, device stars, or persistent storage.
 * mount(host,{api,onHome,onAccount,onReview,review?}) -> {ready,reload,stop}.
 * onReview receives the existing formal-exam route: "review-" + review run ID.
 */
(function (root) {
  'use strict';
  var active = null, serial = 0, PAGE_SIZE = 20;
  var SCOPE = 'finalized-exam-selected-wrong';
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function owner(state) { return state && state.signedIn ? state.ownerId || (state.user && state.user.id) || null : null; }
  function identity(api) { var state = api.state(); return {owner: owner(state), epoch: state && state.epoch}; }
  function sameOwner(a, b) { return a.owner === b.owner && a.epoch === b.epoch; }
  function stop() { if (active) active.stop(); }
  function validItem(item) {
    if (!item || typeof item.questionId !== 'string' || typeof item.version !== 'string' || !item.version || !UUID.test(item.runId || '')) return false;
    var match = /^exam-(\d+)-(\d{2})$/.exec(item.questionId);
    if (!match || !Number.isInteger(item.exam) || item.exam !== Number(match[1]) || !Number.isInteger(item.number) || item.number !== Number(match[2]) || item.number < 1 || item.number > 50 || !Number.isInteger(item.position) || item.position < 0 || item.position > 49) return false;
    var review = item.review, options = item.options;
    if (!review || review.status !== 'wrong' || review.correct === true || typeof item.selectedOptionId !== 'string' || !item.selectedOptionId || typeof review.correctOptionId !== 'string' || review.correctOptionId === item.selectedOptionId) return false;
    if (!Array.isArray(options) || options.length !== 5 || options.some(function (o, i) { return !o || typeof o.id !== 'string' || !o.id || o.number !== i + 1; }) || new Set(options.map(function (o) { return o.id; })).size !== 5) return false;
    if (!options.some(function (o) { return o.id === item.selectedOptionId; }) || !options.some(function (o) { return o.id === review.correctOptionId && o.number === review.correctNumber; })) return false;
    var saved = review.item;
    if (saved && (saved.id !== item.questionId || saved.v !== item.version || saved.exam !== item.exam || saved.number !== item.number || saved.points !== item.points || saved.answer !== review.correctNumber || !Array.isArray(saved.options) || saved.options.length !== 5 || saved.options.some(function (option, index) { return !option || option.id !== options[index].id; }))) return false;
    var base = '/api/v1/cbt/runs/' + item.runId + '/questions/' + item.position;
    if (item.image !== base + '/image') return false;
    if (item.common != null && (!item.common || item.common.image !== base + '/common' || !Array.isArray(item.common.questionNumbers) || item.common.questionNumbers.indexOf(item.number) === -1 || item.common.questionNumbers.some(function (n) { return !Number.isInteger(n) || n < 1 || n > 50; }))) return false;
    return true;
  }
  function normalize(data) {
    if (!data || data.scope !== SCOPE || !Array.isArray(data.items) || data.items.length > 500) throw new TypeError('Invalid CBT notebook response');
    var seen = new Set(), items = [], rejected = 0;
    data.items.forEach(function (item) {
      if (!validItem(item)) { rejected++; return; }
      var key = item.questionId;
      // The server supplies the latest original wrong snapshot per question.
      // Keep the first snapshot on accidental duplicates; never substitute a
      // replay result, later correct answer, or another content version.
      if (!seen.has(key)) { seen.add(key); items.push(item); }
    });
    return {items: items, rejected: rejected, limit: Math.min(500, Number.isInteger(data.limit) && data.limit > 0 ? data.limit : 500), hasMore: data.hasMore === true};
  }
  function mount(host, options) {
    if (!host || !host.ownerDocument || typeof host.replaceChildren !== 'function') throw new TypeError('A DOM host is required');
    stop(); options = options || {};
    var api = options.api, doc = host.ownerDocument, view = doc.defaultView || root, urlAPI = view.URL || root.URL;
    var ctx = {alive: true, initialized: false, identity: {owner: null, epoch: undefined}, generation: 0, view: 0, urls: new Set(), items: [], rejected: 0, limit: 500, hasMore: false, page: 0, round: '', pending: false, keys: new Map(), off: null, element: null, serial: ++serial};
    function valid() { return active === controller && ctx.alive && host.isConnected; }
    function owned(token, generation) { return valid() && generation === ctx.generation && sameOwner(token, ctx.identity) && sameOwner(token, identity(api)); }
    function node(tag, text, className) { var el = doc.createElement(tag); if (text != null) el.textContent = text; if (className) el.className = className; return el; }
    function release(url) { if (ctx.urls.has(url)) { ctx.urls.delete(url); urlAPI.revokeObjectURL(url); } }
    function clearView() {
      ctx.view++;
      if (ctx.element) ctx.element.querySelectorAll('img').forEach(function (img) { img.removeAttribute('src'); });
      Array.from(ctx.urls).forEach(release);
    }
    function button(text, className, action) {
      var el = node('button', text, className || 'tool-btn'); el.type = 'button';
      el.addEventListener('click', function () { if (valid()) action(el); }); return el;
    }
    function navigate(callback) { controller.stop(); if (typeof callback === 'function') callback(); }
    function shell() {
      clearView();
      var section = node('section', null, 'panel formal-exams cbt-wrong-notebook');
      var top = node('div', null, 'fe-top'); top.appendChild(node('h1', '모의고사 오답노트'));
      var home = button('메인 메뉴', 'tool-btn', function () { navigate(options.onHome); }); home.setAttribute('data-notebook-home', ''); top.appendChild(home);
      section.appendChild(top); host.replaceChildren(section); ctx.element = section; return section;
    }
    function login() {
      var section = shell(); section.appendChild(node('p', '로그인하면 본인 모의고사의 선택 오답을 볼 수 있어요.'));
      var loginButton = button('로그인하기', 'check-one', function () { navigate(options.onAccount); }); loginButton.setAttribute('data-notebook-login', ''); section.appendChild(loginButton);
    }
    function loadError(error) {
      var section = shell(), message = error && error.status === 403 ? '이 계정으로 오답노트를 열 수 없어요. 이용 상태를 확인해 주세요.' : '모의고사 오답노트를 불러오지 못했어요. 다시 확인해 주세요.';
      var status = node('p', message); status.setAttribute('role', 'alert'); section.appendChild(status);
      var retry = button('다시 확인', 'tool-btn', function () { reload(); }); retry.setAttribute('data-notebook-retry', ''); section.appendChild(retry);
    }
    function authChanged(state) {
      if (!valid() || !ctx.initialized) return;
      var next = {owner: owner(state), epoch: state && state.epoch};
      if (sameOwner(next, ctx.identity)) return;
      ctx.generation++; ctx.identity = next; ctx.items = []; ctx.keys.clear(); ctx.pending = false; ctx.page = 0; ctx.round = '';
      clearView();
      if (next.owner) reload(); else login();
    }
    function reload() {
      if (!valid() || ctx.pending) return Promise.resolve({cancelled: !valid(), busy: ctx.pending});
      if (!api || !api.enabled()) return Promise.resolve({enabled: false});
      ctx.identity = identity(api);
      if (!ctx.identity.owner) { login(); return Promise.resolve({signedIn: false}); }
      var token = ctx.identity, generation = ++ctx.generation;
      var section = shell(), loading = node('p', '모의고사 오답을 불러오는 중이에요…'); loading.setAttribute('role', 'status'); section.appendChild(loading);
      return Promise.resolve().then(function () { if (owned(token, generation)) return api.cbt('GET', '/api/v1/cbt/notebook'); }).then(function (data) {
        if (!owned(token, generation)) return {cancelled: true};
        var result = normalize(data); ctx.items = result.items; ctx.rejected = result.rejected; ctx.limit = result.limit; ctx.hasMore = result.hasMore; ctx.page = 0; renderList();
        return {count: ctx.items.length, rejected: ctx.rejected};
      }).catch(function (error) {
        if (!owned(token, generation)) return {cancelled: true};
        ctx.items = [];
        if (error && (error.status === 401 || error.code === 'session_changed')) login(); else loadError(error);
        return {error: true};
      });
    }
    function image(item, box, path, isCommon) {
      var token = ctx.identity, generation = ctx.generation, viewToken = ctx.view, attempts = 0, currentURL = null;
      var figure = node('figure'), status = node('p'), imageNode = null;
      status.setAttribute('role', 'status'); figure.appendChild(status); box.appendChild(figure);
      function current(attempt) { return owned(token, generation) && viewToken === ctx.view && figure.isConnected && attempt === attempts; }
      function failed(attempt) {
        if (!current(attempt)) return;
        if (imageNode) { imageNode.removeAttribute('src'); imageNode = null; }
        if (currentURL) { release(currentURL); currentURL = null; }
        status.textContent = '원본 문제 이미지를 불러오지 못했어요.'; status.setAttribute('role', 'alert');
        figure.replaceChildren(status);
        var retry = button('이미지 다시 확인', 'tool-btn', function () { load(); }); retry.setAttribute('data-notebook-image-retry', ''); figure.appendChild(retry);
      }
      function load() {
        if (!owned(token, generation) || viewToken !== ctx.view) return;
        var attempt = ++attempts;
        if (currentURL) { release(currentURL); currentURL = null; }
        status.textContent = '원본 문제를 불러오는 중이에요…'; status.setAttribute('role', 'status'); figure.replaceChildren(status);
        Promise.resolve().then(function () { if (current(attempt)) return api.cbtImage(path); }).then(function (blob) {
          if (!current(attempt)) return;
          if (!blob || typeof blob !== 'object' || typeof blob.size !== 'number' || !/^image\/(png|jpeg|webp|gif|avif)$/i.test(blob.type || '') || !urlAPI || typeof urlAPI.createObjectURL !== 'function') throw new TypeError('Raster CBT image required');
          currentURL = urlAPI.createObjectURL(blob); ctx.urls.add(currentURL);
          if (isCommon) figure.insertBefore(node('figcaption', '공통 자료 ' + item.common.questionNumbers.join('·') + '번'), status);
          var link = node('a'); link.href = currentURL; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.setAttribute('aria-label', '제' + item.exam + '회 ' + item.number + '번 원본 크게 보기');
          var img = node('img', null, 'mock-image'); imageNode = img;
          img.alt = isCommon ? '공통 자료 ' + item.common.questionNumbers.join('·') + '번' : '제' + item.exam + '회 ' + item.number + '번 원본 문제·보기';
          img.style.width = '100%'; img.style.maxWidth = '100%'; img.style.height = 'auto';
          img.addEventListener('load', function () { if (current(attempt)) status.remove(); });
          img.addEventListener('error', function () { failed(attempt); });
          link.appendChild(img); link.appendChild(node('span', '원본 크게 보기', 'fe-image-open')); figure.insertBefore(link, status); img.src = currentURL;
        }).catch(function () { failed(attempt); });
      }
      load();
    }
    function explanation(item, container, index) {
      var cbt = options.explanations || root.HanqCbtExplanations, review = options.review || root.HanqQuizReview, html = '';
      try {
        if (cbt && typeof cbt.render === 'function') html = cbt.render(item, review, 'final');
        else if (item.review.item && review && typeof review.renderCompact === 'function') html = review.renderCompact(item.review.item, item.selectedOptionId);
        else if (item.review.item && review && typeof review.render === 'function') html = review.render(item.review.item, item.selectedOptionId);
      } catch (_) { html = ''; }
      if (typeof html !== 'string' || !html) { container.appendChild(node('p', '이 문항의 저장된 해설을 아직 표시할 수 없어요.')); return; }
      // Only established local explanation renderers produce markup. All API
      // strings used directly by this module go through textContent.
      container.innerHTML = html;
      // Multiple versions of one exam question can have identical legacy DOM
      // IDs. Scope those display IDs without changing the source item/version.
      var ids = new Map(), suffix = '-notebook-' + ctx.serial + '-' + index;
      container.querySelectorAll('[id]').forEach(function (el) { var old = el.id; ids.set(old, old + suffix); el.id = old + suffix; });
      container.querySelectorAll('[aria-labelledby],[aria-describedby]').forEach(function (el) {
        ['aria-labelledby', 'aria-describedby'].forEach(function (attribute) { if (el.hasAttribute(attribute)) el.setAttribute(attribute, el.getAttribute(attribute).split(/\s+/).map(function (id) { return ids.get(id) || id; }).join(' ')); });
      });
    }
    function startReview(round, status) {
      if (!valid() || ctx.pending || typeof options.onReview !== 'function' || !sameOwner(ctx.identity, identity(api))) return;
      var token = ctx.identity, generation = ctx.generation;
      var key = ctx.keys.get(round);
      if (!key) {
        try { key = api.newSubmissionId('cbt-notebook'); } catch (_) { status.textContent = '재풀이 요청을 준비하지 못했어요. 다시 확인해 주세요.'; return; }
        if (typeof key !== 'string' || !key) { status.textContent = '재풀이 요청을 준비하지 못했어요.'; return; }
        ctx.keys.set(round, key);
      }
      ctx.pending = true; status.setAttribute('role', 'status'); status.textContent = '제' + round + '회 선택 오답 재풀이를 준비하고 있어요…';
      var disabled = [];
      ctx.element.querySelectorAll('[data-notebook-action]').forEach(function (el) { disabled.push({element: el, value: el.disabled}); el.disabled = true; });
      Promise.resolve().then(function () { if (owned(token, generation)) return api.cbt('POST', '/api/v1/cbt/reviews', {round: round, idempotencyKey: key, selection: 'exam-wrong-only'}); }).then(function (data) {
        if (!owned(token, generation)) return;
        if (!data || !data.run || !UUID.test(data.run.id || '') || data.run.kind !== 'review' || data.run.round !== round) throw new TypeError('Invalid review response');
        ctx.pending = false; ctx.keys.delete(round);
        var route = 'review-' + data.run.id; controller.stop(); options.onReview(route);
      }).catch(function (error) {
        if (!owned(token, generation)) return;
        ctx.pending = false;
        if (error && (error.status === 401 || error.code === 'session_changed')) { ctx.keys.clear(); login(); return; }
        status.setAttribute('role', 'alert');
        status.textContent = error && error.code === 'review_empty' ? '이 회차에 다시 풀 수 있는 선택 오답이 없어요. 목록을 새로 확인해 주세요.' : '재풀이 요청 결과를 확인하지 못했어요. 같은 버튼을 눌러 다시 확인해 주세요.';
        disabled.forEach(function (saved) { if (saved.element.isConnected) saved.element.disabled = saved.value; });
      });
    }
    function renderList() {
      if (!valid()) return;
      var section = shell();
      section.appendChild(node('p', '완료한 모의고사에서 답을 골라 틀린 문제만 모았어요. 미응답과 별표만 한 문제는 포함하지 않아요.'));
      section.appendChild(node('p', '같은 문항은 최근 오답 당시의 문제와 해설로 한 번만 표시해요. 나중에 맞혀도 원래 모의고사에서 틀린 기록은 남아요.'));
      section.appendChild(node('p', '최대 ' + ctx.limit + '문항 · 현재 ' + ctx.items.length + '문항'));
      if (ctx.hasMore) { var more = node('p', '표시 한도를 넘어 일부 오답 기록이 이 목록에 나오지 않아요.'); more.setAttribute('role', 'status'); more.setAttribute('data-notebook-has-more', ''); section.appendChild(more); }
      if (ctx.rejected) { var rejected = node('p', '일부 기록의 형식을 확인하지 못해 표시하지 않았어요. 목록을 다시 확인해 주세요.'); rejected.setAttribute('role', 'alert'); section.appendChild(rejected); }
      var refresh = button('목록 새로 확인', 'tool-btn', function () { reload(); }); refresh.setAttribute('data-notebook-refresh', ''); refresh.setAttribute('data-notebook-action', ''); section.appendChild(refresh);
      if (!ctx.items.length) { section.appendChild(node('p', '완료한 모의고사에서 답을 골라 틀린 문제가 아직 없어요.', 'cbt-notebook-empty')); return; }
      var rounds = Array.from(new Set(ctx.items.map(function (item) { return item.exam; }))).sort(function (a, b) { return b - a; });
      if (ctx.round && rounds.indexOf(Number(ctx.round)) === -1) ctx.round = '';
      var label = node('label', '회차 '), select = node('select'); select.setAttribute('aria-label', '오답노트 회차'); select.setAttribute('data-notebook-action', '');
      select.appendChild(node('option', '전체 회차')); select.firstChild.value = '';
      rounds.forEach(function (round) { var option = node('option', '제' + round + '회'); option.value = String(round); select.appendChild(option); });
      select.value = ctx.round; select.addEventListener('change', function () { if (!valid() || ctx.pending) return; ctx.round = select.value; ctx.page = 0; renderList(); }); label.appendChild(select); section.appendChild(label);
      var replayActions = node('div', null, 'fe-rounds'), replayStatus = node('p'); replayStatus.setAttribute('role', 'status'); replayStatus.setAttribute('aria-live', 'polite'); replayStatus.setAttribute('data-notebook-replay-status', '');
      (ctx.round ? [Number(ctx.round)] : rounds).forEach(function (round) {
        var replay = button('제' + round + '회 오답 다시 풀기', 'tool-btn', function () { startReview(round, replayStatus); }); replay.setAttribute('data-notebook-round', String(round)); replay.setAttribute('data-notebook-action', ''); replay.disabled = typeof options.onReview !== 'function'; replayActions.appendChild(replay);
      });
      section.appendChild(replayActions); section.appendChild(replayStatus);
      var filtered = ctx.items.filter(function (item) { return !ctx.round || item.exam === Number(ctx.round); }), pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      ctx.page = Math.max(0, Math.min(ctx.page, pages - 1));
      var list = node('ol', null, 'fe-reviews'); list.start = ctx.page * PAGE_SIZE + 1;
      filtered.slice(ctx.page * PAGE_SIZE, (ctx.page + 1) * PAGE_SIZE).forEach(function (item, offset) {
        var index = ctx.page * PAGE_SIZE + offset, row = node('li', null, 'fe-review fe-review--wrong'), details = node('details');
        details.setAttribute('data-notebook-question', item.questionId); details.setAttribute('data-notebook-version', item.version);
        details.appendChild(node('summary', '제' + item.exam + '회 ' + item.number + '번 · 오답'));
        var filled = false;
        details.addEventListener('toggle', function () {
          if (!valid() || !details.isConnected || !details.open || filled || !sameOwner(ctx.identity, identity(api))) return;
          filled = true;
          var original = node('div', null, 'fe-review-original'); details.appendChild(original);
          if (root.HanqLearningReader) { var source = root.HanqLearningReader.history(item, original); if (source) original = source; }
          if (item.common) image(item, original, item.common.image, true);
          image(item, original, item.image, false);
          var selected = item.options.find(function (option) { return option.id === item.selectedOptionId; });
          details.appendChild(node('p', '내 선택 ' + selected.number + '번 · 정답 ' + item.review.correctNumber + '번', 'fe-answer-compare'));
          var body = node('div', null, 'fe-review-body'); details.appendChild(body); explanation(item, body, index);
        });
        row.appendChild(details); list.appendChild(row);
      });
      section.appendChild(list);
      var nav = node('nav'); nav.setAttribute('aria-label', '오답노트 페이지');
      var previous = button('이전', 'tool-btn', function () { if (ctx.pending || ctx.page <= 0) return; ctx.page--; renderList(); }); previous.disabled = ctx.page === 0; previous.setAttribute('data-notebook-previous', ''); previous.setAttribute('data-notebook-action', '');
      var next = button('다음', 'tool-btn', function () { if (ctx.pending || ctx.page >= pages - 1) return; ctx.page++; renderList(); }); next.disabled = ctx.page === pages - 1; next.setAttribute('data-notebook-next', ''); next.setAttribute('data-notebook-action', '');
      nav.appendChild(previous); nav.appendChild(node('span', ' ' + (ctx.page + 1) + ' / ' + pages + ' 페이지 ')); nav.appendChild(next); section.appendChild(nav);
    }
    var controller = {ready: null, reload: reload, stop: function () {
      if (!ctx.alive) return; ctx.alive = false; ctx.generation++; ctx.pending = false; clearView();
      ctx.items = []; ctx.keys.clear(); if (ctx.off) ctx.off(); ctx.off = null;
      if (ctx.element) ctx.element.remove(); if (active === controller) active = null;
    }};
    active = controller;
    if (!api || typeof api.enabled !== 'function' || !api.enabled()) {
      shell().appendChild(node('p', '모의고사 서버 연결이 필요해요.')); controller.ready = Promise.resolve({enabled: false}); return controller;
    }
    shell().appendChild(node('p', '로그인을 확인하고 있어요…'));
    if (typeof api.onChange === 'function') ctx.off = api.onChange(authChanged);
    controller.ready = Promise.resolve().then(function () { return api.ensureSession?api.ensureSession():api.init(); }).then(function () {
      if (!valid()) return {cancelled: true}; ctx.initialized = true; ctx.identity = identity(api); return reload();
    }).catch(function (error) { if (valid()) { ctx.initialized = true; loadError(error); } return {error: true}; });
    return controller;
  }
  var exported = {mount: mount, stop: stop, normalize: normalize};
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  if (root.document) root.HanqCbtWrongNotebook = exported;
})(typeof window !== 'undefined' ? window : globalThis);
