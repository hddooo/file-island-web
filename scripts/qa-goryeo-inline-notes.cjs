'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),path=require('path'),{chromium}=require('playwright');
(async()=>{
 const bundle=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),out=process.argv[3]||'.artifacts/goryeo-notes';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[],results=[];
 try{for(const width of [320,390,1440])for(const company of [false,true]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://goryeo-notes.test/**',route=>route.fulfill({contentType:'text/html',body:'<meta charset="utf-8"><main id="app"></main>'}));await page.goto('https://goryeo-notes.test/');
  await page.evaluate(company=>{document.documentElement.dataset.companyMode=company?'on':'off';},company);
  for(const p of ['goryeo-script-reader','history81-terms','history-typography','company-mode'])await page.addStyleTag({path:'media/'+p+'.css'});
  for(const p of ['goryeo-script-structure-data','goryeo-script-presentation-data','goryeo-script-structure','history81-term-data','history81-terms','goryeo-script-reader','blank-recall'])await page.addScriptTag({path:'media/'+p+'.js'});
  await page.evaluate(async bundle=>{window.prepared=await HanqGoryeoScriptReader.prepare(bundle);window.host=document.querySelector('main');window.reader=HanqGoryeoScriptReader.mount(host,prepared);},bundle);
  let found=[];
  for(const topic of bundle.topics){
   await page.locator('[data-topic="'+topic.id+'"]').click();
   await page.evaluate(async topic=>{if(window.termView)termView.stop();reader.stop();const saved=HanqHistory81Terms.mount;HanqHistory81Terms.mount=()=>({stop(){},count:0});reader=HanqGoryeoScriptReader.mount(host,prepared,{initialTopic:topic});HanqHistory81Terms.mount=saved;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));window.original=host.querySelector('.gsr-body').innerHTML;window.termView=saved(host.querySelector('.gsr-body'),'goryeo',prepared.bundle.source.sha256);},topic.id);
   const phrases=await page.locator('[data-goryeo-source-note]').evaluateAll(nodes=>nodes.map(n=>n.closest('.history81-term').dataset.termPhrase));
   for(const phrase of phrases){
    const trigger=page.locator('.history81-term').filter({has:page.locator('[data-goryeo-source-note]')}).filter({hasText:phrase}).first();await trigger.scrollIntoViewIfNeeded();await page.waitForTimeout(300);await trigger.focus();await page.keyboard.press('Enter');
    const tip=page.locator('[role="tooltip"]:visible');assert.equal(await tip.count(),1,phrase);const summary=await tip.textContent();assert(summary.length>3&&Array.from(summary).length<=150,phrase);assert.equal(await trigger.locator('.history81-term').count(),0,'no nested trigger');
    const box=await tip.boundingBox();assert(box.x>=0&&box.x+box.width<=width+1);assert(box.y>=0&&box.y+box.height<=901);
    if(phrase==='기인 제도'){assert(summary.includes('통일신라(ㅅ)는 상수리 제도'));assert(summary.includes('고려(ㄱ)는 기인제도'));}
    if(phrase==='사심관 제도')assert(summary.includes('ex: 경순왕'));
    if(phrase==='왕규의 난')assert(summary.includes('양규 장군과 헷갈리지 말기'));
    if(phrase==='흑창')assert(summary.includes('빈민 구제 기관'));
    if(phrase==='광덕, 준풍')assert(summary.includes('광종-광덕, 광광'));
    if(phrase==='삼별초')assert(summary.includes('좌별초, 우별초, 신의군'));
    if(width===390&&!company)await page.screenshot({path:path.join(out,phrase.replace(/[^\p{L}\p{N}]/gu,'_')+'.png')});
    await page.keyboard.press('Escape');assert.equal(await page.locator('[role="tooltip"]:visible').count(),0);await trigger.click();assert.equal(await page.locator('[role="tooltip"]:visible').count(),1);await page.keyboard.press('Escape');found.push(phrase);
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   const restored=await page.evaluate(()=>{termView.stop();const actual=host.querySelector('.gsr-body').innerHTML;let at=0;while(at<actual.length&&actual[at]===original[at])at++;return {ok:actual===original,at,before:original.slice(at-150,at+300),after:actual.slice(at-150,at+300)};});assert(restored.ok,JSON.stringify(restored));
   // A repeated mount must not duplicate, omit or mutate the source.
   assert(await page.evaluate(()=>{const h=host.querySelector('.gsr-body'),a=HanqHistory81Terms.mount(h,'goryeo',prepared.bundle.source.sha256);a.stop();return h.innerHTML===original;}));
  }
  assert.deepEqual(found.sort(),['정계와 계백료서','역분전','흑창','기인 제도','사심관 제도','왕규의 난','광덕, 준풍','제위보','초조대장경','봉사 10조','삼별초','거란 침입','사회혼란','공민왕의 개혁 정책','벽란도','관영상점','전시과','녹과전'].sort());
  await page.evaluate(()=>{reader.stop();history.replaceState(null,'');reader=HanqGoryeoScriptReader.mount(host,prepared);});assert.equal(await page.locator('[data-goryeo-source-note]').count(),14);await page.locator('[data-mode=recall]').click();assert.equal(await page.locator('[data-goryeo-source-note]').count(),0);assert.equal(await page.locator('[role=tooltip]').count(),0);await page.locator('[data-mode=study]').click();assert.equal(await page.locator('[data-goryeo-source-note]').count(),14);
  await page.evaluate(()=>reader.stop());assert.equal(await page.locator('[role="tooltip"]').count(),0);results.push({width,company,notes:found.length});await page.close();
 }}finally{await browser.close();}
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors,sourceRestored:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
