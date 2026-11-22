/* A readable rendition of the weakness summary, one original section at a time. */
(function (root) {
  'use strict';
  var assetRoot = './';
  var request;

  function pageNumber(hash) {
    var match = /^#([1-9])$/.exec(hash);
    return match ? Number(match[1]) : 0;
  }
  function pageHref(page) { return page ? '#' + page : '#contents'; }
  function pageTitle(page) { return page.title + (page.page === 8 ? ' ①' : page.page === 9 ? ' ②' : ''); }

  function fetchPages() {
    if (!request) request = root.fetch(assetRoot + 'pages-v49.json?v=4', { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw Error('summary_unavailable');
        return response.json();
      }).then(function (pages) {
        if (!Array.isArray(pages) || pages.length !== 9 || pages.some(function (page, i) {
          return !page || page.page !== i + 1 || typeof page.title !== 'string' ||
            !page.title.trim() || !Array.isArray(page.sections) || !page.sections.length;
        })) throw Error('summary_incomplete');
        return pages;
      }).catch(function (error) { request = null; throw error; });
    return request;
  }

  function mount(host, options) {
    var doc = host.ownerDocument;
    var route = options.page;
    function current() { return host.isConnected && options.isCurrent(); }

    function useRealm(node, sectionTitle) {
      if (route !== 1 && route !== 8 && route !== 9) return;
      var realm = { '고구려': 'goguryeo', '백제': 'baekje', '신라': 'silla',
        '신라·통일신라': 'silla', '고려': 'goryeo', '조선': 'joseon' }[sectionTitle];
      if (realm) node.dataset.realm = realm;
    }

    function add(tag, parent, value, className) {
      var node = doc.createElement(tag);
      if (className) node.className = className;
      if (value != null) node.textContent = String(value);
      if (parent) parent.appendChild(node);
      return node;
    }
    function link(parent, href, value, className) {
      var a = add('a', parent, value, className);
      a.href = href;
      a.addEventListener('click', function (event) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (current()) options.navigate(href);
      });
      return a;
    }
    function list(parent, entries) {
      if (!Array.isArray(entries) || !entries.length) return;
      var items = add('ul', parent, null, 'hsr-list');
      entries.forEach(function (entry) { add('li', items, entry); });
    }
    function cards(parent, entries) {
      if (!Array.isArray(entries) || !entries.length) return;
      var grid = add('div', parent, null, 'hsr-cards');
      entries.forEach(function (card, i) {
        var box = add('section', grid, null, 'hsr-card');
        if (route === 1 && card.title === '고구려의 수·당 전쟁') box.dataset.event = 'battle';
        var safeImage = typeof card.image === 'string' && /^(?:images\/p[89]-[0-9]{2,3}\.(?:webp|jpg|jpeg|png)|\.\.\/culture-photos\/[a-z0-9-]+\.png)$/.test(card.image);
        if (safeImage) {
          box.classList.add('hsr-photo-card');
          var art = add('img', box);
          art.src = card.image;
          art.alt = card.title || '';
          if (Number.isInteger(card.width) && Number.isInteger(card.height) && card.width > 0 && card.height > 0) {
            art.width = card.width;
            art.height = card.height;
          }
          art.loading = i < 2 ? 'eager' : 'lazy';
          art.decoding = 'async';
        }
        if (card.tag) add('span', box, card.tag, 'hsr-tag');
        if (card.title) add('h4', box, [card.index, card.title].filter(Boolean).join(' · '));
        list(box, card.items);
        rows(box, card.rows, card.headers);
        if (safeImage && card.source && /^https:\/\/[a-z0-9.-]+\//i.test(card.source.url || '')) {
          var credit = add('a', box, card.source.label, 'hsr-credit');
          credit.href = card.source.url;credit.target = '_blank';credit.rel = 'noopener noreferrer';
        }
      });
    }
    function rows(parent, data, heading) {
      if (!Array.isArray(data) || !data.length) return;
      var rows = add('div', parent, null, 'hsr-rows');
      data.forEach(function (row) {
        var cells = row.filter(function (value) { return typeof value === 'string' && value.trim(); });
        if (!cells.length) return;
        var box = add('section', rows, null, 'hsr-row');
        if (route === 1) box.dataset.event = cells.some(function (cell) { return /동맹/.test(cell); }) ? 'alliance' : 'battle';
        var first = row.indexOf(cells[0]);
        var name = add('h4', box, cells[0]);
        if (first > 0 && heading && heading[first]) name.prepend(doc.createTextNode(heading[first] + ' · '));
        var details;
        row.forEach(function (cell, i) {
          if (i === first || typeof cell !== 'string' || !cell.trim()) return;
          if (!details) details = add('dl', box, null, 'hsr-details');
          var detail = add('div', details, null, 'hsr-detail');
          if (heading && heading[i]) add('dt', detail, heading[i]);
          else add('dt', detail, '핵심', 'hsr-sr-only');
          add('dd', detail, cell);
        });
      });
    }
    function content(parent, section, level) {
      if (section.title) add(level || 'h3', parent, section.title);
      list(parent, section.items);
      cards(parent, section.cards);
      rows(parent, section.rows, section.headers);
      if (Array.isArray(section.columns) && section.columns.length) {
        var columns = add('div', parent, null, 'hsr-columns');
        section.columns.forEach(function (column) {
          var group = add('section', columns, null, 'hsr-column');
          useRealm(group, column.title);
          content(group, column, 'h4');
        });
      }
    }
    function header(page) {
      host.replaceChildren();
      var head = add('header', host, null, 'hsr-head');
      var top = add('div', head, null, 'hsr-kicker');
      if (route) link(top, pageHref(0), '‹ 목차', 'hsr-control');
      else add('a', top, '‹ 역사숲', 'hsr-control').href = '../../#history';
      if (route) add('p', top, route + ' / 9쪽', 'hsr-counter');
      var title = add('h1', head, page ? pageTitle(page) : '한국사 통합 암기표');
      title.id = 'historySummaryTitle';
      title.tabIndex = -1;
      return title;
    }
    function render(pages) {
      var page = route ? pages[route - 1] : null, title = header(page);
      if (!page) {
        var nav = add('nav', host, null, 'hsr-toc');
        nav.setAttribute('aria-label', '통합 암기표 목차');
        var toc = add('ol', nav);
        pages.forEach(function (item) {
          var itemLink = link(add('li', toc), pageHref(item.page), null, 'hsr-toc-link');
          add('span', itemLink, String(item.page).padStart(2, '0'), 'hsr-toc-number');
          add('span', itemLink, pageTitle(item));
        });
      } else {
        var article = add('article', host, null, 'hsr-article');
        article.setAttribute('aria-labelledby', title.id);
        if (route >= 8 && page.sections.some(function(section){return (section.cards || []).some(function(card){return !card.image;});}))
          add('p', article, '통합본 사진을 옮겼어요. 일부 유물은 기존 공개 사진이나 글만 표시해요.', 'hsr-gallery-note');
        page.sections.forEach(function (section) {
          var block = add('section', article, null, 'hsr-section');
          useRealm(block, section.title);
          content(block, section, 'h2');
        });
        var foot = add('nav', host, null, 'hsr-footer');
        foot.setAttribute('aria-label', '암기표 쪽 이동');
        if (route > 1) link(foot, pageHref(route - 1), '‹ 이전', 'hsr-control');
        link(foot, pageHref(0), '목차', 'hsr-control');
        if (route < 9) link(foot, pageHref(route + 1), '다음 ›', 'hsr-control');
      }
      title.focus({ preventScroll: true });
    }
    function ready() {
      header(null);
      add('p', host, '암기표를 불러오는 중이에요.').setAttribute('role', 'status');
      return fetchPages().then(function (pages) {
        if (current()) render(pages);
      }).catch(function () {
        if (!current()) return;
        header(null);
        add('p', host, '암기표를 불러오지 못했어요.').setAttribute('role', 'alert');
        var retry = add('button', host, '다시 불러오기', 'hsr-control');
        retry.type = 'button';
        retry.addEventListener('click', ready);
        retry.focus();
      });
    }
    return ready();
  }

  var host = document.querySelector('#historySummary');
  function show() {
    var hash = root.location.hash;
    mount(host, { page: pageNumber(hash), isCurrent: function () { return root.location.hash === hash; }, navigate: function (href) {
      if (root.location.hash !== href) root.location.hash = href;
    } });
    root.scrollTo({ top: 0, behavior: 'auto' });
  }
  root.addEventListener('hashchange', show);
  show();
})(window);
