/* Full app, fixture-only API. Never serves the pending login edits. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict');
const {chromium}=require('../.test-tools/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,'../deliverables/vocabulary-fifty');
fs.mkdirSync(out,{recursive:true});
const ref='8b7bed03ea404905c6225b382185acf9ecbf51e8';
const held=['index.html','media/account-ui.css','media/account-ui.js','media/api-client.js','media/characters.js'];
const oldFiles=new Map([...held,...(process.env.BASELINE?['media/toeic-notes.js','media/toeic-notes.css']:[])].map(f=>[f,cp.execFileSync('git',['show',ref+':'+f],{cwd:root})]));
const words=['arrange','eligible','benefit','coordinate','probationary','revamp','acknowledge'];
const notes=Array.from({length:127},(_,i)=>({id:'density-'+String(i+1).padStart(3,'0'),expression:words[i]||'reviewword'+String(i+1).padStart(3,'0'),partOfSpeech:i===1||i===4?'형용사':'동사',meaning:'일정을 조율하다 · 합성 검수 뜻',example:i===0?'Please arrange a meeting with the training team before the new staff members arrive.':'The coordinator will review the schedule before the meeting.',translation:'신입 직원들이 도착하기 전에 교육팀과 회의 일정을 잡아 주세요.',structure:'arrange a meeting: 회의 일정을 잡다',confusion:'합성 데이터로 화면과 상태 유지 확인',synonyms:['density-fixture-group']}));
const copy=JSON.stringify(notes),url='https://hanq.vercel.app/#toeic/notebook/word/density-fixture-group';
(async()=>{const browser=await chromium.launch(),results=[];try{for(const width of [320,390,1440]){
 const p=await browser.newPage({viewport:{width,height:850},hasTouch:width<700,reducedMotion:'reduce'});
 let checks={ids:['density-051','density-127'],revision:1,legacyImported:true},writes=0;const errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>localStorage.setItem('hanqacct:signedIn','1'));
 await p.route('**/*',async r=>{const u=new URL(r.request().url());if(u.hostname==='hanq-api.onrender.com'){
  const user={id:'synthetic-density',displayName:'검수',createdAt:'2026-10-01T00:00:00Z'};
  if(u.pathname.endsWith('/toeic-word-checks')){if(r.request().method()==='PUT'){const d=r.request().postDataJSON();assert.equal(d.revision,checks.revision);checks={ids:d.ids,revision:checks.revision+1,legacyImported:true};writes++;}return r.fulfill({json:checks});}
  if(u.pathname.endsWith('/toeic-notes')){assert.equal(r.request().method(),'GET');return r.fulfill({json:{notes,archived:[]}});}
  return r.fulfill({json:u.pathname.endsWith('/refresh')?{accessToken:'synthetic',user}:u.pathname.endsWith('/me')?{user,growth:{points:1000},premium:{active:false}}:{items:[],notes:[]}});
 }
 if(u.hostname!=='hanq.vercel.app')return r.abort();if(process.env.PRODUCTION)return r.continue();const f=u.pathname==='/'?'index.html':u.pathname.slice(1);
 if(oldFiles.has(f))return r.fulfill({body:oldFiles.get(f),contentType:f.endsWith('.html')?'text/html':f.endsWith('.css')?'text/css':'application/javascript'});
 const local=path.join(root,f);return fs.existsSync(local)&&fs.statSync(local).isFile()?r.fulfill({path:local}):r.fulfill({status:404,body:''});});
 await p.goto(url);await p.locator('.tn-word-card').first().waitFor();await p.waitForFunction(()=>!document.querySelector('.tn-word-check input').disabled);
 const first=p.locator('[data-note-id="density-001"]'),cards=p.locator('.tn-word-card'),pageSize=process.env.BASELINE?25:50;
 assert.equal(await cards.count(),pageSize);assert(await first.locator('.tn-card-meaning').isVisible());assert(await first.locator('.tn-word-check').isVisible());
 assert.equal(await first.locator('.tn-extra').evaluate(n=>n.open),false);
 const metrics=await first.evaluate(n=>({height:n.getBoundingClientRect().height,fonts:[...n.querySelectorAll('h3,.tn-card-meaning,.tn-original,.tn-translation')].map(e=>getComputedStyle(e).fontSize),summary:n.querySelector('summary').getBoundingClientRect().height,overflow:[...n.querySelectorAll('h3,p,li,small')].filter(e=>e.clientWidth&&e.scrollWidth>e.clientWidth+1).map(e=>e.textContent)}));
 assert.deepEqual(metrics.overflow,[]);await first.scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,(process.env.BASELINE?'before':process.env.PRODUCTION?'production':'local')+'-'+width+'.png')});
 if(process.env.BASELINE){results.push({width,pageSize,...metrics});await p.close();continue;}
 const before=JSON.parse(fs.readFileSync(path.join(out,'before.json'))).results.find(r=>r.width===width);assert.deepEqual(metrics.fonts,before.fonts);assert(metrics.height<before.height,JSON.stringify({before,metrics}));assert(metrics.summary>=44);
 await first.locator('.tn-extra>summary').click();assert(await first.locator('.tn-extra').evaluate(n=>n.open));
 await p.getByRole('button',{name:'다음 페이지',exact:true}).first().click();assert.equal(await cards.count(),50);assert.equal(await cards.first().getAttribute('data-note-id'),'density-051');
 await p.getByRole('button',{name:'이전 페이지',exact:true}).first().click();assert(await first.locator('.tn-extra').evaluate(n=>n.open));
 await p.getByLabel('체크한 단어만 보기',{exact:true}).check();assert.equal(await cards.count(),2);await p.getByLabel('체크한 단어만 보기',{exact:true}).uncheck();assert(await first.locator('.tn-extra').evaluate(n=>n.open));
 await p.getByRole('button',{name:'뜻 가리기',exact:true}).click();assert.equal(await p.locator('.tn-word-check:visible').count(),50);assert.equal(await p.locator('.tn-card-meaning:visible,.tn-translation:visible,.tn-extra:visible').count(),0);assert.equal(await p.locator('.tn-example-main .tn-original:visible').count(),50);
 await first.locator('.tn-word-check input').check();await p.waitForFunction(()=>document.querySelector('.tn-check-warning').dataset.state==='ready');assert.equal(writes,1);
 await p.getByRole('button',{name:'다음 페이지',exact:true}).first().click();assert.equal(await p.locator('.tn-card-meaning:visible').count(),0);assert.equal(await cards.count(),50);
 await p.getByLabel('단어장 페이지',{exact:true}).first().selectOption('2');assert.equal(await cards.count(),27);assert.equal(await cards.first().getAttribute('data-note-id'),'density-101');assert.equal(await cards.last().getAttribute('data-note-id'),'density-127');assert(await p.getByRole('button',{name:'다음 페이지',exact:true}).first().isDisabled());
 await p.getByLabel('체크한 단어만 보기',{exact:true}).check();assert.equal(await cards.count(),3);assert((await p.locator('.tn-page-label').first().innerText()).includes('1 / 1'));await p.getByLabel('체크한 단어만 보기',{exact:true}).uncheck();
 await p.getByRole('button',{name:'뜻 보기',exact:true}).click();assert(await first.locator('.tn-extra').evaluate(n=>n.open));assert(await first.locator('.tn-card-meaning').isVisible());assert(await first.locator('.tn-word-check').isVisible());
 await p.goto('https://hanq.vercel.app/#toeic/notebook/word/reviewword101');await p.waitForFunction(()=>document.querySelectorAll('.tn-word-card').length===1);assert.equal(await cards.first().getAttribute('data-note-id'),'density-101');
 await p.goto('https://hanq.vercel.app/#toeic/notebook/word/zz-no-matching-word');await p.waitForFunction(()=>document.querySelector('.tn-search-status')?.textContent==='검색 결과 0개');assert.equal(await cards.count(),0);assert.equal(await p.locator('.tn-page').count(),0);
 await p.goto(url);await first.waitFor();await p.waitForFunction(()=>!document.querySelector('.tn-word-check input').disabled);assert(await first.locator('.tn-extra').evaluate(n=>n.open));
 await first.locator('.tn-extra>summary').click();await p.getByLabel('체크한 단어만 보기',{exact:true}).check();await p.getByLabel('체크한 단어만 보기',{exact:true}).uncheck();assert.equal(await first.locator('.tn-extra').evaluate(n=>n.open),false);
 await p.reload();await first.waitFor();await p.waitForFunction(()=>!document.querySelector('.tn-word-check input').disabled);assert(await first.locator('.tn-card-meaning').isVisible());assert(await first.locator('.tn-word-check input').isChecked());assert(await first.locator('.tn-word-check').isVisible());assert.equal(writes,1);assert.equal(JSON.stringify(notes),copy);assert.deepEqual(errors,[]);
 results.push({width,pageSize,...metrics,beforeHeight:before.height,reductionPercent:Math.round((1-metrics.height/before.height)*100),pageCounts:[50,50,27],tipSurvivesPageFilterModeSearch:true,explicitClosePreserved:true,checksPersist:true,checkWrites:writes,duplicateWrites:0,notesUnchanged:true});await p.close();console.log('PASS',width);
 }fs.writeFileSync(path.join(out,process.env.BASELINE?'before.json':process.env.PRODUCTION?'production.json':'local.json'),JSON.stringify({passed:true,ref,api:'synthetic only',results},null,2));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
