/* Same-era verified source crops only; no accounts, answer writes, or generated artifacts. */
(function(){'use strict';var root=document.querySelector('[data-artifact-era]');if(!root)return;
var era=root.getAttribute('data-artifact-era'),all=[],items=[],at=0;
var select=root.querySelector('.artifact-country'),prev=root.querySelector('.artifact-prev'),next=root.querySelector('.artifact-next'),image=root.querySelector('.artifact-photo');
prev.disabled=true;next.disabled=true;
function paint(){var x=items[at];if(!x)return;image.src=x.src.replace(/^media\//,'');image.alt=x.name+' · '+x.feature;root.querySelector('.artifact-name').textContent=x.name;root.querySelector('.artifact-period').textContent=x.country+' · '+x.period;root.querySelector('.artifact-feature').textContent=x.feature;root.querySelector('.artifact-caution').textContent=x.caution||'';var link=root.querySelector('.artifact-source');link.textContent='사진 출처 · '+x.source.title+(x.source.url?' ↗':'');if(x.source.url)link.href=x.source.url;else link.removeAttribute('href');root.querySelector('.artifact-position').textContent=(at+1)+' / '+items.length;prev.disabled=at===0;next.disabled=at===items.length-1;}
function move(n){if(!items.length)return;at=Math.max(0,Math.min(items.length-1,at+n));paint();}
prev.addEventListener('click',function(){move(-1)});next.addEventListener('click',function(){move(1)});select.addEventListener('change',function(){items=all.filter(function(x){return !select.value||x.country===select.value});at=0;paint()});
root.addEventListener('keydown',function(e){if(e.target.tagName==='SELECT')return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowLeft'?-1:1)}});
var start=null;image.addEventListener('touchstart',function(e){start=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{passive:true});image.addEventListener('touchend',function(e){if(!start)return;var t=e.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);start=null},{passive:true});image.addEventListener('touchcancel',function(){start=null},{passive:true});
if(typeof fetch!=='function'){root.querySelector('.artifact-position').textContent='사진 목록을 불러올 수 없는 환경이에요.';return;}
fetch('culture-gallery.json').then(function(r){if(!r.ok)throw Error('gallery unavailable');return r.json()}).then(function(d){all=d[era]||[];items=all;paint()}).catch(function(){root.querySelector('.artifact-position').textContent='사진 목록을 불러오지 못했어요. 새로고침해 주세요.';prev.disabled=true;next.disabled=true});
})();
