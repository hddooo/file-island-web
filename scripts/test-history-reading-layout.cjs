'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('../.test-tools/node_modules/jsdom');
require('../media/textbook-source-quiz');
const quiz=global.HanqTextbookSourceQuiz,renderer=require('../media/textbook-semantic');
const OLD='35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442',NEW='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
const pins={ [OLD]:'6892d35b75b9dc6580050bb950242e77ebdb0f2f40d01d13072f0ac5ea1ba3c4',[NEW]:'042ee684d7e9ae89cc2afd4b3964b1568806432f361dc99b39ad9f88f4d6ca5a' };
const clone=x=>JSON.parse(JSON.stringify(x));let checks=0;
function eq(a,b,m){assert.deepEqual(a,b,m);checks++;}
function ok(a,m){assert(a,m);checks++;}
function fixture(source){
 const topics=['early-joseon','late-joseon','central-offices','society-diplomacy','society-comparison','economy-comparison','culture'],sizes=source===OLD?[24,50,14,11,14,18,33]:[26,50,15,13,14,18,36];
 let order=0;
 return {schemaVersion:'hanq-source-quiz/1',id:'joseon',title:'조선 합성 회귀 자료',source:{sha256:source,pdfPages:[1],printedPages:[1]},subtopics:topics.map(id=>({id,title:id})),items:topics.flatMap((topic,t)=>Array.from({length:sizes[t]},(_,j)=>{
  const id='synthetic:'+topic+':'+(j+1),aid=id+':answer',bid=id+':blank';
  return {id,order:++order,subtopicId:topic,originalNumber:j+1,pdfPage:1,printedPage:1,kind:'fill-in',text:'합성 문제 (   )',sourceText:'합성 문제 (   )',segments:[{type:'text',text:'합성 문제 '},{type:'blank',id:bid,placeholder:'(   )',answerIds:[aid]}],blanks:[{id:bid,placeholder:'(   )',answerIds:[aid]}],answer:{text:'합성 답',parts:['합성 답'],orderMatters:false},answers:[{id:aid,text:'합성 답'}],verification:{status:'source-verified',textVerified:true,answerPairVerified:true}};
 }))};
}
function line(text){return {spans:[{text}]};}
function sourcePage(source){
 const cell=(id,col,text,header=false)=>({id,columnIndex:col,header,lines:[line(text)]});
 return {schemaVersion:'hanq-semantic/1',sourceSha256:source,pdfPage:59,blocks:[
  {id:'annotation-4',type:'text',lines:[line('사건 ④')],sourceParentTableId:'table',sourceRowIndices:[3],transcriptionAudit:{sourceVerified:true,sourceSha256:source,sourcePdfPage:59}},
  {id:'annotation-1',type:'text',lines:[line('사건 ①')],sourceParentTableId:'table',sourceRowIndices:[1],transcriptionAudit:{sourceVerified:true,sourceSha256:source,sourcePdfPage:59}},
  {id:'table',type:'table',columnCount:2,rows:Array.from({length:4},(_,i)=>({cells:[cell('label-'+i,0,'대상 '+i,true),cell('content-'+i,1,'해당 본문 '+i)]}))},
  {id:'diagram',type:'table',columnCount:1,layoutRole:'source-diagram',sourceParentTableId:'table',sourceRowIndices:[2],transcriptionAudit:{sourceVerified:true,sourceSha256:source,sourcePdfPage:59},rows:['기관 A','승인 ↓\n↑ 건의','기관 B','명령 ↓\n↑ 보고','기관 C'].map((text,i)=>({cells:[cell('diagram-'+i,0,text)]}))}
 ],sourceBlanks:[],generatedPractice:[]};
}
async function run(){
 await require('./test-textbook-source-branches.cjs').run();
 const dom=new JSDOM('<main></main>',{url:'https://synthetic.test'}),w=dom.window,host=w.document.querySelector('main');w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const source of [OLD,NEW]){
  const d=fixture(source),before=JSON.stringify(d),initial=d.items.findIndex(i=>i.subtopicId==='central-offices'&&i.originalNumber===1);let state={version:pins[source],revision:3,workspace:{cursor:initial,status:'active',responses:{}}},writes=[];
  const marked=d.items.findIndex(i=>i.subtopicId==='culture'&&i.originalNumber===1);state.workspace.responses[d.items[marked].id]={values:['저장된 오답'],submitted:true,checkedSlots:[true]};
  const options={loadProgress:async()=>clone(state),saveProgress:async body=>{writes.push(clone(body));for(const u of body.updates)state.workspace.responses[u.itemId]=clone(u);state.workspace.cursor=body.cursor;state.workspace.status=body.status;state.revision++;return clone(state);}};
  let c=quiz.render(host,d,options);await c.ready;
  const groups=[...host.querySelectorAll('.textbook-joseon-section')],expected=source===OLD?[59,14,91]:[64,14,94];
  eq(groups.map(g=>g.dataset.joseonGroup),['early','common','late'],'one page, early/common/late');
  eq(groups.map(g=>g.querySelectorAll('[data-source-item-id]').length),expected,'source-specific complete grouping');
  const ids=[...host.querySelectorAll('[data-source-item-id]')].map(n=>n.dataset.sourceItemId);
  eq(ids.length,d.items.length,'full coverage');eq(new Set(ids).size,d.items.length,'no duplicated graded IDs');eq([...ids].sort(),d.items.map(i=>i.id).sort(),'union equals canonical source');
  eq(JSON.stringify(d),before,'canonical bytes unchanged');
  const field=host.querySelectorAll('.textbook-joseon-section-early input')[source===OLD?23:25],visible=[...host.querySelectorAll('.textbook-source-quiz-input')],next=visible[visible.indexOf(field)+1];
  field.focus();field.value='합성 답';field.dispatchEvent(new w.Event('input'));field.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  eq(w.document.activeElement,next,'Enter follows displayed order across canonical reordering');await c.prepareLeave();
  const targetId=next.closest('[data-source-item-id]').dataset.sourceItemId,targetIndex=d.items.findIndex(i=>i.id===targetId);
  eq(writes.at(-1).cursor,targetIndex,'saved cursor is canonical index');ok(writes.every(body=>body.version===pins[source]),'version preserved in every write');
  c.cleanup();c=quiz.render(host,d,options);await c.ready;
  await new Promise(r=>setTimeout(r,0));
  const filter=host.querySelector('.textbook-source-review-filter input');ok(filter,'paused saved workspace restores review');filter.checked=true;filter.dispatchEvent(new w.Event('change'));
  const wrong=host.querySelector('[data-source-review-item-id="'+d.items[marked].id+'"]');ok(wrong,'wrong item remains visible');eq(wrong.closest('[data-joseon-group]').dataset.joseonGroup,'early','saved wrong answer stays in own group');
  host.querySelector('.textbook-source-quiz-resume').click();eq(w.document.activeElement.closest('[data-source-item-id]').dataset.sourceItemId,targetId,'resume uses canonical cursor');
  c.cleanup();state.version='unknown';state.workspace.status='active';c=quiz.render(host,d,options);await c.ready;eq(host.querySelectorAll('[data-joseon-group]').length,0,'unknown version keeps original order');c.cleanup();
 }
 for(const source of [OLD,NEW]){
  const p=sourcePage(source),before=JSON.stringify(p);let c=renderer.render(host,p);await c.ready;
  eq(host.querySelectorAll('[data-source-block="annotation-1"]').length,1,'annotation appears once');
  eq(host.querySelector('[data-source-block="annotation-1"]').closest('[data-source-cell]').dataset.sourceCell,'content-1','annotation attached to verified parent row');
  eq(host.querySelector('[data-source-block="annotation-4"]').closest('[data-source-cell]').dataset.sourceCell,'content-3','source relationship overrides extraction order');
  const graph=host.querySelector('[data-source-block="diagram"]');eq(graph.closest('[data-source-cell]').dataset.sourceCell,'content-2','diagram stays with its source body');ok(graph.textContent.includes('승인 ↓\n↑ 건의')&&graph.textContent.includes('명령 ↓\n↑ 보고'),'all directional labels preserved');
  eq(JSON.stringify(p),before,'semantic source immutable');ok(host.querySelector('.textbook-semantic-meta').hidden,'static provenance hidden, metadata retained');c.cleanup();
  for(const mutate of [p=>p.blocks[0].sourceRowIndices=[1,3],p=>p.blocks[0].transcriptionAudit.sourceSha256='0'.repeat(64),p=>p.blocks[0].sourceRowIndices=[99],p=>p.blocks[2].rows[0].cells[1].id='content-3']){
   const bad=sourcePage(source);mutate(bad);c=renderer.render(host,bad);await c.ready;eq(host.querySelector('[data-source-block="annotation-4"]').closest('[data-source-cell]'),null,'ambiguous link is not guessed');eq(host.querySelectorAll('[data-source-block="annotation-4"]').length,1,'ambiguous source remains available once');c.cleanup();
  }
 }
 dom.window.close();console.log(JSON.stringify({checks,failures:0,fixtures:'synthetic only; source pins are dispatch fixtures, not evidence of revised corpus reproduction'}));
}
if(require.main===module)run().then(()=>require('./test-history-joseon-source-layout.cjs').run()).then(()=>require('./test-history-coordinate-diagram.cjs').run()).then(()=>require('./test-source-quiz-prompt-styles.cjs').run()).catch(e=>{console.error(e.stack);process.exitCode=1;});
module.exports={fixture,sourcePage,OLD,NEW,pins};
