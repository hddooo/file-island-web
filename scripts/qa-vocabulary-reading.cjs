// Word list reading layout and toolbar, whole app + synthetic API. Notes come from VOCAB_NOTES (a local JSON export,
// never committed); built-in supplement words come from the repository. No production endpoint is contacted.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),pw=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,'../evidence/vocabulary-reading'),origin='http://127.0.0.1:8796',owner='11111111-1111-4111-8111-111111111111';
if(!process.env.VOCAB_NOTES)throw new Error('VOCAB_NOTES (local notes JSON export) is required');
const camel=k=>k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase());
const notes=JSON.parse(fs.readFileSync(process.env.VOCAB_NOTES,'utf8')).map(n=>Object.fromEntries(Object.entries(n).map(([k,v])=>[camel(k),v])));
const SIZES=(process.env.QA_WIDTH?[process.env.QA_WIDTH.split(':').map(Number)]:[[320,568],[390,844],[768,1024],[1440,900],[720,450]]);
fs.mkdirSync(out,{recursive:true});
async function open(browser,width,height,checks){
 const page=await browser.newPage({viewport:{width,height}}),errors=[],saves=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('hanqacct:signedIn','1');localStorage.setItem('hanq:display-mode:v1','terminal');});
 let revision=0,ids=[...checks];
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.fulfill({status:503,body:''});const q=u.pathname,j=x=>r.fulfill({json:x});
  if(q==='/api/v1/auth/refresh')return j({accessToken:'t',accessTokenExpiresAt:new Date(Date.now()+6e5).toISOString(),user:{id:owner,displayName:'단어 탐험가'}});
  if(q==='/api/v1/me')return j({user:{id:owner,displayName:'단어 탐험가'},premium:{active:true},growth:{points:1000},access:{total:1,today:true,freeSlots:[]}});
  if(q==='/api/v1/toeic-notes')return j({notes});
  if(q==='/api/v1/toeic-word-checks'){if(r.request().method()==='PUT'){const b=r.request().postDataJSON();saves.push(b);ids=b.ids||ids;revision++;return j({ids,revision,legacyImported:true});}return j({ids,revision,legacyImported:true});}
  if(q.startsWith('/api/'))return j({items:[],notes:[],progress:[],available:false});
  const f=path.join(root,q==='/'?'index.html':decodeURIComponent(q));return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});});
 return {page,errors,saves};
}
const metrics=()=>{const h=document.querySelector('#toeicNotesHost'),cards=[...h.querySelectorAll('.tn-word-card')].filter(c=>c.offsetParent),c=cards[0],cs=n=>n&&getComputedStyle(n);
 const meaning=c&&c.querySelector('.tn-general-meaning'),tr=c&&c.querySelector('.tn-example-main .tn-translation'),h3=c&&c.querySelector('h3'),en=c&&c.querySelector('.tn-example-main .tn-original');
 const checkLefts=cards.map(k=>Math.round(k.querySelector('.tn-word-check').getBoundingClientRect().left)),contentLefts=cards.map(k=>Math.round(k.querySelector('.tn-lexeme').getBoundingClientRect().left));
 const tb=[...h.querySelectorAll('.tn-check-tools > *, .tn-check-filter > *')].map(n=>n.getBoundingClientRect()).filter(r=>r.width);let overlap=false;for(let i=0;i<tb.length;i++)for(let k=i+1;k<tb.length;k++){const a=tb[i],b=tb[k];if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1&&!(a.left<=b.left&&a.right>=b.right&&a.top<=b.top&&a.bottom>=b.bottom)&&!(b.left<=a.left&&b.right>=a.right&&b.top<=a.top&&b.bottom>=a.bottom))overlap=true;}
 const targets=[...h.querySelectorAll('.tn-check-tools button, .tn-word-card .tn-word-check')].filter(n=>n.offsetParent).map(n=>n.getBoundingClientRect()).map(r=>Math.min(r.width,r.height));
 return {cards:cards.length,overflow:document.documentElement.scrollWidth>innerWidth+1,cardOverflow:cards.filter(k=>k.scrollWidth>k.clientWidth+1).length,
  wordPx:h3&&parseFloat(cs(h3).fontSize),meaningPx:meaning&&parseFloat(cs(meaning).fontSize),meaningLine:meaning&&parseFloat(cs(meaning).lineHeight)/parseFloat(cs(meaning).fontSize),
  translationPx:tr&&parseFloat(cs(tr).fontSize),translationLine:tr&&parseFloat(cs(tr).lineHeight)/parseFloat(cs(tr).fontSize),meaningFont:meaning&&cs(meaning).fontFamily,translationFont:tr&&cs(tr).fontFamily,enFont:en&&cs(en).fontFamily,
  checkColumn:new Set(checkLefts).size===1&&checkLefts.every((x,i)=>x<contentLefts[i]),toolbarOverlap:overlap,minTarget:Math.min(...targets),
  filterText:(h.querySelector('.tn-checked-only')||{}).textContent,badge:(h.querySelector('.tn-check-count')||{}).textContent,eye:{label:h.querySelector('.tn-test-toggle').getAttribute('aria-label'),title:h.querySelector('.tn-test-toggle').title,slashed:!!h.querySelector('.tn-test-toggle path[d="M3 3l18 18"]')},
  hiddenMeanings:cards.filter(k=>{const m=k.querySelector('.tn-card-meaning');return m&&m.offsetParent===null;}).length,checkedIds:cards.filter(k=>k.querySelector('.tn-word-check input').checked).map(k=>k.dataset.vocabularyId),
  status:(h.querySelector('.tn-search-status')||{}).textContent,
  // Meaning sits to the right of the word on the word's row; on narrow screens it may drop to its own full row.
  // Beside the word: part-of-speech tags only (no 관용 표현·구문·불가산·-ing형 labels).
  posExtras:cards.map(k=>{const p=k.querySelector('.tn-card-pos');return p?[...p.childNodes].filter(n=>n.nodeType===3).map(n=>n.nodeValue).join('').trim():'';}).filter(Boolean),
  meaningPlacement:cards.map(k=>{const w=k.querySelector('.tn-word-header').getBoundingClientRect(),g=k.querySelector('.tn-general-meaning');if(!g||!g.offsetParent)return 'hidden';const r=g.getBoundingClientRect();return r.left>=w.right-1&&r.top<w.bottom?'beside':r.top>=w.bottom-1?'below':'overlap';})};};
