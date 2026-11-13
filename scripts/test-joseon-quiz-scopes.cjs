'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom'),{fixture,initial}=require('./test-era-blank-manual-save.cjs');
const tick=async()=>{for(let i=0;i<70;i++)await Promise.resolve();};
(async()=>{let checks=0;
for(const version of [1,2])for(const scope of ['all','politics','society-culture']){
 const w=new JSDOM('<main/>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://synthetic.invalid'}).window;w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>true;
 const model=fixture();model.id='joseon';model.subtopics=['early-joseon','late-joseon','culture'].map(id=>({id,title:id}));model.items.forEach((i,n)=>i.subtopicId=model.subtopics[n].id);
 const stored={...initial(),gradingVersion:2,supportedGradingVersions:[1,2],gradingStorageScope:'isolated-v2'};stored.workspace.status='completed';stored.workspace.responses={'synthetic-0':{values:['original'],submitted:true,correct:false,checkedSlots:[true]}};const before=JSON.stringify(stored);let writes=0,canonicalCount=0;
 w.eval(fs.readFileSync('media/source-grading-v2-session.js','utf8'));w.HanqSourceGradingV2={prepare:async data=>{canonicalCount=data.items.length;return {gradeSlot:(item,slot,value,base)=>base(value,slot.answerIds.map(id=>item.answers.find(a=>a.id===id).text),slot.orderMatters,item.kind,item.answer.sequenceSeparator)};}};
 w.eval(fs.readFileSync('media/textbook-source-quiz.js','utf8'));const host=w.document.querySelector('main');
 const c=w.HanqTextbookSourceQuiz.render(host,model,{manualSave:true,sequential:true,gradingVersion:version,quizScope:scope,onScopeChange:()=>{},loadProgress:async()=>structuredClone(stored),saveProgress:async body=>{writes++;return {...stored,revision:stored.revision+1,workspace:{status:'completed',responses:Object.fromEntries(body.updates.map(u=>[u.itemId,{...u,correct:u.submitted}]))}};}});await c.ready;
 const inputs=[...host.querySelectorAll('input.textbook-source-quiz-input')];assert.equal(inputs.length,scope==='all'?3:scope==='politics'?2:1);checks++;assert.equal(host.querySelectorAll('[data-quiz-scope]').length,3);checks++;if(version===2){assert.equal(canonicalCount,3);checks++;}
 inputs.forEach((n,i)=>{n.value=scope==='society-culture'?'wrong':i===0?'アルファ':'ベータ';n.dispatchEvent(new w.Event('input',{bubbles:true}));});
 host.querySelectorAll('.textbook-source-question-number')[inputs.length-1].click();host.querySelector('.textbook-source-save-complete').click();await tick();
 assert.equal(writes,scope==='all'?1:0);checks++;assert.equal(JSON.stringify(stored),before);checks++;assert.ok(host.querySelector('.textbook-source-statistics-score'));checks++;
 if(scope!=='all'){assert.equal(host.querySelector('.textbook-source-next-era'),null);checks++;assert.ok(host.querySelector('.textbook-source-practice-notice'));checks++;assert.equal(host.querySelectorAll('[data-record-scope=legacy]').length,0);checks++;assert.equal(c.hasUnsaved(),false);checks++;assert.equal(host.querySelectorAll('.textbook-source-history-entry').length,0);checks++;assert.ok(host.querySelector('[data-source-review-item-id]'));checks++;await c.prepareLeave();assert.equal(writes,0);checks++;}
 c.cleanup();w.close();
}
console.log(JSON.stringify({checks,partialServerWrites:0,canonicalGradingBinding:true,fullResultPreserved:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
