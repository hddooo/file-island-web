/* Public repeatable practice. Session-only state; no API, storage, rewards or original CBT grading keys. */
(function(root){'use strict';
var ERAS=['ancient','goryeo','joseon','opening','colonial','modern'];
var LABEL={ancient:'고대사',goryeo:'고려',joseon:'조선',opening:'개화기',colonial:'일제강점기',modern:'현대사'};
function shuffle(a,rng){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(rng()*(i+1)),x=a[i];a[i]=a[j];a[j]=x;}return a;}
function create(bank,rng){
 rng=rng||Math.random;
 if(!Array.isArray(bank)||!bank.length||bank.length%6||bank.some(function(q){return ERAS.indexOf(q.era)<0||!q.question||!q.explanation||q.options.length!==4||!q.options.some(function(o){return o.id===q.correctOptionId;});}))throw Error('Quiz bank unavailable');
 var source=bank.map(function(q){return {id:q.id,era:q.era,question:q.question,explanation:q.explanation,correctOptionId:q.correctOptionId,options:q.options.map(function(o){return {id:o.id,text:o.text};})};});
 var perEra=bank.length/6;if(ERAS.some(function(e){return source.filter(function(q){return q.era===e;}).length!==perEra;}))throw Error('Unbalanced quiz bank');
 var sequence=[],pos=0,turn=0,phase='asked',selected=null,correct=0,cycle=0;
 function reset(){
  var last=sequence.length?sequence[sequence.length-1].era:null,previousFirst=sequence.length?sequence[0].id:null,queues={};
  ERAS.forEach(function(e){queues[e]=shuffle(source.filter(function(q){return q.era===e;}),rng);});sequence=[];
  for(var b=0;b<perEra;b++){
   var order=shuffle(ERAS,rng);if(order[0]===last){var x=order[0];order[0]=order[1];order[1]=x;}
   order.forEach(function(e){if(!sequence.length&&queues[e][0].id===previousFirst&&queues[e].length>1){var q=queues[e][0];queues[e][0]=queues[e][1];queues[e][1]=q;}var q=queues[e].shift();sequence.push({id:q.id,era:q.era,question:q.question,explanation:q.explanation,correctOptionId:q.correctOptionId,options:shuffle(q.options,rng)});});last=order[5];
  }
  pos=0;phase='asked';selected=null;correct=0;turn++;cycle++;
 }
 function view(){
  var q=sequence[pos],v={turn:turn,phase:phase,cycle:cycle,number:pos+1,total:sequence.length,answered:phase==='done'?sequence.length:pos+(phase==='graded'?1:0),correct:correct};
  if(phase==='done')return v;
  v.id=q.id;v.question=q.question;v.options=q.options.map(function(o){return {id:o.id,text:o.text};});
  if(phase==='graded'){v.selectedOptionId=selected;v.correctOptionId=q.correctOptionId;v.isCorrect=selected===q.correctOptionId;v.eraLabel=LABEL[q.era];v.explanation=q.explanation;}
  return v;
 }
 function choose(id,expectedTurn){if(expectedTurn!==turn||phase!=='asked'||!sequence[pos].options.some(function(o){return o.id===id;}))return false;selected=id;phase='graded';if(id===sequence[pos].correctOptionId)correct++;return true;}
 function next(expectedTurn){if(expectedTurn!==turn||phase!=='graded')return false;turn++;selected=null;if(pos===sequence.length-1)phase='done';else{pos++;phase='asked';}return true;}
 function restart(expectedTurn){if(expectedTurn!==turn||phase!=='done')return false;reset();return true;}
 reset();return {view:view,choose:choose,next:next,restart:restart};
}
function mount(host,opts){
 opts=opts||{};var doc=host.ownerDocument,alive=true,controller;
 try{controller=create(root.HANQ_MIXED_REVIEW_BANK,opts.random);}catch(e){host.textContent='퀴즈 자료를 불러오지 못했어요. 페이지를 새로고침해 주세요.';return {stop:function(){host.replaceChildren();}};}
 function el(tag,cls,text){var e=doc.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
 function button(text,cls,fn){var b=el('button','tool-btn '+cls,text);b.type='button';b.onclick=function(){if(alive)fn();};return b;}
 function render(focus){
  if(!alive)return;var v=controller.view(),section=el('section','mixed-quiz');section.setAttribute('aria-label','전체범위 4지선다 퀴즈');
  if(v.phase==='done'){
   var finish=el('h3','mixed-quiz__question','한 바퀴를 풀었어요');finish.tabIndex=-1;section.appendChild(finish);section.appendChild(el('p','mixed-quiz__result',v.total+'문항 중 '+v.correct+'문항 정답'));
   section.appendChild(el('p','mixed-quiz__hint','문제와 선택지를 섞어 다시 풀 수 있어요.'));
   section.appendChild(button('다시 섞어서 풀기','mixed-quiz__restart',function(){if(controller.restart(v.turn))render(true);}));
  }else{
   section.appendChild(el('p','mixed-quiz__progress','문제 '+v.number+' / '+v.total));
   var title=el('h3','mixed-quiz__question',v.question);title.id='mixed-question-'+v.turn;title.tabIndex=-1;section.appendChild(title);
   var choices=el('div','mixed-quiz__choices');choices.setAttribute('role','group');choices.setAttribute('aria-labelledby',title.id);
   v.options.forEach(function(o,i){
    var b=button('', 'mixed-quiz__choice',function(){if(controller.choose(o.id,v.turn))render('feedback');});b.setAttribute('data-mixed-option',o.id);
    b.appendChild(el('span','mixed-quiz__number',String(i+1)));b.appendChild(el('span','mixed-quiz__option-text',o.text));
    if(v.phase==='graded'){
     b.disabled=true;b.setAttribute('aria-pressed',String(o.id===v.selectedOptionId));
     if(o.id===v.correctOptionId){b.classList.add('is-correct');b.appendChild(el('span','mixed-quiz__badge','정답'));}
     if(o.id===v.selectedOptionId&&o.id!==v.correctOptionId){b.classList.add('is-wrong');b.appendChild(el('span','mixed-quiz__badge','내 선택'));}
    }
    choices.appendChild(b);
   });section.appendChild(choices);
   if(v.phase==='graded'){
    var feedback=el('div','mixed-quiz__feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.tabIndex=-1;
    feedback.appendChild(el('strong',null,v.isCorrect?'맞았어요':'다시 연결해 봐요'));
    if(!v.isCorrect)feedback.appendChild(el('p',null,'정답: '+v.options.find(function(o){return o.id===v.correctOptionId;}).text));
    feedback.appendChild(el('p','mixed-quiz__era',v.eraLabel));feedback.appendChild(el('p',null,v.explanation));section.appendChild(feedback);
   }
   var next=button(v.number===v.total?'이번 바퀴 결과 보기':'다음 문제','mixed-quiz__next',function(){if(controller.next(v.turn))render(true);});next.disabled=v.phase!=='graded';section.appendChild(next);
  }
  host.replaceChildren(section);
  var target=focus==='feedback'?section.querySelector('.mixed-quiz__feedback'):focus?section.querySelector('.mixed-quiz__question'):null;
  if(target)target.focus({preventScroll:true});
 }
 render(false);
 return {stop:function(){alive=false;host.replaceChildren();}};
}
root.HanqMixedReviewQuiz={create:create,mount:mount};
if(typeof module!=='undefined'&&module.exports)module.exports=root.HanqMixedReviewQuiz;
})(typeof window!=='undefined'?window:globalThis);
