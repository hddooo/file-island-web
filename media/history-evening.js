/* Decorative palace evening. Existing land, water, native destinations and all
   learning/account state remain owned by their original modules. */
(function(root){
  'use strict';
  var reduced=matchMedia('(prefers-reduced-motion: reduce)'),preference=false;
  function mount(map,chart){
    if(!map||!chart||map.dataset.historyEvening)return;
    map.dataset.historyEvening='true';
    var layer=document.createElement('span');layer.className='history-evening he-paused';layer.setAttribute('aria-hidden','true');
    var rain='';for(var i=0;i<22;i++)rain+='<i style="--x:'+((i*37+7)%100)+'%;--y:'+((i*29)%100)+'%;--delay:'+(-i*.173)+'s"></i>';
    layer.innerHTML='<span class="he-night"></span><span class="he-sky"><i class="he-aurora he-aurora-a"></i><i class="he-aurora he-aurora-b"></i><span class="he-stars"></span></span><span class="he-clouds"></span><span class="he-rain">'+rain+'</span><span class="he-camp"><span class="he-warmth"></span><svg class="he-chairs" viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="140" cy="135" rx="122" ry="18" fill="#141b20" opacity=".55"/><g stroke="#cab893" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M29 68 65 140M70 65 27 141M209 65 252 141M254 68 218 140"/><path d="M23 54 68 51 78 96 40 104Z" fill="#335a5c" stroke="#9cb3a2"/><path d="m203 51 47 3-17 50-39-8Z" fill="#645a48" stroke="#b6ad8c"/><path d="m40 104 38-8 9 9-40 10ZM194 96l39 8-7 11-41-10Z" fill="#263e40"/><path d="m17 89 23 8m25-12 20 4m110 0 20-4m25 12 23-8"/></g><g stroke="#251c18" stroke-width="3"><path d="m112 131 49-13 10 8-51 14Z" fill="#715038"/><path d="m116 117 47 17-2 9-51-18Z" fill="#946241"/><ellipse cx="143" cy="141" rx="34" ry="7" fill="#242c29"/><path d="m107 139 8-6 8 9 10-4 10 6 11-8 12 6 9-6" stroke="#89918a" stroke-width="7"/></g></svg><span class="he-fire"><i class="he-flame he-flame-a"></i><i class="he-flame he-flame-b"></i><i class="he-flame he-flame-c"></i><i class="he-ember he-ember-a"></i><i class="he-ember he-ember-b"></i><i class="he-ember he-ember-c"></i></span><span class="he-friend"><span class="he-friend-sprite"></span><svg class="he-leaf" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><path d="M8 32C18 2 62-4 94 12 83 34 48 47 8 32Z" fill="#75a95c" stroke="#c6d68b" stroke-width="2"/><path d="m12 32 72-18M51 23l3 33M35 26l-5-13m28 7 10 10" fill="none" stroke="#315b39" stroke-width="2.5" stroke-linecap="round"/></svg></span></span>';
    chart.appendChild(layer);
    var friend=layer.querySelector('.he-friend'),image=new Image();image.onload=function(){Promise.resolve(image.decode?image.decode():null).then(function(){if(friend.isConnected)friend.classList.add('he-ready');},function(){});};image.src='media/characters/agumon-idle-sprite.png';
    var closed=false,visible=false,away=false,layoutFrame=0;
    var toggle=document.createElement('button');toggle.type='button';toggle.hidden=true;toggle.className='history-evening-toggle';toggle.setAttribute('aria-label','모닥불과 날씨 움직임');
    var frame=map.parentElement,added=getComputedStyle(frame).position==='static';if(added)frame.classList.add('history-evening-host');if(!map.id)map.id='history-evening-map';toggle.setAttribute('aria-controls',map.id);frame.appendChild(toggle);
    function place(){if(closed)return;toggle.hidden=!map.getClientRects().length||getComputedStyle(map).visibility==='hidden';if(toggle.hidden)return;var parent=toggle.offsetParent||frame,a=map.getBoundingClientRect(),b=parent.getBoundingClientRect();toggle.style.left=(a.left-b.left-parent.clientLeft+parent.scrollLeft+8)+'px';toggle.style.top=(a.bottom-b.top-parent.clientTop+parent.scrollTop-toggle.offsetHeight-8)+'px';}
    function position(){if(closed||layoutFrame)return;layoutFrame=requestAnimationFrame(function(){layoutFrame=0;place();});}
    var ro=root.ResizeObserver?new ResizeObserver(position):null;if(ro){ro.observe(map);ro.observe(frame);ro.observe(toggle);}
    var control={update:position,dispose:function(){if(ro)ro.disconnect();if(layoutFrame)cancelAnimationFrame(layoutFrame);layoutFrame=0;root.removeEventListener('resize',position);toggle.remove();if(added)frame.classList.remove('history-evening-host');}};root.addEventListener('resize',position);
    function sync(){if(closed)return;var moving=!preference&&!reduced.matches;layer.classList.toggle('he-paused',!moving||!visible||document.hidden||away);layer.dataset.motion=reduced.matches?'reduced':preference?'paused':!visible||document.hidden||away?'offscreen':'active';toggle.setAttribute('aria-pressed',String(moving));toggle.disabled=reduced.matches;toggle.innerHTML='<span aria-hidden="true">'+(moving?'Ⅱ':'▶')+'</span> 모닥불과 날씨';toggle.title=reduced.matches?'기기의 동작 줄이기 설정에 따라 멈췄습니다.':moving?'모닥불과 날씨 움직임을 멈춥니다.':'모닥불과 날씨 움직임을 켭니다.';control.update();}
    toggle.addEventListener('click',function(){preference=!preference;sync();});
    var io=root.IntersectionObserver?new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;sync();},{threshold:.01}):null;if(io)io.observe(map);else visible=true;
    function hide(){away=true;sync();}function show(){away=false;sync();}
    function dispose(){if(closed)return;closed=true;if(io)io.disconnect();life.disconnect();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);root.removeEventListener('pagehide',hide);root.removeEventListener('pageshow',show);control.dispose();layer.remove();}
    // DeviceShell can reparent the whole view after this module has mounted.
    // Measure the button's current containing block rather than the old frame.
    var life=new MutationObserver(function(){if(!map.isConnected)dispose();else position();});life.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);root.addEventListener('pagehide',hide);root.addEventListener('pageshow',show);sync();
  }
  root.HanqHistoryEvening={mount:mount};
})(window);
