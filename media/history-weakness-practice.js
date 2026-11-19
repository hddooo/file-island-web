(function(root){
'use strict';
var active=null, alphabet='①②③④', names={'modern':'대한민국','ancient':'고대사','opening-colonial':'개화기·일제강점기'};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(x){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x];});}
function list(q){return Array.isArray(q)&&q.length===50&&q.every(function(x,i){return x&&typeof x==='object'&&typeof x.id==='string'&&typeof x.prompt==='string'&&Array.isArray(x.options)&&x.options.length===4&&x.options.every(function(t){return typeof t==='string';})&&Array.isArray(x.explain)&&x.explain.length===4&&[1,2,3,4].includes(x.answer);});}
function fresh(part,signature){return {part:part,signature:signature,position:0,answers:Array(50).fill(0),submitted:false};}
function stop(){if(active){active.off?.();active=null;}}
function mount(host,opts){
 stop();var part=opts.part,book=root.HanqWeaknessPracticeBank||{},questions=book[part];if(!names[part]||!list(questions))return false;
 var owner=opts.owner();if(!owner)return false;
 var key='hanq:weakness-practice:v1:'+encodeURIComponent(owner)+':'+part;
 var signature=(book.version||'v1')+':'+questions.map(function(q){return q.id;}).join(',');
 var s=fresh(part,signature),warn=false,showList=false,confirming=false,review=false;
 var a={off:opts.onAccountChange?.(function(){if(opts.owner()!==owner){stop();opts.back();}})};active=a;
 function valid(){return active===a&&host.isConnected&&opts.owner()===owner;}
 try{
   var old=JSON.parse(root.localStorage.getItem(key)||'null');
   if(old&&old.part===part&&old.signature===signature&&typeof old.submitted==='boolean'&&Number.isInteger(old.position)&&old.position>=0&&old.position<50&&Array.isArray(old.answers)&&old.answers.length===50&&old.answers.every(function(x){return [0,1,2,3,4].includes(x);}))s=old;
 }catch(_){warn=true;}
 function save(){if(!valid())return;try{root.localStorage.setItem(key,JSON.stringify(s));}catch(_){warn=true;}}
 function chooseAction(e){var b=e.target.closest('button[data-wp-action]');if(!b||!host.contains(b)||!valid())return;var v=Number(b.dataset.wpValue),act=b.dataset.wpAction;
  if(act==='back'){stop();opts.back();return;}
  if(act==='list'){showList=!showList;paint('list');return;}
  if(act==='jump'&&Number.isInteger(v)&&v>=0&&v<50){s.position=v;review=s.submitted;showList=false;save();paint('heading');return;}
  if(act==='select'&&!s.submitted&&!confirming&&v>=1&&v<=4){s.answers[s.position]=v;save();paint('choice-'+v);return;}
  if(act==='prev'||act==='next'){s.position=Math.max(0,Math.min(49,s.position+(act==='prev'?-1:1)));save();paint('heading');return;}
  if(act==='submit'&&!s.submitted){confirming=true;paint('cancel');return;}
  if(act==='cancel'){confirming=false;paint('submit');return;}
  if(act==='finalize'&&confirming&&!s.submitted){s.submitted=true;confirming=false;showList=false;review=false;save();paint('heading');return;}
  if(act==='summary'&&s.submitted){review=false;showList=false;paint('heading');return;}
  if(act==='retry'&&s.submitted){s=fresh(part,signature);review=false;showList=false;save();paint('heading');}
 }
 host.onclick=chooseAction;
 function b(a,label,extra){return '<button type="button" data-wp-action="'+a+'" '+(extra||'')+'>'+label+'</button>';}
 function paint(focus){if(!valid())return;var q=questions[s.position],sel=s.answers[s.position],count=s.answers.filter(Boolean).length,right=s.answers.reduce(function(n,choice,i){return n+(choice===questions[i].answer?1:0);},0);
  var html='<section class="weakness-practice" aria-labelledby="wpHeading"><header class="wp-bar"><span>'+String(s.position+1)+' / 50</span><strong>응답 '+count+' / 50</strong>'+b('list','문제목록','aria-expanded="'+showList+'" aria-controls="wpList"')+'</header>';
  if(showList){html+='<nav id="wpList" class="wp-list" aria-label="문제 번호">'+questions.map(function(x,i){var chosen=s.answers[i],suffix=s.submitted?(chosen===x.answer?' O':' X'):chosen?' ✓':'';return b('jump',String(i+1)+suffix,'data-wp-value="'+i+'" aria-current="'+(i===s.position?'step':'false')+'"');}).join('')+'</nav>';}
  if(s.submitted&&!review){
   html+='<div class="wp-paper"><h2 id="wpHeading" tabindex="-1">'+names[part]+' 점검 결과</h2><div class="wp-score"><strong>'+right*2+'%</strong><p>'+right+' / 50문항 정답 · '+(right===50?'모두 맞았어요.':'틀린 문항을 다시 확인해 보세요.')+'</p></div><h3>문항별 결과</h3><div class="wp-list" aria-label="문항별 정오답">'+questions.map(function(x,i){return b('jump',String(i+1)+(s.answers[i]===x.answer?' O':' X'),'data-wp-value="'+i+'"');}).join('')+'</div><div class="wp-actions">'+b('back','자료로 돌아가기')+b('retry','새로 풀기')+'</div></div>';
  }else{
   html+='<div class="wp-paper"><p class="wp-kicker">'+names[part]+' · '+(s.submitted?'결과 보기':'약점 점검')+'</p><h2 id="wpHeading" tabindex="-1">'+esc(q.prompt)+'</h2>';
   if(q.image&&/^media\/[a-zA-Z0-9-_/]+\.(png|jpg|jpeg|webp)$/.test(q.image))html+='<img class="wp-question-image" data-weakness-study-image src="'+esc(q.image)+'" alt="문제 자료 그림">';
   html+='<ol class="wp-choices">'+q.options.map(function(text,i){var n=i+1, correct=s.submitted&&q.answer===n;return '<li>'+b('select','<span>'+alphabet[i]+'</span> '+esc(text)+(correct?'<strong>정답</strong>':s.submitted&&sel===n?'<strong>내 답</strong>':''),'id="wpChoice'+n+'" data-wp-value="'+n+'" aria-pressed="'+(sel===n)+'" '+(s.submitted||confirming?'disabled':'')+(correct?' class="wp-right"':''))+'</li>';}).join('')+'</ol>';
   if(s.submitted){
    html+='<div class="wp-explain"><h3>지문 해설</h3><p>'+esc(q.stem)+'</p><h3>보기별 해설</h3><ol>'+q.explain.map(function(t,i){return '<li>'+alphabet[i]+' '+(i+1===q.answer?'<strong>'+esc(t)+'</strong>':esc(t))+'</li>';}).join('')+'</ol><h3>결론</h3><p>'+esc(q.conclusion)+'</p><small>근거: '+esc(q.source)+'</small></div>';
   }
   if(confirming){html+='<div class="wp-confirm" role="group" aria-label="최종 제출 확인"><p>'+(50-count?('미응답 '+(50-count)+'문항이 있어요. '):'')+'제출하면 답을 바꿀 수 없어요.</p><div class="wp-actions">'+b('cancel','계속 풀기')+b('finalize','제출하기')+'</div></div>';}
   html+='</div><div class="wp-dock">'+b('prev','이전',(s.position===0||confirming?'disabled':''))+'<div class="wp-dock-options">'+(s.submitted?'':q.options.map(function(_,i){return b('select',String(i+1),'data-wp-value="'+(i+1)+'" aria-pressed="'+(sel===i+1)+'" '+(confirming?'disabled':''));}).join(''))+'</div>'+b('next','다음',(s.position===49||confirming?'disabled':''))+'</div><div class="wp-actions wp-final-actions">'+b('back','자료로 돌아가기')+(s.submitted?b('summary','결과표'):b('submit','최종 제출',confirming?'disabled':''))+'</div>';
  }
  if(warn)html+='<p role="status">기기 저장이 되지 않아 새로고침하면 답이 남지 않을 수 있어요.</p>';
  host.innerHTML=html+'</section>';
  var t=focus==='heading'?host.querySelector('#wpHeading'):focus&&focus.startsWith('choice-')?host.querySelector('#wpChoice'+focus.slice(-1)):focus?host.querySelector('[data-wp-action="'+focus+'"]'):null;
  if(t)t.focus({preventScroll:focus!=='heading'});
 }
 paint('heading');return true;
}
root.HanqWeaknessPractice={mount:mount,stop:stop};
}(window));
