/* Private textbook reader. Source bytes never ship in this static application.
 * Server authorization is mandatory for EVERY manifest, page and image request.
 * Blob URLs live only while the authenticated reader is mounted. */
(function (root) {
  'use strict';
  var eras = [
    { id: 'prehistory', title: '선사시대·고조선과 여러 나라', from: 8, to: 15 },
    { id: 'samguk', title: '삼국·가야', from: 16, to: 30 },
    { id: 'nambuk', title: '통일 신라·발해', from: 31, to: 39 },
    { id: 'goryeo', title: '고려', from: 40, to: 56 },
    { id: 'joseon', title: '조선', from: 57, to: 84 },
    { id: 'opening', title: '개화기', from: 85, to: 104 },
    { id: 'colonial', title: '일제강점기', from: 105, to: 122 },
    { id: 'modern', title: '대한민국', from: 123, to: 136 },
    { id: 'people', title: '인물사', from: 137, to: 138 },
    { id: 'regions', title: '지역사·지도', from: 139, to: 141 },
    { id: 'front', title: '표지·목차·활용법', from: 1, to: 7 },
    { id: 'credits', title: '그림 출처·발행 정보', from: 142, to: 144 }
  ];
  var aliases = { ancient: 'samguk', gojoseon: 'prehistory', 'joseon-early': 'joseon', 'joseon-late': 'joseon', islands: 'regions' };
  var OLD_SOURCE = '35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442', NEW_SOURCE = 'd54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
  // Deployment declaration, not a server capability probe. Absent on production
  // until this API and both immutable source roots have been verified there.
  var REVIEWED_REVISION_RELEASE='ab5bffed546f288870f7362627cd18cd4a820f63:a974f63221b7872400adc220d0ee484bec02bc89';
  function revisionRoutesReady(document, eraId) {
    var flag=document&&document.querySelector('meta[name="hanq-textbook-revisions"]');
    if(!flag||flag.content!==REVIEWED_REVISION_RELEASE)return false;
    var partial=document.querySelector('meta[name="hanq-textbook-reviewed-eras"]');
    if(!partial)return true;
    var allowed=partial.content.split(',').map(function(id){return id.trim();});
    if(!allowed.length||new Set(allowed).size!==allowed.length||allowed.some(function(id){return !eras.some(function(era){return era.id===id;});}))return false;
    return typeof eraId==='string'&&allowed.indexOf(aliases[eraId]||eraId)!==-1;
  }
  var revisedRanges = {nambuk:[31,40],goryeo:[41,58],joseon:[59,87],opening:[88,107],colonial:[108,125],modern:[126,139],people:[140,141],regions:[142,144],credits:[145,147]};
  function sourceInfo(revision) {
    if (revision != null && revision !== OLD_SOURCE && revision !== NEW_SOURCE) return null;
    return {sha256:revision || OLD_SOURCE,totalPdfPages:revision===NEW_SOURCE?147:144,edition:revision===NEW_SOURCE?'81회 대비':'79회 대비'};
  }
  function erasFor(revision) {
    if (!sourceInfo(revision)) return [];
    return eras.map(function(e){var range=revision===NEW_SOURCE&&revisedRanges[e.id];return {id:e.id,title:e.title,from:range?range[0]:e.from,to:range?range[1]:e.to};});
  }
  function eraFor(id, revision) { var list=erasFor(revision); return list.find(function(e){return e.id===(aliases[id]||id);})||list[0]||null; }
  function errorText(e) {
    if (e && (e.status === 401 || e.code === 'session_changed')) return '로그인을 확인해 주세요. 회원 교재는 로그인한 회원 계정으로 열 수 있어요.';
    if (e && e.status === 403) return '이 계정에는 회원 교재 열람 권한이 없어요. 로그인 상태와 서버 권한을 확인해 주세요.';
    if (e && (e.status === 503 || e.code === 'textbook_not_configured')) return '회원 교재의 회원용 자료 저장소가 아직 설정되지 않았어요.';
    if (e && e.status === 404) return '회원 교재 API 또는 해당 페이지 자료가 아직 준비되지 않았어요.';
    if (e && e.code === 'disabled') return '회원 교재를 불러올 서버가 연결되지 않았어요.';
    if (e && e.code === 'timeout') return '교재를 불러오는 시간이 길어졌어요. 다시 시도해 주세요.';
    return '교재를 불러오지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.';
  }
  function validManifest(m, expectedRevision) {
    var info=m&&m.source&&sourceInfo(m.source.sha256);
    return !!(info && (expectedRevision==null || m.source.sha256===expectedRevision) &&
      (m.source.pageCount==null || m.source.pageCount===info.totalPdfPages) &&
      (m.source.totalPdfPages==null || m.source.totalPdfPages===info.totalPdfPages) &&
      (m.source.revision==null || m.source.revision===info.sha256) && Array.isArray(m.pages) && m.pages.length===info.totalPdfPages &&
      m.pages.every(function(p,i){return p.pdfPage===i+1&&p.width>0&&p.height>0;}));
  }
  function pageLabel(p) { return '자료 ' + p.pdfPage; }
  function create(options) {
    options = options || {};
    var api = options.api || root.HanqApi, doc = options.document || root.document;
    var url = options.url || root.URL, storage = options.storage;
    if (storage === undefined) { try { storage = root.localStorage; } catch (_) { storage = null; } }
    var host = null, generation = 0, request = 0, unsubscribe = null, objects = [], manifest = null, page = null, imageUrl = null;
    var navigation = null, sourceRevision = null, expectedRevision = OLD_SOURCE, rawHooks = null;
    var era, pageNo, enhanced = true, mode = 'regions', zoom = 'readable', session = '', status, viewport, sourceSelect, pageSelect, regionSelect;
    function identity() { var s = api && api.state(); return s && s.signedIn && !s.restoring && s.ownerId ? s.ownerId + ':' + s.epoch : ''; }
    function cleanupImages() { objects.forEach(function (u) { url.revokeObjectURL(u); }); objects = []; imageUrl = null; }
    function stop() { generation++; request++; if (unsubscribe) unsubscribe(); unsubscribe = null; cleanupImages(); if (host) host.replaceChildren(); host = null; manifest = null; page = null; }
    function node(tag, text, attrs) { var el = doc.createElement(tag); if (text) el.textContent = text; Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); }); return el; }
    function button(text, action) { var b = node('button', text, { type: 'button' }); b.addEventListener('click', action); return b; }
    function select(label, values, action) { var wrap = node('label', label), s = node('select'); values.forEach(function (v) { s.appendChild(node('option', v[1], { value: v[0] })); }); s.addEventListener('change', action); wrap.appendChild(s); return { wrap: wrap, select: s }; }
    function bookmarkKey() { return manifest && session ? 'hanq:textbook-position:v1:' + session.split(':')[0] + ':' + manifest.source.sha256 + ':' + era.id : null; }
    function remember() { var key = bookmarkKey(); if (key && storage && page) try { storage.setItem(key, JSON.stringify({ pdfPage: pageNo })); } catch (_) {} }
    function message(text) { if (status) status.textContent = text; }
    function valid(g, r) { return !!host && g === generation && r === request && session === identity(); }
    function selectedRegions() {
      var list = page && (page.regions || page.readingRegions || page.regionCandidates);
      if (mode === 'page' || !Array.isArray(list) || !list.length) return [{ id: 'page', bbox: [0, 0, page.width, page.height], label: '원본 전체 페이지' }];
      return list.filter(function (r) { return Array.isArray(r.bbox) && r.bbox.length === 4 && r.bbox.every(Number.isFinite) && r.bbox[0] >= 0 && r.bbox[1] >= 0 && r.bbox[2] <= page.width + 0.1 && r.bbox[3] <= page.height + 0.1 && r.bbox[2] > r.bbox[0] && r.bbox[3] > r.bbox[1]; });
    }
    function renderPage() {
      if (!page || !imageUrl || !viewport) return;
      viewport.replaceChildren();
      var regions = selectedRegions();
      if (!regions.length) regions = [{ id: 'page', bbox: [0, 0, page.width, page.height], label: '원본 전체 페이지' }];
      regionSelect.replaceChildren();
      regions.forEach(function (r, i) {
        var frame = node('section', '', { 'class': 'textbook-region', id: 'textbook-region-' + i });
        frame.appendChild(node('h3', mode === 'page' ? pageLabel(page) : '구간 ' + (i + 1) + ' · ' + pageLabel(page)));
        var scroller = node('div', '', { 'class': 'textbook-pan', tabindex: '0', role: 'region', 'aria-label': '원래 표의 열 순서 유지 · 좌우로 이동해 읽기' });
        var b = r.bbox.slice(), vp = page.readingViewport;
        if (mode === 'regions' && vp && vp.discardedSidePixelsExactlyWhite === true && Array.isArray(vp.bbox) && vp.bbox.length === 4 && vp.bbox.every(Number.isFinite) && vp.bbox[0] >= 0 && vp.bbox[2] <= page.width && vp.bbox[2] > vp.bbox[0]) {
          b[0] = Math.max(b[0], vp.bbox[0]); b[2] = Math.min(b[2], vp.bbox[2]);
        }
        var width = b[2] - b[0], height = b[3] - b[1];
        var crop = node('div', '', { 'class': 'textbook-crop' });
        // Source coordinates are PDF points; keep normal source glyphs at least 16 CSS px.
        // Only pixel-proven white side strips may be cropped; retain full-page source scale.
        var sizes = [];
        (page.textBlocks || []).forEach(function (block) { (block.lines || []).forEach(function (line) { (line.spans || []).forEach(function (span) {
          var box = span.bbox || block.bbox;
          if (box && box[3] > b[1] && box[1] < b[3] && Number.isFinite(span.size) && span.size >= 6 && span.size <= 24) sizes.push(span.size);
        }); }); });
        var sourceSize = sizes.length ? Math.min.apply(Math, sizes) : 9;
        var fullPageWidth = Math.max(1024, Math.ceil(page.width * 16 / sourceSize));
        var readableWidth = fullPageWidth * width / page.width;
        crop.style.width = zoom === 'fit' ? '100%' : Math.ceil(readableWidth * (zoom === 'large' ? 1.25 : 1)) + 'px';
        crop.setAttribute('data-source-bounds', b.join(','));
        crop.setAttribute('data-min-source-font-size', String(sourceSize));
        crop.style.aspectRatio = width + '/' + height;
        var img = node('img', '', { alt: pageLabel(page) + ' 원문 배치, 표, 이미지' + (mode === 'regions' ? ' 구간 ' + (i + 1) : ''), draggable: 'false' });
        img.src = imageUrl;
        img.style.width = (page.width / width * 100) + '%';
        img.style.left = (-b[0] / width * 100) + '%';
        img.style.top = (-b[1] / height * 100) + '%';
        crop.appendChild(img); scroller.appendChild(crop); frame.appendChild(scroller); viewport.appendChild(frame);
        regionSelect.appendChild(node('option', '구간 ' + (i + 1), { value: String(i) }));
      });
      regionSelect.disabled = regions.length < 2;
    }
    function loadPage(n) {
      if (!manifest || n < era.from || n > era.to) return Promise.resolve();
      pageNo = n; pageSelect.value = String(n); var g = generation, r = ++request;
      cleanupImages(); page = null; viewport.replaceChildren(); message(pageLabel(manifest.pages[n - 1]) + ' 불러오는 중…');
      var variant = enhanced;
      return api.textbookPage(n, sourceRevision).then(function (detail) {
        if (!valid(g, r)) return null;
        if(detail&&detail.sourceSha256&&detail.sourceSha256!==expectedRevision)throw new Error('source_revision_mismatch');
        variant = variant && !!(detail && detail.enhancementAudit && detail.enhancementAudit.pixelPreservationVerified === true);
        return api.textbookImage(n, variant, sourceRevision).then(function (blob) { return [detail, blob]; });
      }).then(function (result) {
        if (!valid(g, r) || !result) return;
        if (!result[0] || result[0].pdfPage !== n || result[0].width !== manifest.pages[n - 1].width || result[0].height !== manifest.pages[n - 1].height) throw new Error('invalid_page');
        page = result[0]; imageUrl = url.createObjectURL(result[1]); objects.push(imageUrl);
        renderPage(); remember();if(rawHooks&&rawHooks.onPageChange)rawHooks.onPageChange(n,expectedRevision); message(pageLabel(page) + (variant ? ' · 원문 굵은 글씨를 진한 파랑으로 강조' : ' · 원본 색상' + (enhanced ? ' (파랑 강조 검수 전, 원본 표시)' : '')));
        host.querySelector('[data-previous]').disabled = n === era.from;
        host.querySelector('[data-next]').disabled = n === era.to;
      }).catch(function (e) { if (valid(g, r)) { cleanupImages(); viewport.replaceChildren(); message(errorText(e) + (variant && e.status === 404 ? ' 원본 색상으로 바꾸어 확인할 수 있어요.' : '')); } });
    }
    function setEra(id, resume) {
      era = eraFor(id, sourceRevision); sourceSelect.value = era.id; pageSelect.replaceChildren();
      for (var n = era.from; n <= era.to; n++) pageSelect.appendChild(node('option', pageLabel(manifest.pages[n - 1]), { value: String(n) }));
      var start = era.from, key = bookmarkKey();
      if(rawHooks&&Number.isInteger(rawHooks.initialPage)&&rawHooks.initialPage>=era.from&&rawHooks.initialPage<=era.to){start=rawHooks.initialPage;resume=false;rawHooks=Object.assign({},rawHooks,{initialPage:null});}
      if (resume && key && storage) try { var saved = JSON.parse(storage.getItem(key)); if (saved && Number.isInteger(saved.pdfPage) && saved.pdfPage >= era.from && saved.pdfPage <= era.to) start = saved.pdfPage; } catch (_) {}
      return loadPage(start);
    }
    function build() {
      host.replaceChildren(); host.classList.add('private-textbook');
      if(!rawHooks.compact){host.appendChild(node('h2','내 교재로 학습하기'));host.appendChild(node('p','책의 순서·표·그림 배치를 그대로 따라가요. 구간별로 확대해서 읽고 원본 전체 페이지와 비교할 수 있어요.',{'class':'textbook-lead'}));}
      var controls = node('div', '', { 'class': 'textbook-controls' });
      var e = select('시대·부록', erasFor(sourceRevision).map(function (v) { return [v.id, v.title]; }), function () { if (navigation) navigation(sourceSelect.value); else setEra(sourceSelect.value, true); }); sourceSelect = e.select; controls.appendChild(e.wrap);
      var p = select('페이지', [], function () { loadPage(Number(pageSelect.value)); }); pageSelect = p.select; controls.appendChild(p.wrap);
      var m = select('보기', [['regions', '구간별 읽기'], ['page', '원본 전체 페이지']], function () { mode = m.select.value; renderPage(); }); m.select.value=mode;controls.appendChild(m.wrap);
      var z = select('글자 크기', [['readable', '읽기 좋은 크기'], ['large', '더 크게'], ['fit', '화면에 맞춤']], function () { zoom = z.select.value; renderPage(); }); z.select.value=zoom;controls.appendChild(z.wrap);
      var c = select('강조', [['blue', '진한 파랑 + 원문 굵기'], ['original', '원본 색상·굵기']], function () { enhanced = c.select.value === 'blue'; loadPage(pageNo); }); c.select.value=enhanced?'blue':'original';controls.appendChild(c.wrap);
      var rg = select('구간 이동', [], function () { var el = host.querySelector('#textbook-region-' + regionSelect.value); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }); regionSelect = rg.select; controls.appendChild(rg.wrap);
      host.appendChild(controls);
      status = node('p', '', { role: 'status', 'aria-live': 'polite', 'class': 'textbook-status' }); host.appendChild(status);
      host.appendChild(node('p', rawHooks.compact?'원문 그대로 보기 · 글자가 작으면 글자 크기를 바꾸고 안쪽을 좌우로 이동하세요.':'표가 넓으면 안쪽을 좌우로 움직여 읽으세요. 열을 바꾸거나 내용을 요약하지 않아요. 자동으로 나눈 구간은 검수 중이며, 원본 전체 페이지가 기준이에요.', { 'class': 'textbook-help' }));
      viewport = node('div', '', { 'class': 'textbook-pages' }); host.appendChild(viewport);
      var nav = node('nav', '', { 'class': 'textbook-pagination', 'aria-label': '교재 페이지 이동' });
      var prev = button('← 이전 쪽', function () { loadPage(pageNo - 1); }); prev.setAttribute('data-previous', ''); nav.appendChild(prev);
      nav.appendChild(button('다시 불러오기', function () { loadPage(pageNo); }));
      var next = button('다음 쪽 →', function () { loadPage(pageNo + 1); }); next.setAttribute('data-next', ''); nav.appendChild(next); host.appendChild(nav);
      host.appendChild(node('p', '회원 교재는 서버에서 로그인 세션을 확인한 뒤 불러와요. 이 기기에는 읽던 쪽 번호만 저장해요.', { 'class': 'textbook-help' }));
    }
    function mount(el, id, callbacks) {
      stop(); rawHooks=callbacks||{};sourceRevision=rawHooks.sourceRevision==null?null:rawHooks.sourceRevision;var info=sourceInfo(sourceRevision);expectedRevision=info&&info.sha256;navigation=rawHooks.onEraChange||null;if(!el)return Promise.resolve();host=el;session=identity();era=eraFor(id,sourceRevision);if(!era){host.textContent='알 수 없는 교재 판본입니다.';return Promise.resolve();} enhanced=rawHooks.enhanced!==false;mode=rawHooks.initialMode==='page'?'page':'regions';zoom=['fit','large','readable'].indexOf(rawHooks.initialZoom)>=0?rawHooks.initialZoom:'readable';
      if(sourceRevision!=null&&!revisionRoutesReady(doc,era.id)){host.appendChild(node('p','선택한 판본은 서버 연결 검수가 끝난 뒤 열립니다. 기존 교재는 계속 이용할 수 있어요.',{role:'status'}));if(typeof rawHooks.onSourceChange==='function')host.appendChild(button('기존 79회 교재 열기',function(){rawHooks.onSourceChange(null);}));return Promise.resolve();}
      var g = generation, r = ++request;
      status = node('p', '', { role: 'status' }); host.appendChild(status);
      if (!session) { message('회원 교재는 로그인한 뒤 볼 수 있어요.'); host.appendChild(node('a', '로그인 화면으로', { href: '#account' })); }
      else message('회원 교재 접근 권한을 확인하는 중…');
      if (api && api.onChange) unsubscribe = api.onChange(function () { if (host && session !== identity()) mount(host, era.id, Object.assign({},rawHooks,{onEraChange:navigation})); });
      if (!session || !api || !api.textbookManifest) return Promise.resolve();
      return api.textbookManifest(sourceRevision).then(function (m) { if (!valid(g, r)) return; if (!validManifest(m, expectedRevision)) throw new Error('invalid_manifest'); manifest = m; build(); return setEra(era.id, true); }).catch(function (e) { if (valid(g, r)) { message(errorText(e)); host.appendChild(button('다시 시도', function () { mount(host, era.id, Object.assign({},rawHooks,{onEraChange:navigation})); })); } });
    }
    return { mount: mount, stop: stop };
  }
  var out = { create:create, eras:eras, erasFor:erasFor, eraFor:eraFor, sourceInfo:sourceInfo, revisionRoutesReady:revisionRoutesReady, reviewedRevisionRelease:REVIEWED_REVISION_RELEASE, revisions:[{sha256:OLD_SOURCE,edition:'79회 대비',totalPdfPages:144},{sha256:NEW_SOURCE,edition:'81회 대비',totalPdfPages:147}], validManifest:validManifest, errorText:errorText };
  if (typeof module !== 'undefined' && module.exports) module.exports = out;
  if (root.document) { var reader = create(); out.mount = reader.mount; out.stop = reader.stop; root.HanqPrivateTextbook = out; }
})(typeof window !== 'undefined' ? window : globalThis);
