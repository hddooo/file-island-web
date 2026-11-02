// Production compatibility: against an API without site presence (no /battle/presence), the site-wide invitation
// layer stays inert and the island keeps its current list. Synthetic API only.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),pw=require('playwright');
const root=path.resolve(__dirname,'..'),origin='http://127.0.0.1:8805',owner='11111111-1111-4111-8111-111111111111';
(async()=>{const results=[];
 for(const engine of (process.env.QA_ENGINE?[process.env.QA_ENGINE]:['chromium','webkit'])){const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome'}:{});
  try{const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],calls=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{localStorage.setItem('hanqacct:signedIn','1');localStorage.setItem('hanq:display-mode:v1','terminal');});
   const me={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',isMe:true,name:'나',character:'agumon',characterName:'아구몬',hp:50,atk:10,def:5,busy:false,status:'waiting'},
    other={id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',isMe:false,name:'상대',character:'agumon',characterName:'아구몬',hp:50,atk:10,def:5,busy:false,status:'waiting'};
   await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.fulfill({status:503,body:''});const q=u.pathname,j=(x,status=200)=>r.fulfill({json:x,status});
    if(q.startsWith('/api/v1/battle'))calls.push(r.request().method()+' '+q+u.search);
    if(q==='/api/v1/auth/refresh')return j({accessToken:'t',accessTokenExpiresAt:new Date(Date.now()+6e5).toISOString(),user:{id:owner,displayName:'나'}});
    if(q==='/api/v1/me')return j({user:{id:owner,displayName:'나'},premium:{active:true},growth:{points:1000},access:{total:1,today:true,freeSlots:[]}});
    // The current production API: no site presence or invitation inbox endpoints.
    if(q==='/api/v1/battle/presence'||q==='/api/v1/battle/invitations')return j({error:{code:'not_found'}},404);
    if(q==='/api/v1/battle/events')return r.fulfill({status:200,headers:{'Content-Type':'text/event-stream'},body:'event: waiting\ndata: {}\n\n'});
    if(q==='/api/v1/battle/enter'||q==='/api/v1/battle/lobby')return j({serverNow:Date.now(),myId:me.id,participants:[me,other],matchId:null,invitations:[],practiceBot:true,lukConfigured:true});
    if(q.startsWith('/api/'))return j({items:[],notes:[],progress:[],available:false});
    const f=path.join(root,q==='/'?'index.html':decodeURIComponent(q));return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});});
   await page.goto(origin+'/#toeic/notebook');await page.waitForFunction(()=>window.HanqBattleInvites&&HanqBattleInvites.state().supported===false,null,{timeout:15000});
   await page.waitForTimeout(2500);const outside=calls.slice();
   assert(!outside.some(c=>c.startsWith('GET /api/v1/battle/events')),'no site stream against the old API');
   assert.equal(outside.filter(c=>c.startsWith('POST ')).length,0,'no writes against the old API');assert.equal(outside.filter(c=>c.startsWith('GET /api/v1/battle/invitations')).length,1,'one read-only capability probe');
   assert.equal(await page.locator('.hbi-overlay,.hbi-toast').count(),0);
   await page.goto(origin+'/#battle');await page.locator('.bi-participant').first().waitFor({timeout:20000});
   const rows=await page.locator('.bi-participant:not(.bi-practice-card)').evaluateAll(ns=>ns.map(n=>({text:n.querySelector('strong').textContent,state:(n.querySelector('.bi-activity')||{}).textContent,buttons:n.querySelectorAll('button').length})));
   assert.deepEqual(rows,[{text:'상대',state:'대기 중',buttons:1}],'old list: no own row, old status text');
   assert.deepEqual(errors,[]);results.push({engine,passed:true,probe:'GET 404 → inert, no writes',calls:outside,islandRows:rows});console.log(engine,'PASS',JSON.stringify(rows));await page.close();
  }finally{await browser.close();}}
 fs.mkdirSync(path.resolve(root,'../evidence/site-invites'),{recursive:true});fs.writeFileSync(path.resolve(root,'../evidence/site-invites/legacy-result.json'),JSON.stringify({passed:true,results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
