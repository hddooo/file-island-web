'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const {effectiveModel}=require('./joseon-scope-fixture.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
const named=['early-joseon','late-joseon','central-offices','society-diplomacy','society-comparison','economy-comparison','culture'];
function namedModel(old){
 const d=effectiveModel(),sizes=old?[24,50,14,11,14,18,33]:[26,50,15,13,14,18,36];
 d.items=d.items.filter(i=>i.originalNumber<=sizes[Number(i.subtopicId.slice(-1))]);
 d.items.forEach((i,n)=>{i.subtopicId=named[Number(i.subtopicId.slice(-1))];i.order=n+1;});d.subtopics=named.map(id=>({id,title:id}));
 d.version=old?'6892d35b75b9dc6580050bb950242e77ebdb0f2f40d01d13072f0ac5ea1ba3c4':'042ee684d7e9ae89cc2afd4b3964b1568806432f361dc99b39ad9f88f4d6ca5a';
 if(old)d.source.sha256='35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442';return d;
}
async function verifyModel(data,expected=[64,14,94]){
 const before=JSON.stringify(data),w=new JSDOM('<main/>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://synthetic.invalid'}).window;
 w.HTMLElement.prototype.scrollIntoView=function(){};w.eval(fs.readFileSync('media/textbook-source-quiz.js','utf8'));const q=w.HanqTextbookSourceQuiz,host=w.document.querySelector('main');
 try{
  assert.deepEqual(Array.from(q.joseonScopes(data),s=>s.count),[data.items.length,expected[0]===59?74:76,expected[0]===59?90:96]);
  let saved={version:data.version,revision:0,workspace:{cursor:0,status:'active',responses:{}}};
  const opts={loadProgress:async()=>clone(saved),saveProgress:async()=>{throw Error('unexpected write');}};
  let c=q.render(host,data,opts);await c.ready;
  assert.deepEqual([...host.querySelectorAll('.textbook-joseon-section')].map(g=>g.querySelectorAll('[data-source-item-id]').length),expected);
  assert.equal(host.querySelectorAll('.textbook-source-quiz-input').length,data.items.length);
  assert.equal(new Set([...host.querySelectorAll('[data-source-item-id]')].map(n=>n.dataset.sourceItemId)).size,data.items.length);c.cleanup();
  saved.workspace.status='paused';saved.workspace.responses=Object.fromEntries(data.items.map(i=>[i.id,{values:['SYNTHETIC_WRONG'],submitted:true,correct:false,checkedSlots:[true]}]));
  c=q.render(host,data,opts);await c.ready;
  assert.deepEqual([...host.querySelectorAll('.textbook-joseon-review')].map(g=>g.querySelectorAll('[data-source-review-item-id]').length),expected);c.cleanup();
  assert.equal(JSON.stringify(data),before);
 }finally{w.close();}
}
async function run(){
 await verifyModel(effectiveModel());await verifyModel(namedModel(false));await verifyModel(namedModel(true),[59,14,91]);
 const w=new JSDOM('<main/>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://synthetic.invalid'}).window;w.HTMLElement.prototype.scrollIntoView=function(){};w.eval(fs.readFileSync('media/textbook-source-quiz.js','utf8'));const q=w.HanqTextbookSourceQuiz,host=w.document.querySelector('main');let rejected=0;
 try{
  for(const change of [d=>d.version='0'.repeat(64),d=>d.source.sha256='0'.repeat(64),d=>d.source.scriptSha256='0'.repeat(64),d=>d.items.pop(),d=>d.items[1].id=d.items[0].id,d=>d.items[1].originalNumber=1,d=>d.items[0].subtopicId='early-joseon',d=>d.subtopics[1].id=d.subtopics[0].id,d=>d.subtopics.pop(),d=>d.items[0].originalNumber=null,d=>d.items[0].subtopicId='group-7']){
   const bad=effectiveModel();change(bad);assert.equal(q.joseonScopes(bad),null);let rejectedScope=false;try{const c=q.render(host,bad,{manualSave:true,sequential:true,quizScope:'politics',loadProgress:async()=>({version:bad.version,workspace:{responses:{}}}),saveProgress:async()=>{throw Error('unexpected write');}});try{await c.ready;}finally{c.cleanup();}}catch(_){rejectedScope=true;}assert(rejectedScope);rejected++;
  }
  // A valid canonical model with unrecognized presentation metadata keeps the full quiz usable.
  for(const change of [d=>d.version='0'.repeat(64),d=>d.items[1].originalNumber=1,d=>d.source.scriptSha256='0'.repeat(64),d=>d.version=namedModel(false).version,d=>{d.subtopics[0].id='early-joseon';d.items.filter(i=>i.subtopicId==='group-0').forEach(i=>i.subtopicId='early-joseon');},d=>d.items.pop()])for(const sequential of [false,true]){
   const d=effectiveModel();change(d);const c=q.render(host,d,{manualSave:true,sequential,loadProgress:async()=>({version:d.version,revision:0,workspace:{cursor:0,status:'active',responses:{}}}),saveProgress:async()=>{throw Error('unexpected write');}});await c.ready;
   assert.equal(host.querySelectorAll('.textbook-source-quiz-input').length,d.items.length);assert.equal(host.querySelectorAll('[data-quiz-scope]').length,0);assert.equal(host.querySelectorAll('[data-joseon-group]').length,0);c.cleanup();
  }
 }finally{w.close();}
 console.log(JSON.stringify({profiles:3,effectiveScopes:[172,76,96],effectivePresentation:[64,14,94],invalidMetadataRejected:rejected,unknownFullUsable:true,canonicalUnchanged:true}));
}
module.exports={verifyModel,namedModel};if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
