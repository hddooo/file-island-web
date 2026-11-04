/* Decorative English-island residents. Real reviewed sprite cels; never owned
   partners, XP, audio, learning state, or menu destinations. */
(function(root){
  'use strict';
  var reduce=matchMedia('(prefers-reduced-motion: reduce)'),loads=new Map();
  function decoded(file){
    if(loads.has(file))return loads.get(file);
    var image=new Image(),pending=new Promise(function(resolve){
      var settled=false,timer=setTimeout(function(){finish(false);},12000);
      function finish(ok){if(settled)return;settled=true;clearTimeout(timer);image.onload=image.onerror=null;if(!ok)loads.delete(file);resolve(ok);}
      image.onload=function(){Promise.resolve().then(function(){return image.decode?image.decode():null;}).then(function(){finish(true);},function(){finish(false);});};image.onerror=function(){finish(false);};
    });
    loads.set(file,pending);image.src='media/characters/'+file;return pending;
  }
  function mount(map,chart){
    if(!map||!chart||map.dataset.englishResidents)return;
    map.dataset.englishResidents='true';
    var layer=document.createElement('span');layer.className='english-residents er-paused';layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<span class="er-actor er-agumon"><span class="er-shadow"></span><span class="er-gait"><span class="er-sprite"></span></span></span><span class="er-actor er-koromon"><span class="er-shadow"></span><span class="er-gait"><span class="er-sprite"></span></span></span><span class="er-actor er-patamon"></span>';
    chart.appendChild(layer);
    var agumon=layer.querySelector('.er-agumon'),koromon=layer.querySelector('.er-koromon'),patamon=layer.querySelector('.er-patamon');
    function warmResidents(){
      if(closed)return;
      [[agumon,'agumon-idle-sprite.png'],[koromon,'koromon-idle-actions-v1.png']].forEach(function(entry){if(!entry[0].classList.contains('er-ready'))decoded(entry[1]).then(function(ok){if(ok&&!closed&&entry[0].isConnected)entry[0].classList.add('er-ready');});});
      if(root.HanqCollectionLife&&!patamon.classList.contains('er-ready'))root.HanqCollectionLife.warm('patamon').then(function(ok){if(ok&&!closed&&patamon.isConnected)patamon.classList.add('er-ready');});
    }
    if(root.HanqCollectionLife)patamon.innerHTML=root.HanqCollectionLife.markup('patamon',false,'english-scenery');
    // Decorative motion starts automatically and follows the device preference.
    var closed=false,visible=false,suspended=false;
    function sync(){if(closed)return;layer.classList.toggle('er-paused',reduce.matches||!visible||document.hidden||suspended);layer.dataset.motion=reduce.matches?'reduced':!visible||document.hidden||suspended?'offscreen':'active';}
    function hide(){suspended=true;sync();}
    function show(){suspended=false;warmResidents();sync();}
    var io=root.IntersectionObserver?new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;sync();},{threshold:.01}):null;if(io)io.observe(map);else visible=true;
    function dispose(){if(closed)return;closed=true;if(io)io.disconnect();life.disconnect();document.removeEventListener('visibilitychange',sync);reduce.removeEventListener('change',sync);root.removeEventListener('online',warmResidents);root.removeEventListener('pagehide',hide);root.removeEventListener('pageshow',show);layer.remove();}
    var life=new MutationObserver(function(){if(!map.isConnected)dispose();});life.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);root.addEventListener('online',warmResidents);root.addEventListener('pagehide',hide);root.addEventListener('pageshow',show);warmResidents();sync();
  }
  // Loaded immediately after english-island.js; preserve the reviewed menu module.
  var island=root.HanqEnglishIsland;
  if(island){var enhance=island.enhance;island.enhance=function(map,chart,art,controls){enhance(map,chart,art,controls);mount(map,chart);};}
  root.HanqEnglishResidents={mount:mount};
})(window);
