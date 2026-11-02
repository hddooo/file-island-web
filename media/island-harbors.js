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
  var stops={
    history:[{id:'homePastExams',icon:'gate',x:47,y:28,mx:50,my:18},{id:'homeFormalExams',icon:'flag',x:23,y:45,mx:26,my:42},{id:'homeWrongNotes',icon:'review',x:66,y:59,mx:71,my:66}],
    toeic:[{id:'notebook',icon:'book',x:84,y:21,mx:26,my:17},{id:'wrongnotes',icon:'review',x:27,y:55,mx:26,my:52},{id:'grammar',icon:'notes',x:57,y:33,mx:73,my:34},{id:'player',icon:'audio',x:80,y:55,mx:73,my:70}]
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
    var source=document.createElement('source');source.media='(max-width:700px)';source.srcset='media/world-art/'+kind+'-harbors-mobile-v1.webp';chart.appendChild(source);
    var art=document.createElement('img');art.src='media/world-art/'+kind+'-v1.webp';art.alt='';art.width=1672;art.height=942;art.decoding='async';chart.appendChild(art);map.prepend(chart);atmosphere(chart,kind);
    if(kind==='history'){var guide=document.createElement('span');guide.className='harbor-chart-caption';guide.textContent='시간의 숲길';guide.setAttribute('aria-hidden','true');map.appendChild(guide);}
    controls.forEach(function(control,i){
      var key=control.dataset.toeicView||control.id,stop=stops[kind].find(function(s){return s.id===key;});
      if(!stop)return;
      control.classList.add('harbor-stop');control.style.setProperty('--pin-x',stop.x);control.style.setProperty('--pin-y',stop.y);control.style.setProperty('--mobile-x',stop.mx);control.style.setProperty('--mobile-y',stop.my);
      var label=control.querySelector('strong,.wn-entry-t'),place=control.querySelector('.world-place-name');
      if(label){label.id='harbor-'+kind+'-'+key+'-label';if(!control.hasAttribute('aria-label'))control.setAttribute('aria-labelledby',label.id);}
      if(place){place.id='harbor-'+kind+'-'+key+'-place';control.setAttribute('aria-describedby',place.id);}
      var sign=document.createElement('span');sign.className='harbor-sign';if(label)sign.appendChild(label);if(place)sign.appendChild(place);control.appendChild(sign);
      var pin=document.createElement('span');pin.className='harbor-pin';pin.innerHTML=icon(stop.icon);pin.setAttribute('aria-hidden','true');control.prepend(pin);
      control.addEventListener('pointerdown',function(){map.querySelectorAll('.harbor-selected').forEach(function(n){n.classList.remove('harbor-selected');});control.classList.add('harbor-selected');});
    });
    // Preserve the source aspect ratio, center the camera on the actual waypoints,
    // and keep text plaques inside the viewport while retaining the larger touch controls.
    function fitScene(){if(!map.isConnected)return;var w=map.clientWidth,h=map.clientHeight,mobile=matchMedia('(max-width:700px)').matches,nativeWidth=mobile?900:kind==='toeic'?1671:1672,nativeHeight=mobile?1200:941,points=stops[kind],xs=points.map(function(p){return mobile?p.mx:p.x;}),ys=points.map(function(p){return mobile?p.my:p.y;}),cx=(Math.min.apply(null,xs)+Math.max.apply(null,xs))/200,cy=(Math.min.apply(null,ys)+Math.max.apply(null,ys))/200,scale=Math.max(w/nativeWidth,h/nativeHeight),iw=nativeWidth*scale,ih=nativeHeight*scale,ox=Math.max(w-iw,Math.min(0,w/2-iw*cx)),oy=Math.max(h-ih,Math.min(0,(h-66)/2-ih*cy));
     chart.style.left=ox+'px';chart.style.top=oy+'px';chart.style.width=iw+'px';chart.style.height=ih+'px';controls.forEach(function(control){var key=control.dataset.toeicView||control.id,stop=points.find(function(x){return x.id===key;});if(!stop)return;var halfControl=control.offsetWidth/2,x=Math.max(halfControl+4,Math.min(w-halfControl-4,ox+iw*(mobile?stop.mx:stop.x)/100)),y=Math.max(4,Math.min(h-control.offsetHeight-4,oy+ih*(mobile?stop.my:stop.y)/100));control.style.setProperty('left',x+'px','important');control.style.setProperty('top',y+'px','important');var sign=control.querySelector('.harbor-sign');if(sign){var half=sign.offsetWidth/2,left=x-half,right=x+half,shift=left<4?4-left:right>w-4?w-4-right:0;sign.style.transform='translateX('+shift+'px)';}});}
    art.addEventListener('load',fitScene);var fitObserver=root.ResizeObserver?new ResizeObserver(fitScene):null;if(fitObserver){fitObserver.observe(map);controls.forEach(function(n){var sign=n.querySelector('.harbor-sign');if(sign)fitObserver.observe(sign);});}var detached=new MutationObserver(function(){if(!map.isConnected){if(fitObserver)fitObserver.disconnect();detached.disconnect();art.removeEventListener('load',fitScene);}});detached.observe(document.body,{childList:true,subtree:true});fitScene();
    map.addEventListener('pointerleave',function(){map.querySelectorAll('.harbor-selected').forEach(function(n){n.classList.remove('harbor-selected');});});
  }
  root.HanqIslandHarbors={enhance:enhance,atmosphere:atmosphere};
})(window);
