'use strict';
// Synthetic review data only. No API, learner records, or textbook material.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('../.test-tools/node_modules/jsdom');
const code=fs.readFileSync(path.join(__dirname,'../media/toeic-cbt.js'),'utf8');
let checks=0;const ok=(value,label)=>{assert(value,label);checks++;};
function fixture({transfer=true,compact=false}={}){
 const dom=new JSDOM('<main class="tc tc-simple"><article class="tc-question"><p class="qtext">Synthetic original question.</p><div class="choices"></div><section class="tc-result"></section></article></main>',{runScripts:'outside-only'}),w=dom.window,host=w.document.querySelector('.tc-result');
 const choices=['A','B','C','D'].map(id=>({id,text:'Synthetic choice '+id}));
 for(const c of choices){const b=w.document.createElement('button');b.dataset.option=c.id;b.textContent=c.text;w.document.querySelector('.choices').appendChild(b);}
 const review={correctOptionId:'A',choices,script:'Synthetic verified script.',scriptStatus:'verified',tutorExplanation:{answerReason:'Synthetic answer reason.',translation:'합성 전체 해석.',options:choices.map(c=>({id:c.id,explanation:'Synthetic explanation '+c.id})),checkQuestions:[{id:'synthetic-drill',prompt:'Synthetic extra question.'}]}};
 if(compact)review.optionStudy={available:true,answer:'A',structure:'Synthetic sentence structure.',options:choices.map(c=>({...c,form:'noun',meaning:'합성 뜻 '+c.id,reason:'Synthetic comparison '+c.id,example:'Synthetic usage '+c.id,translation:'합성 예문 해석 '+c.id}))};
 let practiceCalls=0,linkCalls=0;
 if(transfer)w.HanqToeicTransfer={shortText:s=>String(s||''),plan:()=>({steps:['Synthetic step.'],concept:'Synthetic concept.'}),renderPractice(parent){practiceCalls++;const f=w.document.createElement('fieldset');f.className='tc-transfer-practice';f.textContent='Synthetic extra question.';parent.appendChild(f);}};
 w.HanqToeicStudyLinks={render(parent){linkCalls++;const a=w.document.createElement('a');a.className='tc-study-link';a.href='#toeic/grammar';a.textContent='Synthetic study link';parent.appendChild(a);}};
 w.eval(code);
 const before=JSON.stringify(review);
 return {dom,w,host,review,before,render:context=>w.HanqToeicCbt.renderExplanation(host,review,context),practiceCalls:()=>practiceCalls,linkCalls:()=>linkCalls,close(){ok(JSON.stringify(review)===before,'review source data is unchanged');dom.window.close();}};
}
for(const part of [5,6])for(const transfer of [true,false])for(const omitScript of [true,false]){
 const f=fixture({transfer});f.render({part,number:101,omitScript});
 ok(f.host.querySelectorAll('.tc-explain-section').length===1,'only explanation section remains');
 ok(f.host.querySelector('.tc-tutor-core').textContent==='Synthetic answer reason.','answer reason remains');
 ok(f.host.querySelectorAll('.tc-option-reason').length===4,'all choice explanations remain');
 ok(f.host.querySelector('.tc-complete-translation').textContent==='합성 전체 해석.','full translation remains');
 ok(f.host.querySelector('.tc-complete-translation').getAttribute('aria-label')===(part===5?'문장 해석':'공통지문 해석'),'translation semantics remain');
 ok(f.linkCalls()===1&&f.host.querySelector('.tc-study-link'),'supplemental learning link remains');
 ok(f.practiceCalls()===0,'extra practice renderer is never called');
 ok(!f.host.querySelector('.tc-transfer-practice'),'extra exercises are not mounted');
 ok(!/활용해보기|관련 연습 자료|Synthetic extra question/.test(f.host.textContent),'no empty practice heading or loading text');
 f.close();
}
// Part 5 compact option study still annotates original choices and offers usage examples.
{
 const f=fixture({compact:true});f.render({part:5,number:101});
 ok(!f.host.querySelector('.tc-tutor-core'),'compact reason is replaced by the existing comparison');
 ok(f.w.document.querySelectorAll('[data-option] .tc-option-gloss').length===4,'choice meanings remain');
 ok(f.host.querySelectorAll('.tc-option-why').length===4,'all comparison reasons remain');
 ok(f.host.querySelector('.tc-option-context').textContent==='Synthetic sentence structure.','sentence structure remains');
 ok(f.w.document.querySelector('.qtext').nextElementSibling.className==='tc-complete-translation','original translation placement remains');
 ok(f.host.querySelector('.tc-option-examples summary').textContent==='사용 예 더 보기','usage examples are preserved, not treated as drills');
 ok(f.host.querySelectorAll('.tc-option-examples p').length===4,'all usage examples remain');
 ok(!f.host.querySelector('.tc-transfer-practice')&&f.practiceCalls()===0,'compact view has no extra drills');
 f.close();
}
// Existing LC Script, group omission, Part 7 and non-Part fallback are unchanged.
for(const part of [1,2,3,4,7])for(const omitScript of [false,true]){
 const f=fixture();f.render({part,omitScript});
 ok(f.host.querySelectorAll('.tc-option-reason').length===4,'non-target choice explanations remain');
 ok(f.practiceCalls()===0&&f.linkCalls()===0,'other parts do not acquire RC practice or links');
 ok(!!f.host.querySelector('.tc-script-en')===(part<=4&&!omitScript),'LC Script visibility unchanged');
 ok(!f.host.textContent.includes('활용해보기'),'Part 7 remains without extra practice');
 f.close();
}
for(const context of [undefined,{}, {part:8}]){
 const f=fixture();f.render(context);
 ok(f.practiceCalls()===1&&f.host.querySelector('.tc-transfer-practice'),'legacy fallback outside known parts unchanged');
 f.close();
}
console.log('PASS '+checks+' review display checks: Part 5/6 drills hidden; explanations, usage examples, links, LC, Part 7 and source data preserved.');
