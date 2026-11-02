/* Full app CSS + isolated API: no user account, cookie, or production record is used. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict');
const{chromium}=require(path.join(process.env.HANQ_TEST_TOOLS||path.resolve(__dirname,'../.test-tools'),'node_modules/playwright'));
const OUT=process.env.QA_OUTPUT||'/tmp/hanq-mini-options-qa';fs.mkdirSync(OUT,{recursive:true});const chapter=Number(process.env.CHAPTER||1);assert([1,2,3].includes(chapter));
const root=path.resolve(__dirname,'..'),packet=path.resolve(process.env.HANQ_DELIVERABLES||path.join(root,'../deliverables'),`chapter${chapter}-mini`),pub=path.join(root,`media/vocabulary-mini/chapter-${String(chapter).padStart(3,'0')}-v1`);
const chapters=JSON.parse(fs.readFileSync(path.join(root,'media/vocabulary-chapters-v1.json')));chapters.chapters[chapter-1].examStatus='ready';
const bank=JSON.parse(fs.readFileSync(path.join(pub,'bank.json'))),manifest=JSON.parse(fs.readFileSync(path.join(packet,'audio-manifest.generated.json')));manifest.status='ready';manifest.records.forEach(a=>{a.playbackVerified=true;a.status='ready';});
const notes=chapters.chapters.flatMap(c=>c.wordIds).map(id=>({id,expression:'fixture '+id,part:'unclassified',partOfSpeech:'명사',meaning:'합성 단어',example:'Please check the schedule.',translation:'일정을 확인해 주세요.',structure:'check the schedule',synonyms:[]}));
const held=new Map(['index.html','media/account-ui.css','media/account-ui.js','media/api-client.js','media/characters.js'].map(f=>[f,cp.execFileSync('git',['show','HEAD:'+f],{cwd:root})]));
(async()=>{const browser=await chromium.launch();const results=[];try{for(const width of[320,390,1440]){const context=await browser.newContext({viewport:{width,height:900}}),p=await context.newPage(),errors=[];let mode='ready',writes=0,progressCalls=0;
 p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(12000);await p.addInitScript(()=>localStorage.setItem('hanqacct:signedIn','1'));
 await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='hanq-api.onrender.com'){
  const user={id:'synthetic-mini-entry',displayName:'합성 검수'};
  if(u.pathname.includes('/weakness-practice/')){assert.equal(r.request().method(),'GET');progressCalls++;if(mode==='offline')return r.abort();return r.fulfill({json:{bankId:bank.bankId,items:[],firstResult:null,...(mode==='old'?{}:{release:{ready:mode==='ready',contentVersion:1}})}});}
  if(u.pathname.endsWith('/practice'))return r.fulfill({json:{items:bank.questions.map(q=>({collectionId:'synthetic-options',number:q.number,displayNumber:String(q.number).padStart(4,'0'),part:q.part,groupId:q.groupId,groupQuestionNumbers:bank.groups.find(g=>g.id===q.groupId)?.questionNumbers||[q.number],sourceTitle:'합성 비교 화면',stem:q.part<=2?null:q.stem,options:q.choices.map(c=>({id:c.id,text:q.part<=2?c.id:c.text})),available:true,officiallyVerified:true,studyHistory:{recentResults:[]}}))}});
if(r.request().method()!=='GET'&&!u.pathname.endsWith('/refresh'))writes++;
  return r.fulfill({json:u.pathname.endsWith('/refresh')?{accessToken:'synthetic',user}:u.pathname.endsWith('/me')?{user,growth:{points:1000}}:u.pathname.endsWith('/toeic-notes')?{notes,archived:[]}:u.pathname.endsWith('/toeic-word-checks')?{ids:[],revision:1,legacyImported:true}:{items:[]}});
 }
 if(u.hostname==='hahiddo-company.s3.ap-northeast-2.amazonaws.com'){const a=manifest.records.find(a=>u.href===a.url);if(process.env.PRODUCTION)return a?r.continue():r.abort();return a?r.fulfill({path:path.resolve(packet,a.localPath),contentType:'audio/mpeg'}):r.abort();}
 if(u.hostname!=='hanq.vercel.app')return r.abort();
 if(!process.env.PRODUCTION&&u.pathname.endsWith('/vocabulary-chapters-v1.json'))return r.fulfill({json:chapters});
 if(!process.env.PRODUCTION&&u.pathname.endsWith('/audio-manifest.json'))return r.fulfill({json:manifest});
 if(u.pathname.endsWith('/toeic-supplement.js'))return r.fulfill({body:'window.HanqToeicSupplement={vocabularyEntries:function(){return []}}',contentType:'application/javascript'});
 if(process.env.PRODUCTION)return r.continue();const f=u.pathname==='/'?'index.html':u.pathname.slice(1);if(held.has(f))return r.fulfill({body:held.get(f),contentType:f.endsWith('.html')?'text/html':f.endsWith('.css')?'text/css':'application/javascript'});const local=path.join(root,f);return fs.existsSync(local)&&fs.statSync(local).isFile()?r.fulfill({path:local}):r.fulfill({status:404,body:''});});
 const cases=[];
 function metrics(selector){return p.locator(selector).evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {tag:n.tagName,text:n.textContent.slice(0,160),x:r.x,y:r.y,width:r.width,height:r.height,fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,minHeight:s.minHeight,display:s.display,padding:s.padding,borderRadius:s.borderRadius,borderWidth:s.borderWidth,gap:s.gap,children:[...n.children].map(c=>{const r=c.getBoundingClientRect(),s=getComputedStyle(c);return {tag:c.tagName,text:c.textContent.slice(0,60),x:r.x,y:r.y,width:r.width,height:r.height,fontSize:s.fontSize,display:s.display};})};}));}
 await p.goto('https://hanq.vercel.app/#toeic/notebook');await p.getByRole('button',{name:`Chapter ${chapter} 미니모의고사 50문항`,exact:true}).click();await p.locator('.vm-numbers button').first().waitFor();
 const styleKeys=['fontSize','fontWeight','lineHeight','minHeight','display','padding','borderRadius','borderWidth','gap'];
 for(const n of [1,6,12,18,21,42]){
  await p.locator('.vm-numbers button').nth(n-1).click();
  const choices=await metrics('.vm-panel .tc-answer-option');
  assert(choices.length===(n===6?3:[12,18].includes(n)?12:4));
  assert.equal(await p.locator('.vm-panel input[type=radio]').count(),0);
  assert.equal(await p.locator('.vm-translation,.vm-explanation,.tc-option-gloss,u').count(),0);
  if(n<=6)assert.deepEqual(await p.locator('.vm-choice-text').allTextContents(),n===6?['A','B','C']:['A','B','C','D']);
  assert(choices.every(c=>c.tag==='BUTTON'&&c.height>=(width<=600?44:40)&&c.height<=120&&c.display==='flex'&&c.fontSize==='18px'));
  const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert(!overflow);
  const first=p.locator('.vm-panel .tc-answer-option').first();await first.click();
  assert.equal(await first.getAttribute('aria-checked'),'true');
  // Selection persists across navigation/reload without grading or user API writes.
  await p.reload();await p.locator('.vm-numbers button').first().waitFor();
  assert.equal(await p.locator('.vm-panel .tc-answer-option').first().getAttribute('aria-checked'),'true');
  const anchor=[12,18].includes(n)?p.locator('.vm-group-item').first():p.locator('.vm-single-choices');
  await anchor.scrollIntoViewIfNeeded();await p.screenshot({path:OUT+'/mini-'+n+'-'+width+'.png'});
  cases.push({type:'mini',number:n,part:bank.questions[n-1].part,choices,overflow});
 }
 for(const n of [1,6,12,18,21,42]){
  await p.goto('https://hanq.vercel.app/#toeic/wrongnotes/'+String(n).padStart(4,'0'));await p.locator('.tc-answer-option').first().waitFor();
  const choices=await metrics('.tc-answer-option');await p.locator('.tc-question').first().scrollIntoViewIfNeeded();
  await p.screenshot({path:OUT+'/reference-'+n+'-'+width+'.png'});
  const actual=cases.find(c=>c.type==='mini'&&c.number===n).choices[0],reference=choices[0];
  for(const key of styleKeys)assert.equal(actual[key],reference[key],`Part ${bank.questions[n-1].part} ${width}px ${key}`);
  cases.push({type:'reference',number:n,choices,matchingStyleKeys:styleKeys});
 }
 assert.equal(writes,0);assert.deepEqual(errors,[]);results.push({width,cases,writes});await context.close();console.log('inspected',width);
}fs.writeFileSync(OUT+'/metrics.json',JSON.stringify({productionStatic:!!process.env.PRODUCTION,syntheticAPI:true,userBrowserAccess:false,realUserWrites:0,results},null,2));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
