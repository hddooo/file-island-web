/* Decorative English-island residents. Real reviewed sprite cels; never owned
   partners, XP, audio, learning state, or menu destinations. */
(function(root){
  'use strict';
  var reduce=matchMedia('(prefers-reduced-motion: reduce)'),loads=new Map(),paused=false;
  function decoded(file){
    if(loads.has(file))return loads.get(file);
    var image=new Image(),pending=new Promise(function(resolve){image.onload=function(){Promise.resolve(image.decode?image.decode():null).then(function(){resolve(true);},function(){loads.delete(file);resolve(false);});};image.onerror=function(){loads.delete(file);resolve(false);};});
    loads.set(file,pending);image.src='media/characters/'+file;return pending;
  }
  function mount(map,chart){
    if(!map||!chart||map.dataset.englishResidents)return;
    map.dataset.englishResidents='true';
    var layer=document.createElement('span');layer.className='english-residents er-paused';layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<span class="er-actor er-agumon"><span class="er-shadow"></span><span class="er-sprite"></span></span><span class="er-actor er-koromon"><span class="er-shadow"></span><span class="er-sprite"></span></span><span class="er-actor er-patamon"></span>';
    chart.appendChild(layer);
    var agumon=layer.querySelector('.er-agumon'),koromon=layer.querySelector('.er-koromon'),patamon=layer.querySelector('.er-patamon');
    decoded('agumon-idle-sprite.png').then(function(ok){if(ok&&agumon.isConnected)agumon.classList.add('er-ready');});
    decoded('koromon-idle-actions-v1.png').then(function(ok){if(ok&&koromon.isConnected)koromon.classList.add('er-ready');});
    if(root.HanqCollectionLife){patamon.innerHTML=root.HanqCollectionLife.markup('patamon',false,'english-scenery');root.HanqCollectionLife.warm('patamon').then(function(ok){if(ok&&patamon.isConnected)patamon.classList.add('er-ready');});}
    // A sibling control keeps decorative settings outside the native map menu.
    var frame=map.parentElement,added=getComputedStyle(frame).position==='static',closed=false,visible=false;
    if(added)frame.classList.add('english-residents-host');
    var toggle=document.createElement('button');toggle.type='button';toggle.className='english-residents-toggle';toggle.setAttribute('aria-label','디지몬 움직임');toggle.setAttribute('aria-controls',map.id||'english-residents-map');if(!map.id)map.id='english-residents-map';frame.appendChild(toggle);
    function position(){if(closed)return;var a=map.getBoundingClientRect(),b=frame.getBoundingClientRect();toggle.style.left=(a.left-b.left-frame.clientLeft+frame.scrollLeft+8)+'px';toggle.style.top=(a.bottom-b.top-frame.clientTop+frame.scrollTop-toggle.offsetHeight-8)+'px';}
    function sync(){if(closed)return;var moving=!paused&&!reduce.matches;layer.classList.toggle('er-paused',!moving||!visible||document.hidden);layer.dataset.motion=reduce.matches?'reduced':paused?'paused':!visible||document.hidden?'offscreen':'active';toggle.setAttribute('aria-pressed',String(moving));toggle.disabled=reduce.matches;toggle.innerHTML='<span aria-hidden="true">'+(moving?'Ⅱ':'▶')+'</span> 디지몬 움직임';toggle.title=reduce.matches?'기기의 동작 줄이기 설정에 따라 멈췄습니다.':moving?'디지몬 움직임을 멈춥니다.':'디지몬 움직임을 켭니다.';position();}
    toggle.addEventListener('click',function(){paused=!paused;sync();});
    var io=root.IntersectionObserver?new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;sync();},{threshold:.01}):null;if(io)io.observe(map);else visible=true;
    var ro=root.ResizeObserver?new ResizeObserver(position):null;if(ro){ro.observe(map);ro.observe(frame);ro.observe(toggle);}
    function dispose(){if(closed)return;closed=true;if(io)io.disconnect();if(ro)ro.disconnect();life.disconnect();document.removeEventListener('visibilitychange',sync);reduce.removeEventListener('change',sync);root.removeEventListener('resize',position);toggle.remove();layer.remove();if(added)frame.classList.remove('english-residents-host');}
    var life=new MutationObserver(function(){if(!map.isConnected)dispose();});life.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);root.addEventListener('resize',position);sync();
  }
  // Loaded immediately after english-island.js; preserve the reviewed menu module.
  var island=root.HanqEnglishIsland;
  if(island){var enhance=island.enhance;island.enhance=function(map,chart,art,controls){enhance(map,chart,art,controls);mount(map,chart);};}
  root.HanqEnglishResidents={mount:mount};
})(window);
