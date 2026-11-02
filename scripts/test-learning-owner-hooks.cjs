'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),nap=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const dom=new JSDOM('<main></main>',{url:'https://fixture.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
try{
 for(const file of ['exam-pool','history-readable','learning-reader'])w.eval(fs.readFileSync(root+'/media/'+file+'.js','utf8'));
 const code=fs.readFileSync(root+'/media/account-ui.js','utf8'),start=code.indexOf('  function questionHtml('),end=code.indexOf('\n  function ',start+1);assert(start>=0&&end>start);const fn=code.slice(start,end);
 w.eval("var R=function(){return null},SYM=['','①','②','③','④','⑤'];var esc=function(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]});};"+fn);
 const q=w.HANQ_EXAM_POOL.questions['exam-70-03'],order=[5,1,3,2,4].map(n=>q.id+'-option-'+n),host=w.document.querySelector('main');
 host.innerHTML=w.questionHtml({kind:'mock',questionId:q.id,version:q.v,item:q,optionOrder:order},order[1],{correctOptionId:order[0],optionId:order[1],correct:false},'fixture');await nap(40);
 assert.equal(host.querySelectorAll('.lr-choice-text').length,5);assert.deepEqual(Array.from(host.querySelectorAll('[data-option]'),x=>x.dataset.option),order);
 assert.equal(host.querySelector('[data-option="'+order[0]+'"]').getAttribute('aria-label').endsWith(' · 정답'),true);
 assert.equal(host.querySelector('[aria-checked="true"]').dataset.option,order[1]);assert.equal(host.querySelectorAll('button:disabled').length,5);
 host.innerHTML=w.questionHtml({kind:'mock',questionId:q.id,version:'stale',item:q},null,null,'stale');await nap(40);assert.equal(host.querySelectorAll('.lr-choice-text').length,0);assert(host.querySelector('.mock-image'));
 const inv=JSON.parse(fs.readFileSync(root+'/docs/history-readability-inventory.json'));let fallbacks=0;for(const row of inv.questions.filter(q=>q.status!=='verified-text')){assert.equal(w.HanqLearningReader.historyData(w.HANQ_EXAM_POOL.questions[row.id]),null,row.id);fallbacks++;}assert.equal(fallbacks,78);
 console.log(JSON.stringify({passed:true,accountSourceAndVersion:true,shuffledChoiceIdsAndSelectedPreserved:true,correctAnswerAriaPreserved:true,staleVersionFallback:true,all78OriginalFallbacks:true}));
}finally{w.requestAnimationFrame=()=>0;await nap(40);w.close();}})().catch(e=>{console.error(e);process.exitCode=1});
