'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../.test-tools/node_modules/playwright');
const {fixture,sourcePage,OLD,NEW,pins}=require('./test-history-reading-layout.cjs');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.ARTIFACT_DIR||path.join(root,'evidence/history-reading-layout'));
fs.mkdirSync(out,{recursive:true});
const read=n=>fs.readFileSync(path.join(root,'media',n),'utf8');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true});const results=[];
 try{for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:850},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://history-layout.test/',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html lang="ko" data-hanq-theme="terminal"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px}main{max-width:1000px;margin:auto;min-width:0}</style><main><div id="privateTextbook"></div></main></html>'}));await page.goto('https://history-layout.test/');
  for(const n of ['terminal-theme.css','textbook-semantic.css','textbook-source-quiz.css'])await page.addStyleTag({content:read(n)});
  for(const n of ['textbook-semantic.js','textbook-source-quiz.js'])await page.addScriptTag({content:read(n)});
  for(const source of [OLD,NEW]){
   const data=fixture(source);
   await page.evaluate(async({data,version})=>{
    window.__saved={version,revision:0,workspace:{cursor:0,status:'active',responses:{}}};window.__writes=[];
    window.__quiz=HanqTextbookSourceQuiz.render(document.querySelector('#privateTextbook'),data,{loadProgress:async()=>structuredClone(__saved),saveProgress:async body=>{__writes.push(structuredClone(body));body.updates.forEach(u=>__saved.workspace.responses[u.itemId]=u);Object.assign(__saved.workspace,{cursor:body.cursor,status:body.status});__saved.revision++;return structuredClone(__saved);}});await __quiz.ready;
   },{data,version:pins[source]});
   const metrics=await page.evaluate(()=>{
    const root=document.querySelector('#privateTextbook'),input=root.querySelector('input');input.focus();
    const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number),lum=v=>v.map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((a,b,i)=>a+b*[.2126,.7152,.0722][i],0),contrast=(a,b)=>{const x=lum(rgb(a)),y=lum(rgb(b));return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
    const style=getComputedStyle(root),field=getComputedStyle(input);
    return {overflow:document.documentElement.scrollWidth>innerWidth+1,background:style.backgroundColor,contrast:contrast(style.color,style.backgroundColor),inputContrast:contrast(field.color,field.backgroundColor),inputHeight:input.getBoundingClientRect().height,outline:parseFloat(field.outlineWidth),groups:[...root.querySelectorAll('.textbook-joseon-section')].map(g=>({id:g.dataset.joseonGroup,count:g.querySelectorAll('[data-source-item-id]').length})),ids:[...root.querySelectorAll('[data-source-item-id]')].map(n=>n.dataset.sourceItemId)};
   });
   assert(!metrics.overflow);assert.notEqual(metrics.background,'rgb(255, 255, 255)');assert(metrics.contrast>=4.5&&metrics.inputContrast>=4.5&&metrics.inputHeight>=44&&metrics.outline>=3,JSON.stringify(metrics));assert.equal(new Set(metrics.ids).size,data.items.length);
   const inputs=page.locator('.textbook-joseon-section-early input'),last=inputs.last();await last.focus();await last.press('Enter');assert.equal(await page.locator('.textbook-joseon-section-common input').first().evaluate(n=>n===document.activeElement),true,'Enter crosses divider in reading order');
   await page.evaluate(()=>__quiz.prepareLeave());const stored=await page.evaluate(()=>__writes.at(-1).cursor);assert.equal(stored,data.items.findIndex(i=>i.id===metrics.ids[metrics.groups[0].count]),'canonical cursor across divider');
   await page.locator('.textbook-joseon-heading').first().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,width+'-'+(source===OLD?'old':'revised-policy')+'-early.png')});
   await page.locator('.textbook-joseon-section-common>.textbook-joseon-heading').evaluate(n=>n.scrollIntoView({block:'start'}));await page.screenshot({path:path.join(out,width+'-'+(source===OLD?'old':'revised-policy')+'-divider.png')});
   await page.evaluate(()=>__quiz.cleanup());results.push({width,source,synthetic:true,...metrics,ids:undefined,canonicalCursor:stored});
  }
  const p=sourcePage(OLD);await page.evaluate(async p=>{window.__reader=HanqTextbookSemantic.render(document.querySelector('#privateTextbook'),p);await __reader.ready;},p);
  const graph=page.locator('[data-source-block="diagram"]'),dimensions=await graph.boundingBox();assert(dimensions.width<=341&&dimensions.height<=300,JSON.stringify(dimensions));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await graph.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,width+'-linked-diagram.png')});results.push({width,syntheticDiagram:true,dimensions});assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close();}
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,syntheticOnly:true,physicalDevice:false,results},null,2));console.log('PASS',results.length,'history layout/contrast/mobile cases');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
