'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.HANQ_PLAYWRIGHT_PATH||'playwright');
const {fixture,title}=require('./test-era-blank-test-removal.cjs');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),html=read('index.html');
const css=[...html.matchAll(/<link[^>]+href="\/?(media\/[^"?]+\.css)[^"]*"/g)].map(m=>read(m[1])).join('\n')+'\n'+[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
(async()=>{
 const results=[],out=path.join(root,'evidence/era-blank-test-removal');fs.mkdirSync(out,{recursive:true});
 for(const [engineName,engine] of Object.entries({chromium,webkit})){
  const browser=await engine.launch({headless:true});
  try{for(const viewport of [{width:320,height:780},{width:390,height:844},{width:1440,height:900},{width:844,height:320}])for(const era of ['joseon','goryeo','opening']){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',route=>route.request().url().startsWith('https://synthetic.invalid/')?route.fulfill({contentType:'text/html',body:'<!doctype html><html data-hanq-theme="terminal"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><main id="app"><section id="'+era+'Script"></section></main></html>'}):route.abort());
   await page.goto('https://synthetic.invalid/#chapter/'+era+'/blank-test');
   await page.addScriptTag({content:read('media/'+era+'-script-reader.js')});await page.addScriptTag({content:read('media/'+era+'-script-session.js')});
   await page.evaluate(async ({era,capital,data})=>{
    window.HanqBlankRecall={decorate(){throw Error('Removed feature mounted');}};if(era!=='joseon')window['Hanq'+capital+'Structure']={isPrepared:x=>x===data};
    const renderer=window['Hanq'+capital+'ScriptReader'];window.syntheticOriginal=JSON.stringify(data);window.syntheticData=data;localStorage.setItem('existing-progress','preserve-me');
    window.api={state:()=>({signedIn:true,ownerId:'synthetic',epoch:1}),onChange:()=>()=>{}};
    window.session=window['Hanq'+capital+'ScriptSession'].create({document,api,renderer:{...renderer,prepare:async()=>data},modeRouting:true,initialMode:'recall',workspaceFactory:()=>({show(body){body.innerHTML='<p>합성 빈칸 퀴즈</p>';},stop(){},hasUnsaved:()=>false})});
    await session.mount(document.querySelector('#'+era+'Script'),{ready:true,sourceSha256:data.bundle.source.sha256,loadBundle:async()=>data.bundle,loadFigure:async()=>{},loadStructure:async()=>({})});
    window.addEventListener('popstate',()=>session.handlePopState());
   },{era,capital:title(era),data:fixture(era)});
   const modes=page.locator('.'+({joseon:'jsr',goryeo:'gsr',opening:'osr'}[era])+'-modes');
   assert(page.url().endsWith('/webtoon'));assert.equal(await modes.locator('button').count(),3);assert.equal(await page.locator('[data-mode="recall"],.blank-recall,textarea').count(),0);
   assert((await page.locator('#'+era+'Script').innerText()).includes('중요 내용 0'));
   const metric=await modes.evaluate(n=>({columns:getComputedStyle(n).gridTemplateColumns.split(' ').length,overflow:document.documentElement.scrollWidth>innerWidth+1,buttons:[...n.querySelectorAll('button')].map(b=>({width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height}))}));
   assert.equal(metric.columns,3,JSON.stringify({era,viewport,metric}));assert(!metric.overflow,JSON.stringify({era,viewport,metric}));assert(metric.buttons.every(b=>b.height>=44),'touch target height');
   await page.evaluate(era=>history.replaceState({[era+'Script']:{source:'a'.repeat(64),topic:'second',mode:'recall'}},'','#chapter/'+era+'/blank-test'),era);await page.evaluate(()=>session.handlePopState());assert(page.url().endsWith('/webtoon'));assert((await page.locator('#'+era+'Script').innerText()).includes('중요 내용 1'));
   await modes.locator('[data-mode="practice"]').click();assert(page.url().endsWith('/source-quiz'));await page.goBack();assert(page.url().endsWith('/webtoon'));assert((await page.locator('#'+era+'Script').innerText()).includes('중요 내용 1'));await page.goForward();assert(page.url().endsWith('/source-quiz'));assert((await page.locator('#'+era+'Script').innerText()).includes('합성 빈칸 퀴즈'));await modes.locator('[data-mode="study"]').click();
   assert.equal(await page.evaluate(()=>localStorage.getItem('existing-progress')),'preserve-me');assert(await page.evaluate(()=>JSON.stringify(syntheticData)===syntheticOriginal));assert.deepEqual(errors,[]);
   if(viewport.width===390)await page.screenshot({path:path.join(out,engineName+'-'+era+'.png')});await page.evaluate(()=>session.stop());await page.close();results.push({engine:engineName,era,...viewport,...metric});
  }}finally{await browser.close();}
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results},null,2));console.log(JSON.stringify({passed:true,cases:results.length,engines:['cached headless Chromium','cached headless WebKit'],legacyBackForward:true,noPersistentWrites:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
