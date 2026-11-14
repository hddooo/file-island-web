'use strict';
// Synthetic data only. Exercise the installed app -> session -> reader -> workspace -> renderer path.
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const {initial}=require('./test-era-blank-manual-save.cjs');
const revision='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
const source='8d0944e32d86985a4af3dbf28085dba4bb3f65cc0d8379907e2e4693299003a1';
const clone=x=>JSON.parse(JSON.stringify(x));
const tick=async()=>{for(let i=0;i<100;i++)await Promise.resolve();};
const {effectiveModel:model}=require('./joseon-scope-fixture.cjs');
async function run(modelFactory=model){
 for(const version of [1,2]){
  const w=new JSDOM('<meta name="hanq-history81-workspace-api" content="2062b84b2c7f86de701cc757a23c113fa11e4c09">'+(version===2?'<meta name="hanq-source-grading" content="2">':'')+'<div id="app"><div id="host"></div></div>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://synthetic.invalid/#chapter/joseon/source-quiz'}).window;
  w.HTMLElement.prototype.scrollIntoView=function(){};let allowLeave=false;w.confirm=()=>allowLeave;
  const data=modelFactory(),cap={gradingVersion:2,supportedGradingVersions:[1,2],gradingStorageScope:'isolated-v2'};
  let stored={...initial(),...(version===2?cap:{}),version:data.version,workspace:{cursor:0,status:'completed',responses:{'synthetic-0':{values:['stored'],submitted:true,correct:false,checkedSlots:[true]}}}};
  const original=JSON.stringify(stored),writes=[],reads=[],attempts=[],events=[];let historyReads=0;const history=[{id:'previous',correct:100,total:172,xpAward:0,completedAt:'2026-11-14T03:00:00Z'}];let state={signedIn:true,ownerId:'synthetic-a',epoch:1},listener;
  const api={state:()=>state,onChange:cb=>{listener=cb;return()=>{listener=null;};},textbookSemanticQuiz:async(era,rev)=>{assert.equal(era,'joseon');assert.equal(rev,revision);return clone(data);},
   textbookSourceWorkspace:async()=>{reads.push('legacy');return {...clone(stored),gradingVersion:1,gradingStorageScope:'legacy-v1'};},
   textbookSourceWorkspaceV2:async()=>{reads.push('v2');return clone(stored);}};
  const save=async(era,body,rev)=>{assert.equal(era,'joseon');assert.equal(rev,revision);writes.push(clone(body));events.push('save');stored={...stored,revision:stored.revision+1,workspace:{cursor:0,status:'completed',responses:Object.fromEntries(body.updates.map(u=>[u.itemId,{...u,correct:u.submitted?false:null}]))}};return clone(stored);};
  api.saveTextbookSourceWorkspace=save;api.saveTextbookSourceWorkspaceV2=save;
  api.submitTextbookFullAttempt=async(era,body,rev)=>{assert.equal(era,'joseon');assert.equal(rev,revision);assert.equal(writes.length,1,'attempt follows acknowledged workspace save');events.push('attempt');attempts.push(clone(body));const attempt={id:body.attemptId,correct:155,total:172,scoreXp:10,xpAward:10,completedAt:'2026-11-15T03:00:00Z'};history.unshift(attempt);return {attempt,replayed:false};};
  api.textbookFullAttempts=async(era,rev)=>{assert.equal(era,'joseon');assert.equal(rev,revision);historyReads++;return {items:clone(history),latest:clone(history[0])};};
  let draftReads=0,draftTakes=0;const draft={quizId:'joseon',version:'other-version',updates:[]};
  w.HanqAuthSession={register:()=>()=>{},peekDraft:()=>{draftReads++;return draft;},takeDraft:()=>{draftTakes++;}};
  for(const file of ['source-grading-v2-session','textbook-source-quiz','history81-workspace','joseon-script-reader','joseon-script-session','joseon-script-app'])w.eval(fs.readFileSync('media/'+file+'.js','utf8'));
  const bindings=[];let failPractice=false,releasePractice=null;
  w.HanqSourceGradingV2={prepare:async d=>{bindings.push(d.items.length);if(failPractice)throw Error('synthetic grading failure');if(releasePractice)await releasePractice;return {gradeSlot:(item,slot,value,base)=>base(value,slot.answerIds.map(id=>item.answers.find(a=>a.id===id).text),false,item.kind)};}};
  const bundle={schema:'hanq-joseon-script/1',source:{sha256:source},topics:[{id:'early',title:'합성 전기',from:59,to:64},{id:'late',title:'합성 후기',from:65,to:72}],figures:[],segments:[{id:'s',kind:'study',page:60,markdown:'합성 학습'}]};
  const transport={ready:true,sourceSha256:source,loadBundle:async()=>bundle,loadFigure:async()=>{throw Error('no figures');}};
  const app=w.HanqJoseonScriptApp.create({document:w.document,api,adapter:{fromDocument:()=>transport},sourceCatalog:{revisionRoutesReady:()=>false}}),host=w.document.querySelector('#host');
  assert.equal(app.available('joseon',8),true);assert.equal(await app.mount(host,w.document.querySelector('#app'),'joseon',8),true);await tick();
  const query=s=>host.querySelector(s),inputs=()=>[...host.querySelectorAll('.textbook-source-quiz-input')];
  const change=async scope=>{query('[data-quiz-scope="'+scope+'"]').click();await tick();};
  const fill=(node,value)=>{node.value=value;node.dispatchEvent(new w.Event('input',{bubbles:true}));};
  assert.equal(inputs().length,172);assert.equal(w.document.activeElement,inputs()[0]);
  assert.deepEqual([...host.querySelectorAll('[data-quiz-scope]')].map(n=>n.textContent),['전체 문제 · 172','전기/후기 연습 · 76','사회/문화 연습 · 96']);
  if(version===2){assert.equal(host.querySelectorAll('.textbook-source-full-history-entry').length,1);assert(query('.textbook-source-full-history').textContent.includes('최근 점수'));}else assert.equal(historyReads,0);
  const full=inputs()[0];fill(full,'full draft');const recoveryReads=draftReads;
  if(version===2){failPractice=true;await change('politics');assert.equal(inputs().length,172);assert.equal(inputs()[0],full);assert.equal(full.value,'full draft');assert(host.textContent.includes('연습 범위를 불러오지 못했습니다'));failPractice=false;}
  await change('politics');assert.equal(inputs().length,76);assert.equal(inputs()[0].value,'');const politics=inputs()[0];fill(politics,'politics draft');
  await change('society-culture');assert.equal(inputs().length,96);const culture=inputs()[0];fill(culture,'culture draft');
  await change('all');assert.equal(inputs()[0],full);assert.equal(full.value,'full draft');
  await change('politics');assert.equal(inputs()[0],politics);assert.equal(politics.value,'politics draft');
  await change('society-culture');assert.equal(inputs()[0],culture);assert.equal(culture.value,'culture draft');
  assert.equal(draftReads,recoveryReads);assert.equal(draftTakes,0);assert.equal(JSON.stringify(stored),original);assert.equal(writes.length,0);
  // Both practice scopes complete locally: neither workspace writes nor XP/history APIs are called.
  await change('politics');allowLeave=true;[...host.querySelectorAll('.textbook-source-question-number')].at(-1).click();query('.textbook-source-save-complete').click();await tick();
  assert(query('.textbook-source-statistics-score'));assert.equal(query('.textbook-source-xp-result'),null);assert.equal(query('.textbook-source-full-history'),null);assert.equal(writes.length,0);assert.equal(attempts.length,0);assert.equal(historyReads,version===2?1:0);
  await change('society-culture');
  [...host.querySelectorAll('.textbook-source-question-number')].at(-1).click();allowLeave=true;query('.textbook-source-save-complete').click();await tick();
  assert(query('.textbook-source-statistics-score'));assert.equal(query('.textbook-source-history-entry'),null);assert.equal(writes.length,0);assert.equal(JSON.stringify(stored),original);assert.equal(attempts.length,0);assert.equal(historyReads,version===2?1:0);assert.equal(query('.textbook-source-xp-result'),null);assert.equal(query('.textbook-source-full-history'),null);
  // Navigation still protects the full draft while a clean practice result is visible.
  allowLeave=false;query('[data-mode="study"]').click();await tick();assert(w.location.hash.endsWith('/source-quiz'));assert(query('[data-quiz-scope]'));assert(app.hasUnsaved());
  await assert.rejects(app.prepareLeave(),{code:'leave_cancelled'});
  await change('all');assert.equal(inputs()[0],full);assert.equal(full.value,'full draft');
  // Full submission retains the existing explicit-save transport and full canonical question set.
  [...host.querySelectorAll('.textbook-source-question-number')].at(-1).click();allowLeave=true;query('.textbook-source-save-complete').click();await tick();
  assert.equal(writes.length,1);assert.equal(writes[0].updates.length,172);assert.equal(writes[0].updates[0].values[0],'full draft');if(version===2){assert.equal(writes[0].gradingVersion,2);assert(bindings.every(n=>n===172));
   assert.equal(attempts.length,1);assert.deepEqual(events,['save','attempt']);assert.equal(attempts[0].mode,'full');assert.equal(attempts[0].gradingVersion,2);assert.equal(attempts[0].version,data.version);assert.deepEqual(attempts[0].responses.map(r=>r.itemId),data.items.map(i=>i.id));assert.equal(attempts[0].responses[0].values[0],'full draft');
   assert.equal(query('.textbook-source-xp-result').textContent,'XP +10 획득 · 전체 풀이 기록 저장됨');assert.equal(historyReads,2);assert.equal(host.querySelectorAll('.textbook-source-full-history-entry').length,2);assert(query('.textbook-source-full-history-entry[data-latest=true]').textContent.includes('XP +10'));
  }else{assert.equal(attempts.length,0);assert.equal(historyReads,0);}
  const detached=politics;state={signedIn:false,ownerId:null,epoch:2};listener();assert.equal(host.children.length,0);assert.equal(detached.value,'');assert.equal(full.value,'');assert.equal(writes.length,1);
  if(version===2){
   state={signedIn:true,ownerId:'synthetic-b',epoch:3};assert.equal(await app.mount(host,w.document.querySelector('#app'),'joseon',8),true);await tick();
   let release;releasePractice=new Promise(resolve=>{release=resolve;});await change('politics');
   state={signedIn:false,ownerId:null,epoch:4};listener();release();await tick();assert.equal(host.children.length,0);assert.equal(writes.length,1);
  }
  app.stop();w.close();
 }
 console.log('PASS actual Joseon app/session/reader/workspace/renderer entry: v1 + v2, 172/76/96 scopes, draft identity, both practice scopes zero writes/XP/history, canonical full submit + XP receipt/history, navigation cancellation, scope failure/retry, logout cleanup + late-response guard');
}
module.exports={run};if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
