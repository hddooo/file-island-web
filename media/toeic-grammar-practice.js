(function(root){
'use strict';
var active=null,scrollMode=null,sessions=Object.create(null);
function el(tag,text,parent){var n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(parent)parent.appendChild(n);return n;}
function button(text,parent,fn){var b=el('button',text,parent);b.type='button';b.onclick=fn;return b;}
function stop(){if(root.HanqWeaknessPractice)root.HanqWeaknessPractice.stop();if(scrollMode!==null){history.scrollRestoration=scrollMode;scrollMode=null;}if(root.HanqGradeFeedback)root.HanqGradeFeedback.clear();if(active)active();active=null;}
function mount(host,opts){
 stop();if(root.HanqWeaknessPractice&&root.HanqWeaknessPractice.isBank(opts&&opts.bankId))return root.HanqWeaknessPractice.mount(host,opts);scrollMode=history.scrollRestoration;history.scrollRestoration='manual';opts=opts||{};var bankId=opts.bankId==='connectors-100'?'connectors-100':'positions-100',data=bankId==='connectors-100'?root.HANQ_TOEIC_CONNECTOR_PRACTICE:root.HANQ_TOEIC_POSITION_PRACTICE,session=sessions[bankId]||(sessions[bankId]={position:1,answers:Object.create(null)}),alive=true,anticipation=null;
 host.replaceChildren();host.className='tg tg-drill';host.dataset.bankId=bankId;
 if(!data||!Array.isArray(data.questions)||data.questions.length!==100){el('p','문제를 불러오지 못했어요. 문법노트 목차에서 다시 열어 주세요.',host);return;}
 var number=Number(opts.number)||session.position;number=Math.min(100,Math.max(1,Math.floor(number)));session.position=number;
 var q=data.questions[number-1],state=session.answers[q.id],heading=el('h2',data.title,host);heading.tabIndex=-1;
 var top=el('nav',undefined,host);top.className='tg-contents';top.setAttribute('aria-label','문법노트 학습 이동');button('← 문법노트 목차',top,function(){if(opts.onBack)opts.onBack();});
 el('p',data.notice,host).className='tg-notice';
 function navigate(n){if(!alive)return;if(root.HanqGradeFeedback)root.HanqGradeFeedback.clear();session.position=n;if(opts.onNavigate)opts.onNavigate(String(n).padStart(3,'0'));}
 var summary=el('p',undefined,host);summary.className='tg-drill-progress';summary.setAttribute('role','status');
 function progress(){var done=Object.keys(session.answers).length;summary.textContent='현재 '+String(number).padStart(3,'0')+' / 100 · 답 확인 '+done+' / 100';}
 progress();
 var picker=el('details',undefined,host);picker.className='tg-drill-picker';el('summary','문제번호 선택 · '+String(number).padStart(3,'0'),picker);
 var grid=el('nav',undefined,picker);grid.className='tg-drill-grid';grid.setAttribute('aria-label','100제 문제번호');
 data.questions.forEach(function(item,i){var n=i+1,a=session.answers[item.id],label=String(n).padStart(3,'0'),b=button(label,grid,function(){navigate(n);});b.dataset.number=label;if(n===number)b.setAttribute('aria-current','page');if(a){b.dataset.result=a.choice===item.answer?'correct':'incorrect';el('small',a.choice===item.answer?'O':'X',b);}b.setAttribute('aria-label',label+'번'+(n===number?' · 현재 문제':'')+(a?(a.choice===item.answer?' · 정답':' · 오답'):' · 미풀이'));});
 var card=el('fieldset',undefined,host);card.className='tg-practice tg-drill-question';card.dataset.practiceId=q.id;
 var legend=el('legend',String(number).padStart(3,'0')+'. '+q.stem,card);legend.lang='en';legend.tabIndex=-1;
 var choices=el('div',undefined,card);choices.className='tg-drill-choices';var buttons=[];
 var feedback=el('div',undefined,card);feedback.className='tg-feedback';feedback.setAttribute('role','status');
 var retry=button('이 문제 다시 풀기',card,function(){delete session.answers[q.id];state=null;delete card.dataset.result;feedback.replaceChildren();buttons.forEach(function(b){b.disabled=false;b.setAttribute('aria-pressed','false');});retry.hidden=true;if(root.HanqGradeFeedback)root.HanqGradeFeedback.clear(card);progress();refreshGrid();buttons[0].focus();});retry.hidden=true;
 function refreshGrid(){var b=grid.querySelector('[data-number="'+String(number).padStart(3,'0')+'"]');var small=b.querySelector('small');if(small)small.remove();delete b.dataset.result;if(state){b.dataset.result=state.choice===q.answer?'correct':'incorrect';el('small',state.choice===q.answer?'O':'X',b);}b.setAttribute('aria-label',String(number).padStart(3,'0')+'번 · 현재 문제'+(state?(state.choice===q.answer?' · 정답':' · 오답'):' · 미풀이'));}
 function reveal(animate){if(animate&&root.HanqStudyTransition)return root.HanqStudyTransition.update(host,function(){return revealContent(animate);});return revealContent(animate);}function revealContent(animate){var right=state.choice===q.answer;card.dataset.result=right?'correct':'incorrect';buttons.forEach(function(b,i){b.disabled=true;b.setAttribute('aria-pressed',String(i===state.choice));});feedback.replaceChildren();el('p',(right?'정답':'오답')+' · 정답 '+String.fromCharCode(65+q.answer)+' ('+q.choices[q.answer]+')',feedback).className='tg-drill-result';var sentence=el('p',undefined,feedback);sentence.lang='en';var parts=q.stem.split('________');sentence.appendChild(document.createTextNode(parts[0]));el('mark',q.choices[q.answer],sentence);sentence.appendChild(document.createTextNode(parts[1]));el('p',q.translation,feedback).className='tg-translation';el('h3',bankId==='connectors-100'?'정답 근거·보기별 해설':'보기별 해설',feedback);q.choices.forEach(function(text,i){var row=el('section',undefined,feedback);row.className='tg-option-analysis';el('h4',String.fromCharCode(65+i)+' · '+text+(i===q.answer?' · 정답':' · 오답'),row);el('p',q.optionReasons[i],row);});retry.hidden=false;progress();refreshGrid();if(animate&&root.HanqGradeFeedback)root.HanqGradeFeedback.show(card,right,{key:q.id});}
 q.choices.forEach(function(text,i){var b=button(String.fromCharCode(65+i)+' · '+text,choices,function(){if(state||!alive||anticipation)return;buttons.forEach(function(x){x.disabled=true;});if(root.HanqStudyPresentation){anticipation=HanqStudyPresentation.seal(card,3000,'정답 봉인을 확인하고 있어요');var wait=anticipation;wait.minimum.then(function(){if(!alive||anticipation!==wait)return;wait.stop();anticipation=null;state={choice:i};session.answers[q.id]=state;reveal(true);});}else{state={choice:i};session.answers[q.id]=state;reveal(true);}});b.setAttribute('aria-pressed','false');buttons.push(b);});
 card.appendChild(feedback);card.appendChild(retry);
 if(state)reveal(false);
 var nav=el('nav',undefined,host);nav.className='tg-drill-navigation';nav.setAttribute('aria-label','이전 다음 문제');var prev=button('← 이전 문제',nav,function(){navigate(number-1);});prev.disabled=number===1;var next=button(number===100?'마지막 문제':'다음 문제 →',nav,function(){navigate(number+1);});next.disabled=number===100;
 el('p','답을 고르면 바로 해설이 나옵니다. 자동으로 다음 문제로 넘어가지 않아요. 새로고침하면 이 화면의 선택 답은 초기화됩니다.',host).className='tg-notice';
 active=function(){if(anticipation)anticipation.stop();anticipation=null;if(root.HanqStudyTransition)root.HanqStudyTransition.cancel(host);alive=false;};
}
root.HanqToeicGrammarPractice={mount:mount,stop:stop};
})(typeof window!=='undefined'?window:globalThis);
