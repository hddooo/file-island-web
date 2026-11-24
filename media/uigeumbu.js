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
  var start=expanded?'<div class="uig-options" role="group" aria-label="풀이 방식 선택"><button type="button" class="check-one" id="uigAll"'+(s.pool.all?'':' disabled')+'>모든 문제 다시 풀기<small>실전모의고사 전체 오답·별표 '+s.pool.all+'문항</small></button><button type="button" class="check-one" id="uigLast"'+(last&&last.wrong?'':' disabled')+'>직전 회차 오답 다시 풀기<small>'+(last?last.sequence+'회차 오답 '+last.wrong+'문항':'제출한 회차가 아직 없어요')+'</small></button><button type="button" class="tool-btn" id="uigClose">닫기</button></div>':'<button type="button" class="check-one uig-start" id="uigStart">시작하기</button>';
  var resume=act?'<p class="uig-resume">풀던 '+(act.scope==='round-review'?'복습':scopeLabel(act.scope)+' 회차')+'가 있어요 · '+act.answered+' / '+act.total+'문항 <button type="button" class="tool-btn" id="uigResume">이어서 풀기</button></p>':'';
  var rounds=!s.rounds.length?'<p>아직 제출한 기록이 없어요.</p>':'<ol class="uig-rounds">'+s.rounds.map(function(r){
   return '<li class="uig-round"><div class="uig-row"><span class="uig-row-label">'+r.sequence+'회차 ('+scopeLabel(r.scope)+') · '+esc(kstDate(r.finalAt))+'</span><b class="uig-row-score">'+score(r.correct,r.total)+'</b></div>'+
    '<div class="uig-round-actions"><button type="button" class="tool-btn" data-review="'+esc(r.id)+'"'+(r.missed?'':' title="오답이 없으면 별표 문항만 다시 풀어요"')+'>오답·별표 다시 풀기</button><button type="button" class="tool-btn" data-pdf="questions" data-id="'+esc(r.id)+'" data-seq="'+r.sequence+'"'+(r.missed?'':' disabled')+'>오답 문제지 PDF</button><button type="button" class="tool-btn" data-pdf="answers" data-id="'+esc(r.id)+'" data-seq="'+r.sequence+'"'+(r.missed?'':' disabled')+'>오답 해설지 PDF</button></div>'+
    (r.reviews.length?'<ul class="uig-reviews" aria-label="'+r.sequence+'회차 복습 기록">'+r.reviews.map(function(v){return '<li class="uig-row"><span class="uig-row-label">복습 · '+esc(kstDate(v.finalAt))+'</span><b class="uig-row-score">'+score(v.correct,v.total)+'</b></li>';}).join('')+'</ul>':'')+'</li>';}).join('')+'</ol>';
  paint('<p class="uig-lead">실전모의고사에서 틀린 문제만 모아 맞힐 때까지 다시 풀어요. 시간 제한은 없어요.</p>'+resume+'<div class="uig-start-area">'+start+'</div>'+((s.stars||0)+(s.tripleStars||0)?'<div class="uig-star-tools"><button type="button" class="tool-btn" id="uigStarReset">별표 초기화 (3별 '+(s.tripleStars||0)+' · 별표 '+(s.stars||0)+')</button><div id="uigStarConfirm"></div></div>':'')+'<p id="uigStatus" role="status">'+esc(ctx.flash||'')+'</p><section class="uig-history"><h2>제출 기록 <small>최근 10회</small></h2>'+rounds+'</section>');
  bind('#uigStart',function(){drawMenu(true);var b=host.querySelector('#uigAll:not([disabled]),#uigLast:not([disabled]),#uigClose');if(b)b.focus();});
  bind('#uigClose',function(){drawMenu(false);var b=host.querySelector('#uigStart');if(b)b.focus();});
  bind('#uigAll',function(){create('all');});bind('#uigLast',function(){create('last-wrong');});
  bind('#uigResume',function(){open(act.id);});ctx.flash='';
  bind('#uigStarReset',function(){var box=host.querySelector('#uigStarConfirm');box.innerHTML='<div role="alertdialog" aria-labelledby="uigStarTitle"><p id="uigStarTitle">의금부 3별 '+(s.tripleStars||0)+'개와 별표 '+(s.stars||0)+'개를 모두 해제할까요? 실전모의고사·오답풀이에서 표시한 별표도 함께 지워지고, 별표만 있던 문제는 \'모든 문제 다시 풀기\'에서 빠져요. 되돌릴 수 없어요.</p><button type="button" class="check-one" id="uigStarYes">별표 모두 해제</button><button type="button" class="tool-btn" id="uigStarNo">취소</button></div>';
   bind('#uigStarNo',function(){box.replaceChildren();var b=host.querySelector('#uigStarReset');if(b)b.focus();});
   bind('#uigStarYes',function(){run(function(){return call('POST','/stars/reset',{confirmation:'RESET_STARS',resetAt:s.resetAt||null});},function(r){ctx.flash='3별 '+(r&&r.tripleStars||0)+'개 · 별표 '+(r&&r.stars||0)+'개를 해제했어요.';menu();},menu);});
   host.querySelector('#uigStarYes').focus();});
  host.querySelectorAll('[data-review]').forEach(function(b){b.onclick=function(){review(b.dataset.review);};});
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

 /* ---------- 결과 ---------- */
 function result(d){var s=d.session,r=s.result||{},isReview=s.scope==='round-review';
  var rows=d.items.map(function(q){var st=q.review?q.review.status:'unanswered';return '<li class="'+(st==='correct'?'is-correct':st==='wrong'?'is-wrong':'is-empty')+'"><span>'+esc(label(q))+'</span><strong>'+(st==='correct'?'○ 정답':st==='wrong'?'× 오답 · 정답 '+q.review.correctNumber+'번':'미응답 · 정답 '+(q.review?q.review.correctNumber:'')+'번')+'</strong></li>';}).join('');
  paint('<section class="uig-result" aria-labelledby="uigResultTitle"><h2 id="uigResultTitle" tabindex="-1">'+(isReview?'복습 결과':s.sequence+'회차 ('+scopeLabel(s.scope)+') 결과')+'</h2><p class="uig-result-score"><b>'+score(Number(r.correct)||0,Number(r.total)||d.items.length)+'</b></p><p>'+esc(kstDate(s.finalAt))+' · 정답 '+(r.correct||0)+' · 오답 '+(r.wrong||0)+' · 미응답 '+(r.unanswered||0)+'</p>'+
   '<div class="uig-round-actions">'+(isReview?'':'<button type="button" class="tool-btn" id="uigReviewNow">오답·별표 다시 풀기</button><button type="button" class="tool-btn" id="uigPdfQ"'+(r.correct===r.total?' disabled':'')+'>오답 문제지 PDF</button><button type="button" class="tool-btn" id="uigPdfA"'+(r.correct===r.total?' disabled':'')+'>오답 해설지 PDF</button>')+'<button type="button" class="check-one" id="uigBack">의금부로</button></div><p id="uigStatus" role="status"></p><ul class="fe-round-review-breakdown uig-breakdown">'+rows+'</ul></section>');
  ctx.data=null;bind('#uigBack',menu);bind('#uigReviewNow',function(){review(s.id);});bind('#uigPdfQ',function(e){pdf(s.id,s.sequence,'questions',e.currentTarget,d);});bind('#uigPdfA',function(e){pdf(s.id,s.sequence,'answers',e.currentTarget,d);});
  var h=host.querySelector('#uigResultTitle');if(h)h.focus({preventScroll:true});}
 function pdf(id,seq,mode,button,loaded){var P=root.HanqCbtWrongPdf;if(!P||!P.downloadItems){note('PDF 도구를 불러오지 못했어요. 새로고침해 주세요.',true);return;}if(ctx.pdfBusy)return;ctx.pdfBusy=true;if(button)button.disabled=true;note('PDF를 만드는 중이에요…');
  Promise.resolve(loaded||call('GET','/sessions/'+id)).then(function(d){if(!valid())return;var items=d.items.filter(function(q){return q.review&&q.review.status!=='correct';}).sort(function(a,b){return a.exam-b.exam||a.number-b.number;});if(!items.length)throw {code:'empty'};
   var name=seq+'회차';return P.downloadItems({api:api,items:items,mode:mode,isCurrent:valid,title:'의금부 '+name+' 오답 '+(mode==='answers'?'해설지':'문제지'),filename:'의금부_'+name+'_오답_'+(mode==='answers'?'해설지':'문제지')+'.pdf',onProgress:function(p){note('PDF를 만드는 중이에요… '+p.done+' / '+p.total);}});})
  .then(function(out){ctx.pdfBusy=false;if(button)button.disabled=false;if(out&&valid())note(out.filename+' 저장을 시작했어요 · '+out.count+'문항 · '+out.pages+'쪽');},function(e){ctx.pdfBusy=false;if(button)button.disabled=false;if(valid())note(e&&e.code==='empty'?'이 회차에는 틀린 문제가 없어요.':'PDF를 만들지 못했어요. 다시 시도해 주세요.',true);});}
 menu();
}
root.HanqUigeumbu={mount:mount,stop:stop,kstDate:kstDate,score:score};
})(typeof window!=='undefined'?window:globalThis);
