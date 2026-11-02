/*
 * HanqReviewMenu - grouped entry point for memory review decks.
 *
 * API
 *   window.HanqReviewMenu.mount(host, opts, group, part)
 *     host  : HTMLElement owned by the caller (the memory panel container)
 *     opts  : { onHome(), onRoute(group|null, part|null), onLearn(era) }
 *     group : null | 'ancient' | 'goryeo' | 'joseon' | 'opening' | 'colonial' | 'modern'
 *     part  : null (group default) or a part id valid for the group
 *   window.HanqReviewMenu.stop()
 *     Stops the review player, removes every listener and private deck entry
 *     this module created, and removes its DOM from the host.
 *
 * Depends on window.HanqReviewPlayer.mount(host, era, title) / stop() and
 * window.HANQ_MEMORY_REVIEWS. When window.HANQ_PERIOD_REVIEWS (media/period-reviews.js)
 * is loaded, every group/part except the related 독도와 간도 topic plays the
 * period one-page summaries (format 'period'). Original decks are never mutated.
 */
(function (window, document) {
  'use strict';

  var TEMP_PREFIX = '__hanqReviewMenu__';

  var GROUPS = [
    { id: 'ancient', label: '고대사' },
    { id: 'goryeo', label: '고려' },
    { id: 'joseon', label: '조선' },
    { id: 'opening', label: '개화기' },
    { id: 'colonial', label: '일제강점기' },
    { id: 'modern', label: '현대사' }
  ];

  // Parts per group. Groups without an entry have no part picker and use deck === group id.
  var PARTS = {
    ancient: {
      defaultPart: 'all',
      list: [
        { id: 'all', label: '고대사 전체', combine: ['prehistory', 'gojoseon', 'samguk', 'nambuk'] },
        { id: 'prehistory', label: '선사 시대', deck: 'prehistory' },
        { id: 'gojoseon', label: '고조선과 여러 나라', deck: 'gojoseon' },
        { id: 'samguk', label: '삼국 시대', deck: 'samguk' },
        // 백제 웅진·사비 왕 비교: 시기별 요약(media/period-reviews.js decks.baekje)만 있는 범위. 요약이 없으면 기존 삼국 카드로 연다.
        { id: 'baekje', label: '백제 웅진·사비 왕 비교', deck: 'samguk' },
        { id: 'nambuk', label: '남북국 시대', deck: 'nambuk' }
      ]
    },
    goryeo: {defaultPart:'all',list:[{id:'all',label:'고려 전체',deck:'goryeo'}]},
    joseon: {
      defaultPart: 'all',
      list: [
        { id: 'all', label: '조선 전체', deck: 'joseon' },
        { id: 'joseon-early', label: '조선 전기 · 공통 주제 포함', deck: 'joseon', stage: 'early' },
        { id: 'joseon-late', label: '조선 후기 · 공통 주제 포함', deck: 'joseon', stage: 'late' }
      ]
    },
    opening: {
      defaultPart: 'opening',
      list: [
        { id: 'opening', label: '개화기', deck: 'opening' },
        {
          id: 'islands',
          label: '관련 주제: 독도와 간도',
          deck: 'islands',
          related: true,
          note: '개화기와 연결해 함께 보는 관련 주제입니다. 수록 내용에는 개화기 이전과 이후 시기의 사실도 포함됩니다.'
        }
      ]
    }
  };

  var idSeq = 0;
  var state = null;

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function findGroup(id) {
    for (var i = 0; i < GROUPS.length; i++) {
      if (GROUPS[i].id === id) return GROUPS[i];
    }
    return null;
  }

  function findPart(groupId, partId) {
    if((groupId==='ancient'||groupId==='goryeo')&&partId==='personal')return {id:'personal',label:'핵심 복습',deck:groupId};
    var cfg = PARTS[groupId];
    if (!cfg) return null;
    for (var i = 0; i < cfg.list.length; i++) {
      if (cfg.list[i].id === partId) return cfg.list[i];
    }
    return null;
  }

  // Returns { group, part } with part null for groups without parts,
  // or null when the route is invalid (caller falls back to the group menu).
  function normalizeRoute(group, part) {
    if (group === 'mixed-quiz' || group === 'goryeo-joseon' || group === 'integrated-blank') return (part === null || part === undefined || part === '') ? { group: group, part: null } : null;
    if (group === null || group === undefined || group === '') return null;
    if (!findGroup(group)) return null;
    var cfg = PARTS[group];
    if (!cfg) {
      return (part === null || part === undefined || part === '') ? { group: group, part: null } : null;
    }
    if(group==='ancient'||group==='goryeo')part='personal';
    else if (part === null || part === undefined || part === '') part = cfg.defaultPart;
    return findPart(group, part) ? { group: group, part: part } : null;
  }

  function safeCall(fn, args) {
    if (typeof fn !== 'function') return;
    try {
      fn.apply(null, args || []);
    } catch (err) {
      if (window.console && window.console.error) window.console.error('[HanqReviewMenu] callback failed', err);
    }
  }

  // ---------- deck helpers (read-only on originals) ----------

  function reviews() {
    var r = window.HANQ_MEMORY_REVIEWS;
    return (r && typeof r === 'object') ? r : null;
  }

  function getDeck(id) {
    if (id === 'colonial' && window.HANQ_COLONIAL_REVIEW) return window.HANQ_COLONIAL_REVIEW;
    var r = reviews();
    return (r && hasOwn(r, id)) ? r[id] : null;
  }

  function getCards(deck) {
    if (!deck) return null;
    if (Object.prototype.toString.call(deck) === '[object Array]') return deck;
    if (deck.cards && Object.prototype.toString.call(deck.cards) === '[object Array]') return deck.cards;
    return null;
  }

  function shallowCopy(obj) {
    var out = {};
    for (var k in obj) {
      if (hasOwn(obj, k)) out[k] = obj[k];
    }
    return out;
  }

  function copyCards(cards) {
    var out = [];
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      out.push(c && typeof c === 'object' ? shallowCopy(c) : c);
    }
    return out;
  }

  // Builds a new deck that keeps the base deck's metadata (autoplay, sources, ...)
  // and replaces only its cards and title.
  function deriveDeck(base, cards, title) {
    if (Object.prototype.toString.call(base) === '[object Array]') return cards;
    var deck = shallowCopy(base);
    deck.cards = cards;
    if (hasOwn(base, 'title')) deck.title = title;
    return deck;
  }

  function mergeSources(decks) {
    var seen = [];
    var merged = [];
    var any = false;
    for (var i = 0; i < decks.length; i++) {
      var src = decks[i] && decks[i].sources;
      if (Object.prototype.toString.call(src) !== '[object Array]') continue;
      any = true;
      for (var j = 0; j < src.length; j++) {
        var key = typeof src[j] === 'object' ? JSON.stringify(src[j]) : String(src[j]);
        if (seen.indexOf(key) === -1) {
          seen.push(key);
          merged.push(src[j]);
        }
      }
    }
    return any ? merged : null;
  }

  function registerTemp(name, deck) {
    var r = reviews();
    if (!r) return null;
    var key = TEMP_PREFIX + name;
    var n = 0;
    while (hasOwn(r, key)) {
      n += 1;
      key = TEMP_PREFIX + name + '_' + n;
    }
    r[key] = deck;
    state.tempKeys.push(key);
    return key;
  }

  function clearTemps() {
    if (!state) return;
    var r = reviews();
    for (var i = 0; i < state.tempKeys.length; i++) {
      if (r && hasOwn(r, state.tempKeys[i])) {
        try { delete r[state.tempKeys[i]]; } catch (e) { r[state.tempKeys[i]] = undefined; }
      }
    }
    state.tempKeys = [];
  }

  // Builds the deck for a part without registering it: { era } for an existing deck id,
  // { name, deck } for a derived deck, or null when no cards are available.
  function buildDeck(partCfg, title, groupId) {
    var cards, base, deck, i;
    if(partCfg.id==='personal')return state&&state.personal&&state.personal.era===groupId?{name:'personal_'+groupId,deck:state.personal}:null;
    // 시기별 요약(media/period-reviews.js)에 켜진 묶음은 그 덱을 쓴다. 나머지와 관련 주제(독도와 간도)는 원래 카드.
    var period = window.HANQ_PERIOD_REVIEWS;
    if (period && typeof period.route === 'function' && groupId) {
      var pd = null;
      try { pd = period.route(groupId, partCfg.id || null); } catch (err) { pd = null; }
      if (pd && getCards(pd) && getCards(pd).length) {
        pd.title = title;
        return { name: 'period_' + groupId + '_' + (partCfg.id || 'all'), deck: pd };
      }
    }
    if (partCfg.combine) {
      var decks = [];
      cards = [];
      for (i = 0; i < partCfg.combine.length; i++) {
        var d = getDeck(partCfg.combine[i]);
        var dc = getCards(d);
        if (!dc) continue;
        decks.push(d);
        cards = cards.concat(copyCards(dc));
      }
      if (!cards.length) return null;
      deck = deriveDeck(decks[0], cards, title);
      if (deck !== cards) {
        var sources = mergeSources(decks);
        if (sources) deck.sources = sources;
      }
      return { name: 'ancient_all', deck: deck };
    }
    base = getDeck(partCfg.deck);
    var baseCards = getCards(base);
    if (!baseCards || !baseCards.length) return null;
    if (!partCfg.stage) return { era: partCfg.deck, deck: base };
    cards = [];
    for (i = 0; i < baseCards.length; i++) {
      var stage = baseCards[i] && baseCards[i].stage;
      if (stage === partCfg.stage || stage === 'cross') cards.push(baseCards[i]);
    }
    if (!cards.length) return null;
    return { name: partCfg.deck + '_' + partCfg.stage, deck: deriveDeck(base, copyCards(cards), title) };
  }

  // Resolves the deck id handed to the player, registering a private derived deck if needed.
  // Returns null when no cards are available.
  function resolveEra(partCfg, title, groupId) {
    var built = buildDeck(partCfg, title, groupId);
    if (!built) return null;
    return built.era || registerTemp(built.name, built.deck);
  }

  function defaultPart(groupId) {
    var group = findGroup(groupId), cfg = PARTS[groupId];
    return cfg ? findPart(groupId, cfg.defaultPart) : { id: null, label: group.label, deck: group.id };
  }

  // 메뉴 카드·범위 선택지의 자동 재생 시간: 지금 켜진 플레이어 설정(시기별 요약은 빈칸 떠올리기 기본, 나머지는 기존 카드)으로 실제 계산.
  function groupSummary(groupId) {
    if (groupId === 'ancient' || groupId === 'goryeo') return '핵심 복습 · 누구나 이용';
    return deckSummary(buildDeck(defaultPart(groupId), findGroup(groupId).label, groupId));
  }

  function deckSummary(built) {
    var player = window.HanqReviewPlayer;
    var deck = built && built.deck, cards = getCards(deck);
    if (!cards || !cards.length) return '';
    var count = deck.format === 'period' ? cards.length + '쪽 요약' : cards.length + '장 카드';
    if (!player || typeof player.estimate !== 'function') return count;
    var ms = player.estimate(deck);
    var rate=player.getRate?player.getRate():1;return ms > 0 ? count + ' · '+rate+'배 약 ' + Math.round(ms / rate / 60000) + '분 (1배 기준 '+Math.round(ms/60000)+'분)' : count;
  }

  // ---------- DOM helpers ----------

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function listen(node, type, handler) {
    node.addEventListener(type, handler, false);
    state.listeners.push({ node: node, type: type, handler: handler });
  }

  function removeListeners() {
    if (!state) return;
    for (var i = 0; i < state.listeners.length; i++) {
      var l = state.listeners[i];
      l.node.removeEventListener(l.type, l.handler, false);
    }
    state.listeners = [];
  }

  function button(label, className, onClick) {
    var b = el('button', 'hanq-rm__btn' + (className ? ' ' + className : ''), label);
    b.type = 'button';
    listen(b, 'click', onClick);
    return b;
  }

  function stopPlayer() {
    if (!state || !state.playerActive) return;
    state.playerActive = false;
    var player = window.HanqReviewPlayer;
    if (player && typeof player.stop === 'function') {
      try {
        player.stop();
      } catch (err) {
        if (window.console && window.console.error) window.console.error('[HanqReviewMenu] player stop failed', err);
      }
    }
  }

  // Tears down the current view (player, listeners, temp decks, DOM) but keeps state.host/opts.
  function clearView() {
    if (state && state.host) state.host.classList.remove('review-index--comparison');
    stopPlayer();
    if (state.quiz) { state.quiz.stop(); state.quiz = null; }
    removeListeners();
    clearTemps();
    if (state.root && state.root.parentNode) state.root.parentNode.removeChild(state.root);
    state.root = null;
  }

  function newRoot(view) {
    var root = el('section', 'hanq-rm');
    root.setAttribute('data-view', view);
    idSeq += 1;
    root.setAttribute('aria-labelledby', 'hanq-rm-title-' + idSeq);
    state.root = root;
    return root;
  }

  function heading(text) {
    var h = el('h2', 'hanq-rm__title', text);
    h.id = 'hanq-rm-title-' + idSeq;
    h.tabIndex = -1;
    return h;
  }

  function focusTitle(root) {
    var h = root.querySelector('.hanq-rm__title');
    if (h && typeof h.focus === 'function') {
      try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); }
    }
  }

  // ---------- views ----------

  function renderMenu(moveFocus) {
    clearView();
    state.group = null;
    state.part = null;

    var root = newRoot('menu');
    root.appendChild(heading('전체 복습하기'));
    if (window.HanqMixedReviewQuiz && window.HANQ_MIXED_REVIEW_BANK) {
      var mixedEntry = button('전체범위 4지선다 퀴즈', 'hanq-rm__mixed-entry', groupHandler('mixed-quiz'));
      mixedEntry.setAttribute('data-mixed-entry', 'true');
      mixedEntry.appendChild(el('small', null, '한 줄 단서로 시대·인물을 찾고 관련 특징을 연결해요.'));
      root.appendChild(mixedEntry);
    }

    var blankEntry = button('고려·조선 통합 빈칸 복습', 'hanq-rm__mixed-entry', groupHandler('integrated-blank'));
    blankEntry.setAttribute('data-integrated-blank-entry', 'true');
    blankEntry.appendChild(el('small', null, '78회 지문·모든 선지의 핵심어를 직접 떠올려요.'));
    root.appendChild(blankEntry);
    var compareEntry = button('고려 vs 조선', 'hanq-rm__mixed-entry', groupHandler('goryeo-joseon'));
    compareEntry.setAttribute('data-comparison-entry', 'true');
    compareEntry.appendChild(el('small', null, '왕 · 경제 · 사회 · 문화 한눈에 비교'));
    root.appendChild(compareEntry);

    // 시대별 학습 목차와 같은 DOM·클래스(.toc · .period.ready · .number · .period-text · .state · .chevron)
    var grid = el('section', 'toc hanq-rm__toc');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', '시대 선택');
    for (var i = 0; i < GROUPS.length; i++) {
      var b = el('button', 'period ready hanq-rm__group');
      b.type = 'button';
      b.style.setProperty('--card-order', String(i));
      b.setAttribute('data-group', GROUPS[i].id);
      b.appendChild(el('span', 'number', (i < 9 ? '0' : '') + (i + 1)));
      var txt = el('span', 'period-text');
      txt.appendChild(el('strong', null, GROUPS[i].label));
      txt.appendChild(el('small', null, groupSummary(GROUPS[i].id)));
      b.appendChild(txt);
      b.appendChild(el('span', 'state', '복습하기'));
      b.appendChild(el('span', 'chevron', '›'));
      listen(b, 'click', groupHandler(GROUPS[i].id));
      grid.appendChild(b);
    }
    root.appendChild(grid);

    var nav = el('div', 'hanq-rm__nav');
    nav.appendChild(button('메인 메뉴', 'hanq-rm__btn--ghost', onHomeClick));
    root.appendChild(nav);

    state.host.appendChild(root);
    if (moveFocus) focusTitle(root);
  }

  function renderDetail(route, moveFocus) {
    if (route.group === 'mixed-quiz') { renderMixed(moveFocus); return; }
    if (route.group === 'goryeo-joseon') { renderComparison(moveFocus); return; }
    if (route.group === 'integrated-blank') { renderIntegrated(moveFocus); return; }
    clearView();
    if(state.group!==route.group)state.personal=null;
    state.group = route.group;
    state.part = route.part;

    var group = findGroup(route.group);
    var cfg = PARTS[route.group];
    var partCfg = cfg ? findPart(route.group, route.part) : { id: null, label: group.label, deck: group.id };

    var root = newRoot('detail');
    root.setAttribute('data-review-group', route.group);

    var nav = el('div', 'hanq-rm__nav');
    nav.appendChild(button('복습 메뉴로', 'hanq-rm__btn--ghost', onBackClick));
    nav.appendChild(button('메인 홈', 'hanq-rm__btn--ghost', onHomeClick));
    root.appendChild(nav);

    root.appendChild(heading(group.label + ' 복습'));


    if (partCfg.related) {
      var badge = el('p', 'hanq-rm__related');
      badge.appendChild(el('strong', 'hanq-rm__tag', '관련 주제'));
      badge.appendChild(document.createTextNode(' ' + partCfg.note));
      root.appendChild(badge);
    }

    var learnEra = partCfg.deck || (partCfg.combine && partCfg.combine[0]);
    if (typeof state.opts.onLearn === 'function' && learnEra) {
      nav.appendChild(button('학습으로', 'hanq-rm__btn--ghost', function () {
        safeCall(state.opts.onLearn, [learnEra]);
      }));
    }

    var playerHost = el('div', 'hanq-rm__player');
    root.appendChild(playerHost);
    state.host.appendChild(root);
    loadShared();

    var title = cfg && partCfg.id !== cfg.defaultPart ? group.label + ' · ' + partCfg.label : group.label;
    if (partCfg.related) title = partCfg.label;
    var era = resolveEra(partCfg, title, route.group);
    if(route.part==='personal'&&state.personal)title=group.label+' 핵심 복습 · ' + state.personal.questionCount + '개 핵심';
    var player = window.HanqReviewPlayer;
    if (!era) {
      var status=el('p','hanq-rm__empty',state.personalStatus||'복습 자료를 불러오는 중입니다.');status.setAttribute('role','status');playerHost.appendChild(status);
    } else if (!player || typeof player.mount !== 'function') {
      playerHost.appendChild(el('p', 'hanq-rm__empty', '복습 플레이어를 불러오지 못했습니다.'));
    } else {
      try {
        player.mount(playerHost, era, title);
        state.playerActive = true;
      } catch (err) {
        if (window.console && window.console.error) window.console.error('[HanqReviewMenu] player mount failed', err);
        playerHost.appendChild(el('p', 'hanq-rm__empty', '복습 플레이어를 시작하지 못했습니다.'));
      }
    }

    if (moveFocus) focusTitle(root);
  }

  function renderMixed(moveFocus) {
    clearView();
    state.group = 'mixed-quiz'; state.part = null;
    var root = newRoot('mixed-quiz'), nav = el('div', 'hanq-rm__nav');
    nav.appendChild(button('복습 메뉴로', 'hanq-rm__btn--ghost', onBackClick));
    nav.appendChild(button('메인 홈', 'hanq-rm__btn--ghost', onHomeClick));
    root.appendChild(nav); root.appendChild(heading('전체범위 4지선다 퀴즈'));
    var quizHost = el('div', 'hanq-rm__quiz'); root.appendChild(quizHost); state.host.appendChild(root);
    if (window.HanqMixedReviewQuiz) state.quiz = window.HanqMixedReviewQuiz.mount(quizHost);
    else quizHost.appendChild(el('p', 'hanq-rm__empty', '퀴즈 자료를 불러오지 못했어요. 페이지를 새로고침해 주세요.'));
    if (moveFocus) focusTitle(root);
  }

  function renderIntegrated(moveFocus) {
    clearView(); state.group='integrated-blank'; state.part=null;
    var root=newRoot('integrated-blank'),nav=el('div','hanq-rm__nav');
    nav.appendChild(button('복습 메뉴로','hanq-rm__btn--ghost',onBackClick));
    root.appendChild(nav);root.appendChild(heading('고려·조선 통합 빈칸 복습'));
    var host=el('div','hanq-rm__quiz');root.appendChild(host);state.host.appendChild(root);
    if(window.HanqIntegratedBlankPractice&&window.HANQ_INTEGRATED_BLANK_BANK)state.quiz=window.HanqIntegratedBlankPractice.mount(host,window.HANQ_INTEGRATED_BLANK_BANK);
    else host.appendChild(el('p','hanq-rm__empty','복습 자료를 불러오지 못했어요. 새로고침해 주세요.'));
    if(moveFocus)focusTitle(root);
  }

  function renderComparison(moveFocus) {
    clearView(); state.host.classList.add('review-index--comparison'); state.group = 'goryeo-joseon'; state.part = null;
    var root = newRoot('goryeo-joseon'), nav = el('div', 'hanq-rm__nav');
    nav.appendChild(button('복습 메뉴로', 'hanq-rm__btn--ghost', onBackClick));
    root.appendChild(nav); root.appendChild(heading('고려 vs 조선'));
    var data = window.HANQ_GORYEO_JOSEON_COMPARISON;
    if (!data) root.appendChild(el('p', 'hanq-rm__empty', '비교 자료를 불러오지 못했어요. 새로고침해 주세요.'));
    else {
      var comparison = el('div', 'hanq-comparison');
      comparison.appendChild(el('p', 'hc-intro', '고려 918–1392 · 불교 + 유교 정치 / 조선 1392–1910 · 성리학'));
      data.topics.forEach(function(topic, index) {
        var section = el('section', 'hc-topic'); section.setAttribute('aria-labelledby', 'hc-topic-' + topic.id);
        var title = el('h3', 'hc-topic-title', '0' + (index + 1) + ' ' + topic.label); title.id = 'hc-topic-' + topic.id;
        section.appendChild(title); var pair = el('div', 'hc-pair');
        topic.eras.forEach(function(era, n) {
          var card = el('article', 'hc-card ' + (n ? 'hc-joseon' : 'hc-goryeo')); card.id = era.id;
          // Static reviewed source fragment only; no user/API HTML is interpolated.
          card.innerHTML = era.html;
          var old = card.querySelector('.section-head h3'), label = el('h4', null, era.era);
          old.replaceWith(label); card.setAttribute('aria-labelledby', 'hc-era-' + era.id); label.id = 'hc-era-' + era.id;
          pair.appendChild(card);
        }); section.appendChild(pair); comparison.appendChild(section);
      });
      var footer = el('footer', 'hc-footer'); footer.innerHTML = data.footer; comparison.appendChild(footer); root.appendChild(comparison);
    }
    state.host.appendChild(root); if (moveFocus) focusTitle(root);
  }

  // ---------- UI handlers (update view first, then report route) ----------

  function groupHandler(groupId) {
    return function () {
      if (!state) return;
      var route = normalizeRoute(groupId, null);
      if (!route) return;
      if(groupId==='ancient'&&state.personal)route.part='personal';
      renderDetail(route, true);
      safeCall(state.opts.onRoute, [route.group, route.part]);
    };
  }

  function onPartChange(evt) {
    if (!state || !state.group) return;
    var route = normalizeRoute(state.group, evt.target.value);
    if (!route) return;
    var group = state.group;
    renderDetail(route, false);
    var select = state.root && state.root.querySelector('.hanq-rm__select');
    if (select) select.focus();
    safeCall(state.opts.onRoute, [group, route.part]);
  }

  function onBackClick() {
    if (!state) return;
    renderMenu(true);
    safeCall(state.opts.onRoute, [null, null]);
  }

  function onHomeClick() {
    if (!state) return;
    var onHome = state.opts.onHome;
    stop();
    safeCall(onHome);
  }

  // All review routes contain curated public material. Never request owner data here.
  function sharedDeck(group){
    var data=window.HANQ_SHARED_CORE_REVIEWS&&window.HANQ_SHARED_CORE_REVIEWS[group];
    return data&&data.source==='shared-core'&&window.HanqFocusedReview?window.HanqFocusedReview.build(data):null;
  }
  function loadShared(){
    if(!state||!(state.group==='ancient'||state.group==='goryeo'))return;
    if(!state.personal)state.personal=sharedDeck(state.group);
    state.personalStatus=state.personal?'':'공통 복습 자료를 불러오지 못했습니다. 페이지를 새로고침해 주세요.';
  }

  // ---------- public API ----------

  function mount(host, opts, group, part) {
    if (!host || typeof host.appendChild !== 'function') return;
    var route = normalizeRoute(group, part);
    var g = route ? route.group : null;
    var p = route ? route.part : null;

    // Re-entrant call from onRoute with the route already shown: just refresh callbacks.
    if (state && state.host === host && state.root && state.root.parentNode === host &&
        state.group === g && state.part === p) {
      state.opts = opts || {};
      return;
    }

    stop();
    state = { host: host, opts: opts || {}, root: null, group: null, part: null,
      listeners: [], tempKeys: [], playerActive: false };
    if (route) renderDetail(route, false);
    else renderMenu(false);
  }

  function stop() {
    if (!state) return;
    state.personal=null;
    clearView();
    state = null;
  }

  window.HanqReviewMenu = { mount: mount, stop: stop };
})(window, document);
