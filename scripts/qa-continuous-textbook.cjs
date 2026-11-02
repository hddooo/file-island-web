'use strict';
// Isolated source fixture browser; no live API, cookies, account or exam writes.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('../.test-tools/node_modules/playwright');
const root=path.resolve(process.argv[2]||'../api/private-textbook-semantic-data'),out=path.resolve(process.argv[3]||'../audit/continuous-reader');fs.mkdirSync(out,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))),front=path.resolve(__dirname,'..');
(async()=>{const browser=await chromium.launch({headless:true});const page=await browser.newPage();let figures=[];const rows=[];
await page.route('https://hanq-fixture.test/**',async route=>{const url=new URL(route.request().url());let file;
 if(url.pathname==='/'){return route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:12px;font-family:Arial}main{max-width:1000px;margin:auto}</style><main></main>'+['private-textbook.css','textbook-semantic.css','textbook-source-quiz.css'].map(f=>`<link rel="stylesheet" href="/media/${f}">`).join('')+['private-textbook.js','textbook-figure-groups.js','textbook-semantic.js','textbook-source-quiz.js','textbook-semantic-library.js'].map(f=>`<script src="/media/${f}"></script>`).join('')});}
 if(url.pathname.startsWith('/media/'))file=path.join(front,url.pathname);
 else if(url.pathname==='/manifest.json')file=path.join(root,'manifest.json');
 else if(/^\/pages\/page-\d{3}\.json$/.test(url.pathname)||/^\/quizzes\/[a-z]+\.json$/.test(url.pathname))file=path.join(root,url.pathname);
 else if(/^\/assets\/[a-zA-Z0-9.-]+\.(jpeg|png)$/.test(url.pathname)){file=path.join(root,url.pathname);figures.push(path.basename(file));}
 if(!file||!fs.existsSync(file))return route.fulfill({status:404,body:'fixture missing'});
 return route.fulfill({path:file});
});
for(const width of [390,1440])for(const era of (process.argv[4]?process.argv[4].split(','):['prehistory','samguk','nambuk','goryeo','joseon','opening','colonial','modern','people','regions','front','credits'])){
 figures=[];await page.setViewportSize({width,height:950});await page.goto('https://hanq-fixture.test/');
 const expected=await page.evaluate(async ({era,extensions})=>{
  window.HanqApi={state:()=>({signedIn:true,ownerId:'fixture',epoch:1}),onChange:()=>()=>{},textbookSourceWorkspace:async()=>({version:'fixture',revision:0,workspace:{cursor:0,status:'active',responses:{}}}),saveTextbookSourceWorkspace:async(id,m)=>({version:'fixture',revision:m.revision+1,workspace:{cursor:m.cursor,status:m.status,responses:Object.fromEntries(m.updates.map(u=>[u.itemId,{values:u.values,submitted:u.submitted,checkedSlots:u.checkedSlots,correct:false}]))}}),textbookSemanticManifest:()=>fetch('/manifest.json').then(r=>r.json()),textbookSemanticPage:n=>fetch('/pages/page-'+String(n).padStart(3,'0')+'.json').then(r=>r.json()),textbookSemanticQuiz:id=>fetch('/quizzes/'+id+'.json').then(r=>r.json()),textbookSemanticFigure:id=>fetch('/assets/'+id+'.'+(extensions[id]||'jpeg')).then(r=>r.blob())};
  window.fixtureLibrary=HanqSemanticLibrary.create({api:HanqApi});await fixtureLibrary.mount(document.querySelector('main'),era);
  return HanqPrivateTextbook.eraFor(era);
 },{era,extensions:Object.fromEntries(manifest.figures.map(f=>[f.id,f.extension||'jpeg']))});
 const numbers=manifest.pages.filter(p=>p.pdfPage>=expected.from&&p.pdfPage<=expected.to).map(p=>p.pdfPage);
 const actual=await page.locator('[data-reader-page]').evaluateAll(es=>es.map(e=>+e.dataset.readerPage));assert.deepEqual(actual,numbers);
 assert.equal(await page.locator('[data-reader-page] .textbook-semantic').count(),numbers.length);
 assert.equal(await page.locator('select').count(),0);
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)){console.log(await page.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,16).map(e=>({tag:e.tagName,cls:e.className,w:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right}))));await page.screenshot({path:path.join(out,'overflow.png')});throw Error('body overflow '+era+' '+width);}
 assert.equal(await page.locator('[data-page-retry]').count(),0);
 const topFigures=figures.length;await page.screenshot({path:path.join(out,`${era}-${width}-start.png`)});
 assert.equal(await page.locator('.textbook-reader-toc').count(),0);await page.locator('[data-reader-page]').last().scrollIntoViewIfNeeded();assert.equal(await page.locator('[data-reader-page]').count(),numbers.length);
 for(const n of numbers.filter(n=>[17,20,21,31,54,76,77,79,103,124,128,130].includes(n))){const loc=page.locator(`[data-reader-page="${n}"]`);await loc.scrollIntoViewIfNeeded();await page.waitForTimeout(250);await loc.screenshot({path:path.join(out,`p${n}-${width}-continuous.png`)});assert.equal(await loc.locator('[data-figure-state=figure_load_failed]').count(),0,'no failed source figure');}
 let quizItems=null;
 const quizEraId=expected.id==='samguk'?'ancient':expected.id;const q=manifest.quizzes.find(q=>q.id===quizEraId||q.eraId===quizEraId);
 if(q){await page.locator('[data-mode="quiz"]').click();await page.waitForSelector('.textbook-source-quiz-item',{timeout:5000}).catch(async e=>{console.log('QUIZ FAILURE',era,await page.locator('main').innerText());throw e;});const source=JSON.parse(fs.readFileSync(path.join(root,`quizzes/${q.id}.json`)));const ids=await page.locator('[data-source-item-id]').evaluateAll(es=>es.map(e=>e.dataset.sourceItemId));assert.deepEqual(ids,source.items.map(i=>i.id));quizItems=ids.length;assert.equal(await page.locator('select').count(),0);
  await page.locator('.textbook-source-quiz-input').first().fill('fixture preserved');await page.locator('.textbook-source-quiz-input').last().focus();assert.equal(await page.locator('.textbook-source-quiz-input').first().inputValue(),'fixture preserved');assert.equal(await page.locator('[data-source-item-id]').count(),ids.length);await page.screenshot({path:path.join(out,`${era}-${width}-quiz-focus.png`)});
 }
 rows.push({era,width,pages:numbers.length,allTextAutomatic:true,topFiguresFetched:topFigures,totalEraFigures:manifest.figures.filter(f=>numbers.includes(f.pdfPage)).length,quizItems,scrollAndQuizFocusPreservePagesAndResponses:true,bodyOverflow:false});console.log(JSON.stringify(rows.at(-1)));
 await page.evaluate(()=>fixtureLibrary.stop());assert.equal(await page.locator('.textbook-semantic').count(),0);
}
await browser.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({scope:'offline actual source bundle, intercepted fixture HTTP; no live user session/DB access',rows},null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
