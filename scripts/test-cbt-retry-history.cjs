'use strict';
const assert=require('assert/strict'),fs=require('fs'),{JSDOM}=require(process.env.HANQ_JSDOM_PATH);
(async()=>{
 const dom=new JSDOM('<main></main>',{url:'https://review.test',runScripts:'outside-only'}),w=dom.window,host=w.document.querySelector('main'),run='10000000-0000-4000-8000-000000000001';
 const options=[1,2,3,4,5].map(n=>({id:'choice'+n,number:n}));
 let items=[1,2].map(n=>({questionId:'exam-80-0'+n,version:'synthetic',exam:80,number:n,position:n-1,points:2,runId:run,starred:true,everWrong:true,selectedOptionId:'choice2',options,image:'/api/v1/cbt/runs/'+run+'/questions/'+(n-1)+'/image',common:null,review:{status:'wrong',correctNumber:1,correctOptionId:'choice1'}}));
 let owner='synthetic';const api={state:()=>({signedIn:true,ownerId:owner,epoch:1}),onChange:()=>()=>{},cbt:async(method)=>{assert.equal(method,'GET');return {scope:'exam-starred-or-ever-wrong',round:80,items,hasMore:false,pendingStarCount:0,resetAt:null};},cbtImage:async()=>new Blob(['fixture'],{type:'image/png'})};
 w.URL.createObjectURL=()=> 'blob:fixture';w.URL.revokeObjectURL=()=>{};w.eval(fs.readFileSync('media/cbt-round-materials.js','utf8'));
 const tick=()=>new Promise(r=>setImmediate(r)),btn=t=>[...host.querySelectorAll('button')].find(b=>b.textContent===t),pick=n=>host.querySelector('[data-review-choice="'+n+'"]')||[...host.querySelectorAll('[data-review-choice]')][n-1];
 let ctl;async function mount(extra={}){if(ctl)ctl.stop();ctl=w.HanqCbtRoundMaterials.mount(host,{api,round:80,...extra});await ctl.ready;await tick();}
 const key='hanq:round-material-rehearsal:v1:synthetic:80',archive=()=>w.localStorage.getItem(key+':latest');
 function fresh(){assert(!host.querySelector('.fe-round-review-option-notes'));assert(!/O 정답|X 오답/.test(host.querySelector('.fe-round-review-feedback')?.textContent||''));assert([...host.querySelectorAll('[data-review-choice]')].every(b=>!b.disabled&&b.getAttribute('aria-pressed')==='false'));assert.equal(btn('확인').disabled,true);}
 await mount();fresh();host.querySelector('.fe-round-review-mark').click();
 pick(1).click();btn('확인').click();await tick();btn('›').click();pick(1).click();btn('확인').click();await tick();btn('최종 제출').click();await tick();
 assert(host.textContent.includes('정답률 100%'));assert(btn('다시 풀기'));assert.equal(host.querySelector('.fe-round-review-summary .fe-round-review-percent strong').textContent,'100%');assert(host.querySelector('.fe-round-review-errors').textContent.includes('틀린 문제가 없어요.'));assert.equal(JSON.parse(archive()).rows.length,2);const submitted=archive();
 btn('다시 풀기').click();fresh();assert.equal(archive(),submitted);assert.equal(host.querySelector('.fe-round-review-mark').getAttribute('aria-pressed'),'true');
 pick(2).click();await mount();assert.equal(pick(2).getAttribute('aria-pressed'),'true');assert(!host.querySelector('.fe-round-review-option-notes'));assert(!/O 정답|X 오답/.test(host.querySelector('.fe-round-review-feedback')?.textContent||''));
 const draft=w.localStorage.getItem(key);await mount({history:true});assert(host.textContent.includes('최근 제출한 복습 결과'));assert(host.textContent.includes('정답률 100%'));assert.equal(host.querySelectorAll('.fe-round-review-breakdown li').length,2);assert(!host.querySelector('[data-review-choice]'));assert(!host.querySelector('[data-round-star-filter]'));assert.equal(w.localStorage.getItem(key),draft);assert.equal(archive(),submitted);
 await mount();assert.equal(pick(2).getAttribute('aria-pressed'),'true');
 // Explicit replay clears stale normal and marked workspaces, not archived score or marks.
 w.localStorage.setItem(key+':double-star-practice',w.localStorage.getItem(key));await mount({restart:true});fresh();assert.equal(archive(),submitted);assert.deepEqual(JSON.parse(w.localStorage.getItem(key+':double-star-practice')).selected,{});assert.deepEqual(JSON.parse(w.localStorage.getItem(key+':double-star-practice')).drafts,{});
 await mount();fresh();
 // A later wrong attempt replaces only the latest submitted archive on final submit.
 pick(2).click();btn('확인').click();await tick();assert.equal(archive(),submitted);btn('›').click();pick(2).click();btn('확인').click();await tick();btn('최종 제출').click();await tick();assert.equal(JSON.parse(archive()).right,0);assert(JSON.parse(archive()).rows.every(r=>r.status==='wrong'));
 // Joined history -> load -> retry: saved marked set, not this device's stars/pool.
 const ordinaryArchive=archive(),marked={...JSON.parse(archive()),marked:true,total:1,right:0,rows:[JSON.parse(archive()).rows[1]]};
 w.localStorage.setItem(key+':latest',JSON.stringify(marked));const markedArchive=archive();
 w.localStorage.removeItem('hanq:round-material-rehearsal:v1:synthetic:all:shared-double-stars');
 await mount({history:true});btn('다시 풀기').click();await tick();await tick();fresh();
 assert(host.textContent.includes('1/1'));assert.equal(host.querySelector('.fe-round-practice-position').getAttribute('aria-label').includes('2번'),true);assert.equal(archive(),markedArchive);
 assert.equal(host.querySelector('[data-round-star-filter]').getAttribute('aria-pressed'),'true');
 await mount({restart:true});fresh();assert(host.textContent.includes('1/2'),'ordinary replay uses fresh full pool');
 items=items.slice(0,1);await mount({history:true});btn('다시 풀기').click();await tick();await tick();
 assert(host.textContent.includes('같은 문제로 다시 풀 수 없어요'));assert(!host.querySelector('[data-review-choice]'));assert.equal(archive(),markedArchive);
 w.localStorage.setItem(key+':latest',ordinaryArchive);
 // Snapshot remains readable even when source material set no longer matches.
 const last=archive();items=[];await mount({history:true});assert(host.textContent.includes('정답률 0%'));assert.equal(host.querySelectorAll('.fe-round-review-breakdown li').length,2);assert.equal(archive(),last);
 // Pre-upgrade aggregate must never borrow current draft answers to invent details.
 const legacy={right:1,total:2,marked:false,at:'2026-11-18T00:00:00Z',resetAt:null};w.localStorage.setItem(key+':latest',JSON.stringify(legacy));await mount({history:true});assert(host.textContent.includes('정답률 50%'));assert(host.textContent.includes('정답률과 제출일만'));assert.equal(host.querySelectorAll('.fe-round-review-breakdown li').length,0);
 owner='other';await mount({history:true});assert(host.textContent.includes('아직 제출한 복습 기록이 없어요'));ctl.stop();dom.window.close();
 console.log('PASS retry/history: 100% and 0% replay, ungraded fresh choices, resume drafts, marked cache cleared, immutable latest snapshot, changed materials, safe legacy aggregate, owner isolation; GET-only fixture.');
})().catch(e=>{console.error(e);process.exitCode=1;});
