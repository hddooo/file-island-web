/* Decorative palace evening. Existing land, water, native destinations and all
   learning/account state remain owned by their original modules. */
(function(root){
  'use strict';
  var reduced=matchMedia('(prefers-reduced-motion: reduce)'),assetLoads=new Map(),assetAttempts=new Map(),moduleBuild='',sceneOwner=null;
  // Seoul civil time, independent of the viewer's device time zone. These are
  // gradual decorative day/dusk bands, not a claim of astronomical sunrise.
  var seoulClock=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  function daylightAt(date){
    var parts=seoulClock.formatToParts(date),hour=0,minute=0;
    parts.forEach(function(p){if(p.type==='hour')hour=Number(p.value)%24;if(p.type==='minute')minute=Number(p.value);});
    var minutes=hour*60+minute,stops=[[0,0],[330,0],[480,1],[1020,1],[1200,0],[1440,0]],light=0;
    for(var i=1;i<stops.length;i++)if(minutes<=stops[i][0]){var a=stops[i-1],b=stops[i],t=(minutes-a[0])/(b[0]-a[0]);t=t*t*(3-2*t);light=a[1]+(b[1]-a[1])*t;break;}
    return {minutes:minutes,light:light,period:minutes<330||minutes>=1200?'night':minutes<480?'dawn':minutes<1020?'day':'dusk'};
  }
  try{moduleBuild=new URL(document.currentScript.src).searchParams.get('build')||'';}catch(ignore){}
  function campAsset(file){return new URL('media/world-art/'+file+(moduleBuild?'?build='+encodeURIComponent(moduleBuild):''),document.baseURI).href;}
  function decoded(file,character){var key=(character?'character:':'scene:')+file;if(assetLoads.has(key))return assetLoads.get(key);var attempt=assetAttempts.get(key)||0,url=character?new URL('media/characters/'+file,document.baseURI).href:campAsset(file);assetAttempts.set(key,attempt+1);if(attempt)url+=(url.indexOf('?')<0?'?':'&')+'retry='+attempt;var image=new Image(),pending=new Promise(function(resolve){var done=false,timer=setTimeout(function(){finish(false);},12000);function finish(ok){if(done)return;done=true;clearTimeout(timer);image.onload=image.onerror=null;if(!ok)assetLoads.delete(key);resolve(ok?url:false);}image.onload=function(){Promise.resolve(image.decode?image.decode():null).then(function(){finish(true);},function(){finish(false);});};image.onerror=function(){finish(false);};});assetLoads.set(key,pending);image.src=url;return pending;}
  function mount(map,chart){
    if(!map||!chart||map.dataset.historyEvening)return;
    map.dataset.historyEvening='true';
    sceneOwner=map;
    var layer=document.createElement('span');layer.className='history-evening he-paused';layer.setAttribute('aria-hidden','true');
    var rain='';for(var i=0;i<22;i++)rain+='<i style="--x:'+((i*37+7)%100)+'%;--y:'+((i*29)%100)+'%;--delay:'+(-i*.173)+'s"></i>';
    layer.innerHTML='<span class="he-night"></span><span class="he-sky"><i class="he-aurora he-aurora-a"></i><i class="he-aurora he-aurora-b"></i><span class="he-stars"></span><i class="he-breeze-cloud he-breeze-far"></i><i class="he-breeze-cloud he-breeze-near"></i></span><span class="he-clouds"></span><span class="he-rain">'+rain+'</span><span class="he-camp"><span class="he-warmth"></span><span class="he-chairs"></span><span class="he-fire"><i class="he-flame he-flame-a"></i><i class="he-flame he-flame-b"></i><i class="he-ember he-ember-a"></i><i class="he-ember he-ember-b"></i><i class="he-ember he-ember-c"></i></span><span class="he-friend"><span class="he-friend-sprite"></span><span class="he-leaf"></span></span></span>';
    layer.style.setProperty('--he-camp-art','url("'+campAsset('history-camp-dusk-v2.webp')+'")');
    layer.style.setProperty('--he-flame-art','url("'+campAsset('history-camp-flame-v2.webp')+'")');
    layer.insertAdjacentHTML('beforeend','<span class="he-resident he-koromon"><span class="he-resident-shadow"></span><span class="he-native"></span></span><span class="he-resident he-gabumon"><span class="he-resident-shadow"></span></span><span class="he-resident he-patamon"></span>');
    if(root.HanqCollectionLife)['gabumon','patamon'].forEach(function(id){layer.querySelector('.he-'+id).insertAdjacentHTML('beforeend',root.HanqCollectionLife.markup(id,false,'history-scenery'));});
    chart.appendChild(layer);
    var camp=layer.querySelector('.he-camp'),fire=layer.querySelector('.he-fire'),friend=layer.querySelector('.he-friend');
    // All feet use the same source-art coordinate space, independent of camp size.
    layer.appendChild(friend);
    function warmCamp(){if(closed)return;[['history-camp-dusk-v2.webp',camp,'he-camp-ready','--he-camp-art'],['history-camp-flame-v2.webp',fire,'he-fire-ready','--he-flame-art'],['history-agumon-leaf-held-v1.webp',friend,'he-rain-ready','--he-rain-friend-art']].forEach(function(entry){if(!entry[1].classList.contains(entry[2]))decoded(entry[0]).then(function(ok){if(ok&&!closed&&entry[1].isConnected){layer.style.setProperty(entry[3],'url("'+ok+'")');entry[1].classList.add(entry[2]);}});});}
    function warmPeople(){if(closed)return;[[friend,'agumon-idle-sprite.png','he-ready','--he-agumon-art'],[layer.querySelector('.he-koromon'),'koromon-idle-actions-v1.png','he-resident-ready','--he-koromon-art']].forEach(function(entry){if(!entry[0].classList.contains(entry[2]))decoded(entry[1],true).then(function(url){if(url&&!closed&&entry[0].isConnected){layer.style.setProperty(entry[3],'url("'+url+'")');entry[0].classList.add(entry[2]);}});});if(root.HanqCollectionLife)['gabumon','patamon'].forEach(function(id){var node=layer.querySelector('.he-'+id);if(!node.classList.contains('he-resident-ready'))root.HanqCollectionLife.warm(id).then(function(ok){if(ok&&!closed&&node.isConnected)node.classList.add('he-resident-ready');});});}
    function warmAll(){warmCamp();warmPeople();}

    var closed=false,visible=false,away=false,clockTimer=0;
    var clockProperties=['--he-brightness','--he-saturation','--he-actor-light','--he-night-strength','--he-daylight'];
    function updateClock(){
      var state=daylightAt(new Date()),light=state.light;
      map.dataset.historyTime=state.period;
      [[clockProperties[0],.47+.53*light],[clockProperties[1],.65+.35*light],[clockProperties[2],.78+.22*light],[clockProperties[3],1-light],[clockProperties[4],light]].forEach(function(p){map.style.setProperty(p[0],p[1].toFixed(4));if(sceneOwner===map)document.body.style.setProperty(p[0],p[1].toFixed(4));});
    }
    function sync(){if(closed)return;clearTimeout(clockTimer);clockTimer=0;updateClock();layer.classList.toggle('he-paused',reduced.matches||!visible||document.hidden||away);layer.dataset.motion=reduced.matches?'reduced':!visible||document.hidden||away?'offscreen':'active';if(visible&&!document.hidden&&!away)clockTimer=setTimeout(sync,60000-Date.now()%60000);}
    var io=root.IntersectionObserver?new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;sync();},{threshold:.01}):null;if(io)io.observe(map);else visible=true;
    function hide(){away=true;sync();}function show(){away=false;warmAll();sync();}
    function dispose(){if(closed)return;closed=true;clearTimeout(clockTimer);if(sceneOwner===map){sceneOwner=null;clockProperties.forEach(function(p){document.body.style.removeProperty(p);});}if(io)io.disconnect();life.disconnect();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);root.removeEventListener('pagehide',hide);root.removeEventListener('pageshow',show);root.removeEventListener('online',warmAll);layer.remove();}
    var life=new MutationObserver(function(){if(!map.isConnected)dispose();});life.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);root.addEventListener('pagehide',hide);root.addEventListener('pageshow',show);root.addEventListener('online',warmAll);warmAll();sync();
  }
  root.HanqHistoryEvening={mount:mount,daylightAt:daylightAt};
})(window);

