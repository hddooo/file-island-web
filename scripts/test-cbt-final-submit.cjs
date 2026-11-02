'use strict';
// Synthetic transport only: no operating API, browser profile, or real answers.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom'),create=require('./fixtures/cbt-study-fixture.js');
let checks=0;
const ok=(v,m)=>{assert(v,m);checks++;},eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const settle=async()=>{for(let i=0;i<150;i++)await Promise.resolve();};
async function scenario(kind,count){
 const dom=new JSDOM('<main></main>',{url:'https://final-submit.test',runScripts:'outside-only'}),w=dom.window,h=w.document.querySelector('main');
 w.HTMLElement.prototype.scrollIntoView=function(){};w.URL.createObjectURL=()=> 'blob:fixture';w.URL.revokeObjectURL=()=>{};
 for(const name of ['cbt-classification79.js','cbt-classifications.js','cbt-result-analysis.js','formal-exams.js'])w.eval(fs.readFileSync(path.join(__dirname,'../media',name),'utf8'));
 const f=create(w),errors=[],attempts=[];w.addEventListener('error',e=>errors.push(e.message));
 const transport=f.api.cbt;let fail=false,hold=false,release;
 f.api.cbt=async(method,url,body)=>{if(method==='POST'&&url.endsWith('/submit')){attempts.push(JSON.parse(JSON.stringify(body)));if(fail){fail=false;throw Object.assign(Error('offline'),{status:0});}if(hold)await new Promise(resolve=>{release=resolve;});}return transport(method,url,body);};
 const mount=async id=>{w.HanqFormalExams.mount(h,f.opts(),id);await settle();};
 const click=async sel=>{const b=h.querySelector(sel);assert(b,'missing '+sel);b.click();await settle();};
 const jump=async pos=>{const e=h.querySelector('#feJump');e.value=String(pos);e.dispatchEvent(new w.Event('change'));await settle();};
 const chosen=()=>h.querySelector('[data-option][aria-pressed=true]');
 const label=kind+' '+count+': ';
 try{
  let id=f.create(79,true);
  if(kind==='review'){
   const positions=count===1?[49]:[0,4,48];positions.forEach(pos=>f.wrong(id,pos));
   const d=await f.api.cbt('POST','/api/v1/cbt/reviews',{round:79,idempotencyKey:'final-'+count});id=d.run.id;
  }
  const route=kind==='review'?'review-'+id:id;
  await mount(route);if(h.querySelector('#feStart'))await click('#feStart');
  eq(h.querySelectorAll('#feJump option').length,count,label+'actual item count');
  if(count>1){
   eq(h.querySelector('#feNext').textContent,'다음',label+'middle next label');ok(!h.querySelector('#feNext').disabled,label+'middle next remains available unanswered');
   ok(h.querySelector('#feSubmit'),label+'existing early-submit control retained');
   await click('#feSubmit');ok(h.querySelector('[role=alertdialog]'),label+'early-submit confirmation retained');await click('#feConfirmNo');
   await click('#feNext');eq(Number(h.querySelector('#feJump').value),1,label+'middle next navigates');await jump(count-1);
  }
  const before=h.querySelector('#feNext'),image=h.querySelector('#feImage');
  eq(before.textContent,'제출하기',label+'last next becomes submit');ok(before.disabled,label+'last unanswered disabled');
  eq(before.parentNode.children[1],before,label+'same navigation slot');eq(h.querySelectorAll('#feSubmit').length,0,label+'no duplicate final submit button');
  if(kind==='review')eq(h.querySelector('#feJump option:last-child').textContent.startsWith(count===1?'50번':'49번'),true,label+'subset end uses actual position, not original number');
  before.click();await settle();ok(!h.querySelector('[role=alertdialog]'),label+'disabled click cannot open confirmation');
  await click('[data-option]:nth-child(2)');eq(h.querySelector('#feNext'),before,label+'choosing retains navigation element');ok(!before.disabled,label+'answer immediately enables submit');eq(h.querySelector('#feImage'),image,label+'answer retains original image');
  eq(attempts.length,0,label+'choosing alone never submits');ok(!h.querySelector('[role=alertdialog]'),label+'choosing alone never opens confirmation');
  await click('#feStar');ok(h.querySelector('#feStar').getAttribute('aria-pressed')==='true',label+'last question star saved');ok(!before.disabled,label+'star keeps answered submit enabled');
  if(count>1){
   await click('#fePrev');eq(h.querySelector('#feNext').textContent,'다음',label+'previous restores next label');ok(!h.querySelector('#feNext').disabled,label+'previous next enabled');
   await click('#feNext');eq(h.querySelector('#feNext').textContent,'제출하기',label+'return to last restores submit');ok(!h.querySelector('#feNext').disabled,label+'last choice still enables submit');
   eq(chosen().textContent,'2',label+'back and forward preserve answer');ok(h.querySelector('#feStar').getAttribute('aria-pressed')==='true',label+'back and forward preserve star');
  }else ok(h.querySelector('#fePrev').disabled,label+'one-item review has no previous');
  await click('#fePause');ok(h.querySelector('#feResume'),label+'saved pause still works');await mount(route);await click('#feResume');
  eq(chosen().textContent,'2',label+'checkpoint reload preserves last answer');ok(!h.querySelector('#feNext').disabled,label+'checkpoint reload enables submit');ok(h.querySelector('#feStar').getAttribute('aria-pressed')==='true',label+'checkpoint reload preserves star');
  await click('#feNext');ok(h.querySelector('[role=alertdialog]'),label+'submit opens existing confirmation');
  const notice=h.querySelector('#feConfirmTitle').textContent;
  if(count>1){ok(notice.includes('미응답 '+(count-1)+'문항'),label+'unanswered count retained');ok(notice.includes(kind==='review'?'누적 오답에서 제외':'오답으로 채점'),label+'unanswered policy retained');}
  else ok(!notice.includes('미응답'),label+'one-item answered review has no false unanswered notice');
  eq(attempts.length,0,label+'confirmation alone does not submit');await click('#feConfirmNo');eq(w.document.activeElement,h.querySelector('#feNext'),label+'cancel returns focus to final button');eq(chosen().textContent,'2',label+'cancel preserves answer');
  await click('#feNext');fail=true;const confirm=h.querySelector('#feConfirmYes');confirm.click();confirm.click();await settle();
  eq(attempts.length,1,label+'duplicate confirmation clicks submit once');ok(h.querySelector('#feRetry'),label+'save failure offers retry');eq(f.snapshot(id).run.status,'active',label+'failed submit does not finalize');
  const draft=JSON.parse(w.localStorage.getItem('hanq:cbt-draft:v1:qa-A:'+id));eq(draft.submission,attempts[0],label+'failed submission frozen on device');eq(draft.answers[count-1],f.snapshot(id).items[count-1].options[1].id,label+'failed submit preserves selected answer');
  hold=true;const retry=h.querySelector('#feRetry');retry.click();retry.click();await settle();eq(attempts.length,2,label+'duplicate retries start one request');eq(attempts[1],attempts[0],label+'retry reuses submission key and exact answers');ok(!h.querySelector('[data-option]'),label+'pending submit cannot edit answers');
  release();await settle();ok(h.querySelector('#feResult'),label+'retry recovers to final result');eq(attempts.length,2,label+'result causes no further submissions');
  const final=f.snapshot(id);eq(final.run.status,'final',label+'successful retry finalizes');eq(final.items[count-1].selectedOptionId,final.items[count-1].options[1].id,label+'final selected answer retained');eq(final.run.result.unanswered,count-1,label+'unanswered result retained');
  const stars=await f.api.cbt('GET','/api/v1/cbt/'+(kind==='review'?'reviews/':'runs/')+id+'/stars');ok(stars.flags[count-1],label+'final star retained');
  eq(errors,[],label+'no runtime errors');
 }finally{w.HanqFormalExams.stop();w.close();}
}
(async()=>{await scenario('full',50);await scenario('review',1);await scenario('review',3);console.log(JSON.stringify({checks,failures:0,cases:['full50','review1','review3'],transport:'synthetic API / actual DOM / localStorage'}));})().catch(e=>{console.error(e.stack);process.exitCode=1;});
