/* Read-only, owner-scoped finalized exam materials. Never saves local review answers. */
(function(root){'use strict';
var UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function normalize(data,round){
 if(!data||data.scope!=='exam-starred-or-ever-wrong'||data.round!==round||!Array.isArray(data.items)||data.items.length>50||data.hasMore!==false||!Number.isInteger(data.pendingStarCount)||data.pendingStarCount<0)throw Error('materials_incomplete');
 var seen=new Set(),items=[];
 data.items.forEach(function(q){
  var v=q&&q.review,opts=q&&q.options,base=q&&'/api/v1/cbt/runs/'+q.runId+'/questions/'+q.position;
  if(!q||q.exam!==round||!Number.isInteger(q.number)||q.number<1||q.number>50||q.questionId!=='exam-'+round+'-'+String(q.number).padStart(2,'0')||typeof q.version!=='string'||!q.version||!UUID.test(q.runId)||!Number.isInteger(q.position)||q.position<0||q.position>49||![1,2,3].includes(q.points)||typeof q.starred!=='boolean'||typeof q.everWrong!=='boolean'||!q.starred&&!q.everWrong||!v||!['wrong','correct','unanswered'].includes(v.status)||!Array.isArray(opts)||opts.length!==5||new Set(opts.map(function(o){return o&&o.id;})).size!==5||opts.some(function(o,i){return !o||typeof o.id!=='string'||!o.id||o.number!==i+1;})||!Number.isInteger(v.correctNumber)||v.correctNumber<1||v.correctNumber>5||opts[v.correctNumber-1].id!==v.correctOptionId||q.selectedOptionId!==null&&!opts.some(function(o){return o.id===q.selectedOptionId;})||v.status!==(q.selectedOptionId===null?'unanswered':q.selectedOptionId===v.correctOptionId?'correct':'wrong')||q.image!==base+'/image')throw Error('materials_incomplete');
  if(q.common&&(!Array.isArray(q.common.questionNumbers)||!q.common.questionNumbers.includes(q.number)||q.common.questionNumbers.some(function(n){return !Number.isInteger(n)||n<1||n>50;})||q.common&&q.common.image!==base+'/common'))throw Error('materials_incomplete');
  var saved=v.item;if(saved&&(saved.id!==q.questionId||saved.v!==q.version||saved.exam!==q.exam||saved.number!==q.number||saved.points!==q.points||saved.answer!==v.correctNumber||!Array.isArray(saved.options)||saved.options.length!==5||saved.options.some(function(o,i){return !o||o.id!==opts[i].id;})))throw Error('materials_incomplete');
  if(seen.has(q.questionId))throw Error('materials_incomplete');seen.add(q.questionId);items.push(q);
 });
 return {items:items.sort(function(a,b){return a.number-b.number;}),rejected:0,hasMore:false,pendingStarCount:data.pendingStarCount,resetAt:data.resetAt||null};
}
function identity(api){var s=api.state();return s&&s.signedIn&&!s.restoring&&s.ownerId!=null?String(s.ownerId)+':'+String(s.epoch||0):null;}
async function load(options){var token=identity(options.api);if(!token)throw Error('session_changed');var data=await options.api.cbt('GET','/api/v1/cbt/review-materials/'+options.round);if(identity(options.api)!==token||options.isCurrent&&!options.isCurrent())throw Error('session_changed');return normalize(data,options.round);}
function sourceLines(q){var saved=null;try{saved=root.HanqCbtExplanations&&root.HanqCbtExplanations.resolve(q,'final');}catch(_){}saved=saved||q.review.item||{};var o=saved.overview||{},lines=Array.isArray(o.reason)?o.reason.slice(0,2):[];lines=lines.concat([o.answer,saved.why,saved.explanation]).filter(function(v){return typeof v==='string'&&v.trim();});return Array.from(new Set(lines));}
function mount(host,options){
 var api=options.api,token=identity(api),alive=true,urls=[],off,resetOff,items=[],index=0,selected={},data;
 function current(){return alive&&host.isConnected&&identity(api)===token;}
 function el(tag,text){var e=host.ownerDocument.createElement(tag);if(text!=null)e.textContent=text;return e;}
 function clear(){urls.forEach(function(u){root.URL.revokeObjectURL(u);});urls=[];host.replaceChildren();}
 function button(label,fn){var b=el('button',label);b.type='button';b.className='tool-btn';b.onclick=function(){if(current())fn();};return b;}
 function stop(){if(!alive)return;alive=false;if(off)off();if(resetOff)resetOff();clear();}
 async function image(q,path,box,version){try{var blob=await api.cbtImage(path);if(!current()||index!==version||!box.isConnected)return;if(!blob||!/^image\/(png|jpeg|webp)$/.test(blob.type))throw Error();var u=root.URL.createObjectURL(blob);urls.push(u);var img=el('img');img.src=u;img.alt='제'+q.exam+'회 '+q.number+'번 원본 문제';img.style.maxWidth='100%';img.onerror=function(){if(current()&&box.isConnected)box.appendChild(el('p','원본 이미지를 표시하지 못했어요.'));};box.appendChild(img);}catch(_){if(current()&&index===version&&box.isConnected)box.appendChild(el('p','원본 이미지를 불러오지 못했어요.'));}}
 function draw(){
  if(!current())return;clear();host.appendChild(el('h2','제'+options.round+'회 오답 & 별표 문제 복습'));
  host.appendChild(el('p','점수·XP·나의 기록·실전 기록을 남기지 않는 복습입니다.'));
  host.appendChild(el('p','완료한 실전모의고사 자료만 이용할 수 있어요. 진행 중 시험의 별표는 실전모의고사 완료 후 이용할 수 있어요.'));
  host.appendChild(button('회차 목록',function(){stop();if(options.onBack)options.onBack();}));
  if(!items.length){host.appendChild(el('p','이 회차에 이용할 수 있는 오답·별표 문제가 없어요.'));return;}
  var q=items[index],box=el('div');host.appendChild(el('h3',(index+1)+' / '+items.length+' · 원문 '+q.number+'번'));host.appendChild(box);
  if(q.common){var commonBox=el('div');box.appendChild(commonBox);image(q,q.common.image,commonBox,index);}var questionBox=el('div');box.appendChild(questionBox);image(q,q.image,questionBox,index);
  var choices=el('div'),answer=el('div');answer.hidden=true;
  q.options.forEach(function(o){var b=button(String(o.number),function(){selected[q.questionId]=o.id;Array.from(choices.children).forEach(function(c){c.setAttribute('aria-pressed',String(c===b));});answer.hidden=true;});b.setAttribute('aria-pressed',String(selected[q.questionId]===o.id));choices.appendChild(b);});host.appendChild(choices);
  host.appendChild(button('정답·해설 확인하기',async function(){
    // Re-check reset generation before revealing a stale loaded collection.
    try{var fresh=await load({api:api,round:options.round,isCurrent:current});if(!current())return;if(fresh.resetAt!==data.resetAt){data=fresh;items=fresh.items;index=0;selected={};draw();return;}}catch(_){if(current())answer.replaceChildren(el('p','자료 상태를 확인하지 못했어요. 다시 열어 주세요.'));answer.hidden=false;return;}
    answer.replaceChildren(el('p','정답 '+q.review.correctNumber+'번'+(selected[q.questionId]?' · 내 선택 '+q.options.find(function(o){return o.id===selected[q.questionId];}).number+'번':'')));
    var lines=sourceLines(q);if(!lines.length)lines=['원천 자료에 확인된 해설이 없어요. 해설을 추정해 만들지 않았어요.'];lines.forEach(function(t){answer.appendChild(el('p',t.replace(/\*\*/g,'')));});answer.hidden=false;
  }));host.appendChild(answer);
  var prev=button('이전',function(){index--;draw();}),next=button('다음',function(){index++;draw();});prev.disabled=index===0;next.disabled=index===items.length-1;host.appendChild(prev);host.appendChild(next);
 }
 clear();host.appendChild(el('p','오답·별표 자료를 확인하고 있어요…'));
 off=api.onChange?api.onChange(function(){if(!current())stop();}):null;
 resetOff=root.HanqLearningReset&&root.HanqLearningReset.onChange?root.HanqLearningReset.onChange(function(){if(!current())return;stop();host.appendChild(el('p','초기화 상태가 변경되어 복습을 닫았어요. 회차를 다시 선택해 주세요.'));var back=el('button','회차 목록');back.type='button';back.className='tool-btn';back.onclick=function(){if(options.onBack)options.onBack();};host.appendChild(back);}):null;
 var ready=load({api:api,round:options.round,isCurrent:current}).then(function(r){if(current()){data=r;items=r.items;draw();}return r;},function(){if(current()){clear();host.appendChild(el('p','자료를 모두 확인하지 못했어요. 다시 열어 주세요.'));host.appendChild(button('회차 목록',function(){stop();if(options.onBack)options.onBack();}));}});
 return {ready:ready,stop:stop};
}
root.HanqCbtRoundMaterials={normalize:normalize,load:load,mount:mount,sourceLines:sourceLines};
})(window);