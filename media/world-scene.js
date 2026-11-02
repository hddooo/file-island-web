/* Scenic DOM layers. No study state, media, remote assets or animation engine. */
(function (root) {
  'use strict';
  var serial = 0, observer, pending = 0, scenes = new Set();
  var styled=getComputedStyle(document.documentElement).getPropertyValue('--world-scene-ready').trim()==='1';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var modest = !Element.prototype.animate || (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || !!(navigator.connection && navigator.connection.saveData);
  function iceScene() {
    return '<svg class="world-landscape world-ice-landscape" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="ice-sky" x2="0" y2="1"><stop stop-color="#123654"/><stop offset="1" stop-color="#83bdd4"/></linearGradient><linearGradient id="ice-sea" x2="0" y2="1"><stop stop-color="#347d9d"/><stop offset="1" stop-color="#103a60"/></linearGradient></defs><path fill="url(#ice-sky)" d="M0 0h1200v800H0z"/><path fill="#6099ba" d="M0 410 110 210 230 360 355 165 500 390 650 190 800 365 960 130 1200 400v400H0z"/><path fill="#d8f5fc" d="m110 210-54 100 54-22 37 29-37-107m245-45-73 119 73-30 49 42-49-131m295 25-63 104 63-21 38 28-38-111m310-60-95 154 95-44 56 40-56-150"/><path fill="url(#ice-sea)" d="M0 430h1200v370H0z"/><path fill="#a9e0ed" d="m0 600 150-40 105 35-47 51-208 26m1200-150-161 38-72-20 32-46 201-32M80 748l195-35 143 28-37 59H0zM1200 730l-174-53-137 48 61 75h250z"/><path fill="#e4f8fb" d="m0 600 150-40 105 35-128 17-127 28m1200-150-161 38-72-20 149-33 84-15M80 748l195-35 143 28-177 15-241 44m1200-70-174-53-137 48 154-12 157 39"/><g fill="#f1fcff" opacity=".8"><circle cx="85" cy="90" r="3"/><circle cx="240" cy="160" r="4"/><circle cx="420" cy="75" r="3"/><circle cx="570" cy="150" r="4"/><circle cx="750" cy="80" r="3"/><circle cx="1030" cy="70" r="4"/><circle cx="1120" cy="240" r="3"/><circle cx="90" cy="400" r="4"/><circle cx="410" cy="370" r="3"/><circle cx="850" cy="420" r="4"/><circle cx="1090" cy="580" r="3"/><circle cx="650" cy="670" r="3"/></g></svg>';
  }
  function svg(kind) {
    if(kind==='ice')return iceScene();
    var id = 'scene-' + (++serial), forest = kind === 'history';
    return '<svg class="world-landscape" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>'
      + '<linearGradient id="'+id+'-sky" x2="0" y2="1"><stop stop-color="'+(forest?'#253e53':'#326987')+'"/><stop offset="1" stop-color="'+(forest?'#b4c9a8':'#b8d9c5')+'"/></linearGradient>'
      + '<linearGradient id="'+id+'-water" x2="0" y2="1"><stop stop-color="#78b8bd"/><stop offset=".35" stop-color="#347c8e"/><stop offset="1" stop-color="#123c52"/></linearGradient>'
      + '<linearGradient id="'+id+'-land" x2="0" y2="1"><stop stop-color="'+(forest?'#588a66':'#87ac73')+'"/><stop offset="1" stop-color="#163d35"/></linearGradient>'
      + '<radialGradient id="'+id+'-light"><stop stop-color="#fff6cb" stop-opacity=".6"/><stop offset="1" stop-color="#fff6cb" stop-opacity="0"/></radialGradient></defs>'
      + '<path fill="url(#'+id+'-sky)" d="M0 0h1200v500H0z"/><circle cx="'+(forest?820:870)+'" cy="115" r="150" fill="url(#'+id+'-light)"/>'
      + '<g class="world-clouds" fill="#e4eee3" opacity=".45"><path d="M-100 105q70-40 130-8 15-44 77-18 50-20 78 19 70-9 102 23H-100z"/><path d="M650 65q70-30 110-7 38-41 86-7 68-16 105 21 82-3 120 28H650z"/></g>'
      + '<g class="world-depth world-depth-far" fill="'+(forest?'#557c7c':'#6c9c9a')+'"><path d="M-70 290 42 180 117 224 190 115 292 221 347 166 468 294z"/><path d="m680 294 93-117 55 40 97-146 87 152 81-35 173 122z"/><path fill="#b4c6b5" opacity=".6" d="m925 71-42 63 44-13 20 23 14-20z"/></g>'
      + (forest
        ? '<path fill="#496c4a" d="M0 275q160-87 330-16t360-10 510 2v249H0z"/><path fill="url(#'+id+'-land)" d="M0 300q180-55 365 5t350-17 485-11v223H0z"/><path fill="#a0ac7b" d="M590 300q-75 40-120 74T300 500h600q-145-90-185-122t-65-78z"/><path fill="#91baa0" opacity=".4" d="m603 307-84 100 68 93h74l-54-95 22-98z"/>'
        : '<path fill="url(#'+id+'-water)" d="M0 260h1200v240H0z"/><path fill="#c0cf9e" d="M0 345q200 23 327 75t350 80H0z"/><path fill="#e3d7ad" d="M0 372q130-9 304 63t354 65H0z"/><path fill="#8bc3b8" opacity=".65" d="M250 426q145 45 270 41t250 8l90 25H650q-230-6-400-74z"/><g class="world-water-lines" fill="none" stroke="#c2e3cf" opacity=".4" stroke-width="2"><path d="M50 299h154m70 15h208m110-25h190m70 35h230M366 360h180m95-13h166m-12 60h180M723 440h215"/></g>')
      + '<g class="world-depth world-depth-mid">'
      + (forest
        ? '<g fill="#819881" stroke="#365a4b" stroke-width="5"><path d="M458 330V203h38v127zM710 330V203h38v127zM451 199v-24h304v24zM480 174v-18h246v18z"/><path d="M500 202v-8h206v8"/><path fill="#173f34" d="M497 214h211v119H497z"/><path fill="#78a88a" opacity=".4" d="m516 327 27-90h121l27 90z"/><path fill="#4c7954" stroke="none" d="m449 177 9 67 14-36 10 49 6-70 61-18zM708 174l7 74 14-28 9 27 10-67z"/></g><g fill="#234f3f"><path d="M0 0h105l-8 259 47 111-72-18-41 29 20-135zM1090 0h110v385l-58-26-64 20 46-140z"/><ellipse cx="105" cy="80" rx="165" ry="92"/><ellipse cx="1115" cy="75" rx="190" ry="100"/></g><g fill="#39694e"><ellipse cx="215" cy="65" rx="120" ry="65"/><ellipse cx="1000" cy="45" rx="145" ry="74"/></g>'
        : '<path fill="url(#'+id+'-land)" d="m762 292 41-58 83 8 49-112 70 4 18 100 83-24 43 59 82-3v62z"/><path fill="#dabd7d" d="m935 130 70 4 18 100-28 1-16-83-38 13z"/><path fill="#326b54" d="m756 291 79-47 22 49zM1006 267l69-44 68 50z"/><path fill="#132e2b" d="M87 450q23-173 51-228h15Q126 352 130 450z"/><g fill="#245843"><path d="M145 225Q10 162-55 263q111-46 195-23Q90 120 190 85q-35 65-36 140 80-99 171-48-112 0-169 60 111-24 142 75-74-64-146-67z"/></g>')
      + '</g><g class="world-depth world-depth-near" fill="#102f29">'
      + (forest?'<path d="M0 454q75-64 153-21l-11 67H0zM967 500q80-95 233-73v73z"/><path d="m25 500 22-116 13 80 27-99 5 135zM1098 500l15-133 20 91 30-122-3 164z"/>':'<path d="m0 500 4-80 35 38 19-79 21 92 33-48 30 77zM1020 500l40-32 15-68 22 60 33-108 13 109 57-38v77z"/>')
      + '</g><g class="world-gate-light" fill="none" stroke="'+(forest?'#bee7aa':'#a5e0e8')+'" opacity=".65" stroke-width="2"><path d="M556 340V214h95v126"/><path d="M567 331V225h73v106"/></g></svg>';
  }
  var artwork={history:'history',toeic:'toeic',ice:'ice',hall:'hall',inquiry:'inquiry',account:'account',rainbow:'rainbow'};
  function artPath(kind){return 'media/world-art/'+(artwork[kind]||'toeic')+'-v1.webp';}
  function scenery(kind, ambient, variant) {
    var node=document.createElement('div');node.className='world-scenery';node.dataset.terrain=kind;node.setAttribute('aria-hidden','true');
    if(variant==='chart'){node.innerHTML=svg(kind);return node;}
    node.dataset.art='true';node.style.setProperty('background-image','url("'+(location.pathname.indexOf('/inquiries')===0?'/':'')+artPath(kind).replace('-v1.webp','-poster-v1.webp')+'")','important');node.style.backgroundSize='cover';node.style.backgroundPosition='center';node.innerHTML='<span class="world-mist"></span><span class="world-data-motes"></span>';
    var picture=document.createElement('img');picture.className='world-panorama';picture.alt='';picture.decoding='async';picture.src=(location.pathname.indexOf('/inquiries')===0?'/':'')+artPath(kind);picture.onload=function(){node.classList.add('world-art-ready');};picture.onerror=function(){picture.hidden=true;if(!node.querySelector('.world-art-fallback')){var fallback=document.createElement('div');fallback.className='world-art-fallback';fallback.innerHTML=svg(kind);node.prepend(fallback);}};node.prepend(picture);
    if(root.HanqIslandHarbors)root.HanqIslandHarbors.atmosphere(node,kind);
    if(picture.complete&&picture.naturalWidth)node.classList.add('world-art-ready');node.dataset.ambient=ambient?'true':'false';scenes.add(node);if(observer)observer.observe(node);return node;
  }
  function modes() {
    var stop=reduced.matches||modest||document.hidden;
    document.documentElement.classList.toggle('world-motion-paused',stop);
    document.documentElement.classList.toggle('world-low-power',!!modest);
  }
  function parallax(event) {
    var stage=event.currentTarget;if(reduced.matches||modest||document.hidden||event.pointerType==='touch')return;
    var r=stage.getBoundingClientRect(),x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;
    if(pending)cancelAnimationFrame(pending);pending=requestAnimationFrame(function(){pending=0;stage.style.setProperty('--look-x',(x*12).toFixed(2)+'px');stage.style.setProperty('--look-y',(y*7).toFixed(2)+'px');stage.style.setProperty('--look-far-x',(x*4).toFixed(2)+'px');stage.style.setProperty('--look-far-y',(y*2).toFixed(2)+'px');stage.style.setProperty('--look-near-x',(x*20).toFixed(2)+'px');stage.style.setProperty('--look-near-y',(y*12).toFixed(2)+'px');});
  }
  function reset(event){['x','y','far-x','far-y','near-x','near-y'].forEach(function(key){event.currentTarget.style.setProperty('--look-'+key,'0px');});}
  function enhanceMap(map) {
    if(map.closest('.world-atlas'))return;
    var stage=document.createElement('div');stage.className='world-atlas';map.before(stage);stage.appendChild(scenery('toeic',true,'chart'));
    var artplane=document.createElement('div');artplane.className='world-atlas-camera world-atlas-artplane';artplane.setAttribute('aria-hidden','true');var art=map.querySelector('img').cloneNode();art.className='world-atlas-art';art.alt='';artplane.appendChild(art);stage.appendChild(artplane);var camera=document.createElement('div');camera.className='world-atlas-camera';stage.appendChild(camera);camera.appendChild(map);
    var compass=document.createElement('div');compass.className='world-compass';compass.setAttribute('aria-hidden','true');compass.innerHTML='<span>N</span><i></i><span>FILE ISLAND</span>';stage.appendChild(compass);
    var tools=document.createElement('div');tools.className='world-atlas-tools';tools.innerHTML='<span>섬을 골라 들어가세요</span>';stage.after(tools);
    stage.addEventListener('pointermove',parallax);stage.addEventListener('pointerleave',reset);
    map.querySelectorAll('.island-region').forEach(function(button){var region=button.id==='subjectHistory'?'역사숲':'영어섬',label=button.querySelector('.island-region-label strong');if(label)label.textContent=region;button.setAttribute('aria-label',region+' 지도 선택');function focus(){stage.dataset.focus=button.id==='subjectHistory'?'history':'toeic';if(!button.dataset.scenePrimed){button.dataset.scenePrimed='true';var img=new Image();img.decoding='async';img.fetchPriority='low';img.src=artPath(button.id==='subjectHistory'?'history':'toeic');}}button.addEventListener('pointerenter',focus);button.addEventListener('focus',focus);button.addEventListener('blur',function(){delete stage.dataset.focus;});button.addEventListener('pointerleave',function(){if(document.activeElement!==button)delete stage.dataset.focus;});});
  }
  function prune(){scenes.forEach(function(n){if(!n.isConnected){if(observer)observer.unobserve(n);scenes.delete(n);}});}
  function sync() {
    if(!styled)return;
    scenes.forEach(function(n){if(!n.isConnected){if(observer)observer.unobserve(n);scenes.delete(n);}});
    var welcome=document.querySelector('.file-island-welcome');if(welcome&&!welcome.querySelector('.world-scenery')){welcome.prepend(scenery('toeic',true));welcome.classList.add('world-arrival-landscape');}
    var map=document.querySelector('.file-island-map');if(map)enhanceMap(map);
    var route=location.hash,region=location.pathname.indexOf('/inquiries')===0?'inquiry':/^#battle(?:\/|$)/.test(route)?'ice':/^#rainbow/.test(route)?'rainbow':/^#hall-of-fame/.test(route)?'hall':/^#account/.test(route)?'account':/^#toeic/.test(route)?'toeic':route&&route!=='#subjects'?'history':'world';
    document.body.dataset.worldDestination=region;
    var artHost=document.querySelector('#battleHost,#hallHost,#acRoot')||(region==='inquiry'?document.querySelector('#content'):null);
    if(artHost&&region!=='account'&&region!=='ice'&&region!=='hall'&&!document.querySelector('.login-landing')&&!artHost.parentNode.querySelector('.world-region-banner')){
      var banner=document.createElement('div');banner.className='world-region-banner';banner.dataset.region=region;banner.setAttribute('aria-hidden','true');banner.appendChild(scenery(region,false));
      var plaque=document.createElement('span');plaque.textContent={ice:'얼음섬 · 빙하의 성채',hall:'명예의 전당 · 영광의 정원',account:'MyPage · 나의 안식처',inquiry:'건의함 · 바닷가 우체국'}[region]||'파일섬';banner.appendChild(plaque);artHost.before(banner);
    }

    // Profile identity and the actual partner live inside the same garden scene.
    var profile=document.querySelector('.ac-me .ac-hero');
    if(profile&&!profile.querySelector('.world-scenery')){profile.prepend(scenery('account',true));profile.classList.add('ac-sanctuary');}
    // These hosts already use integrated artwork; only add atmosphere above it.
    if(artHost&&(region==='ice'||region==='hall')&&!artHost.querySelector(':scope > .scene-atmosphere')&&root.HanqIslandHarbors){artHost.classList.add('world-integrated-scene');root.HanqIslandHarbors.atmosphere(artHost,region);}

    var toeic=document.querySelector('.toeic-menu');
    if(toeic&&!toeic.querySelector('.world-island-banner')){
      var title=toeic.querySelector(':scope > h1');if(title){var banner=document.createElement('header');banner.className='world-island-banner';title.before(banner);banner.appendChild(scenery('toeic',false));var copy=document.createElement('div');copy.className='world-island-copy';copy.innerHTML='<span>영어섬</span>';copy.appendChild(title);banner.appendChild(copy);}
    }
    var hero=document.querySelector('.home-hero');if(hero&&!hero.querySelector('.world-scenery')){hero.prepend(scenery('history',true));hero.classList.add('world-history-base');hero.addEventListener('pointermove',parallax);hero.addEventListener('pointerleave',reset);var old=hero.querySelector('.hero-art');if(old)old.hidden=true;}
    var toc=document.querySelector('.toc');if(toc&&!toc.dataset.worldTrail){toc.dataset.worldTrail='true';toc.classList.add('world-era-trail');toc.setAttribute('aria-label','한국사 시대 탐험 경로');toc.querySelectorAll('.period').forEach(function(button,i){button.dataset.worldEra=String(i);});}
    document.body.classList.toggle('subject-map-history',location.hash==='#history');
    var historyMenu=document.querySelector('nav[aria-label="메인 메뉴"]');if(historyMenu&&location.hash==='#history'&&!historyMenu.classList.contains('subject-travel-map')){historyMenu.classList.add('subject-travel-map','history-travel-map');historyMenu.setAttribute('aria-label','한국사 학습 지도');var heading=document.createElement('h1');heading.className='history-map-title';heading.textContent='역사숲';historyMenu.before(heading);Array.from(historyMenu.children).forEach(function(n,i){n.dataset.mapPoint=String(i);var title=n.querySelector('.wn-entry-t');if(title)title.textContent=['시대별 학습','모의고사','오답노트','문의'][i]||title.textContent;var place=document.createElement('small');place.className='world-place-name';place.textContent=['시간의 숲길','수련의 고목','기억의 서고','안내 초소'][i]||'';n.appendChild(place);});historyMenu.addEventListener('click',function(e){var target=e.target.closest('button,a'),routes={homePastExams:'#past-exams',homeFormalExams:'#formal-exams',homeWrongNotes:'#wrongnotes'},hash=target&&(routes[target.id]||target.hash);if(hash){e.preventDefault();e.stopImmediatePropagation();HanqAdventure.enter('history',function(){location.hash=hash;},{eraTitle:target.textContent,origin:target});}},true);}
    document.querySelectorAll('.subject-travel-map').forEach(function(map){if(root.HanqIslandHarbors)HanqIslandHarbors.enhance(map);});
    modes();
  }
  if(root.IntersectionObserver)observer=new IntersectionObserver(function(entries){entries.forEach(function(e){e.target.classList.toggle('world-offscreen',!e.isIntersecting);});},{threshold:.05});
  document.addEventListener('visibilitychange',modes);if(reduced.addEventListener)reduced.addEventListener('change',modes);else if(reduced.addListener)reduced.addListener(modes);
  root.HanqWorldScene={sync:sync,scenery:scenery,artPath:artPath,prune:prune,isStatic:function(){return !styled||reduced.matches||modest;},dispose:function(){if(pending)cancelAnimationFrame(pending);scenes.forEach(function(n){if(observer)observer.unobserve(n);});scenes.clear();}};
})(window);
