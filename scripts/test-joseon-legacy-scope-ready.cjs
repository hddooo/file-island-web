'use strict';
// Generator-shaped named legacy models omit version; the server acknowledgement supplies it.
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const {namedModel}=require('./test-joseon-scope-metadata.cjs');
const clone=x=>JSON.parse(JSON.stringify(x)),tick=async()=>{for(let i=0;i<80;i++)await Promise.resolve();};
const cap={gradingVersion:2,supportedGradingVersions:[1,2],gradingStorageScope:'isolated-v2'};
function setup(){const w=new JSDOM('<main/>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://synthetic.invalid'}).window;w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>false;w.eval(fs.readFileSync('media/source-grading-v2-session.js','utf8'));w.HanqSourceGradingV2={prepare:async()=>({gradeSlot:()=> 'different'})};w.eval(fs.readFileSync('media/textbook-source-quiz.js','utf8'));return {w,host:w.document.querySelector('main'),q:w.HanqTextbookSourceQuiz};}
(async()=>{let cases=0;
 for(const old of [true,false]){
  const data=namedModel(old),version=data.version;delete data.version;const before=JSON.stringify(data),total=data.items.length,counts=old?[164,74,90]:[172,76,96];
  for(const gradingVersion of [1,2])for(const scope of ['all','politics','society-culture']){
   const {w,host,q}=setup();let resolveLoad,writes=0,submits=0,lists=0,recoveryCalls=0;
   const stored={version,...(gradingVersion===2?cap:{}),revision:1,workspace:{cursor:0,status:'completed',responses:{[data.items[0].id]:{values:['SAVED'],submitted:true,correct:false,checkedSlots:[true]}}}},original=JSON.stringify(stored);
   const c=q.render(host,data,{ownerId:'A',manualSave:true,sequential:true,gradingVersion,quizScope:scope,onScopeChange:()=>{},recovery:{register:()=>{recoveryCalls++;return ()=>{};},peekDraft:()=>{recoveryCalls++;return null;}},loadProgress:()=>new Promise(r=>{resolveLoad=r;}),saveProgress:async()=>{writes++;throw Error('unexpected save');},fullAttempts:{submit:async()=>{submits++;throw Error('unexpected XP');},list:async()=>{lists++;return {items:[]};}}});
   await tick();assert.equal(host.querySelectorAll('[data-quiz-scope]').length,0);assert(host.querySelector('.textbook-source-scope-controls').hidden);assert.equal(host.querySelectorAll('.textbook-source-quiz-input').length,0);
   resolveLoad(clone(stored));await c.ready;assert.equal(host.querySelector('.textbook-source-scope-controls').hidden,false);assert.deepEqual([...host.querySelectorAll('[data-quiz-scope]')].map(n=>Number(n.textContent.split(' · ')[1])),counts);
   const inputs=[...host.querySelectorAll('.textbook-source-quiz-input')];assert.equal(inputs.length,counts[['all','politics','society-culture'].indexOf(scope)]);assert.equal(inputs[0].value,'','sequential new run starts fresh');
   inputs[0].value='FRESH';inputs[0].dispatchEvent(new w.Event('input'));
   if(scope==='all'){
    host.querySelector('[data-record-scope=current]').click();assert(host.querySelector('.textbook-source-statistics-score'));host.querySelector('.textbook-source-return-to-quiz').click();assert.equal(host.querySelector('.textbook-source-quiz-input'),inputs[0]);assert.equal(inputs[0].value,'FRESH','viewing a saved run preserves the fresh draft');
   }else{
    [...host.querySelectorAll('.textbook-source-question-number')].at(-1).click();w.confirm=()=>true;host.querySelector('.textbook-source-save-complete').click();await tick();assert(host.querySelector('.textbook-source-statistics-score'));assert.equal(host.querySelector('.textbook-source-xp-result'),null);
   }
   assert.equal(writes,0);assert.equal(submits,0);if(scope!=='all')assert.equal(recoveryCalls,0,'practice never touches full-scope recovery');assert.equal(lists,gradingVersion===2&&scope==='all'?1:0);assert.equal(JSON.stringify(stored),original);assert.equal(JSON.stringify(data),before);c.cleanup();w.close();cases++;
  }
  // Ordinary continuous legacy entry restores server answers, then an owner/version-bound local draft.
  for(const recovered of [false,true]){
   const {w,host,q}=setup();let taken=0,writes=0;
   const draft={sourceRevision:data.source.sha256,quizId:'joseon',version,updates:[{itemId:data.items[0].id,values:['RECOVERED'],checkedSlots:[false],submitted:false}]};
   const c=q.render(host,data,{ownerId:'A',manualSave:true,loadProgress:async()=>({version,revision:1,workspace:{cursor:0,status:'active',responses:{[data.items[0].id]:{values:['SAVED'],submitted:true,correct:false,checkedSlots:[true]}}}}),saveProgress:async()=>{writes++;throw Error('unexpected save');},recovery:{peekDraft:()=>recovered?draft:null,takeDraft:()=>{taken++;}}});await c.ready;
   assert.equal(host.querySelector('.textbook-source-quiz-input').value,recovered?'RECOVERED':'SAVED');assert.equal(taken,recovered?1:0);assert.equal(writes,0);assert.equal(host.querySelectorAll('.textbook-source-quiz-input').length,total);
   assert.deepEqual([...host.querySelectorAll('.textbook-joseon-section')].map(n=>n.querySelectorAll('[data-source-item-id]').length),old?[59,14,91]:[64,14,94]);assert(host.querySelector('[data-source-item-id]').parentElement.classList.contains('textbook-joseon-section-early'),'early role uses acknowledged metadata');c.cleanup();w.close();cases++;
  }
  // No supplied model version never permits an unknown server version to select a presentation policy.
  for(const scope of ['all','politics']){
   const {w,host,q}=setup();const c=q.render(host,data,{manualSave:true,sequential:true,quizScope:scope,onScopeChange:()=>{},loadProgress:async()=>({version:'0'.repeat(64),workspace:{cursor:0,status:'active',responses:{}}}),saveProgress:async()=>{throw Error('unexpected save');}});
   if(scope==='all'){await c.ready;assert.equal(host.querySelectorAll('.textbook-source-quiz-input').length,total);assert.equal(host.querySelectorAll('[data-quiz-scope]').length,0);}else await assert.rejects(c.ready,/invalid_quiz_scope/);c.cleanup();w.close();cases++;
  }
  {
   const {w,host,q}=setup();const c=q.render(host,data,{manualSave:true,loadProgress:async()=>({version:'0'.repeat(64),workspace:{cursor:0,status:'active',responses:{}}}),saveProgress:async()=>{throw Error('unexpected save');}});await c.ready;assert.equal(host.querySelectorAll('.textbook-source-quiz-input').length,total);assert.equal(host.querySelectorAll('[data-joseon-group]').length,0,'unknown acknowledged version never groups a versionless model');c.cleanup();w.close();cases++;
  }
  const {w,host,q}=setup();let release;const c=q.render(host,data,{manualSave:true,sequential:true,onScopeChange:()=>{},loadProgress:()=>new Promise(r=>{release=r;}),saveProgress:async()=>{throw Error('unexpected save');}});await tick();c.cleanup();release({version,workspace:{responses:{}}});await c.ready;assert.equal(host.children.length,0);w.close();cases++;
 }
 console.log(JSON.stringify({cases,namedLegacyModelsWithoutVersion:true,acknowledgedMenuLifecycle:true,freshAndRestoredDrafts:true,exactGroupedPresentation:true,partialWritesAndXp:0,lateCleanup:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
