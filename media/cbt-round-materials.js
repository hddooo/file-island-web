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
async function load(options){
 var token=identity(options.api),all=options.round==='all';if(!token)throw Error('session_changed');
 var data=await options.api.cbt('GET',all?'/api/v1/cbt/notebook':'/api/v1/cbt/review-materials/'+options.round);
 if(identity(options.api)!==token||options.isCurrent&&!options.isCurrent())throw Error('session_changed');
 if(!all)return normalize(data,options.round);
 if(!root.HanqCbtWrongNotebook)throw Error('materials_unavailable');
 var n=root.HanqCbtWrongNotebook.normalize(data);
 if(n.hasMore||n.rejected)throw Error('materials_incomplete');
 var owner=options.api.state().ownerId,reset=root.HanqLearningReset&&root.HanqLearningReset.token&&root.HanqLearningReset.token(owner,'history');
 return {items:n.items.slice().sort(function(a,b){return a.exam-b.exam||a.number-b.number;}),resetAt:data.resetAt||reset||null};
}
function sourceLines(q){var saved=null;try{saved=root.HanqCbtExplanations&&root.HanqCbtExplanations.resolve(q,'final');}catch(_){}var o=saved&&root.HanqCbtExplanations.groundedOverview?root.HanqCbtExplanations.groundedOverview(saved):null;saved=saved||q.review.item||{};o=o||saved.overview||{};var lines=Array.isArray(o.reason)?o.reason.slice(0,2):[];lines=lines.concat([o.answer,saved.why,saved.explanation]).filter(function(v){return typeof v==='string'&&v.trim();});return Array.from(new Set(lines));}
function choiceNotes(q){
 var entry=null;try{entry=root.HanqCbtExplanations&&root.HanqCbtExplanations.resolve(q,'final');}catch(_){}
 var opts=(entry||q.review.item||{}).options||[];
 return q.options.map(function(option,i){
  var ref=opts[i],raw=ref&&ref.id===option.id&&Array.isArray(ref.review)&&ref.review.find(function(x){return typeof x==='string'&&x.trim();});
  if(!raw)return '확인된 해설 없음';
  var facts=raw.replace(/\*\*/g,'').replace(/\s+/g,' ').trim(),colon=facts.indexOf(': ');
  if(colon>0)facts=facts.slice(0,colon);
  else facts=facts.split(/[.!?](?: |$)/)[0];
  return facts.replace(/ — /g,' · ');
 });
}
function progressKey(owner,round){return owner==null?null:'hanq:round-material-rehearsal:v1:'+encodeURIComponent(String(owner))+':'+round;}
function latest(owner,round){
 var key=progressKey(owner,round),r;
 try{r=key&&JSON.parse(root.localStorage.getItem(key+':latest')||'null');}catch(_){return null;}
 if(!r||!Number.isInteger(r.right)||!Number.isInteger(r.total)||r.total<1||r.total>50||r.right<0||r.right>r.total||typeof r.marked!=='boolean'||!Number.isFinite(Date.parse(r.at)))return null;
 var cutoff=root.HanqLearningReset&&root.HanqLearningReset.cutoff&&root.HanqLearningReset.cutoff(String(owner),'history');
 return cutoff&&(Date.parse(r.resetAt)||0)<cutoff?null:r;
}
function mount(host,options){
 var api=options.api,token=identity(api),alive=true,urls=[],off,resetOff,allItems=[],items=[],index=0,selected={},data,submitted=false,storageFailed=false,markedOnly=false,marks=new Set();
 var owner=api.state()&&api.state().ownerId,key=progressKey(owner,options.round);
 var marksKey=key&&progressKey(owner,'all')+':shared-double-stars',all=options.round==='all';
 function questionSet(rows){return JSON.stringify((rows||items).map(function(q){return [q.questionId,q.version,q.options.map(function(o){return o.id;})];}));}
 function save(){
  if(!current()||!key||!items.length)return;
  try{root.localStorage.setItem(key+(markedOnly?':double-star-practice':''),JSON.stringify({resetAt:data.resetAt,questionSet:questionSet(),index:index,selected:selected,submitted:submitted}));storageFailed=false;}catch(_){storageFailed=true;}
 }
 function restore(){
  if(!current()||!key||!items.length)return;
  try{
   var saved=JSON.parse(root.localStorage.getItem(key+(markedOnly?':double-star-practice':''))||'null');
   if(!saved||saved.resetAt!==data.resetAt||saved.questionSet!==questionSet())return;
   if(Number.isInteger(saved.index)&&saved.index>=0&&saved.index<items.length)index=saved.index;
   if(saved.selected&&typeof saved.selected==='object')items.forEach(function(q){var answer=saved.selected[q.questionId];if(q.options.some(function(o){return o.id===answer;}))selected[q.questionId]=answer;});
   submitted=saved.submitted===true&&Object.keys(selected).length>0;
  }catch(_){}
 }
 function readMarks(){
  var saved=marksKey&&JSON.parse(root.localStorage.getItem(marksKey)||'null');
  return saved&&(Date.parse(saved.resetAt)||0)===(Date.parse(data.resetAt)||0)&&Array.isArray(saved.items)?saved.items:[];
 }
 function loadMarks(){
  marks=new Set();markedOnly=false;
  try{
   var saved=readMarks();
   allItems.forEach(function(q){if(saved.some(function(m){return Array.isArray(m)&&m[0]===q.questionId&&m[1]===q.version;}))marks.add(q.questionId);});
   markedOnly=key&&root.localStorage.getItem(key+':double-star-mode')==='1';
  }catch(_){}
 }
 function saveMarks(){
  if(!current()||!marksKey)return;
  try{
   var here=new Set(allItems.map(function(q){return q.questionId;}));
   var outside=readMarks().filter(function(m){return Array.isArray(m)&&typeof m[0]==='string'&&!here.has(m[0]);});
   var present=allItems.filter(function(q){return marks.has(q.questionId);}).map(function(q){return [q.questionId,q.version];});
   root.localStorage.setItem(marksKey,JSON.stringify({resetAt:data.resetAt,items:outside.concat(present)}));
   root.localStorage.setItem(key+':double-star-mode',markedOnly?'1':'0');storageFailed=false;
  }catch(_){storageFailed=true;}
 }
 function showMode(){
  items=markedOnly?allItems.filter(function(q){return marks.has(q.questionId);}):allItems;
  index=0;selected={};submitted=false;restore();if(submitted)score();else draw();
 }
 function icon(){
  var pair=section('span','fe-round-double-star');
  pair.setAttribute('aria-hidden','true');pair.append(el('span','★'),el('span','★'));return pair;
 }
 function current(){return alive&&host.isConnected&&identity(api)===token;}
 function el(tag,text){var e=host.ownerDocument.createElement(tag);if(text!=null)e.textContent=text;return e;}
 function clear(keep){if(!keep){urls.forEach(function(u){if(root.HanqLearningReader&&root.HanqLearningReader.releaseImage)root.HanqLearningReader.releaseImage(u);root.URL.revokeObjectURL(u);});urls=[];}host.replaceChildren();}
 function button(label,fn){var b=el('button',label);b.type='button';b.className='tool-btn';b.onclick=function(){if(current())fn();};return b;}
 function stop(){if(!alive)return;alive=false;if(off)off();if(resetOff)resetOff();clear();}
 async function image(q,path,box,version){try{var blob=await api.cbtImage(path);if(!current()||index!==version||!box.isConnected)return;if(!blob||!/^image\/(png|jpeg|webp)$/.test(blob.type))throw Error();var u=root.URL.createObjectURL(blob);urls.push(u);var img=el('img');img.className='mock-image';img.setAttribute('data-company-exam-image','');img.src=u;img.alt='제'+q.exam+'회 '+q.number+'번 원본 문제';img.style.maxWidth='100%';img.onerror=function(){if(current()&&box.isConnected)box.appendChild(el('p','제'+q.exam+'회 '+q.number+'번 원본 이미지를 표시하지 못했어요. 회차를 다시 열어 주세요. 계속 실패하면 이 문항의 원본 연결을 복구해 주세요.'));};box.appendChild(img);}catch(_){if(current()&&index===version&&box.isConnected)box.appendChild(el('p','제'+q.exam+'회 '+q.number+'번 원본 이미지를 불러오지 못했어요. 회차를 다시 열어 주세요. 계속 실패하면 이 문항의 원본 연결·접근 상태를 복구해 주세요.'));}}
 function section(tag,cls,text){var e=el(tag,text);e.className=cls;return e;}
 function resetChanged(){
  if(!current()||!data)return false;
  var resets=root.HanqLearningReset;
  var known=resets&&resets.cutoff?resets.cutoff(String(owner),'history'):0;
  // onChange also fires when focus/session hydration re-reads the same cutoff.
  if(!Number.isFinite(known)||known<=(Date.parse(data.resetAt)||0))return false;
  stop();host.appendChild(el('p','초기화 상태가 변경되어 복습을 닫았어요. 회차를 다시 선택해 주세요.'));
  var back=el('button','회차 목록');back.type='button';back.className='tool-btn';
  back.onclick=function(){if(options.onBack)options.onBack();};host.appendChild(back);
  return true;
 }
 function reset(fresh){data=fresh;if(resetChanged())return;allItems=fresh.items;loadMarks();showMode();}
 async function currentMaterials(){
  var fresh=await load({api:api,round:options.round,isCurrent:current});
  if(!current())return false;
  if((Date.parse(fresh.resetAt)||0)!==(Date.parse(data.resetAt)||0)||questionSet(fresh.items)!==questionSet(allItems)){reset(fresh);return false;}
  return true;
 }
 function header(){
  host.appendChild(el('h2',all?'전체 오답 다시 풀기':'제'+options.round+'회 오답 & 별표 문제 복습'));
  host.appendChild(el('p','XP와 실전 점수는 바뀌지 않아요. 풀이와 결과는 이 기기에만 저장돼요.'));
  if(storageFailed)host.appendChild(el('p','이 기기에 저장하지 못했어요. 화면을 닫기 전까지는 계속 풀 수 있어요.'));
  host.appendChild(el('p',all?'완료한 실전모의고사에서 실제로 틀린 문제만 모았어요.':'완료한 실전모의고사 자료만 이용할 수 있어요. 진행 중 시험의 별표는 실전모의고사 완료 후 이용할 수 있어요.'));
  var tools=section('div','fe-round-review-top-actions');
  tools.appendChild(button('회차 목록',function(){stop();if(options.onBack)options.onBack();}));
  if(allItems.length){
   var filter=button(markedOnly?'전체 다시 보기':'쌍별만 다시 보기 ('+marks.size+')',function(){save();markedOnly=!markedOnly;saveMarks();showMode();});
   filter.dataset.roundStarFilter='';filter.setAttribute('aria-pressed',String(markedOnly));if(!markedOnly)filter.prepend(icon());tools.appendChild(filter);
  }
  host.appendChild(tools);
 }
 function countRight(){return items.reduce(function(n,q){return n+(selected[q.questionId]===q.review.correctOptionId?1:0);},0);}
 function saveLatest(){
  if(!current()||!key||all)return;
  try{root.localStorage.setItem(key+':latest',JSON.stringify({right:countRight(),total:items.length,marked:markedOnly,at:new Date().toISOString(),resetAt:data.resetAt}));}catch(_){storageFailed=true;}
 }
 function goalMeter(){
  var meter=section('div','fe-round-review-quest'),needed=Math.ceil(items.length*.9),right=countRight(),bar=el('progress');
  bar.max=needed;bar.value=Math.min(right,needed);bar.setAttribute('aria-label','90% 목표 진행');
  meter.append(el('b',right>=needed?'90% 목표 달성':'90% 목표'),bar,el('span',Math.min(right,needed)+' / '+needed));return meter;
 }
 function score(){
  if(!current()||!items.length)return;clear();header();
  var right=0,wrong=0,empty=0,table=section('section','fe-round-review-result');
  var heading=el('h3','복습 결과');heading.tabIndex=-1;table.appendChild(heading);
  var list=section('ul','fe-round-review-breakdown');
  items.forEach(function(q){
   var chosen=selected[q.questionId],ok=chosen===q.review.correctOptionId;
   if(!chosen)empty++;else if(ok)right++;else wrong++;
   var row=section('li',!chosen?'is-empty':ok?'is-correct':'is-wrong');
   row.append(el('span',(all?'제'+q.exam+'회 ':'')+q.number+'번'),el('strong',!chosen?'미풀이':ok?'O 정답':'X 오답'));list.appendChild(row);
  });
  var percent=String(Number((right/items.length*100).toFixed(2)));
  table.append(el('p','정답률 '+percent+'%'),el('p','정답 '+right+' · 오답 '+wrong+' · 미풀이 '+empty+' · 전체 '+items.length),list);
  var reached=right*10>=items.length*9;
  var goal=section('div','fe-round-review-goal '+(reached?'is-reached':'is-retry'));
  if(reached){var badge=el('span','🏆');badge.setAttribute('aria-hidden','true');goal.appendChild(badge);}
  else{var patamon=el('img');patamon.src='/media/characters/patamon-crying-v1.webp';patamon.alt='';patamon.width=40;patamon.height=40;goal.appendChild(patamon);}
  goal.appendChild(el('p',reached?(all?'목표 90% 달성! 전체 오답 복습을 마쳤어요.':'목표 90% 달성! 다음 회차로 넘어가도 돼요.'):'목표 90% 미달. 같은 문제를 다시 풀어요.'));table.appendChild(goal);
  var actions=section('div','fe-round-review-result-actions');
  actions.appendChild(button(reached?(all?'회차 목록으로':'다음 회차 선택'):'다시 풀기',function(){
   if(reached){stop();if(options.onBack)options.onBack();return;}
   selected={};submitted=false;index=0;save();draw(true);
  }));
  actions.appendChild(button('풀이 돌아보기',function(){submitted=false;index=0;save();draw(true);}));
  table.appendChild(actions);
  host.appendChild(table);heading.focus();
 }
 function draw(focus,preservedImage){
  if(!current())return;clear(preservedImage);header();
  if(!items.length){host.appendChild(el('p',markedOnly?'쌍별로 표시한 문제가 없어요.':'이 회차에 이용할 수 있는 오답·별표 문제가 없어요.'));return;}
  var q=items[index],at=index,chosen=selected[q.questionId],box=preservedImage||el('div'),heading=el('h3',(index+1)+' / '+items.length+' · '+(all?'제'+q.exam+'회 ':'원문 ')+q.number+'번');
  heading.tabIndex=-1;
  var titleRow=section('div','fe-round-review-heading');
  var mark=button('',function(){
   if(marks.has(q.questionId))marks.delete(q.questionId);else marks.add(q.questionId);
   saveMarks();updateMark();
  });
  mark.classList.add('fe-round-review-mark');mark.appendChild(icon());
  function updateMark(){
   var on=marks.has(q.questionId),label=(all?'제'+q.exam+'회 ':'')+q.number+'번 쌍별 '+(on?'해제':'표시');
   mark.setAttribute('aria-label',label);mark.setAttribute('aria-pressed',String(on));mark.title=label;
   var filter=host.querySelector('[data-round-star-filter]');
   if(filter&&!markedOnly){filter.replaceChildren(icon(),host.ownerDocument.createTextNode('쌍별만 다시 보기 ('+marks.size+')'));}
  }
  titleRow.append(heading,mark);host.append(titleRow,goalMeter(),box);updateMark();
  if(!preservedImage){if(q.common){var commonBox=el('div');box.appendChild(commonBox);image(q,q.common.image,commonBox,index);}var questionBox=el('div');box.appendChild(questionBox);image(q,q.image,questionBox,index);}
  var choices=section('div','fe-round-review-choices'),status=section('p','fe-round-review-feedback'),answer=el('div'),controls=[];
  choices.setAttribute('role','group');choices.setAttribute('aria-label','답 선택');status.setAttribute('role','status');status.tabIndex=-1;answer.hidden=true;
  function disable(busy){controls.forEach(function(c){c.button.disabled=busy||c.disabled;});}
  function control(b,disabled){controls.push({button:b,disabled:disabled});b.disabled=disabled;return b;}
  function check(fn){
   disable(true);
   return currentMaterials().then(function(ok){
    if(ok&&current()&&index===at&&heading.isConnected)fn();
   }).catch(function(){
    if(current()&&heading.isConnected){status.textContent='자료 상태를 확인하지 못했어요. 다시 시도해 주세요.';disable(false);}
   });
  }
  q.options.forEach(function(o){
   var b=button(String(o.number),function(){check(function(){selected[q.questionId]=o.id;save();draw(false,box);var feedback=host.querySelector('.fe-round-review-feedback');if(feedback)feedback.focus({preventScroll:true});});});
   b.setAttribute('aria-pressed',String(chosen===o.id));
   choices.appendChild(control(b,!!chosen));
  });
  host.append(choices,status);
  if(chosen){
   var correct=chosen===q.review.correctOptionId,option=q.options.find(function(o){return o.id===chosen;});
   status.classList.add(correct?'is-correct':'is-wrong');
   status.textContent=(correct?'O 정답':'X 오답')+' · 내 선택 '+option.number+'번 · 정답 '+q.review.correctNumber+'번';
   var explain=button('해설 보기',function(){answer.hidden=!answer.hidden;explain.setAttribute('aria-expanded',String(!answer.hidden));explain.textContent=answer.hidden?'해설 보기':'해설 닫기';});
   explain.setAttribute('aria-expanded','false');
   var notes=section('ol','fe-round-review-option-notes');
   choiceNotes(q).forEach(function(text,i){
    var line=el('li');line.append(el('strong','①②③④⑤'[i]),el('span',text));notes.appendChild(line);
   });
   answer.appendChild(notes);
   host.append(explain,answer);
  }
  if(index===items.length-1)host.appendChild(control(button('최종 제출',function(){check(function(){submitted=true;save();saveLatest();score();});}),!Object.keys(selected).length));
  var nav=section('nav','fe-round-review-nav');
  nav.setAttribute('aria-label','복습 문제 이동');
  nav.append(control(button('이전',function(){index--;save();draw(true); }),index===0),control(button('다음',function(){index++;save();draw(true); }),index===items.length-1));
  host.appendChild(nav);if(focus)heading.focus();
 }
 clear();host.appendChild(el('p','오답·별표 자료를 확인하고 있어요…'));
 off=api.onChange?api.onChange(function(){if(!current())stop();}):null;
 resetOff=root.HanqLearningReset&&root.HanqLearningReset.onChange?root.HanqLearningReset.onChange(resetChanged):null;
 var ready=load({api:api,round:options.round,isCurrent:current}).then(function(r){if(current()){reset(r);}return r;},function(){if(current()){clear();host.appendChild(el('p','자료를 모두 확인하지 못했어요. 다시 열어 주세요.'));host.appendChild(button('회차 목록',function(){stop();if(options.onBack)options.onBack();}));}});
 return {ready:ready,stop:stop};
}
root.HanqCbtRoundMaterials={normalize:normalize,load:load,mount:mount,sourceLines:sourceLines,choiceNotes:choiceNotes,latest:latest};
})(window);