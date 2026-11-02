/* Full app, synthetic API only. Pending login edits are deliberately not served. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process'),{chromium}=require('../.test-tools/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,'../deliverables/astra-learning');
const held=['index.html','media/account-ui.css','media/account-ui.js','media/api-client.js','media/characters.js'];
const baseline=new Map(held.map(f=>[f,cp.execFileSync('git',['show','HEAD:'+f],{cwd:root})]));
(async()=>{const browser=await chromium.launch();try{let results=[];for(const width of [320,390,1440]){
 const p=await browser.newPage({viewport:{width,height:850},reducedMotion:'reduce'});let attempts=[],posts=0,errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>localStorage.setItem('hanqacct:signedIn','1'));
 await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='hanq-api.onrender.com'){
  const user={id:'synthetic-learning',displayName:'검수',createdAt:'2026-10-01T00:00:00Z'};
  if(u.pathname.endsWith('/answers')&&r.request().method()==='POST'){
   const x=r.request().postDataJSON(),bid=u.pathname.split('/')[4],bank=JSON.parse(fs.readFileSync(path.join(root,'media/weakness-banks',bid+'.json'))),q=bank.questions.find(q=>q.id===x.questionId);
   let a=attempts.find(a=>a.eventId===x.eventId);if(!a){a={...x,bankId:bid,answer:q.answer,correct:x.selected===q.answer,attemptCount:1,recentAttempts:[{selected:x.selected,answer:q.answer,correct:x.selected===q.answer,version:x.version,attemptedAt:x.attemptedAt}]};attempts.push(a);posts++;}return r.fulfill({json:{attempt:a,growth:{delta:a.correct?1:-1}}});
  }
  if(u.pathname.endsWith('/progress'))return r.fulfill({json:{items:attempts.filter(a=>u.pathname.includes(a.bankId)),firstResult:null}});
  return r.fulfill({json:u.pathname.endsWith('/refresh')?{accessToken:'synthetic',user}:u.pathname.endsWith('/me')?{user,growth:{points:1000},access:{total:0,today:false},premium:{active:false}}:{items:[],notes:[]}});
 }
 if(u.hostname!=='hanq.vercel.app')return r.abort();if(process.env.PRODUCTION)return r.continue();let f=u.pathname==='/'?'index.html':u.pathname.slice(1);
 if(baseline.has(f))return r.fulfill({body:baseline.get(f),contentType:f.endsWith('.html')?'text/html':f.endsWith('.css')?'text/css':'application/javascript'});
 const local=path.join(root,f);return fs.existsSync(local)&&fs.statSync(local).isFile()?r.fulfill({path:local}):r.fulfill({status:404,body:''});});
 for(const [chapter,lesson,bank,n] of [['adjectives-adverbs','aa-state','focus-adj-adv-v2-100',4],['clauses-connectors','cn-warning','focus-connectors-v3-100',61],['word-forms','ly-time-distance','focus-ly-v3-50',41]]){
  await p.goto('https://hanq.vercel.app/#toeic/grammar/'+chapter+'/'+lesson);await p.locator('.tg-learning').waitFor();
  assert.equal(await p.locator('.tg-learning .tg-part>h4').count(),3);
  const stats=await p.locator('.tg-learning').evaluate(host=>({version:host.dataset.learningVersion,overflow:[...host.querySelectorAll('table,p,h5')].filter(x=>x.scrollWidth>x.clientWidth+2).map(x=>x.tagName+':'+x.textContent.slice(0,65)),minFont:Math.min(...[...host.querySelectorAll('.tg-learning-concept,.tg-en,.tg-learning-table td')].map(x=>parseFloat(getComputedStyle(x).fontSize))),chapters:window.HANQ_WEAKNESS_LEARNING.chapters.length}));
  assert.equal(stats.chapters,3);assert.equal(stats.overflow.length,0,JSON.stringify(stats.overflow));assert(stats.minFont>=15);
  await p.locator('#learn-'+lesson).scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'concept-'+chapter+'-'+width+'.png')});
  await p.locator('#learn-'+lesson).getByRole('button',{name:'외울 결합 보기',exact:true}).click();await p.screenshot({path:path.join(out,'memory-'+chapter+'-'+width+'.png')});
  await p.goto('https://hanq.vercel.app/#toeic/grammar-practice/'+bank+'/'+String(n).padStart(3,'0'));await p.locator('.tg-drill-question').waitFor();
  const q=JSON.parse(fs.readFileSync(path.join(root,'media/weakness-banks',bank+'.json'))).questions[n-1];
  assert.equal(await p.locator('.tg-learning-return').count(),0);assert.equal(await p.locator('.tg-drill-question legend u').count(),0);assert(await p.locator('.tg-drill-question>.tg-translation').isHidden());
  await p.locator('.tg-drill-choices button').nth(q.answer).click();await p.locator('.tg-learning-return').waitFor();
  assert.equal(await p.locator('.tg-explanation-box').count(),1);const href=await p.locator('.tg-learning-return').getAttribute('href');assert(href.includes('/'+chapter+'/'));
  await p.locator('.hanq-grade-burst').waitFor({state:'detached'});await p.locator('.tg-feedback').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'explanation-'+chapter+'-'+width+'.png')});
  const beforePosts=posts;await p.locator('.tg-learning-return').click();await p.locator('.tg-learning').waitFor();assert.equal(p.url().split('#')[1],href.slice(1));
  await p.goBack();await p.locator('.tg-learning-return').waitFor();await p.reload();await p.locator('.tg-learning-return').waitFor();assert.equal(posts,beforePosts,'reading result must not resubmit');
  results.push({width,chapter,bank,graded:q.id,readable:true,noHintBeforeGrade:true,backlink:true,noRepeatPost:true,...stats});
 }
 await p.goto('https://hanq.vercel.app/#toeic/grammar');await p.locator('.tg-chapter-cards').waitFor();assert.equal(await p.locator('.tg-focus-index-row').count(),3);
 await p.locator('.tg-practice-index').evaluate(n=>n.open=true);for(const bank of ['focus-ly-v2-50','focus-connectors-v2-100'])assert(await p.locator('.tg-archive-practice').allTextContents().then(x=>x.some(t=>t.includes('이전 개선판'))));
 assert.deepEqual(errors,[]);await p.close();
 }fs.writeFileSync(path.join(out,process.env.PRODUCTION?'ui-production.json':'ui-local.json'),JSON.stringify({passed:true,results},null,2));console.log('PASS 3 widths × 3 chapters: readable notes, grade-only explanation/link, route/back/reload, archive entry');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
