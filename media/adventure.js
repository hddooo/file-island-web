/* Route scenery and entrance choreography only. Never owns study/audio state. */
(function (root) {
  'use strict';
  var busy = false, timer = null, activeOverlay = null, flightAnimations = [], trigger = null, arrivalTarget = null;
  var ENTER_MS = 5000, ARRIVAL_MS = 500, finishActive = null, releaseApp = null, releaseNav = null;
  function cancel() {
    releaseBackground();
    if (timer) clearTimeout(timer);
    flightAnimations.forEach(function(a){a.cancel();});flightAnimations=[];
    if (activeOverlay) activeOverlay.remove();
    if(arrivalTarget)arrivalTarget.classList.remove('world-device-arrival');arrivalTarget=null;
    if(root.HanqWorldScene)HanqWorldScene.prune();
    timer = null; activeOverlay = null; busy = false; trigger = null; finishActive = null;
  }
  function releaseBackground(){if(releaseApp){releaseApp();releaseApp=null;}if(releaseNav){releaseNav();releaseNav=null;}}
  var globalNav = null, navResize = null;
  function viewport() {
    var vv = root.visualViewport, height = vv ? vv.height : root.innerHeight;
    document.documentElement.style.setProperty('--study-viewport-height', height + 'px');var footer=globalNav&&!globalNav.hidden&&globalNav.getClientRects().length?globalNav:document.querySelector('.toeic-sections');if(footer&&!footer.hidden){var footerHeight=footer.getBoundingClientRect().height;if(footerHeight)document.documentElement.style.setProperty('--study-footer-height',Math.ceil(footerHeight)+'px');}
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
    document.body.classList.toggle('study-keyboard', !!(typing && height < root.innerHeight * .75));
  }
  function mobileNavigation(island, login, map) {
    var auth = root.HanqApi && root.HanqApi.state ? root.HanqApi.state() : null;
    var signedIn = !!(auth && auth.signedIn);
    var context = map || island === 'world' ? 'world' : island;
    document.body.classList.toggle('study-global-footer', signedIn && !login);
    if (!signedIn || login) { if (globalNav) globalNav.hidden = true; viewport(); return; }
    var links = context === 'toeic' ? [['▤','Vocabulary','#toeic/notebook'],['✓','Practice','#toeic/wrongnotes'],['▦','Grammar','#toeic/grammar'],['♫','Listening','#toeic/player']] : context === 'history' ? [['▤','시대학습','#past-exams'],['▦','모의고사','#formal-exams'],['✓','오답','#wrongnotes']] : [['▤','한국사','#history'],['⌘','토익','#toeic/map'],['◉','My','#account']];
    if (!globalNav) { globalNav = document.createElement('nav'); globalNav.className='world-global-nav'; globalNav.setAttribute('aria-label','글로벌 학습 메뉴'); document.body.appendChild(globalNav);if(root.ResizeObserver){navResize=new ResizeObserver(viewport);navResize.observe(globalNav);} }
    var key = context + ':' + location.hash;
    if (globalNav.dataset.route !== key) {
      globalNav.replaceChildren(); globalNav.dataset.route = key;
      globalNav.setAttribute('aria-label', context === 'toeic' ? '영어섬 학습 메뉴' : context === 'history' ? '역사숲 학습 메뉴' : '글로벌 학습 메뉴');
      links.forEach(function(item){
        var a=document.createElement('a'),icon=document.createElement('span'),label=document.createElement('span');
        a.href=item[2];icon.textContent=item[0];icon.setAttribute('aria-hidden','true');label.textContent=item[1];a.append(icon,label);
        var route=location.hash, active=route===item[2] || route.indexOf(item[2]+'/')===0;
        if(item[2]==='#toeic/grammar' && /^#toeic\/grammar-practice(?:\/|$)/.test(route))active=true;
        if(item[2]==='#past-exams' && /^#(?:chapter|textbook)\//.test(route))active=true;
        if(active)a.setAttribute('aria-current','page');globalNav.appendChild(a);
      });
    }
    globalNav.hidden = false;
    var nav = globalNav;
    requestAnimationFrame(function(){if(nav.isConnected)document.documentElement.style.setProperty('--study-footer-height',Math.ceil(nav.getBoundingClientRect().height || 76)+'px');});
    viewport();
  }
  root.addEventListener('resize', viewport);
  if (root.visualViewport) root.visualViewport.addEventListener('resize', viewport);

  function sync() {
    var shell = document.querySelector('#app');
    var map = document.querySelector('.file-island-map,.world-map,#worldMapHost');
    var login = document.querySelector('.login-landing');
    if(login&&activeOverlay)cancel();
    // Display name only; the existing grammar route and stored IDs stay stable.
    document.querySelectorAll('.toeic-travel-map [data-toeic-view] strong').forEach(function(label){var control=label.closest('[data-toeic-view]'),view=control&&control.dataset.toeicView,name={notebook:'Vocabulary',grammar:'Grammar',wrongnotes:'Practice',player:'Listening'}[view];if(name&&label.textContent!==name)label.textContent=name;});
    var route = location.hash;
    if(activeOverlay&&activeOverlay.dataset.handoff==='true'&&activeOverlay.dataset.route!==route)cancel();
    // The old subject switch was removed. Derive terrain from the real route.
    var island = map || login ? 'world' : /^#toeic(?:-|\/|$)/.test(route) ? 'toeic'
      : /^#(?:account|hall-of-fame|rainbow)(?:\/|$)/.test(route) ? 'world' : 'history';
    mobileNavigation(island, login, map);
    document.body.dataset.island = island;
    document.body.dataset.worldScene = login ? 'arrival' : map ? 'map'
      : /^#(?:account|hall-of-fame|rainbow)(?:\/|$)/.test(route) ? 'account' : 'study';
    document.body.classList.toggle('toeic-mobile-nav', !!document.querySelector('.toeic-sections'));
    if (shell) shell.classList.toggle('digivice-screen', !map && !login);
    var oldLocation=document.querySelector('#app .topline .world-location');if(oldLocation)oldLocation.remove();
    if(root.HanqWorldScene)HanqWorldScene.sync();
  }
  function escapeLabel(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function settleScroll(){var doc=document.documentElement,previous=doc.style.scrollBehavior;doc.style.scrollBehavior='auto';root.scrollTo(0,0);doc.style.scrollBehavior=previous;}
  function focusStudy(){var heading=document.querySelector('#app h1,#app h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}
  function enter(island, go, options) {
    options=options||{};if(options.ready)Promise.resolve(options.ready).catch(function(){});
    if(activeOverlay)cancel();
    var names={toeic:'영어섬',history:'역사숲',ice:'얼음섬',hall:'명예의 전당',rainbow:'행복의 마을',inquiry:'건의함',account:'MyPage'},title=options.eraTitle||names[island]||'파일섬';
    var origin=location.hash,reduce=document.documentElement.dataset.companyMode==='on'||matchMedia('(prefers-reduced-motion: reduce)').matches||!root.HanqWorldScene||HanqWorldScene.isStatic();
    if(reduce||!Element.prototype.animate){go();settleScroll();sync();focusStudy();return;}
    busy=true;trigger=options.origin||document.activeElement;
    var overlay=document.createElement('div');overlay.className='adventure-entry world-journey world-cinematic';overlay.dataset.destination=island;
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',title+' 입장');
    var destination=document.createElement('div');destination.className='world-destination';destination.setAttribute('aria-hidden','true');
    var scenery=HanqWorldScene.scenery(island,true);destination.appendChild(scenery);overlay.appendChild(destination);
    var foreground=document.createElement('img');foreground.className='world-foreground';foreground.alt='';foreground.setAttribute('aria-hidden','true');foreground.src='media/world-art/'+(island==='ice'?'ice':'garden')+'-foreground-v1.webp';overlay.appendChild(foreground);
    var atmosphere=document.createElement('div');atmosphere.className='cinematic-atmosphere';atmosphere.setAttribute('aria-hidden','true');
    for(var i=0;i<24;i++){var mote=document.createElement('i');mote.style.setProperty('--seed',i);mote.style.left=((i*37)%100)+'%';mote.style.top=((i*19)%100)+'%';atmosphere.appendChild(mote);}overlay.appendChild(atmosphere);
    var copy=document.createElement('div');copy.className='cinematic-caption';copy.innerHTML='<span>FILE ISLAND · JOURNEY</span><strong>'+escapeLabel(title)+'</strong><div class="cinematic-track"><i></i></div>';copy.setAttribute('aria-hidden','true');overlay.appendChild(copy);
    var controls=document.createElement('div');controls.className='cinematic-controls';
    var skip=document.createElement('button');skip.type='button';skip.className='world-skip';skip.textContent='건너뛰기 ↵';
    var close=document.createElement('button');close.type='button';close.className='world-cancel';close.textContent='이동 취소';controls.append(skip,close);overlay.appendChild(controls);
    activeOverlay=overlay;document.body.appendChild(overlay);
    var app=document.querySelector('#app');releaseApp=root.HanqUiLocks.acquire(app);releaseNav=root.HanqUiLocks.acquire(globalNav);
    // Warm the next scene without creating a second router or state owner.
    var picture=scenery.querySelector('.world-panorama');if(picture&&picture.decode)picture.decode().catch(function(){});
    var ease='cubic-bezier(.22,.61,.36,1)';
    function motion(node,frames,ms,delay){if(node)flightAnimations.push(node.animate(frames,{duration:ms,delay:delay||0,easing:ease,fill:'both'}));}
    motion(destination,[{opacity:0,transform:'scale(1.03)'},{offset:.12,opacity:1,transform:'scale(1)'},{offset:.8,opacity:1,transform:'scale(1)'},{opacity:1,transform:'scale(1.025)'}],4500);
    motion(picture,[{transform:'scale(1.18) translate3d(-2.5%,1.5%,0)'},{offset:.5,transform:'scale(1.1) translate3d(1%,-.7%,0)'},{transform:'scale(1.17) translate3d(2.5%,-2%,0)'}],5000);
    motion(foreground,[{transform:'scale(1.26) translate3d(2%,3%,0)',opacity:0},{offset:.2,transform:'scale(1.2) translate3d(1%,1%,0)',opacity:1},{transform:'scale(1.08) translate3d(-2%,-1.5%,0)',opacity:1}],5000);
    motion(copy,[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],650,800);
    var committed=false;
    function finish(){
      if(committed||activeOverlay!==overlay)return;
      if(location.hash!==origin){cancel();return;}
      committed=true;finishActive=null;if(timer)clearTimeout(timer);
      overlay.dataset.handoff='true';
      try{go();overlay.dataset.route=location.hash;settleScroll();sync();}catch(error){cancel();throw error;}
      if(activeOverlay!==overlay)return;
      overlay.dataset.route=location.hash;busy=false;trigger=null;
      releaseBackground();
      controls.remove();overlay.removeAttribute('role');overlay.removeAttribute('aria-modal');overlay.setAttribute('aria-hidden','true');overlay.style.pointerEvents='none';focusStudy();
      motion(overlay,[{opacity:1},{opacity:0}],ARRIVAL_MS);
      timer=setTimeout(function(){if(activeOverlay===overlay)cancel();},ARRIVAL_MS);
    }
    finishActive=finish;timer=setTimeout(finish,ENTER_MS-ARRIVAL_MS);
    skip.onclick=finish;close.onclick=function(){var back=trigger;cancel();if(back&&back.isConnected)back.focus({preventScroll:true});};
    destination.onclick=finish;foreground.onclick=finish;atmosphere.onclick=finish;copy.onclick=finish;
    skip.focus({preventScroll:true});
  }
  // Keep each existing route handler as the only owner of mounting and cleanup.
  // Replay the selected control once after the gate; never mount a second copy.
  var replaying = false;
  document.addEventListener('click', function(event){
    if(replaying || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
    var control=event.target.closest('a,button');
    if(!control || control.disabled || control.target === '_blank' || control.hasAttribute('download'))return;
    var href=control.getAttribute('href'), kind, title;
    if(control.id==='subjectBattle' || href==='#battle'){kind='ice';title='얼음섬';}
    else if(href==='#rainbow'){kind='rainbow';title='행복의 마을';}
    else if(href==='#hall-of-fame'){kind='hall';title='명예의 전당';}
    else if(control.id==='headerAccount' || href==='#account'){kind='account';title='MyPage';}
    else if(href==='/inquiries/' || href==='inquiries/'){kind='inquiry';title='건의함';}
    if(!kind || (href && href===location.hash))return;
    // Login must stay immediate; authentication still belongs to the route handler.
    var auth=root.HanqApi&&root.HanqApi.state?root.HanqApi.state():null;if(!auth||!auth.signedIn)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches || !root.HanqWorldScene || HanqWorldScene.isStatic() || !Element.prototype.animate)return;
    event.preventDefault();event.stopImmediatePropagation();
    enter(kind,function(){
      if(!control.isConnected)return;
      replaying=true;
      try{if(kind==='inquiry')location.assign(href);else control.click();}finally{replaying=false;}
    },{eraTitle:title,origin:control});
  },true);
  window.addEventListener('hashchange',function(){
    if(activeOverlay && activeOverlay.dataset.handoff!=='true')cancel();
  });
  document.addEventListener('visibilitychange',function(){if(document.hidden&&activeOverlay)cancel();});
  var motionPreference=matchMedia('(prefers-reduced-motion: reduce)'),motionChanged=function(e){if(e.matches&&activeOverlay)cancel();};if(motionPreference.addEventListener)motionPreference.addEventListener('change',motionChanged);else if(motionPreference.addListener)motionPreference.addListener(motionChanged);
  window.addEventListener('pagehide',cancel);
  window.addEventListener('popstate', cancel);
  window.addEventListener('keydown', function (event) {
    if(busy&&event.key==='Tab'){var buttons=activeOverlay&&Array.from(activeOverlay.querySelectorAll('button'));if(buttons&&buttons.length){event.preventDefault();var index=buttons.indexOf(document.activeElement);buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}return;}
    if(busy&&(event.key==='Enter'||event.key===' ')&&!(document.activeElement&&document.activeElement.classList.contains('world-cancel'))){event.preventDefault();if(finishActive)finishActive();return;}
    if (busy && event.key === 'Escape') { event.preventDefault(); var back=trigger;cancel();if(back&&back.isConnected)back.focus({preventScroll:true}); }
  });
  function watchOwner(){if(!root.HanqApi||!root.HanqApi.onChange)return;var owner=root.HanqApi.state().ownerId;root.HanqApi.onChange(function(state){var next=state.signedIn?state.ownerId:null;if(activeOverlay&&next!==owner)cancel();owner=next;});}
  if(root.HanqApi)watchOwner();else document.addEventListener('DOMContentLoaded',watchOwner,{once:true});
  // Only observe app-level route replacements. Playback/time updates do not resync scenery.
  new MutationObserver(sync).observe(document.querySelector('#app'), {childList:true});
  root.HanqAdventure = {enter:enter, enterEra:function(button,go){var title=button.querySelector('strong');enter('history',go,{eraTitle:title?title.textContent:'첫 시대 · 선사시대'});}, sync:sync, cancel:cancel, skip:function(){if(finishActive)finishActive();}};
  sync();
})(window);

