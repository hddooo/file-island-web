'use strict';
// Local-only private-source QA; never serves a private directory or touches a browser profile.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {convert}=require('./build-joseon-script.cjs');
let qaBrowser;
(async()=>{
  const input=process.argv[2],images=process.argv[3],out=process.argv[4];
  if(!input||!images||!out)throw Error('Pass private Markdown, image directory and evidence directory');
  fs.mkdirSync(out,{recursive:true});const bundle=convert(fs.readFileSync(input));
  const browser=await chromium.launch({headless:true,channel:process.env.JOSEON_BROWSER_CHANNEL,timeout:20000});
  qaBrowser=browser;const context=await browser.newContext({reducedMotion:'reduce'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://joseon-qa.invalid/**',route=>{
    const name=new URL(route.request().url()).pathname.slice(1);
    if(bundle.figures.includes(name))return route.fulfill({contentType:'image/png',body:fs.readFileSync(path.join(images,name))});
    return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Private Joseon QA</title><style>body{margin:0}</style><div id="host"></div></html>'});
  });
  await page.goto('https://joseon-qa.invalid/');
  await page.addStyleTag({path:path.resolve(__dirname,'../media/joseon-script-reader.css')});
  await page.addScriptTag({path:path.resolve(__dirname,'../media/joseon-script-reader.js')});
  await page.evaluate(b=>{window.qaBundle=b;window.reader=HanqJoseonScriptReader.mount(document.querySelector('#host'),b,{loadFigure:n=>fetch('/'+n).then(r=>r.blob())});},bundle);
  let cases=0;
  for(const width of [320,390,1440]){
    await page.setViewportSize({width,height:900});
    for(const topic of ['early','late','society','culture']){
      await page.click('[data-topic="'+topic+'"]');
      await page.waitForFunction(()=>!Array.from(document.querySelectorAll('.jsr-image-status')).some(e=>e.textContent.includes('불러오는 중')));
      await page.evaluate(async()=>{await Promise.all(Array.from(document.querySelectorAll('figure img')).map(i=>{i.loading='eager';return i.decode();}));});
      const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,font:getComputedStyle(document.querySelector('.joseon-script-reader')).fontSize,answer:document.querySelector('.jsr-body').textContent.includes('원문 인쇄 정답'),badImages:Array.from(document.querySelectorAll('figure img')).filter(i=>Math.abs(i.getBoundingClientRect().width/i.getBoundingClientRect().height-i.naturalWidth/i.naturalHeight)>.02).length}));
      assert(metrics.scroll<=width+1,JSON.stringify(metrics));assert.equal(metrics.font,'18px');assert(!metrics.answer);assert.equal(metrics.badImages,0);cases++;
      await page.screenshot({path:path.join(out,`${width}-${topic}.png`)});
      if(topic==='society'){
        const nested=page.locator('.jsr-body li > ul').first();await nested.scrollIntoViewIfNeeded();
        assert(await nested.evaluate(e=>e.firstElementChild.getBoundingClientRect().left>e.parentElement.getBoundingClientRect().left));
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        await page.screenshot({path:path.join(out,`${width}-nested-source.png`)});
      }
    }
  }
  await page.setViewportSize({width:390,height:844});await page.click('[data-topic="early"]');await page.waitForSelector('figure img');
  await page.locator('figure button').first().click();await page.waitForSelector('dialog[open]');await page.getByRole('button',{name:'원래 크기로 확대'}).click();assert.equal(await page.locator('dialog img').evaluate(i=>getComputedStyle(i).maxWidth),'none');
  await page.goBack();await page.waitForSelector('dialog',{state:'detached'});
  await page.locator('figure button').first().click();await page.keyboard.press('Escape');await page.waitForSelector('dialog',{state:'detached'});
  await page.click('[data-topic="late"]');await page.goBack();await page.waitForFunction(()=>document.querySelector('[data-topic="early"]').getAttribute('aria-current')==='true');
  await page.click('[data-mode="practice"]');assert.equal(await page.locator('.jsr-source-card[data-kind=answers]').count(),0);
  await page.click('[data-mode="answers"]');assert.equal(await page.locator('.jsr-source-card').count(),0);await page.getByRole('button',{name:'인쇄 정답 펼치기'}).click();assert.equal(await page.locator('.jsr-source-card').count(),3);
  await page.click('[data-topic="culture"]');await page.click('[data-mode="answers"]');assert.equal(await page.locator('.jsr-source-card').count(),0);
  await page.evaluate(()=>{reader.stop();window.reader=HanqJoseonScriptReader.mount(document.querySelector('#host'),qaBundle);});assert.equal(await page.locator('.jsr-source-card').count(),0);
  await page.addScriptTag({path:path.resolve(__dirname,'../media/ui-locks.js')});
  await page.addScriptTag({path:path.resolve(__dirname,'../media/joseon-script-session.js')});
  await page.evaluate(async()=>{
    reader.stop();history.replaceState({},'');window.auth={signedIn:true,ownerId:'synthetic-browser',epoch:1};
    const host=document.querySelector('#host');window.coordinator=HanqJoseonScriptSession.create({document,appRoot:host,uiLocks:HanqUiLocks,api:{state:()=>auth,onChange:fn=>{window.authChanged=fn;return()=>{window.authChanged=null;};}}});
    window.routerCalls=0;window.addEventListener('popstate',()=>{if(!coordinator.handlePopState())routerCalls++;});
    await coordinator.mount(host,{ready:true,sourceSha256:qaBundle.source.sha256,loadBundle:async()=>qaBundle,loadFigure:n=>fetch('/'+n).then(r=>r.blob())});
  });
  await page.waitForSelector('figure img');await page.locator('figure button').first().click();assert(await page.locator('#host').evaluate(e=>e.inert));
  await page.goBack();await page.waitForSelector('dialog',{state:'detached'});assert.equal(await page.evaluate(()=>routerCalls),0);assert.equal(await page.locator('#host').evaluate(e=>e.inert),false);
  await page.locator('figure button').first().click();await page.evaluate(()=>{window.otherLock=HanqUiLocks.acquire(document.querySelector('#host'));auth={signedIn:false,epoch:2};authChanged();});
  assert.equal(await page.locator('dialog').count(),0);assert.equal(await page.locator('#host').textContent(),'');assert(await page.locator('#host').evaluate(e=>e.inert));await page.evaluate(()=>otherLock());assert.equal(await page.locator('#host').evaluate(e=>e.inert),false);
  assert.deepEqual(errors,[]);await browser.close();fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({cases,engine:'isolated headless Chromium',widths:[320,390,1440],reducedMotion:true,images:38,errors},null,2));console.log('Passed '+cases+' private-source layouts, image ratio/zoom/close/back, answer concealment and repeat entry');
})().catch(async e=>{console.error(e);if(qaBrowser)await qaBrowser.close();process.exitCode=1;});
