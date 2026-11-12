'use strict';
// Isolated auth gate with every request intercepted. No user browser or live login.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),origin='https://gate-fixture.test';
const out=process.env.ARTIFACT_DIR||path.resolve(root,'../evidence/auth-gate');
const sizes=[[320,740],[390,844],[1440,900],[844,390]];
const cases=['absent','disabled','malformed','wrong-days','enabled','no-locks','unavailable','generic-failure','plan-failure','signup'];
(async()=>{
 fs.mkdirSync(out,{recursive:true});const results=[];
 for(const engine of (process.env.QA_ENGINE?[process.env.QA_ENGINE]:['chromium','webkit'])){
  const browser=await pw[engine].launch({headless:true});
  try{for(const [width,height] of sizes)for(const mode of cases){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
   const errors=[],external=[],posts=[];let redirects=0,mediaRequests=0;
   page.on('pageerror',e=>errors.push(e.message));
   if(mode==='no-locks')await page.addInitScript(()=>Object.defineProperty(navigator,'locks',{get:()=>undefined}));
   await page.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url()),j=(json,status=200)=>route.fulfill({json,status});
    if(u.origin!==origin){external.push(u.origin);return route.abort();}
    if(u.pathname.startsWith('/media/')){mediaRequests++;return route.fulfill({status:401,body:'unauthorized'});}
    if(u.pathname==='/api/v1/auth/site-check')return j({},401);
    if(u.pathname==='/api/v1/auth/refresh')return j({error:{code:'invalid_refresh'}},401);
    if(u.pathname==='/api/v1/premium/plan'){
     await new Promise(r=>setTimeout(r,70));
     if(mode==='plan-failure')return j({error:{code:'unavailable'}},503);
     return j(mode==='absent'?{}:{auth:{rememberMe:{available:mode==='malformed'?'true':mode!=='disabled',maxDays:mode==='wrong-days'?30:90}}});
    }
    if(['/api/v1/auth/signin','/api/v1/auth/signup'].includes(u.pathname)){
     const data=req.postDataJSON();posts.push({path:u.pathname,rememberMe:data.rememberMe===true});
     await new Promise(r=>setTimeout(r,120));
     if(u.pathname.endsWith('/signup'))return j({status:'pending'},202);
     if(posts.length===1&&['unavailable','generic-failure'].includes(mode))return j({error:{code:mode==='unavailable'?'remember_unavailable':'temporary_failure'}},503);
     return j({accessToken:'synthetic-memory-only',retentionMode:data.rememberMe?'remember-90d':'legacy'});
    }
    if(u.pathname==='/'){redirects++;return route.fulfill({contentType:'text/html',body:'<!doctype html><p id="entered">Synthetic protected landing</p>'});}
    if(['/auth/login.html','/auth/login.js'].includes(u.pathname))return route.fulfill({path:path.join(root,u.pathname)});
    return route.fulfill({status:404,body:'not in fixture'});
   });
   await page.goto(origin+'/auth/login.html#chapter/prehistory/bookquiz');
   await page.waitForFunction(()=>!document.querySelector('#submit').disabled);
   await page.waitForTimeout(180);
   const supported=['enabled','unavailable','generic-failure','signup'].includes(mode);
   assert.equal(await page.locator('#remember').isEnabled(),supported,mode+' capability gate');
   assert.equal(await page.locator('#remember').isChecked(),false,'explicit opt-in only');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'no horizontal overflow');
   assert.equal(mediaRequests,0,'gate must not depend on protected media');
   if(mode==='absent'){
    assert.equal(await page.locator('.login-island-panorama').evaluate(e=>getComputedStyle(e).animationName),'none','reduced motion stops background');
    await page.emulateMedia({reducedMotion:'no-preference'});
    assert.notEqual(await page.locator('.login-island-panorama').evaluate(e=>getComputedStyle(e).animationName),'none','normal motion available');
    await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
    assert.equal(await page.locator('.login-island-background').getAttribute('data-paused'),'true','pagehide pauses background');
    await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
    assert.equal(await page.locator('.login-island-background').getAttribute('data-paused'),'true','hidden document pauses background');
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
    await page.emulateMedia({reducedMotion:'reduce'});
   }
   await page.locator('#email').fill('fixture@example.test');await page.locator('#password').fill('synthetic-password');
   const reveal=page.locator('#passwordToggle');
   assert.equal(await reveal.count(),1,'accessible password toggle exists');
   await reveal.click();assert.equal(await page.locator('#password').getAttribute('type'),'text');
   await reveal.click();assert.equal(await page.locator('#password').getAttribute('type'),'password');
   if(mode==='signup'){
    await page.locator('#toggle').click();assert.equal(await page.locator('#nicknameLabel').isVisible(),true);
    assert.equal(await page.locator('#rememberLabel').isVisible(),false);
    await page.locator('#nickname').fill('합성 사용자');
   }else if(supported)await page.locator('#remember').check();
   if(mode==='absent'||mode==='signup')await page.screenshot({path:path.join(out,`${engine}-${width}-${height}-${mode}.png`),fullPage:true});
   await page.locator('#submit').click();
   await page.locator('#form').evaluate(f=>f.requestSubmit());
   if(mode==='signup'){
    await page.waitForFunction(()=>document.querySelector('#message').textContent.includes('가입 요청을 보냈'));
    assert.equal(posts.length,1);assert.equal(await page.locator('#password').inputValue(),'');assert.equal(redirects,0);
    await page.locator('#toggle').click();assert.equal(await page.locator('#nicknameLabel').isVisible(),false);
    assert.equal(await page.locator('#password').getAttribute('autocomplete'),'current-password');
   }else{
    if(['unavailable','generic-failure'].includes(mode)){
     await page.waitForFunction(()=>!document.querySelector('#submit').disabled);
     await page.waitForTimeout(180);assert.equal(posts.length,1,'no automatic credential replay');
     assert.equal(await page.locator('#remember').isEnabled(),mode!=='unavailable');
     assert.equal(await page.locator('#remember').isChecked(),mode!=='unavailable');
     assert.equal(await page.locator('#email').inputValue(),'fixture@example.test');
     assert.equal(await page.locator('#password').inputValue(),'synthetic-password');
     if(mode==='unavailable')assert.match(await page.locator('#submit').innerText(),/일반 로그인/);
     await page.locator('#submit').click();
    }
    await page.locator('#entered').waitFor();assert.equal(redirects,1);
    assert.equal(new URL(page.url()).hash,'#chapter/prehistory/bookquiz','preserve safe hash return');
    assert.equal(posts.length,['unavailable','generic-failure'].includes(mode)?2:1);
    assert.equal(posts[posts.length-1].rememberMe,['enabled','generic-failure'].includes(mode));
   }
   const stored=await page.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]));
   assert(!stored.includes('synthetic-memory-only')&&!stored.includes('synthetic-password'));
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
   results.push({engine,width,height,mode,passed:true,requests:posts.length,redirects,mediaRequests,external:0});await page.close();
  }}finally{await browser.close();}
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:true,scope:'isolated headless synthetic gate; not production login or real-device verification',results},null,2));
 console.log(JSON.stringify({passed:true,cases:results.length,results}));
})().catch(e=>{console.error(e);process.exitCode=1;});
