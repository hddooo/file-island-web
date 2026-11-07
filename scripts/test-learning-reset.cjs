'use strict';
const assert = require('node:assert/strict');
const {mount, identity, _accept, hiddenAttempt, projectPractice, restartPending} = require('../media/learning-reset.js');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
function fixture(){
 const doc={createElement(tag){return {tag,attrs:{},setAttribute(k,v){this.attrs[k]=v;},textContent:''};}};
 const host={ownerDocument:doc,isConnected:true,children:[],replaceChildren(){this.children=[];},appendChild(n){this.children.push(n);},setAttribute(){}};
 let state={signedIn:true,ownerId:A,user:{id:A},epoch:1},listener=()=>{};
 const api={state:()=>state,onChange(fn){listener=fn;return()=>{listener=()=>{};};}};
 return {host,api,change(s){state=s;listener(s);}};
}
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 let count=0;
 for(const response of [{available:false,reason:'reset_consistency_pending'},{available:true},null]){
  const f=fixture(); f.api.learningResets=async()=>response;
  mount(f.host,f.api);await tick();
  assert.equal(f.host.children.filter(n=>n.tag==='button').length,2);
  assert(f.host.children.filter(n=>n.tag==='button').every(n=>n.disabled));count++;
 }
 const failed=fixture();failed.api.learningResets=()=>Promise.reject(new Error('offline'));mount(failed.host,failed.api);await tick();assert.match(failed.host.children.at(-1).textContent,/확인하지 못/);count++;
 const pending=fixture();let resolve;pending.api.learningResets=()=>new Promise(r=>resolve=r);mount(pending.host,pending.api);await tick();pending.change({signedIn:true,ownerId:B,user:{id:B},epoch:2});resolve({available:false,reason:'reset_consistency_pending'});await tick();assert.match(pending.host.children.at(-1).textContent,/계정이 바뀌/);count++;
 const stopped=fixture();let done;stopped.api.learningResets=()=>new Promise(r=>done=r);const stop=mount(stopped.host,stopped.api);await tick();const before=stopped.host.children.at(-1).textContent;stop();done({available:false,reason:'reset_consistency_pending'});await tick();assert.equal(stopped.host.children.at(-1).textContent,before);count++;
 const guest=fixture();guest.change({signedIn:false});let calls=0;guest.api.learningResets=()=>{calls++;};mount(guest.host,guest.api);await tick();assert.equal(calls,0);assert.equal(identity(guest.api),null);count++;
 const active=fixture(),at='2026-11-07T12:00:00.000Z',ts=Date.parse(at);let writes=0;
 active.api.learningResets=async()=>({available:true,scope:'wrong_answers_only',history:{resetAt:null},toeic:{resetAt:null}});
 active.api.resetLearning=async(body)=>{writes++;assert.equal(body.island,'history');assert.equal(body.confirmation,'RESET_HISTORY');assert.match(body.requestId,/^[0-9a-f-]{36}$/);return {available:true,scope:'wrong_answers_only',history:{resetAt:at},toeic:{resetAt:null}};};
 global.confirm=()=>false;mount(active.host,active.api);await tick();let button=active.host.children.find(n=>n.tag==='button');assert.equal(button.disabled,false);await button.onclick();assert.equal(writes,0);global.confirm=()=>true;await button.onclick();assert.equal(writes,1);assert.match(active.host.children.at(-1).textContent,/초기화했/);count++;
 assert(hiddenAttempt({ownerId:A,subject:'history',correct:false,ts:ts-1}));assert(!hiddenAttempt({ownerId:A,subject:'history',correct:true,ts:ts-1}));assert(!hiddenAttempt({ownerId:B,subject:'history',correct:false,ts:ts-1}));assert(!hiddenAttempt({ownerId:A,subject:'history',correct:false,ts:ts+1}));assert(!hiddenAttempt({subject:'history',correct:false,ts:ts-1}));count++;
 _accept(active.api,{available:true,scope:'wrong_answers_only',history:{resetAt:at},toeic:{resetAt:at}});const old={star:true,attempts:3,lastOptionId:'A',wrong:true};const view=projectPractice(old,A);assert.equal(view.wrong,false);assert.equal(old.wrong,true);assert.equal(view.star,true);assert.equal(view.attempts,3);const correct={wrong:false,lastOptionId:'B',attempts:4};assert.equal(projectPractice(correct,A),correct);assert.equal(projectPractice(old,B),old);assert.equal(projectPractice({...old,lastAt:ts+1},A).wrong,true);count++;
 const saved=new Map();global.localStorage={setItem:(k,v)=>saved.set(k,v),getItem:k=>saved.get(k)};global.confirm=()=>true;
 for(const island of ['history','toeic']){let applied=0;const old={optionId:'A',requestKey:'old-answer',resetAt:null};assert(restartPending(active.api,island,[old],()=>applied++));assert.equal(applied,1);assert.equal(old.optionId,'A');assert([...saved.values()].some(v=>JSON.parse(v).island===island));count++;}
 global.confirm=()=>false;let changed=0;assert(!restartPending(active.api,'toeic',[{resetAt:null}],()=>changed++));assert.equal(changed,0);global.confirm=()=>true;global.localStorage.setItem=()=>{throw Error('storage denied');};assert(!restartPending(active.api,'history',[{resetAt:null}],()=>changed++));assert.equal(changed,0);count++;
 delete global.localStorage;
 delete global.confirm;
 console.log(`${count} reset readiness, explicit confirmation and non-destructive owner filters passed`);
})().catch(e=>{console.error(e);process.exitCode=1;});