/* 의금부: 실전모의고사에서 틀린 문제만 모아 다시 푸는 곳. 서버(/api/v1/cbt/uigeumbu)가 회차·답안·채점을 저장한다.
   풀이 화면은 실전모의고사(#formalExamHost)의 답안 바·답안지 마크업을 그대로 쓴다. 시간 제한 없음. */
(function(root){'use strict';
var BASE='/api/v1/cbt/uigeumbu',active=null,CIRCLED='①②③④⑤',WEEK=['일','월','화','수','목','금','토'];
function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
/* 한국 시간 2026/11/23 (월) */
function kstDate(iso){var t=Date.parse(iso);if(!Number.isFinite(t))return '';var d=new Date(t+9*3600e3),p=function(n){return String(n).padStart(2,'0');};return d.getUTCFullYear()+'/'+p(d.getUTCMonth()+1)+'/'+p(d.getUTCDate())+' ('+WEEK[d.getUTCDay()]+')';}
function score(correct,total){return total>0?Math.round(correct/total*100)+'% ('+correct+'/'+total+')':'0% (0/0)';}
function scopeLabel(s){return s==='last-wrong'?'직전오답':s==='round-review'?'복습':'전체';}
function stop(){if(!active)return;var c=active;active=null;c.alive=false;clearTimeout(c.posTimer);c.urls.forEach(function(u){root.URL.revokeObjectURL(u);});if(c.host)c.host.onkeydown=null;if(root.HanqGradeFeedback)root.HanqGradeFeedback.clear(c.host);}
function mount(host,o){
 stop();var api=o.api,ctx={alive:true,host:host,urls:[],cache:{},data:null,summary:null,busy:false,omrOpen:false,posTimer:null};active=ctx;
 var owner=api&&api.state&&api.state()&&api.state().ownerId;
 function valid(){return active===ctx&&ctx.alive&&host.isConnected&&api.state()&&api.state().ownerId===owner;}
 function call(method,path,body){return api.cbt(method,BASE+path,body);}
 function release(){ctx.urls.forEach(function(u){root.URL.revokeObjectURL(u);});ctx.urls=[];}
 function paint(body,extra){if(!valid())return;release();host.onkeydown=null;host.innerHTML='<section class="panel formal-exams uig'+(extra?' '+extra:'')+'"><div class="fe-top"><h1>의금부</h1><div class="fe-top-actions">'+(ctx.data?'<button type="button" class="tool-btn" id="uigMenu">의금부 처음으로</button>':o.onHome?'<button type="button" class="tool-btn" id="uigHome">⌂ 메인 메뉴</button>':'')+'</div></div>'+body+'</section>';bind('#uigMenu',menu);bind('#uigHome',function(){stop();o.onHome();});}
 function bind(sel,fn){var e=host.querySelector(sel);if(e)e.onclick=fn;}
 function note(text,alert){var e=host.querySelector('#uigStatus');if(e){e.textContent=text||'';e.setAttribute('role',alert?'alert':'status');}}
 function fail(e,retry){if(!valid())return;var code=e&&e.code,msg=code==='review_empty'?'다시 풀 오답이 없어요. 실전모의고사를 풀고 오면 틀린 문제가 여기에 모여요.':code==='no_previous_round'?'아직 제출한 의금부 회차가 없어요. 먼저 모든 문제 다시 풀기로 한 회차를 풀어 주세요.':code==='schema_not_ready'?'의금부 기록 저장 준비가 아직 끝나지 않았어요. 잠시 후 다시 열어 주세요.':code==='asset_unavailable'?'원본 문제 이미지를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.':code==='session_closed'?'이미 제출한 회차예요.':e&&e.status===404?'의금부 기록을 찾지 못했어요.':'불러오거나 저장하지 못했어요. 다시 확인해 주세요.';paint('<p role="alert">'+esc(msg)+'</p><button type="button" class="tool-btn" id="uigRetry">다시 확인</button>');bind('#uigRetry',retry||menu);}
 function run(fn,then,retry){if(ctx.busy||!valid())return;ctx.busy=true;host.setAttribute('aria-busy','true');return Promise.resolve().then(fn).then(function(d){ctx.busy=false;host.removeAttribute('aria-busy');if(valid())then(d);},function(e){ctx.busy=false;host.removeAttribute('aria-busy');if(!valid())return;if(e&&e.status===401){paint('<p>로그인한 계정으로 다시 열어 주세요.</p>');return;}fail(e,retry);});}

 /* ---------- 첫 화면 ---------- */
 function menu(){ctx.data=null;paint('<p role="status">불러오는 중…</p>');run(function(){return call('GET','');},function(s){ctx.summary=s;drawMenu(false);},menu);}
 function drawMenu(open){
  var s=ctx.summary,last=s.last,act=s.active;
  var start=open?'<div class="uig-options" role="group" aria-label="풀이 방식 선택"><button type="button" class="check-one" id="uigAll"'+(s.pool.all?'':' disabled')+'>모든 문제 다시 풀기<small>실전모의고사 전체 오답·별표 '+s.pool.all+'문항</small></button><button type="button" class="check-one" id="uigLast"'+(last&&last.wrong?'':' disabled')+'>직전 회차 오답 다시 풀기<small>'+(last?last.sequence+'회차 오답 '+last.wrong+'문항':'제출한 회차가 아직 없어요')+'</small></button><button type="button" class="tool-btn" id="uigClose">닫기</button></div>':'<button type="button" class="check-one uig-start" id="uigStart">시작하기</button>';
  var resume=act?'<p class="uig-resume">풀던 '+(act.scope==='round-review'?'복습':scopeLabel(act.scope)+' 회차')+'가 있어요 · '+act.answered+' / '+act.total+'문항 <button type="button" class="tool-btn" id="uigResume">이어서 풀기</button></p>':'';
  var rounds=!s.rounds.length?'<p>아직 제출한 기록이 없어요.</p>':'<ol class="uig-rounds">'+s.rounds.map(function(r){
   return '<li class="uig-round"><div class="uig-row"><span class="uig-row-label">'+r.sequence+'회차 ('+scopeLabel(r.scope)+') · '+esc(kstDate(r.finalAt))+'</span><b class="uig-row-score">'+score(r.correct,r.total)+'</b></div>'+
    '<div class="uig-round-actions"><button type="button" class="tool-btn" data-review="'+esc(r.id)+'"'+(r.missed?'':' title="오답이 없으면 별표 문항만 다시 풀어요"')+'>오답·별표 다시 풀기</button><button type="button" class="tool-btn" data-pdf="questions" data-id="'+esc(r.id)+'" data-seq="'+r.sequence+'"'+(r.missed?'':' disabled')+'>오답 문제지 PDF</button><button type="button" class="tool-btn" data-pdf="answers" data-id="'+esc(r.id)+'" data-seq="'+r.sequence+'"'+(r.missed?'':' disabled')+'>오답 해설지 PDF</button></div>'+
    (r.reviews.length?'<ul class="uig-reviews" aria-label="'+r.sequence+'회차 복습 기록">'+r.reviews.map(function(v){return '<li class="uig-row"><span class="uig-row-label">복습 · '+esc(kstDate(v.finalAt))+'</span><b class="uig-row-score">'+score(v.correct,v.total)+'</b></li>';}).join('')+'</ul>':'')+'</li>';}).join('')+'</ol>';
  paint('<p class="uig-lead">실전모의고사에서 틀린 문제만 모아 맞힐 때까지 다시 풀어요. 시간 제한은 없어요.</p>'+resume+'<div class="uig-start-area">'+start+'</div><p id="uigStatus" role="status"></p><section class="uig-history"><h2>제출 기록 <small>최근 10회</small></h2>'+rounds+'</section>');
  bind('#uigStart',function(){drawMenu(true);var b=host.querySelector('#uigAll:not([disabled]),#uigLast:not([disabled]),#uigClose');if(b)b.focus();});
  bind('#uigClose',function(){drawMenu(false);var b=host.querySelector('#uigStart');if(b)b.focus();});
  bind('#uigAll',function(){create('all');});bind('#uigLast',function(){create('last-wrong');});
  bind('#uigResume',function(){open(act.id);});
  host.querySelectorAll('[data-review]').forEach(function(b){b.onclick=function(){review(b.dataset.review);};});
  host.querySelectorAll('[data-pdf]').forEach(function(b){b.onclick=function(){pdf(b.dataset.id,Number(b.dataset.seq),b.dataset.pdf,b);};});
 }
 function key(){return api.newSubmissionId('uigeumbu');}
 function create(scope){var k=key();run(function(){return call('POST','/sessions',{scope:scope,idempotencyKey:k});},show,menu);}
 function review(id){var k=key();run(function(){return call('POST','/sessions/'+id+'/reviews',{idempotencyKey:k});},show,menu);}
 function open(id){run(function(){return call('GET','/sessions/'+id);},show,menu);}

 /* ---------- 풀이 화면 ---------- */
 function show(d){if(!valid())return;ctx.data=d;if(d.session.status==='final'){result(d);return;}draw();}
 function cur(){return ctx.data.session.currentPosition;}
 function chosen(q){var x=q.selectedOptionId&&q.options.filter(function(v){return v.id===q.selectedOptionId;})[0];return x?x.number:null;}
 function label(q){return '제'+q.exam+'회 '+q.number+'번';}
 function omrCell(q,pos){var n=chosen(q),mark=q.review?(q.review.correct?' is-correct':' is-wrong'):'';return '<button type="button" class="fe-omr-cell'+(n!=null?' is-answered':'')+(q.starred?' is-starred':'')+mark+'" data-jump="'+q.position+'"'+(q.position===pos?' aria-current="step"':'')+' aria-label="'+esc(label(q))+(n!=null?' · '+n+'번 고름':' · 아직 안 풂')+(q.review?(q.review.correct?' · 정답':' · 오답'):'')+(q.starred?' · 별표':'')+'"><b>'+q.exam+'-'+q.number+'</b><span aria-hidden="true">'+(n!=null?n:'·')+'</span></button>';}
 function draw(){
  var d=ctx.data,s=d.session,pos=cur(),q=d.items[pos],last=pos===d.items.length-1,check=s.checkMode,locked=check&&q.checked;
  var opts=q.options.map(function(x){var mark=locked&&x.id===q.selectedOptionId?(q.review.correct?'correct':'wrong'):null;return '<button type="button" class="tool-btn" data-option="'+esc(x.id)+'" aria-pressed="'+(q.selectedOptionId===x.id)+'"'+(mark?' data-review-mark="'+mark+'"':'')+(locked?' disabled':'')+'>'+x.number+(locked&&x.id===q.review.correctOptionId&&x.id!==q.selectedOptionId?' <span aria-label="정답">○</span>':'')+'</button>';}).join('');
  var star='<button type="button" class="tool-btn fe-star" id="feStar" aria-pressed="'+q.starred+'" aria-label="'+esc(label(q))+' 다시 볼 문제 표시"><span aria-hidden="true">'+(q.starred?'★':'☆')+'</span></button>';
  var answered=d.items.filter(function(x){return !!x.selectedOptionId;}).length;
  var head='<div class="fe-exam-toolbar uig-toolbar"><button type="button" class="tool-btn uig-exit" id="uigExit">← 의금부</button><p class="uig-progress"><b>'+(pos+1)+'</b> / '+d.items.length+'문항 · '+(check?s.parentId?'회차 복습':'복습':scopeLabel(s.scope)+' 오답')+' · '+esc(label(q))+'</p></div>';
  var omr='<details class="fe-omr uig-omr"'+(ctx.omrOpen?' open':'')+'><summary>답안지 <span class="fe-omr-count">'+answered+' / '+d.items.length+'</span></summary><div class="fe-omr-grid">'+d.items.map(function(x){return omrCell(x,pos);}).join('')+'</div></details>';
  var feedback=locked?'<p class="uig-feedback '+(q.review.correct?'is-correct':'is-wrong')+'" tabindex="-1">'+(q.review.correct?'정답':'오답')+' · 내 선택 '+chosen(q)+'번 · 정답 '+q.review.correctNumber+'번</p>':'';
  var dock='<div class="fe-exam-answer-side fe-full-answer-dock"><nav class="fe-full-answer-row" aria-label="답 선택과 문제 이동"><button type="button" class="tool-btn" id="fePrev"'+(!pos?' disabled':'')+' aria-label="이전 문제">‹</button><div class="fe-choices" role="group" aria-label="답 선택">'+opts+star+'</div><button type="button" class="tool-btn" id="feNext"'+(last?' disabled':'')+' aria-label="다음 문제">›</button></nav><p id="feStarStatus" role="status" aria-live="polite"></p>'+(last?'<div class="fe-full-answer-submit"><button type="button" class="check-one" id="feSubmit">제출하기</button></div>':'')+'<div id="feConfirm"></div></div>';
  paint(head+omr+'<div class="fe-exam-workspace"><div id="feImage" role="region" aria-label="원본 문제 이미지와 해설" tabindex="0"></div>'+dock+'</div><p id="uigStatus" role="status"></p><div class="uig-burst-stage" aria-hidden="true"></div>','fe-active-run');
  var box=host.querySelector('#feImage');image(q,box);if(locked){box.insertAdjacentHTML('beforeend',feedback+'<div id="uigExplain"></div>');explain(q);}
  bind('#uigExit',function(){Promise.resolve(ctx.queue).then(menu,menu);});
  bind('#fePrev',function(){go(pos-1,'#fePrev');});bind('#feNext',function(){go(pos+1,'#feNext');});bind('#feSubmit',confirmSubmit);bind('#feStar',function(){toggleStar(q);});
  host.querySelectorAll('[data-option]').forEach(function(b){b.onclick=function(){answer(q,b.dataset.option);};});
  var omrEl=host.querySelector('.uig-omr');omrEl.addEventListener('toggle',function(){ctx.omrOpen=omrEl.open;});omrEl.querySelectorAll('[data-jump]').forEach(function(b){b.onclick=function(){go(Number(b.dataset.jump),'.fe-omr-cell[data-jump="'+b.dataset.jump+'"]');};});
  host.onkeydown=function(e){if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey)return;var t=e.target,tag=t&&t.tagName;if(tag==='SELECT'||tag==='INPUT'||tag==='TEXTAREA'||(t&&t.closest&&t.closest('[role=alertdialog]')))return;if(/^[1-5]$/.test(e.key)){var b=host.querySelectorAll('.fe-choices [data-option]')[Number(e.key)-1];if(b&&!b.disabled){e.preventDefault();b.click();}}else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){var nb=host.querySelector(e.key==='ArrowRight'?'#feNext':'#fePrev');if(nb&&!nb.disabled){e.preventDefault();nb.click();}}};
 }
 function go(n,focus){var d=ctx.data;if(!d||n<0||n>=d.items.length||ctx.busy)return;d.session.currentPosition=n;if(root.HanqGradeFeedback)root.HanqGradeFeedback.clear(host);draw();var f=focus&&host.querySelector(focus);if(f&&!f.disabled)f.focus({preventScroll:true});var pane=host.querySelector('#feImage'),sc=host.closest('.device-content'),top=host.querySelector('.uig-toolbar');if(pane)pane.scrollTop=0;if(top){var y=top.getBoundingClientRect().top,base=sc?sc.getBoundingClientRect().top:0;if(y<base){if(sc)sc.scrollTop+=y-base-8;else root.scrollBy(0,y-8);}}
  clearTimeout(ctx.posTimer);var id=d.session.id;ctx.posTimer=setTimeout(function(){if(valid()&&ctx.data&&ctx.data.session.id===id&&ctx.data.session.status==='active')call('POST','/sessions/'+id+'/position',{currentPosition:n}).catch(function(){});},600);}
 function answer(q,optionId){
  var d=ctx.data,s=d.session,pos=q.position;
  if(!s.checkMode){
   // 실전처럼 바로 표시하고 순서대로 저장한다. 같은 번호를 다시 누르면 선택을 지운다.
   var next=q.selectedOptionId===optionId?null:optionId,prev=q.selectedOptionId;q.selectedOptionId=next;draw();var f=host.querySelector('[data-option="'+optionId+'"]');if(f)f.focus({preventScroll:true});
   ctx.queue=(ctx.queue||Promise.resolve()).then(function(){return call('POST','/sessions/'+s.id+'/answer',{position:pos,optionId:next});}).then(function(){},function(e){if(!valid()||ctx.data!==d)return;if(e&&e.code==='session_closed'){open(s.id);return;}if(q.selectedOptionId===next){q.selectedOptionId=prev;if(cur()===pos)draw();}note('답을 저장하지 못했어요. 다시 눌러 주세요.',true);});
   return;
  }
  if(ctx.busy||q.checked)return;
  ctx.busy=true;call('POST','/sessions/'+s.id+'/answer',{position:pos,optionId:optionId}).then(function(r){ctx.busy=false;if(!valid()||ctx.data!==d)return;d.items[pos]=r.item;if(cur()!==pos)return;
   draw();var burst=host.querySelector('.uig-burst-stage');if(root.HanqGradeFeedback)root.HanqGradeFeedback.show(host,r.item.review.correct,{key:r.item.questionId+':'+r.item.version+':'+s.id,centeredIn:burst});var fb=host.querySelector('.uig-feedback');if(fb)fb.focus({preventScroll:true});
  },function(e){ctx.busy=false;if(!valid()||ctx.data!==d)return;if(e&&e.code==='session_closed'){open(s.id);return;}note('답을 확인하지 못했어요. 다시 눌러 주세요.',true);});
 }
 function toggleStar(q){var d=ctx.data,s=d.session,want=!q.starred;q.starred=want;if(ctx.data===d&&cur()===q.position){var b=host.querySelector('#feStar');if(b){b.setAttribute('aria-pressed',String(want));b.firstChild.textContent=want?'★':'☆';}}
  call('POST','/sessions/'+s.id+'/stars',{position:q.position,starred:want,resetAt:s.resetAt||null}).then(function(){if(!valid())return;var cell=host.querySelector('[data-jump="'+q.position+'"]');if(cell)cell.classList.toggle('is-starred',want);var st=host.querySelector('#feStarStatus');if(st)st.textContent='';},function(){if(!valid())return;q.starred=!want;var b=host.querySelector('#feStar');if(b&&cur()===q.position){b.setAttribute('aria-pressed',String(!want));b.firstChild.textContent=!want?'★':'☆';}var st=host.querySelector('#feStarStatus');if(st)st.textContent='별표를 저장하지 못했어요. 다시 눌러 주세요.';});}
 function confirmSubmit(){var d=ctx.data,empty=d.items.filter(function(x){return !x.selectedOptionId;}).length,box=host.querySelector('#feConfirm');
  box.innerHTML='<div role="alertdialog" aria-labelledby="uigConfirmTitle"><p id="uigConfirmTitle">'+(empty?'아직 안 푼 문제 '+empty+'개는 틀린 것으로 계산해요. ':'')+'제출하면 답을 바꿀 수 없어요.</p><button type="button" class="check-one" id="uigConfirmYes">제출하고 채점</button><button type="button" class="tool-btn" id="uigConfirmNo">계속 풀기</button></div>';
  bind('#uigConfirmYes',function(){var k=key(),id=d.session.id;run(function(){return Promise.resolve(ctx.queue).then(function(){return call('POST','/sessions/'+id+'/submit',{submissionKey:k});});},show,function(){open(id);});});
  bind('#uigConfirmNo',function(){box.replaceChildren();var b=host.querySelector('#feSubmit');if(b)b.focus();});host.querySelector('#uigConfirmYes').focus();}
 function image(q,box){var paths=q.common?[q.common.image,q.image]:[q.image];paths.forEach(function(path){var fig=root.document.createElement('figure'),st=root.document.createElement('p');st.setAttribute('role','status');st.textContent='원본 문제를 불러오는 중이에요…';fig.appendChild(st);box.appendChild(fig);
  (ctx.cache[path]?Promise.resolve(ctx.cache[path]):api.cbtImage(path)).then(function(blob){if(!valid()||!fig.isConnected)return;ctx.cache[path]=blob;var u=root.URL.createObjectURL(blob);ctx.urls.push(u);fig.replaceChildren();if(q.common&&path===q.common.image){var cap=root.document.createElement('figcaption');cap.textContent='공통 자료 '+q.common.questionNumbers.join('·')+'번';fig.appendChild(cap);}var a=root.document.createElement('a');a.href=u;a.target='_blank';a.rel='noopener';a.setAttribute('aria-label',label(q)+' 원본 크게 보기');var img=root.document.createElement('img');img.className='mock-image';img.src=u;img.alt=q.common&&path===q.common.image?'공통 자료':label(q)+' 원본 문제·보기';a.appendChild(img);fig.appendChild(a);},function(){if(!valid()||!fig.isConnected)return;st.setAttribute('role','alert');st.textContent=label(q)+' 원본 이미지를 불러오지 못했어요.';var b=root.document.createElement('button');b.type='button';b.className='tool-btn';b.textContent='이미지 다시 불러오기';b.onclick=function(){fig.remove();image({exam:q.exam,number:q.number,image:path,common:null},box);};fig.appendChild(b);});});}
 function explain(q){var box=host.querySelector('#uigExplain');if(!box)return;var ex=root.HanqCbtExplanations,parts=null;try{parts=ex&&ex.reviewParts?ex.reviewParts(q,'final'):null;}catch(_){}
  var item=q.review.item||{},opts=Array.isArray(item.options)?item.options:[];var strong=function(t){return esc(String(t||'')).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');};
  var stem=parts&&parts.stem&&parts.stem.length?'<ul>'+parts.stem.map(function(l){return '<li>'+strong(l)+'</li>';}).join('')+'</ul>':(item.overview&&Array.isArray(item.overview.reason)?'<ul>'+item.overview.reason.slice(0,3).map(function(l){return '<li>'+strong(l)+'</li>';}).join('')+'</ul>':'<p>이 문항의 지문 해설을 확인하지 못했어요.</p>');
  var notes=q.options.map(function(o,i){var s=opts.filter(function(v){return v&&v.id===o.id;})[0]||opts[i]||{},t=Array.isArray(s.review)?s.review[0]:s.explanation||'';return '<li><b>'+CIRCLED[i]+'</b> '+(o.id===q.review.correctOptionId?'<strong>'+strong(t)+'</strong>':strong(t))+'</li>';}).join('');
  box.innerHTML='<section class="uig-explain"><h3>지문 해설</h3>'+stem+'<h3>보기별 해설</h3><ol class="uig-option-notes">'+notes+'</ol><h3>결론</h3><p><strong>정답 '+CIRCLED[q.review.correctNumber-1]+'</strong>'+(parts&&(parts.conclusion||parts.answer)?' '+strong(parts.conclusion||parts.answer):'')+'</p></section>';}

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
