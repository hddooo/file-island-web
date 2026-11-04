/* Reviewed scene cels + full-app navigation. Synthetic accounts, local files only. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.HANQ_PLAYWRIGHT||'../.test-tools/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.HANQ_QA_OUTPUT||'evidence/english-residents');fs.mkdirSync(out,{recursive:true});
async function page(browser,width,height,fail=false,record=false,lowPower=false){
 const p=await browser.newPage({viewport:{width,height},reducedMotion:'no-preference',hasTouch:width<700,recordVideo:record?{dir:out,size:{width,height}}:undefined});
 await p.addInitScript(low=>{if(low)Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>2});localStorage.setItem('hanqacct:signedIn','1');localStorage.setItem('resident-qa-record','preserved');if(sessionStorage.getItem('hanq:english-resident-motion')===null)sessionStorage.setItem('hanq:english-resident-motion','off');if(sessionStorage.getItem('hanq:scene-motion')===null)sessionStorage.setItem('hanq:scene-motion','on');},lowPower);
 let failing=fail;
 await p.route('**/*',r=>{const u=new URL(r.request().url());if(failing&&u.pathname.endsWith('/agumon-idle-sprite.png'))return r.abort();if(u.pathname.startsWith('/api/v1/')){const user={id:'resident-qa',displayName:'검수',email:'fixture@example.test'};return r.fulfill({json:u.pathname.endsWith('/refresh')?{accessToken:'synthetic',user}:u.pathname.endsWith('/me')?{user,growth:{points:1000},access:{total:1,today:true},premium:{active:false}}:{items:[],notes:[],archived:[],days:[],total:0,page:1,pages:1,entries:[]}});}if(u.hostname!=='islands.test')return r.abort();const f=path.join(root,u.pathname==='/'?'index.html':u.pathname);return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});});
 p.recover=()=>{failing=false;};return p;
}
async function ready(p){await p.locator('.english-residents .er-agumon.er-ready').waitFor();await p.locator('.english-residents .er-koromon.er-ready').waitFor();await p.locator('.english-residents .er-patamon .cm-life.cm-ready').waitFor();await p.waitForFunction(()=>document.querySelector('.english-residents').dataset.motion==='active');await p.locator('.harbor-chart.living-water-ready').waitFor();await p.evaluate(()=>document.fonts.ready);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
// Pause checks compare path offsets independently of the responsive percent anchor.
async function positions(p){return p.locator('.english-residents :is(.er-sprite,.cm-patamon-frames)').evaluateAll(async ns=>{await Promise.all(ns.flatMap(n=>n.getAnimations().map(a=>a.ready)));return ns.map(n=>({frame:getComputedStyle(n).backgroundPosition,transform:getComputedStyle(n).transform,actorMotion:(()=>{const c=getComputedStyle(n.closest('.er-actor')),m=new DOMMatrixReadOnly(c.transform);return{x:+(m.e+parseFloat(c.width)/2).toFixed(2),y:+(m.f+parseFloat(c.height)).toFixed(2),facing:m.a};})(),actorAnimations:n.closest('.er-actor').getAnimations().map(a=>({time:a.currentTime,state:a.playState})),gaitTransform:n.closest('.er-gait')?getComputedStyle(n.closest('.er-gait')).transform:null,animations:n.getAnimations().map(a=>({time:a.currentTime,state:a.playState,name:a.animationName}))}));});}
async function roamingProof(p,width,height){
 const result=await p.locator('.english-residents').evaluate(async layer=>{
  const actors=[...layer.querySelectorAll('.er-actor')],chart=layer.closest('.harbor-chart'),map=chart.getBoundingClientRect(),signs=[...layer.closest('nav').querySelectorAll('.english-landmark .harbor-sign')].map(n=>n.getBoundingClientRect());
  const paths=actors.map(n=>{const a=n.getAnimations().find(a=>['er-roam','er-flight'].includes(a.animationName));if(!a)throw Error('Resident path missing');return{n,a,time:a.currentTime,state:a.playState};});
  const samples=[];
  for(const phase of [0,.14,.33,.37,.46,.52,.66,.78,.88,.99]){
   paths.forEach(p=>{p.a.pause();const t=p.a.effect.getTiming();p.a.currentTime=t.delay+t.duration*(1+phase);});
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   for(const p of paths){const r=p.n.getBoundingClientRect();samples.push({phase,actor:p.n.className,width:r.width,ratio:r.width/map.width,x:r.x,y:r.y,inside:r.left>=map.left-1&&r.right<=map.right+1&&r.top>=map.top-1&&r.bottom<=map.bottom+1,signOverlap:signs.reduce((area,s)=>area+Math.max(0,Math.min(r.right,s.right)-Math.max(r.left,s.left))*Math.max(0,Math.min(r.bottom,s.bottom)-Math.max(r.top,s.top)),0)});}
  }
  paths.forEach(p=>{p.a.currentTime=p.time;if(p.state==='running')p.a.play();});
  return{samples};
 });
 fs.writeFileSync(path.join(out,'roaming-'+width+'x'+height+'.json'),JSON.stringify(result,null,2));
 assert(result.samples.every(s=>s.inside),'Resident path must stay within scene: '+JSON.stringify(result));assert(result.samples.every(s=>s.signOverlap<1),'Resident must never cover a menu label: '+JSON.stringify(result));
 if(width<700&&height>width)assert(result.samples.every(s=>s.width<=42&&s.ratio<=.115),'Portrait scale must fit the illustration');
 for(const actor of [...new Set(result.samples.map(s=>s.actor))]){const samples=result.samples.filter(s=>s.actor===actor);assert(Math.max(...samples.map(s=>s.x))-Math.min(...samples.map(s=>s.x))>=5,'Each resident must visibly roam: '+actor+' '+JSON.stringify(samples.map(s=>({phase:s.phase,x:s.x,y:s.y}))));}
 const before=await p.locator('.er-actor').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().toJSON()));
 await p.waitForFunction(before=>[...document.querySelectorAll('.er-actor')].some((n,i)=>{const r=n.getBoundingClientRect();return Math.abs(r.x-before[i].x)+Math.abs(r.y-before[i].y)>.45;}),before);
 return{waypointSamples:result.samples.length,menuLabelsClear:true,insideScene:true,portraitScale:true,actualPositionFramesChanged:true,maxCharacterWidth:Math.max(...result.samples.map(s=>s.width))};
}
async function noControls(p){assert.equal(await p.locator('.english-residents-toggle,.history-evening-toggle,.harbor-motion-toggle').count(),0,'automatic scenery has no motion buttons');}
async function main(){const results=[],errors=[];
for(const [engine,type] of [['chrome',chromium],['webkit',webkit]]){
 const browser=await type.launch(engine==='chrome'?{channel:'chrome'}:{});
 try{for(const [width,height] of [[320,740],[390,844],[844,390],[1440,1000]]){
  const p=await page(browser,width,height);p.on('pageerror',e=>errors.push(e.message));await p.goto('https://islands.test/#toeic/map');await ready(p);
  assert.equal(await p.locator('.english-residents').count(),1);assert.equal(await p.locator('.er-actor').count(),3);
  assert.equal(await p.locator('.english-residents').getAttribute('aria-hidden'),'true');
  const hit=await p.locator('.english-landmark .harbor-sign').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return n.closest('button').contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));assert(hit.every(Boolean));
  const boxes=await p.locator('.er-actor').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect(),m=n.closest('nav').getBoundingClientRect();return{character:n.className,width:r.width,height:r.height,visible:r.right>m.left&&r.left<m.right&&r.bottom>m.top&&r.top<m.bottom,pointer:getComputedStyle(n).pointerEvents};}));assert(boxes.every(b=>b.visible&&b.pointer==='none'));
  const roaming=await roamingProof(p,width,height);const initial=await positions(p),changedFrame=await p.waitForFunction(before=>{const frame=getComputedStyle(document.querySelector('.english-residents .cm-patamon-frames')).backgroundPosition;return frame!==before?frame:null;},initial[2].frame);const later=await positions(p);assert(later.every(v=>v.transform==='none'));assert.notDeepEqual(later.map(v=>v.animations.map(a=>a.time)),initial.map(v=>v.animations.map(a=>a.time)));assert.notEqual(initial[2].frame,await changedFrame.jsonValue(),'real Patamon wing cel changes');
  await p.screenshot({path:path.join(out,`${engine}-${width}x${height}.png`),fullPage:true});
  await noControls(p);assert.equal(await p.evaluate(()=>location.hash),'#toeic/map');
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>matchMedia('(prefers-reduced-motion: reduce)').matches&&document.querySelector('.english-residents').dataset.motion==='reduced');assert.equal(await p.locator('.english-residents').getAttribute('data-motion'),'reduced');await noControls(p);const reduced=await positions(p);await p.waitForTimeout(180);assert.deepEqual(await positions(p),reduced);await p.waitForFunction(()=>document.querySelector('.harbor-chart').dataset.waterMotion==='reduced'&&document.querySelector('.living-water-surface').hidden);const waterFrames=Number(await p.locator('.harbor-chart').getAttribute('data-water-frames'));await p.waitForTimeout(180);assert.equal(Number(await p.locator('.harbor-chart').getAttribute('data-water-frames')),waterFrames);
  await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForFunction(()=>!matchMedia('(prefers-reduced-motion: reduce)').matches&&document.querySelector('.english-residents').dataset.motion==='active');assert.equal(await p.locator('.english-residents').getAttribute('data-motion'),'active');await p.waitForFunction(previous=>Number(document.querySelector('.harbor-chart').dataset.waterFrames)>previous,waterFrames);
  await p.locator('[data-english-harbor]').evaluate(n=>n.style.setProperty('display','none','important'));await p.waitForFunction(()=>document.querySelector('.english-residents').classList.contains('er-paused'));await noControls(p);await p.locator('[data-english-harbor]').evaluate(n=>n.style.removeProperty('display'));await ready(p);await noControls(p);
  // Browser page-transition lifecycle, including a page cache restore. No change
  // to document.hidden or the user's operating-system/browser settings.
  await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await p.waitForTimeout(90);const pageHidden=await positions(p);await p.waitForTimeout(210);assert.deepEqual(await positions(p),pageHidden);await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await ready(p);
  for(const key of ['notebook','wrongnotes','grammar','player']){await p.locator('[data-toeic-view='+key+'] .harbor-sign').click();if(await p.locator('.world-cinematic').count())await p.keyboard.press('Enter');await p.waitForFunction(h=>location.hash===h,'#toeic/'+key);assert.equal(await p.locator('#app .english-residents').count(),0);await p.locator('.english-residents').waitFor({state:'detached'});assert.equal(await p.locator('.english-residents').count(),0);await noControls(p);await p.goBack();await ready(p);await noControls(p);}
  assert.equal(await p.evaluate(()=>localStorage.getItem('resident-qa-record')),'preserved');
  await p.evaluate(()=>location.hash='#history');await p.locator('[data-harbor-island=history]').waitFor();assert.equal(await p.locator('.english-residents,.english-residents-toggle').count(),0);
  results.push({engine,width,height,boxes,roaming,realCels:true,registeredSourceCels:true,menus:true,automaticMotion:true,noMotionButtons:true,reducedMotion:true,offscreen:true,detach:true,recordPreserved:true});await p.close();
 }
 const p=await page(browser,390,844,true);await p.goto('https://islands.test/#toeic/map');await p.locator('.er-koromon.er-ready').waitFor();assert.equal(await p.locator('.er-agumon').evaluate(n=>getComputedStyle(n).visibility),'hidden');const originalMap=await p.locator('[data-english-harbor]').evaluate(n=>(n.dataset.recoveryIdentity='original'));p.recover();await p.evaluate(()=>dispatchEvent(new Event('online')));await ready(p);assert.equal(await p.locator('[data-english-harbor]').getAttribute('data-recovery-identity'),originalMap,'recover within the existing map without navigation');
 await p.evaluate(()=>sessionStorage.setItem('hanq:scene-motion','off'));await p.reload();await ready(p);await noControls(p);await p.waitForFunction(()=>Number(document.querySelector('.harbor-chart').dataset.waterFrames)>2);assert.equal(await p.evaluate(()=>sessionStorage.getItem('hanq:english-resident-motion')),'off');assert.equal(await p.evaluate(()=>sessionStorage.getItem('hanq:scene-motion')),'off');await p.close();results.push({engine,decodeFailureHidden:true,onlineRecoveryWithoutRemount:true,legacyPauseIgnoredAfterReload:true});
 // Two-core devices use the existing short study transition instead of a
 // cinematic. Its inert screenshot clone may outlive the URL change by 520ms.
 const low=await page(browser,390,844,false,false,true);await low.goto('https://islands.test/#toeic/map');await ready(low);await noControls(low);assert(await low.evaluate(()=>HanqWorldScene.isStatic()));await low.locator('[data-toeic-view=notebook] .harbor-sign').click();await low.waitForFunction(()=>location.hash==='#toeic/notebook');assert.equal(await low.locator('#app .english-residents').count(),0);await low.locator('.english-residents').waitFor({state:'detached'});assert.equal(await low.locator('.english-residents').count(),0);await noControls(low);await low.goBack();await ready(low);await noControls(low);await low.close();results.push({engine,lowPower:true,liveControlsDetachedImmediately:true,inertTransitionCleanup:true,back:true});
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:true,results,errors,network:'Local files/synthetic account only'},null,2));console.log(JSON.stringify({passed:true,cases:results.length,errors}));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={page,ready};
