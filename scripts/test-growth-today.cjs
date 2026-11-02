'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),tick=()=>new Promise(r=>setTimeout(r,20));let checks=0;
const ok=(v,m)=>{assert(v,m);checks++;};
(async()=>{
 const d=new JSDOM('<main id="root"></main>',{url:'https://fixture.test/#account',runScripts:'outside-only',pretendToBeVisual:true}),w=d.window;
 let now=Date.parse('2026-10-26T14:59:59.000Z'),pages={},calls=[];
 w.Date.now=()=>now;w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.fetch=()=>{throw Error('No live API');};
 const st={signedIn:true,restoring:false,ownerId:'fixture',epoch:1,user:{id:'fixture',displayName:'검수'},growth:{points:1234},premium:{active:false},access:{total:1,today:true},profileStatus:'ready',status:'online'},before=JSON.stringify(st);
 w.HanqApi={enabled:()=>true,state:()=>st,init:async()=>st,onChange:()=>()=>{},plan:async()=>({plan:{},checkout:{available:false}}),me:async()=>st,importEntries:()=>[],attempts:async()=>({items:[],next:null}),growthHistory:async c=>{calls.push(c);return pages[c||'first'];}};
 const row=(reason,points,at)=>({reason,points,createdAt:at});
 try{
  for(const f of ['characters.js','account-ui.js'])w.eval(fs.readFileSync(path.join(root,'media',f),'utf8'));
  await w.HanqAccountUI.render(w.document.querySelector('#root'),{view:'main',go(){},local:{attempts:()=>[]}});await tick();
  const open=async()=>{w.document.querySelector('.ac-pet').click();await tick();return w.document.querySelector('#acGrowthDialog');},close=()=>w.document.querySelector('#acGrowthClose').click();
  pages={first:{items:[row('practice-quiz',1,'2026-10-26T14:59:58Z'),row('toeic-answer',-1,'2026-10-26T12:00:00Z'),row('practice-mock',-3,'2026-10-25T15:00:00Z')],next:'next'},next:{items:[row('cbt-exam',-100,'2026-10-25T15:00:00Z'),row('practice-quiz',-1,'2026-10-25T14:59:59.999Z')],next:'older'}};
  let dlg=await open();ok(dlg.querySelector('h2').textContent==='오늘 성장기록','today title');ok(dlg.querySelectorAll('.ac-gd-item').length===3,'includes KST midnight, excludes no current events');ok(dlg.querySelectorAll('.is-minus').length===2,'negative TOEIC and weighted history visible');ok(dlg.textContent.includes('-1점')&&dlg.textContent.includes('-3점'),'signed deductions');
  dlg.querySelector('#acGrowthMore').click();await tick();ok(dlg.querySelectorAll('.ac-gd-item').length===4,'next page includes midnight CBT deduction');ok(dlg.querySelector('#acGrowthMore').hidden,'stop at yesterday even if API has older pages');ok(!calls.includes('older'),'no unnecessary older query');ok(!dlg.textContent.includes('2026. 10. 25.'),'yesterday excluded');close();
  pages={first:{items:[row('signup',1000,'2026-10-25T14:59:59Z')],next:'older'}};dlg=await open();ok(dlg.querySelectorAll('.ac-gd-item').length===0&&dlg.textContent.includes('오늘은 XP 증가·차감 기록이 없어요.'),'today empty state');close();
  now=Date.parse('2026-10-26T15:00:00Z');pages={first:{items:[row('practice-quiz',-1,'2026-10-26T15:00:00Z'),row('practice-quiz',1,'2026-10-26T14:59:59.999Z')],next:null}};dlg=await open();ok(dlg.querySelectorAll('.ac-gd-item').length===1&&dlg.querySelector('.is-minus'),'reopen after KST midnight recalculates day');ok(dlg.textContent.includes('1,234'),'dialog total remains cumulative');close();
  now=Date.parse('2026-10-26T01:00:00Z');pages={first:{items:[row('practice-quiz',-1,'2026-10-26T15:00:00Z'),row('wrong-note-study',-60,'2026-10-26T00:00:00Z'),row('practice-quiz',0,'2026-10-25T15:00:00Z')],next:null}};dlg=await open();ok(dlg.querySelectorAll('.ac-gd-item').length===2,'upper midnight boundary excluded');ok(dlg.textContent.includes('-60점')&&dlg.textContent.includes('0점'),'aggregate deductions and zero-floor events retained');close();
  ok(JSON.stringify(st)===before,'no XP/profile writes');ok(w.document.querySelector('.ac-growth-next').textContent==='계정 총 XP : 1234','bar uses official cumulative growth not today sum');console.log('PASS '+checks+' assertions: KST day boundaries, reopen, positive/negative/zero, cursor cutoff, total and data preservation');
 }finally{w.HanqAccountUI&&w.HanqAccountUI.stop();w.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
