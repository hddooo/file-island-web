'use strict';
// Read-only synthetic API responses. No production accounts, answers or requests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_PATH||'../.test-tools/node_modules/jsdom');
const source=fs.readFileSync(path.resolve(__dirname,'../media/my-records.js'),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,12)),snapshot='2026-11-06T00:00:00.000Z';
let cases=0;
function env(total,size,page=1){
 const w=new JSDOM('<div id="host"></div>',{url:'https://synthetic.test/?recordPage='+page+'#account',runScripts:'outside-only'}).window,host=w.document.querySelector('#host');
 const rows=Array.from({length:total},(_,i)=>({key:'record:'+i,subject:i%2?'toeic':'history',source:'unknown',at:new Date(Date.parse(snapshot)-i*1000).toISOString(),detail:{questionId:'q'+i,question:{prompt:'합성 문제 '+i,explanation:'합성 해설'},correct:true}}));
 const original=JSON.stringify(rows),calls=[];let state={ownerId:'synthetic-A',signedIn:true},listener,currentSize=size,fail=false;
 const api={state:()=>state,onChange:f=>{listener=f;return()=>{};},myRecords:async f=>{calls.push({...f});if(fail)throw Error('synthetic failure');const n=currentSize||20,filtered=rows.filter(r=>(f.subject==='all'||f.subject===r.subject)&&(f.source==='all'||f.source===r.source)),pages=Math.max(1,Math.ceil(filtered.length/n)),p=Math.min(f.page,pages);return{items:filtered.slice((p-1)*n,p*n),total:filtered.length,page:p,pages,pageSize:currentSize,snapshot:f.snapshot||snapshot,timeZone:'Asia/Seoul'};}};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.eval(source);w.HanqMyRecords.mount(host,api);
 return{w,host,rows,calls,api,original,setSize:n=>currentSize=n,setFail:b=>fail=b,switchOwner:()=>{state={ownerId:'synthetic-B',signedIn:true};listener();},close:()=>{assert.equal(JSON.stringify(rows),original,'stored fixture records unchanged');w.HanqMyRecords.stop();w.close();}};
}
const keys=x=>[...x.host.querySelectorAll('.mr-list>.mr-card>.mr-row')].map(n=>n.dataset.recordKey);
const nav=(x,n)=>x.host.querySelectorAll('.mr-pages button')[n];
(async()=>{
 for(const size of [10,20,undefined])for(const total of [0,1,10,11,20,21,43]){
  const x=env(total,size);await tick();const pages=Math.max(1,Math.ceil(total/10)),seen=[];
  for(let p=1;p<=pages;p++){
   const expected=x.rows.slice((p-1)*10,p*10).map(r=>r.key);assert.deepEqual(keys(x),expected);seen.push(...keys(x));assert.equal(x.host.querySelector('.mr-pages span').textContent,p+' / '+pages);assert.equal(nav(x,0).disabled,p===1);assert.equal(nav(x,1).disabled,p===pages);
   if(p<pages){nav(x,1).click();nav(x,1)?.click();await tick();}
  }
  assert.deepEqual(seen,x.rows.map(r=>r.key),'no duplicate or missing records across pages');
  for(let p=pages-1;p>=1;p--){nav(x,0).click();await tick();assert.deepEqual(keys(x),x.rows.slice((p-1)*10,p*10).map(r=>r.key));}
  assert(x.calls.slice(1).every(c=>c.snapshot===snapshot),'snapshot preserved while paging');x.close();cases++;
 }
 for(const size of [10,20,undefined])for(const page of [2,4,999]){const x=env(43,size,page);await tick();const p=Math.min(page,5);assert.deepEqual(keys(x),x.rows.slice((p-1)*10,p*10).map(r=>r.key));assert.equal(new URL(x.w.location.href).searchParams.get('recordPage'),String(p));assert(x.calls.length<=2);x.close();cases++;}
 const x=env(43,20);await tick();nav(x,1).click();await tick();nav(x,1).click();await tick();x.setSize(10);nav(x,1).click();await tick();assert.deepEqual(keys(x),x.rows.slice(30,40).map(r=>r.key));x.setSize(20);nav(x,0).click();await tick();assert.deepEqual(keys(x),x.rows.slice(20,30).map(r=>r.key));
 const select=x.host.querySelector('[aria-label="과목"]');select.value='toeic';select.dispatchEvent(new x.w.Event('change'));await tick();assert.equal(x.calls.at(-1).page,1);assert.equal(x.calls.at(-1).snapshot,undefined);assert.equal(keys(x).length,10);assert.equal(x.host.querySelector('.mr-pages span').textContent,'1 / 3');
 x.setFail(true);nav(x,1).click();await tick();assert(x.host.textContent.includes('다시 확인'));assert.equal(keys(x).length,0);x.setFail(false);[...x.host.querySelectorAll('button')].find(n=>n.textContent==='다시 확인').click();await tick();assert.equal(keys(x).length,10);x.switchOwner();assert.equal(x.host.textContent,'');x.close();cases++;
 const race=env(43,20,4);let complete;race.api.myRecords=()=>new Promise(r=>complete=r);await tick();race.switchOwner();complete({items:race.rows.slice(20,40),total:43,page:2,pages:3,pageSize:20,snapshot,timeZone:'Asia/Seoul'});await tick();assert.equal(race.host.textContent,'');race.close();cases++;
 console.log('PASS '+cases+' synthetic pagination cases: native 10, legacy 20/omitted size, first/last/empty, previous/next, deep links, clamp, fixed snapshots, filters, retry, server upgrade/downgrade, owner race and unchanged records');
})().catch(e=>{console.error(e);process.exitCode=1;});
