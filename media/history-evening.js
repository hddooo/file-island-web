/* Decorative palace evening. Existing land, water, native destinations and all
   learning/account state remain owned by their original modules. */
(function(root){
  'use strict';
  var reduced=matchMedia('(prefers-reduced-motion: reduce)'),assetLoads=new Map(),assetAttempts=new Map(),moduleBuild='';
  try{moduleBuild=new URL(document.currentScript.src).searchParams.get('build')||'';}catch(ignore){}
  function campAsset(file){return new URL('media/world-art/'+file+(moduleBuild?'?build='+encodeURIComponent(moduleBuild):''),document.baseURI).href;}
  function decoded(file){if(assetLoads.has(file))return assetLoads.get(file);var attempt=assetAttempts.get(file)||0,url=campAsset(file);assetAttempts.set(file,attempt+1);if(attempt)url+=(url.indexOf('?')<0?'?':'&')+'retry='+attempt;var image=new Image(),pending=new Promise(function(resolve){var done=false,timer=setTimeout(function(){finish(false);},12000);function finish(ok){if(done)return;done=true;clearTimeout(timer);image.onload=image.onerror=null;if(!ok)assetLoads.delete(file);resolve(ok?url:false);}image.onload=function(){Promise.resolve(image.decode?image.decode():null).then(function(){finish(true);},function(){finish(false);});};image.onerror=function(){finish(false);};});assetLoads.set(file,pending);image.src=url;return pending;}
  function mount(map,chart){
    if(!map||!chart||map.dataset.historyEvening)return;
    map.dataset.historyEvening='true';
    var layer=document.createElement('span');layer.className='history-evening he-paused';layer.setAttribute('aria-hidden','true');
    var rain='';for(var i=0;i<22;i++)rain+='<i style="--x:'+((i*37+7)%100)+'%;--y:'+((i*29)%100)+'%;--delay:'+(-i*.173)+'s"></i>';
    layer.innerHTML='<span class="he-night"></span><span class="he-sky"><i class="he-aurora he-aurora-a"></i><i class="he-aurora he-aurora-b"></i><span class="he-stars"></span></span><span class="he-clouds"></span><span class="he-rain">'+rain+'</span><span class="he-camp"><span class="he-warmth"></span><span class="he-chairs"></span><span class="he-fire"><i class="he-flame he-flame-a"></i><i class="he-flame he-flame-b"></i><i class="he-ember he-ember-a"></i><i class="he-ember he-ember-b"></i><i class="he-ember he-ember-c"></i></span><span class="he-friend"><span class="he-friend-sprite"></span><svg class="he-leaf" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><path d="M8 32C18 2 62-4 94 12 83 34 48 47 8 32Z" fill="#75a95c" stroke="#c6d68b" stroke-width="2"/><path d="m12 32 72-18M51 23l3 33M35 26l-5-13m28 7 10 10" fill="none" stroke="#315b39" stroke-width="2.5" stroke-linecap="round"/></svg></span></span>';
    layer.style.setProperty('--he-camp-art','url("'+campAsset('history-camp-dusk-v2.webp')+'")');
    layer.style.setProperty('--he-flame-art','url("'+campAsset('history-camp-flame-v2.webp')+'")');
    chart.appendChild(layer);
    var camp=layer.querySelector('.he-camp'),fire=layer.querySelector('.he-fire');
    function warmCamp(){if(closed)return;[['history-camp-dusk-v2.webp',camp,'he-camp-ready','--he-camp-art'],['history-camp-flame-v2.webp',fire,'he-fire-ready','--he-flame-art']].forEach(function(entry){if(!entry[1].classList.contains(entry[2]))decoded(entry[0]).then(function(ok){if(ok&&!closed&&entry[1].isConnected){layer.style.setProperty(entry[3],'url("'+ok+'")');entry[1].classList.add(entry[2]);}});});}
    var friend=layer.querySelector('.he-friend'),image=new Image();image.onload=function(){Promise.resolve(image.decode?image.decode():null).then(function(){if(friend.isConnected)friend.classList.add('he-ready');},function(){});};image.src='media/characters/agumon-idle-sprite.png';
    var closed=false,visible=false,away=false;
    function sync(){if(closed)return;layer.classList.toggle('he-paused',reduced.matches||!visible||document.hidden||away);layer.dataset.motion=reduced.matches?'reduced':!visible||document.hidden||away?'offscreen':'active';}
    var io=root.IntersectionObserver?new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;sync();},{threshold:.01}):null;if(io)io.observe(map);else visible=true;
    function hide(){away=true;sync();}function show(){away=false;warmCamp();sync();}
    function dispose(){if(closed)return;closed=true;if(io)io.disconnect();life.disconnect();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);root.removeEventListener('pagehide',hide);root.removeEventListener('pageshow',show);root.removeEventListener('online',warmCamp);layer.remove();}
    var life=new MutationObserver(function(){if(!map.isConnected)dispose();});life.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);root.addEventListener('pagehide',hide);root.addEventListener('pageshow',show);root.addEventListener('online',warmCamp);warmCamp();sync();
  }
  root.HanqHistoryEvening={mount:mount};
})(window);
