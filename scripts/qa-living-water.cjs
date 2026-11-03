/* Full app, synthetic account, local files only. No production writes. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.HANQ_PLAYWRIGHT||'../.test-tools/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.HANQ_QA_OUTPUT||'../evidence/living-water');fs.mkdirSync(out,{recursive:true});
async function setup(browser,width,height,motion='no-preference',economy=false){
 const p=await browser.newPage({viewport:{width,height},reducedMotion:motion,hasTouch:width<700});
 await p.addInitScript(economy=>{localStorage.setItem('hanqacct:signedIn','1');if(economy)Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>2});},economy);
 await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.pathname.startsWith('/api/v1/')){const user={id:'scene-qa',displayName:'탐험가',email:'fixture@example.test'};return r.fulfill({json:u.pathname.endsWith('/refresh')?{accessToken:'synthetic',user}:u.pathname.endsWith('/me')?{user,growth:{points:1000},access:{total:1,today:true},premium:{active:false}}:{items:[],notes:[],archived:[],days:[],total:0,page:1,pages:1,entries:[]}});}if(u.hostname!=='islands.test')return r.abort();const f=path.join(root,u.pathname==='/'?'index.html':u.pathname);return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});});return p;
}
(async()=>{const engine=process.env.HANQ_SCENE_ENGINE||'chrome',browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{}:{channel:'chrome'}),results=[],errors=[];
try{for(const [width,height] of [[1440,1000],[390,844],[320,740],[844,390]])for(const kind of ['history','toeic']){
 const p=await setup(browser,width,height);p.on('pageerror',e=>errors.push(e.message));
 await p.goto('https://islands.test/'+(kind==='history'?'#history':'#toeic/map'));await p.locator('.living-water-ready').waitFor();await p.waitForTimeout(300);
 const chart=p.locator('.harbor-chart'),shot=p.locator('.island-harbors'),prefix=kind+'-'+width;
 assert.equal(await chart.locator('.living-boat').count(),kind==='history'?1:width<=700?1:2);
 const state=()=>chart.evaluate(n=>({frames:+n.dataset.waterFrames,mode:n.dataset.waterMotion,buffer:n.dataset.waterBuffer,transforms:Array.from(n.querySelectorAll('.living-boat'),b=>getComputedStyle(b).transform),chartTransform:getComputedStyle(n).transform}));
 const before=await state();await shot.screenshot({path:path.join(out,prefix+'-t0.png')});
 const a=await chart.locator('.living-water-surface').evaluate(c=>{const gl=c.getContext('webgl');gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return c.toDataURL().split(',')[1];});fs.writeFileSync(path.join(out,prefix+'-surface0.png'),Buffer.from(a,'base64'));
 await p.waitForTimeout(900);const after=await state();assert(after.frames>before.frames+3);assert.notDeepEqual(before.transforms,after.transforms);assert.equal(after.chartTransform,'none');
 const b=await chart.locator('.living-water-surface').evaluate(c=>{const gl=c.getContext('webgl');gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return c.toDataURL().split(',')[1];});fs.writeFileSync(path.join(out,prefix+'-surface1.png'),Buffer.from(b,'base64'));await shot.screenshot({path:path.join(out,prefix+'-t1.png')});
 // A short sequential frame set is a reviewable motion artifact, not a timer assertion.
 if(width===390||width===1440){for(let i=0;i<12;i++){await shot.screenshot({path:path.join(out,prefix+'-frame'+String(i).padStart(2,'0')+'.png')});await p.waitForTimeout(150);}}
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(400);const reduced=await state();await p.waitForTimeout(500);assert.equal((await state()).frames,reduced.frames);
 await p.screenshot({path:path.join(out,prefix+'-reduced.png')});
 await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForTimeout(200);assert((await state()).frames>reduced.frames);
 await chart.evaluate(n=>{n.style.visibility='hidden';n.style.display='none';});await p.waitForTimeout(150);const off=(await state()).frames;await p.waitForTimeout(350);assert.equal((await state()).frames,off);
 results.push({kind,width,height,before,after,reducedMotionPaused:true,offscreenPaused:true});await p.close();
 }
 const p=await setup(browser,390,844,'no-preference',true);await p.goto('https://islands.test/#toeic/map');await p.locator('.living-water-ready').waitFor();await p.waitForTimeout(200);const low=await p.locator('.harbor-chart').evaluate(n=>({mode:n.dataset.waterMotion,frames:+n.dataset.waterFrames,buffer:n.dataset.waterBuffer}));await p.waitForTimeout(700);assert.equal(low.mode,'economy');assert(await p.locator('.harbor-chart').evaluate((n,f)=>+n.dataset.waterFrames>f,low.frames));results.push({economy:low});await p.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:true,engine,results,errors,network:'All local files/synthetic APIs; no production requests'},null,2));console.log(JSON.stringify({passed:true,engine,cases:results.length,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
