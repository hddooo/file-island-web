/* Accessible connection indicator. Transport truth is supplied by battle-island only. */
(function(root){'use strict';var serial=0;
function mount(title){
 var wrap=document.createElement('span');wrap.className='bi-connection';title.after(wrap);
 var button=document.createElement('button');button.type='button';button.className='bi-connection-toggle';button.setAttribute('aria-expanded','false');
 var lamp=document.createElement('span');lamp.className='bi-connection-lamp';lamp.setAttribute('aria-hidden','true');button.appendChild(lamp);wrap.appendChild(button);
 var detail=document.createElement('span');detail.id='bi-connection-detail-'+(++serial);detail.className='bi-connection-detail';detail.setAttribute('role','tooltip');wrap.appendChild(detail);button.setAttribute('aria-describedby',detail.id);
 var live=document.createElement('span');live.className='bi-connection-live';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');wrap.appendChild(live);
 var last='',labels={connecting:'연결 확인 중',connected:'연결됨',disconnected:'연결 끊김'},symbols={connecting:'…',connected:'✓',disconnected:'!'};
 function close(){wrap.classList.remove('is-open');button.setAttribute('aria-expanded','false');}
 // Below the title can sit under the device's scroll edge; bring the explanation into view when asked for.
 // Keep the explanation on screen sideways wherever the title wraps.
 function place(){var w=wrap.getBoundingClientRect(),width=detail.offsetWidth,vw=document.documentElement.clientWidth,left=Math.max(12-w.left,Math.min(0,vw-12-width-w.left));wrap.style.setProperty('--bi-detail-left',Math.round(left)+'px');}
 function reveal(){place();if(!detail.scrollIntoView)return;var r=detail.getBoundingClientRect(),c=wrap.closest('.device-content'),edge=c?c.getBoundingClientRect().bottom:root.innerHeight;if(r.bottom>edge)detail.scrollIntoView({block:'nearest',behavior:root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
 button.onclick=function(){var open=wrap.classList.toggle('is-open');button.setAttribute('aria-expanded',String(open));if(open)reveal();};
 button.addEventListener('focus',function(){place();if(button.matches(':focus-visible'))reveal();});
 wrap.addEventListener('pointerenter',place);
 wrap.addEventListener('keydown',function(e){if(e.key==='Escape'){close();e.stopPropagation();}});
 button.addEventListener('blur',close);
 return {update:function(state,message){
  wrap.hidden=false;wrap.dataset.state=state;var text=labels[state]+' · '+message;
  lamp.textContent=symbols[state];detail.textContent=text;button.setAttribute('aria-label','얼음섬 연결 상태: '+labels[state]+'. 설명 보기');
  if(text!==last){live.textContent=text;last=text;}
 },hide:function(){wrap.hidden=true;close();live.textContent='';last='';},dispose:function(){wrap.remove();}};
}
root.HanqBattleConnection={mount:mount};
})(window);
