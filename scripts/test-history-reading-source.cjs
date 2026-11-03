'use strict';
// Opt-in, local read-only corpus qualification. Never imports textbook bytes into Git.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {JSDOM}=require('../.test-tools/node_modules/jsdom');require('../media/textbook-source-quiz');
const {OLD,NEW,pins}=require('./test-history-reading-layout.cjs');
(async()=>{
 if(!process.argv[2])throw Error('Pass a private semantic root explicitly');
 const root=path.resolve(process.argv[2]),p=path.join(root,'quizzes/joseon.json'),data=JSON.parse(fs.readFileSync(p)),before=JSON.stringify(data),digest=crypto.createHash('sha256').update(JSON.stringify({schema:data.schemaVersion,source:data.source,items:data.items})).digest('hex');
 assert.equal(digest,pins[data.source.sha256],'exact canonical quiz version required');
 const expected=data.source.sha256===OLD?[59,14,91]:data.source.sha256===NEW?[64,14,94]:null;assert(expected);
 const dom=new JSDOM('<main></main>',{url:'https://synthetic.test'}),w=dom.window,host=w.document.querySelector('main');w.HTMLElement.prototype.scrollIntoView=function(){};
 let saved={version:digest,revision:0,workspace:{cursor:0,status:'active',responses:{}}},calls=[];
 const options={loadProgress:async()=>structuredClone(saved),saveProgress:async body=>{calls.push(structuredClone(body));for(const u of body.updates)saved.workspace.responses[u.itemId]=structuredClone(u);saved.workspace.cursor=body.cursor;saved.workspace.status=body.status;saved.revision++;return structuredClone(saved);}};
 let c=global.HanqTextbookSourceQuiz.render(host,data,options);await c.ready;
 const groups=[...host.querySelectorAll('.textbook-joseon-section')];assert.deepEqual(groups.map(g=>g.querySelectorAll('[data-source-item-id]').length),expected);
 const ids=[...host.querySelectorAll('[data-source-item-id]')].map(n=>n.dataset.sourceItemId);assert.equal(new Set(ids).size,data.items.length);assert.deepEqual([...ids].sort(),data.items.map(i=>i.id).sort());
 for(const item of data.items){
  const card=[...host.querySelectorAll('[data-source-item-id]')].find(n=>n.dataset.sourceItemId===item.id),slots=item.kind==='classification'?item.responseSlots:item.blanks.flatMap(b=>b.parts||[b]),inputs=[...card.querySelectorAll('input')];assert.equal(inputs.length,slots.length);
  inputs.forEach((n,i)=>{n.value=slots[i].answerIds.map(id=>item.answers.find(a=>a.id===id).text).join(item.kind==='sequence'?(item.answer.sequenceSeparator||''):', ');n.dispatchEvent(new w.Event('input'));n.dispatchEvent(new w.Event('blur'));});assert([...card.querySelectorAll('.textbook-source-inline-feedback')].every(n=>n.dataset.result==='match'),'canonical answer unchanged');
 }
 const visible=[...host.querySelectorAll('.textbook-source-quiz-input')],last=visible.at(-1),itemId=last.closest('[data-source-item-id]').dataset.sourceItemId;last.focus();await c.prepareLeave();assert.equal(saved.workspace.cursor,data.items.findIndex(i=>i.id===itemId));assert.equal(Object.keys(saved.workspace.responses).length,data.items.length);assert(calls.every(b=>b.version===digest));
 c.cleanup();c=global.HanqTextbookSourceQuiz.render(host,data,options);await c.ready;host.querySelector('.textbook-source-quiz-resume').click();assert.equal(w.document.activeElement.closest('[data-source-item-id]').dataset.sourceItemId,itemId);assert.equal(JSON.stringify(data),before);c.cleanup();dom.window.close();
 console.log(JSON.stringify({passed:true,source:data.source.sha256,version:digest,items:data.items.length,groups:expected,missing:0,duplicates:0,canonicalAnswers:true,canonicalCursor:true,savedResume:true,productionWrites:0}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
