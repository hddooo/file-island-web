/* 의금부: 실전모의고사에서 틀린 문제만 모아 다시 푸는 곳. 서버(/api/v1/cbt/uigeumbu)가 회차·답안·채점을 저장한다.
   풀이 화면은 실전모의고사(#formalExamHost)의 답안 바·답안지 마크업을 그대로 쓴다. 시간 제한 없음. */
(function(root){'use strict';
var BASE='/api/v1/cbt/uigeumbu',active=null,CIRCLED='①②③④⑤',WEEK=['일','월','화','수','목','금','토'];
function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
/* 한국 시간 2026/11/23 (월) */
function kstDate(iso){var t=Date.parse(iso);if(!Number.isFinite(t))return '';var d=new Date(t+9*3600e3),p=function(n){return String(n).padStart(2,'0');};return d.getUTCFullYear()+'/'+p(d.getUTCMonth()+1)+'/'+p(d.getUTCDate())+' ('+WEEK[d.getUTCDay()]+')';}
function score(correct,total){return total>0?Math.round(correct/total*100)+'% ('+correct+'/'+total+')':'0% (0/0)';}
function scopeLabel(s){return s==='last-wrong'?'직전오답':s==='round-review'?'복습':'전체';}
function stop(){if(!active)return;var c=active;active=null;c.alive=false;clearTimeout(c.posTimer);if(c.materials){c.materials.stop();c.materials=null;}c.urls.forEach(function(u){root.URL.revokeObjectURL(u);});if(c.host)c.host.onkeydown=null;if(root.HanqGradeFeedback)root.HanqGradeFeedback.clear(c.host);}
function mount(host,o){
 stop();var api=o.api,ctx={alive:true,host:host,urls:[],cache:{},data:null,summary:null,busy:false,omrOpen:false,posTimer:null};active=ctx;
 var owner=api&&api.state&&api.state()&&api.state().ownerId;
 function valid(){return active===ctx&&ctx.alive&&host.isConnected&&api.state()&&api.state().ownerId===owner;}
 function call(method,path,body){return api.cbt(method,BASE+path,body);}
 function release(){ctx.urls.forEach(function(u){root.URL.revokeObjectURL(u);});ctx.urls=[];}
 function paint(body,extra){if(!valid())return;if(ctx.materials){var m=ctx.materials;ctx.materials=null;m.stop();}release();host.onkeydown=null;host.innerHTML='<section class="panel formal-exams uig'+(extra?' '+extra:'')+'"><div class="fe-top"><h1>의금부</h1><div class="fe-top-actions">'+(ctx.data?'<button type="button" class="tool-btn" id="uigMenu">의금부 처음으로</button>':o.onHome?'<button type="button" class="tool-btn" id="uigHome">⌂ 메인 메뉴</button>':'')+'</div></div>'+body+'</section>';bind('#uigMenu',menu);bind('#uigHome',function(){stop();o.onHome();});}
 function bind(sel,fn){var e=host.querySelector(sel);if(e)e.onclick=fn;}
 function note(text,alert){var e=host.querySelector('#uigStatus');if(e){e.textContent=text||'';e.setAttribute('role',alert?'alert':'status');}}
 function fail(e,retry){if(!valid())return;var code=e&&e.code,msg=code==='review_empty'?'다시 풀 오답이 없어요. 실전모의고사를 풀고 오면 틀린 문제가 여기에 모여요.':code==='no_previous_round'?'아직 제출한 의금부 회차가 없어요. 먼저 모든 문제 다시 풀기로 한 회차를 풀어 주세요.':code==='schema_not_ready'?'의금부 기록 저장 준비가 아직 끝나지 않았어요. 잠시 후 다시 열어 주세요.':code==='asset_unavailable'?'원본 문제 이미지를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.':code==='session_closed'?'이미 제출한 회차예요.':e&&e.status===404?'의금부 기록을 찾지 못했어요.':'불러오거나 저장하지 못했어요. 다시 확인해 주세요.';paint('<p role="alert">'+esc(msg)+'</p><button type="button" class="tool-btn" id="uigRetry">다시 확인</button>');bind('#uigRetry',retry||menu);}
 function run(fn,then,retry){if(ctx.busy||!valid())return;ctx.busy=true;host.setAttribute('aria-busy','true');return Promise.resolve().then(fn).then(function(d){ctx.busy=false;host.removeAttribute('aria-busy');if(valid())then(d);},function(e){ctx.busy=false;host.removeAttribute('aria-busy');if(!valid())return;if(e&&e.status===401){paint('<p>로그인한 계정으로 다시 열어 주세요.</p>');return;}fail(e,retry);});}

 /* ---------- 첫 화면 ---------- */
 function menu(){ctx.data=null;paint('<p role="status">불러오는 중…</p>');run(function(){return call('GET','');},function(s){ctx.summary=s;drawMenu(false);},menu);}
 function drawMenu(expanded){
  var s=ctx.summary,last=s.last,act=s.active;
  var start=expanded?'<div class="uig-options" role="group" aria-label="풀이 방식 선택"><button type="button" class="check-one" id="uigAll"'+(s.pool.all?'':' disabled')+'>모든 문제 다시 풀기<small>실전모의고사 전체 오답·3별 '+s.pool.all+'문항</small></button><button type="button" class="check-one" id="uigLast"'+(last&&last.wrong?'':' disabled')+'>직전 회차 오답 다시 풀기<small>'+(last?last.sequence+'회차 오답 '+last.wrong+'문항':'제출한 회차가 아직 없어요')+'</small></button><button type="button" class="tool-btn" id="uigClose">닫기</button></div>':'<button type="button" class="check-one uig-start" id="uigStart">시작하기</button>';
  var resume=act?'<p class="uig-resume">풀던 '+(act.scope==='round-review'?'복습':scopeLabel(act.scope)+' 회차')+'가 있어요 · '+act.answered+' / '+act.total+'문항 <button type="button" class="tool-btn" id="uigResume">이어서 풀기</button></p>':'';
  var rounds=!s.rounds.length?'<p>아직 제출한 기록이 없어요.</p>':'<ol class="uig-rounds">'+s.rounds.map(function(r){
   return '<li class="uig-round"><button type="button" class="uig-row uig-row-open" data-open="'+esc(r.id)+'" aria-label="'+r.sequence+'회차 상세 보기"><span class="uig-row-label">'+r.sequence+'회차 ('+scopeLabel(r.scope)+') · '+esc(kstDate(r.finalAt))+'</span><b class="uig-row-score">'+score(r.correct,r.total)+'</b></button>'+
    '<div class="uig-round-actions"><button type="button" class="tool-btn" data-review="'+esc(r.id)+'"'+(r.missed?'':' title="오답이 없으면 별표 문항만 다시 풀어요"')+'>오답·별표 다시 풀기</button><button type="button" class="tool-btn" data-pdf="questions" data-id="'+esc(r.id)+'" data-seq="'+r.sequence+'"'+(r.missed?'':' disabled')+'>오답 문제지 PDF</button><button type="button" class="tool-btn" data-pdf="answers" data-id="'+esc(r.id)+'" data-seq="'+r.sequence+'"'+(r.missed?'':' disabled')+'>오답 해설지 PDF</button></div>'+
    (r.reviews.length?'<ul class="uig-reviews" aria-label="'+r.sequence+'회차 복습 기록">'+r.reviews.map(function(v){return '<li><button type="button" class="uig-row uig-row-open" data-open="'+esc(v.id)+'"><span class="uig-row-label">복습 · '+esc(kstDate(v.finalAt))+'</span><b class="uig-row-score">'+score(v.correct,v.total)+'</b></button></li>';}).join('')+'</ul>':'')+'</li>';}).join('')+'</ol>';
  paint('<p class="uig-lead">실전모의고사에서 틀린 문제만 모아 맞힐 때까지 다시 풀어요. 시간 제한은 없어요.</p>'+resume+'<div class="uig-start-area">'+start+'</div>'+'<p id="uigStatus" role="status">'+esc(ctx.flash||'')+'</p><section class="uig-history"><h2>제출 기록 <small>최근 10회</small></h2>'+rounds+'</section>');
  bind('#uigStart',function(){drawMenu(true);var b=host.querySelector('#uigAll:not([disabled]),#uigLast:not([disabled]),#uigClose');if(b)b.focus();});
  bind('#uigClose',function(){drawMenu(false);var b=host.querySelector('#uigStart');if(b)b.focus();});
  bind('#uigAll',function(){create('all');});bind('#uigLast',function(){create('last-wrong');});
  bind('#uigResume',function(){open(act.id);});ctx.flash='';
  bind('#uigStarReset',function(){var box=host.querySelector('#uigStarConfirm');box.innerHTML='<div role="alertdialog" aria-labelledby="uigStarTitle"><p id="uigStarTitle">의금부 3별 '+s.tripleStars+'개를 모두 해제할까요? 되돌릴 수 없어요.</p><button type="button" class="check-one" id="uigStarYes">3별 모두 해제</button><button type="button" class="tool-btn" id="uigStarNo">취소</button></div>';
   bind('#uigStarNo',function(){box.replaceChildren();var b=host.querySelector('#uigStarReset');if(b)b.focus();});
   bind('#uigStarYes',function(){run(function(){return call('POST','/triple-stars/reset',{confirmation:'RESET_TRIPLE_STARS',resetAt:s.resetAt||null});},function(r){ctx.flash='3별 '+(r&&r.tripleStars||0)+'개를 해제했어요.';menu();},menu);});
   host.querySelector('#uigStarYes').focus();});
  host.querySelectorAll('[data-review]').forEach(function(b){b.onclick=function(){review(b.dataset.review);};});
  host.querySelectorAll('[data-open]').forEach(function(b){b.onclick=function(){ctx.detailTab='stats';ctx.logFilter='focus';open(b.dataset.open);};});
  host.querySelectorAll('[data-pdf]').forEach(function(b){b.onclick=function(){pdf(b.dataset.id,Number(b.dataset.seq),b.dataset.pdf,b);};});
 }
 function key(){return api.newSubmissionId('uigeumbu');}
 function create(scope){var k=key();run(function(){return call('POST','/sessions',{scope:scope,idempotencyKey:k});},show,menu);}
 function review(id){var k=key();run(function(){return call('POST','/sessions/'+id+'/reviews',{idempotencyKey:k});},show,menu);}
 function open(id){run(function(){return call('GET','/sessions/'+id);},show,menu);}

 /* ---------- 풀이 화면: 실전모의고사 오답·별표 풀이(HanqCbtRoundMaterials)와 같은 화면, 한 문제씩 확인 ---------- */
 function show(d){if(!valid())return;ctx.data=d;if(d.session.status==='final'){result(d);return;}practice(d);}
 function label(q){return '제'+q.exam+'회 '+q.number+'번';}
 function practice(d){
  var s=d.session,M=root.HanqCbtRoundMaterials;paint('<div id="feRoundMaterials"></div>');var target=host.querySelector('#feRoundMaterials');
  if(!M){target.textContent='풀이 화면을 불러오지 못했어요. 새로고침해 주세요.';return;}
  var title=s.scope==='round-review'?'회차 복습 · 오답·별표':s.scope==='last-wrong'?'직전 회차 오답 다시 풀기':'모든 문제 다시 풀기 · 오답·별표';
  var submitKey=key();
  ctx.materials=M.mount(target,{api:api,onBack:function(){Promise.resolve(ctx.queue).then(menu,menu);},provider:{title:title,backLabel:'의금부',position:(function(){var open=d.items.findIndex(function(q){return !q.checked;});return open<0?s.currentPosition:open;})(),
   starLabel:'3별',
   load:function(){d.items.forEach(function(q){q.providerStar=!!q.tripleStarred;});return {items:d.items,resetAt:s.resetAt||null};},
   answer:function(q,optionId){return call('POST','/sessions/'+s.id+'/answer',{position:q.position,optionId:optionId}).then(function(r){q.checked=true;q.selectedOptionId=optionId;return r;});},
   star:function(q,on){return call('POST','/sessions/'+s.id+'/triple-stars',{position:q.position,starred:on,resetAt:s.resetAt||null}).then(function(r){q.tripleStarred=on;return r;});},
   move:function(i){clearTimeout(ctx.posTimer);ctx.posTimer=setTimeout(function(){if(valid())call('POST','/sessions/'+s.id+'/position',{currentPosition:i}).catch(function(){});},600);},
   submit:function(){return call('POST','/sessions/'+s.id+'/submit',{submissionKey:submitKey});},
   done:function(v){if(valid())show(v);}}});
 }

 /* ---------- 회차 상세: 통계 · 풀이 내역 · 오답 개념 숙지 ---------- */
 var ERA={prehistory:'선사',gojoseon:'고조선·여러 나라',samguk:'삼국',nambuk:'남북국',goryeo:'고려',joseon:'조선','joseon-early':'조선 전기','joseon-late':'조선 후기',opening:'개항기',colonial:'일제강점기',modern:'현대',islands:'독도·간도',comprehensive:'주제별 통합'};
 var ERA_ORDER=Object.keys(ERA);
 function md(x){return esc(x).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');}
 function statusOf(q){return q.review?q.review.status:'unanswered';}
 function focusOf(d){return d.items.filter(function(q){return statusOf(q)!=='correct'||q.tripleStarred;});}
 function eraKey(q){var e=studyOf(q);return e&&ERA[e.era]?e.era:ERA[q.era]?q.era:'other';}
 function eraName(q){return ERA[eraKey(q)]||'기타';}
 /* 시대로 묶이지 않는 주제별 통합 문항(지역사·문화유산·화폐 제도 등)은 유형별로 따로 센다. */
 function byEra(list){var groups={},subs=[];list.forEach(function(q){var k=eraKey(q),e;if(k==='comprehensive'){e=studyOf(q);var sub=e&&e.topic?e.topic:'기타';k='comprehensive:'+sub;if(subs.indexOf(k)<0)subs.push(k);}(groups[k]=groups[k]||[]).push(q);});subs.sort(function(a,b){return groups[b].length-groups[a].length;});return ERA_ORDER.filter(function(k){return k!=='comprehensive';}).concat(subs,['other']).filter(function(k){return groups[k];}).map(function(k){return {key:k,label:k.indexOf('comprehensive:')===0?'통합 · '+k.slice(14):ERA[k]||'기타',items:groups[k]};});}
 function topicOf(q){var e=studyOf(q);if(e&&e.topic)return e.topic;var f=e&&e.flow?String(e.flow).split(':')[0].replace(/\*\*/g,'').replace(/\s*흐름$/,'').trim():'';return f&&f.length<=20?f:eraName(q);}
 function byTopic(list){var groups={},order=[];list.forEach(function(q){var k=topicOf(q);if(!groups[k]){groups[k]=[];order.push(k);}groups[k].push(q);});return order.map(function(k){var eras=[];groups[k].forEach(function(q){var n=eraName(q);if(eras.indexOf(n)<0)eras.push(n);});return {label:k,items:groups[k],eras:eras,first:ERA_ORDER.indexOf(eraKey(groups[k][0]))};}).sort(function(a,b){return b.items.length-a.items.length||a.first-b.first;});}
 function studyOf(q){var ex=root.HanqCbtExplanations;return ex&&ex.studyFor?ex.studyFor(q):null;}
 function chosenNo(q){var o=q.selectedOptionId&&q.options.filter(function(x){return x.id===q.selectedOptionId;})[0];return o?o.number:null;}
 function result(d,tab){
  var s=d.session,r=s.result||{},isReview=s.scope==='round-review';ctx.detail=d;tab=tab||ctx.detailTab||'stats';ctx.detailTab=tab;
  var ex=root.HanqCbtExplanations,rounds=d.items.map(function(q){return q.exam;});
  if(ex&&ex.loadStudy&&!d.studyLoaded){paint('<p role="status">해설을 불러오는 중…</p>');Promise.resolve(ex.loadStudy(api,rounds)).catch(function(){}).then(function(){d.studyLoaded=true;if(valid()&&ctx.detail===d)result(d,tab);});return;}
  var focus=focusOf(d),title=isReview?'복습 결과':s.sequence+'회차 ('+scopeLabel(s.scope)+')';
  var tabs=[['stats','통계'],['log','풀이 내역'],['notes','오답 개념 숙지']].map(function(x){return '<button type="button" role="tab" class="tool-btn uig-tab" data-tab="'+x[0]+'" aria-selected="'+(x[0]===tab)+'">'+x[1]+(x[0]==='notes'?' ('+focus.length+')':'')+'</button>';}).join('');
  var body=tab==='log'?logHtml(d):tab==='notes'?notesHtml(d,focus):statsHtml(d,focus);
  paint('<section class="uig-result" aria-labelledby="uigResultTitle"><h2 id="uigResultTitle" tabindex="-1">'+esc(title)+'</h2><p class="uig-result-score"><b>'+score(Number(r.correct)||0,Number(r.total)||d.items.length)+'</b></p><p>'+esc(kstDate(s.finalAt))+' · 정답 '+(r.correct||0)+' · 오답 '+(r.wrong||0)+' · 미응답 '+(r.unanswered||0)+'</p>'+
   '<div class="uig-round-actions">'+(isReview?'':'<button type="button" class="tool-btn" id="uigReviewNow"'+(focus.length?'':' disabled')+'>틀린 문제·3별 다시 풀기 ('+focus.length+')</button><button type="button" class="tool-btn" id="uigPdfQ"'+(r.correct===r.total?' disabled':'')+'>오답 문제지 PDF</button><button type="button" class="tool-btn" id="uigPdfA"'+(r.correct===r.total?' disabled':'')+'>오답 해설지 PDF</button>')+'</div><p id="uigStatus" role="status"></p>'+
   '<div class="uig-tabs" role="tablist" aria-label="회차 상세">'+tabs+'</div><div class="uig-tab-panel" role="tabpanel">'+body+'</div></section>');
  bind('#uigBack',function(){ctx.detail=null;ctx.detailTab=null;menu();});bind('#uigReviewNow',function(){review(s.id);});bind('#uigPdfQ',function(e){pdf(s.id,s.sequence,'questions',e.currentTarget,d);});bind('#uigPdfA',function(e){pdf(s.id,s.sequence,'answers',e.currentTarget,d);});
  host.querySelectorAll('[data-tab]').forEach(function(b){b.onclick=function(){result(d,b.dataset.tab);var n=host.querySelector('[data-tab="'+b.dataset.tab+'"]');if(n)n.focus();};});
  host.querySelectorAll('[data-log-filter]').forEach(function(b){b.onclick=function(){ctx.logFilter=b.dataset.logFilter;result(d,'log');};});
  host.querySelectorAll('[data-note-mode]').forEach(function(b){b.onclick=function(){ctx.noteMode=b.dataset.noteMode;result(d,'notes');};});
  host.querySelectorAll('details[data-pos]').forEach(function(dt){dt.addEventListener('toggle',function(){if(!dt.open||dt.dataset.filled)return;dt.dataset.filled='1';var q=d.items[Number(dt.dataset.pos)],box=dt.querySelector('.uig-log-body'),html='';try{html=ex&&ex.render?ex.render(q,null,'final'):'';}catch(_){}box.innerHTML=html||'<p>이 문항의 해설을 불러오지 못했어요.</p>';});});
  if(tab==='stats'){var h=host.querySelector('#uigResultTitle');if(h)h.focus({preventScroll:true});}
 }
 function statsHtml(d,focus){
  var triple=d.items.filter(function(q){return q.tripleStarred;}).length,groups=byEra(d.items);
  function row(g){var ok=g.items.filter(function(q){return statusOf(q)==='correct';}).length,pct=Math.round(ok/g.items.length*100),lvl=pct<70?'low':pct<85?'mid':'high',name=g.key.indexOf('comprehensive:')===0?g.key.slice(14):g.label;
   return '<li class="uig-era-row is-'+lvl+'"><span class="uig-era-name">'+esc(name)+'</span><span class="uig-bar" aria-hidden="true"><i style="width:'+pct+'%"></i></span><span class="uig-era-pct"><b>'+pct+'%</b><small>'+ok+'/'+g.items.length+'</small></span></li>';}
  var eraRows=groups.filter(function(g){return g.key.indexOf('comprehensive:')!==0;}),mixRows=groups.filter(function(g){return g.key.indexOf('comprehensive:')===0;});
  var rows='<ul class="uig-era-list" aria-label="시대별 정답률">'+eraRows.map(row).join('')+'</ul>'+(mixRows.length?'<h3 class="uig-era-sub">주제별 통합 문항</h3><ul class="uig-era-list" aria-label="주제별 통합 문항 정답률">'+mixRows.map(row).join('')+'</ul>':'');
  var weak=groups.map(function(g){return {g:g,pct:g.items.filter(function(q){return statusOf(q)==='correct';}).length/g.items.length};}).filter(function(x){return x.g.items.length>=2;}).sort(function(a,b){return a.pct-b.pct;})[0];
  return '<div class="uig-stat-cards"><p><b>'+d.items.length+'</b><span>전체 문항</span></p><p><b>'+focus.length+'</b><span>틀린 문제·3별</span></p><p><b>'+triple+'</b><span>3별</span></p></div>'+
   (weak&&weak.pct<1?'<p class="uig-weak">가장 약한 영역: <b>'+esc(weak.g.label)+'</b> '+Math.round(weak.pct*100)+'%</p>':'')+
   (function(){var top=byTopic(focus).filter(function(g){return g.items.length>=2;}).slice(0,5);return top.length?'<div class="uig-top-topics"><h3>자주 틀린 개념</h3><ol>'+top.map(function(g){return '<li><b>'+esc(g.label)+'</b> <span>'+g.items.length+'문항 · '+esc(g.eras.join('·'))+'</span></li>';}).join('')+'</ol></div>':'';})()+
   '<h3 class="uig-era-sub">시대별 정답률</h3>'+rows;
 }
 function logHtml(d){
  var only=ctx.logFilter!=='all',list=only?focusOf(d):d.items;
  var filter='<div class="uig-log-filter" role="group" aria-label="풀이 내역 보기"><button type="button" class="tool-btn" data-log-filter="focus" aria-pressed="'+only+'">틀린 문제·3별만</button><button type="button" class="tool-btn" data-log-filter="all" aria-pressed="'+(!only)+'">전체</button></div>';
  if(!list.length)return filter+'<p>틀린 문제와 3별 문제가 없어요.</p>';
  return filter+'<ol class="uig-log">'+list.map(function(q){var st=statusOf(q),mine=chosenNo(q),right=q.review?q.review.correctNumber:null;
   return '<li><details data-pos="'+q.position+'"><summary class="uig-log-row is-'+st+'"><span class="uig-log-mark" aria-hidden="true">'+(st==='correct'?'○':st==='wrong'?'×':'−')+'</span><span class="uig-log-name">'+esc(label(q))+' · '+esc(eraName(q))+(q.tripleStarred?' <span class="uig-triple" aria-label="3별">★★★</span>':'')+'</span><span class="uig-log-answer">내 답 '+(mine?CIRCLED[mine-1]:'없음')+' · 정답 '+(right?CIRCLED[right-1]:'')+'</span></summary><div class="uig-log-body"></div></details></li>';}).join('')+'</ol>';
 }
 function notesHtml(d,focus){
  if(!focus.length)return '<p>틀린 문제와 3별 문제가 없어요. 이 회차는 다 맞혔어요.</p>';
  var mode=ctx.noteMode==='era'?'era':'topic',groups=mode==='era'?byEra(focus):byTopic(focus);
  var switcher='<div class="uig-log-filter" role="group" aria-label="암기 노트 묶음"><button type="button" class="tool-btn" data-note-mode="topic" aria-pressed="'+(mode==='topic')+'">개념별</button><button type="button" class="tool-btn" data-note-mode="era" aria-pressed="'+(mode==='era')+'">시대별</button></div>';
  return switcher+'<p class="uig-notes-lead">'+(mode==='era'?'시대마다 핵심 흐름을 한 번만 보여 주고, 아래에 틀린 문제·3별의 정답 키워드만 모았어요.':'같은 개념은 핵심 흐름을 한 번만 보여 주고, 아래에 문항별 정답 키워드만 모았어요. 많이 틀린 개념부터 보여요.')+'</p>'+groups.map(function(g){
   return '<section class="uig-note-era"><h3>'+esc(g.label)+' <small>'+g.items.length+'문항'+(mode==='topic'?' · '+esc(g.eras.join('·')):'')+'</small></h3>'+noteGroup(g.items)+'</section>';}).join('');
 }
 /* 같은 개념 묶음 안에서는 흐름을 하나(가장 단계가 많은 것)만, 메모는 처음 나온 것만 보여 준다. */
 function flowSteps(f){return String(f||'').split('→').length;}
 function noteGroup(items){
  var byTopicFlow={},order=[],seenMemo={},sources=[];
  items.forEach(function(q){var e=studyOf(q);if(!e||!e.flow)return;var k=topicOf(q);if(!byTopicFlow[k]){byTopicFlow[k]=e.flow;order.push(k);}else if(flowSteps(e.flow)>flowSteps(byTopicFlow[k]))byTopicFlow[k]=e.flow;if(e.source&&sources.indexOf(e.source)<0)sources.push(e.source);});
  var flows=order.length?'<div class="uig-note-flows"><p class="uig-note-flows-title">핵심 흐름</p>'+order.map(function(k){return '<p class="uig-note-flow">'+md(byTopicFlow[k])+'</p>';}).join('')+'</div>':'';
  var rows=items.map(function(q){
   var e=studyOf(q),st=statusOf(q),mine=chosenNo(q),tags=(st==='wrong'?'<span class="uig-tag is-wrong">오답</span>':st==='unanswered'?'<span class="uig-tag is-empty">미응답</span>':'')+(q.tripleStarred?'<span class="uig-tag is-triple">3별</span>':'');
   var body;
   if(e){var right=e.options[e.answer-1]||{},pick=mine&&mine!==e.answer?e.options[mine-1]:null,memo=right.memo&&!seenMemo[right.memo]?right.memo:'';if(memo)seenMemo[memo]=1;
    body='<p class="uig-note-key"><b>정답 '+CIRCLED[e.answer-1]+'</b> '+md(right.keyword||'')+'</p>'+(memo?'<p class="uig-note-memo">'+md(memo)+'</p>':'')+
     (pick?'<p class="uig-note-mine"><b>내가 고른 '+CIRCLED[mine-1]+'</b> '+md(pick.keyword||'')+'</p>':'');}
   else{var o=q.review&&q.review.item&&q.review.item.overview||{};body='<p class="uig-note-key"><b>정답 '+(q.review?CIRCLED[q.review.correctNumber-1]:'')+'</b> '+md(o.answer||'')+'</p>';}
   return '<li class="uig-note"><p class="uig-note-head">'+esc(label(q))+' '+tags+'</p>'+body+'</li>';}).join('');
  return flows+'<ol class="uig-note-list">'+rows+'</ol>'+(sources.length?'<p class="uig-note-src">근거: 성균관 시대별 학습 · '+esc(sources.join(', '))+'</p>':'');
 }
 function pdf(id,seq,mode,button,loaded){var P=root.HanqCbtWrongPdf;if(!P||!P.downloadItems){note('PDF 도구를 불러오지 못했어요. 새로고침해 주세요.',true);return;}if(ctx.pdfBusy)return;ctx.pdfBusy=true;if(button)button.disabled=true;note('PDF를 만드는 중이에요…');
  Promise.resolve(loaded||call('GET','/sessions/'+id)).then(function(d){if(!valid())return;var items=d.items.filter(function(q){return q.review&&q.review.status!=='correct';}).sort(function(a,b){return a.exam-b.exam||a.number-b.number;});if(!items.length)throw {code:'empty'};
   var name=seq+'회차';return P.downloadItems({api:api,items:items,mode:mode,isCurrent:valid,title:'의금부 '+name+' 오답 '+(mode==='answers'?'해설지':'문제지'),filename:'의금부_'+name+'_오답_'+(mode==='answers'?'해설지':'문제지')+'.pdf',onProgress:function(p){note('PDF를 만드는 중이에요… '+p.done+' / '+p.total);}});})
  .then(function(out){ctx.pdfBusy=false;if(button)button.disabled=false;if(out&&valid())note(out.filename+' 저장을 시작했어요 · '+out.count+'문항 · '+out.pages+'쪽');},function(e){ctx.pdfBusy=false;if(button)button.disabled=false;if(valid())note(e&&e.code==='empty'?'이 회차에는 틀린 문제가 없어요.':'PDF를 만들지 못했어요. 다시 시도해 주세요.',true);});}
 menu();
}
root.HanqUigeumbu={mount:mount,stop:stop,kstDate:kstDate,score:score};
})(typeof window!=='undefined'?window:globalThis);
