'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const tick=()=>new Promise(r=>setTimeout(r,20));let checks=0;const ok=(v,m)=>{assert(v,m);checks++;};
(async()=>{
 const d=new JSDOM('<main id="app"><section id="host"></section></main>',{url:'https://fixture.test',runScripts:'outside-only'}),w=d.window;
 let owner='A',listeners=[],extra=false,mode='normal',late;
 const rows=()=>[1,2,3,4].map(part=>({collectionId:'fixture',number:part,part,studyHistory:{practiceReviewed:part!==2,recentResults:[false]}})).concat(extra?[{collectionId:'fixture',number:9,part:1,studyHistory:{practiceReviewed:false}}]:[]);
 const api={state:()=>({signedIn:true,ownerId:owner}),onChange:f=>{listeners.push(f);return()=>listeners=listeners.filter(x=>x!==f);},ensureSession:async()=>{},toeicCbt:async(method,p)=>{assert.equal(method,'GET');assert.equal(p,'/practice');if(mode==='loading')return new Promise(r=>late=r);let data=rows();if(owner!=='A')data=data.map(q=>({...q,studyHistory:null}));if(mode==='duplicate')data.push({...data[0]});if(mode==='conflict')data.push({...data[0],studyHistory:{practiceReviewed:false}});if(mode==='attempts')data[0].studyHistory={practiceReviewed:false,practiceCount:999,wrongCount:999};if(mode==='null')data[0].studyHistory=null;return{items:data};}};
 try{
  for(const f of ['completion-checks.js','toeic-cbt.js'])w.eval(fs.readFileSync(__dirname+'/../media/'+f,'utf8'));
  const host=w.document.querySelector('#host'),mount=async()=>{w.HanqToeicCbt.mount(host,{api});await tick();return [...host.querySelectorAll('.tc-group')];};
  let cards=await mount();ok(cards[0].querySelector('.hanq-completion-check'),'all reviewed even wrong');ok(!cards[1].querySelector('.hanq-completion-check'),'unreviewed no check');ok(cards[2].querySelector('.hanq-completion-check'),'combined parts3/4 both reviewed');ok(!cards[4].querySelector('.hanq-completion-check')&&cards[4].disabled,'zero/zero not complete');ok(cards[0].getAttribute('aria-label').includes('파트 전체 리뷰 완료'),'accessible completion');
  mode='duplicate';cards=await mount();ok(cards[0].querySelector('.tc-group-count').textContent==='리뷰 1 / 전체 1문제','same problem counted once');ok(cards[0].querySelector('.hanq-completion-check'),'unique completed problem');
  for(mode of ['conflict','attempts','null']){cards=await mount();ok(!cards[0].querySelector('.hanq-completion-check'),mode+' does not invent completion');}
  mode='normal';extra=true;cards=await mount();ok(!cards[0].querySelector('.hanq-completion-check'),'new problem returns to in progress');owner='B';listeners.slice().forEach(f=>f());await tick();ok(!host.querySelector('.hanq-completion-check'),'other owner never inherits completion');owner='A';listeners.slice().forEach(f=>f());await tick();ok(host.querySelectorAll('.hanq-completion-check').length===1,'reentry uses current owner counts');
  mode='loading';await mount();ok(!host.querySelector('.hanq-completion-check'),'loading has no completion');const stale=late;owner='B';mode='normal';listeners.slice().forEach(f=>f());await tick();stale({items:rows()});await tick();ok(!host.querySelector('.hanq-completion-check'),'late previous-owner completion ignored');
  console.log('PASS '+checks+' assertions: unique reviews, wrong answers, grouped parts, zero/null/loading/repeated attempts/conflicts, new questions, owner separation and stale replies');
 }finally{w.HanqToeicCbt&&w.HanqToeicCbt.stop();w.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
