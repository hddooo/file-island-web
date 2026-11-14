/* Local, isolated original-image QA. No live accounts or writes. Screenshots stay outside public output. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.QA_OUT||'/tmp/hanq-original-images-qa';
const html=fs.readFileSync(root+'/index.html','utf8');
const css=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n')+'\n'+[...html.matchAll(/<link[^>]+href="\/?(media\/[^"?]+\.css)[^"]*"/g)].map(m=>fs.readFileSync(root+'/'+m[1],'utf8')).join('\n');
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',runId='10000000-0000-4000-8000-000000000001';
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});const rows=[],errors=[];
async function pageFor(width,height,mode,hash,files){
 const p=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>{const u=new URL(r.request().url()),f=path.resolve(root,'.'+u.pathname);if(u.hostname==='original.fixture'&&u.pathname==='/')return r.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><main id="app"><section id="mount"></section><figure class="textbook-semantic-figure"><img id="unrelated" src="/media/exam/70-02.webp"></figure><textarea id="draft">temporary answer</textarea></main>'});if(u.hostname==='original.fixture'&&f.startsWith(root+path.sep)&&fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});return r.abort();});
 await p.goto('https://original.fixture/'+hash);await p.addStyleTag({content:css+'\nbody{margin:0}#app{width:100%;max-width:1100px;margin:auto;box-sizing:border-box}'});
 await p.evaluate(mode=>{document.documentElement.dataset.companyMode=mode;document.documentElement.toggleAttribute('data-company-history',true);document.querySelector('#app').setAttribute('data-company-history','');},mode);
 for(const file of files)await p.addScriptTag({path:root+'/media/'+file+'.js'});return p;
}
async function zoom(p,img){
 await img.waitFor();await p.waitForFunction(()=>[...document.querySelectorAll('#mount img[data-lr-zoom]')].some(i=>i.naturalWidth));
 await img.click();await p.locator('.lr-image-dialog').waitFor();assert.equal(await p.locator('.lr-image-dialog img').getAttribute('src'),await img.getAttribute('src'));
 await p.locator('.lr-image-dialog img').click({position:{x:20,y:20}});assert.equal(await p.locator('.lr-image-dialog').count(),0);assert(await img.evaluate(i=>i===document.activeElement||i.closest('a')===document.activeElement));
 await img.focus();await p.keyboard.press('Enter');await p.locator('.lr-image-dialog').waitFor();await p.keyboard.press('Escape');assert.equal(await p.locator('.lr-image-dialog').count(),0);
}
try{
 for(const [width,height] of [[320,740],[390,844],[1440,900],[740,320]])for(const mode of ['on','off']){
  const p=await pageFor(width,height,mode,'#battle/'+id,['exam-pool','history-readable','learning-reader','battle-island']);
  await p.evaluate(({id})=>{
   const f={name:'synthetic player',character:'botamon',characterName:'fixture',hp:50,maxHp:50,atk:10,def:5,luk:1,stageIndex:1};let rev=1;
   const q=HANQ_EXAM_POOL.questions['exam-72-47'];window.matchFixture={id,subject:'history',side:'left',status:'playing',serverNow:Date.now(),fighters:{left:f,right:f},ready:{left:true,right:true},round:1,start:Date.now()-1000,deadline:Date.now()+600000,submitted:{left:false,right:false},locked:{left:[],right:[]},myAnswers:[],question:{part:0,version:q.v,prompt:'제72회 47번',items:[{id:'1',number:47,prompt:'제72회 47번',choices:q.options.map(o=>({id:o.id,text:String(o.number)}))}],images:[q.commonImage,q.image],audio:null},result:null,winner:null,grace:null};
   window.writes=[];window.fixtureApi={state:()=>({signedIn:true,ownerId:'fixture'}),onChange:cb=>(window.authChanged=cb,()=>{}),battleStream:cb=>(window.snapshot=cb,()=>{}),battle:async(method,p,body)=>{if(p==='/enter')return{matchId:id,serverNow:Date.now()};if(method!=='GET'){writes.push({method,p,body});return new Promise(resolve=>window.resolveAnswer=resolve);}return {...matchFixture,revision:++rev};}};HanqBattle.mount(document.querySelector('#mount'),fixtureApi,()=>{});
  },{id});
  await p.waitForFunction(()=>document.querySelectorAll('.bi-question-image').length===2&&[...document.querySelectorAll('.bi-question-image')].every(i=>i.naturalWidth>0&&!i.hidden));
  assert.equal(await p.locator('.bi-question-image:visible').count(),2);assert.equal(await p.locator('.lr-history-text,details.lr-history-original,.lr-choice-text').count(),0);
  await p.locator('.bi-choice').nth(2).click();const selected=await p.locator('.bi-choice[aria-pressed=true]').getAttribute('data-option');
  const measure=()=>p.evaluate(()=>{const pane=document.querySelector('.bi-history-materials'),controls=[...document.querySelectorAll('.bi-choice,.bi-submit:not([hidden])')];return {scrollTop:pane.scrollTop,scrollHeight:pane.scrollHeight,clientHeight:pane.clientHeight,roundScroll:document.querySelector('.bi-round').scrollTop,rects:controls.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};}),viewHeight:visualViewport.height};});
  const before=await measure();assert(before.clientHeight>40,JSON.stringify(before));assert(before.scrollHeight>before.clientHeight,'source requires independent scrolling');
  await p.locator('.bi-history-materials').evaluate(e=>e.scrollTop=e.scrollHeight);const after=await measure();assert(after.scrollTop>0);assert.deepEqual(after.rects,before.rects);assert.equal(after.roundScroll,0);
  for(const r of after.rects){assert(r.height>=44&&r.width>=44,JSON.stringify(r));assert(r.y>=0&&r.bottom<=after.viewHeight,JSON.stringify({r,after}));}
  await p.locator('.bi-history-materials').evaluate(e=>e.scrollTop=0);const scroll=await p.locator('.bi-history-materials').evaluate(e=>e.scrollTop);await zoom(p,p.locator('.bi-question-image').first());assert.equal(await p.locator('.bi-history-materials').evaluate(e=>e.scrollTop),scroll);assert.equal(await p.locator('.bi-choice[aria-pressed=true]').getAttribute('data-option'),selected);assert.equal(await p.locator('.bi-fullscreen-panel').count(),1,'Escape on image leaves battle fullscreen intact');assert.equal(await p.locator('#draft').inputValue(),'temporary answer');
  // A pan gesture must keep the image open, unlike an actual tap.
  await p.locator('.bi-question-image').first().click();const full=p.locator('.lr-image-dialog img'),r=await full.boundingBox();await p.mouse.move(Math.max(15,r.x+30),r.y+30);await p.mouse.down();await p.mouse.move(Math.max(15,r.x+90),r.y+60);await p.mouse.up();assert.equal(await p.locator('.lr-image-dialog').count(),1);await p.getByRole('button',{name:'닫기',exact:true}).click();
  await p.screenshot({path:out+'/battle-'+width+'x'+height+'-'+mode+'.png'});
  // Browser chrome / keyboard changes the available height while retaining the answer nodes.
  await p.setViewportSize({width,height:Math.max(280,height-100)});const short=await measure();for(const r of short.rects)assert(r.y>=0&&r.bottom<=short.viewHeight,JSON.stringify(short));assert.equal(await p.locator('.bi-choice[aria-pressed=true]').getAttribute('data-option'),selected);
  await p.locator('.bi-submit').click();assert.equal(await p.evaluate(()=>writes.length),1);assert(await p.locator('.bi-choice').first().isDisabled());assert(await p.locator('.bi-submit').isDisabled());
  await p.evaluate(()=>snapshot('snapshot',{...matchFixture,revision:20,myAnswers:[{id:'1',optionId:document.querySelector('.bi-choice[aria-pressed=true]').dataset.option}],locked:{left:['1'],right:[]}}));assert.equal(await p.locator('.bi-submission-done:visible').count(),1);assert(await p.locator('.bi-choice').first().isDisabled());
  await p.locator('.bi-question-image').first().click();await p.evaluate(()=>HanqBattle.stop());assert.equal(await p.locator('.lr-image-dialog').count(),0,'source release closes zoom before blob revocation');
  rows.push({view:'battle',width,height,mode,sourceImages:2,independentImageScroll:true,fixed44pxControls:true,resize:true,tapEscapeFocusAndSelection:true,pendingAndLocked:true});await p.close();
 }
 for(const width of [320,390,1440])for(const mode of ['on','off'])for(const view of ['legacy','formal','notebook','round','battle-wrongnotes']){
  const hash={legacy:'#chapter/prehistory/mock',formal:'#formal-exams/review-'+runId,notebook:'#wrongnotes',round:'#formal-exams/70/materials','battle-wrongnotes':'#toeic/wrongnotes/0'}[view];
  const p=await pageFor(width,900,mode,hash,['exam-pool','history-readable','learning-reader','formal-exams','cbt-round-materials','cbt-wrong-notebook','battle-wrongnotes']);
  await p.evaluate(async({view,runId})=>{
   const host=document.querySelector('#mount'),q=HANQ_EXAM_POOL.questions['exam-70-03'];window.requests=[];const blob=await fetch('/'+q.image).then(r=>r.blob());
   const base='/api/v1/cbt/runs/'+runId+'/questions/0',item={questionId:q.id,version:q.v,exam:q.exam,number:q.number,position:0,points:q.points,runId,starred:true,everWrong:true,selectedOptionId:q.options[q.answer%5].id,options:q.options,image:base+'/image',review:{status:'wrong',correctNumber:q.answer,correctOptionId:q.options[q.answer-1].id}};
   window.imageOwner={signedIn:true,ownerId:'fixture',epoch:1};const api={enabled:()=>true,state:()=>imageOwner,onChange:cb=>(window.onAuth=cb,()=>{}),init:async()=>{},cbtImage:async()=>blob,cbt:async(method,url)=>{requests.push({method,url});if(method!=='GET')throw Error('unexpected write');if(view==='formal')return url.endsWith('/stars')?{signature:JSON.stringify([[q.id,q.v,q.options.map(o=>o.id)]]),flags:[false]}:{run:{id:runId,round:70,kind:'review',status:'active',answerMode:'batch',currentPosition:0,answered:1,paused:false,remainingMs:4800000,checkpointVersion:0},items:[{...item,selectedOptionId:null}]};return view==='round'?{scope:'exam-starred-or-ever-wrong',round:70,items:[item],hasMore:false,pendingStarCount:0,resetAt:null}:{scope:'finalized-exam-selected-wrong',limit:500,hasMore:false,items:[item]};},battle:async()=>({items:[{subject:'history',source:'제70회 3번',images:[q.image],part:0,item:{id:'1',prompt:'제70회 3번',choices:q.options.map(o=>({id:o.id,text:String(o.number)}))},recentResults:[],originalWrongCount:1}]})};
   if(view==='legacy'){host.innerHTML='<article class="mock-question" data-question="'+q.id+'" data-version="'+q.v+'"><div class="mock-image-wrap"><img class="mock-image" src="/'+q.image+'" alt="제70회 3번 원본"></div><div class="mock-choices"></div></article>';host.querySelector('img').setAttribute('src',q.image);q.options.forEach(o=>{const b=document.createElement('button');b.dataset.option=o.id;b.textContent=o.number;b.setAttribute('aria-label',o.number+'번 · 보존 라벨');b.onclick=()=>b.setAttribute('aria-pressed','true');host.querySelector('.mock-choices').append(b);});}
   if(view==='formal')HanqFormalExams.mount(host,{api,onHome(){},onAccount(){},onRoute(){},onNotes(){},onLearn(){}},'review-'+runId);
   if(view==='notebook'){window.ctl=HanqCbtWrongNotebook.mount(host,{api});await ctl.ready;host.querySelector('details[data-notebook-question]').open=true;}
   if(view==='round'){window.ctl=HanqCbtRoundMaterials.mount(host,{api,round:70});await ctl.ready;}
   if(view==='battle-wrongnotes')window.ctl=HanqBattleWrongnotes.mount(host,api,()=>{});
  },{view,runId});
  const img=p.locator('#mount img').first();await p.waitForFunction(()=>document.querySelector('#mount img')?.naturalWidth>0&&document.querySelector('#mount img')?.dataset.lrZoom);assert(await img.isVisible(),view+' '+mode);assert.equal(await p.locator('.lr-history-text,.lr-choice-text,details.lr-history-original').count(),0);
  const buttons=p.locator('#mount [data-option],#mount [aria-checked],#mount .mock-choices button');if(await buttons.count())await buttons.first().click();
  await zoom(p,img);if(mode==='on')assert(!(await p.locator('#unrelated').isVisible()),'unrelated content stays hidden');assert.equal(await p.locator('#draft').inputValue(),'temporary answer');assert(!(await p.evaluate(()=>requests.some(r=>r.method!=='GET'))));assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)),view+' overflow');
  if(view==='legacy'){assert.equal(await p.locator('.mock-choices button').first().getAttribute('aria-label'),'1번 · 보존 라벨');assert.equal(await p.locator('.mock-choices button[aria-pressed=true]').count(),1);}
  if(view==='formal'){assert.equal(await p.locator('[data-option][aria-pressed=true]').count(),1);await img.click();await p.evaluate(()=>HanqFormalExams.stop());assert.equal(await p.locator('.lr-image-dialog').count(),0);}
  if(view==='notebook'||view==='round'){await img.click();await p.evaluate(()=>{imageOwner={signedIn:false,ownerId:null,epoch:2};onAuth();});assert.equal(await p.locator('.lr-image-dialog').count(),0);}
  rows.push({view,url:hash,width,mode,sourceVisible:true,noOCR:true,zoomTapKeyboardFocus:true,unrelatedImagePolicyPreserved:true});await p.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/results.json',JSON.stringify({rows,errors},null,2));console.log(JSON.stringify({passed:true,cases:rows.length,rows,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
