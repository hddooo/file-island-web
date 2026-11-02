// Isolated full application. No production credentials, login, attendance or XP writes.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),pw=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,'../evidence/login-capability'),origin='https://login.test';
const user={id:'11111111-1111-4111-8111-111111111111',displayName:'격리 로그인 검수'};
const first='22222222-2222-4222-8222-222222222222';
const partners={version:1,claimEnabled:true,equipEnabled:true,revision:0,totalPoints:1000,equippedId:first,items:[{id:first,family:'agumon',character:'agumon',points:1000,stage:2,revision:0,equipped:true,firstPartner:true,nextCharacter:'greymon',nextThreshold:1200,eligible:false,final:false}],availableFamilies:['gabumon','patamon']};
const cases=['legacy','disabled','enabled-default','enabled-optin','rejected','generic-failure','no-locks','malformed'];
(async()=>{
 fs.mkdirSync(out,{recursive:true});const results=[];
 for(const engine of (process.env.QA_ENGINE?[process.env.QA_ENGINE]:['chromium','webkit'])){
  const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome'}:{});
  try{for(const width of (process.env.QA_WIDTH?[Number(process.env.QA_WIDTH)]:[390,1440]))for(const mode of cases){
   const mobile=width===390,p=await browser.newPage({viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
   await p.addInitScript(({mobile,noLocks})=>{if(mobile)Object.defineProperty(navigator,'standalone',{get:()=>true});if(noLocks)Object.defineProperty(navigator,'locks',{get:()=>undefined});}, {mobile,noLocks:mode==='no-locks'});
   const errors=[],requests=[],unexpected=[];let signedIn=false,external=0;
   p.on('pageerror',e=>errors.push(e.message));
   await p.route('**/*',async r=>{
    const u=new URL(r.request().url()),j=(data,status=200)=>r.fulfill({json:data,status});
    if(u.origin!==origin){external++;return r.abort();}
    if(u.pathname.startsWith('/api/v1/')){
     if(u.pathname==='/api/v1/premium/plan')return j({plan:{developmentOpen:true},...(mode==='legacy'?{}:{auth:{rememberMe:{available:mode==='malformed'?'true':mode!=='disabled',maxDays:90}}})});
     if(u.pathname==='/api/v1/auth/signin'){
      const body=r.request().postDataJSON();requests.push({rememberMe:body.rememberMe});
      await new Promise(resolve=>setTimeout(resolve,150));
      if(mode==='rejected'&&requests.length===1)return j({error:{code:'remember_unavailable',message:'Persistent login is not enabled'}},503);
      if(mode==='generic-failure'&&requests.length===1)return j({error:{code:'temporary_failure'}},503);
      signedIn=true;return j({accessToken:'synthetic-memory-only',user,retentionMode:body.rememberMe?'remember-90d':'legacy',sessionExpiresAt:new Date(Date.now()+86400000).toISOString()});
     }
     if(r.request().method()!=='GET'){unexpected.push(u.pathname);return j({error:{code:'unexpected_write'}},400);}
     if(u.pathname==='/api/v1/me')return signedIn?j({user,growth:{points:1000},premium:{active:true},access:{total:1,today:true,freeSlots:[]},...(mode==='legacy'||mode==='disabled'||mode==='rejected'?{}:{partners,partnerEvolution:{agumon:{stage:2,revision:0}}})}):j({error:{code:'unauthorized'}},401);
     return j({items:[],notes:[],progress:[],available:false});
    }
    const f=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));
    return f.startsWith(root+'/')&&fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});
   });
   await p.goto(origin+'/#rainbow');await p.locator('#acAuthForm').waitFor();
   assert.equal(new URL(p.url()).hash,'#account');assert.equal(await p.locator('.rainbow-island').count(),0);
   const enabled=['enabled-default','enabled-optin','rejected','generic-failure'].includes(mode),optin=['enabled-optin','rejected','generic-failure'].includes(mode);
   assert.equal(await p.locator('#acRememberSession').isEnabled(),enabled);assert.equal(await p.locator('#acRememberSession').isChecked(),false);
   if(optin)await p.locator('#acRememberSession').check();
   await p.locator('#acEmail').fill('fixture@example.test');await p.locator('#acPw').fill('synthetic-password');
   await p.locator('#acAuthSubmit').scrollIntoViewIfNeeded();
   await p.screenshot({path:out+'/'+engine+'-'+width+'-'+mode+'-form.png'});
   // A real button click plus a concurrent submit must send credentials once.
   await p.locator('#acAuthSubmit').click();
   await p.locator('#acAuthForm').evaluate(form=>form.requestSubmit());
   await p.waitForFunction(()=>document.querySelector('#acAuthSubmit')?.disabled||HanqApi.state().signedIn);
   if(['rejected','generic-failure'].includes(mode)){
    await p.waitForFunction(()=>{const msg=document.querySelector('#acAuthMsg');return msg&&msg.textContent&&!msg.textContent.includes('처리 중');});
    await p.waitForTimeout(250);assert.equal(requests.length,1,'never retry credentials automatically');
    assert.equal(await p.locator('#acRememberSession').isEnabled(),mode!=='rejected');
    assert.equal(await p.locator('#acRememberSession').isChecked(),mode!=='rejected');
    assert.equal(await p.locator('.rainbow-island').count(),0);
    await p.screenshot({path:out+'/'+engine+'-'+width+'-'+mode+'-error.png'});
    if(mode==='rejected')assert.match(await p.locator('#acAuthSubmit').innerText(),/일반 로그인/);
    await p.locator('#acAuthSubmit').click();
   }
   await p.locator('.rainbow-island').waitFor();await p.waitForFunction(()=>HanqApi.state().profileStatus==='ready');
   assert.deepEqual(requests,['rejected','generic-failure'].includes(mode)?[{rememberMe:true},{rememberMe:mode!=='rejected'}]:[{rememberMe:optin}]);
   assert.equal(new URL(p.url()).hash,'#rainbow');
   assert.equal(await (async()=>{let locked=0;for(const f of ['gabumon','patamon']){await p.locator('[data-select="'+f+'"]').click();await p.locator('#riOverlay:not([hidden])').waitFor();if(await p.locator('[data-action="claim"]').isDisabled())locked++;await p.keyboard.press('Escape');await p.locator('.ri-overlay[hidden]').waitFor({state:'attached'});}return locked;})(),['legacy','disabled','rejected'].includes(mode)?2:0);
   const storage=await p.evaluate(()=>({local:Object.fromEntries(Object.entries(localStorage)),session:Object.fromEntries(Object.entries(sessionStorage))}));
   assert(!JSON.stringify(storage).includes('synthetic-memory-only'));assert(!JSON.stringify(storage).includes('synthetic-password'));
   assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);assert.equal(external,0);
   results.push({engine,width,standaloneEmulated:mobile,mode,passed:true,requests,external,errors,unexpected,credentialStorage:false,rainbow:true});await p.close();
  }}finally{await browser.close();}
 }
 fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,results},null,2));console.log(JSON.stringify({passed:true,cases:results.length,results}));
})().catch(e=>{console.error(e);process.exitCode=1});
