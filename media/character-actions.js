/* Keep the existing portrait until a full idle atlas has decoded. No frame loop. */
(function(root){'use strict';var ids=['botamon','koromon','metalgreymon','wargreymon'],pending=new Map(),mq=root.matchMedia('(prefers-reduced-motion: reduce)');
function scan(){if(mq.matches)return;ids.forEach(function(id){if(pending.has(id)||!document.querySelector('.pet-life[data-stage="'+id+'"],.hanq-idle--'+id))return;var img=new Image(),ready=new Promise(function(resolve,reject){img.onload=resolve;img.onerror=reject;});img.src=new URL('media/characters/'+id+'-idle-actions-v1.png',document.baseURI).href;pending.set(id,ready.then(function(){return img.decode?img.decode():null;}).then(function(){document.documentElement.classList.add('hanq-idle-ready-'+id);},function(){/* The unchanged PNG remains usable on a failed download. */}));});}
function start(){scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});if(mq.addEventListener)mq.addEventListener('change',scan);else if(mq.addListener)mq.addListener(scan);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
