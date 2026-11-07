'use strict';
// Synthetic authenticated API around caller-supplied private fixtures. No production requests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
let browser;
(async()=>{
 const [bundlePath,imageDir,modelPath,outPath]=process.argv.slice(2);
 if(!outPath)throw Error('Usage: qa-opening-workspace.cjs bundle.json imageDirectory model.json outputDirectory');
 const root=process.env.HANQ_PUBLIC_ROOT,out=path.resolve(outPath),bundle=JSON.parse(fs.readFileSync(bundlePath)),model=JSON.parse(fs.readFileSync(modelPath));fs.mkdirSync(out,{recursive:true});
 assert.equal(model.id,'opening');const structure=JSON.parse(fs.readFileSync(process.env.HANQ_OPENING_STRUCTURE)),presentation=JSON.parse(fs.readFileSync(process.env.HANQ_OPENING_PRESENTATION)),fieldCount=model.scriptResponseGroups.flatMap(g=>g.slotIds).length;
 const state={version:model.version,revision:0,reviewSelectionAvailable:true,workspace:{cursor:0,status:'active',responses:{},selectedReviewQuestionIds:[]}};
 let failSaves=0;const calls=[],errors=[],results=[];
 browser=await chromium.launch({headless:true,...(process.env.HANQ_CHROMIUM_PATH?{executablePath:process.env.HANQ_CHROMIUM_PATH}:{})});
 const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce',hasTouch:true}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));await context.addInitScript(()=>localStorage.setItem('hanqacct:signedIn','1'));
 await context.route('**/*',async route=>{
  const request=route.request(),u=new URL(request.url());if(u.hostname!=='opening-workspace.test')return route.abort();
  if(u.pathname.startsWith('/api/v1/')){
   calls.push({path:u.pathname,method:request.method()});const user={id:'synthetic-opening',displayName:'Synthetic'};
   if(u.pathname.endsWith('/auth/refresh'))return route.fulfill({json:{accessToken:'synthetic-opening-session',user}});
   if(u.pathname.endsWith('/me'))return route.fulfill({json:{user,growth:{points:0},access:{total:1,today:true},premium:{active:false}}});
   const quiz=u.pathname.match(/\/textbook\/revisions\/([a-f0-9]{64})\/semantic\/(quizzes|workspaces)\/opening$/);
   if(quiz){assert.equal(quiz[1],model.source.sha256);if(quiz[2]==='quizzes')return route.fulfill({json:model});if(request.method()==='PUT'){
    if(failSaves){failSaves--;return route.fulfill({status:503,json:{error:{code:'fixture_save_failure'}}});}
    const body=request.postDataJSON();assert.equal(body.version,model.version);for(const entry of body.updates)state.workspace.responses[entry.itemId]={...entry,correct:false};if(body.selectedReviewQuestionIds)state.workspace.selectedReviewQuestionIds=body.selectedReviewQuestionIds.slice();state.workspace.cursor=body.cursor;state.workspace.status=body.status;state.revision++;
   }return route.fulfill({json:state});}
   if(u.pathname.endsWith('/opening/current/structure'))return route.fulfill({headers:{'cache-control':'private, no-store'},contentType:'application/json',body:JSON.stringify({structure:JSON.parse(fs.readFileSync(process.env.HANQ_OPENING_STRUCTURE)),presentation:JSON.parse(fs.readFileSync(process.env.HANQ_OPENING_PRESENTATION)),workspace:{revision:model.source.sha256,sourceSha256:model.source.scriptSha256,counts:{items:model.items.length,groups:model.scriptResponseGroups.length,slots:model.scriptResponseGroups.flatMap(g=>g.slotIds).length}}})});
   const asset=u.pathname.match(/\/textbook\/scripts\/opening\/([a-f0-9]{64})\/(bundle|structure|figures\/(p\d{3}-\d{2}\.png))$/);
   if(asset){assert.equal(asset[1],bundle.source.sha256);assert.equal(request.headers().authorization,'Bearer synthetic-opening-session');assert.equal(request.method(),'GET');return route.fulfill({headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'},contentType:asset[3]?'image/png':'application/json',body:fs.readFileSync(asset[3]?path.join(imageDir,asset[3]):asset[2]==='structure'?process.env.HANQ_OPENING_STRUCTURE:bundlePath)});}
   if(u.pathname.includes('/textbook/'))return route.fulfill({status:503,json:{error:{code:'fixture_unavailable'}}});
   return route.fulfill({json:{items:[],notes:[],days:[],entries:[],total:0,page:1,pages:1}});
  }
  const file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});return route.fulfill({path:file});
 });
 async function enter(slug){await page.goto('https://opening-workspace.test/');await page.waitForFunction(()=>window.HanqApi&&HanqApi.state().signedIn&&!HanqApi.state().restoring);await page.evaluate(s=>location.hash='#chapter/opening/'+s,slug);await page.locator('.osr-modes').waitFor();}
 const fields=page.locator('.textbook-source-quiz-input');
 for(const [width,height] of [[320,900],[390,900],[1440,900],[844,390]]){
  await page.setViewportSize({width,height});await enter('webtoon');
  assert.deepEqual(await page.locator('.osr-modes > button').allTextContents(),['개념 학습','시험에는 이렇게 나온다','빈칸 퀴즈']);
  assert.equal(await page.locator('.osr-modes > button').count(),3);assert.equal(await page.locator('.osr-draft textarea').count(),0);const type=await page.locator('.opening-script-reader').evaluate(n=>({base:getComputedStyle(n).fontSize,heading:getComputedStyle(n.querySelector('h1')).fontSize,font:getComputedStyle(n).fontFamily}));assert.equal(type.base,'14px');assert.equal(type.heading,'15px');assert(type.font.includes('Noto Serif KR'),'Opening follows current history font');
  for(const topicData of bundle.topics){const topic=topicData.id,examIds=structure.segments.filter(s=>s.page>=topicData.from&&s.page<=topicData.to).flatMap(s=>s.items).filter(id=>presentation.examItems.includes(id));
   await page.locator('[data-topic="'+topic+'"]').click();await page.locator('[data-mode="study"]').click();
   await page.waitForFunction(()=>[...document.querySelectorAll('.osr-image-status')].every(n=>!n.textContent.includes('불러오는 중')));
   assert.equal(await page.locator('figure[data-error]').count(),0);assert.equal(await page.locator('table[data-structure]').evaluateAll((nodes,ids)=>nodes.filter(n=>ids.includes(n.dataset.structure)).length,presentation.examItems),0);
   assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),'study viewport overflow '+width+'/'+topic);
   await page.screenshot({path:path.join(out,`opening-${width}-${height}-${topic}-study.png`)});
   await page.locator('[data-mode="exam"]').click();assert.equal(await page.locator('table[data-structure]').evaluateAll((nodes,ids)=>nodes.filter(n=>ids.includes(n.dataset.structure)).length,presentation.examItems),examIds.length);assert.equal(await page.locator('.osr-body figure').count(),0);
   await page.screenshot({path:path.join(out,`opening-${width}-${height}-${topic}-exam.png`)});
  }
  await page.locator('[data-mode="practice"]').click();await fields.first().waitFor({state:'attached'});if(await page.locator('.textbook-source-quiz-resume').isVisible())await page.locator('.textbook-source-quiz-resume').click();await fields.first().waitFor();assert.equal(await fields.count(),fieldCount);assert.equal(await page.locator('[data-source-item-id]').count(),model.items.length);assert.equal(await page.locator('.osr-draft textarea,.osr-modes [data-mode="answers"]').count(),0);
  await fields.first().fill('synthetic draft '+width);await fields.first().press('Tab');await page.waitForFunction(()=>document.querySelector('.textbook-source-quiz-status')?.textContent.includes('저장했습니다'));
  const mark=page.locator('.textbook-source-mark input').first();await mark.check();await page.waitForFunction(()=>document.querySelector('.textbook-source-quiz-status')?.textContent.includes('저장했습니다'));
  await page.locator('[data-mode="study"]').click();await page.locator('[data-mode="exam"]').click();await page.locator('[data-mode="practice"]').click();assert.equal(await fields.first().inputValue(),'synthetic draft '+width);assert(await mark.isChecked());
  await fields.first().focus();await page.keyboard.press('Tab');assert(await fields.nth(1).evaluate(n=>n===document.activeElement));await page.keyboard.press('Shift+Tab');assert(await fields.first().evaluate(n=>n===document.activeElement));
  await page.locator('.textbook-source-marked-filter').click();assert.equal(await page.locator('[data-source-item-id]:visible').count(),1);await page.locator('.textbook-source-marked-filter').click();
  assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),'quiz viewport overflow');
  for(const theme of ['terminal','default']){await page.evaluate(t=>document.documentElement.dataset.hanqTheme=t,theme);await fields.first().scrollIntoViewIfNeeded();const colors=await fields.first().evaluate(n=>({color:getComputedStyle(n).color,background:getComputedStyle(n).backgroundColor}));assert.equal(colors.color,'rgb(24, 33, 47)');assert.equal(colors.background,'rgb(255, 255, 255)');await page.screenshot({path:path.join(out,`opening-${width}-${height}-${theme}-quiz.png`)});}
  await page.reload();await fields.first().waitFor({state:'attached'});if(await page.locator('.textbook-source-quiz-resume').isVisible())await page.locator('.textbook-source-quiz-resume').click();await fields.first().waitFor();assert.equal(await fields.first().inputValue(),'synthetic draft '+width);assert(await mark.isChecked());
  await fields.first().fill('unsaved leave '+width);failSaves=1;await page.locator('#homeBrand').click();await page.waitForFunction(()=>document.querySelector('.textbook-source-quiz-status')?.textContent.includes('저장하지 못'));assert(page.url().endsWith('/source-quiz'));assert.equal(await fields.first().inputValue(),'unsaved leave '+width);
  failSaves=1;await page.evaluate(()=>{history.pushState(null,'','#history');dispatchEvent(new PopStateEvent('popstate'));});await page.waitForFunction(()=>location.hash.endsWith('/source-quiz'));assert.equal(await fields.first().inputValue(),'unsaved leave '+width);
  await page.locator('#homeBrand').click();await page.waitForFunction(()=>!location.hash.includes('/source-quiz'));assert.equal(state.workspace.status,'paused');results.push({width,height,topics:bundle.topics.length,examTables:presentation.examItems.length,questions:model.items.length,fields:fieldCount,draftAndChecksSaved:true,failedNavigationPreserved:true});
 }
 await enter('source-quiz');await fields.first().waitFor({state:'attached'});await page.evaluate(()=>HanqApi.logout());await page.waitForFunction(()=>!document.querySelector('.textbook-source-quiz-input'));
 assert(!calls.some(c=>c.method==='PUT'&&!c.path.includes('/revisions/'+model.source.sha256+'/semantic/workspaces/opening')),'only canonical Opening workspace writes');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'opening-workspace-results.json'),JSON.stringify({results,calls,errors,synthetic:true,noProductionWrites:true},null,2));await browser.close();console.log('PASS Opening actual index: 3 tabs, source figures, source-defined items / fields, save/reload/checked review, failure retention, logout, responsive screenshots');
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exitCode=1;});
