/* Site-wide battle invitations: any signed-in page can receive an invitation, outside the ice island.
 * Inert unless the server supports site presence (POST /battle/presence); older servers keep the island-only flow.
 * One stream per tab: this owns it everywhere except #battle, where the island owns it and shows its own dialog.
 * The popup only overlays the page: answers, inputs, timers and scroll of the current screen are never touched. */
(function(root){'use strict';
var REASONS={
 outgoing:{declined:'님이 대전 신청을 거절했어요.',expired:'님이 10초 안에 응답하지 않아 신청이 만료됐어요.',busy:'님이 다른 대전을 시작했어요.',offline:'님이 접속을 종료해 신청이 취소됐어요.',cancelled:'님에게 보낸 신청을 취소했어요.'},
 incoming:{cancelled:'님이 대전 신청을 취소했어요.',expired:'님의 대전 신청이 만료됐어요.',busy:'님이 다른 대전을 시작해 신청이 취소됐어요.',offline:'님이 접속을 종료해 신청이 취소됐어요.',declined:'님의 대전 신청을 거절했어요.'}
};
function outcomeText(item){var table=REASONS[item&&item.direction]||{},tail=table[item&&item.reason];return tail?item.name+tail:'';}
var suspended=false,generation=0,pendingReads=new Set(),routeTimer=0;
var api=null,supported=null,probing=null,sessionId=null,stopStream=null,heartbeat=0,reconnect=0,backoff=1000,offset=0,owner=null;
var invitations=[],seenClosed=new Set(),dialog=null,dialogKey='',busy=false,ticker=0,returnFocus=null,toastNode=null,toastTimer=0,started=false,releaseBackground=null,unloading=false;
function onIsland(){return /^#battle(?:\/|$)/.test(root.location.hash);}
function signedIn(){var s=api&&api.state&&api.state();return !!(!suspended&&s&&s.signedIn&&!s.restoring);}
function now(){return Date.now()+offset;}
function tabSession(){if(sessionId)return sessionId;try{sessionId=root.sessionStorage.getItem('hanq:battle-site-session:v1');}catch(_){}
 if(!sessionId||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(sessionId)){sessionId=root.crypto.randomUUID();try{root.sessionStorage.setItem('hanq:battle-site-session:v1',sessionId);}catch(_){}}return sessionId;}
function call(method,path,data,options){var owned=method==='GET'||path==='/presence',guarded=owned||/^\/matches\/[^/]+\/(?:accept|decline)$/.test(path),requestOwner=owner,epoch=generation,controller=owned&&root.AbortController?new root.AbortController():null;if(controller){pendingReads.add(controller);options=Object.assign({},options,{signal:controller.signal});}function aborted(){return {name:'ApiError',status:0,code:'aborted'};}return Promise.resolve().then(function(){if(guarded&&(suspended||unloading||epoch!==generation||requestOwner!==owner))throw aborted();return api.battle(method,path,method==='GET'?undefined:data||{},options);}).then(function(d){if(owned&&(suspended||epoch!==generation))throw aborted();return d;}).finally(function(){if(controller)pendingReads.delete(controller);});}
function cancelPending(){generation++;busy=false;clearTimeout(toastTimer);toastTimer=0;if(toastNode)toastNode.remove();toastNode=null;clearTimeout(routeTimer);routeTimer=0;clearInterval(heartbeat);heartbeat=0;closeStream();pendingReads.forEach(function(c){c.abort();});pendingReads.clear();probing=null;}

function sync(d){if(d&&typeof d.serverNow==='number')offset=d.serverNow-Date.now();}
// Presence lease: one per tab, renewed while HanQ is open; the server merges tabs of one account.
function beat(){if(!signedIn()||!supported)return Promise.resolve();return call('POST','/presence',{sessionId:tabSession(),place:onIsland()?'island':'site'}).then(sync);}
// Capability check is read-only: older servers (404) and any response without the inbox shape leave this layer off.
function probe(){if(supported!==null||probing)return probing||Promise.resolve();var epoch=generation,job=call('GET','/invitations').then(function(d){if(epoch!==generation||suspended)return;supported=!!(d&&typeof d.serverNow==='number'&&Array.isArray(d.invitations));if(supported)return beat().then(function(){if(epoch===generation&&!suspended)receive(d);});},function(){if(epoch===generation&&!suspended)supported=false;}).catch(function(){/* A temporary presence failure does not revoke a confirmed capability. */}).then(function(){if(probing===job)probing=null;});probing=job;return job;}

function closeStream(){clearTimeout(reconnect);reconnect=0;if(stopStream){var s=stopStream;stopStream=null;s();}}
function openStream(){if(unloading||stopStream||!supported||!signedIn()||onIsland()||!api.battleStream)return;var mine=null;
 mine=api.battleStream(function(event,d){if(stopStream!==mine)return;backoff=1000;if(event==='invitations')receive(d);},function(e){if(stopStream!==mine)return;stopStream=null;
  if(e&&e.status===401){if(api.ensureSession)Promise.resolve(api.ensureSession(true)).then(schedule,function(){});return;}schedule();},tabSession(),'site');stopStream=mine;}
function schedule(){clearTimeout(reconnect);if(!signedIn()||!supported||onIsland())return;reconnect=setTimeout(function(){reconnect=0;openStream();},backoff);backoff=Math.min(backoff*2,30000);}
// Background tabs can miss pushes: re-read server state on return and keep only still-valid invitations.
function refresh(){if(!supported||!signedIn())return Promise.resolve();var epoch=generation,who=owner;return call('GET','/invitations').then(function(d){if(epoch===generation&&who===owner&&!suspended)receive(d);},function(){});}
function receive(d){if(!d||suspended)return;sync(d);invitations=(d.invitations||[]).filter(function(i){return i.expiresAt>now();});
 (d.closed||[]).forEach(function(c){if(seenClosed.has(c.id))return;seenClosed.add(c.id);if(onIsland())return;var text=outcomeText(c);if(text&&!(c.direction==='outgoing'&&c.reason==='cancelled'))toast(text);});
 render();}
function toast(text){if(!toastNode){toastNode=document.createElement('p');toastNode.className='hbi-toast';toastNode.setAttribute('role','status');toastNode.setAttribute('aria-live','polite');document.body.appendChild(toastNode);}
 toastNode.textContent=text;toastNode.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(function(){if(toastNode)toastNode.hidden=true;},6000);}
function current(){var live=invitations.filter(function(i){return i.expiresAt>now();}),incoming=live.filter(function(i){return i.direction==='incoming';}),outgoing=live.filter(function(i){return i.direction==='outgoing';});
 var keep=dialog&&live.find(function(i){return i.id===dialog.dataset.invite;});return {item:keep&&(keep.direction==='incoming'||!incoming.length)?keep:incoming[0]||outgoing[0]||null,incoming:incoming};}
function render(){if(!signedIn()||onIsland()){hide();return;}var c=current();if(busy)return;if(!c.item){hide();return;}var key=c.item.id+':'+c.item.direction+':'+c.incoming.length;if(dialog&&dialogKey===key){tick();return;}show(c.item,c.incoming);dialogKey=key;}
function hide(){clearInterval(ticker);ticker=0;if(!dialog){if(releaseBackground){releaseBackground();releaseBackground=null;}return;}var d=dialog;dialog=null;dialogKey='';d.remove();if(releaseBackground){releaseBackground();releaseBackground=null;}if(returnFocus&&returnFocus.isConnected)try{returnFocus.focus({preventScroll:true});}catch(_){}returnFocus=null;}
function show(item,incoming){var had=!!dialog;if(had){dialog.remove();}else returnFocus=document.activeElement;var received=item.direction==='incoming';
 dialog=document.createElement('div');dialog.className='hbi-overlay';dialog.dataset.invite=item.id;dialog.dataset.direction=item.direction;
 var box=document.createElement('section');box.className='hbi-dialog';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-labelledby','hbi-title');box.setAttribute('aria-describedby','hbi-detail');dialog.appendChild(box);
 var h=document.createElement('h2');h.id='hbi-title';h.textContent=received?item.name+'님이 대전을 신청했습니다. 수락하시겠습니까?':item.name+'님에게 대전을 신청했습니다. 상대 수락을 기다리는 중입니다.';box.appendChild(h);
 var p=document.createElement('p');p.id='hbi-detail';p.textContent=(item.subject==='history'?'한국사':'TOEIC')+(received&&incoming.length>1?' · 뒤에 '+(incoming.length-1)+'개의 신청이 더 있어요.':'')+' · 수락해야 대결을 시작해요. 지금 화면은 그대로예요.';box.appendChild(p);
 var timer=document.createElement('strong');timer.className='hbi-countdown';timer.setAttribute('role','timer');timer.setAttribute('aria-label','남은 시간');box.appendChild(timer);
 var status=document.createElement('p');status.className='hbi-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');box.appendChild(status);
 var actions=document.createElement('div');actions.className='hbi-actions';box.appendChild(actions);
 function button(text,cls,fn){var b=document.createElement('button');b.type='button';b.className='tool-btn '+cls;b.textContent=text;b.onclick=fn;actions.appendChild(b);return b;}
 var yes=received?button('수락','hbi-accept',function(){accept(item,status);}):null,no=button(received?'거절':'신청 취소','hbi-decline',function(){answer(item,status);});
 box.onkeydown=function(e){if(e.key==='Escape'){e.preventDefault();answer(item,status);}if(e.key==='Tab'){var list=[yes,no].filter(Boolean),i=list.indexOf(document.activeElement);e.preventDefault();list[(i+(e.shiftKey?list.length-1:1))%list.length].focus();}};
 document.body.appendChild(dialog);var app=document.getElementById('app');if(!releaseBackground)releaseBackground=root.HanqUiLocks.acquire(app);(yes||no).focus({preventScroll:true});clearInterval(ticker);ticker=setInterval(tick,250);tick();}
function tick(){if(!dialog)return;var item=invitations.find(function(i){return i.id===dialog.dataset.invite;}),left=item?Math.max(0,Math.ceil((item.expiresAt-now())/1000)):0,t=dialog.querySelector('.hbi-countdown');if(t)t.textContent='남은 시간 '+left+'초';
 if(!item||left<=0){if(busy)return;invitations=invitations.filter(function(i){return i!==item;});render();}}
function lock(on){busy=on;if(dialog)dialog.querySelectorAll('button').forEach(function(b){b.disabled=on;});}
function currentAction(epoch,who){return epoch===generation&&who===owner&&signedIn();}
function answer(item,status){if(busy)return;var epoch=generation,who=owner;lock(true);Promise.resolve().then(function(){if(!currentAction(epoch,who))return;return call('POST','/matches/'+item.id+'/decline');}).then(function(){if(!currentAction(epoch,who))return;lock(false);invitations=invitations.filter(function(i){return i.id!==item.id;});status.textContent='';render();refresh();},function(){if(!currentAction(epoch,who))return;lock(false);status.textContent='거절을 확인하지 못했어요. 다시 시도해 주세요.';});}
// Accept: apply the existing save/leave confirmation first; enter the battle only if the server confirms it.
function accept(item,status){if(busy)return;var epoch=generation,who=owner;lock(true);var library=root.HanqSemanticLibrary;
 Promise.resolve(library&&library.hasUnsaved&&library.hasUnsaved()?library.prepareLeave():null).then(function(){
  if(!currentAction(epoch,who))throw {stale:true};if(item.expiresAt<=now())throw {expired:true};return call('POST','/matches/'+item.id+'/accept');
 }).then(function(d){if(!currentAction(epoch,who))return;lock(false);if(d&&['ready','playing','between'].includes(d.status)){invitations=[];hide();root.location.hash='#battle/'+d.id;return;}
  invitations=invitations.filter(function(i){return i.id!==item.id;});toast('신청이 이미 끝났어요. 지금 화면은 그대로예요.');render();refresh();
 },function(e){if(!currentAction(epoch,who))return;lock(false);if(e&&e.expired){invitations=invitations.filter(function(i){return i.id!==item.id;});toast('확인하는 동안 신청이 만료됐어요. 지금 화면은 그대로예요.');render();refresh();return;}
  if(!e||e.status===undefined){status.textContent='저장을 마치지 못해 화면에 머물렀어요.';return;}
  invitations=invitations.filter(function(i){return i.id!==item.id;});toast(e.status===409?'신청이 이미 끝났거나 상대가 다른 대결 중이에요.':'수락하지 못했어요. 지금 화면은 그대로예요.');render();refresh();});}
function route(){if(!started||suspended||unloading)return;clearTimeout(routeTimer);if(onIsland()){closeStream();hide();beat().catch(function(){});return;}routeTimer=setTimeout(function(){routeTimer=0;if(supported&&signedIn()&&!onIsland()){openStream();refresh();}},50);}
function identity(){if(suspended||unloading)return;var s=api.state(),next=s&&s.signedIn?s.ownerId||(s.user&&s.user.id):null;if(next===owner&&s&&!s.restoring)return;if(s&&s.restoring)return;
 cancelPending();owner=next;hide();invitations=[];supported=null;
 if(!owner)return;var epoch=generation;probe().then(function(){if(epoch!==generation||!supported||!signedIn())return;heartbeat=setInterval(function(){beat().catch(function(){});},10000);if(!onIsland()){openStream();refresh();}});}
function visible(){if(unloading||document.hidden||!supported||!signedIn())return;beat().catch(function(){});refresh();if(!onIsland()&&!stopStream)openStream();}
// Back online: renew presence, re-read server state and reconnect now instead of waiting out the backoff.
function online(){if(unloading||!supported||!signedIn())return;backoff=1000;beat().catch(function(){});refresh();if(!onIsland()){clearTimeout(reconnect);reconnect=0;if(!stopStream)openStream();}}
// Stop queued reads before WebKit invalidates their document during navigation.
function beforeunload(){unloading=true;cancelPending();}
function focus(){if(!unloading||suspended||document.hidden)return;unloading=false;owner=null;supported=null;identity();}
function pagehide(){var notify=supported&&signedIn();suspended=true;cancelPending();hide();if(notify)call('POST','/suspend',{sessionId:tabSession()},{keepalive:true}).catch(function(){});}
function pageshow(){unloading=false;if(!suspended)return;suspended=false;owner=null;supported=null;var epoch=generation,resume=function(){if(epoch===generation&&!suspended)identity();};if(api.ensureSession)Promise.resolve(api.ensureSession(false)).then(resume,resume);else resume();}

function start(apiRef){if(started||!apiRef||!apiRef.battle||!apiRef.state)return;api=apiRef;started=true;
 root.addEventListener('hashchange',route);document.addEventListener('visibilitychange',visible);root.addEventListener('beforeunload',beforeunload);root.addEventListener('focus',focus);root.addEventListener('pagehide',pagehide);root.addEventListener('pageshow',pageshow);root.addEventListener('online',online);
 if(api.onChange)api.onChange(identity);identity();}
root.HanqBattleInvites={start:start,outcomeText:outcomeText,toast:toast,state:function(){return {supported:supported,stream:!!stopStream,invitations:invitations.slice(),dialog:dialog?dialog.dataset.invite:null};}};
if(root.HanqApi)start(root.HanqApi);else document.addEventListener('DOMContentLoaded',function(){if(root.HanqApi)start(root.HanqApi);});
})(window);
