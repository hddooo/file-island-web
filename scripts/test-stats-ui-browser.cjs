'use strict';
// Installed Chromium, real quiz/PDF modules and CSS; synthetic quiz data only.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const output=path.resolve(process.env.STATS_UI_EVIDENCE_DIR||path.join(root,'../fe-stats-ui-evidence-20261114'));fs.mkdirSync(output,{recursive:true});
const fixtureSource=read('scripts/test-era-blank-manual-save.cjs');
const {fixture,initial}=vm.runInNewContext(fixtureSource.slice(fixtureSource.indexOf('const revision='),fixtureSource.indexOf('if(require.main'))+'\n({fixture,initial});');
const html=read('index.html'),css=[...html.matchAll(/<link[^>]+href="\/?(media\/[^"?]+\.css)[^"]*"/g)].map(m=>read(m[1])).join('\n')+'\n'+[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
const results=[];let browser;
async function setup(width,mode='normal'){
 const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true,reducedMotion:mode==='reduce'?'reduce':'no-preference'}),page=await context.newPage();
 const errors=[],unexpected=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.href==='https://synthetic.invalid/')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="ko" data-hanq-theme="terminal" data-company-mode="'+(mode==='company'?'on':'off')+'"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><style>body{margin:0}#app{width:100%;max-width:1200px;margin:auto;padding:12px;box-sizing:border-box}.fixture-host{max-width:100%;padding:0!important}</style><div id="app"><section class="joseon-script-reader fixture-host" data-history-edition="81"><main id="quiz"></main></section></div></html>'});
  const local=u.pathname.startsWith('/fonts/')?'media'+u.pathname:u.pathname.slice(1);
  if(u.origin==='https://synthetic.invalid'&&/^media\/fonts\/[a-zA-Z0-9._-]+\.woff2$/.test(local)&&fs.existsSync(path.join(root,local)))return route.fulfill({path:path.join(root,local)});
  unexpected.push(u.pathname);return route.abort();
 });
 await page.goto('https://synthetic.invalid/');for(const p of ['media/textbook-source-quiz.js','media/era-quiz-review-pdf.js'])await page.addScriptTag({content:read(p)});
 return {context,page,errors,unexpected};
}
function model(total,officialStart=1){const m=fixture(),item=m.items[0];m.items=Array.from({length:total},(_,i)=>({...JSON.parse(JSON.stringify(item).replaceAll('synthetic-0','synthetic-'+i)),order:i+1,originalNumber:officialStart+i}));return m;}
async function render(page,total,correct,{answered=total,officialStart=1,failFirst=false}={}){
 await page.evaluate(async({data,saved,correct,answered,failFirst})=>{
  if(window.controller)controller.cleanup();window.fixtureModel=data;window.fixtureBefore=JSON.stringify(data);window.fixtureSaved=saved;window.writes=[];window.failNext=failFirst;
  window.controller=HanqTextbookSourceQuiz.render(document.querySelector('#quiz'),data,{manualSave:true,sequential:true,loadProgress:async()=>structuredClone(fixtureSaved),saveProgress:async body=>{writes.push(structuredClone(body));if(failNext){failNext=false;throw Error('synthetic save failure');}for(const u of body.updates)fixtureSaved.workspace.responses[u.itemId]={...structuredClone(u),correct:u.submitted?HanqTextbookSourceQuiz.gradePractice(data.items.find(i=>i.id===u.itemId),u.values).correct:null};fixtureSaved.workspace.status=body.status;fixtureSaved.revision++;return structuredClone(fixtureSaved);}});await controller.ready;window.confirm=()=>true;
  [...document.querySelectorAll('.textbook-source-quiz-input')].forEach((n,i)=>{n.value=i<answered?(i<correct?'알파':'합성오답SECRET'):'';n.dispatchEvent(new Event('input',{bubbles:true}));});
 },{data:model(total,officialStart),saved:initial(),correct,answered,failFirst});
 assert.equal(await page.locator('.textbook-source-quiz-help,.textbook-source-grading-notice').count(),0,'no app solve hints on sequential pages');
 const mapToggle=page.locator('.textbook-source-question-map .textbook-source-panel-toggle');if(await mapToggle.isVisible())await mapToggle.click();
 await page.locator('.textbook-source-question-number').last().click();await page.locator('.textbook-source-save-complete').click();
 if(!failFirst)await page.locator('.textbook-source-statistics-title').waitFor({state:'visible'});
}
async function verifyStatistics(page,total,correct){
 assert.equal(await page.locator('.textbook-source-statistics-summary').innerText(),'전체 '+total+'문제 중 '+correct+'문제 정답');
 assert.equal(await page.locator('.textbook-source-statistics-score').innerText(),'정답률 '+(correct/total*100).toFixed(2)+'%');
 assert.equal(await page.locator('.textbook-source-quiz-resume,.textbook-source-next-era').count(),0);
 assert(!await page.locator('.textbook-source-review').innerText().then(t=>/오답 \d+문제 · 미풀이 \d+문제|해설.*없|해설.*미포함/.test(t)));
 const buttons=await page.locator('button:visible').allTextContents();assert(buttons.every(t=>['다시 풀기','오답 PDF 저장'].includes(t)),JSON.stringify(buttons));
 assert.equal(await page.evaluate(()=>JSON.stringify(fixtureModel)===fixtureBefore),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 for(const b of await page.locator('button:visible').all()){const box=await b.boundingBox();assert(box.width>=44&&box.height>=44);}
}
(async()=>{
 browser=await chromium.launch({executablePath:process.env.HANQ_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const width of [320,390,1440])for(const mode of ['normal','reduce','company']){
  const t=await setup(width,mode),{page}=t;await render(page,5,4);await verifyStatistics(page,5,4);
  const burst=page.locator('.textbook-source-goal-celebration');assert.equal(await burst.count(),mode==='normal'?1:0);
  if(mode==='normal'){assert.equal(await burst.locator('i').count(),32);assert.equal(await burst.getAttribute('aria-hidden'),'true');assert.equal(await burst.evaluate(n=>getComputedStyle(n).pointerEvents),'none');}
  assert.equal(await page.evaluate(()=>writes.length),1);const savedBefore=await page.evaluate(()=>JSON.stringify(fixtureSaved));
  await page.locator('.textbook-source-restart').click();assert.equal(await page.locator('.textbook-source-statistics-title:visible').count(),0);assert.equal(await burst.count(),0);assert(await page.locator('.textbook-source-quiz-input').evaluateAll(ns=>ns.every(n=>n.value==='')));assert.equal(await page.evaluate(()=>JSON.stringify(fixtureSaved)),savedBefore);assert.equal(await page.evaluate(()=>writes.length),1);
  const historyToggle=page.locator('.textbook-source-history .textbook-source-panel-toggle');if(await historyToggle.isVisible())await historyToggle.click();
  await page.locator('.textbook-source-history-entry').click();await verifyStatistics(page,5,4);assert.equal(await burst.count(),0,'saved record does not replay celebration');assert.equal(await page.locator('.textbook-source-restart').isVisible(),true);
  assert.deepEqual(t.errors,[]);assert.deepEqual(t.unexpected,[]);results.push({width,mode,threshold:'4/5',pass:true,writes:1,retryWrites:0,savedReplayConfetti:false});console.log('PASS '+width+' '+mode);await t.context.close();
 }
 const t=await setup(390),{page}=t;
 for(const [total,correct,answered] of [[100,79,100],[171,136,171],[171,137,171],[172,145,172],[3,1,3],[5,4,4],[3,0,0],[3,3,3]]){
  await render(page,total,correct,{answered});await verifyStatistics(page,total,correct);assert.equal(await page.locator('.textbook-source-goal-celebration').count(),correct/total>=.8?1:0);assert.equal(await page.locator('[data-source-review-item-id]').count(),answered-correct);assert.equal(await page.locator('img').count(),0,'no substitute Patamon asset');results.push({total,correct,answered,score:(correct/total*100).toFixed(2),confetti:correct/total>=.8,pass:true});
 }
 await render(page,3,3,{failFirst:true});await page.waitForFunction(()=>document.querySelector('.textbook-source-save-retry:not([hidden])'));assert.equal(await page.locator('.textbook-source-statistics-title').count(),0);await page.locator('.textbook-source-save-retry').click();await page.locator('.textbook-source-statistics-title').waitFor();await verifyStatistics(page,3,3);assert.equal(await page.evaluate(()=>writes.length),2);assert.equal(await page.evaluate(()=>writes[0].mutationId===writes[1].mutationId),true,'uncertain retry retains mutation identity');results.push({saveFailureRetry:true,mutationIdentityPreserved:true,pass:true});
 await render(page,50,0,{officialStart:31});await verifyStatistics(page,50,0);
 assert.equal(await page.locator('[data-source-review-item-id]').first().locator('h4').innerText(),'31. 합성 문제');
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('.textbook-source-review-pdf-button').click()]);const pdfFile=path.join(output,'synthetic-stats-50.pdf');await download.saveAs(pdfFile);assert.equal(await download.failure(),null);
 const text=execFileSync('pdftotext',['-raw',pdfFile,'-'],{encoding:'utf8'});assert(text.includes('알파'));assert(!text.includes('합성오답SECRET')&&!text.includes('내 답:'));assert.equal((text.match(/(?:^|\n)31\. /g)||[]).length,1);assert.equal((text.match(/(?:^|\n)80\. /g)||[]).length,1);
 const layout=await page.evaluate(async()=>{const result=await HanqEraQuizReviewPdf.create({review:document.querySelector('.textbook-source-review'),title:'합성 통계 50',isCurrent:()=>true});return {count:result.count,pages:result.pages,columns:[...new Set(result.layout.map(l=>l.column))],bounds:result.layout.every(l=>l.x+l.width<=567.29&&l.y<=807),ids:new Set(result.layout.map(l=>l.id)).size};});assert.equal(layout.count,50);assert.equal(layout.ids,50);assert.deepEqual(layout.columns,[0,1]);assert(layout.bounds);assert.equal(await page.evaluate(()=>writes.length),1);assert.equal(await page.evaluate(()=>JSON.stringify(fixtureModel)===fixtureBefore),true);results.push({download:true,pdfBytes:fs.statSync(pdfFile).size,officialNumbers:'31..80 once',personalAnswersExcluded:true,layout,pass:true});
 await page.screenshot({path:path.join(output,'internal-stats-390.png'),fullPage:false});
 await page.evaluate(()=>{window.realDownload=HanqEraQuizReviewPdf.download;HanqEraQuizReviewPdf.download=o=>{window.pendingExport=o;return new Promise(resolve=>window.finishExport=resolve);};});
 await page.locator('.textbook-source-review-pdf-button').click();assert.equal(await page.evaluate(()=>pendingExport.isCurrent()),true);await page.locator('.textbook-source-restart').click();assert.equal(await page.evaluate(()=>pendingExport.isCurrent()),false);await page.evaluate(()=>finishExport({count:50,pages:1}));assert.equal(await page.evaluate(()=>writes.length),1);results.push({restartInvalidatesPendingPdf:true,lateExportAddsNoWrite:true,pass:true});
 assert.deepEqual(t.errors,[]);assert.deepEqual(t.unexpected,[]);await t.context.close();
 const summary={passed:true,browser:browser.version(),sourceBase:'7ce61f2bbcf011646bd8db791d3abc2ff019374d',syntheticDataOnly:true,productionAccess:false,cases:results.length,results};fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
})().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();});
