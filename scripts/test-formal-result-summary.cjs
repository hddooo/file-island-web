'use strict';
// Final result display contract with synthetic API responses, no production records.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require(process.env.HANQ_JSDOM_PATH || 'jsdom');
const source = fs.readFileSync(require.resolve('../media/formal-exams.js'), 'utf8');
const analysis = fs.readFileSync(require.resolve('../media/cbt-result-analysis.js'), 'utf8');
const styles = fs.readFileSync(require.resolve('../media/cbt-results.css'), 'utf8');
const resultId = '00000000-0000-4000-8000-000000000001';
async function view(t, score, xp, { kind, withAnalysis = true, company = false, maxScore = 100, withStar = false } = {}) {
 const d = new JSDOM('<!doctype html><html'+(company?' data-company-mode="on"':'')+'><body><main id="app"><div id="formalExamHost"></div></main></body></html>',
  { url: 'https://fixture.test', runScripts: 'outside-only' });
 const w = d.window, host = w.document.querySelector('#formalExamHost');
 t.after(() => { w.HanqFormalExams.stop(); w.close(); });
 w.URL.createObjectURL = () => 'blob:synthetic';
 w.URL.revokeObjectURL = () => {};
 w.HTMLElement.prototype.scrollIntoView = () => {};
 const items = [
  ['goryeo','wrong'], ['joseon-early','wrong'], ['joseon-early','wrong'],
  ['goryeo','unanswered'], ['modern','correct'], ['unclassified','wrong']
 ].map(([era,status], position) => ({
  questionId: 'fixture'+position, version: 'test', exam: 70, number: position+1, position, points: 2,
  selectedOptionId: status==='wrong'?'b':status==='correct'?'a':null,
  image: '/synthetic/'+position, options: [{id:'a',number:1},{id:'b',number:2}],
  review: { status, era, part:'문화', earned:status==='correct'?2:0, correctOptionId:'a', correctNumber:1, options:[{explanation:'fixture'}] }
 }));
 const result = { score, maxScore, total:50, correct:1, wrong:3, unanswered:1, growthReward:xp,
  growthPolicy:'round-first-score-bands-v1', rewardEligible:xp!==0, grade:99 };
 const run = { id:resultId, round:70, status:'final', result, kind };
 const signature = JSON.stringify(items.map(q=>[q.questionId,q.version,q.options.map(o=>o.id)]));
 const writes = [];
 const api = { enabled:()=>true, state:()=>({signedIn:true,ownerId:'fixture'}), init:async()=>{}, onChange:()=>()=>{},
  cbt:async(method,path)=>{
   if(method!=='GET')writes.push([method,path]);
   if(path.endsWith('/stars'))return{signature,flags:items.map((_,i)=>withStar&&i===0)};
   return {run,items};
  },
  cbtImage:async()=>new w.Blob(['synthetic'],{type:'image/png'})
 };
 if(withAnalysis)w.eval(analysis);
 w.eval(source);
 w.HanqFormalExams.mount(host,{api,onHome(){},onAccount(){},onRoute(){},onNotes(){},onLearn(){}},(kind==='review'?'review-':'')+resultId);
 for(let i=0;i<60;i++)await Promise.resolve();
 assert.equal(writes.length,0);
 return {w,host,run,writes};
}
for (const [score,grade,xp,xpText] of [[100,'1급',10,'+10 XP'],[80,'1급',10,'+10 XP'],[79,'2급',5,'+5 XP'],[70,'2급',0,null],[69,'3급',3,'+3 XP'],[60,'3급',0,null],[59,'급수 없음',-7,'−7 XP'],[0,'급수 없음',undefined,null]]) {
 test(`stored score ${score} renders exact grade and only the actual nonzero XP`,async t=>{
  const {host,run}=await view(t,score,xp);
  const card=host.querySelector('.fe-score-card');
  assert.equal(host.querySelector('#feResult').textContent,'제70회 결과');
  assert.equal(host.querySelector('#feResult').nextElementSibling,card);
  assert.equal(card.querySelector('.fe-score-number').textContent,score+'점');
  assert.equal(card.querySelector('.fe-score-grade').textContent,grade);
  assert.equal(card.querySelector('.fe-score-xp')?.textContent??null,xpText);
  assert.doesNotMatch(host.textContent,/원래 배점으로 계산한|재풀이는 XP 변동 없음|성장점수|문항별 결과/);
  assert.equal(host.querySelector('.fe-question-grid'),null);
  assert.equal(run.result.score,score);
  assert.equal(run.result.growthReward,xp);
 });
}
test('invalid result shows unavailable without guessing grade or XP',async t=>{
 const {host}=await view(t,92,10,{maxScore:97,withAnalysis:false});
 assert.equal(host.querySelector('.fe-score-grade').textContent,'점수 확인 필요');
 assert.equal(host.querySelector('.fe-score-number'),null);
 assert.equal(host.querySelector('.fe-score-xp'),null);
 assert.equal(host.querySelector('table.fe-stats'),null);
});
test('explanations remain expandable and status text and colors remain distinct',async t=>{
 const {w,host,writes}=await view(t,80,10,{company:true});
 const details=[...host.querySelectorAll('.fe-reviews details')];
 assert.equal(details.length,6);
 assert.equal(details[0].querySelector('.fe-review-status').textContent,'오답');
 assert.equal(details[3].querySelector('.fe-review-status').textContent,'미응답');
 assert.equal(details[4].querySelector('.fe-review-status').textContent,'정답');
 assert.match(styles,/\.fe-review--correct \.fe-review-status\{\s*color:#173e83!important/);
 assert.match(styles,/\.fe-review--wrong \.fe-review-status\{\s*color:#8e1b27!important/);
 details[0].open=true;
 details[0].dispatchEvent(new w.Event('toggle'));
 for(let i=0;i<30;i++)await Promise.resolve();
 assert.equal(details[0].querySelector('.fe-review-body').textContent,'fixture');
 assert.equal(details[0].querySelector('.fe-review-original img').alt,'70회 1번 원본 문제·보기');
 assert.equal(writes.length,0);
});
test('partial replays still use their original scores and list',async t=>{
 const {host}=await view(t,80,0,{kind:'review'});
 assert.equal(host.querySelector('.fe-score-card'),null);
 assert.match(host.querySelector('.result-score').textContent,/정답 1/);
 assert.equal(host.querySelectorAll('.fe-question-grid button').length,6);
});
test('era circles keep sorted counts and no longer open explanations when clicked',async t=>{
 const {host,w,writes}=await view(t,70,5,{company:true});
 const rings=[...host.querySelectorAll('.fe-era-ring-item')];
 assert.deepEqual(rings.slice(0,2).map(el=>el.dataset.eraKey),['joseon','goryeo']);
 assert.match(rings[0].querySelector('.fe-era-ring-copy').textContent,/정답률 0%/);
 assert.match(rings[1].querySelector('.fe-era-ring-detail').textContent,/0\/2 정답.*오답 1 · 미응답 1/);
 assert.equal(host.querySelector('.fe-score-accuracy').textContent,'전체 정답률 2% · 1/50 정답');
 const other=host.querySelector('[data-era-key="unknown"]');
 assert.match(other.textContent,/기타.*정답률 0%.*오답 1/);
 assert.equal(host.querySelector('.fe-era-rings :is(button,a,[data-review-position],[tabindex])'),null);
 const active=w.document.activeElement;
 const target=host.querySelector('details[data-position="1"]');
 rings[0].querySelector('.fe-era-ring').click();
 assert.equal(target.open,false);
 assert.equal(w.document.activeElement,active);
 assert.deepEqual(writes,[]);
});

test('full result omits overview links and chart captions without removing saved stars',async t=>{
 const {host,writes}=await view(t,80,10,{withStar:true});
 assert.equal(host.querySelector('#feWrongNotes'),null);
 assert.equal(host.querySelector('.fe-starred-review'),null);
 assert.doesNotMatch(host.textContent,/오답 개수가 많은 순서|원을 누르면|시대별 비교에서 제외|별표 문제 \d+문항/);
 assert.match(host.querySelector('[data-era-key="unknown"]').textContent,/기타.*오답 1/);
 assert.equal(host.querySelector('[data-toggle-star="0"]').getAttribute('aria-pressed'),'true');
 assert.deepEqual(writes,[]);
});
test('opening a second question or clicking its title/photo cannot close an already opened explanation',async t=>{
 const {host,w,writes}=await view(t,80,10,{company:true});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 const [first,second]=host.querySelectorAll('.fe-reviews details');
 const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
 const title=first.querySelector('summary');
 assert.equal(click(title),true);
 first.open=true;
 first.dispatchEvent(new w.Event('toggle'));
 for(let i=0;i<30;i++)await Promise.resolve();
 assert.equal(click(title),false);
 assert.equal(first.open,true);
 assert.equal(click(second.querySelector('summary')),true);
 second.open=true;
 assert.equal(first.open,true);
 const imageLink=first.querySelector('.fe-review-original a');
 click(imageLink);
 const modal=first.querySelector('dialog');
 assert.equal(modal.open,true);
 assert.equal(w.document.activeElement,modal.querySelector('.fe-original-close'));
 click(modal.querySelector('img'));
 assert.equal(modal.open,true);
 click(modal.querySelector('.fe-original-close'));
 assert.equal(modal.isConnected,false);
 assert.equal(first.open,true);
 assert.equal(second.open,true);
 assert.equal(w.document.activeElement,imageLink);
 assert.deepEqual(writes,[]);
});
