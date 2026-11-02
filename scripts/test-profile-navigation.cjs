'use strict';
const assert=require('node:assert/strict'),{create}=require('../media/api-client');
const response=data=>({ok:true,status:200,text:async()=>JSON.stringify(data)});
const profile={user:{id:'synthetic-owner',displayName:'Synthetic'},growth:{points:17},premium:{active:false},access:{total:1}};
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
  const events=new EventTarget();let mode='ok',reads=0,signal,release,posts=0;
  const api=create({base:'https://fixture.test',storage:null,locks:null,eventTarget:events,fetch:async(url,init)=>{
    if(url.endsWith('/signin'))return response({accessToken:'synthetic-memory',accessTokenExpiresAt:'2030-01-01T00:00:00Z',user:profile.user});
    if(url.endsWith('/me')){reads++;signal=init.signal;if(mode==='pending')return new Promise((resolve,reject)=>{release=()=>resolve(response(profile));signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});return response(profile);}
    posts++;return new Promise(resolve=>{release=()=>resolve(response({saved:true}));signal=init.signal;});
  }});
  await api.signin('synthetic@example.test','synthetic');mode='pending';
  let pending=api.me();await tick();events.dispatchEvent(new Event('pagehide'));
  await assert.rejects(pending,e=>e.code==='aborted');assert(signal.aborted);
  assert.equal(api.state().signedIn,true);assert.equal(api.state().status,'online');assert.equal(api.state().growth.points,17);
  const before=reads;await assert.rejects(api.me(),e=>e.code==='aborted');assert.equal(reads,before);
  mode='ok';events.dispatchEvent(new Event('pageshow'));await tick();await tick();assert.equal(api.state().profileStatus,'ready');assert(reads>before);
  // A queued read must not start fetch after the document has left.
  const queuedBefore=reads;pending=api.me();events.dispatchEvent(new Event('pagehide'));await assert.rejects(pending,e=>e.code==='aborted');assert.equal(reads,queuedBefore);
  events.dispatchEvent(new Event('pageshow'));await tick();await tick();
  // The read cancellation must not cancel or replay a submitted write.
  pending=api.cbt('POST','/api/v1/cbt/runs/synthetic/answer',{});await tick();const writeSignal=signal;events.dispatchEvent(new Event('pagehide'));assert.equal(writeSignal.aborted,false);release();assert.deepEqual(await pending,{saved:true});assert.equal(posts,1);
  // Resume after a pending focus check has settled, without overlapping session checks.
  mode='ok';events.dispatchEvent(new Event('pageshow'));await tick();await tick();mode='pending';events.dispatchEvent(new Event('pagehide'));events.dispatchEvent(new Event('pageshow'));await tick();events.dispatchEvent(new Event('pagehide'));events.dispatchEvent(new Event('pageshow'));await tick();mode='ok';release();await tick();await tick();assert.equal(api.state().profileStatus,'ready');
  console.log('PASS profile navigation: pending/queued reads aborted, profile/session retained, resume rereads, submitted writes preserved');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
