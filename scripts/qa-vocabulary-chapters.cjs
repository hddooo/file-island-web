/* Full app with content-only fixture + synthetic account/checks. No real session or DB. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,'../deliverables/vocabulary-chapters');fs.mkdirSync(out,{recursive:true});
const {chromium}=require('../.test-tools/node_modules/playwright');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'media/vocabulary-chapters-v1.json'))),isolated={};
vm.runInNewContext(fs.readFileSync(path.join(root,'media/toeic-notes.js'),'utf8'),isolated);
const mod=isolated.HanqToeicNotes;mod.validateChapters(manifest);
const allIds=manifest.chapters.flatMap(c=>c.wordIds),activeIds=manifest.chapters.map(c=>c.wordIds.filter(id=>!(manifest.retiredWordIds||[]).includes(id))); assert.equal(new Set(allIds).size,135);assert.deepEqual(manifest.chapters.map(c=>c.wordIds.length),[50,50,35]);
const invalid=JSON.parse(JSON.stringify(manifest));invalid.chapters[1].wordIds[0]=invalid.chapters[0].wordIds[0];assert.throws(()=>mod.validateChapters(invalid));
const synthetic=id=>({id,expression:'fixture '+id,part:'unclassified',partOfSpeech:'명사',meaning:'합성 검수 단어',example:'Please review the schedule before the new employees arrive.',translation:'새 직원들이 도착하기 전에 일정을 확인해 주세요.',structure:'review the schedule: 일정을 확인하다',synonyms:[]});
let fixture=process.env.CONTENT_FIXTURE?JSON.parse(fs.readFileSync(process.env.CONTENT_FIXTURE,'utf8')):{notes:allIds.filter(id=>!id.startsWith('supplement:')).map(synthetic),supplemental:allIds.filter(id=>id.startsWith('supplement:')).map(synthetic),archived:[]};
const words=fixture.notes.concat(fixture.supplemental),before=JSON.stringify(fixture),wordMap=new Map(words.map(n=>[n.id,n]));
assert(allIds.every(id=>wordMap.has(id)));
const groups=mod.chapterGroups(manifest,words),add=synthetic('new-unassigned-fixture');
assert.deepEqual(JSON.parse(JSON.stringify(groups.chapters.map(c=>c.words.map(n=>n.id)))),activeIds);
const afterAdd=mod.chapterGroups(manifest,[add,...words].reverse());assert.deepEqual(JSON.parse(JSON.stringify(afterAdd.chapters.map(c=>c.words.map(n=>n.id)))),activeIds);assert(afterAdd.unassigned.some(n=>n.id===add.id));
const missing=mod.chapterGroups(manifest,words.filter(n=>n.id!==allIds[0]));assert.equal(missing.chapters[0].words.length,48);
const held=new Map(['index.html','media/account-ui.css','media/account-ui.js','media/api-client.js','media/characters.js'].map(f=>[f,cp.execFileSync('git',['show','HEAD:'+f],{cwd:root})]));
(async()=>{const browser=await chromium.launch();const rows=[];try{
 for(const width of [320,390,1440]){
  const p=await browser.newPage({viewport:{width,height:900},hasTouch:width<700,reducedMotion:'reduce'});let extra=[],remove=null,writes=0,chapterFetches=0;
  let checks={ids:[allIds[0],manifest.chapters[1].wordIds[0]],revision:1,legacyImported:true};const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>localStorage.setItem('hanqacct:signedIn','1'));
  await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='hanq-api.onrender.com'){
   const user={id:'synthetic-chapters',displayName:'합성 검수',createdAt:'2026-10-01T00:00:00Z'};
   if(u.pathname.endsWith('/toeic-word-checks')){if(r.request().method()==='PUT'){const d=r.request().postDataJSON();assert.equal(d.revision,checks.revision);checks={ids:d.ids,revision:checks.revision+1,legacyImported:true};writes++;}return r.fulfill({json:checks});}
   if(u.pathname.endsWith('/toeic-notes')){assert.equal(r.request().method(),'GET');return r.fulfill({json:{notes:fixture.notes.filter(n=>n.id!==remove).concat(extra),archived:fixture.archived}});}
   assert(['GET','HEAD'].includes(r.request().method())||u.pathname.endsWith('/refresh'),'unexpected write '+u.pathname);
   return r.fulfill({json:u.pathname.endsWith('/refresh')?{accessToken:'synthetic',user}:u.pathname.endsWith('/me')?{user,growth:{points:1000},premium:{active:false}}:{items:[],notes:[]}});
  }
  if(u.hostname!=='hanq.vercel.app')return r.abort();if(u.pathname.endsWith('/vocabulary-chapters-v1.json'))chapterFetches++;
  // When no intake file is supplied, use an entirely synthetic vocabulary provider.
  if(!process.env.CONTENT_FIXTURE&&u.pathname.endsWith('/toeic-supplement.js'))return r.fulfill({contentType:'application/javascript',body:'window.HanqToeicSupplement={vocabularyEntries:function(){return '+JSON.stringify(fixture.supplemental)+';}};'});
  if(process.env.PRODUCTION)return r.continue();const f=u.pathname==='/'?'index.html':u.pathname.slice(1);
  if(held.has(f))return r.fulfill({body:held.get(f),contentType:f.endsWith('.html')?'text/html':f.endsWith('.css')?'text/css':'application/javascript'});
  const local=path.join(root,f);return fs.existsSync(local)&&fs.statSync(local).isFile()?r.fulfill({path:local}):r.fulfill({status:404,body:''});});
  const chapterCards=p.locator('.tn-chapter-card'),cards=p.locator('.tn-word-card');
  await p.goto('https://hanq.vercel.app/#toeic/notebook');await chapterCards.first().waitFor();assert.equal(await chapterCards.count(),3);assert.equal(await cards.count(),0);assert.equal(await p.locator('.tn-export-content').count(),0);assert.equal(await p.locator('.tn-chapter-exam:disabled').count(),manifest.chapters.filter(c=>c.examStatus!=='ready').length);assert.equal(await p.locator('.tn-chapter-overview').first().innerText(),'챕터당 최대 50개 · 현재 126개');
  assert.deepEqual(await p.locator('.tn-chapter-count').allTextContents(),['49개','45개','32개']);
  const bounds=await p.evaluate(()=>({page:document.documentElement.scrollWidth,width:innerWidth,buttons:[...document.querySelectorAll('.tn-chapter-card button')].map(n=>({height:n.getBoundingClientRect().height,width:n.clientWidth,scroll:n.scrollWidth}))}));assert(bounds.page<=bounds.width+1);assert(bounds.buttons.every(b=>b.height>=44&&b.scroll<=b.width+1));
  await p.screenshot({path:path.join(out,(process.env.PRODUCTION?'production':'local')+'-contents-'+width+'.png'),fullPage:true});
  await p.getByRole('button',{name:'Chapter 1 단어 학습',exact:true}).click();await cards.first().waitFor();assert.deepEqual(await cards.evaluateAll(ns=>ns.map(n=>n.dataset.noteId)),activeIds[0]);
  await p.waitForFunction(()=>!document.querySelector('.tn-word-check input').disabled);
  const first=cards.first();assert(await first.locator('.tn-example-main .tn-original').isVisible());assert(await first.locator('.tn-card-meaning').isVisible());
  await first.locator('.tn-extra>summary').click();assert(await first.locator('.tn-extra').evaluate(n=>n.open));
  await p.getByRole('button',{name:'뜻 가리기',exact:true}).click();assert.equal(await p.locator('.tn-card-meaning:visible,.tn-translation:visible,.tn-extra:visible').count(),0);assert.equal(await p.locator('.tn-example-main .tn-original:visible').count(),49);
  await cards.nth(1).locator('.tn-word-check input').check();await p.waitForFunction(()=>document.querySelector('.tn-check-warning').dataset.state==='ready');assert.equal(writes,1);
  await p.getByRole('button',{name:'뜻 보기',exact:true}).click();assert(await first.locator('.tn-extra').evaluate(n=>n.open));
  await p.getByLabel('체크한 단어만 보기',{exact:true}).check();assert.equal(await cards.count(),2);await p.getByLabel('체크한 단어만 보기',{exact:true}).uncheck();assert.equal(await cards.count(),49);assert(await first.locator('.tn-extra').evaluate(n=>n.open));
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:path.join(out,(process.env.PRODUCTION?'production':'local')+'-study-'+width+'.png')});
  await p.getByRole('button',{name:'← Chapter 목차',exact:true}).click();await p.getByRole('button',{name:'Chapter 2 단어 학습',exact:true}).click();assert.deepEqual(await cards.evaluateAll(ns=>ns.map(n=>n.dataset.noteId)),activeIds[1]);
  await p.goBack();await chapterCards.first().waitFor();await p.goForward();await cards.first().waitFor();assert.deepEqual(await cards.evaluateAll(ns=>ns.map(n=>n.dataset.noteId)),activeIds[1]);
  await p.reload();await cards.first().waitFor();assert.equal(await p.locator('.tn-chapter-heading').innerText(),'Chapter 2');assert.deepEqual(await cards.evaluateAll(ns=>ns.map(n=>n.dataset.noteId)),activeIds[1]);
  await p.getByRole('button',{name:'← Chapter 목차',exact:true}).click();await p.getByRole('button',{name:'Chapter 3 단어 학습',exact:true}).click();assert.equal(await cards.count(),32);assert(await p.getByRole('button',{name:'다음 페이지',exact:true}).first().isDisabled());
  await p.getByRole('button',{name:'전체 단어 보기',exact:true}).click();assert.equal(await cards.count(),50);await p.getByRole('button',{name:'다음 페이지',exact:true}).first().click();assert.equal(await cards.count(),50);await p.getByRole('button',{name:'다음 페이지',exact:true}).first().click();assert.equal(await cards.count(),26);
  const term=wordMap.get(allIds[0]).expression;await p.getByRole('searchbox',{name:'전체 단어 검색'}).fill(term);await p.getByRole('button',{name:'검색',exact:true}).click();assert(await p.locator('[data-note-id="'+allIds[0]+'"]').count());
  await p.getByRole('searchbox',{name:'전체 단어 검색'}).fill('zz-no-matching-word');await p.getByRole('button',{name:'검색',exact:true}).click();assert.equal(await cards.count(),0);assert.equal(await p.locator('.tn-search-status').innerText(),'검색 결과 0개');
  await p.goto('https://hanq.vercel.app/#toeic/notebook/word/'+encodeURIComponent(term));await cards.first().waitFor();assert(await p.locator('[data-note-id="'+allIds[0]+'"]').count());assert.equal(await p.locator('.tn-export-content').count(),0);
  await p.getByRole('button',{name:'← Chapter 목차',exact:true}).click();await p.getByRole('button',{name:'Chapter 1 단어 학습',exact:true}).click();assert.equal(await first.locator('.tn-extra').evaluate(n=>n.open),false);await first.locator('.tn-extra>summary').click();await p.getByRole('button',{name:'← Chapter 목차',exact:true}).click();await p.getByRole('button',{name:'Chapter 1 단어 학습',exact:true}).click();assert(await first.locator('.tn-extra').evaluate(n=>n.open));await first.locator('.tn-extra>summary').click();
  await p.getByRole('button',{name:'← Chapter 목차',exact:true}).click();await p.getByRole('button',{name:'Chapter 1 단어 학습',exact:true}).click();assert.equal(await first.locator('.tn-extra').evaluate(n=>n.open),false);
  extra=[add];await p.getByRole('button',{name:'← Chapter 목차',exact:true}).click();await p.reload();await chapterCards.first().waitFor();assert.equal(await p.locator('.tn-unassigned h3').innerText(),'추가 단어 · 1개');await p.getByRole('button',{name:'추가 단어 학습',exact:true}).click();assert.equal(await cards.count(),1);assert.equal(await cards.first().getAttribute('data-note-id'),add.id);
  await p.getByRole('button',{name:'← Chapter 목차',exact:true}).click();await p.getByRole('button',{name:'Chapter 1 단어 학습',exact:true}).click();assert.deepEqual(await cards.evaluateAll(ns=>ns.map(n=>n.dataset.noteId)),activeIds[0]);
  assert.equal(JSON.stringify(fixture),before);assert.deepEqual(errors,[]);assert.equal(writes,1);
  rows.push({width,counts:[49,45,32],firstScreen:'contents',disabledExams:manifest.chapters.filter(c=>c.examStatus!=='ready').length,exportRemoved:true,pageSize:50,historyBackForwardReload:true,oldWordLink:true,searchAndCheckedFilter:true,tipState:true,meaningModeEnglishRetained:true,addedWordDoesNotRebalance:true,checkWrites:writes,unexpectedWrites:0,overflow:false,chapterFetches});await p.close();console.log('PASS',width);
 }
 // Manifest outage must leave the old reader usable and offer an explicit retry.
 const p=await browser.newPage();let fail=true;await p.addInitScript(()=>localStorage.setItem('hanqacct:signedIn','1'));
 await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='hanq-api.onrender.com'){const user={id:'synthetic-failure',displayName:'검수'};return r.fulfill({json:u.pathname.endsWith('/refresh')?{accessToken:'synthetic',user}:u.pathname.endsWith('/me')?{user,growth:{points:0}}:u.pathname.endsWith('/toeic-notes')?{notes:fixture.notes,archived:[]}:u.pathname.endsWith('/toeic-word-checks')?{ids:[],revision:0,legacyImported:true}:{items:[]}});}if(u.hostname!=='hanq.vercel.app')return r.abort();if(u.pathname.endsWith('/vocabulary-chapters-v1.json')&&fail)return r.fulfill({status:503,body:''});if(!process.env.CONTENT_FIXTURE&&u.pathname.endsWith('/toeic-supplement.js'))return r.fulfill({contentType:'application/javascript',body:'window.HanqToeicSupplement={vocabularyEntries:function(){return '+JSON.stringify(fixture.supplemental)+';}};'});if(process.env.PRODUCTION)return r.continue();const f=u.pathname==='/'?'index.html':u.pathname.slice(1);if(held.has(f))return r.fulfill({body:held.get(f),contentType:f.endsWith('.html')?'text/html':f.endsWith('.css')?'text/css':'application/javascript'});const file=path.join(root,f);return fs.existsSync(file)?r.fulfill({path:file}):r.fulfill({status:404,body:''});});
 await p.goto('https://hanq.vercel.app/#toeic/notebook');await p.getByRole('button',{name:'챕터 다시 불러오기',exact:true}).waitFor();await p.getByRole('button',{name:'전체 단어 보기',exact:true}).click();await p.locator('.tn-word-card').first().waitFor();assert.equal(await p.locator('.tn-word-card').count(),50);await p.getByRole('button',{name:'← Chapter 목차',exact:true}).click();fail=false;await p.getByRole('button',{name:'챕터 다시 불러오기',exact:true}).click();await p.locator('.tn-chapter-card').first().waitFor();assert.equal(await p.locator('.tn-chapter-card').count(),3);await p.close();
 fs.writeFileSync(path.join(out,process.env.PRODUCTION?'production-result.json':'local-result.json'),JSON.stringify({passed:true,content:process.env.CONTENT_FIXTURE?'received content-only export; synthetic account/checks':'fully synthetic',rows,manifestFailureRetry:true,unit:{uniqueIds:135,missingWordDoesNotReplace:true,unknownWordsSeparate:true}},null,2));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
