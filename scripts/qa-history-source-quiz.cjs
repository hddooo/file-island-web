'use strict';
// Private local QA only. A candidate renderer can be tested without editing it.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),revision=path.resolve(process.argv[2]||''),output=path.resolve(process.argv[3]||''),renderer=path.resolve(process.argv[4]||path.join(root,'media/textbook-source-quiz.js')),css=path.resolve(process.argv[5]||path.join(root,'media/textbook-source-quiz.css'));
assert(revision.includes('private-data')&&output!==process.cwd(),'Provide private revision and QA output directories');fs.mkdirSync(output,{recursive:true});
const eraFilter=process.env.HISTORY_QA_ERA||null;
const quizzes=fs.readdirSync(path.join(revision,'semantic/quizzes')).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join(revision,'semantic/quizzes',f)))).filter(q=>!eraFilter||q.id===eraFilter);assert(quizzes.length,'Unknown or unavailable source era; refusing an unfiltered run');
(async()=>{const results=[];
 for(const [engine,type] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await type.launch({headless:true});
  for(const [width,height] of [[320,900],[390,900],[1440,1000],[844,390]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});await page.route('**/*',r=>r.request().resourceType()==='document'?r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html lang="ko"></html>'}):r.abort());await page.goto('https://history-source.invalid');
   await page.setContent('<!doctype html><html lang="ko"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:12px;font-family:Arial,"Apple SD Gothic Neo",sans-serif}main{max-width:760px;margin:auto}</style><main id="privateTextbook"></main></html>');
   await page.addStyleTag({path:css});await page.addStyleTag({path:path.join(root,'media/history-notes-design.css')});await page.addScriptTag({path:renderer});
   for(const data of quizzes){
    const result=await page.evaluate(async data=>{
     const host=document.querySelector('main');let saved={version:'isolated-'+data.source.sha256,revision:0,workspace:{cursor:0,status:'active',responses:{}}},writes=0;
     const options={loadProgress:async()=>structuredClone(saved),saveProgress:async body=>{writes++;for(const u of body.updates)saved.workspace.responses[u.itemId]={values:[...u.values],checkedSlots:[...u.checkedSlots],submitted:u.submitted,correct:null};saved.workspace.cursor=body.cursor;saved.workspace.status=body.status;saved.revision++;return structuredClone(saved);}};
     let c;try{c=HanqTextbookSourceQuiz.render(host,data,options);await c.ready;}catch(e){return {blocked:true,error:e.message};}
     const rows=[...host.querySelectorAll('[data-source-item-id]')],inputs=[...host.querySelectorAll('input')],heights=inputs.map(n=>n.getBoundingClientRect().height),fonts=inputs.map(n=>parseFloat(getComputedStyle(n).fontSize)),controlHeights=[...host.querySelectorAll('button,summary')].map(n=>n.getBoundingClientRect().height).filter(h=>h>0);
     if(inputs.length>1){inputs[0].focus();inputs[0].dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));if(document.activeElement!==inputs[1])throw Error('Enter focus order');}
     for(let i=0;i<data.items.length;i++){
      const item=data.items[i],slots=item.kind==='classification'?item.responseSlots:item.blanks.flatMap(b=>b.parts||[b]),nodes=[...rows[i].querySelectorAll('input')];
      if(nodes.length!==slots.length)throw Error('Source response-slot count');
      nodes.forEach((n,j)=>{n.value=slots[j].answerIds.map(id=>item.answers.find(a=>a.id===id).text).join(item.kind==='sequence'?(item.answer.sequenceSeparator||''):', ');n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('blur'));});
     }
     const matches=host.querySelectorAll('.textbook-source-inline-feedback[data-result="match"]').length;if(matches!==inputs.length)throw Error('Canonical source answers do not all grade');
     await c.prepareLeave();if(saved.workspace.status!=='paused'||Object.keys(saved.workspace.responses).length!==data.items.length)throw Error('Paused in-memory save lost source responses');c.cleanup();
     c=HanqTextbookSourceQuiz.render(host,data,options);await c.ready;
     if(host.querySelector('.textbook-source-review').hidden)throw Error('Paused source review missing');host.querySelector('.textbook-source-quiz-resume').click();
     if([...host.querySelectorAll('input')].some(n=>!n.value))throw Error('Paused resume lost source response');
     const result={blocked:false,items:rows.length,responseSlots:inputs.length,canonicalAnswersMatched:matches,pausedResumePreserved:true,inMemorySaves:writes,overflow:document.documentElement.scrollWidth>innerWidth+1,minInputHeight:Math.min(...heights),minControlHeight:Math.min(...controlHeights),minInputFont:Math.min(...fonts),allInputsLabelled:inputs.every(n=>n.getAttribute('aria-label')&&n.getAttribute('aria-describedby')),reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches};
     window.qaController=c;return result;
    },data);
    results.push({engine,width,height,id:data.id,...result});
    if(!result.blocked){assert(!result.overflow,JSON.stringify(results.at(-1)));assert(result.allInputsLabelled&&result.minInputFont>=16);if(engine==='Chromium'&&width===320&&['goryeo','opening','prehistory'].includes(data.id))await page.screenshot({path:path.join(output,`${data.id}-${width}.png`),fullPage:true});await page.evaluate(()=>window.qaController.cleanup());}
   }
   console.log(`${engine} ${width}x${height}: ${quizzes.length} era quizzes checked`);await page.close();
  }await browser.close();
 }
 const digest=p=>require('node:crypto').createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 const report={eraFilter,scope:'Isolated real-browser source quizzes with product reading design CSS; renderer and CSS paths explicit; all storage adapters remain in memory; no API, account, DB, XP or production I/O.',rendererSha256:digest(renderer),rendererIsProduct:renderer===path.join(root,'media/textbook-source-quiz.js'),cssSha256:digest(css),cssIsProduct:css===path.join(root,'media/textbook-source-quiz.css'),views:results.length,blocked:results.filter(r=>r.blocked).length,touchTargetBelow44:results.filter(r=>!r.blocked&&(r.minInputHeight<44||r.minControlHeight<44)).length,results};fs.writeFileSync(path.join(output,'quiz-browser-results.json'),JSON.stringify(report,null,2));assert.equal(report.blocked,0,'Candidate renderer blocked source forms; see report');assert.equal(report.touchTargetBelow44,0,'Source controls must retain touch targets');
})().catch(e=>{console.error(e);process.exitCode=1;});
