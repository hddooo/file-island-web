'use strict';
// Combo badge in the sequential blank quiz: shows from 2 consecutive correct answers, resets on a wrong answer.
// Display only; synthetic data and a fake API, no network.
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),{fixture,initial}=require('./test-era-blank-manual-save.cjs');
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;},tick=async()=>{for(let i=0;i<80;i++)await Promise.resolve();},wait=ms=>new Promise(r=>setTimeout(r,ms));
async function setup(){
 const w=new JSDOM('<meta name="hanq-source-grading" content="2"><main/>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://synthetic.invalid'}).window;w.HTMLElement.prototype.scrollIntoView=function(){};
 const data=fixture();const state={...initial(),gradingVersion:2,supportedGradingVersions:[1,2],gradingStorageScope:'isolated-v2',version:'b'.repeat(64)};
 w.eval(fs.readFileSync('media/source-grading-v2-session.js','utf8'));
 w.HanqSourceGradingV2={prepare:async()=>({gradeSlot:(item,slot,value,base)=>base(value,slot.answerIds.map(id=>item.answers.find(a=>a.id===id).text),slot.orderMatters,item.kind,item.answer.sequenceSeparator)})};
 w.eval(fs.readFileSync('media/textbook-source-quiz.js','utf8'));
 const api={textbookSourceWorkspaceV2:async()=>structuredClone(state),textbookSourceWorkspace:async()=>structuredClone(initial()),saveTextbookSourceWorkspaceV2:async()=>structuredClone(state)};
 const session=w.HanqSourceGradingV2Session.create({api,era:'synthetic',sourceRevision:data.source.sha256,isCurrent:()=>true});
 const host=w.document.querySelector('main');
 const c=w.HanqTextbookSourceQuiz.render(host,data,{manualSave:true,sequential:true,gradingVersion:2,ownerId:'A',loadProgress:()=>session.load(),loadLegacyProgress:()=>session.loadLegacy(),saveProgress:b=>session.save(b)});
 await c.ready;await tick();
 const input=()=>[...host.querySelectorAll('.textbook-source-quiz-input')].find(n=>!n.readOnly&&n.offsetParent!==undefined&&!n.closest('[hidden]'));
 return {w,c,host,data,
  async answer(value){const n=input();n.value=value;n.dispatchEvent(new w.Event('input',{bubbles:true}));n.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await tick();},
  combo:()=>host.querySelector('.textbook-source-combo')};
}
(async()=>{
 const t=await setup(),a=t.data.items.map(i=>i.answers[0].text);
 await t.answer(a[0]);ok(!t.combo()||t.combo().hidden,'one correct answer is not a combo yet');
 await wait(1100);await tick();
 await t.answer(a[1]);const c=t.combo();ok(c&&!c.hidden&&c.textContent.includes('2연속 정답'),'second correct in a row shows the combo');
 ok(c.getAttribute('aria-hidden')==='true','combo is decorative; the accuracy status stays the spoken summary');
 await wait(1100);await tick();
 await t.answer('오답');ok(t.combo().hidden,'a wrong answer breaks the combo');
 t.c.cleanup();t.w.close();
 console.log('quiz combo: '+checks+' checks passed (synthetic data only)');
})().catch(e=>{console.error(e);process.exitCode=1;});
