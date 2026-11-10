'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const out=process.env.ARTIFACT_DIR||'evidence/recall-aliases';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:process.env.QA_BROWSER||'chrome',headless:true});let cases=0,sourceCases=0;const errors=[],layoutFindings=[];
 try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://recall-alias.invalid/**',r=>r.fulfill({contentType:'text/html',body:'<main></main>'}));await page.goto('https://recall-alias.invalid/');
 for(const width of [320,390,1440])for(const company of [false,true]){
  await page.setViewportSize({width,height:900});
  await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><div id="app" data-company-history style="max-width:960px;margin:auto"><main><p><strong>석가탑(불국사 3층 석탑)</strong></p><p><strong>촌락 문서(민정 문서)</strong></p><p><strong>백제(무령왕릉)</strong></p></main></div>');
  await page.evaluate(c=>{document.documentElement.dataset.companyMode=c?'on':'off';document.documentElement.setAttribute('data-history-typography','');document.documentElement.toggleAttribute('data-company-history',c);},company);
  for(const file of ['file-island','textbook-semantic','history-typography','company-mode','blank-recall'])await page.addStyleTag({path:'media/'+file+'.css'});
  await page.addScriptTag({path:'media/blank-recall.js'});
  await page.evaluate(()=>{window.before=document.querySelector('main').innerHTML;window.recall=HanqBlankRecall.decorate(document.querySelector('main'));});
  const fields=page.locator('textarea');assert.equal(await fields.count(),3);
  await fields.nth(0).fill('석가탑');await fields.nth(0).press('Tab');assert(await fields.nth(1).evaluate(n=>n===document.activeElement));
  await fields.nth(1).fill('민정문서');await fields.nth(1).press('Enter');assert.equal(await page.locator('.is-correct').count(),2);
  await fields.nth(2).fill('백제');await fields.nth(2).press('Enter');assert.equal(await page.locator('.is-wrong').count(),1);assert.equal(await fields.nth(2).getAttribute('aria-invalid'),'true');
  for(const i of [0,1])assert.equal(await fields.nth(i).evaluate(n=>getComputedStyle(n).color),company?'rgb(112, 186, 255)':'rgb(36, 106, 208)');
  await fields.nth(0).fill('다보탑');await fields.nth(0).press('Tab');assert.equal(await page.locator('.is-wrong').count(),2);assert((await page.locator('.is-wrong .blank-recall-feedback').first().textContent()).includes('석가탑(불국사 3층 석탑)'));
  await fields.nth(0).fill('불국사 3층 석탑');await fields.nth(1).fill('촌락문서');assert.equal(await page.evaluate(()=>recall.grade()),2);
  for(const field of await fields.all())assert(await field.evaluate(n=>n.scrollWidth<=n.clientWidth+1&&n.scrollHeight<=n.clientHeight+1),'input clipping');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'page overflow');
  if(width===390)await page.screenshot({path:path.join(out,company?'company.png':'normal.png')});
  await page.evaluate(()=>recall.reset());assert.equal(await page.locator('.is-correct,.is-wrong').count(),0);assert(await fields.nth(0).evaluate(n=>n===document.activeElement));
  await page.evaluate(()=>recall.stop());assert.equal(await page.locator('main').innerHTML(),await page.evaluate(()=>before));
  await page.evaluate(()=>{window.recall=HanqBlankRecall.decorate(document.querySelector('main'));});assert.equal(await fields.nth(0).inputValue(),'');
  await page.evaluate(()=>recall.stop());assert.equal(await page.locator('main').innerHTML(),await page.evaluate(()=>before));cases++;
 }
 if(process.argv[2])for(const width of [320,390,1440])for(const company of [false,true])for(const n of [32,35]){
  const data=JSON.parse(fs.readFileSync(path.join(process.argv[2],'pages/page-'+String(n).padStart(3,'0')+'.json')));
  assert.equal(data.sourceSha256,'d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de');data.blocks=data.blocks.filter(b=>b.studySection==='concept');
  await page.setViewportSize({width,height:900});await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><div id="app" data-company-history><main></main></div>');
  await page.evaluate(c=>{document.documentElement.dataset.companyMode=c?'on':'off';},company);
  for(const file of ['file-island','textbook-semantic','history-typography','company-mode','blank-recall'])await page.addStyleTag({path:'media/'+file+'.css'});
  for(const file of ['blank-recall','textbook-semantic'])await page.addScriptTag({path:'media/'+file+'.js'});
  const targets=await page.evaluate(data=>{
   const host=document.querySelector('main');window.renderer=HanqTextbookSemantic.render(host,data,{});window.before=host.innerHTML;window.recall=HanqBlankRecall.decorate(host);recall.grade();
   const answers={'불국사3층석탑석가탑':['석가탑','불국사 3층 석탑'],'촌락문서':['민정문서','촌락문서'],'9산선문9산문':['9산문','9산 선문'],'대조영고왕':['고왕','대조영']},result=[];
   for(const slot of host.querySelectorAll('.blank-recall-slot')){const source=slot.querySelector('.blank-recall-feedback').textContent.slice(2),key=HanqBlankRecall.normalize(source);if(answers[key]){slot.querySelector('textarea').dataset.aliasTest=key;result.push({key,answers:answers[key]});}}
   recall.reset();return result;
  },data);
  assert.equal(targets.length,n===32?3:1);
  for(const target of targets){const field=page.locator('[data-alias-test="'+target.key+'"]');for(const answer of target.answers){await field.fill(answer);await field.press('Tab');assert(await field.evaluate(n=>n.closest('.blank-recall-slot').classList.contains('is-correct')));const box=await field.evaluate(n=>({sw:n.scrollWidth,cw:n.clientWidth,sh:n.scrollHeight,ch:n.clientHeight,rect:n.getBoundingClientRect().toJSON(),cell:n.closest('td,th')?.getBoundingClientRect().toJSON()}));if(box.cell)assert(box.rect.x>=box.cell.x-1&&box.rect.right<=box.cell.right+1,'input crosses source cell '+JSON.stringify({width,company,page:n,key:target.key,box}));if(box.sw>box.cw+1||box.sh>box.ch+1)layoutFindings.push({width,company,page:n,key:target.key,answer,box});}}
  const crossedCells=await page.locator('textarea').evaluateAll(nodes=>nodes.flatMap(n=>{const cell=n.closest('td,th');if(!cell)return[];const a=n.getBoundingClientRect(),b=cell.getBoundingClientRect();return a.x<b.x-1||a.right>b.right+1?[{input:a.toJSON(),cell:b.toJSON()}]:[]}));assert.deepEqual(crossedCells,[],'source inputs stay inside their own table cells');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'source page overflow');
  if(width===320&&!company&&n===35)await page.screenshot({path:path.join(out,'source-35-320.png')});
  await page.evaluate(()=>recall.stop());assert.equal(await page.locator('main').innerHTML(),await page.evaluate(()=>before));await page.evaluate(()=>renderer.cleanup());sourceCases++;
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({cases,sourceCases,widths:[320,390,1440],companyAndNormal:true,errors,keyboardAndRepeat:true,sourceRestored:true,layoutFindings}));
 assert.deepEqual(layoutFindings,[],'source input clipping (compare the fixture against the baseline before changing runtime layout)');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
