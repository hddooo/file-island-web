'use strict';
// Synthetic reader + real workspace + real quiz renderer. Never calls a production API.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const {fixture:readerFixture,title}=require('./test-era-blank-test-removal.cjs');
const {fixture:quizFixture,initial}=require('./test-era-blank-manual-save.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
const settle=async()=>{for(let i=0;i<35;i++)await Promise.resolve();};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function model(){const q=quizFixture();q.id='opening';q.version='fixture';q.source.scriptSha256='b'.repeat(64);q.scriptResponseGroups=q.items.map(i=>({itemId:i.id,fieldId:i.id+'-field',slotIds:i.blanks.map(b=>b.id)}));return q;}
function binding(q){return {revision:q.source.sha256,sourceSha256:q.source.scriptSha256,counts:{items:3,groups:3,slots:3}};}
async function run(){
 for(const era of ['joseon','goryeo','opening']){
  const w=new JSDOM('<main></main>',{url:'https://synthetic.invalid/#chapter/'+era+'/webtoon',runScripts:'outside-only',pretendToBeVisual:true}).window;
  w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>false;
  for(const f of ['textbook-source-quiz','history81-workspace',era+'-script-reader'])w.eval(fs.readFileSync('media/'+f+'.js','utf8'));
  const data=readerFixture(era),q=model(),saved=initial();saved.workspace.status='completed';saved.workspace.responses['synthetic-0']={values:['이전 최종 답안'],submitted:true,correct:false,checkedSlots:[true]};const originalSaved=JSON.stringify(saved);let reads=0,writes=0,current=true,saveHold=null;
  const api={textbookSemanticQuiz:async()=>clone(q),textbookSourceWorkspace:async()=>{reads++;return clone(saved);},saveTextbookSourceWorkspace:async()=>{writes++;if(saveHold)return saveHold.promise;throw Error('synthetic offline');}};
  const workspace=w.HanqHistory81Workspace.create({document:w.document,api,era:'opening',contract:binding(q),ownerId:'synthetic',isCurrent:()=>current});
  if(era!=='joseon')w['Hanq'+title(era)+'Structure']={isPrepared:x=>x===data};
  const host=w.document.querySelector('main'),controller=w['Hanq'+title(era)+'ScriptReader'].mount(host,era==='joseon'?data.bundle:data,{workspace,initialTopic:'first',initialMode:'study',routeForMode:mode=>{const u=new w.URL(w.location.href);u.hash='#chapter/'+era+'/'+(mode==='practice'?'source-quiz':mode==='exam'?'exam-lines':'webtoon');return u.href;},modeFromLocation:()=>w.location.hash.endsWith('/source-quiz')?'practice':'study'});
  const click=mode=>host.querySelector('[data-mode="'+mode+'"]').click(),inputs=()=>[...host.querySelectorAll('.textbook-source-quiz-input')],fill=value=>{inputs()[0].value=value;inputs()[0].dispatchEvent(new w.Event('input',{bubbles:true}));};
  const historyMode=mode=>{w.history.replaceState({[era+'Script']:{source:data.bundle.source.sha256,topic:'first',mode}},'','#chapter/'+era+'/'+(mode==='practice'?'source-quiz':'webtoon'));controller.handlePopState();};
  assert.equal(reads,0);click('practice');await settle();assert.equal(inputs().length,3);assert(inputs().every(n=>n.value===''),'entry ignores final saved answers');assert.equal(writes,0);assert.equal(reads,1);
  fill('현재 초안');const first=inputs()[0];click('practice');await settle();assert.equal(inputs()[0],first,'same-tab redraw keeps controller');assert.equal(inputs()[0].value,'현재 초안');assert.equal(reads,1);
  w.history.replaceState({...w.history.state,[era+'Image']:true},'');controller.handlePopState();await settle();assert.equal(inputs()[0],first,'same-mode popup history does not reset');assert.equal(inputs()[0].value,'현재 초안');
  click('study');await settle();assert.equal(inputs()[0],first,'cancelled tab leave keeps current input');assert(w.location.hash.endsWith('/source-quiz'));assert.equal(writes,0);
  historyMode('study');await settle();assert(w.location.hash.endsWith('/source-quiz'),'cancelled Back restores quiz route');assert.equal(inputs()[0].value,'현재 초안');
  w.confirm=()=>true;click('study');await settle();assert.equal(inputs().length,0);assert.equal(workspace.hasUnsaved(),false,'accepted leave discards only local attempt');assert.equal(first.value,'','detached local input cleared');assert.equal(writes,0);
  historyMode('practice');await settle();assert.equal(reads,2);assert(inputs().every(n=>n.value===''),'Back re-entry creates an empty attempt');assert.equal(JSON.stringify(saved),originalSaved,'last submitted workspace untouched');
  fill('실패해도 남길 답안');host.querySelectorAll('.textbook-source-question-number')[2].click();saveHold=deferred();host.querySelector('.textbook-source-save-complete').click();await settle();assert.equal(writes,1);const failedInput=inputs()[0];click('study');await settle();assert.equal(inputs()[0],failedInput,'pending submission does not discard answer');saveHold.reject(Error('synthetic save failure'));await settle();assert.equal(inputs()[0],failedInput,'failed submission blocks pending tab leave');assert.equal(inputs()[0].value,'실패해도 남길 답안');assert(w.location.hash.endsWith('/source-quiz'));assert(workspace.hasUnsaved());assert.equal(JSON.stringify(saved),originalSaved);
  w.confirm=()=>false;click('study');await settle();assert.equal(inputs()[0].value,'실패해도 남길 답안','cancel after save failure preserves draft');assert.equal(writes,1,'navigation never retries writes');
  current=false;workspace.stop();controller.stop();assert.equal(failedInput.value,'','account teardown clears old local input');assert.equal(host.children.length,0);w.close();
 }
 // A slow obsolete load must not mount over a newer entry or revive a departed account.
 const w=new JSDOM('<main></main>',{url:'https://synthetic.invalid',runScripts:'outside-only'}).window;
 w.HTMLElement.prototype.scrollIntoView=function(){};for(const f of ['textbook-source-quiz','history81-workspace'])w.eval(fs.readFileSync('media/'+f+'.js','utf8'));
 const q=model(),old=deferred(),saved=initial();let requests=0,renders=0,active=true,writes=0;
 const renderer={render(...args){renders++;return w.HanqTextbookSourceQuiz.render(...args);}},api={textbookSemanticQuiz:()=>++requests===1?old.promise:Promise.resolve(clone(q)),textbookSourceWorkspace:async()=>clone(saved),saveTextbookSourceWorkspace:async()=>{writes++;throw Error('unexpected write');}};
 const workspace=w.HanqHistory81Workspace.create({document:w.document,api,era:'opening',contract:binding(q),ownerId:'synthetic',isCurrent:()=>active,renderer}),host=w.document.querySelector('main');
 const stale=workspace.show(host,{fresh:true});workspace.leave();await workspace.show(host,{fresh:true});assert.equal(renders,1);old.resolve(clone(q));await assert.rejects(stale,{message:'session_changed'});assert.equal(renders,1,'obsolete load cannot remount');assert.equal(host.querySelectorAll('.textbook-source-quiz-input').length,3);assert.equal(writes,0);
 const late=deferred();api.textbookSourceWorkspace=()=>late.promise;const pending=workspace.show(host,{fresh:true});await settle();active=false;workspace.stop();late.resolve(clone(saved));await assert.rejects(pending,{message:'session_changed'});assert.equal(host.children.length,0,'late account load does not revive private UI');assert.equal(writes,0);w.close();
 console.log(JSON.stringify({passed:true,readers:3,realWorkspaceAndRenderer:true,freshEntry:true,sameModePreserved:true,cancelAndSaveFailurePreserved:true,staleLoadsBlocked:true,navigationWrites:0}));
}
run().catch(e=>{console.error(e);process.exitCode=1;});