(async()=>{const report=[];
 for(const engine of (process.env.QA_ENGINE?[process.env.QA_ENGINE]:['chromium','webkit'])){const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome'}:{});
  try{for(const [width,height] of SIZES){const stem=`${engine}-${width}`,row={engine,width,height};const {page,errors,saves}=await open(browser,width,height,[]);
   await page.goto(origin+'/#toeic/notebook');await page.locator('.tn-chapter-card').first().waitFor();
   // Contents keep their PDF·print and entry buttons; grammar cross links are gone from the word list.
   row.contentsPrint=await page.locator('.tn-chapter-card .tn-chapter-print').count();assert(row.contentsPrint>=1,stem+' contents PDF kept');
   assert.equal(await page.getByText('단어장에서 옮긴 문법 공식').count(),0);assert.equal(await page.getByText('문법노트에서 보기').count(),0);
   await page.locator('.tn-chapter-learn').first().click();await page.locator('.tn-word-card').first().waitFor();
   // Inside a chapter: no separate all-words, PDF or page back button; the Chapter contents button stays.
   assert.equal(await page.getByRole('button',{name:'전체 단어 보기'}).count(),0,stem+' no in-chapter all words');
   assert.equal(await page.getByRole('button',{name:'PDF 저장·인쇄'}).count(),0,stem+' no in-chapter PDF');
   assert.equal(await page.locator('.toeic-page-back').count(),0,stem+' no page back');
   assert.equal(await page.getByRole('button',{name:'← Chapter 목차'}).count(),1,stem+' Chapter contents kept');
   assert.equal(await page.locator('.tn-pair-tip').count(),0);
   let m=await page.evaluate(metrics);const total=m.cards;
   assert(!m.overflow&&!m.cardOverflow,stem+' no overflow');
   assert.deepEqual(m.posExtras,[],stem+' only part-of-speech tags beside the word');
   assert(!m.meaningPlacement.includes('overlap'),stem+' meaning never overlaps the word');if(width>=760)assert(m.meaningPlacement.every(x=>x==='beside'),stem+' meaning beside the word');assert(!m.toolbarOverlap,stem+' toolbar not overlapping');assert(m.minTarget>=44,stem+' 44px targets '+m.minTarget);assert(m.checkColumn,stem+' checks in a left column');
   assert(m.wordPx>=24&&m.meaningPx>=18&&m.translationPx>=16,stem+' reading sizes');assert(m.meaningLine>=1.6&&m.translationLine>=1.6,stem+' line height');
   assert(!/^FileIslandMenu/.test(m.meaningFont)&&!/^FileIslandMenu/.test(m.translationFont),stem+' Korean text face');
   assert.equal(m.filterText,'체크한 단어만 보기');assert.equal(m.badge,'0');assert.deepEqual(m.eye,{label:'뜻 가리기',title:'뜻 가리기',slashed:false});
   Object.assign(row,{cards:total,wordPx:m.wordPx,meaningPx:m.meaningPx,translationPx:m.translationPx,meaningLine:+m.meaningLine.toFixed(2),meaningFont:m.meaningFont.split(',')[0],minTarget:m.minTarget,meaningBeside:m.meaningPlacement.filter(x=>x==='beside').length});
   const scroller=page.locator('.device-content');await page.screenshot({path:path.join(out,`${stem}-chapter-top.png`)});
   await page.evaluate(()=>{const c=document.querySelector('.device-content'),f=document.querySelector('.tn-word-card');c.scrollTop=f.offsetTop-90;});await page.screenshot({path:path.join(out,`${stem}-words.png`)});
   // Check two words: badge updates at once and each change is saved.
   const boxes=page.locator('.tn-word-card .tn-word-check input');await boxes.nth(0).check();await boxes.nth(2).check();
   await page.waitForFunction(()=>document.querySelector('.tn-check-count').textContent==='2');const savesAfterCheck=saves.length;assert(savesAfterCheck>=1,stem+' checks saved');
   const checkedIds=(await page.evaluate(metrics)).checkedIds;assert.equal(checkedIds.length,2);
   // Filter round trip by keyboard: only the two, button reads 전체 보기, then back to the whole chapter. No saves.
   await page.locator('.tn-checked-only').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelectorAll('.tn-word-card').length===2);
   m=await page.evaluate(metrics);assert.equal(m.filterText,'전체 보기');assert.deepEqual(m.checkedIds.sort(),checkedIds.sort());assert.equal(m.badge,'2');await page.screenshot({path:path.join(out,`${stem}-checked-only.png`)});
   await page.locator('.tn-checked-only').press('Enter');await page.waitForFunction(n=>document.querySelectorAll('.tn-word-card').length===n,total);assert.equal((await page.evaluate(metrics)).filterText,'체크한 단어만 보기');
   // Eye: hide (slashed eye, name = next action), checks untouched and still operable, then show again. No saves.
   await page.locator('.tn-test-toggle').press('Space');await page.waitForFunction(()=>document.querySelector('.tn-test-toggle').getAttribute('aria-label')==='뜻 보기');
   m=await page.evaluate(metrics);assert(m.eye.slashed&&m.eye.title==='뜻 보기');assert.equal(m.hiddenMeanings,m.cards,stem+' meanings hidden');assert.deepEqual(m.checkedIds.sort(),checkedIds.sort());assert(m.checkColumn);await page.screenshot({path:path.join(out,`${stem}-meanings-hidden.png`)});
   await page.locator('.tn-test-toggle').click();await page.waitForFunction(()=>document.querySelector('.tn-test-toggle').getAttribute('aria-label')==='뜻 가리기');assert.equal((await page.evaluate(metrics)).hiddenMeanings,0);
   assert.equal(saves.length,savesAfterCheck,stem+' filter/eye never write checks');
   // Empty filtered chapter: uncheck both while filtered, short note + 전체 보기 restores the chapter.
   await page.locator('.tn-checked-only').click();await page.waitForFunction(()=>document.querySelectorAll('.tn-word-card').length===2);
   await page.locator('.tn-word-card .tn-word-check input').first().click();await page.waitForFunction(()=>document.querySelector('.tn-check-count').textContent==='1'&&document.querySelectorAll('.tn-word-card').length===1);await page.locator('.tn-word-card .tn-word-check input').first().click();
   await page.locator('.tn-empty-checked').waitFor();assert.equal(await page.locator('.tn-check-count').textContent(),'0');await page.screenshot({path:path.join(out,`${stem}-empty-checked.png`)});
   await page.locator('.tn-empty-checked .tn-show-all').click();await page.waitForFunction(n=>document.querySelectorAll('.tn-word-card').length===n,total);
   // All words: one list, no paging controls or page wording; no example source labels or source boxes.
   await page.getByRole('button',{name:'← Chapter 목차'}).click();await page.getByRole('button',{name:'전체 단어 보기'}).click();await page.locator('.tn-word-card').first().waitFor();
   const allView=await page.evaluate(()=>{const h=document.querySelector('#toeicNotesHost');return {cards:h.querySelectorAll('.tn-word-card').length,pageUi:h.querySelectorAll('.tn-page,.tn-page-label,.tn-page-status').length,pageText:/페이지/.test(h.textContent),sourceUi:h.querySelectorAll('.tn-example-label,.tn-source-context,.tn-source-note').length,sourceText:(h.textContent.match(/출제문맥|원문 예문|학습 예문 ·|번 지문|원문·출처|이전 예문|오답 보기입니다/g)||[]),status:(h.querySelector('.tn-search-status')||{}).textContent};});
   assert.equal(allView.pageUi,0,stem+' no paging UI');assert(!allView.pageText,stem+' no page wording');assert.equal(allView.sourceUi,0,stem+' no source boxes');assert.deepEqual(allView.sourceText,[],stem+' no source labels');
   assert.equal(allView.cards,70,stem+' every word in one list');row.allWords=allView;m=await page.evaluate(metrics);assert(!m.overflow&&!m.cardOverflow,stem+' all words no overflow');
   await page.evaluate(()=>{const c=document.querySelector('.device-content');c.scrollTop=c.scrollHeight;});await page.screenshot({path:path.join(out,`${stem}-all-end.png`)});
   // Deep link from study links / mini quiz.
   await page.goto(origin+'/#toeic/notebook/word/eligible');await page.locator('.tn-word-card').first().waitFor();row.deepLink=await page.locator('.tn-word-card h3').first().textContent();
   assert.deepEqual(errors,[]);report.push({...row,passed:true});console.log(stem,'PASS',JSON.stringify(row));await page.close();}
  }finally{await browser.close();}}
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,realIphone:false,notesSource:'local export (not committed)',report},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
