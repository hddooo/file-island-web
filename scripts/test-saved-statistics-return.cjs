'use strict';
// Isolated synthetic owner; checks draft state and eventual payload across saved-history navigation.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const {fixture,initial}=require('./test-era-blank-manual-save.cjs');
const settle=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
(async()=>{let checks=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
for(const legacy of [false,true]){
 const w=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://synthetic.invalid',pretendToBeVisual:true}).window;
 w.confirm=()=>true;w.HTMLElement.prototype.scrollIntoView=function(){};w.eval(fs.readFileSync('media/textbook-source-quiz.js','utf8'));
 const data=fixture(),host=w.document.querySelector('main'),stored=initial();stored.workspace.status='completed';stored.revision=3;
 data.items.forEach((item,i)=>stored.workspace.responses[item.id]={values:[i===1?'저장오답':item.answer.text],submitted:true,correct:i!==1,checkedSlots:[true]});
 if(legacy){Object.assign(stored,{gradingVersion:2,supportedGradingVersions:[1,2],gradingStorageScope:'isolated-v2'});w.eval(fs.readFileSync('media/source-grading-v2-session.js','utf8'));w.HanqSourceGradingV2={prepare:async()=>({gradeSlot:(item,slot,value,base)=>base(value,slot.answerIds.map(id=>item.answers.find(a=>a.id===id).text),slot.orderMatters,item.kind)})};}
 const original=JSON.stringify(stored),writes=[];
 const controller=w.HanqTextbookSourceQuiz.render(host,data,{manualSave:true,sequential:true,ownerId:'synthetic',loadProgress:async()=>structuredClone(stored),...(legacy?{gradingVersion:2,loadLegacyProgress:async()=>structuredClone(stored)}:{}),saveProgress:async body=>{writes.push(structuredClone(body));for(const u of body.updates)stored.workspace.responses[u.itemId]={...structuredClone(u),correct:data.items.find(i=>i.id===u.itemId).answer.text===u.values[0]};stored.workspace.status=body.status;stored.revision++;return structuredClone(stored);}});
 await controller.ready;const q=s=>host.querySelector(s),inputs=[...host.querySelectorAll('.textbook-source-quiz-input')],map=host.querySelectorAll('.textbook-source-question-number');
 eq(inputs.map(n=>n.value),['','',''],'completed history opens a separate blank draft');
 map[1].click();inputs[1].value='미제출 초안';inputs[1].dispatchEvent(new w.Event('input',{bubbles:true}));const dirty=controller.hasUnsaved();
 const history=q(legacy?'.textbook-source-history-entry[data-record-scope="legacy"]':'.textbook-source-history-entry');assert(history,'history available');checks++;history.click();
 eq(q('.textbook-source-statistics-score').textContent,'정답률 66.67%','two decimal statistics retained');
 eq(q('.textbook-source-goal-celebration'),null,'opening saved statistics never celebrates');eq(q('.textbook-source-goal-patamon').getAttribute('src'),'/media/characters/patamon-crying-v1.webp','below target uses supplied static asset');eq(q('.textbook-source-goal-patamon').width,80,'image reserves width');eq(q('.textbook-source-goal-patamon').height,80,'image reserves height');
 eq(q('.textbook-source-review-user-answer').textContent,'내 답: 저장오답','history shows saved response, not draft');
 q('.textbook-source-return-to-quiz').click();
 eq(inputs[1].value,'미제출 초안','return preserves unsubmitted text');eq(w.document.activeElement,inputs[1],'return restores question and focus');
 eq(q('.textbook-source-review').hidden,true,'return hides statistics');eq(controller.hasUnsaved(),dirty,'dirty state preserved');
 eq(writes.length,0,'history and return never write');eq(JSON.stringify(stored),original,'saved record untouched');
 history.click();q('.textbook-source-restart').click();eq(inputs.map(n=>n.value),['','',''],'explicit restart clears only own draft');eq(writes.length,0,'restart never writes');eq(JSON.stringify(stored),original,'restart retains stored responses');
 map[1].click();inputs[1].value='재작성';inputs[1].dispatchEvent(new w.Event('input',{bubbles:true}));history.click();q('.textbook-source-return-to-quiz').click();map[2].click();q('.textbook-source-save-complete').click();await settle();
 eq(writes.length,1,'only explicit submit writes');eq(data.items.map(item=>writes[0].updates.find(u=>u.itemId===item.id).values),[[''],['재작성'],['']],'return preserves draft in explicit submission, no stale answers revived');
 eq(q('.textbook-source-return-to-quiz'),null,'fresh submission retains explicit restart action');controller.cleanup();w.close();
}
for(const count of [3,4,5]){const w=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://synthetic.invalid',pretendToBeVisual:true}).window;w.confirm=()=>true;w.HTMLElement.prototype.scrollIntoView=function(){};w.eval(fs.readFileSync('media/textbook-source-quiz.js','utf8'));const data=fixture();while(data.items.length<5){const item=structuredClone(data.items[0]),n=data.items.length;item.id='extra-'+n;item.order=n+1;item.originalNumber=n+1;data.items.push(item);}const stored=initial(),host=w.document.querySelector('main');const c=w.HanqTextbookSourceQuiz.render(host,data,{manualSave:true,sequential:true,ownerId:'synthetic',loadProgress:async()=>structuredClone(stored),saveProgress:async b=>{for(const u of b.updates)stored.workspace.responses[u.itemId]={...structuredClone(u),correct:data.items.find(i=>i.id===u.itemId).answer.text===u.values[0]};stored.workspace.status=b.status;stored.revision++;return structuredClone(stored);}});await c.ready;[...host.querySelectorAll('.textbook-source-quiz-input')].forEach((n,i)=>{n.value=i<count?data.items[i].answer.text:'틀림';n.dispatchEvent(new w.Event('input',{bubbles:true}));});host.querySelectorAll('.textbook-source-question-number')[4].click();host.querySelector('.textbook-source-save-complete').click();await settle();eq(!!host.querySelector('.textbook-source-goal-patamon'),count<4,'crying asset only below 80 percent');eq(!!host.querySelector('.textbook-source-goal-celebration'),count>=4,'celebration at and above 80 percent');c.cleanup();w.close();}
console.log(JSON.stringify({checks,failures:0,scope:'current and legacy saved statistics; draft values, dirty state, focus, stored record preservation, explicit submission'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
