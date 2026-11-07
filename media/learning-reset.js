/* Owner-scoped, non-destructive wrong-answer visibility reset. Source rows and correct answers stay intact. */
(function(root){
'use strict';
var UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,cache=Object.create(null),listeners=[],pending=null,seen=null;
function identity(api){var s=api&&api.state();return s&&s.signedIn&&!s.restoring&&s.user&&UUID.test(s.user.id||'')&&s.ownerId===s.user.id?s.user.id+':'+String(s.epoch||0):null;}
function owner(api){var life=identity(api);return life?life.slice(0,36):null;}
function valid(d){return !!d&&typeof d.available==='boolean'&&['history','toeic'].every(function(k){return d[k]&&(d[k].resetAt===null||typeof d[k].resetAt==='string'&&Number.isFinite(Date.parse(d[k].resetAt)));});}
function saved(id){if(!id)return null;if(cache[id])return cache[id];try{var d=JSON.parse(root.localStorage.getItem('hanq:wrong-reset:v1:'+id));if(valid(d))cache[id]=d;}catch(_){}return cache[id]||null;}
function emit(){listeners.slice().forEach(function(fn){try{fn();}catch(_){}});if(root.HanqProgress&&root.HanqProgress.store)root.HanqProgress.store.invalidate();}
function accept(api,d){if(!valid(d))throw Error('invalid_response');var id=owner(api);if(!id)return;var prev=saved(id),next=JSON.parse(JSON.stringify(d));if(prev)['history','toeic'].forEach(function(k){if(Date.parse(prev[k].resetAt)> (Date.parse(next[k].resetAt)||0))next[k]=prev[k];});cache[id]=next;try{root.localStorage.setItem('hanq:wrong-reset:v1:'+id,JSON.stringify(next));}catch(_){}emit();return next;}
function refresh(api){var life=identity(api);if(!life||!api.learningResets)return Promise.resolve(null);if(pending&&pending.life===life)return pending.promise;var promise=Promise.resolve().then(function(){return api.learningResets();}).then(function(d){if(identity(api)!==life)throw Error('session_changed');return accept(api,d);}).finally(function(){if(pending&&pending.promise===promise)pending=null;});pending={life:life,promise:promise};return promise;}
function cutoff(id,island){if(!UUID.test(id||'')||['history','toeic'].indexOf(island)<0)return 0;var d=saved(id);return d&&Date.parse(d[island].resetAt)||0;}
function hiddenAttempt(a){return !!a&&a.correct===false&&Number.isFinite(a.ts)&&a.ts<=cutoff(a.ownerId,a.subject||'history');}
function projectPractice(r,id){var at=cutoff(id,'toeic');if(!r||!r.wrong||!at||(Number.isFinite(r.lastAt)&&r.lastAt>at))return r;return Object.assign({},r,{wrong:false,lastOptionId:null,resetAt:at});}
function watch(fn){listeners.push(fn);return function(){listeners=listeners.filter(function(x){return x!==fn;});};}
function describe(d){return d&&d.available===false&&d.reason==='reset_consistency_pending'?'초기화 기능 준비 중입니다. 기록은 변경하지 않습니다.':'초기화 기능을 사용할 수 없습니다. 기존 기록은 보존됩니다.';}
function mount(host,api){var doc=host.ownerDocument,life=identity(api),alive=true,off,ready=false,busy=false,buttons=[];host.replaceChildren();
function el(tag,text){var n=doc.createElement(tag);n.textContent=text;host.appendChild(n);return n;}
function current(){return alive&&host.isConnected&&life&&identity(api)===life;}
function disable(v){buttons.forEach(function(b){b.disabled=v;});}
var title=el('h3','섬별 오답 기록 초기화');title.id='acLearningResetTitle';host.setAttribute('aria-labelledby',title.id);
el('p','선택한 섬의 이전 오답 항목·누적 오답·나의 기록에 표시되는 오답 풀이만 초기화합니다. XP, 일반 정답 풀이와 정답 재풀이, 원본, 단어장, 다른 섬은 보존합니다. 교재 원본 오답 분류·PDF·음원 목록은 유지됩니다.');
['history','toeic'].forEach(function(island){var label=island==='history'?'역사섬':'영어섬',b=el('button',label+' 오답 초기화');b.type='button';b.className='tool-btn';b.disabled=true;buttons.push(b);b.onclick=async function(){
if(!current()||!ready||busy)return;
if(!root.confirm(label+'의 지금까지 쌓인 오답 항목·누적 오답과 나의 기록의 오답 풀이를 초기화할까요?\nXP·정답 풀이·정답 재풀이·문제 원본·단어장·다른 섬은 보존합니다. 교재 원본 오답 분류·PDF·음원 목록은 유지됩니다.\n원본을 영구 삭제하지 않지만 화면에서 되돌리기는 지원하지 않습니다.'))return;
if(!current())return;busy=true;disable(true);status.textContent='초기화 결과를 확인하고 있어요.';
try{var requestId=root.crypto&&root.crypto.randomUUID&&root.crypto.randomUUID();if(!UUID.test(requestId||''))throw Error('uuid_unavailable');var d=await api.resetLearning({island:island,confirmation:island==='history'?'RESET_HISTORY':'RESET_TOEIC',requestId:requestId});if(!current())return;if(!valid(d)||!d[island].resetAt)throw Error('invalid_response');accept(api,d);status.textContent=label+' 오답 기록을 초기화했어요. XP와 정답 기록은 그대로예요.';if(root.HanqMyRecords&&root.HanqMyRecords.refresh)root.HanqMyRecords.refresh();}
catch(_){if(current()){ready=false;status.textContent='초기화 결과를 확인하지 못했어요. 다시 누르지 말고 마이페이지를 다시 열어 상태를 확인해 주세요.';}}
finally{busy=false;if(current())disable(!ready);}
};});
var status=el('p',life?'초기화 지원 여부를 확인하고 있어요.':'로그인한 계정에서만 사용할 수 있어요.');status.setAttribute('role','status');
if(api&&api.onChange)off=api.onChange(function(){if(identity(api)!==life&&alive){alive=false;disable(true);status.textContent='계정이 바뀌었어요. 마이페이지를 다시 열어 주세요.';}});
if(life)refresh(api).then(function(d){if(!current())return;ready=valid(d)&&d.available===true&&d.scope==='wrong_answers_only'&&typeof api.resetLearning==='function';disable(!ready);status.textContent=ready?'초기화할 섬을 선택하세요. 누르기 전에 다시 확인합니다.':describe(d);},function(){if(current())status.textContent='초기화 기능 지원 여부를 확인하지 못했어요. 기록은 변경되지 않았습니다.';});
return function(){alive=false;if(typeof off==='function')off();};}
function stalePending(api,island,p){var id=owner(api),at=id&&cutoff(id,island);return !!(id&&at&&p&&(Date.parse(p.resetAt)||0)!==at);}
function restartPending(api,island,entries,apply){var life=identity(api),id=owner(api);if(!life||!Array.isArray(entries)||!entries.length||!entries.every(function(p){return stalePending(api,island,p);}))return false;
if(!root.confirm('초기화 이전 대기 답안을 보관하고 새로 풀까요? 기존 답안은 보관되며 자동 제출하지 않습니다. 보기를 다시 선택한 뒤 정답 확인을 눌러 주세요.'))return false;
if(identity(api)!==life)return false;
try{var k='hanq:reset-pending-archive:v1:'+id+':'+root.crypto.randomUUID(),v=JSON.stringify({island:island,archivedAt:new Date().toISOString(),entries:entries});root.localStorage.setItem(k,v);if(root.localStorage.getItem(k)!==v)return false;if(identity(api)!==life)return false;apply();return true;}catch(_){return false;}}
var exported={stalePending:stalePending,restartPending:restartPending,token:function(id,island){var n=cutoff(id,island);return n?new Date(n).toISOString():undefined;},mount:mount,identity:identity,describe:describe,refresh:refresh,cutoff:cutoff,hiddenAttempt:hiddenAttempt,projectPractice:projectPractice,onChange:watch,_accept:accept};
if(typeof module!=='undefined'&&module.exports)module.exports=exported;
if(typeof window!=='undefined'){root.HanqLearningReset=exported;var api=root.HanqApi;if(api){var check=function(){var life=identity(api);if(life!==seen){seen=life;emit();if(life)refresh(api).catch(function(){});}};api.onChange(check);check();root.addEventListener('focus',function(){refresh(api).catch(function(){});});root.addEventListener('storage',function(e){if(e.key&&e.key.indexOf('hanq:wrong-reset:v1:')===0){delete cache[e.key.slice('hanq:wrong-reset:v1:'.length)];emit();refresh(api).catch(function(){});}});}}
})(typeof window!=='undefined'?window:globalThis);