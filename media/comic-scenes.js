/* 한국사 한눈에 · 웹툰 장면 번호
 * 장면 수를 고정값(32 등)으로 두지 않고, 실제 .scene 개수로 번호와 전체 수를 채운다.
 * [data-scene-count]          → "03 / 17" (data-format="n"이면 "03")
 * [data-scene-total]          → 17
 * [data-scene-ref="장면 id"]  → 그 장면의 순번 + "컷"
 * 스크립트가 실패해도 정적 번호가 미리 맞춰져 있어 읽는 데 문제가 없다.
 */
(function(){
  'use strict';
  function pad(n){return n<10?'0'+n:String(n);}
  function run(){
    var scenes=Array.prototype.slice.call(document.querySelectorAll('.scene')),total=scenes.length;
    scenes.forEach(function(scene,i){
      var el=scene.querySelector('[data-scene-count]');
      if(el)el.textContent=el.getAttribute('data-format')==='n'?pad(i+1):pad(i+1)+' / '+pad(total);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-scene-total]'),function(el){el.textContent=String(total);});
    Array.prototype.forEach.call(document.querySelectorAll('[data-scene-ref]'),function(el){
      var i=scenes.indexOf(document.getElementById(el.getAttribute('data-scene-ref')));
      if(i>=0)el.textContent=(i+1)+'컷';
    });
    document.documentElement.setAttribute('data-scene-total',String(total));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();

  /* 앱의 한 페이지 학습 화면 지원(앱이 먼저 요청할 때만 동작 — 혼자 연 웹툰이나 다른 화면에는 아무 영향이 없다)
   * 'hanq:measure' → 이 문서 본문 높이를 'hanq:height'로 알려 주고, 그림이 늦게 뜨거나 보충을 펼치고 닫을 때마다 다시 알린다(앱이 칸 높이를 맞춰 안쪽 스크롤이 생기지 않게).
   * 'hanq:goto'    → 요청한 id 요소의 문서 안 위치를 'hanq:pos'로 돌려준다(앱이 바깥 화면을 그 위치로 옮긴다). */
  var parentWin=null,lastH=0;
  try{parentWin=window.self!==window.top?window.parent:null;}catch(e){parentWin=window.parent;}
  function bodyHeight(){var b=document.body;/* 본문 높이만 잰다: 문서 전체 높이는 칸 높이 이상으로 잡혀, 칸을 늘릴수록 커질 수 있다 */
    return Math.ceil(b?Math.max(b.scrollHeight,b.getBoundingClientRect().height):document.documentElement.scrollHeight);}
  function postHeight(){var h=bodyHeight();if(Math.abs(h-lastH)<2)return;lastH=h;try{parentWin.postMessage({type:'hanq:height',h:h},'*');}catch(e){}}
  var watching=false;
  function watchHeight(){
    if(watching){lastH=0;postHeight();return;}
    watching=true;postHeight();
    if(window.ResizeObserver){try{new ResizeObserver(postHeight).observe(document.body);}catch(e){}}
    window.addEventListener('load',postHeight);window.addEventListener('resize',postHeight);
    document.addEventListener('toggle',postHeight,true);
    Array.prototype.forEach.call(document.images,function(img){if(!img.complete)img.addEventListener('load',postHeight);});
    var n=0,t=setInterval(function(){postHeight();if(++n>20)clearInterval(t);},500);
  }
  /* 혼자 연 웹툰(‘웹툰을 크게 열기’ 새 탭)의 읽음 표시: 이 창이 맨 위 창일 때만(앱 안 iframe은 앱이 바깥 창 기준으로 잰다).
   * 앱과 같은 저장소(learning-progress.js)·같은 읽음 모듈(read-progress.js)·같은 흐름 자료를 불러, 같은 시대·흐름·컷 키로 남긴다.
   * 조선 전기·후기 단독 웹툰은 통합본(joseon-all)과 컷 구성이 달라 세지 않는다(앱의 조선은 통합본 27컷 하나로 셈). */
  (function(){
    var me=document.currentScript;
    try{if(window.self!==window.top)return;}catch(e){return;}
    var ERA={'prehistory-comic.html':'prehistory','gojoseon-comic.html':'gojoseon','samguk-comic.html':'samguk','nambuk-comic.html':'nambuk','goryeo-comic.html':'goryeo',
      'joseon-all-comic.html':'joseon','islands-comic.html':'islands','opening-comic.html':'opening','colonial-comic.html':'colonial','modern-comic.html':'modern'};
    var era=ERA[(location.pathname.split('/').pop()||'').toLowerCase()];if(!era||!me||!me.src)return;
    var base=me.src.replace(/[^\/]*$/,''),list=['learning-progress.js','read-progress.js'].concat(era==='opening'?['lecture-notes.js','lecture-notes-opening.js']:['lecture-flow-'+era+'.js']);
    function need(name){return name==='learning-progress.js'?!window.HanqProgress:name==='read-progress.js'?!window.HanqRead:true;}
    function load(i){if(i>=list.length){start();return;}if(!need(list[i])){load(i+1);return;}var s=document.createElement('script');s.src=base+list[i];s.onload=function(){load(i+1);};s.onerror=function(){};document.head.appendChild(s);}
    function start(){
      var H=window.HanqRead,PS=window.HanqProgress&&window.HanqProgress.store;if(!H||!PS)return;
      var L=(window.HANQ_LECTURE&&window.HANQ_LECTURE[era])||{},FW=window.HANQ_FLOW&&window.HANQ_FLOW[era],P=FW&&FW.list?FW.list:(L.parts&&L.parts.list?L.parts.list:[]);
      var flows=P.filter(function(p){return p&&typeof p.id==='string'&&p.id;}).map(function(p){return {id:p.id,name:String(p.name||'')};});if(!flows.length)return;
      var box=document.createElement('p');box.className='hq-read-status';box.setAttribute('role','status');box.setAttribute('aria-live','polite');
      box.style.cssText='margin:0;padding:10px 18px;background:#eef6f0;color:#17543a;font-size:14px;font-weight:800;line-height:1.5;word-break:keep-all';
      var head=document.querySelector('main > header')||document.querySelector('header');if(head&&head.parentNode)head.parentNode.insertBefore(box,head.nextSibling);else return;
      function paint(sum){if(!sum)return;var st=PS.status(),local=st.persistent?'':' · 저장이 막혀 이 탭에만 둬요(닫으면 사라질 수 있어요)';
        box.textContent=(sum.chapter.read?'✓ 이 시대 웹툰 읽음 · ':'읽은 컷 ')+sum.chapter.seen+' / '+sum.chapter.total+(sum.chapter.read?'':' · 절반('+sum.chapter.threshold+'컷) 이상 보면 읽음')+' · 읽은 흐름 '+sum.flows.filter(function(f){return f.read;}).length+' / '+sum.flows.length+local;
        sum.flows.forEach(function(f){var h=document.getElementById(f.id);if(!h)return;var t=h.querySelector('h2')||h,b=t.querySelector('.hq-read-badge');if(!b){b=document.createElement('span');b.className='hq-read-badge';b.style.cssText='display:inline-block;margin-left:8px;padding:1px 8px;border-radius:99px;background:#e9f8ef;color:#167548;font-size:12.5px;font-weight:850;vertical-align:middle';t.appendChild(b);}
          b.textContent=f.read?'✓ 읽음':(f.seen?'본 컷 '+f.seen+' / '+f.total:'');b.hidden=!b.textContent;});}
      var tr=H.attachStandalone({win:window,doc:document,era:era,flows:flows,store:PS,onChange:paint});
      if(tr)window.addEventListener('storage',function(e){if(e.key&&e.key.indexOf('hanq:progress:v1:read-'+era+'-')===0)tr.reloadSeen();});
      window.HanqReadComic={debug:function(){return tr?tr.debug():null;}}; // 읽기 전용(검사용)
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){load(0);});else load(0);
  })();
  window.addEventListener('message',function(e){
    if(!parentWin||e.source!==parentWin||!e.data)return;
    if(e.data.type==='hanq:measure'){watchHeight();return;}
    if(e.data.type==='hanq:goto'){
      var el=document.getElementById(String(e.data.id||''));if(!el)return;
      if(el.tagName==='DETAILS')el.open=true;
      for(var d=el.parentElement&&el.parentElement.closest('details');d;d=d.parentElement&&d.parentElement.closest('details'))d.open=true;
      var top=el.getBoundingClientRect().top+(window.pageYOffset||document.documentElement.scrollTop||0);
      try{parentWin.postMessage({type:'hanq:pos',id:el.id,top:top},'*');}catch(err){}
      /* 키보드로 바로 가기를 누른 사람도 그 부분에서 이어 읽도록 초점을 옮긴다(화면 이동은 앱이 맡으므로 스크롤하지 않음) */
      if(e.data.focus){if(!el.hasAttribute('tabindex'))el.setAttribute('tabindex','-1');try{el.focus({preventScroll:true});}catch(err){}}
    }
  });
})();
