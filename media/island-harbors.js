/* Map presentation only. Existing controls, handlers, routes and state stay owned by the app. */
(function(root){
  'use strict';
  var icons={
    book:'<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6v15M6 9h3m6 0h3M6 13h3m6 0h3"/>',
    review:'<path d="M5 8a8 8 0 1 1-1 8M5 3v5H1"/><path d="m8 13 3 3 5-6"/>',
    notes:'<path d="M6 3h13v18H6a3 3 0 0 1 0-6h13M6 3a3 3 0 0 0-3 3v12M8 7h7m-7 4h5"/>',
    audio:'<path d="M4 14v-3a8 8 0 0 1 16 0v3M4 12H2v8h5v-8zM20 12h2v8h-5v-8z"/>',
    gate:'<path d="M3 21V8h18v13M2 4h20v4H2zM8 21v-7a4 4 0 0 1 8 0v7M6 4V2m12 2V2"/>',
    flag:'<path d="M5 22V3m0 1c5-5 9 5 15 0v10c-6 5-10-5-15 0M2 22h6"/>'
  };
  function icon(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';}
  // Scene module is loaded here so shared index/header and study modules stay untouched.
  var waterLoader,eveningLoader;
  var controlSerial=0,controlHosts=new WeakMap();
  function attachControl(map,button){
    var frame=map.parentElement,record=controlHosts.get(frame),closed=false,layoutFrame=0;
    if(!record){record={count:0,added:getComputedStyle(frame).position==='static'};controlHosts.set(frame,record);if(record.added)frame.classList.add('harbor-control-host');}record.count++;
    if(!map.id)map.id='harbor-map-'+(++controlSerial);button.setAttribute('aria-controls',map.id);frame.appendChild(button);
    function update(){if(closed)return;button.hidden=!map.isConnected||!map.getClientRects().length||getComputedStyle(map).visibility==='hidden';if(button.hidden)return;var r=map.getBoundingClientRect(),p=frame.getBoundingClientRect();button.style.setProperty('left',(r.right-p.left-frame.clientLeft+frame.scrollLeft-button.offsetWidth-8)+'px','important');button.style.setProperty('top',(r.bottom-p.top-frame.clientTop+frame.scrollTop-button.offsetHeight-8)+'px','important');}
    function schedule(){if(closed||layoutFrame)return;layoutFrame=requestAnimationFrame(function(){layoutFrame=0;update();});}
    var ro=root.ResizeObserver?new ResizeObserver(schedule):null;if(ro){ro.observe(map);ro.observe(frame);ro.observe(button);}var appearance=new MutationObserver(schedule);appearance.observe(map,{attributes:true,attributeFilter:['class','style','hidden']});
    function dispose(){if(closed)return;closed=true;if(layoutFrame)cancelAnimationFrame(layoutFrame);if(ro)ro.disconnect();appearance.disconnect();life.disconnect();root.removeEventListener('resize',schedule);button.remove();record.count--;if(!record.count){if(record.added)frame.classList.remove('harbor-control-host');controlHosts.delete(frame);}}
    var life=new MutationObserver(function(){if(!map.isConnected)dispose();});life.observe(document.body,{childList:true,subtree:true});root.addEventListener('resize',schedule);schedule();return {update:schedule,dispose:dispose};
  }
  var sceneBuild='';try{sceneBuild=new URL(document.currentScript.src).searchParams.get('build')||'';}catch(ignore){}
  function sceneAsset(file){return 'media/'+file+(sceneBuild?'?build='+encodeURIComponent(sceneBuild):'');}
  function eveningScene(map,chart){
    if(!eveningLoader)eveningLoader=new Promise(function(resolve){
      var style=document.createElement('link'),script=document.createElement('script'),settled=false,timer=setTimeout(fail,15000);
      function fail(){if(settled)return;settled=true;clearTimeout(timer);style.remove();script.remove();eveningLoader=null;resolve(null);}
      style.rel='stylesheet';style.href=sceneAsset('history-evening.css');style.onerror=fail;
      script.src=sceneAsset('history-evening.js');script.onerror=fail;
      style.onload=function(){if(!settled)document.head.appendChild(script);};
      script.onload=function(){if(settled)return;if(!root.HanqHistoryEvening){fail();return;}settled=true;clearTimeout(timer);resolve(root.HanqHistoryEvening);};
      document.head.appendChild(style);
    });
    eveningLoader.then(function(engine){if(engine&&map.isConnected&&chart.isConnected)engine.mount(map,chart);});
  }
  function livingWater(chart,art,kind){
    if(!waterLoader)waterLoader=new Promise(function(resolve){var s=document.createElement('script');s.src='media/island-living-water.js?v=palace-motion-2'+(sceneBuild?'&build='+encodeURIComponent(sceneBuild):'');s.onload=function(){resolve(root.HanqLivingWater);};s.onerror=function(){waterLoader=null;resolve(null);};document.head.appendChild(s);});
    waterLoader.then(function(engine){if(!chart.isConnected)return;if(engine){engine.mount(chart,art,kind);return;}var host=chart.parentElement;if(chart.dataset.motionRetry==='true')return;chart.dataset.motionRetry='true';var retry=document.createElement('button');retry.type='button';retry.className='harbor-motion-toggle';retry.textContent='움직임 다시 불러오기';var position=attachControl(host,retry);retry.addEventListener('click',function(){delete chart.dataset.motionRetry;position.dispose();livingWater(chart,art,kind);});});
  }
  var stops={
    history:[{id:'homePastExams',icon:'gate',x:49,y:30,mx:52.5,my:19.75},{id:'homeFormalExams',icon:'flag',x:82.25,y:45.75,mx:75.5,my:56.5},{id:'homeWrongNotes',icon:'review',x:18.25,y:45.25,mx:20.5,my:41.75}],
    toeic:[{id:'notebook',icon:'book',x:84,y:21,mx:26,my:17},{id:'wrongnotes',icon:'review',x:27,y:55,mx:26,my:52},{id:'grammar',icon:'notes',x:57,y:33,mx:73,my:34},{id:'player',icon:'audio',x:80,y:55,mx:73,my:70}]
  };
  // Source-coordinate building silhouettes: one existing native destination
  // control covers each landmark, so route handlers and keyboard semantics stay.
  var landmarks={
    homePastExams:{name:'시대별 학습 궁',wide:[.34,.12,.64,.48],tall:[.26,.095,.79,.30]},
    homeFormalExams:{name:'모의고사장',wide:[.66,.265,.985,.65],tall:[.52,.43,.99,.70]},
    homeWrongNotes:{name:'오답노트 정자',wide:[.065,.285,.30,.62],tall:[.025,.305,.385,.53]}
  };
  // One decorative layer tree, driven by CSS time. The art and click targets never move.
  // Share WorldScene's visibility/low-power state and observe only this layer's viewport.
  function atmosphere(host,kind){
    var layer=document.createElement('span');layer.className='scene-atmosphere';layer.dataset.scene=kind;layer.setAttribute('aria-hidden','true');
    var html='<span class="scene-weather"><i class="scene-cloud scene-cloud-far"></i><i class="scene-cloud scene-cloud-near"></i><i class="scene-sunlight"></i><i class="scene-overcast"></i><span class="scene-rain">';
    for(var i=0;i<18;i++)html+='<i style="--drop-x:'+((i*37+9)%100)+'%;--drop-y:'+((i*23)%100)+'%;--delay:'+(-i*.137)+'s"></i>';
    html+='</span></span><span class="scene-mist"></span><span class="scene-water">';
    for(var j=0;j<8;j++)html+='<i style="--ripple-x:'+((j*29+8)%88)+'%;--ripple-y:'+((j*43+12)%85)+'%;--delay:'+(-j*.71)+'s"></i>';
    html+='</span><span class="scene-leaves">';
    for(var k=0;k<5;k++)html+='<i style="--leaf-x:'+((k*31+6)%95)+'%;--delay:'+(-k*3.7)+'s;--drift:'+(24+k*11)+'px"></i>';
    layer.innerHTML=html+'</span>';host.appendChild(layer);
    // Initial pause avoids a frame of animation before intersection is known.
    layer.classList.add('scene-offscreen');
    var io=root.IntersectionObserver?new IntersectionObserver(function(entries){entries.forEach(function(e){layer.classList.toggle('scene-offscreen',!e.isIntersecting);});},{threshold:0.01}):null;
    if(io)io.observe(layer);else layer.classList.remove('scene-offscreen');
    var cleanup=new MutationObserver(function(){if(!host.isConnected){if(io)io.disconnect();cleanup.disconnect();}});cleanup.observe(document.body,{childList:true,subtree:true});
    return layer;
  }
  function enhance(map){
    if(map.classList.contains('island-harbors'))return;
    var kind=map.classList.contains('history-travel-map')?'history':'toeic';
    var controls=Array.from(map.children).filter(function(n){return n.matches('button,a');});
    if(!controls.length)return;
    map.classList.add('island-harbors');map.dataset.harborIsland=kind;
    // Remove the old shared route, including its unlinked fourth history waypoint.
    map.querySelectorAll('.world-map-trail,.world-map-scale').forEach(function(n){n.remove();});
    var chart=document.createElement('picture');chart.className='harbor-chart';chart.setAttribute('aria-hidden','true');
    var source=document.createElement('source');source.media=kind==='history'?'(max-width:700px) and (orientation:portrait)':'(max-width:700px)';source.srcset=sceneAsset('world-art/'+(kind==='history'?'history-palace-tall-v1.webp':kind+'-harbors-mobile-v1.webp'));chart.appendChild(source);
    var art=document.createElement('img');art.src=sceneAsset('world-art/'+(kind==='history'?'history-palace-wide-v1.webp':kind+'-v1.webp'));art.alt='';art.width=1672;art.height=941;art.decoding='async';chart.appendChild(art);map.prepend(chart);atmosphere(chart,kind);livingWater(chart,art,kind);
    if(kind==='history'){eveningScene(map,chart);var guide=document.createElement('span');guide.className='harbor-chart-caption';guide.textContent='시간의 숲길';guide.setAttribute('aria-hidden','true');map.appendChild(guide);}
    controls.forEach(function(control,i){
      var key=control.dataset.toeicView||control.id,stop=stops[kind].find(function(s){return s.id===key;});
      if(!stop)return;
      control.classList.add('harbor-stop');control.style.setProperty('--pin-x',stop.x);control.style.setProperty('--pin-y',stop.y);control.style.setProperty('--mobile-x',stop.mx);control.style.setProperty('--mobile-y',stop.my);
      var label=control.querySelector('strong,.wn-entry-t'),place=control.querySelector('.world-place-name');
      if(kind==='history'&&landmarks[key]){control.classList.add('history-landmark');control.dataset.landmark=key;control.setAttribute('aria-label',landmarks[key].name);control.removeAttribute('title');}
      if(label){label.id='harbor-'+kind+'-'+key+'-label';if(!control.hasAttribute('aria-label'))control.setAttribute('aria-labelledby',label.id);}
      if(place){place.id='harbor-'+kind+'-'+key+'-place';control.setAttribute('aria-describedby',place.id);}
      var sign=document.createElement('span');sign.className='harbor-sign';if(label)sign.appendChild(label);if(place)sign.appendChild(place);control.appendChild(sign);
      var pin=document.createElement('span');pin.className='harbor-pin';pin.innerHTML=icon(stop.icon);pin.setAttribute('aria-hidden','true');control.prepend(pin);
      control.addEventListener('pointerdown',function(){map.querySelectorAll('.harbor-selected').forEach(function(n){n.classList.remove('harbor-selected');});control.classList.add('harbor-selected');});
    });
    if(kind==='toeic'&&root.HanqEnglishIsland){root.HanqEnglishIsland.enhance(map,chart,art,controls);return;}
    // Preserve the source aspect ratio, center the camera on the actual waypoints,
    // and keep text plaques inside the viewport while retaining the larger touch controls.
    function fitScene(){
      if(!map.isConnected)return;
      var w=map.clientWidth,h=map.clientHeight,mobile=matchMedia(kind==='history'?'(max-width:700px) and (orientation:portrait)':'(max-width:700px)').matches,nativeWidth=mobile?900:kind==='toeic'?1671:1672,nativeHeight=mobile?1200:941,points=stops[kind],xs=points.map(function(p){return mobile?p.mx:p.x;}),ys=points.map(function(p){return mobile?p.my:p.y;}),cx=(Math.min.apply(null,xs)+Math.max.apply(null,xs))/200,cy=(Math.min.apply(null,ys)+Math.max.apply(null,ys))/200;
      // Very short landscape windows retain the pond and boat instead of
      // cropping every moving part out of the visible camera.
      var coverScale=Math.max(w/nativeWidth,h/nativeHeight),roofY=mobile ? .095 : .12,boatBottom=mobile ? .928 : .889,contain=kind==='history'&&(h-8)<(boatBottom-roofY)*nativeHeight*coverScale,scale=contain?Math.min(w/nativeWidth,h/nativeHeight):coverScale,iw=nativeWidth*scale,ih=nativeHeight*scale,ox=contain?(w-iw)/2:Math.max(w-iw,Math.min(0,w/2-iw*cx)),oy=contain?(h-ih)/2:Math.max(h-ih,Math.min(0,(h-66)/2-ih*cy));
      if(kind==='history'&&!contain)oy=Math.max(4-ih*roofY,Math.min(h-4-ih*boatBottom,oy));
      chart.style.left=ox+'px';chart.style.top=oy+'px';chart.style.width=iw+'px';chart.style.height=ih+'px';map.dataset.sceneFit=contain?'contain':'cover';
      controls.forEach(function(control){
        var key=control.dataset.toeicView||control.id,stop=points.find(function(x){return x.id===key;});if(!stop)return;
        if(kind==='history'&&landmarks[key]){
          var rect=landmarks[key][mobile?'tall':'wide'],left=Math.max(4,ox+iw*rect[0]),top=Math.max(4,oy+ih*rect[1]),right=Math.min(w-4,ox+iw*rect[2]),bottom=Math.min(h-4,oy+ih*rect[3]);
          var width=Math.max(44,right-left),height=Math.max(44,bottom-top);left=Math.min(w-width-4,Math.max(4,left));top=Math.min(h-height-4,Math.max(4,top));
          control.style.setProperty('left',left+'px','important');control.style.setProperty('top',top+'px','important');control.style.setProperty('width',width+'px','important');control.style.setProperty('height',height+'px','important');
        }else{
          var halfControl=control.offsetWidth/2,x=Math.max(halfControl+4,Math.min(w-halfControl-4,ox+iw*(mobile?stop.mx:stop.x)/100)),y=Math.max(4,Math.min(h-control.offsetHeight-4,oy+ih*(mobile?stop.my:stop.y)/100));control.style.setProperty('left',x+'px','important');control.style.setProperty('top',y+'px','important');var sign=control.querySelector('.harbor-sign');if(sign){var half=sign.offsetWidth/2,signLeft=x-half,signRight=x+half,shift=signLeft<4?4-signLeft:signRight>w-4?w-4-signRight:0;sign.style.transform='translateX('+shift+'px)';}
        }
      });
      if(kind==='history'&&contain){var ordered=controls.filter(function(n){return n.classList.contains('history-landmark');}).sort(function(a,b){return parseFloat(a.style.left)-parseFloat(b.style.left);}),edge=4;ordered.forEach(function(n){var left=Math.max(edge,parseFloat(n.style.left));n.style.setProperty('left',left+'px','important');edge=left+parseFloat(n.style.width)+5;});var excess=edge-5-(w-4);if(excess>0)ordered.forEach(function(n){n.style.setProperty('left',(parseFloat(n.style.left)-excess)+'px','important');});}
    }
    art.addEventListener('load',fitScene);var fitObserver=root.ResizeObserver?new ResizeObserver(fitScene):null;if(fitObserver){fitObserver.observe(map);controls.forEach(function(n){var sign=n.querySelector('.harbor-sign');if(sign)fitObserver.observe(sign);});}var detached=new MutationObserver(function(){if(!map.isConnected){if(fitObserver)fitObserver.disconnect();detached.disconnect();art.removeEventListener('load',fitScene);}});detached.observe(document.body,{childList:true,subtree:true});fitScene();
    map.addEventListener('pointerleave',function(){map.querySelectorAll('.harbor-selected').forEach(function(n){n.classList.remove('harbor-selected');});});
  }
  root.HanqIslandHarbors={enhance:enhance,atmosphere:atmosphere,attachControl:attachControl};
})(window);
