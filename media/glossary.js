/* 한국사 한눈에 · 용어 풀이 모듈 (의존성 없음)
 * - 데이터: window.HANQ_GLOSSARY (glossary-data.js)
 * - 처음 나온 곳 바로 아래에 짧은 뜻을 보여 주고, 눌러서(<details>) 자세한 설명·출처를 펼친다.
 * - 본문 텍스트는 고치지 않는다. 입력창·버튼·링크·이미지·스크립트 안의 글은 읽지도 않는다.
 */
(function(){
  'use strict';
  var SKIP={SCRIPT:1,STYLE:1,INPUT:1,TEXTAREA:1,SELECT:1,BUTTON:1,A:1,IMG:1,SVG:1,IFRAME:1,NOSCRIPT:1,SUMMARY:1};
  var entries=null;
  function list(){
    if(entries)return entries;
    var raw=Array.isArray(window.HANQ_GLOSSARY)?window.HANQ_GLOSSARY:[];
    entries=raw.filter(function(e){return e&&e.id&&e.term&&e.short&&Array.isArray(e.sources)&&e.sources.length&&e.sources.every(function(s){return /^https:\/\/(encykorea\.aks\.ac\.kr|contents\.history\.go\.kr)\//.test(s.url)||/^http:\/\/encykorea\.aks\.ac\.kr\//.test(s.url);});});
    return entries;
  }
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  /* 블록 안의 읽기용 글만 모은다(입력·버튼·링크·기존 풀이 제외) */
  function readableText(root){
    var out=[];
    (function walk(node){
      for(var n=node.firstChild;n;n=n.nextSibling){
        if(n.nodeType===3){out.push(n.nodeValue);continue;}
        if(n.nodeType!==1)continue;
        if(SKIP[n.nodeName.toUpperCase()])continue;
        if(n.hasAttribute('data-no-gloss')||n.classList.contains('gl-notes'))continue;
        walk(n);out.push(' ');
      }
    })(root);
    return out.join('');
  }
  function firstIndex(text,e){
    var t=text;
    (e.avoid||[]).forEach(function(a){t=t.split(a).join(new Array(a.length+1).join('\u0000'));});
    var best=-1;
    (e.match||[e.term]).forEach(function(m){var i=t.indexOf(m);if(i>=0&&(best<0||i<best))best=i;});
    return best;
  }
  /* text에서 아직 설명하지 않은 용어를 등장 순서대로 찾는다 */
  function find(text,seen,filter){
    var hits=[];
    list().forEach(function(e){
      if(seen&&seen[e.id])return;
      if(filter&&!filter(e))return;
      var i=firstIndex(text,e);if(i>=0)hits.push({e:e,i:i});
    });
    hits.sort(function(a,b){return a.i-b.i;});
    return hits.map(function(h){if(seen)seen[h.e.id]=true;return h.e;});
  }
  function render(found,ctx){
    var box=document.createElement('div');
    box.className='gl-notes';box.setAttribute('data-gl-notes','');
    box.setAttribute('role','group');box.setAttribute('aria-label','용어 풀이');
    box.innerHTML='<p class="gl-head" aria-hidden="true">용어 풀이</p>'+found.map(function(e){
      var src=e.sources.map(function(s){return '<a href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.title)+' ↗</a>';}).join('<br>');
      return '<details class="gl-item" id="gl-'+esc(ctx)+'-'+esc(e.id)+'" data-term="'+esc(e.id)+'"><summary><b class="gl-term">'+esc(e.term)+'</b><span class="gl-short">'+esc(e.short)+'</span><span class="gl-more-hint" aria-hidden="true">자세히</span></summary><div class="gl-more"><p>'+esc(e.detail||e.short)+'</p><p class="gl-src">출처 · '+src+'</p></div></details>';
    }).join('');
    return box;
  }
  var styled=false;
  function style(){
    if(styled||document.getElementById('hanq-glossary-style')){styled=true;return;}
    var st=document.createElement('style');st.id='hanq-glossary-style';
    st.textContent='.gl-notes{margin:12px 16px 4px;padding:8px 10px;border:1px solid #e3ddd0;border-radius:12px;background:#fbf8f1;color:#2b3443;font:inherit;text-align:left;word-break:keep-all;overflow-wrap:anywhere}'+
      '.gl-head{margin:2px 2px 4px;font-size:11px;font-weight:900;letter-spacing:.06em;color:#8a5a2b}'+
      '.gl-item{border-top:1px dashed #e3ddd0}.gl-item:first-of-type{border-top:0}'+
      '.gl-item summary{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;min-height:44px;padding:9px 2px;cursor:pointer;list-style:none;font-size:14px;line-height:1.45}'+
      '.gl-item summary::-webkit-details-marker{display:none}'+
      '.gl-item summary:focus-visible{outline:3px solid #294d8766;outline-offset:2px;border-radius:8px}'+
      '.gl-term{color:#a12d34;font-weight:900}.gl-short{flex:1 1 12em;color:#334155;font-weight:650}'+
      '.gl-more-hint{font-size:11px;font-weight:800;color:#294d87;white-space:nowrap}.gl-more-hint:after{content:" ▾"}.gl-item[open] .gl-more-hint:after{content:" ▴"}'+
      '.gl-more{padding:0 2px 10px;font-size:13.5px;line-height:1.65;color:#3b4555}.gl-more p{margin:0 0 6px}'+
      '.gl-src{font-size:12px;color:#5b6576}.gl-src a{color:#294d87;font-weight:750;text-decoration:underline;display:inline-block;min-height:28px;padding:4px 0}'+
      '@media(max-width:480px){.gl-notes{margin:10px 12px 2px}.gl-item summary{font-size:13.5px}}';
    (document.head||document.documentElement).appendChild(st);styled=true;
  }
  /* Escape: 열린 풀이 안에 포커스가 있으면 닫고 summary로 돌아간다 */
  document.addEventListener('keydown',function(ev){
    if(ev.key!=='Escape')return;
    var d=ev.target&&ev.target.closest&&ev.target.closest('.gl-item[open]');
    if(!d)return;d.open=false;var s=d.querySelector('summary');if(s)s.focus();
  });
  /* blocks(NodeList/배열)의 각 블록에서 처음 나온 용어 풀이를 블록 끝(또는 after(block) 뒤)에 붙인다 */
  function annotate(blocks,opt){
    opt=opt||{};
    if(!list().length)return 0;
    style();
    var seen=opt.seen||{},count=0,ctx=opt.ctx||'doc';
    Array.prototype.forEach.call(blocks,function(block){
      if(!block||block.querySelector(':scope > .gl-notes'))return;
      var found=find(readableText(block),seen,opt.filter);
      if(!found.length)return;
      var box=render(found,ctx);
      var anchor=opt.after?opt.after(block):null;
      if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(box,anchor.nextSibling);else block.appendChild(box);
      count+=found.length;
    });
    return count;
  }
  window.HanqGlossary={entries:list,find:function(text,filter){return find(text,{},filter);},annotate:annotate,readableText:readableText};
  /* 웹툰 페이지: <script data-auto="comic">이면 장면마다 처음 나온 용어를 장면 끝에 붙인다 */
  var me=document.currentScript;
  if(me&&me.getAttribute('data-auto')==='comic'){
    var run=function(){annotate(document.querySelectorAll('.scene'),{ctx:'c'});};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  }
})();

/* Private semantic textbook: reuse the checked glossary without touching source
 * strings, emphasis nodes, question/answer controls, progress, or the renderer.
 * Annotation runs only inside native reading lines; split emphasis remains intact.
 */
(function () {
  'use strict';
  var parts = new WeakMap(), visited = new WeakSet(), active = null, panel = null;
  var hideTimer = null, queued = false, restoring = false;
  var PANEL_ID = 'hanq-keyword-popover';
  var EXCLUDE = 'a,button,input,textarea,select,summary,script,style,[contenteditable]:not([contenteditable="false"]),[data-no-gloss],[hidden],.textbook-semantic-exercises,.textbook-semantic-prompt,.textbook-source-quiz,[data-source-empty-response]';

  function partFor(target) {
    var element = target && (target.nodeType === 1 ? target : target.parentElement);
    var part = element && element.closest('[data-textbook-keyword]');
    return part && parts.has(part) ? part : null;
  }
  function inside(group, target) {
    var part = partFor(target);
    return !!(part && parts.get(part) === group);
  }
  function cancelHide() { clearTimeout(hideTimer); hideTimer = null; }
  function close(restore) {
    cancelHide();
    if (!active) return;
    var primary = active.group.primary;
    active = null;
    primary.setAttribute('aria-expanded', 'false');
    primary.removeAttribute('aria-describedby');
    if (panel.hidePopover && panel.matches(':popover-open')) panel.hidePopover();
    panel.hidden = true;
    if (restore && primary.isConnected) {
      restoring = true;
      primary.focus({ preventScroll: true });
      restoring = false;
    }
  }
  function later() {
    cancelHide();
    hideTimer = setTimeout(function () {
      if (active && !active.pinned && !inside(active.group, document.activeElement) && !panel.contains(document.activeElement)) close(false);
    }, 180);
  }
  function makePanel() {
    if (panel) return panel;
    var style = document.createElement('style');
    style.id = 'hanq-keyword-style';
    style.textContent = '.textbook-semantic [data-textbook-keyword]{cursor:help;text-decoration:underline dotted;text-underline-offset:.2em;touch-action:manipulation}' +
      '.textbook-semantic [data-textbook-keyword][role=button]:focus-visible{outline:2px solid currentColor;outline-offset:3px;border-radius:2px}' +
      '#'+PANEL_ID+'{position:fixed;inset:auto;margin:0;box-sizing:border-box;width:330px;max-width:calc(100vw - 16px);max-height:calc(100dvh - 16px);overflow:auto;overscroll-behavior:contain;z-index:2147483000;padding:12px 14px;border:1px solid #7c9d87;border-radius:12px;background:#102019;color:#edf7ef;font:15px/1.6 "Apple SD Gothic Neo","Noto Sans KR",Arial,sans-serif;text-align:left;letter-spacing:normal;word-break:keep-all;overflow-wrap:anywhere;box-shadow:0 6px 24px #0006}' +
      '#'+PANEL_ID+'[hidden]{display:none!important}' +
      '#'+PANEL_ID+',#'+PANEL_ID+' *{font-family:"Apple SD Gothic Neo","Noto Sans KR",Arial,sans-serif!important;letter-spacing:normal!important}' +
      '#'+PANEL_ID+' .tbkw-header{display:flex;align-items:center;gap:10px}' +
      '#'+PANEL_ID+' .tbkw-title{flex:1;margin:0;color:#a8f0bc;font:700 16px/1.5 "Apple SD Gothic Neo","Noto Sans KR",Arial,sans-serif}' +
      '#'+PANEL_ID+' .tbkw-close{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;flex:0 0 44px;min-width:44px;min-height:44px;margin:-6px -8px -6px 0;padding:4px;border:0;border-radius:8px;background:transparent;color:#edf7ef;font:24px/1 Arial;cursor:pointer;touch-action:manipulation}' +
      '#'+PANEL_ID+' p{margin:8px 0;color:inherit;font:inherit}' +
      '#'+PANEL_ID+' summary{display:flex;align-items:center;min-height:44px;cursor:pointer;color:#b2dec0;font:inherit}' +
      '#'+PANEL_ID+' a{display:block;min-height:44px;box-sizing:border-box;padding:9px 0;color:#a8d8ff;font:13px/1.6 "Apple SD Gothic Neo","Noto Sans KR",Arial,sans-serif;text-decoration:underline}' +
      '#'+PANEL_ID+' :is(button,a,summary):focus-visible{outline:2px solid #a8d8ff;outline-offset:2px}';
    document.head.appendChild(style);
    panel = document.createElement('section');
    panel.id = PANEL_ID; panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', PANEL_ID+'-title');
    if (typeof panel.showPopover === 'function') panel.setAttribute('popover', 'manual');
    panel.addEventListener('pointerenter', cancelHide);
    panel.addEventListener('pointerleave', later);
    document.body.appendChild(panel);
    return panel;
  }
  function place(anchor) {
    var box = anchor.getBoundingClientRect(), vv = window.visualViewport;
    var left = vv ? vv.offsetLeft : 0, top = vv ? vv.offsetTop : 0;
    var width = vv ? vv.width : innerWidth, height = vv ? vv.height : innerHeight;
    panel.style.maxWidth = Math.max(0, width - 16)+'px';
    panel.style.maxHeight = Math.max(0, height - 16)+'px';
    var rect = panel.getBoundingClientRect();
    var x = Math.max(left+8, Math.min(box.left, left+width-rect.width-8));
    var y = box.bottom+8;
    if (y+rect.height > top+height-8) y = box.top-rect.height-8;
    y = Math.max(top+8, Math.min(y, top+height-rect.height-8));
    panel.style.left = x+'px'; panel.style.top = y+'px';
  }
  function follow() {
    if (!active) return;
    var rect=active.anchor.getBoundingClientRect(), vv=window.visualViewport;
    var top=vv?vv.offsetTop:0, left=vv?vv.offsetLeft:0;
    var height=vv?vv.height:innerHeight, width=vv?vv.width:innerWidth;
    if (!active.anchor.isConnected || rect.bottom<=top || rect.top>=top+height || rect.right<=left || rect.left>=left+width) close(false);
    else place(active.anchor);
  }
  function show(part, pinned) {
    var group = parts.get(part);
    if (!group || !group.primary.isConnected || group.primary.closest('[hidden]')) return;
    cancelHide();
    if (active && active.group === group) {
      if (pinned) active.pinned = true;
      return;
    }
    close(false); makePanel();
    panel.replaceChildren();
    var header = document.createElement('div'); header.className = 'tbkw-header';
    var title = document.createElement('h2'); title.className = 'tbkw-title'; title.id = PANEL_ID+'-title'; title.textContent = group.entry.term;
    var dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.className = 'tbkw-close'; dismiss.textContent = '×'; dismiss.setAttribute('aria-label', '용어 설명 닫기');
    dismiss.addEventListener('click', function () { close(true); });
    header.append(title, dismiss);
    var brief = document.createElement('p'); brief.id = PANEL_ID+'-brief'; brief.textContent = group.entry.brief || group.entry.short;
    var details = document.createElement('details');
    var summary = document.createElement('summary'); summary.textContent = '자세한 설명과 출처';
    var detail = document.createElement('p'); detail.textContent = group.entry.detail || group.entry.short;
    details.append(summary, detail);
    group.entry.sources.forEach(function (source) {
      var a = document.createElement('a'); a.href = source.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = source.title+' ↗'; details.appendChild(a);
    });
    details.addEventListener('toggle', function () { if (active && active.group === group) place(active.anchor); });
    panel.append(header, brief, details);
    active = {group: group, anchor: part, pinned: !!pinned};
    group.primary.setAttribute('aria-expanded', 'true');
    group.primary.setAttribute('aria-describedby', brief.id);
    panel.hidden = false;
    if (panel.showPopover) panel.showPopover();
    place(part);
  }
  function toggle(part) {
    var group = parts.get(part);
    if (active && active.group === group && active.pinned) close(false);
    else show(part, true);
  }
  function textRuns(line) {
    var runs = [], text = '';
    function walk(node) {
      if (node.nodeType === 3) {
        runs.push({node: node, start: text.length, end: text.length+node.length});
        text += node.nodeValue;
      } else if (node.nodeType === 1) {
        // A separator prevents matches assembled across a skipped control/link.
        if (node.matches(EXCLUDE)) { text += '\u0000'; return; }
        Array.prototype.forEach.call(node.childNodes, walk);
      }
    }
    Array.prototype.forEach.call(line.childNodes, walk);
    return {runs: runs, text: text};
  }
  function matches(text) {
    var found = [];
    window.HanqGlossary.entries().forEach(function (entry) {
      var masked = text;
      (entry.avoid || []).forEach(function (avoid) { masked = masked.split(avoid).join('\u0000'.repeat(avoid.length)); });
      (entry.match || [entry.term]).forEach(function (term) {
        if (!term) return;
        for (var start = masked.indexOf(term); start !== -1; start = masked.indexOf(term, start+term.length)) found.push({start:start, end:start+term.length, entry:entry});
      });
    });
    // Prefer the longest alias at each position, then discard overlapping aliases.
    found.sort(function (a,b) { return a.start-b.start || b.end-a.end; });
    var end = -1;
    return found.filter(function (hit) { if (hit.start < end) return false; end = hit.end; return true; });
  }
  function decorate(root) {
    if (!root || !window.HanqGlossary) return 0;
    var lines = root.matches && root.matches('.textbook-semantic-line') ? [root] : root.querySelectorAll('.textbook-semantic-content .textbook-semantic-line');
    var count = 0;
    Array.prototype.forEach.call(lines, function (line) {
      if (visited.has(line) || !line.closest('.textbook-semantic-content') || line.closest(EXCLUDE)) return;
      visited.add(line);
      var source = textRuns(line), hits = matches(source.text);
      // Right-to-left keeps every earlier source-node offset stable. Only text
      // nodes split; original strong/span elements, attributes and IDs stay put.
      hits.slice().reverse().forEach(function (hit) {
        var group = {entry:hit.entry, primary:null};
        source.runs.filter(function (run) { return run.end > hit.start && run.start < hit.end; }).forEach(function (run) {
          var start = Math.max(0, hit.start-run.start), end = Math.min(run.node.length, hit.end-run.start);
          var text = run.node;
          if (end < text.length) text.splitText(end);
          if (start) text = text.splitText(start);
          var part = document.createElement('span');
          part.setAttribute('data-textbook-keyword', hit.entry.id);
          text.parentNode.insertBefore(part, text); part.appendChild(text); parts.set(part, group);
          if (!group.primary) {
            group.primary = part; part.setAttribute('role', 'button'); part.tabIndex = 0;
            part.setAttribute('aria-label', source.text.slice(hit.start, hit.end)+' · 용어 설명');
            part.setAttribute('aria-haspopup', 'dialog'); part.setAttribute('aria-expanded', 'false'); part.setAttribute('aria-controls', PANEL_ID);
          } else part.setAttribute('aria-hidden', 'true'); // The primary names the complete split term once.
        });
        count++;
      });
    });
    return count;
  }
  function boot() {
    makePanel(); decorate(document);
    var pending = new Set();
    var observer = new MutationObserver(function (records) {
      if (active && (!active.group.primary.isConnected || active.group.primary.closest('[hidden]'))) close(false);
      records.forEach(function (record) {
        if (record.type !== 'childList') return;
        Array.prototype.forEach.call(record.addedNodes, function (node) {
          if (node.nodeType !== 1 || node === panel || panel.contains(node) || node.hasAttribute('data-textbook-keyword')) return;
          var line = node.closest('.textbook-semantic-line');
          if (line) pending.add(line);
          else if (node.matches('.textbook-semantic,.textbook-semantic-content') || node.querySelector('.textbook-semantic-content,.textbook-semantic-line')) pending.add(node);
        });
      });
      if (queued || !pending.size) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; pending.forEach(function (node) { if (node.isConnected) decorate(node); }); pending.clear(); });
    });
    observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['hidden']});
    document.addEventListener('pointerover', function (event) {
      if (event.pointerType === 'touch') return;
      var part = partFor(event.target);
      if (part) show(part, false);
    });
    document.addEventListener('pointerout', function (event) {
      if (!active || !inside(active.group, event.target)) return;
      if (inside(active.group, event.relatedTarget) || panel.contains(event.relatedTarget)) return;
      later();
    });
    document.addEventListener('click', function (event) {
      var part = partFor(event.target);
      if (part) toggle(part);
    });
    document.addEventListener('pointerdown', function (event) {
      if (active && !inside(active.group, event.target) && !panel.contains(event.target)) close(false);
    });
    document.addEventListener('focusin', function (event) { var part = partFor(event.target); if (part && !restoring) show(part, false); });
    document.addEventListener('focusout', function (event) {
      if (!active || (!inside(active.group, event.target) && !panel.contains(event.target))) return;
      var group = active.group;
      setTimeout(function () { if (active && active.group === group && !inside(group, document.activeElement) && !panel.contains(document.activeElement)) close(false); }, 0);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && active) { event.preventDefault(); event.stopPropagation(); close(true); return; }
      var part = partFor(event.target);
      if (part && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault(); toggle(part);
        if (active && active.pinned) panel.querySelector('button').focus({preventScroll:true});
      }
    }, true);
    document.addEventListener('scroll', function (event) { if (active && event.target !== panel && !panel.contains(event.target)) follow(); }, true);
    document.addEventListener('visibilitychange', function () { if (document.hidden) close(false); });
    ['hashchange','popstate','pagehide','resize'].forEach(function (name) { window.addEventListener(name, function () { close(false); }); });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () { close(false); });
      window.visualViewport.addEventListener('scroll', follow);
    }
  }
  window.HanqTextbookKeywords = {decorate:decorate, close:function () { close(false); }};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
