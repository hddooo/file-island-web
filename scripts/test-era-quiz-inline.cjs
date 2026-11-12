'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const {fixture,initial}=require('./test-era-blank-manual-save.cjs');
(async()=>{
 const w=new JSDOM('<main></main>',{url:'https://synthetic.invalid',runScripts:'outside-only',pretendToBeVisual:true}).window;w.HTMLElement.prototype.scrollIntoView=function(){};w.eval(fs.readFileSync('media/textbook-source-quiz.js','utf8'));const host=w.document.querySelector('main');let checks=0;const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++;};
 const expected='사회 비교 · 고려 / 조선 후기 중 맞는 것을 쓰세요';
 for(const variation of ['current','legacy-mode','legacy-source','other-era','other-topic','full-source-title']){
  const data=fixture();data.id='joseon';data.subtopics[0]={id:'society-comparison',title:'사회 비교'};data.items.forEach((i,n)=>{i.subtopicId='society-comparison';i.originalNumber=n+36;i.originalNumberLabel='('+(n+36)+')';});
  if(variation==='legacy-source')data.source.sha256='35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442';
  if(variation==='other-era')data.id='goryeo';
  if(variation==='other-topic'){data.subtopics[0].id='economy-comparison';data.items.forEach(i=>i.subtopicId='economy-comparison');}
  if(variation==='full-source-title')data.subtopics[0].title='사회: 고려/조선후기 중 해당하는 국가를 쓰세요';
  const before=JSON.stringify(data),options={manualSave:variation!=='legacy-mode',checkedReview:true,loadProgress:async()=>initial(),saveProgress:async()=>{throw Error('Unexpected write');}},c=w.HanqTextbookSourceQuiz.render(host,data,options);await c.ready;
  eq(host.querySelector('.textbook-source-quiz-instruction').textContent,['current','legacy-source','full-source-title'].includes(variation)?expected:data.subtopics[0].title,'scope '+variation);
  eq(host.querySelectorAll('.textbook-source-quiz-instruction').length,1,'no duplicate heading');
  eq(host.querySelector('.textbook-source-quiz-item-source').textContent,variation==='legacy-mode'?'문제 (36)':'36.');
  const input=host.querySelector('.textbook-source-quiz-input'),heading=host.querySelector('.textbook-source-quiz-instruction');eq(input.getAttribute('aria-describedby').split(' ').includes(heading.id),true,'instruction accessible from input');
  eq(JSON.stringify(data),before,'source not modified');
  c.cleanup();eq(host.childElementCount,0,'teardown');
 }
 w.close();console.log(JSON.stringify({checks,failures:0,scope:'number labels; exact Joseon society instruction boundary; immutable source; accessible instructions; legacy preservation'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
