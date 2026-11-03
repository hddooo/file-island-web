/* Reviewed scene cels + full-app navigation. Synthetic accounts, local files only. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.HANQ_PLAYWRIGHT||'../.test-tools/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.HANQ_QA_OUTPUT||'evidence/english-residents');fs.mkdirSync(out,{recursive:true});
async function page(browser,width,height,fail=false,record=false){
 const p=await browser.newPage({viewport:{width,height},reducedMotion:'no-preference',hasTouch:width<700,recordVideo:record?{dir:out,size:{width,height}}:undefined});
 await p.addInitScript(()=>{localStorage.setItem('hanqacct:signedIn','1');localStorage.setItem('resident-qa-record','preserved');});
 let failing=fail;
 await p.route('**/*',r=>{const u=new URL(r.request().url());if(failing&&u.pathname.endsWith('/agumon-idle-sprite.png'))return r.abort();if(u.pathname.startsWith('/api/v1/')){const user={id:'resident-qa',displayName:'검수',email:'fixture@example.test'};return r.fulfill({json:u.pathname.endsWith('/refresh')?{accessToken:'synthetic',user}:u.pathname.endsWith('/me')?{user,growth:{points:1000},access:{total:1,today:true},premium:{active:false}}:{items:[],notes:[],archived:[],days:[],total:0,page:1,pages:1,entries:[]}});}if(u.hostname!=='islands.test')return r.abort();const f=path.join(root,u.pathname==='/'?'index.html':u.pathname);return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});});
 p.recover=()=>{failing=false;};return p;
}
async function ready(p){await p.locator('.english-residents .er-agumon.er-ready').waitFor();await p.locator('.english-residents .er-koromon.er-ready').waitFor();await p.locator('.english-residents .er-patamon .cm-life.cm-ready').waitFor();await p.waitForFunction(()=>document.querySelector('.english-residents').dataset.motion==='active');}
async function positions(p){return p.locator('.english-residents :is(.er-sprite,.cm-patamon-frames)').evaluateAll(ns=>ns.map(n=>({frame:getComputedStyle(n).backgroundPosition,transform:getComputedStyle(n).transform,animations:n.getAnimations().map(a=>({time:a.currentTime,state:a.playState,name:a.animationName}))})));}
async function main(){const results=[],errors=[];
for(const [engine,type] of [['chrome',chromium],['webkit',webkit]]){
 const browser=await type.launch(engine==='chrome'?{channel:'chrome'}:{});
 try{for(const [width,height] of [[320,740],[390,844],[844,390],[1440,1000]]){
  const p=await page(browser,width,height);p.on('pageerror',e=>errors.push(e.message));await p.goto('https://islands.test/#toeic/map');await ready(p);
  assert.equal(await p.locator('.english-residents').count(),1);assert.equal(await p.locator('.er-actor').count(),3);
  assert.equal(await p.locator('.english-residents').getAttribute('aria-hidden'),'true');
  const hit=await p.locator('.english-landmark .harbor-sign').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return n.closest('button').contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));assert(hit.every(Boolean));
  const boxes=await p.locator('.er-actor').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect(),m=n.closest('nav').getBoundingClientRect();return{character:n.className,width:r.width,height:r.height,visible:r.right>m.left&&r.left<m.right&&r.bottom>m.top&&r.top<m.bottom,pointer:getComputedStyle(n).pointerEvents};}));assert(boxes.every(b=>b.visible&&b.pointer==='none'));
  const initial=await positions(p);await p.waitForTimeout(290);const later=await positions(p);assert(later.every(v=>v.transform==='none'));assert.notDeepEqual(later.map(v=>v.animations.map(a=>a.time)),initial.map(v=>v.animations.map(a=>a.time)));assert.notEqual(initial[2].frame,later[2].frame,'real Patamon wing cel changes');
  await p.screenshot({path:path.join(out,`${engine}-${width}x${height}.png`),fullPage:true});
  const toggle=p.locator('.english-residents-toggle');assert.equal(await toggle.evaluate(n=>n.closest('nav')),null);assert(await toggle.evaluate(n=>n.getBoundingClientRect().height>=44));if(await p.locator('.harbor-motion-toggle').count()){const a=await toggle.boundingBox(),b=await p.locator('.harbor-motion-toggle').boundingBox();assert(!(a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height),'independent motion controls must not overlap');}await toggle.focus();assert.notEqual(await toggle.evaluate(n=>getComputedStyle(n).outlineStyle),'none');await toggle.click();assert.equal(await toggle.getAttribute('aria-pressed'),'false');assert.equal(await p.evaluate(()=>location.hash),'#toeic/map');
  await p.waitForTimeout(90);const paused=await positions(p);await p.waitForTimeout(300);assert.deepEqual(await positions(p),paused);await toggle.click();
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(120);assert.equal(await p.locator('.english-residents').getAttribute('data-motion'),'reduced');assert(await toggle.isDisabled());const reduced=await positions(p);await p.waitForTimeout(180);assert.deepEqual(await positions(p),reduced);
  await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForTimeout(120);assert.equal(await p.locator('.english-residents').getAttribute('data-motion'),'active');
  await p.locator('[data-english-harbor]').evaluate(n=>n.style.setProperty('display','none','important'));await p.waitForFunction(()=>document.querySelector('.english-residents').classList.contains('er-paused'));await p.locator('[data-english-harbor]').evaluate(n=>n.style.removeProperty('display'));await ready(p);
  for(const key of ['notebook','wrongnotes','grammar','player']){await p.locator('[data-toeic-view='+key+'] .harbor-sign').click();if(await p.locator('.world-cinematic').count())await p.keyboard.press('Enter');await p.waitForFunction(h=>location.hash===h,'#toeic/'+key);assert.equal(await p.locator('.english-residents-toggle').count(),0);await p.goBack();await ready(p);assert.equal(await p.locator('.english-residents-toggle').count(),1);}
  assert.equal(await p.evaluate(()=>localStorage.getItem('resident-qa-record')),'preserved');
  await p.evaluate(()=>location.hash='#history');await p.locator('[data-harbor-island=history]').waitFor();assert.equal(await p.locator('.english-residents,.english-residents-toggle').count(),0);
  results.push({engine,width,height,boxes,realCels:true,stableActors:true,menus:true,pause:true,reducedMotion:true,offscreen:true,detach:true,recordPreserved:true});await p.close();
 }
 const p=await page(browser,390,844,true);await p.goto('https://islands.test/#toeic/map');await p.locator('.er-koromon.er-ready').waitFor();assert.equal(await p.locator('.er-agumon').evaluate(n=>getComputedStyle(n).visibility),'hidden');p.recover();await p.evaluate(()=>location.hash='#toeic/notebook');await p.waitForTimeout(100);await p.evaluate(()=>location.hash='#toeic/map');await ready(p);await p.close();results.push({engine,decodeFailureHidden:true,remountRecovery:true});
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:true,results,errors,network:'Local files/synthetic account only'},null,2));console.log(JSON.stringify({passed:true,cases:results.length,errors}));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={page,ready};
