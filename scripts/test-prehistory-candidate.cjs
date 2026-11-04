'use strict';
// Opt-in private corpus QA. Emits metadata only; uses in-memory progress.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('../.test-tools/node_modules/jsdom');
const summary=require('../media/textbook-source-summary');
require('../media/textbook-source-quiz');
const SOURCE='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
(async()=>{
  assert(process.argv[2],'Pass the private prehistory revision explicitly');
  const root=path.resolve(process.argv[2]),read=f=>JSON.parse(fs.readFileSync(path.join(root,'semantic',f))),manifest=read('manifest.json'),quiz=read('quizzes/prehistory.json'),before=JSON.stringify(quiz),profile=manifest.sourceSummariesByQuiz.prehistory;
  assert.equal(summary.validate(manifest,quiz,profile,SOURCE,'prehistory'),profile);
  const version=await summary.canonicalVersion(quiz);
  assert.equal(version,'f0c14516b3743764d4608ae58f4be57d14b47562d57b919b384b612fa0dd9339');
  assert.equal(profile.groups.reduce((n,g)=>n+g.rows.length,0),37);
  assert.deepEqual(manifest.pages.map(p=>p.pdfPage),[8,9,10,11,12,13,14,15]);
  assert.deepEqual(manifest.quizzes.map(q=>q.id),['prehistory']);
  const sequence=quiz.items.find(i=>i.kind==='sequence'),page=summary.pageFor(profile,quiz);
  assert.equal(sequence.events.length,4);
  const clue=page.blocks.flatMap(b=>b.rows||[]).flatMap(r=>r.cells).flatMap(c=>c.lines||[]).flatMap(l=>l.spans).map(s=>s.text).find(t=>t.startsWith(sequence.text));
  assert(sequence.events.every(e=>clue.includes(e.sourceText)),'Summary retains every original sequence choice');
  const dom=new JSDOM('<main></main>',{url:'https://synthetic.invalid'}),w=dom.window,host=w.document.querySelector('main');
  w.HTMLElement.prototype.scrollIntoView=function(){};
  let saved={version,revision:0,workspace:{cursor:0,status:'active',responses:{}}};const writes=[];
  const options={loadProgress:async()=>structuredClone(saved),saveProgress:async body=>{writes.push(structuredClone(body));for(const update of body.updates)saved.workspace.responses[update.itemId]=structuredClone(update);saved.workspace.cursor=body.cursor;saved.revision++;return structuredClone(saved);}};
  let controller=global.HanqTextbookSourceQuiz.render(host,quiz,options);await controller.ready;
  assert.equal(host.querySelectorAll('[data-source-item-id]').length,37);
  for(const item of quiz.items){
    const card=[...host.querySelectorAll('[data-source-item-id]')].find(n=>n.dataset.sourceItemId===item.id),slots=item.blanks.flatMap(b=>b.parts||[b]),inputs=[...card.querySelectorAll('input')];
    assert.equal(inputs.length,slots.length);
    inputs.forEach((input,i)=>{input.value=slots[i].answerIds.map(id=>item.answers.find(a=>a.id===id).text).join(item.kind==='sequence'?(item.answer.sequenceSeparator||''):', ');input.dispatchEvent(new w.Event('input'));input.dispatchEvent(new w.Event('blur'));});
    assert([...card.querySelectorAll('.textbook-source-inline-feedback')].every(n=>n.dataset.result==='match'));
  }
  const last=host.querySelectorAll('input');last[last.length-1].focus();await controller.prepareLeave();
  assert.equal(saved.workspace.cursor,36);assert.equal(Object.keys(saved.workspace.responses).length,37);assert(writes.every(b=>b.version===version));
  controller.cleanup();controller=global.HanqTextbookSourceQuiz.render(host,quiz,options);await controller.ready;
  host.querySelector('.textbook-source-quiz-resume').click();assert.equal(w.document.activeElement.closest('[data-source-item-id]').dataset.sourceItemId,quiz.items.at(-1).id);
  controller.cleanup();dom.window.close();assert.equal(JSON.stringify(quiz),before);
  console.log(JSON.stringify({passed:true,source:SOURCE,items:37,summaryRows:37,sequenceContext:true,canonicalAnswers:true,inMemorySaveResume:true,productionWrites:0}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
