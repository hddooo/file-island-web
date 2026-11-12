'use strict';
const assert=require('node:assert/strict'),{create,selected}=require('../media/source-grading-v2-session');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
(async()=>{
 const calls=[],ok={gradingVersion:2,supportedGradingVersions:[1,2],gradingStorageScope:'isolated-v2',version:'v',revision:0,workspace:{responses:{},status:'active'}};let current=true,response=ok;
 const api={textbookSourceWorkspaceV2:async(...args)=>{calls.push(['get2',...args]);return response;},saveTextbookSourceWorkspaceV2:async(...args)=>{calls.push(['put2',...args]);return response;},textbookSourceWorkspace:async(...args)=>{calls.push(['get1',...args]);return {gradingVersion:1,gradingStorageScope:'legacy-v1',workspace:{responses:{}}};},saveTextbookSourceWorkspace:()=>{throw Error('legacy write forbidden');}},session=create({api,era:'opening',sourceRevision:'rev',isCurrent:()=>current});
 eq(selected({querySelector:()=>null}),false);eq(selected({querySelector:()=>({content:'2'})}),true);assert.throws(()=>selected({querySelector:()=>({content:'3'})}));checks++;
 eq(await session.load(),ok);eq(calls.at(-1),['get2','opening','rev']);const body={version:'v',revision:0,updates:[{values:['동의보감 / 광해군']}],status:'completed'},before=JSON.stringify(body);await session.save(body);eq(calls.at(-1),['put2','opening',{...body,gradingVersion:2},'rev']);eq(JSON.stringify(body),before);await session.loadLegacy();eq(calls.at(-1),['get1','opening','rev']);
 for(const bad of [{},{...ok,gradingVersion:1},{...ok,gradingStorageScope:'legacy-v1'},{...ok,supportedGradingVersions:[1]}]){response=bad;for(const fn of [()=>session.load(),()=>session.save(body)]){const n=calls.length;await assert.rejects(fn(),e=>e.code==='source_grading_unavailable');eq(calls.length,n+1);checks++;}}
 response=ok;current=false;let n=calls.length;await assert.rejects(session.load(),/session_changed/);await assert.rejects(session.save(body),/session_changed/);eq(calls.length,n);checks+=2;
 current=true;api.textbookSourceWorkspaceV2=async()=>{current=false;return ok;};await assert.rejects(session.load(),/session_changed/);checks++;current=true;n=calls.length;await assert.rejects(session.save({...body,gradingVersion:1}));eq(calls.length,n);checks++;
 console.log(JSON.stringify({checks,noLegacyWriteOrFallback:true,rawPreserved:true,capEveryResponse:true,lateOwnerGuard:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
