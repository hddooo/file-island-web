'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const {convert}=require('./build-joseon-script.cjs');
let browser;
const candidate=process.argv[5];if(candidate&&!/^http:\/\/127\.0\.0\.1:\d+$/.test(candidate))throw Error('Isolated loopback candidate only');
(async()=>{
 const root=path.resolve(__dirname,'..'),bundle=convert(fs.readFileSync(process.argv[2])),images=path.resolve(process.argv[3]),out=path.resolve(process.argv[4]);fs.mkdirSync(out,{recursive:true});
 browser=await chromium.launch({headless:true});const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),calls=[],errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(b=>{localStorage.setItem('hanqacct:signedIn','1');window.qaTransport={ready:true,sourceSha256:b.source.sha256,loadBundle:async()=>b,loadFigure:n=>fetch('/_qa/private/'+n).then(r=>r.blob())};},bundle);
 await p.route('**/*',async r=>{
   const u=new URL(r.request().url());if(u.pathname.startsWith('/api/v1/')){
     calls.push({path:u.pathname,method:r.request().method()});if(candidate&&u.pathname.startsWith('/api/v1/textbook/scripts/')){const response=await r.fetch({url:candidate+u.pathname});return r.fulfill({response});}const user={id:'joseon-route-synthetic',displayName:'합성 계정'};
     if(u.pathname.endsWith('/refresh'))return r.fulfill({json:{accessToken:candidate?'synthetic-joseon-session-123456789':'synthetic-joseon-route',user}});
     if(u.pathname.endsWith('/me'))return r.fulfill({json:{user,growth:{points:0},access:{total:1,today:true},premium:{active:false}}});
     if(u.pathname.includes('/textbook/'))return r.fulfill({status:503,json:{error:{code:'textbook_not_configured'}}});
     return r.fulfill({json:{items:[],notes:[],days:[],entries:[],total:0,page:1,pages:1}});
   }
   if(u.hostname!=='joseon-app.test')return r.abort();
   if(u.pathname==='/media/joseon-script-transport.js')return r.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,'media/joseon-script-transport.js'),'utf8')+(candidate?'':'\nHanqJoseonScriptTransport.fromDocument=()=>window.qaTransport;')});
   if(u.pathname.startsWith('/_qa/private/')){const name=u.pathname.split('/').pop();if(!bundle.figures.includes(name))return r.fulfill({status:404});return r.fulfill({path:path.join(images,name)});}
   const file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return r.fulfill({status:404,body:''});return r.fulfill({path:file});
 });
 for(const [era,initial] of [['joseon','early'],['joseon-early','early'],['joseon-late','late']]){await p.goto('https://joseon-app.test/#chapter/'+era+'/webtoon');await p.locator('.joseon-script-reader').waitFor();await p.waitForFunction(t=>document.querySelector('[data-topic="'+t+'"]')?.getAttribute('aria-current')==='true',initial);const other=initial==='early'?'late':'early';await p.click('[data-topic="'+other+'"]');await p.goBack();await p.waitForFunction(t=>document.querySelector('[data-topic="'+t+'"]')?.getAttribute('aria-current')==='true',initial);await p.locator('#moduleHome').click();await p.waitForFunction(()=>!document.querySelector('.joseon-script-reader'));}
 await p.goto('https://joseon-app.test/#chapter/joseon/webtoon');await p.locator('.joseon-script-reader').waitFor({timeout:30000});
 const style=await p.locator('.joseon-script-reader').evaluate(el=>({background:getComputedStyle(el).backgroundColor,font:getComputedStyle(el).fontFamily,size:getComputedStyle(el).fontSize}));assert.equal(style.background,'rgb(247, 244, 237)');assert.equal(style.size,'18px');assert(!style.font.includes('FileIslandMenu'));assert.equal(await p.locator('#privateTextbook').count(),0);assert.equal(await p.locator('.joseon-script-reader').count(),1);
 await p.click('[data-topic="late"]');await p.goBack();await p.waitForFunction(()=>document.querySelector('[data-topic="early"]')?.getAttribute('aria-current')==='true');
 await p.locator('figure button').first().scrollIntoViewIfNeeded();await p.locator('figure img').first().waitFor({state:'attached'});await p.locator('figure button').first().scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('figure img')?.naturalWidth>0);await p.locator('figure button').first().click();await p.goBack();await p.waitForSelector('dialog',{state:'detached'});assert.equal(await p.locator('.joseon-script-reader').count(),1);
 await p.locator('#joseonScript > a').click();await p.waitForFunction(()=>location.hash==='#chapter/joseon/bookquiz');await p.locator('#privateTextbook').waitFor();assert.equal(await p.locator('.joseon-script-reader').count(),0);assert.equal(await p.evaluate(()=>new URL(location.href).searchParams.has('textbookSource')),false);
 await p.goBack();await p.locator('.joseon-script-reader').waitFor();await p.screenshot({path:path.join(out,'actual-index-390.png')});
 await p.locator('#moduleHome').click();await p.waitForFunction(()=>!document.querySelector('.joseon-script-reader'));assert.equal(await p.locator('.jsr-image-dialog').count(),0);
 await p.goto('https://joseon-app.test/#chapter/joseon/webtoon');await p.locator('.joseon-script-reader').waitFor();await p.evaluate(()=>HanqApi.logout());await p.waitForFunction(()=>!document.querySelector('.joseon-script-reader'));assert.equal(await p.locator('.jsr-image-dialog').count(),0);
 assert(!calls.some(c=>c.path.includes('/textbook/')&&c.method!=='GET'));assert(!calls.some(c=>c.path.includes('/textbook/revisions/')));
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({scope:candidate?'actual index/router/adapter + isolated real API controller; synthetic session':'actual index/router; synthetic session/transport',calls,errors},null,2));await browser.close();console.log('Actual index: source mount, topic Back, modal Back, explicit legacy quiz navigation, return and route teardown passed; no textbook writes');
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
