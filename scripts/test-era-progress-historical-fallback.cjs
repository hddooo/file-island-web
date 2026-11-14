'use strict';
// Synthetic fixtures only: no network, real user records, storage or writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const source='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
const cap={gradingVersion:2,supportedGradingVersions:[1,2],gradingStorageScope:'isolated-v2'};
const version='a'.repeat(64),tick=()=>new Promise(r=>setTimeout(r,20));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const item={id:'synthetic-q',kind:'fill-in',originalNumber:1,verification:{status:'source-verified',textVerified:true,answerPairVerified:true},segments:[{type:'text',text:'Synthetic question '},{type:'blank',id:'b'}],blanks:[{id:'b',answerIds:['a']}],answers:[{id:'a',text:'synthetic answer'}],answer:{text:'synthetic answer'}};
const empty=()=>({version,revision:0,workspace:{status:'active',responses:{}}});
const completed=()=>({version,revision:0,workspace:{status:'completed',responses:{'synthetic-q':{submitted:true,correct:false,values:['synthetic old answer'],checkedSlots:[true]}}}});
async function fixture(){
 const w=new JSDOM('<meta name="hanq-source-grading" content="2"><div id="app"><main></main></div>',{url:'https://synthetic.invalid',runScripts:'outside-only',pretendToBeVisual:true}).window,d=w.document;
 for(const name of ['ui-locks','textbook-source-quiz','source-grading-v2-session','era-study-progress','hongmungwan'])w.eval(fs.readFileSync(name==='era-study-progress'?(process.env.ERA_PROGRESS_CODE||'media/'+name+'.js'):'media/'+name+'.js','utf8'));
 let state={signedIn:true,ownerId:'synthetic-A',epoch:1},v2=empty(),legacy=completed(),modelId=null,modelSource=source,legacyError=null,v2Error=null,writes=0,prepare=0,modelHold=null,v2Hold=null,legacyHold=null;
 const callbacks=[],calls=[],host=d.querySelector('main');
 w.HanqSourceGradingV2={prepare:async()=>{prepare++;throw Error('synthetic matcher unavailable');}};
 const api={state:()=>state,onChange:fn=>{callbacks.push(fn);return()=>{};},hongmungwan:async()=>({items:[]}),textbookSemanticQuiz:async(id,rev)=>{calls.push(['model',id,rev]);if(modelHold)await modelHold;return{id:modelId||id,version,source:{sha256:modelSource},items:[item]};},textbookSourceWorkspaceV2:async(id,rev)=>{calls.push(['v2',id,rev]);if(v2Error)throw v2Error;const result={...v2,...cap};return v2Hold?await v2Hold:result;},textbookSourceWorkspace:async(id,rev)=>{calls.push(['legacy',id,rev]);if(legacyError)throw legacyError;return legacyHold?await legacyHold:legacy;},saveTextbookSourceWorkspaceV2:()=>{writes++;throw Error('write forbidden');},saveTextbookSourceWorkspace:()=>{writes++;throw Error('write forbidden');}};
 return {w,d,host,api,calls,callbacks,get writes(){return writes;},get prepare(){return prepare;},set state(s){state=s;},set v2(r){v2=r;},set legacy(r){legacy=r;},set legacyError(e){legacyError=e;},set v2Error(e){v2Error=e;},set modelId(s){modelId=s;},set modelSource(s){modelSource=s;},set modelHold(p){modelHold=p;},set v2Hold(p){v2Hold=p;},set legacyHold(p){legacyHold=p;},menu(){host.innerHTML='<button class="period ready" data-id="samguk"><strong>Synthetic era</strong></button>';return w.HanqEraProgress.mount(host,{api});},aggregate(){host.replaceChildren();return w.HanqEraProgress.mount(host,{api,aggregate:true});},async open(){d.querySelector('[data-era="samguk"]').click();await tick();},close(){w.HanqEraProgress.stop();assert.equal(writes,0);w.close();}};
}
(async()=>{
 let cases=0;
 if(!process.env.STALE_MOUNT_ONLY){
 // Both real callers share the reader: era catalogue and Hongmungwan aggregate.
 for(const view of ['menu','hongmungwan']){
  const f=await fixture(),draft=empty(),history=completed();draft.workspace.responses={'synthetic-q':{values:['synthetic draft'],submitted:false,correct:null,checkedSlots:[false]}};f.v2=draft;f.legacy=history;const before=JSON.stringify([draft,history]);
  if(view==='menu')await f.menu().ready;else{await f.w.HanqHongmungwan.mount(f.host,{api:f.api}).ready;await tick();}
  assert.match(f.host.textContent,/정답률.*0%/);assert.equal(f.d.querySelector('time'),null);assert.equal(f.prepare,0);
  assert(f.calls.every(c=>c[2]===source));assert(!f.calls.some(c=>c[1]==='samguk'));assert(f.calls.some(c=>c[1]==='ancient'));
  if(view==='hongmungwan'){
   assert.equal(f.d.querySelectorAll('.era-wrong-review').length,8);await f.open();assert.equal(f.d.querySelectorAll('.era-wrong-item').length,1);const input=f.d.querySelector('input');assert.equal(input.value,'');assert(!f.d.querySelector('dialog').textContent.includes('synthetic old answer'));input.value='synthetic answer';input.focus();input.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));assert.equal(f.d.querySelector('.era-practice-feedback').dataset.result,'correct');f.d.querySelector('.era-wrong-close').click();
  }
  assert.equal(JSON.stringify([draft,history]),before);assert.equal(f.prepare,0);f.close();cases++;
 }
 // Completed v2 wins without a legacy read or requiring the practice matcher.
 {const f=await fixture();f.v2=completed();f.legacyError=Error('must not read');await f.menu().ready;assert.match(f.host.textContent,/정답률 0%/);assert(!f.calls.some(c=>c[0]==='legacy'));f.close();cases++;}
 // Practice setup failure cannot remove an authenticated completed summary.
 {const f=await fixture();f.v2=completed();await f.aggregate().ready;assert.equal(f.prepare,0);await f.open();assert.equal(f.prepare,1);assert(f.d.querySelector('.era-wrong-error'));assert.match(f.d.querySelector('[data-review-era="samguk"]').textContent,/정답률/);assert(!f.calls.some(c=>c[0]==='legacy'));f.close();cases++;}
 // A failed historical read can recover through the existing close/reopen UX.
 {const f=await fixture();f.legacyError=Error('offline');await f.aggregate().ready;assert.match(f.host.textContent,/기록 확인 실패/);await f.open();assert(f.d.querySelector('.era-wrong-error'));f.d.querySelector('.era-wrong-close').click();f.legacyError=null;await f.open();assert(f.d.querySelector('.era-wrong-item'));assert.match(f.d.querySelector('[data-review-era="samguk"]').textContent,/정답률/);f.close();cases++;}
 // Unknown, malformed, wrong version/scope/source/era must not masquerade as empty.
 for(const kind of ['legacy-failure','v2-failure','legacy-version','legacy-scope','v2-scope','model-source','model-era']){
  const f=await fixture();if(kind==='legacy-failure')f.legacyError=Error('offline');if(kind==='v2-failure')f.v2Error=Error('offline');if(kind==='legacy-version')f.legacy={...completed(),version:'stale'};if(kind==='legacy-scope')f.legacy={...completed(),gradingVersion:2,gradingStorageScope:'isolated-v2'};if(kind==='v2-scope')f.v2Hold=Promise.resolve({...completed(),...cap,gradingStorageScope:'legacy-v1'});if(kind==='model-source')f.modelSource='wrong';if(kind==='model-era')f.modelId='wrong';
  const c=f.aggregate();await c.ready;assert.match(f.host.textContent,/기록 확인 실패/);assert(!f.host.textContent.includes('기록 없음'));await f.open();assert(f.d.querySelector('.era-wrong-error'));assert(!f.d.querySelector('.era-wrong-empty'));if(kind==='v2-failure'||kind==='v2-scope')assert(!f.calls.some(c=>c[0]==='legacy'));f.close();cases++;
 }
 {const f=await fixture();f.legacy=empty();await f.aggregate().ready;assert.match(f.host.textContent,/기록 없음/);assert(!f.host.textContent.includes('실패'));f.close();cases++;}
 }
 // A stale auth callback must not erase a newer account's mount on the same host.
 {const f=await fixture();f.d.querySelector('meta').remove();await f.menu().ready;const old=f.callbacks[0];f.state={signedIn:true,ownerId:'synthetic-B',epoch:2};await f.w.HanqEraProgress.mount(f.host,{api:f.api}).ready;assert.match(f.host.textContent,/정답률 0%/);old();assert.match(f.host.textContent,/정답률 0%/);assert.equal(f.d.querySelectorAll('.era-progress-row').length,1);f.close();cases++;}
 if(process.env.STALE_MOUNT_ONLY){console.log('PASS stale auth callback preserves new mount');return;}
 // Late legacy read from the old route/owner cannot paint the next mount.
 {const f=await fixture(),held=deferred();f.legacyHold=held.promise;const old=f.menu();await tick();old.stop();f.state={signedIn:true,ownerId:'synthetic-B',epoch:2};f.legacyHold=null;f.legacy=empty();await f.aggregate().ready;held.resolve(completed());await old.ready;assert(!f.host.textContent.includes('정답률'));assert.match(f.host.textContent,/기록 없음/);f.callbacks[0]();assert.equal(f.d.querySelectorAll('.era-wrong-review').length,8);f.close();cases++;}
 // New dialog read beats the earlier queued aggregate request.
 {const f=await fixture(),held=deferred();f.legacyHold=held.promise;const c=f.aggregate();await tick();f.legacyHold=null;f.legacy=completed();await f.open();assert.match(f.d.querySelector('[data-review-era="samguk"]').textContent,/정답률/);held.resolve(empty());await c.ready;assert.match(f.d.querySelector('[data-review-era="samguk"]').textContent,/정답률/);f.w.dispatchEvent(new f.w.PopStateEvent('popstate'));assert.equal(f.d.querySelector('dialog'),null);assert.equal(f.d.querySelectorAll('.era-wrong-review').length,8);f.close();cases++;}
 // Account/epoch change during a pending request discards its result and closes UI.
 for(const phase of ['model','v2','legacy']){const f=await fixture(),held=deferred();f[phase+'Hold']=held.promise;const c=f.aggregate();await tick();f.state={signedIn:true,ownerId:'synthetic-A',epoch:2};f.callbacks.forEach(fn=>fn());held.resolve(phase==='v2'?{...empty(),...cap}:completed());await c.ready;assert(!f.d.querySelector('.era-aggregate'));assert(!f.d.querySelector('dialog'));f.close();cases++;}
 console.log(JSON.stringify({cases,syntheticOnly:true,writes:0,views:['era catalogue','Hongmungwan'],legacyRevisionZero:true,staleMountRegression:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
