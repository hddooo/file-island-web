'use strict';
// Synthetic, read-only records. No private source text or account data.
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const code=fs.readFileSync('media/era-study-progress.js','utf8'),source='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function model(){return {id:'prehistory',version:'v',source:{sha256:source},items:[{id:'synthetic-q',blanks:[{id:'synthetic-b'}]}]};}
function result(){return {version:'v',workspace:{status:'completed',responses:{}}};}
(async()=>{
 let cases=0;
 for(const failure of ['quiz-network','workspace-network','wrong-source','wrong-version','wrong-era','duplicate-items','missing-workspace']){
  const dom=new JSDOM('<main><button class="period ready" data-id="prehistory"><strong>합성 시대</strong></button></main>',{url:'https://fixture.test',runScripts:'outside-only'}),w=dom.window,d=w.document;w.eval(code);
  const api={state:()=>({signedIn:true,ownerId:'synthetic',epoch:1}),onChange:()=>()=>{},textbookSemanticQuiz:async()=>{if(failure==='quiz-network')throw Error('network');const m=model();if(failure==='wrong-source')m.source.sha256='stale';if(failure==='wrong-era')m.id='other';if(failure==='duplicate-items')m.items.push(m.items[0]);return m;},textbookSourceWorkspace:async()=>{if(failure==='workspace-network')throw Error('network');const r=result();if(failure==='wrong-version')r.version='stale';if(failure==='missing-workspace')delete r.workspace;return r;}};
  const c=w.HanqEraProgress.mount(d.querySelector('main'),{api});assert.equal(d.querySelector('.era-progress-status').textContent,'확인 중');assert.equal(d.querySelector('.era-complete'),null);await c.ready;
  assert.equal(d.querySelector('.era-progress-status').textContent,'확인 실패',failure);assert.equal(d.querySelector('.era-progress-tools').dataset.state,undefined);assert.equal(d.querySelector('.era-complete'),null);assert.equal(d.querySelector('.era-wrong-review'),null);c.stop();w.close();cases++;
 }
 for(const interrupt of ['account-switch','logout','stop','detach','remount']){
  const dom=new JSDOM('<main><button class="period ready" data-id="prehistory"><strong>합성 시대</strong></button></main>',{url:'https://fixture.test',runScripts:'outside-only'}),w=dom.window,d=w.document;w.eval(code);
  const host=d.querySelector('main'),card=host.firstElementChild;let release,change,owner={signedIn:true,ownerId:'synthetic-a',epoch:1};
  const api={state:()=>owner,onChange:f=>{change=f;return()=>{};},textbookSemanticQuiz:async()=>model(),textbookSourceWorkspace:()=>new Promise(resolve=>{release=resolve;})};
  const c=w.HanqEraProgress.mount(host,{api});await tick();assert.equal(d.querySelector('.era-complete'),null);
  let next;if(interrupt==='account-switch'){owner={signedIn:true,ownerId:'synthetic-b',epoch:2};change();}else if(interrupt==='logout'){owner={signedIn:false,epoch:2};change();}else if(interrupt==='stop')c.stop();else if(interrupt==='detach')host.remove();else{api.textbookSourceWorkspace=async()=>({version:'v',workspace:{status:'active',responses:{}}});next=w.HanqEraProgress.mount(host,{api});await next.ready;}
  release(result());await c.ready;assert.equal(host.querySelector('.era-complete'),null,interrupt);assert.equal(host.querySelector('.period'),card);assert.equal(host.querySelectorAll('.era-wrong-review').length,0);if(next){assert.equal(host.querySelectorAll('.era-progress-row').length,1);assert.equal(host.querySelector('.era-progress-status').textContent,'');next.stop();}else c.stop();assert.equal(host.children.length,1);w.close();cases++;
 }
 console.log(JSON.stringify({cases,loadingNeverComplete:true,errorNeverComplete:true,lateResponsesIgnored:true,cardIdentityPreserved:true,productionWrites:0}));
})().catch(e=>{console.error(e);process.exitCode=1;});
