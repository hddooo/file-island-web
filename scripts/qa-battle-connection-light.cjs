// Whole-app ice-island light: synthetic API only; the real island code receives stream events through a wrapped HanqApi.battleStream.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),pw=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,'../evidence/connection-light'),origin='http://127.0.0.1:8791',owner='11111111-1111-4111-8111-111111111111';
(async()=>{fs.mkdirSync(out,{recursive:true});const results=[];
 for(const engine of (process.env.QA_ENGINE?[process.env.QA_ENGINE]:['chromium','webkit'])){const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome'}:{});
  try{for(const width of (process.env.QA_WIDTH?[Number(process.env.QA_WIDTH)]:[320,390,1440]))for(const motion of ['no-preference','reduce']){
   const touch=width<700,p=await browser.newPage({viewport:{width,height:touch?(width===320?568:844):900},isMobile:touch&&engine==='chromium',hasTouch:touch,reducedMotion:motion}),errors=[];let external=0;
   p.on('pageerror',e=>errors.push(e.message));
   await p.addInitScript(()=>{localStorage.setItem('hanqacct:signedIn','1');localStorage.setItem('hanq:display-mode:v1','terminal');let api;
    Object.defineProperty(window,'HanqApi',{configurable:true,get:()=>api,set(v){api=v;const real=v&&v.battleStream;if(!real)return;v.battleStream=(cb,fail)=>{window.__emit=cb;window.__fail=fail;window.__opens=(window.__opens||0)+1;return()=>{};};}});});
   await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin){external++;return r.fulfill({status:503,body:''});}const q=u.pathname,j=x=>r.fulfill({json:x});
    if(q==='/api/v1/auth/refresh')return j({accessToken:'t',accessTokenExpiresAt:new Date(Date.now()+6e5).toISOString(),user:{id:owner,displayName:'얼음 탐험가'}});
    if(q==='/api/v1/me')return j({user:{id:owner,displayName:'얼음 탐험가'},premium:{active:true},growth:{points:1000},access:{total:1,today:true,freeSlots:[]}});
    if(q.startsWith('/api/v1/battle'))return j({serverNow:Date.now(),participants:[],matchId:null,items:[]});
    if(q.startsWith('/api/'))return j({items:[],notes:[],progress:[],available:false});
    const f=path.join(root,q==='/'?'index.html':decodeURIComponent(q));return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});});
   await p.goto(origin+'/#battle');await p.locator('.bi-connection').waitFor();await p.waitForFunction(()=>window.__emit);
   const stem=`${engine}-${width}-${motion}`,row={engine,width,motion};
   const check=async state=>{await p.waitForFunction(s=>document.querySelector('.bi-connection').dataset.state===s,state);
    const btn=p.locator('.bi-connection-toggle');if(touch)await btn.tap();else await btn.hover();await p.waitForTimeout(motion==='reduce'?80:600);
    const g=await p.evaluate(()=>{const b=document.querySelector('.bi-connection-toggle').getBoundingClientRect(),t=document.querySelector('.bi-connection-detail'),r=t.getBoundingClientRect(),h=document.querySelector('.bi-heading h1').getBoundingClientRect();return{visible:getComputedStyle(t).visibility==='visible',inView:r.left>=0&&r.right<=innerWidth&&(()=>{const c=t.closest('.device-content'),k=c?c.getBoundingClientRect():{top:0,bottom:innerHeight};return r.top>=k.top-1&&r.bottom<=k.bottom+1;})(),rect:[r.left,r.top,r.right,r.bottom].map(Math.round),vw:innerWidth,clip:(()=>{const c=t.closest('.device-content');if(!c)return null;const k=c.getBoundingClientRect();return [k.top,k.bottom].map(Math.round);})(),btnBg:getComputedStyle(document.querySelector('.bi-connection-toggle')).backgroundColor,target:[b.width,b.height],eyebrowAbove:document.querySelector('.bi-heading>small').getBoundingClientRect().bottom<=h.top+1,besideTitle:Math.abs((b.top+b.bottom)/2-(h.top+h.bottom)/2)<16&&b.left>=h.right-2,overflow:document.documentElement.scrollWidth>innerWidth,notice:document.querySelector('.bi-notice').hidden?'':document.querySelector('.bi-notice').textContent};});
    assert(g.visible,stem+' '+state+' explanation shown');assert(g.inView,stem+' '+state+' explanation inside viewport '+JSON.stringify(g));assert(g.target[0]>=44&&g.target[1]>=44);assert(g.besideTitle,stem+' beside title');assert(g.eyebrowAbove,stem+' eyebrow keeps its own line');assert(!g.overflow);
    await p.screenshot({path:path.join(out,`${stem}-${state}.png`)});
    if(touch){await btn.tap();}else{await p.mouse.move(0,0);}return g;};
   const connecting=await check('connecting');assert.equal(connecting.notice,'','no connecting notice');
   await p.evaluate(()=>window.__emit('waiting',{}));const connected=await check('connected');assert.equal(connected.notice,'','no connected notice');
   // Keyboard focus shows the same explanation.
   await p.locator('.bi-connection-toggle').focus();assert.equal(await p.evaluate(()=>getComputedStyle(document.querySelector('.bi-connection-detail')).visibility),'visible');await p.keyboard.press('Escape');await p.locator('.bi-connection-toggle').blur();
   await p.evaluate(()=>window.__fail({status:0,code:'network'}));await check('connecting');
   await p.waitForFunction(()=>window.__opens>=2,null,{timeout:5000});await p.evaluate(()=>window.__fail({status:400,code:'stream_rejected'}));
   const lost=await check('disconnected');assert(lost.notice.includes('연결이 끊겼어요'),'disconnect notice kept');assert(await p.getByRole('button',{name:'다시 연결'}).isVisible(),'retry kept');
   assert.deepEqual(errors,[]);assert.equal(external,0);results.push({...row,passed:true,disconnectNotice:lost.notice});console.log(stem,'PASS');await p.close();
  }}finally{await browser.close();}}
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,realIphone:false,results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
