'use strict';
// All requests are fulfilled from this checkout or synthetic API data.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'evidence/header-cloud');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'});
 const results=[];
 try{
  for(const [width,height] of [[320,740],[390,844],[844,390],[1440,1000]]){
   const p=await browser.newPage({viewport:{width,height}}),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.addInitScript(()=>localStorage.setItem('hanqacct:signedIn','1'));
   await p.route('**/*',r=>{
    const u=new URL(r.request().url());
    if(u.pathname.startsWith('/api/v1/')){
     const user={id:'synthetic-header',displayName:'검수'};
     return r.fulfill({json:u.pathname.endsWith('/refresh')?{accessToken:'synthetic',user}:u.pathname.endsWith('/me')?{user,growth:{points:1000},access:{total:1,today:true},premium:{active:false}}:{items:[],notes:[],archived:[],days:[],total:0,page:1,pages:1,entries:[]}});
    }
    if(u.hostname!=='islands.test')return r.abort();
    const f=path.join(root,u.pathname==='/'?'index.html':u.pathname);
    return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});
   });
   for(const route of ['#toeic/map','#subjects']){
    await p.goto('https://islands.test/'+route);
    await p.locator(route.includes('toeic')?'[data-english-harbor]':'.world-map').waitFor();
    await p.waitForTimeout(500); await p.evaluate(()=>document.fonts.ready);
    const g=await p.evaluate(()=>{
     const h=document.querySelector('.device-crown'),c=document.querySelector('.device-content'),a=document.querySelector('#app'),hr=h.getBoundingClientRect(),cr=c.getBoundingClientRect(),ar=a.getBoundingClientRect(),hs=getComputedStyle(h),as=getComputedStyle(a);
     return{gap:cr.top-hr.bottom,radius:hs.borderTopLeftRadius,padding:as.paddingLeft,header:[hr.left,hr.right],inner:[ar.left+parseFloat(as.borderLeftWidth),ar.right-parseFloat(as.borderRightWidth)],overflow:document.documentElement.scrollWidth>innerWidth+1};
    });
    assert.equal(g.radius,'0px','one hardware clip only');assert.equal(g.padding,'0px');
    assert(Math.abs(g.gap)<1,'header directly joins the scene');assert(Math.abs(g.header[0]-g.inner[0])<1&&Math.abs(g.header[1]-g.inner[1])<1,'no empty side inset');
    assert(!g.overflow,'no horizontal overflow');
    if(route.includes('toeic')){
     const cloud=p.locator('[data-english-harbor] .scene-cloud-near');
     await p.waitForFunction(()=>getComputedStyle(document.querySelector('[data-english-harbor] .scene-cloud-near')).animationPlayState==='running');
     const a=await cloud.evaluate(n=>getComputedStyle(n).transform);
     await p.waitForTimeout(220);
     const b=await cloud.evaluate(n=>getComputedStyle(n).transform);
     assert.notEqual(a,b,'cloud actually moves over time');
     await p.evaluate(()=>document.documentElement.classList.add('world-motion-paused'));
     assert.equal(await cloud.evaluate(n=>getComputedStyle(n).animationPlayState),'paused');
     await p.evaluate(()=>document.documentElement.classList.remove('world-motion-paused'));
     await p.emulateMedia({reducedMotion:'reduce'});
     assert.equal(await cloud.evaluate(n=>getComputedStyle(n).animationName),'none');
     assert.equal(await cloud.evaluate(n=>getComputedStyle(n).display),'none');
     await p.emulateMedia({reducedMotion:'no-preference'});
    }
    await p.screenshot({path:path.join(out,width+'-'+(route.includes('toeic')?'english':'world')+'.png')});
    if(route.includes('toeic')){
     const home=p.getByRole('button',{name:'FILE ISLAND · 전체 지도로 이동',exact:true});
     assert.equal(await home.count(),1);
     await p.evaluate(()=>{Object.assign(window.HanqSemanticLibrary||(window.HanqSemanticLibrary={stop:function(){}}),{hasUnsaved:()=>true,prepareLeave:()=>Promise.reject(new Error('synthetic cancelled leave'))});});
     await home.click();await p.waitForTimeout(50);
     assert(p.url().endsWith('#toeic/map'),'cancelled save/leave stays on current page');
     await p.evaluate(()=>{window.__leaveCalls=0;Object.assign(window.HanqSemanticLibrary,{hasUnsaved:()=>true,prepareLeave:()=>{window.__leaveCalls++;window.HanqSemanticLibrary.hasUnsaved=()=>false;return new Promise(resolve=>setTimeout(resolve,20));}});});
     await home.focus();await p.keyboard.press('Enter');
     await p.locator('.world-map').waitFor({timeout:5000}).catch(async e=>{console.error(await p.evaluate(()=>({hash:location.hash,text:document.body.innerText.slice(0,200),calls:window.__leaveCalls})),errors);throw e;});
     assert.equal(await p.evaluate(()=>window.__leaveCalls),1,'home uses existing unsaved guard once');
    }
    results.push({width,height,route,geometry:g});
   }
   assert.deepEqual(errors,[]);await p.close();
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log('PASS '+results.length+' header seam/viewport cases; cloud movement, pause and reduced motion.');
})().catch(e=>{console.error(e.stack);process.exitCode=1});
