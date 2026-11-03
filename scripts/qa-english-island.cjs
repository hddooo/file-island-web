/* Full app QA with synthetic APIs. Never requests production or changes real progress. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.HANQ_PLAYWRIGHT||'../.test-tools/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.HANQ_QA_OUTPUT||'evidence/english-island');fs.mkdirSync(out,{recursive:true});if(fs.existsSync(path.join(out,'results.json')))fs.unlinkSync(path.join(out,'results.json'));
const routes=['#toeic/notebook','#toeic/wrongnotes','#toeic/grammar','#toeic/player'];
const nativeNames=['Vocabulary · 단어장','Practice · 파트별 실전 문제','Grammar · 문법','Listening · 듣기'];
async function setup(browser,width,height){
 const p=await browser.newPage({viewport:{width,height},reducedMotion:'reduce',hasTouch:width<700});
 await p.addInitScript(()=>{localStorage.setItem('hanqacct:signedIn','1');localStorage.setItem('english-qa-progress','retained');});
 await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.pathname.startsWith('/api/v1/')){const user={id:'english-scene-qa',displayName:'장면 검수',email:'fixture@example.test'};return r.fulfill({json:u.pathname.endsWith('/refresh')?{accessToken:'synthetic',user}:u.pathname.endsWith('/me')?{user,growth:{points:1000},access:{total:1,today:true},premium:{active:false}}:{items:[],notes:[],archived:[],days:[],total:0,page:1,pages:1,entries:[]}});}if(u.hostname!=='islands.test')return r.abort();const f=path.join(root,u.pathname==='/'?'index.html':u.pathname);return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});});return p;
}
async function ready(p){await p.locator('[data-english-harbor]').waitFor();await p.locator('.harbor-chart>img').evaluate(n=>n.decode());await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(180);}
(async()=>{const results=[],errors=[];
for(const [name,type] of [['chrome',chromium],['webkit',webkit]]){
 const browser=await type.launch(name==='chrome'?{channel:'chrome'}:{});
 try{for(const [width,height] of [[320,740],[390,844],[700,900],[844,390],[1440,1000]]){
  const p=await setup(browser,width,height);p.on('pageerror',e=>errors.push(e.message));await p.goto('https://islands.test/#toeic/map');await ready(p);
  const boxes=await p.locator('.english-landmark').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect(),s=n.querySelector('.harbor-sign').getBoundingClientRect(),m=n.closest('nav').getBoundingClientRect();return{key:n.dataset.toeicView,x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height,inside:r.x>=m.x&&r.right<=m.right+1&&r.y>=m.y&&r.bottom<=m.bottom+1,signInside:s.x>=m.x&&s.right<=m.right+1&&s.y>=m.y&&s.bottom<=m.bottom+1,hit:n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};}));
  assert.equal(boxes.length,4);for(const b of boxes)assert(b.w>=44&&b.h>=44&&b.inside&&b.signInside&&b.hit,JSON.stringify({width,height,b}));
  for(let i=0;i<4;i++){const button=p.getByRole('button',{name:nativeNames[i],exact:true});assert.equal(await button.count(),1);assert.equal(await button.getAttribute('data-toeic-view'),['notebook','wrongnotes','grammar','player'][i]);const hint=await button.locator('.english-place').getAttribute('id');assert((await button.getAttribute('aria-describedby')).split(/\s+/).includes(hint));}
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)assert(!(boxes[i].x<boxes[j].right&&boxes[j].x<boxes[i].right&&boxes[i].y<boxes[j].bottom&&boxes[j].y<boxes[i].bottom),'overlapping menu buildings');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const longLabel=p.locator('.english-landmark .harbor-sign>strong').first(),originalLabel=await longLabel.innerText();await longLabel.evaluate(n=>n.textContent='조금 더 긴 학습 지도 이름');await p.waitForFunction(()=>{const sign=document.querySelector('.english-landmark .harbor-sign'),s=sign.getBoundingClientRect(),m=sign.closest('nav').getBoundingClientRect();return s.left>=m.left&&s.right<=m.right+1&&sign.scrollWidth<=sign.clientWidth+1;});await longLabel.evaluate((n,text)=>n.textContent=text,originalLabel);await p.waitForTimeout(60);
  assert.equal(await p.locator('.harbor-chart').evaluate(n=>getComputedStyle(n).transform),'none');
  await p.screenshot({path:path.join(out,`${name}-${width}x${height}.png`),fullPage:true});
  // Each original native button still navigates, and browser Back remounts once.
  for(let i=0;i<4;i++){
   const button=p.locator('.english-landmark').nth(i);if(i===0){await button.focus();await p.keyboard.press(name==='webkit'?'Alt+Tab':'Tab');assert.equal(await p.locator('.english-landmark').nth(1).evaluate(n=>n===document.activeElement),true);await button.focus();assert.notEqual(await button.evaluate(n=>getComputedStyle(n).outlineStyle),'none');await p.keyboard.press('Enter');}else if(width<700)await button.tap();else await button.click();
   await p.waitForFunction(h=>location.hash===h,routes[i]);await p.goBack();await ready(p);
  }
  assert.equal(await p.evaluate(()=>localStorage.getItem('english-qa-progress')),'retained');
  await p.evaluate(()=>{HanqWorldScene.sync();HanqWorldScene.sync();});assert.equal(await p.locator('.harbor-chart').count(),1);
  // Real source must switch to wide in landscape and portrait in tall windows.
  assert.equal(await p.locator('.harbor-chart>img').evaluate(n=>n.currentSrc.includes('mobile')),width<=700&&height>width);
  await p.locator('.living-water-ready').waitFor();const chart=p.locator('.harbor-chart');await p.waitForTimeout(200);const paused=await chart.getAttribute('data-water-frames');await p.waitForTimeout(200);assert.equal(await chart.getAttribute('data-water-frames'),paused);
  await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForTimeout(650);assert(Number(await chart.getAttribute('data-water-frames'))>Number(paused));
  const stable=await p.locator('.english-landmark').first().boundingBox();await p.mouse.move(20,20);await p.mouse.move(width-20,height/2);await p.waitForTimeout(100);assert.deepEqual(await p.locator('.english-landmark').first().boundingBox(),stable);
  await p.evaluate(()=>location.hash='#history');await p.locator('[data-harbor-island=history]').waitFor();assert.equal(await p.locator('.english-landmark').count(),0);assert.equal(await p.locator('[data-english-harbor]').count(),0);
  results.push({engine:name,width,height,menus:boxes,originalRoutes:true,back:true,reducedMotion:true,waterMoves:true,stableScene:true,historyIsolated:true});await p.close();
 }}finally{await browser.close();}
}
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:true,results,errors,network:'Local files and synthetic API only'},null,2));console.log(JSON.stringify({passed:true,cases:results.length,errors}));
})().catch(e=>{console.error(e);process.exitCode=1;});
