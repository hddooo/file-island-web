'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const {JSDOM}=require(process.env.HANQ_JSDOM_PATH||'jsdom'),root=path.resolve(__dirname,'..');
const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(root,'media/mixed-review-bank.js'),'utf8'),sandbox);
const bank=JSON.parse(JSON.stringify(sandbox.window.HANQ_MIXED_REVIEW_BANK)),quiz=require('../media/mixed-review-quiz.js');let checks=0;function ok(v){assert(v);checks++;}
const before=JSON.stringify(bank),q=quiz.create(bank,()=>.37),seen=new Set(),eras={};let oldNext,previousFirst;
for(let cycle=0;cycle<3;cycle++){
 const first=q.view().id;if(previousFirst)ok(first!==previousFirst);previousFirst=first;const ids=new Set();let lastEra=null;
 for(let i=0;i<30;i++){
  const v=q.view(),source=bank.find(x=>x.id===v.id);ids.add(v.id);seen.add(v.id);eras[source.era]=(eras[source.era]||0)+1;
  ok(v.number===i+1&&v.total===30&&v.phase==='asked');ok(!v.eraLabel&&!v.correctOptionId&&!v.explanation);ok(source.era!==lastEra);lastEra=source.era;
  ok(!q.next(v.turn)&&!q.restart(v.turn)&&!q.choose('invalid',v.turn));if(oldNext!==undefined)ok(!q.next(oldNext));
  const id=i%2===0?source.correctOptionId:v.options.find(o=>o.id!==source.correctOptionId).id;
  ok(q.choose(id,v.turn));ok(!q.choose(id,v.turn));const g=q.view();ok(g.phase==='graded'&&g.isCorrect===(i%2===0));ok(g.eraLabel&&g.explanation&&g.correctOptionId===source.correctOptionId);
  oldNext=v.turn;ok(q.next(v.turn));ok(!q.next(v.turn));
 }
 ok(ids.size===30&&q.view().phase==='done'&&q.view().correct===15);ok(q.restart(q.view().turn));
}
ok(seen.size===30&&Object.values(eras).every(n=>n===15));ok(JSON.stringify(bank)===before);
const runtime=fs.readFileSync(path.join(root,'media/mixed-review-bank.js'),'utf8');for(const forbidden of ['exam-','correctSourceOption','sourceOption','sourcePDFSHA256','questionId','premium','accessToken'])ok(!runtime.includes(forbidden));
const dom=new JSDOM('<main id="host"></main>',{runScripts:'outside-only',url:'https://hanq.example/#reviews/mixed-quiz'}),w=dom.window,host=w.document.querySelector('#host');
w.HANQ_MIXED_REVIEW_BANK=bank;w.eval(fs.readFileSync(path.join(root,'media/mixed-review-quiz.js'),'utf8'));let apiCalls=0;w.HanqApi=new Proxy({}, {get(){apiCalls++;throw Error('Unexpected API use')}});w.localStorage.setItem('hanq.progress.keep','answered');
const storageBefore=w.localStorage.getItem('hanq.progress.keep'),mounted=w.HanqMixedReviewQuiz.mount(host,{random:()=>.37});
ok(host.querySelectorAll('[data-mixed-option]').length===4);ok(host.querySelector('.mixed-quiz__next').disabled);ok(!host.querySelector('.mixed-quiz__feedback'));
const oldButton=host.querySelector('[data-mixed-option]');oldButton.click();oldButton.click();ok(host.querySelectorAll('[data-mixed-option]:disabled').length===4);ok(!!host.querySelector('[role=status]'));ok(host.querySelector('.mixed-quiz__choice.is-correct').textContent.includes('정답'));
const nextButton=host.querySelector('.mixed-quiz__next');nextButton.click();nextButton.click();ok(host.querySelector('.mixed-quiz__progress').textContent==='문제 2 / 30');ok(!host.querySelector('[role=status]'));
for(let i=1;i<30;i++){host.querySelector('[data-mixed-option]').click();host.querySelector('.mixed-quiz__next').click();}
ok(!!host.querySelector('.mixed-quiz__restart'));host.querySelector('.mixed-quiz__restart').click();ok(host.querySelector('.mixed-quiz__progress').textContent==='문제 1 / 30');
mounted.stop();oldButton.click();ok(!host.children.length);ok(apiCalls===0&&w.localStorage.getItem('hanq.progress.keep')===storageBefore);dom.window.close();
console.log(`Mixed public review quiz ${checks} checks passed`);
