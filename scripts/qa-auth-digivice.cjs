'use strict';
// Fully intercepted synthetic API. Never connects to production or user Chrome.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),origin='https://auth-digivice.test';
const out=process.env.ARTIFACT_DIR||path.resolve(root,'../evidence/auth-digivice');
const sizes=[[320,740],[390,844],[1440,900],[844,390]].filter(size=>!process.env.QA_WIDTH||size[0]===Number(process.env.QA_WIDTH));
const user={id:'11111111-1111-4111-8111-111111111111',displayName:'합성 검수',email:'fixture@example.test'};
async function setup(browser,width,height,motion){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:motion});
 const state={errors:[],writes:[],external:[],signed:false,fail:true};
 page.on('pageerror',e=>state.errors.push(e.message));
 await page.route('**/*',async r=>{
  const u=new URL(r.request().url()),j=(json,status=200)=>r.fulfill({json,status});
  if(u.origin!==origin){state.external.push(u.origin);return r.abort();}
  if(u.pathname.startsWith('/api/')){
   if(r.request().method()!=='GET')state.writes.push(u.pathname);
   if(u.pathname==='/api/v1/premium/plan')return j({plan:{developmentOpen:true},auth:{rememberMe:{available:true,maxDays:90}}});
   if(u.pathname.endsWith('/email-availability')||u.pathname.endsWith('/nickname'))return j({available:true});
   if(u.pathname.endsWith('/signup')){await new Promise(r=>setTimeout(r,250));return j({status:'pending'});}
   if(u.pathname.endsWith('/signin')){await new Promise(r=>setTimeout(r,350));if(state.fail)return j({error:{code:'invalid_credentials'}},401);state.signed=true;return j({accessToken:'synthetic-memory-only',user});}
   if(u.pathname==='/api/v1/me')return state.signed?j({user,growth:{points:0},access:{total:0,today:false,freeSlots:[]},premium:{active:false}}):j({error:{code:'unauthorized'}},401);
   if(r.request().method()!=='GET')return j({error:{code:'unexpected_write'}},400);
   return j({items:[],notes:[],progress:[],available:false});
  }
  const f=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));
  return f.startsWith(root+path.sep)&&fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404});
 });
 await page.goto(origin+'/#account');await page.locator('#acAuthForm').waitFor();
 await page.locator('#fiEntrySplash').waitFor({state:'detached'});
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('.login-integrated img,.login-island-background img')].map(img=>img.decode().catch(()=>{})));});
 return {page,state};
}
async function layout(p){
 const info=await p.evaluate(()=>{
  const box=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const form=document.querySelector('#acAuthForm'),submit=document.querySelector('#acAuthSubmit');
  const fields=[...form.querySelectorAll('input:not([type=checkbox])')].map(n=>({id:n.id,box:box(n),font:parseFloat(getComputedStyle(n).fontSize)}));
  return {overflow:document.documentElement.scrollWidth>innerWidth,form:box(form),submit:box(submit),fields};
 });
 assert.equal(info.overflow,false,'no horizontal viewport overflow');
 assert(info.submit.width>=info.form.width*.9,'primary action fills form width');
 assert(info.submit.height>=44,'primary action touch target');
 for(const field of info.fields){assert(field.box.width>70,field.id+' usable width');assert(field.box.x>=0&&field.box.right<=p.viewportSize().width,field.id+' inside viewport');if(p.viewportSize().width<=844)assert(field.font>=16,field.id+' mobile-safe font: '+field.font+'px');}
 return info;
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});const results=[];
 for(const engine of (process.env.QA_ENGINE?[process.env.QA_ENGINE]:['chromium','webkit'])){
  const browser=await pw[engine].launch({headless:true});
  try{for(const [width,height] of sizes)for(const motion of ['no-preference','reduce']){
   const {page:p,state}=await setup(browser,width,height,motion),prefix=engine+'-'+width+'x'+height+'-'+motion;
   const login=await layout(p);
   const background=p.locator('.login-island-background');await background.waitFor();
   assert.equal(await background.getAttribute('aria-hidden'),'true');
   assert(await p.locator('.login-integrated img,.login-island-background img').evaluateAll(ns=>ns.every(n=>n.complete&&n.naturalWidth>0)),'auth artwork decoded');
   if(motion==='reduce')assert(await background.locator('img,i').evaluateAll(ns=>ns.every(n=>getComputedStyle(n).animationName==='none')),'reduced motion disables background animations');
   if(motion==='no-preference'&&await background.getAttribute('data-paused')==='false'){
    const panorama=background.locator('img'),before=await panorama.evaluate(n=>getComputedStyle(n).transform);
    await p.waitForTimeout(150);assert.notEqual(await panorama.evaluate(n=>getComputedStyle(n).transform),before,'normal panorama motion advances '+JSON.stringify(await panorama.evaluate(n=>{const s=getComputedStyle(n);return {name:s.animationName,duration:s.animationDuration,play:s.animationPlayState,classes:document.documentElement.className,rules:[...document.styleSheets].flatMap(sheet=>{try{return [...sheet.cssRules].filter(r=>r.selectorText&&n.matches(r.selectorText)&&r.style.animation).map(r=>[sheet.href,r.cssText]);}catch{return [];}})};})));
   }
   await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
   assert.equal(await background.getAttribute('data-paused'),'true');
   assert(await background.locator('img,i').evaluateAll(ns=>ns.every(n=>{const s=getComputedStyle(n);return s.animationName==='none'||s.animationPlayState==='paused';})),'hidden document stops background motion');
   await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
   await p.evaluate(()=>{document.documentElement.dataset.companyMode='on';});
   await p.waitForFunction(()=>document.querySelector('.login-island-background').dataset.paused==='true');
   assert.equal(await background.isVisible(),false,'company mode hides decorative backdrop');
   await p.evaluate(()=>{delete document.documentElement.dataset.companyMode;});
   await p.screenshot({path:path.join(out,prefix+'-login.png'),fullPage:true});
   await p.locator('#acModeUp').click();await p.locator('#acName').waitFor();
   assert.equal(await p.evaluate(()=>document.activeElement.id),'acEmail','mode switch focuses email');
   assert.equal(await p.locator('#acRememberSession').count(),0);
   const signup=await layout(p);
   await p.screenshot({path:path.join(out,prefix+'-signup.png'),fullPage:true});
   await p.locator('#acModeIn').click();await p.locator('#acEmail').waitFor();
   assert.equal(await p.locator('#acName').count(),0,'signup fields removed');
   assert.equal(await p.evaluate(()=>document.activeElement.id),'acEmail');
   await p.keyboard.press('Tab');
   assert.equal(await p.evaluate(()=>document.activeElement.id),'acPw');
   await p.locator('#acEmail').fill('fixture@example.test');await p.locator('#acPw').fill('synthetic-password');
   const toggle=p.locator('[aria-controls="acPw"]');
   assert.equal(await toggle.count(),1,'password visibility toggle');
   await toggle.click();assert.equal(await p.locator('#acPw').getAttribute('type'),'text');assert.equal(await toggle.getAttribute('aria-pressed'),'true');
   await toggle.click();assert.equal(await p.locator('#acPw').getAttribute('type'),'password');assert.equal(await toggle.getAttribute('aria-pressed'),'false');
   await p.locator('#acAuthSubmit').click();assert.equal(await p.locator('#acAuthSubmit').isDisabled(),true);
   await p.locator('#acAuthForm').evaluate(f=>f.requestSubmit());
   await p.waitForFunction(()=>!document.querySelector('#acAuthSubmit').disabled);
   assert.equal(state.writes.filter(x=>x.endsWith('/signin')).length,1,'duplicate submit blocked');
   assert((await p.locator('#acAuthMsg').textContent()).length>0,'failure announced');
   await p.screenshot({path:path.join(out,prefix+'-failure.png'),fullPage:true});
   await p.locator('#acModeUp').click();await p.locator('#acEmail').fill('fixture@example.test');await p.locator('#acPw').fill('synthetic-password');await p.locator('#acName').fill('합성 검수');
   await p.locator('#acAuthSubmit').click();assert.equal(state.writes.filter(x=>x.endsWith('/signup')).length,0,'unchecked signup blocked');
   await p.locator('#acEmailCheck').click();await p.waitForFunction(()=>document.querySelector('#acEmailCheckMsg').textContent.includes('사용할'));
   await p.locator('#acNameCheck').click();await p.waitForFunction(()=>document.querySelector('#acNameCheckMsg').textContent.includes('사용할'));
   await p.locator('#acAuthSubmit').click();await p.locator('#acModeUp').waitFor();
   assert.match(await p.locator('.ac-notice').textContent(),/승인/);
   assert.equal(state.signed,false,'pending signup does not sign in');
   state.fail=false;await p.locator('#acEmail').fill('fixture@example.test');await p.locator('#acPw').fill('synthetic-password');await p.locator('#acAuthSubmit').click();
   await p.waitForFunction(()=>HanqApi.state().signedIn);await p.locator('#acAuthForm').waitFor({state:'detached'});
   await background.waitFor({state:'detached'});
   assert.deepEqual(state.errors,[]);assert.deepEqual(state.external,[]);
   assert(state.writes.every(x=>['/api/v1/auth/signin','/api/v1/auth/signup','/api/v1/auth/email-availability'].includes(x)),'only explicit synthetic auth requests');
   const storage=await p.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]));assert(!/synthetic-password|synthetic-memory-only/.test(storage));
   results.push({engine,width,height,motion,login,signup,passed:true});console.log('PASS',prefix);await p.close();
  }}finally{await browser.close();}
 }
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,results},null,2));
 console.log(JSON.stringify({passed:true,cases:results.length,out}));
})().catch(e=>{console.error(e);process.exitCode=1;});
