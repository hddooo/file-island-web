/* HanQ 웹툰 읽음 표시 — 실제로 화면에 보인 컷만 세는 핵심 모듈(CommonJS로도 불러 검사할 수 있음)
 *
 *  window.HanqRead / require('./media/read-progress.js')
 *
 *  - 흐름(flow) = 앱의 흐름 바로 가기 목록(HANQ_FLOW 또는 강의 노트 parts)의 id. 웹툰 문서에서 그 id를 가진 흐름 머리 뒤에
 *    문서 순서대로 나오는 .scene 컷이 그 흐름의 컷이다(고정 개수를 지어내지 않고 실제 문서에서 셈).
 *  - 컷 키 = 컷의 id(없거나 겹치면 흐름·순서·제목으로 만든 키). 컷 서명(sig) = 키 + 제목 + 그림 설명(img 주소, 또는 SVG의 viewBox ·
 *    image 주소·자리·크기·맞춤). 화면 폭·픽셀·표시 글자는 넣지 않아 앱 안·혼자 연 웹툰·여러 폭에서 같다. 내용이 바뀌면 서명이 바뀌어
 *    예전 ‘봤음’ 기록을 새 컷에 옮기지 않는다(옛 기록은 지우지 않고 그대로 둠).
 *  - 읽음 = 흐름 안 서로 다른 컷 중 ceil(전체/2)개 이상을 실제로 봄. 장(시대) 전체는 장의 서로 다른 컷 ceil(전체/2)개 이상.
 *  - ‘봤음’ = 그림이 실제로 불러와져 풀린(decode) 뒤, 맨 위 화면에 의미 있게(CSS로 숨지 않고) 보이는 상태가 약 0.7초 이어짐.
 *    앱의 펼친 iframe은 장 전체 높이라 iframe 안의 화면 기준으로 재면 모든 컷이 보인다고 잘못 나오므로, 늘 바깥 창 기준으로 잰다.
 *    혼자 연 웹툰(새 탭)은 그 창이 맨 위 창일 때만 그 창 화면으로 잰다(attachStandalone).
 *  - 기록은 학습 기록 저장소(HanqProgress)의 진행 기록 'read-<era>-<hash>' 하나에 컷 하나(바뀌지 않음, 여러 탭이 덮어쓰지 않음).
 *    장의 컷 목록(manifest)은 'readman-<era>'에 둔다(목차의 표시용). 더 새 형식(schema)·깨진 기록은 읽지도 덮어쓰지도 않는다.
 *  - 읽음은 점수·순위·채점·결제와 관계없다. 저장소·시계를 손으로 고치는 것을 막는 보안 장치가 아니다. */
