'use strict';
// Real reader/session/workspace/quiz lifecycle, with a small synthetic workspace binding only.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require(process.env.HANQ_PLAYWRIGHT_PATH||'playwright');
const {fixture:readerFixture,title}=require('./test-era-blank-test-removal.cjs');
const {fixture:quizFixture,initial}=require('./test-era-blank-manual-save.cjs');
(async()=>{
 let cases=0;
 for(const [name,engine] of Object.entries({chromium,webkit})){
  const browser=await engine.launch({headless:true});
  try{for(const era of ['joseon','goryeo','opening']){
   const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>r.request().url().startsWith('https://synthetic.invalid/')?r.fulfill({contentType:'text/html',body:'<!doctype html><main id="app"><section id="reader"></section></main>'}):r.abort());await page.goto('https://synthetic.invalid/#chapter/'+era+'/webtoon');
   for(const f of ['textbook-source-quiz','history81-workspace',era+'-script-reader',era+'-script-session'])await page.addScriptTag({content:fs.readFileSync('media/'+f+'.js','utf8')});
   for(const f of ['textbook-source-quiz',era+'-script-reader'])await page.addStyleTag({content:fs.readFileSync('media/'+f+'.css','utf8')});
   const q=quizFixture();q.id='opening';q.version='fixture';q.source.scriptSha256='b'.repeat(64);q.scriptResponseGroups=q.items.map(i=>({itemId:i.id,fieldId:i.id+'-field',slotIds:i.blanks.map(b=>b.id)}));const saved=initial();saved.workspace.status='completed';saved.workspace.responses['synthetic-0']={values:['이전 최종답'],submitted:true,checkedSlots:[true],correct:false};
   await page.evaluate(async({era,capital,data,q,saved})=>{
    window.syntheticSaved=structuredClone(saved);window.savedBefore=JSON.stringify(saved);window.reads=0;window.writes=0;window.account={signedIn:true,ownerId:'synthetic',epoch:1};window.accountListeners=[];
    const api={state:()=>account,onChange:fn=>{accountListeners.push(fn);return()=>{accountListeners=accountListeners.filter(x=>x!==fn);};},textbookSemanticQuiz:async()=>structuredClone(q),textbookSourceWorkspace:async()=>{reads++;return structuredClone(syntheticSaved);},saveTextbookSourceWorkspace:async()=>{writes++;return new Promise((resolve,reject)=>{window.rejectSave=reject;});}};
    if(era!=='joseon')window['Hanq'+capital+'Structure']={isPrepared:x=>x===data};
    const reader=window['Hanq'+capital+'ScriptReader'];window.session=window['Hanq'+capital+'ScriptSession'].create({document,api,renderer:{...reader,prepare:async()=>data},modeRouting:true,initialTopic:'first',initialMode:'study',workspaceFactory:opts=>HanqHistory81Workspace.create({...opts,era:'opening',contract:{revision:q.source.sha256,sourceSha256:q.source.scriptSha256,counts:{items:3,groups:3,slots:3}}})});
    await session.mount(document.querySelector('#reader'),{ready:true,sourceSha256:data.bundle.source.sha256,loadBundle:async()=>data.bundle,loadFigure:async()=>{},loadStructure:async()=>({})});window.addEventListener('popstate',()=>session.handlePopState());
   },{era,capital:title(era),data:readerFixture(era),q,saved});
   const mode=id=>page.locator('[data-mode="'+id+'"]'),fields=page.locator('.textbook-source-quiz-input');
   await mode('practice').click();await fields.first().waitFor();assert.deepEqual(await fields.evaluateAll(ns=>ns.map(n=>n.value)),['','','']);await fields.first().fill('현재 풀이');
   await page.evaluate(()=>history.pushState({...history.state,syntheticOverlay:true},''));await page.goBack();assert.equal(await fields.first().inputValue(),'현재 풀이','popup Back retains attempt');assert.equal(await page.evaluate(()=>reads),1);
   page.once('dialog',d=>d.dismiss());await page.goBack();await page.waitForFunction(()=>location.hash.endsWith('/source-quiz'));assert.equal(await fields.first().inputValue(),'현재 풀이','cancel Back retains attempt');assert.equal(await page.evaluate(()=>writes),0);
   await mode('practice').click();assert.equal(await fields.first().inputValue(),'현재 풀이','active tab does not reset');assert.equal(await page.evaluate(()=>reads),1);
   page.once('dialog',d=>d.dismiss());await mode('study').click();assert.equal(await fields.first().inputValue(),'현재 풀이','cancel tab retains attempt');
   page.once('dialog',d=>d.accept());await mode('study').click();await fields.first().waitFor({state:'detached'});await mode('practice').click();await fields.first().waitFor();assert.deepEqual(await fields.evaluateAll(ns=>ns.map(n=>n.value)),['','','']);assert.equal(await page.evaluate(()=>reads),2);assert.equal(await page.evaluate(()=>writes),0);
   await page.goBack();await fields.first().waitFor({state:'detached'});await page.goForward();await fields.first().waitFor();assert.deepEqual(await fields.evaluateAll(ns=>ns.map(n=>n.value)),['','','']);assert.equal(await page.evaluate(()=>reads),3,'Forward re-entry creates a new attempt');
   await fields.first().fill('실패 보존');await page.locator('.textbook-source-question-number').nth(2).click();page.once('dialog',d=>d.accept());await page.locator('.textbook-source-save-complete').click();await page.waitForFunction(()=>writes===1);await mode('study').click();await page.evaluate(()=>rejectSave(Error('synthetic save failure')));await page.waitForFunction(()=>document.querySelector('.textbook-source-save-retry')?.hidden===false);assert(page.url().endsWith('/source-quiz'));assert.equal(await fields.first().inputValue(),'실패 보존');assert(await page.evaluate(()=>JSON.stringify(syntheticSaved)===savedBefore),'previous final record unchanged');assert.equal(await page.evaluate(()=>writes),1,'only explicit submit wrote');
   await page.evaluate(()=>{window.detachedInput=document.querySelector('.textbook-source-quiz-input');account={signedIn:false,ownerId:null,epoch:2};accountListeners.slice().forEach(fn=>fn());});assert.equal(await fields.count(),0);assert.equal(await page.evaluate(()=>detachedInput.value),'','account change clears detached input');assert.deepEqual(errors,[]);await page.close();cases++;
  }}finally{await browser.close();}
 }
 console.log(JSON.stringify({passed:true,cases,cachedHeadlessEngines:['Chromium','WebKit'],nativeBackForward:true,cancelAndSaveFailurePreserved:true,entryWrites:0,accountTeardown:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
