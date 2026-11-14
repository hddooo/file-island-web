'use strict';
// Full blank-quiz run history and XP wiring. Synthetic data and a fake API only; no network.
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),{fixture,initial}=require('./test-era-blank-manual-save.cjs');
let checks=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;},tick=async()=>{for(let i=0;i<80;i++)await Promise.resolve();};
const cap={gradingVersion:2,supportedGradingVersions:[1,2],gradingStorageScope:'isolated-v2'};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function receipt(body,{rewarded=true,correct=2,total=3}={}){const tier=correct*100>=total*80?10:correct*100>=total*70?5:correct*100>=total*60?1:0;return {id:body.attemptId,sequence:'1',scope:{quizId:'synthetic',sourceVersion:body.version,gradingVersion:2,sourceRevision:'current'},correct,total,scoreXp:tier,rewarded:rewarded&&tier>0,xpAward:rewarded?tier:0,completedAt:'2026-11-15T03:00:00.000Z'};}
async function setup({gradingVersion=2,withAttempts=true,saveFailOnce=false,submit,list}={}){
 const w=new JSDOM('<meta name="hanq-source-grading" content="2"><main/>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://synthetic.invalid'}).window;w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>true;
 // Real workspace versions are 64-hex source digests; the shared fixture's placeholder is not.
 const data=fixture();let state={...initial(),...cap,version:'b'.repeat(64)},writes=[],submits=[],lists=0,failSave=saveFailOnce;
 w.eval(fs.readFileSync('media/source-grading-v2-session.js','utf8'));
 w.HanqSourceGradingV2={prepare:async()=>({gradeSlot:(item,slot,value,base)=>base(value,slot.answerIds.map(id=>item.answers.find(a=>a.id===id).text),slot.orderMatters,item.kind,item.answer.sequenceSeparator)})};
 w.eval(fs.readFileSync('media/textbook-source-quiz.js','utf8'));
 const api={textbookSourceWorkspaceV2:async()=>structuredClone(state),textbookSourceWorkspace:async()=>structuredClone({...initial()}),saveTextbookSourceWorkspaceV2:async(_id,body)=>{writes.push(structuredClone(body));if(failSave){failSave=false;throw Object.assign(Error('offline'),{status:503});}state={...state,revision:state.revision+1,updatedAt:'2026-11-15T03:00:00Z',workspace:{...state.workspace,status:'completed',responses:Object.fromEntries(body.updates.map(u=>[u.itemId,{...u,correct:u.submitted?u.values[0]===data.items.find(i=>i.id===u.itemId).answers[0].text:null}]))}};return structuredClone(state);}};
 const session=w.HanqSourceGradingV2Session.create({api,era:'synthetic',sourceRevision:data.source.sha256,isCurrent:()=>true});
 const fake={submit:async body=>{submits.push(structuredClone(body));return submit?submit(body,submits.length):{attempt:receipt(body),replayed:false};},list:async()=>{lists++;return list?list(lists):{items:submits.map((b,i)=>receipt(b)).reverse(),latest:null};}};
 const host=w.document.querySelector('main');
 const c=w.HanqTextbookSourceQuiz.render(host,data,{manualSave:true,sequential:true,gradingVersion,ownerId:'A',loadProgress:()=>gradingVersion===2?session.load():api.textbookSourceWorkspace(),loadLegacyProgress:gradingVersion===2?()=>session.loadLegacy():undefined,saveProgress:b=>gradingVersion===2?session.save(b):api.saveTextbookSourceWorkspaceV2('x',b),fullAttempts:withAttempts?fake:undefined});
 await c.ready;await tick();
 const t={w,c,host,data,writes,submits,lists:()=>lists,state:()=>state,q:s=>host.querySelector(s),all:s=>[...host.querySelectorAll(s)],
  fill(i,value){const n=t.all('.textbook-source-quiz-input')[i];n.value=value;n.dispatchEvent(new w.Event('input',{bubbles:true}));},
  async submit(){t.all('.textbook-source-question-number')[t.all('.textbook-source-question-number').length-1].click();t.q('.textbook-source-save-complete').click();await tick();},
  note:()=>t.q('.textbook-source-xp-result'),
  history:()=>t.all('.textbook-source-full-history-entry').map(n=>n.textContent),
  close(){c.cleanup();w.close();}};
 return t;
}
(async()=>{
 // 1. Successful full submission: one record request after the save is acknowledged, exact body, XP shown, history refreshed.
 {const t=await setup();eq(t.lists(),1,'history loads once on entry');eq(t.q('.textbook-source-full-history .textbook-source-history-empty').textContent,'아직 기록된 전체 풀이가 없습니다.');
  t.fill(0,'알파');t.fill(1,'베타');t.fill(2,'오답');await t.submit();
  eq(t.writes.length,1,'workspace saved once');eq(t.submits.length,1,'one full-run record');const b=t.submits[0];
  eq(Object.keys(b).sort(),['attemptId','gradingVersion','mode','responses','status','version']);eq([b.mode,b.status,b.gradingVersion,b.version],['full','completed',2,t.state().version]);
  eq(uuid.test(b.attemptId),true);eq(b.responses.map(r=>r.itemId),t.data.items.map(i=>i.id),'every question in order');eq(b.responses.map(r=>r.values),[['알파'],['베타'],['오답']]);
  eq(t.note().textContent,'XP +1 획득 · 전체 풀이 기록 저장됨');eq(t.note().getAttribute('role'),'status');
  eq(t.lists(),2,'history refreshed after the record');eq(t.history().length,1);eq(t.q('.textbook-source-full-history-entry').dataset.latest,'true');eq(t.history()[0].includes('66.67%')&&t.history()[0].includes('최근 점수')&&t.history()[0].includes('XP +1'),true);
  eq(t.all('.textbook-source-full-history-entry button').length,0,'history summary is read-only');t.close();}
 // 2. Unanswered questions are sent as blanks (server records them as wrong).
 {const t=await setup();t.fill(0,'알파');await t.submit();eq(t.submits[0].responses.map(r=>r.values),[['알파'],[''],['']]);t.close();}
 // 3. Daily limit already used: score recorded, no XP.
 {const t=await setup({submit:b=>({attempt:receipt(b,{rewarded:false,correct:3}),replayed:false})});t.fill(0,'알파');t.fill(1,'베타');t.fill(2,'감마');await t.submit();
  eq(t.note().textContent,'오늘 이 퀴즈의 XP는 이미 받았어요 · 기록은 저장됨');t.close();}
 // 4. Below 60%: recorded with a hint.
 {const t=await setup({submit:b=>({attempt:receipt(b,{correct:1}),replayed:false})});t.fill(0,'알파');await t.submit();eq(t.note().textContent,'정답률 60% 이상이면 XP를 받아요 · 기록은 저장됨');t.close();}
 // 5. Record failure: retry keeps the same attempt id and body; no extra workspace save.
 {const t=await setup({submit:(b,n)=>{if(n===1)throw Object.assign(Error('offline'),{status:0});return {attempt:receipt(b),replayed:false};}});t.fill(0,'알파');t.fill(1,'베타');await t.submit();
  eq(t.note().dataset.state,'failed');const retry=t.q('.textbook-source-xp-retry');eq(retry.textContent,'기록 다시 저장');retry.click();await tick();
  eq(t.submits.length,2);eq(t.submits[1],t.submits[0],'identical retry');eq(t.writes.length,1,'retry never re-saves the workspace');eq(t.note().textContent,'XP +1 획득 · 전체 풀이 기록 저장됨');t.close();}
 // 6. Server not ready (503): explained, no retry control.
 {const t=await setup({submit:()=>{throw Object.assign(Error('n/a'),{status:503,code:'schema_not_ready'});}});t.fill(0,'알파');await t.submit();eq(t.note().textContent,'전체 풀이 기록은 아직 준비 중입니다.');eq(t.q('.textbook-source-xp-retry'),null);t.close();}
 // 7. Restart is a new run: new attempt id; a late result for the old run is ignored.
 {let release;const t=await setup({submit:(b,n)=>n===1?new Promise(r=>{release=()=>r({attempt:receipt(b),replayed:false});}):{attempt:receipt(b,{rewarded:false}),replayed:false}});
  t.fill(0,'알파');t.fill(1,'베타');await t.submit();eq(t.note().dataset.state,'pending');t.q('.textbook-source-restart').click();await tick();
  t.fill(0,'알파');t.fill(1,'베타');await t.submit();eq(t.submits.length,2);eq(t.submits[0].attemptId===t.submits[1].attemptId,false,'restart creates a new attempt');
  release();await tick();eq(t.note().textContent,'오늘 이 퀴즈의 XP는 이미 받았어요 · 기록은 저장됨','late first result cannot overwrite the current run');t.close();}
 // 8. Workspace save fails, explicit save retry succeeds: the record is sent once, after the acknowledgement.
 {const t=await setup({saveFailOnce:true});t.fill(0,'알파');await t.submit();eq(t.submits.length,0,'no record before the save is acknowledged');
  t.q('.textbook-source-save-retry').click();await tick();eq(t.writes.length,2);eq(t.submits.length,1);eq(t.note().textContent.startsWith('XP'),true);t.close();}
 // 9. History list failure is shown without blocking the quiz.
 {const t=await setup({list:()=>{throw Error('offline');}});eq(t.q('.textbook-source-full-history').textContent.includes('불러오지 못했습니다'),true);eq(t.all('.textbook-source-quiz-input').length>0,true);t.close();}
 // 10. Newest five only, newest marked as the latest score.
 {const items=[5,4,3,2,1,0].map(n=>({...receipt({attemptId:'10000000-0000-4000-8000-00000000000'+n,version:'a'.repeat(64)},{correct:n%4}),completedAt:'2026-11-1'+n+'T03:00:00.000Z'}));
  const t=await setup({list:()=>({items,latest:items[0]})});eq(t.history().length,5);eq(t.all('.textbook-source-full-history-entry[data-latest=true]').length,1);eq(t.history()[0].includes('최근 점수'),true);t.close();}
 // 11. Without the option, or on grading version 1, nothing is recorded and no history section appears.
 {const t=await setup({withAttempts:false});t.fill(0,'알파');await t.submit();eq(t.q('.textbook-source-xp-result'),null);eq(t.q('.textbook-source-full-history'),null);t.close();}
 console.log(JSON.stringify({checks,failures:0,scope:'full-run record after acknowledged save; exact body; blanks; daily-limit text; retry identity; restart; save-retry path; read-only latest-five history'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
