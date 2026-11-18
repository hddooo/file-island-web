'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require(process.env.HANQ_JSDOM_PATH||'jsdom');
const dom=new JSDOM('<main id="feRoundMaterials"></main>',{url:'https://review.test',runScripts:'outside-only'});
const w=dom.window,host=w.document.querySelector('main');
w.URL.createObjectURL=()=> 'blob:isolated';w.URL.revokeObjectURL=()=>{};
for(const m of ['cbt-explanation-data','cbt-explanation80-data','cbt-explanations','cbt-round-materials','cbt-wrong-notebook'])w.eval(fs.readFileSync('media/'+m+'.js','utf8'));
const book={...w.HANQ_CBT_EXPLANATIONS.items,...w.HANQ_CBT_EXPLANATIONS_80.items};
const runId='10000000-0000-4000-8000-000000000001';
function request(item){
 const position=item.number-1, options=item.options.map(x=>({id:x.id,number:x.number}));
 return {questionId:item.id,version:item.v,exam:item.exam,number:item.number,points:item.points,position,runId,options,
  starred:true,everWrong:false,selectedOptionId:null,image:'/api/v1/cbt/runs/'+runId+'/questions/'+position+'/image',common:null,
  review:{status:'unanswered',correctNumber:item.answer,correctOptionId:options[item.answer-1].id,item,options:item.options}};
}
const parts=(q,status='final')=>w.HanqCbtExplanations.reviewParts(q,status);
const expected=['지문 해설','보기별 해설','결론'];
const headings=box=>[...box.querySelectorAll(':scope > section > h4')].map(x=>x.textContent);
const initial=request(book['exam-71-22']);
const legacy=request(book['exam-71-23']);legacy.version='stored-other-version';legacy.review.item=null;
const data={scope:'exam-starred-or-ever-wrong',round:71,items:[initial,legacy],hasMore:false,pendingStarCount:0};
const saved=JSON.stringify(data),api={state:()=>({signedIn:true,ownerId:'synthetic',epoch:1}),
 cbt:async(method,path)=>{assert.equal(method,'GET');assert.equal(path,'/api/v1/cbt/review-materials/71');return data;},
 cbtImage:async()=>new Blob(['synthetic'])};
const control=action=>host.querySelector('[data-round-review-action="'+action+'"]');
const choice=number=>host.querySelectorAll('[data-review-choice]')[number-1];
const display=()=>host.querySelector('.fe-round-review-explanation');
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 assert.equal(Object.keys(book).length,550);
 for(const item of Object.values(book)){
  const q=request(item),p=parts(q);
  assert(p?.stem.length>0,item.id);assert(p?.conclusion,item.id);
  assert.equal(parts(q,'active'),null,item.id);
 }
 // A second historical clue must not appear under the conclusion heading.
 for(const [id,count,last,conclusion] of [
  ['exam-72-14',3,/개경 환도/,/\(나\) → \(다\) → \(가\)/],
  ['exam-72-30',2,/관세와 방곡령.*조일 통상 장정/,/1882년 조미 수호 통상 조약.*사이/],
  ['exam-72-47',2,/과전법.*세조의 직전법/,/\(가\)→\(나\)→\(다\)→\(라\)/],
 ]){
  const q=request(book[id]),p=parts(q);
  assert.equal(p.stem.length,count,id);assert.match(p.stem.at(-1),last,id);assert.match(p.conclusion,conclusion,id);
 }
 assert.equal(parts(legacy),null);
 const wrongOption=request(book['exam-71-22']);wrongOption.options[0].id='different';assert.equal(parts(wrongOption),null);
 const full=w.document.createElement('div');full.innerHTML=w.HanqCbtExplanations.render(initial,null,'final');
 assert.deepEqual(headings(full.querySelector('.fe-explanation')),expected);
 assert.match(full.querySelector('.fe-exp-conclusion').textContent,/김상헌.*척화론/);
 const replay=w.HanqCbtRoundMaterials.mount(host,{api,round:71});await replay.ready;
 assert.equal(display(),null);choice(4).click();assert.equal(display(),null);
 control('check').click();await tick();
 let box=display();assert.deepEqual(headings(box),expected);
 const stem=[...box.querySelectorAll('.fe-round-review-stem li')];
 assert.equal(stem.length,2);assert.match(stem[0].textContent,/^\(가\).*이괄의 난\(1624\).*인조/);
 assert.match(stem[1].textContent,/^\(나\).*심양.*소현 세자.*인질/);assert(stem.every(x=>x.querySelector('strong')));
 const options=box.querySelectorAll('.fe-round-review-option-notes li');
 assert.equal(options.length,5);assert.equal(options[4].lastElementChild.tagName,'STRONG');
 assert.match(box.querySelector('.fe-round-review-conclusion').textContent,/정답 ⑤.*병자호란.*김상헌.*척화론/);
 control('next').click();assert.equal(display(),null);choice(3).click();control('check').click();await tick();
 box=display();assert.deepEqual(headings(box),expected);
 assert.match(box.querySelector('.fe-round-review-stem').textContent,/확인하지 못했어요/);
 assert.equal(box.querySelector('.fe-round-review-conclusion p'),null);
 assert.equal(JSON.stringify(data),saved);replay.stop();
 console.log('PASS all 550 exact CBT passages, requested section order in final and round review, 71-22 separate source clues, correct emphasis, no spoilers, mismatch fallback, GET only and source immutability');
})().catch(e=>{console.error(e);process.exitCode=1;});
