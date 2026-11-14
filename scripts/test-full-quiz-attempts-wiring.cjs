'use strict';
// History81 workspace passes full-run record calls bound to its own era and pinned revision, only under grading v2.
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
let checks=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const revision='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de',script='c'.repeat(64),version='e'.repeat(64);
const model={id:'opening',version,source:{sha256:revision,scriptSha256:script},items:[{id:'i1',kind:'blank',blanks:[{id:'s1'}]}],scriptResponseGroups:[{itemId:'i1',fieldId:'f1',slotIds:['s1']}]};
const cap={gradingVersion:2,supportedGradingVersions:[1,2],gradingStorageScope:'isolated-v2'};
async function mount(grading){
 const w=new JSDOM((grading?'<meta name="hanq-source-grading" content="2">':'')+'<main></main>',{runScripts:'outside-only',url:'https://synthetic.invalid'}).window;
 w.eval(fs.readFileSync('media/source-grading-v2-session.js','utf8'));w.eval(fs.readFileSync('media/history81-workspace.js','utf8'));
 const calls=[];let captured=null;
 const workspace={version,revision:0,workspace:{cursor:0,status:'active',responses:{}}};
 const api={textbookSemanticQuiz:async()=>structuredClone(model),textbookSourceWorkspaceV2:async()=>({...structuredClone(workspace),...cap}),textbookSourceWorkspace:async()=>structuredClone(workspace),saveTextbookSourceWorkspaceV2:async()=>{throw Error('not used');},
  submitTextbookFullAttempt:async(...args)=>{calls.push(['submit',...args]);return {attempt:{id:args[1].attemptId},replayed:false};},textbookFullAttempts:async(...args)=>{calls.push(['list',...args]);return {items:[],latest:null};}};
 const renderer={render:(host,m,opts)=>{captured=opts;return {ready:Promise.resolve(),cleanup(){},prepareLeave:()=>Promise.resolve(),hasUnsaved:()=>false};}};
 const ws=w.HanqHistory81Workspace.create({document:w.document,api,era:'opening',ownerId:'A',isCurrent:()=>true,contract:{revision,sourceSha256:script,counts:{items:1,groups:1,slots:1}},renderer});
 await ws.show(w.document.querySelector('main'));return {captured,calls,close(){ws.stop();w.close();}};
}
(async()=>{
 {const t=await mount(true);eq(typeof t.captured.fullAttempts.submit,'function');eq(typeof t.captured.fullAttempts.list,'function');
  const body={attemptId:'10000000-0000-4000-8000-000000000001',mode:'full',status:'completed',version,gradingVersion:2,responses:[{itemId:'i1',values:['x']}]};
  await t.captured.fullAttempts.submit(body);await t.captured.fullAttempts.list();
  eq(t.calls,[['submit','opening',body,revision],['list','opening',revision]],'bound to era and pinned revision');t.close();}
 {const t=await mount(false);eq(t.captured.fullAttempts,undefined,'grading v1 never records full runs');t.close();}
 console.log(JSON.stringify({checks,failures:0,scope:'history81 full-run wiring'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
