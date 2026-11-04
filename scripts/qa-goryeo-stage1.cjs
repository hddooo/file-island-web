'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');let browser;
(async()=>{
 const root=path.resolve(__dirname,'..'),bundleText=fs.readFileSync(process.argv[2],'utf8'),images=path.resolve(process.argv[3]),out=path.resolve(process.argv[4]),bundle=JSON.parse(bundleText);fs.mkdirSync(out,{recursive:true});
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'}),errors=[],calls=[],metrics=[];page.on('pageerror',e=>errors.push(e.message));let active=0,maxActive=0,failMap=true;
 await page.addInitScript(()=>localStorage.setItem('hanqacct:signedIn','1'));
 await page.route('**/*',async route=>{const u=new URL(route.request().url());
  if(u.hostname!=='goryeo-stage.test')return route.abort();
  if(u.pathname.startsWith('/_qa/private/')){const name=u.pathname.split('/').pop();assert(bundle.figures.includes(name));active++;maxActive=Math.max(maxActive,active);await new Promise(r=>setTimeout(r,40));active--;if(name==='p042-02.png'&&failMap){failMap=false;return route.fulfill({status:503,body:''});}return route.fulfill({contentType:'image/png',headers:{'cache-control':'private, no-store'},body:fs.readFileSync(path.join(images,name))});}
  if(u.pathname.startsWith('/api/v1/')){calls.push({path:u.pathname,method:route.request().method()});const user={id:'synthetic-goryeo-stage',displayName:'합성 계정'};if(u.pathname.endsWith('/refresh'))return route.fulfill({json:{accessToken:'synthetic-stage-session',user}});if(u.pathname.endsWith('/me'))return route.fulfill({json:{user,growth:{points:0},access:{total:1,today:true},premium:{active:false}}});if(u.pathname.includes('/textbook/'))return route.fulfill({status:503,json:{error:{code:'textbook_not_configured'}}});return route.fulfill({json:{items:[],notes:[],days:[],entries:[],total:0,page:1,pages:1}});}
  const f=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile())return route.fulfill({status:404,body:''});return route.fulfill({path:f});
 });
 await page.goto('https://goryeo-stage.test/#chapter/goryeo/webtoon');await page.waitForFunction(()=>window.HanqApi?.state().signedIn&&!HanqApi.state().restoring);await page.locator('#privateTextbook').waitFor();
 await page.addStyleTag({path:path.join(root,'media/goryeo-script-reader.css')});
 for(const name of ['structure-data','presentation-data','structure','reader','session','transport','app'])await page.addScriptTag({path:path.join(root,'media/goryeo-script-'+name+'.js')});
 await page.evaluate(async text=>{
  if(HanqGoryeoScriptApp.available('goryeo',0))throw Error('Gate unexpectedly open');
  HanqSemanticLibrary.stop();const root=document.querySelector('#app');root.replaceChildren();const host=document.createElement('section');host.id='goryeoScript';root.append(host);
  window.testSource=text;window.testTransport=HanqGoryeoScriptTransport.create({goryeoScriptBundle:async()=>text,goryeoScriptFigure:async(s,n,signal)=>{const r=await fetch('/_qa/private/'+n,{signal});if(!r.ok)throw Object.assign(Error('fixture_http'),{status:r.status});return r.blob();}});
  window.testSession=HanqGoryeoScriptSession.create({document,api:HanqApi,appRoot:root,uiLocks:HanqUiLocks,offerLegacyQuiz:true,navigateCanonical:href=>{history.pushState(null,'',href);dispatchEvent(new PopStateEvent('popstate'));}});
  const previousPop=HanqJoseonScriptApp.handlePopState;HanqJoseonScriptApp.handlePopState=e=>testSession.handlePopState(e)||previousPop(e);
  if(!await testSession.mount(host,testTransport))throw Error('Synthetic mount failed');
 },bundleText);
 await page.locator('[data-figure="p042-02.png"] .gsr-image-retry:visible').waitFor();await page.locator('[data-figure="p042-02.png"] .gsr-image-retry').click();await page.waitForFunction(()=>document.querySelectorAll('.goryeo-script-reader figure img').length===2);
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  for(const id of ['table15','table16','exam-early','exam-military']){
   const wrap=page.locator('.gsr-structure-scroll[data-structure="'+id+'"]');await wrap.scrollIntoViewIfNeeded();
   const base=await wrap.evaluate(e=>({client:e.clientWidth,scroll:e.scrollWidth,rows:[...e.querySelectorAll('tr')].map(r=>({height:r.getBoundingClientRect().height,cells:[...r.cells].map(c=>({id:c.id,rowspan:c.rowSpan,colspan:c.colSpan,headers:c.getAttribute('headers'),font:getComputedStyle(c).fontSize}))}))}));
   assert(base.rows.flatMap(r=>r.cells).every(c=>c.font==='18px'));if(width<700&&id!=='table15')assert(base.scroll<=base.client+1,'simple table must wrap');else if(width<1000)assert(base.scroll>base.client);
   const title=page.locator('#gs-'+id+'-title');const titleRect=await title.boundingBox();assert(titleRect.x>=0&&titleRect.x+titleRect.width<=width+1,'caption stays in viewport');
   assert.equal(await page.locator('#gs-'+id+'-hint').isVisible(),base.scroll>base.client+1);
   if(width<700&&id!=='table15'){
    const bands=wrap.locator('tbody [data-cell]');const count=await bands.count();
    for(const [label,n] of [['first',0],['middle',Math.floor(count/2)],['last',count-1]]){
     const band=bands.nth(n);await band.evaluate(e=>e.scrollIntoView({block:'start'}));const rect=await band.boundingBox();metrics.push({width,id,band:label,rect});await page.screenshot({path:path.join(out,width+'-'+id+'-'+label+'-band.png'),animations:'disabled'});
    }
    assert(await wrap.locator('tbody p,tbody li').evaluateAll(es=>es.every(e=>e.scrollWidth<=e.clientWidth+1)),'paragraph reads without horizontal movement');
   }
   for(const [position,fraction] of [['left',0],['middle',.5],['right',1]]){
    await wrap.evaluate((e,f)=>e.scrollLeft=(e.scrollWidth-e.clientWidth)*f,fraction);
    const location=await wrap.evaluate(e=>({scrollLeft:e.scrollLeft,rect:{left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width}}));
    metrics.push({width,id,position,...base,...location});await page.screenshot({path:path.join(out,width+'-'+id+'-'+position+'.png'),animations:'disabled'});
   }
  }
 }
 await page.setViewportSize({width:390,height:900});
 for(const [id,row] of [['table16',6],['exam-military',5]]){
  const wrap=page.locator('.gsr-structure-scroll[data-structure="'+id+'"]');await wrap.evaluate(e=>e.scrollLeft=0);await wrap.locator('tr[data-row="'+row+'"]').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:path.join(out,'390-'+id+'-continuation.png')});
 }
 const map=page.locator('[data-figure="p042-02.png"]');await map.scrollIntoViewIfNeeded();await map.locator('button').first().click();await page.locator('.gsr-image-dialog[open]').waitFor();assert(await page.locator('#app').evaluate(e=>e.inert));await page.getByRole('button',{name:'원래 크기로 확대'}).click();await page.screenshot({path:path.join(out,'390-map-zoom.png')});await page.goBack();await page.locator('.gsr-image-dialog').waitFor({state:'detached'});assert(!await page.locator('#app').evaluate(e=>e.inert));
 const stageAX=await page.context().newCDPSession(page);fs.writeFileSync(path.join(out,'ax-tables.json'),JSON.stringify(await stageAX.send('Accessibility.getFullAXTree'),null,2));
 await page.click('[data-mode="practice"]');assert.equal(await page.locator('textarea').count(),103);assert(await page.locator('textarea').evaluateAll(a=>a.every(e=>e.value==='')));await page.locator('textarea').first().fill('synthetic draft');
 await page.click('[data-mode="answers"]');assert.equal(await page.locator('[data-kind="answers"]').count(),0);await page.locator('.gsr-reveal button').click();assert.equal(await page.locator('[data-kind="answers"]').count(),2);
 await page.click('[data-mode="study"]');await page.waitForFunction(()=>document.querySelectorAll('.goryeo-script-reader figure img').length===2);
 // Decode failure must expose a retry instead of a blank/unhandled image.
 await page.evaluate(async()=>{const host=document.querySelector('#goryeoScript');testSession.stop();let fail=true;const t={...testTransport,loadFigure:async(n,o)=>{if(n==='p042-01.png'&&fail){fail=false;return new Blob(['invalid PNG'],{type:'image/png'});}return testTransport.loadFigure(n,o);}};await testSession.mount(host,t);});
 await page.locator('[data-figure="p042-01.png"][data-error="image_decode"]').waitFor();await page.locator('[data-figure="p042-01.png"] .gsr-image-retry').click();await page.waitForFunction(()=>document.querySelectorAll('.goryeo-script-reader figure img').length===2);
 // Another overlay keeps its lease after source modal close and logout cleanup.
 await page.evaluate(()=>window.otherRelease=HanqUiLocks.acquire(document.querySelector('#app')));await page.evaluate(()=>document.querySelector('[data-figure="p042-01.png"] button').click());await page.locator('.gsr-image-dialog[open]').waitFor();await page.goBack();assert(await page.locator('#app').evaluate(e=>e.inert));await page.evaluate(()=>otherRelease());
 await page.evaluate(()=>{history.pushState(null,'','#history');dispatchEvent(new HashChangeEvent('hashchange'));});await page.waitForFunction(()=>!document.querySelector('.goryeo-script-reader'));
 await page.evaluate(async()=>{history.replaceState(null,'','#chapter/goryeo/webtoon');await testSession.mount(document.querySelector('#goryeoScript'),testTransport);});await page.evaluate(()=>HanqApi.logout());await page.waitForFunction(()=>!document.querySelector('.goryeo-script-reader'));assert.equal(await page.locator('.gsr-image-dialog').count(),0);
 assert(maxActive<=2,'bounded queue');assert(!calls.some(c=>c.path.includes('/textbook/')&&c.method!=='GET'));assert.deepEqual(errors,[]);
 const ax=await page.context().newCDPSession(page);fs.writeFileSync(path.join(out,'ax-final.json'),JSON.stringify(await ax.send('Accessibility.getFullAXTree'),null,2));
 fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify({maxActive,metrics,errors,calls,scope:'actual shared theme; private synthetic mount; no live hookup'},null,2));await browser.close();console.log('PASS: stage1 real-theme widths/viewport scroll screenshots, headers, retry/decode, zoom/Back/locks, 103 empty fields, reveal, route/logout; no real-user writes');
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
