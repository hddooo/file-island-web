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