(function (root) {
  'use strict';
  var SCHEMA = 1, DWELL_MS = 700, SEEN_PREFIX = 'read-', MAN_PREFIX = 'readman-', SUBJECT = 'history', RETRY_MS = 3000;
  var ART_WRAP = '.art,.artwork,.c-art,.m-art,.p-art,.gj-art,.n-art,.s-art';
  var SVG_ATTRS = ['x', 'y', 'width', 'height', 'preserveAspectRatio', 'transform', 'clip-path'];

  function hash32(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ('0000000' + (h >>> 0).toString(16)).slice(-8); }
  function threshold(n) { return Math.ceil(n / 2); }
  function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function normSrc(s) { return clean(s).replace(/^(\.\/)+/, ''); }
  function isObj(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
  function str(x) { return typeof x === 'string' && x.length > 0 && x.length <= 200; }
  var ERA = /^[a-z][a-z0-9-]{0,30}$/;

  /* entries: 문서 순서의 [{type:'flow', id} | {type:'scene', id, heading, art}] → 장 manifest (+ 문서 순서의 컷) */
  function buildManifest(era, flows, entries) { return build(era, flows, entries).man; }
  function build(era, flows, entries) {
    var out = { schema: SCHEMA, subject: SUBJECT, era: era, flows: [], pre: [] }, byId = Object.create(null), cur = null, used = Object.create(null), ord = Object.create(null), docOrder = [];
    (flows || []).forEach(function (f) { if (!f || !str(f.id) || byId[f.id]) return; var o = { id: f.id, name: clean(f.name), scenes: [] }; out.flows.push(o); byId[f.id] = o; });
    (entries || []).forEach(function (e) {
      if (!e) return;
      if (e.type === 'flow') { if (byId[e.id]) cur = byId[e.id]; return; }
      var fid = cur ? cur.id : '_pre', bucket = cur ? cur.scenes : out.pre;
      ord[fid] = (ord[fid] || 0) + 1;
      var k = str(e.id) && !used[e.id] ? e.id : null;
      if (!k) { k = 'x' + hash32(fid + '|' + ord[fid] + '|' + clean(e.heading)); while (used[k]) k += 'd'; }
      used[k] = 1;
      var c = { key: k, sig: hash32(k + '|' + clean(e.heading) + '|' + clean(e.art)), flowId: fid, hasArt: !!e.art };
      bucket.push(c); docOrder.push(c);
    });
    out.flows.forEach(function (f) { f.total = f.scenes.length; f.threshold = threshold(f.total); });
    var total = out.flows.reduce(function (s, f) { return s + f.total; }, 0) + out.pre.length;
    out.chapter = { total: total, threshold: threshold(total) };
    out.v = hash32(JSON.stringify([out.flows.map(function (f) { return [f.id, f.scenes.map(function (s) { return s.key + '|' + s.sig; })]; }), out.pre.map(function (s) { return s.key + '|' + s.sig; })]));
    return { man: out, docOrder: docOrder };
  }

  /* 컷의 그림: 그림 틀(.art·.artwork·.c-art·.m-art·.p-art·.gj-art·.n-art·.s-art) 안의 img, 없으면 그 안의 SVG 외부 image.
     틀이 없으면 컷 안에서 찾는다. desc = 서명에 넣는 그림 설명(속성 값만, 폭·픽셀 없음) */
  function artOf(scene) {
    var wrap = scene.querySelector(ART_WRAP), scope = wrap || scene;
    var img = scope.querySelector('img');
    if (img) { var src = normSrc(img.getAttribute('src')); return { el: img, wrap: wrap, kind: 'img', src: src, desc: 'img|' + src }; }
    var im = scope.querySelector('svg image');
    if (im) {
      var href = normSrc(im.getAttribute('href') || im.getAttribute('xlink:href') || (im.getAttributeNS ? im.getAttributeNS('http://www.w3.org/1999/xlink', 'href') : '') || '');
      var svg = im.closest ? im.closest('svg') : null;
      var desc = 'svg|' + clean(svg ? svg.getAttribute('viewBox') : '') + '|' + href + '|' + SVG_ATTRS.map(function (a) { return clean(im.getAttribute(a)); }).join(',');
      return { el: svg || im, wrap: wrap, kind: 'svg-image', src: href, abs: absUrl(href, im.ownerDocument), image: im, desc: desc };
    }
    return wrap ? bgArt(wrap) : null;
  }
  function absUrl(src, doc) { try { return new URL(src, doc && doc.baseURI).href; } catch (e) { return ''; } }
  /* 문서 주소 기준의 상대 주소로(앱 안·혼자 연 창·검사 환경에서 같게) */
  function relToDoc(url, doc) {
    var u = clean(url), base = String((doc && doc.baseURI) || '').split(/[?#]/)[0], dir = base.replace(/[^\/]*$/, '');
    if (dir && /^[a-z]+:\/\//i.test(dir) && u.indexOf(dir) === 0) u = u.slice(dir.length);
    return normSrc(u);
  }
  /* CSS 배경 그림 컷(예: 독도와 간도의 .art.i-art — 그림판 한 장을 background-size·위치로 잘라 씀).
     서명에는 고정된 값만: 배경 주소(문서 기준 상대), 계산된 background-size, 그 요소의 인라인 사용자 속성(--x 같은 자르기 값)과
     인라인 background 선언. 화면 폭에 따라 픽셀로 바뀔 수 있는 계산된 background-position은 넣지 않는다. */
  function bgArt(el) {
    var doc = el.ownerDocument, win = doc && doc.defaultView;
    if (!win || typeof win.getComputedStyle !== 'function') return null;
    var cs = win.getComputedStyle(el), bi = (cs && (cs.backgroundImage || (cs.getPropertyValue && cs.getPropertyValue('background-image')))) || '';
    var m = /url\(\s*(['"]?)(.*?)\1\s*\)/.exec(bi); if (!m || !m[2]) return null;
    var abs = absUrl(m[2], doc), rel = relToDoc(abs || m[2], doc);
    var decl = String(el.getAttribute('style') || '').split(';').map(function (d) { var i = d.indexOf(':'); return i < 0 ? null : [clean(d.slice(0, i)).toLowerCase(), clean(d.slice(i + 1))]; })
      .filter(function (d) { return d && d[0] && (d[0].indexOf('--') === 0 || d[0].indexOf('background') === 0); }).map(function (d) { return d[0] + ':' + d[1]; }).sort();
    var size = clean((cs && (cs.backgroundSize || (cs.getPropertyValue && cs.getPropertyValue('background-size')))) || '');
    return { el: el, wrap: el, kind: 'bg', src: rel, abs: abs, desc: 'bg|' + rel + '|' + size + '|' + decl.join(';') };
  }
  function extractEntries(doc, flowIds) {
    var list = [];
    (flowIds || []).forEach(function (id) { var el = doc.getElementById(id); if (el) list.push({ type: 'flow', id: id, el: el }); });
    Array.prototype.forEach.call(doc.querySelectorAll('.scene'), function (el) {
      var h = el.querySelector('h2, h3'), a = artOf(el);
      list.push({ type: 'scene', id: el.id || '', heading: h ? h.textContent : '', art: a ? a.desc : '', el: el, artInfo: a });
    });
    list.sort(function (x, y) { if (x.el === y.el) return 0; var p = x.el.compareDocumentPosition(y.el); return p & 4 ? -1 : p & 2 ? 1 : 0; });
    return list;
  }

  /* 맨 위 화면 기준 보이는 정도. art·frame·view는 모두 같은 좌표 {top,left,bottom,right}.
     보임 = 가로는 그림 폭의 절반 이상, 세로는 그림 높이의 60% 또는 (그림이 화면보다 크면) 보이는 화면 높이의 절반 이상 */
  function visibleArea(art, frame, view) {
    var top = Math.max(art.top, frame.top, view.top), bottom = Math.min(art.bottom, frame.bottom, view.bottom);
    var left = Math.max(art.left, frame.left, view.left), right = Math.min(art.right, frame.right, view.right);
    var h = Math.max(0, bottom - top), w = Math.max(0, right - left), ah = art.bottom - art.top, aw = art.right - art.left, vh = Math.max(0, view.bottom - view.top);
    var ok = ah > 0 && aw > 0 && vh > 0 && w >= aw * 0.5 && h >= Math.min(ah * 0.6, vh * 0.5) && h >= Math.min(48, ah);
    return { h: h, w: w, ok: ok };
  }
  /* CSS로 숨었는지(자기·조상의 display:none · visibility:hidden · opacity 0). 사각형이 남아 있어도 숨은 것은 보이지 않음 */
  function cssVisible(el) {
    if (!el || !el.ownerDocument || !el.ownerDocument.defaultView) return true; // (검사용 가짜 요소)
    if (typeof el.checkVisibility === 'function') { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, opacityProperty: true, visibilityProperty: true }); } catch (e) {} }
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var cs = n.ownerDocument.defaultView.getComputedStyle(n);
      if (!cs || cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse' || Number(cs.opacity) === 0) return false;
    }
    return true;
  }

  /* 이어서 보인 시간: 보이는 키 목록을 계속 넣으면, dwell 이상 끊기지 않고 보인 키를 돌려줌(돌려준 키는 다시 돌려주지 않음) */
  function createDwell(ms) {
    var since = Object.create(null), done = Object.create(null), need = ms || DWELL_MS;
    return {
      step: function (keys, t) {
        var now = Object.create(null), out = [];
        keys.forEach(function (k) { now[k] = 1; if (done[k]) return; if (since[k] == null) since[k] = t; if (t - since[k] >= need) { out.push(k); done[k] = 1; delete since[k]; } });
        Object.keys(since).forEach(function (k) { if (!now[k]) delete since[k]; });
        return out;
      },
      reset: function () { since = Object.create(null); },
      pending: function () { return Object.keys(since).length; }
    };
  }

  /* ---- 저장(학습 기록 저장소의 진행 기록 사용) ---- */
  function seenView(era, key, sig) { return SEEN_PREFIX + era + '-' + hash32(key + '|' + sig); }
  function recordSeen(store, era, cut, t) {
    if (!store || !ERA.test(era) || !cut || !str(cut.key) || !str(cut.sig) || !Number.isFinite(t)) return { ok: false };
    var rec = { schema: SCHEMA, kind: 'read-cut', subject: SUBJECT, era: era, key: cut.key, sig: cut.sig, flowId: cut.flowId || null, at: t };
    return store.updateProgress(seenView(era, cut.key, cut.sig), function (prev) { return prev ? null : rec; }); // 한 번 쓴 기록(더 새 형식 포함)은 바꾸지 않음
  }
  function validSeen(r, era, view) {
    return isObj(r) && r.schema === SCHEMA && r.kind === 'read-cut' && r.subject === SUBJECT && r.era === era && str(r.key) && str(r.sig) && view === seenView(era, r.key, r.sig) && Number.isFinite(r.at);
  }
  function loadSeen(store, era) {
    var out = Object.create(null);
    if (!store || !ERA.test(era) || typeof store.progressViews !== 'function') return out;
    store.progressViews(SEEN_PREFIX + era + '-').forEach(function (v) { var r = store.loadProgress(v); if (validSeen(r, era, v)) out[r.key + '|' + r.sig] = r.at; }); // 더 새 형식·깨진 기록은 세지 않고 그대로 둠
    return out;
  }
  /* 저장된 manifest가 이 형식(schema 1)이고 앞뒤가 맞는지: 흐름 id·컷 키가 겹치지 않고(흐름 사이·pre 포함), 키·서명이 비지 않음 */
  function validManifest(m, era) {
    if (!isObj(m) || m.schema !== SCHEMA || m.subject !== SUBJECT || m.era !== era || !str(m.v) || !Array.isArray(m.flows) || !Array.isArray(m.pre)) return false;
    var fids = Object.create(null), keys = Object.create(null), okCut = function (s) { if (!isObj(s) || !str(s.key) || !str(s.sig) || keys[s.key]) return false; keys[s.key] = 1; return true; };
    for (var i = 0; i < m.flows.length; i++) { var f = m.flows[i]; if (!isObj(f) || !str(f.id) || fids[f.id] || !Array.isArray(f.scenes)) return false; fids[f.id] = 1; if (!f.scenes.every(okCut)) return false; }
    return m.pre.every(okCut);
  }
  function slimManifest(man) {
    return { schema: SCHEMA, subject: SUBJECT, era: man.era, v: man.v, flows: man.flows.map(function (f) { return { id: f.id, name: f.name, scenes: f.scenes.map(function (s) { return { key: s.key, sig: s.sig }; }) }; }), pre: man.pre.map(function (s) { return { key: s.key, sig: s.sig }; }) };
  }
  /* 실제 내용이 바뀌었을 때만 새로 씀. 저장된 것이 더 새 형식이거나 깨졌으면 덮어쓰지 않음(지우지 않음) */
  function saveManifest(store, man) {
    if (!store || !man || !ERA.test(man.era)) return { ok: false };
    var slim = slimManifest(man);
    if (!validManifest(slim, man.era)) return { ok: false };
    return store.updateProgress(MAN_PREFIX + man.era, function (prev) { if (prev == null) return slim; if (!validManifest(prev, man.era)) return null; return prev.v === slim.v ? null : slim; });
  }
  function loadManifest(store, era) {
    if (!store || !ERA.test(era)) return null;
    var m = store.loadProgress(MAN_PREFIX + era);
    if (!validManifest(m, era)) return null;
    m.flows.forEach(function (f) { f.total = f.scenes.length; f.threshold = threshold(f.total); });
    var total = m.flows.reduce(function (s, f) { return s + f.total; }, 0) + m.pre.length;
    m.chapter = { total: total, threshold: threshold(total) };
    return m;
  }
  /* 읽음 계산: 흐름은 자기 컷의 ceil(n/2), 장은 장 전체 서로 다른 컷의 ceil(N/2) */
  function summarize(man, seen) {
    if (!man || !Array.isArray(man.flows)) return null;
    seen = seen || {};
    var has = function (s) { return seen[s.key + '|' + s.sig] != null; }, all = [], keys = Object.create(null), add = function (s) { if (s && !keys[s.key]) { keys[s.key] = 1; all.push(s); } };
    var flows = man.flows.map(function (f) { var sc = f.scenes || [], n = sc.filter(has).length; sc.forEach(add); return { id: f.id, name: f.name, total: sc.length, threshold: threshold(sc.length), seen: n, read: sc.length > 0 && n >= threshold(sc.length) }; });
    (man.pre || []).forEach(add);
    var cs = all.filter(has).length;
    return { era: man.era, v: man.v, flows: flows, chapter: { total: all.length, threshold: threshold(all.length), seen: cs, read: all.length > 0 && cs >= threshold(all.length) } };
  }

  /* ---- 지켜보기 ----
     앱: attachFrame — 같은 출처 iframe 문서를 바깥 창에서 직접 잰다(postMessage를 쓰지 않아 다른 창이 위조할 수 없음).
     혼자 연 웹툰: attachStandalone — 그 창이 맨 위 창일 때만, 그 창의 화면으로 잰다.
     o = { win, frame | doc, era, flows:[{id,name}], store, active(), onChange(summary), now, dwellMs, extract?, obstructSelector? } */
  function attachFrame(o) {
    var w = o.win, frame = o.frame || null, standalone = !frame, now = o.now || function () { return Date.now(); }, extract = o.extract || extractEntries;
    var active = typeof o.active === 'function' ? o.active : function () { return true; };
    var stopped = false, man = null, cuts = [], seen = loadSeen(o.store, o.era), dwell = createDwell(o.dwellMs || DWELL_MS);
    var decoded = typeof WeakSet === 'function' ? new WeakSet() : null, asked = typeof Map === 'function' ? new Map() : null, urls = Object.create(null), raf = 0, timer = 0, docScrollOn = null;
    function stop() {
      if (stopped) return; stopped = true;
      try { w.removeEventListener('scroll', schedule); w.removeEventListener('resize', schedule); w.removeEventListener('pagehide', stop); w.document.removeEventListener('visibilitychange', onVis); if (frame) frame.removeEventListener('load', onLoad); } catch (e) {}
      try { if (docScrollOn) docScrollOn.removeEventListener('scroll', schedule); } catch (e) {}
      if (timer) w.clearInterval(timer); if (raf && typeof w.cancelAnimationFrame === 'function') w.cancelAnimationFrame(raf); timer = 0; raf = 0;
    }
    function onVis() { dwell.reset(); schedule(); } // 숨었다 돌아오면 숨은 동안의 시간을 넣지 않도록 곧바로 처음부터
    function onLoad() { man = null; cuts = []; dwell.reset(); schedule(); }
    function schedule() { if (stopped || raf) return; var cb = function () { raf = 0; tick(); }; raf = typeof w.requestAnimationFrame === 'function' ? w.requestAnimationFrame(cb) : w.setTimeout(cb, 16); } // 창의 메서드로 불러야 함
    function docOf() { if (standalone) return o.doc; try { return frame.contentDocument; } catch (e) { return null; } }
    function ensureDoc() {
      var doc = docOf();
      if (!doc || doc.readyState === 'loading' || !doc.querySelector || !doc.querySelector('.scene')) return false;
      if (man) return true;
      var entries = extract(doc, (o.flows || []).map(function (f) { return f.id; })), b = build(o.era, o.flows, entries);
      man = b.man;
      cuts = entries.filter(function (e) { return e.type === 'scene'; }).map(function (e, i) { return { cut: b.docOrder[i], el: e.el, art: e.artInfo }; }); // 문서 순서의 컷 ↔ 그 컷의 키
      if (o.store) saveManifest(o.store, man);
      try { if (!standalone && doc.defaultView && doc.defaultView !== w) { docScrollOn = doc.defaultView; docScrollOn.addEventListener('scroll', schedule, { passive: true }); } } catch (e) {}
      if (o.onChange) o.onChange(summarize(man, seen));
      return true;
    }
    /* 그림이 실제로 불러와져 풀렸는지: img는 complete + 크기 + decode(), svg의 외부 image는 같은 주소를 따로 불러 decode.
       잠깐 실패해도 나중에 실제로 불러와지면 다시 확인(영구 거절하지 않음) */
    function artReady(c, t) {
      var a = c.art; if (!a) return true; // 그림 없는 글 컷
      if (a.kind === 'img') {
        var img = a.el; if (!img.complete || !img.naturalWidth) return false;
        if (!decoded || typeof img.decode !== 'function') return true;
        if (decoded.has(img)) return true;
        var at = asked.get(img);
        if (at == null || (at < 0 && t + at > RETRY_MS)) { // 처음이거나, 실패 뒤 잠시 지남
          asked.set(img, 0);
          img.decode().then(function () { decoded.add(img); schedule(); }, function () { if (img.complete && img.naturalWidth) decoded.add(img); else asked.set(img, -t); schedule(); });
        }
        return false;
      }
      if (!a.src && !a.abs) return false;
      // svg 외부 image·CSS 배경 그림: 같은 주소를 따로 불러 decode(불러오기 실패는 잠시 뒤 다시)
      var url = a.abs; if (!url || !/^[a-z]+:/i.test(url)) { try { url = new w.URL(a.src, ((a.image || a.el).ownerDocument || {}).baseURI).href; } catch (e) { return false; } }
      var st = urls[url];
      if (!st || (st.s === 'fail' && t - st.at > RETRY_MS)) {
        var rec = urls[url] = { s: 'pending', at: t }, im = new w.Image();
        im.onload = function () { var d = typeof im.decode === 'function' ? im.decode() : Promise.resolve(); d.then(function () { rec.s = 'ok'; schedule(); }, function () { rec.s = im.naturalWidth ? 'ok' : 'fail'; rec.at = now(); schedule(); }); };
        im.onerror = function () { rec.s = 'fail'; rec.at = now(); };
        im.src = url; return false;
      }
      return st.s === 'ok';
    }
    function obstructions() { // 위·아래에 붙은 고정·sticky 막대(화면 폭 절반 이상)가 가리는 부분
      var top = 0, bottom = w.innerHeight, sel = o.obstructSelector || (standalone ? 'nav, .p-nav, #progress' : '.mobile-nav, .topline, .steps, .rc-bar');
      Array.prototype.forEach.call(w.document.querySelectorAll(sel), function (el) {
        var cs = w.getComputedStyle ? w.getComputedStyle(el) : null; if (!cs || (cs.position !== 'fixed' && cs.position !== 'sticky') || cs.display === 'none' || cs.visibility === 'hidden') return;
        var r = el.getBoundingClientRect(); if (r.height <= 0 || (r.width != null && r.width < w.innerWidth * 0.5)) return;
        if (r.top <= 1 && r.bottom > top) top = Math.min(r.bottom, w.innerHeight);
        else if (r.bottom >= w.innerHeight - 1 && r.top < bottom) bottom = Math.max(r.top, 0);
      });
      return { top: top, bottom: Math.max(top, bottom), left: 0, right: w.innerWidth };
    }
    function tick() {
      if (stopped) return;
      if ((frame && !frame.isConnected) || !active()) { stop(); return; }
      if (w.document.visibilityState !== 'visible' || (frame && (!frame.getClientRects().length || !cssVisible(frame)))) { dwell.reset(); return; }
      if (!ensureDoc()) return;
      var ox = 0, oy = 0, inner;
      if (frame) { var fr = frame.getBoundingClientRect(); ox = fr.left + (frame.clientLeft || 0); oy = fr.top + (frame.clientTop || 0); inner = { top: oy, left: ox, bottom: oy + (frame.clientHeight || fr.height), right: ox + (frame.clientWidth || fr.width) }; }
      else inner = { top: 0, left: 0, bottom: w.innerHeight, right: w.innerWidth };
      var view = obstructions(), vis = [], t = now();
      cuts.forEach(function (c) {
        if (!c.cut || seen[c.cut.key + '|' + c.cut.sig] != null) return;
        var el = c.art ? c.art.el : c.el, r = el.getBoundingClientRect();
        if (!r || r.width <= 0 || r.height <= 0 || !cssVisible(el)) return;
        var art = { top: r.top + oy, left: r.left + ox, bottom: r.bottom + oy, right: r.right + ox };
        if (visibleArea(art, inner, view).ok && artReady(c, t)) vis.push(c.cut.key + '|' + c.cut.sig);
      });
      var passed = dwell.step(vis, t), byKey = Object.create(null);
      if (!passed.length) return;
      cuts.forEach(function (c) { if (c.cut) byKey[c.cut.key + '|' + c.cut.sig] = c.cut; });
      passed.forEach(function (k) { var c = byKey[k]; if (!c) return; recordSeen(o.store, o.era, c, t); seen[k] = t; });
      if (o.onChange) o.onChange(summarize(man, seen));
    }
    w.addEventListener('scroll', schedule, { passive: true }); w.addEventListener('resize', schedule); w.addEventListener('pagehide', stop); w.document.addEventListener('visibilitychange', onVis);
    if (frame) frame.addEventListener('load', onLoad);
    timer = w.setInterval(tick, 250);
    schedule();
    return {
      stop: stop, tick: tick,
      reloadSeen: function () { seen = loadSeen(o.store, o.era); if (man && o.onChange) o.onChange(summarize(man, seen)); },
      /* 읽기 전용 상태(디버그·검사용): 읽음을 강제로 바꾸는 함수는 없음 */
      debug: function () { return { era: o.era, mode: standalone ? 'standalone' : 'frame', stopped: stopped, manifest: man ? JSON.parse(JSON.stringify(man)) : null, summary: man ? summarize(man, seen) : null, pending: dwell.pending() }; }
    };
  }
  /* 혼자 연 웹툰: 맨 위 창이 아니면(앱 안 iframe 등) 시작하지 않는다 — 펼친 iframe의 큰 화면으로 세면 모든 컷이 보인다고 잘못 셈 */
  function attachStandalone(o) {
    var w = o.win;
    try { if (w.self !== w.top) return null; } catch (e) { return null; }
    return attachFrame({ win: w, doc: o.doc || w.document, era: o.era, flows: o.flows, store: o.store, onChange: o.onChange, now: o.now, dwellMs: o.dwellMs, extract: o.extract, obstructSelector: o.obstructSelector, active: o.active });
  }

  var api = { SCHEMA: SCHEMA, DWELL_MS: DWELL_MS, SEEN_PREFIX: SEEN_PREFIX, MAN_PREFIX: MAN_PREFIX, ART_WRAP: ART_WRAP, hash32: hash32, threshold: threshold, buildManifest: buildManifest, extractEntries: extractEntries, artOf: artOf,
    visibleArea: visibleArea, cssVisible: cssVisible, createDwell: createDwell, seenView: seenView, recordSeen: recordSeen, loadSeen: loadSeen, validManifest: validManifest, saveManifest: saveManifest, loadManifest: loadManifest,
    summarize: summarize, attachFrame: attachFrame, attachStandalone: attachStandalone };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined' && root === window) root.HanqRead = api;
})(typeof window !== 'undefined' ? window : globalThis);
