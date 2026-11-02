'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..');let checks=0;const ok=(v,m)=>{assert(v,m);checks++;};
// Independently transcribed from the official answer PDFs (not inferred from pencil marks).
const answers=[[68,27,2],[74,23,4],[76,24,4],[70,26,4],[69,19,3],[70,23,2],[76,26,3],[75,26,1],[75,25,1],[71,26,2],[71,20,2],[75,20,5],[75,21,2],[76,22,2],[70,24,2],[74,25,5],[76,25,2],[74,22,4],[75,27,4],[75,23,2],[76,21,1],[77,28,3],[70,19,3],[69,21,4],[76,20,5],[75,22,2],[73,21,3],[72,20,2],[76,19,4]];
function setup(rate,premium,signedIn=true){
 const dom=new JSDOM('<main></main>',{url:'http://hanq.local',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;let now=0,seq=0,timers=new Map,writes=[],apiCalls=[];
 w.localStorage.setItem('hanq.review.playbackRate',String(rate));const set=w.Storage.prototype.setItem;w.Storage.prototype.setItem=function(k,v){writes.push(k);set.call(this,k,v);};
 w.performance.now=()=>now;w.requestAnimationFrame=()=>0;w.setTimeout=(fn,ms)=>{const id=++seq;timers.set(id,{fn,at:now+ms});return id;};w.clearTimeout=id=>timers.delete(id);
 const advance=ms=>{const end=now+ms;for(;;){const t=[...timers].filter(x=>x[1].at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!t)break;timers.delete(t[0]);now=t[1].at;t[1].fn();}now=end;};
 w.fetch=()=>{throw Error('must not call data APIs');};
 for(const f of ['review-memory-cards','review-ancient-cards','review-goryeo-cards','review-joseon-cards','review-opening-cards','review-modern-cards','review-colonial-cards','period-reviews'])w.eval(fs.readFileSync(path.join(root,'media',f+'.js'),'utf8'));
 const legacy=JSON.stringify(w.HANQ_MEMORY_REVIEWS),other=JSON.stringify(Object.fromEntries(Object.entries(w.HANQ_PERIOD_REVIEWS.decks).filter(([k])=>k!=='joseon')));
 for(const f of ['joseon-core-review','review-player','focused-review','review-menu'])w.eval(fs.readFileSync(path.join(root,'media',f+'.js'),'utf8'));
 ok(JSON.stringify(w.HANQ_MEMORY_REVIEWS)===legacy,'original memory decks unchanged');ok(JSON.stringify(Object.fromEntries(Object.entries(w.HANQ_PERIOD_REVIEWS.decks).filter(([k])=>k!=='joseon')))===other,'other era period decks unchanged');
 w.HanqApi={state:()=>({signedIn,ownerId:signedIn?'fixture-account':null,epoch:1,premium:{active:premium}}),coreReview:era=>{apiCalls.push(era);return Promise.resolve({era,source:'common-core',ready:true});}};
 return {dom,w,h:w.document.querySelector('main'),advance,timers,writes,apiCalls,now:()=>now};
}
(async()=>{
 const coverage=JSON.parse(fs.readFileSync(path.join(root,'scripts/fixtures/joseon-short-card-coverage.json')));
 const report=JSON.parse(fs.readFileSync(path.join(root,'docs/joseon-core-review-map.json'))),c=require('./joseon-core-content.cjs'),byId=new Map(c.cards.map(x=>[x.id,x]));
 ok(c.questionMap.length===29&&new Set(c.questionMap.map(x=>x.exam+'-'+x.question)).size===29,'29 distinct official mappings');
 for(const [exam,question,answer] of answers){const q=c.questionMap.find(x=>x.exam===exam&&x.question===question);ok(q&&q.officialAnswer===answer&&q.cardIds.every(id=>byId.has(id)),'official '+exam+'-'+question);}
 ok(coverage.questions.length===29&&new Set(coverage.questions.map(q=>q.exam+'-'+q.question)).size===29,'complete independent29-question coverage fixture');
 const norm=t=>t.replace(/\s/g,'');
 for(const q of coverage.questions){const found=c.questionMap.find(x=>x.exam===q.exam&&x.question===q.question);ok(found&&JSON.stringify(found.cardIds)===JSON.stringify(q.cardIds),'topic mapping '+q.exam+'-'+q.question);const text=norm(found.cardIds.map(id=>JSON.stringify(byId.get(id))).join(' '));for(const term of q.requiredTerms)ok(text.includes(norm(term)),'required clue/feature '+q.exam+'-'+q.question+' '+term);}
 for(const card of c.cards.filter(x=>x.kind==='topic')){ok(card.sources.length>=3,'source-backed lesson');ok(card.scenes.length===1&&card.scenes[0].rows.length>=3&&card.scenes[0].rows.length<=5,'single compact3-5-row card');const terms=card.scenes[0].rows.flatMap(r=>r.items.flatMap(i=>i.b.map(([a,n])=>i.t.slice(a,a+n))));ok(new Set(terms).size===terms.length,'no forced same-keyword repeats within card');}
 ok(c.cards.at(-1).scenes.length===1&&c.cards.at(-1).scenes[0].rows.length===3&&c.cards.at(-1).scenes[0].rows.every(r=>r.items.every(i=>!i.b.length)),'short final flow without another keyword quiz');
 ok(c.cards.find(x=>x.id==='jc-jeongjo').scenes.every(s=>s.rows.every(r=>r.items.every(i=>!i.t.includes('세책가')&&!i.t.includes('춘향전')))),'king policies separate from novel lifestyle');
 for(const card of c.cards)for(const sc of card.scenes)for(const r of sc.rows)for(const item of r.items)for(const [i,n]of item.b){ok(i>=0&&n>=2&&i+n<=item.t.length,'valid keyword span');ok(n<item.t.length/2,'hint remains visible');}
 const order=c.cards.map(x=>x.id);ok(order.indexOf('jc-cheoljong')<order.indexOf('jc-offices')&&order.indexOf('jc-parkjiwon')<order.indexOf('jc-daedong'),'priority order');
 const text=JSON.stringify(c.cards);ok(text.includes('갑인예송')&&text.includes('임인옥사')&&text.includes('기사환국'),'correct interval endpoints');ok(!/KakaoTalk|ownerId|선택답|오답률/.test(text),'no personal data');
 for(const rate of [.5,.75,1,1.25,1.5]){
  const t=setup(rate,false),d=t.w.HANQ_PERIOD_REVIEWS.route('joseon','all'),p=t.w.HanqReviewPlayer;t.w.HANQ_MEMORY_REVIEWS.qa=d;const playback=p.mount(t.h,'qa','조선');
  const estimate=p.estimate(d);ok(estimate===report.timing.baseMs,'same catalog and runtime timing');ok(estimate<881960&&estimate/.75>=5*60000&&estimate/.75<12*60000,'compact duration shorter without changing saved rate');
  const steps=p.periodSteps(d,true);for(const step of steps){const s=playback.state();ok(s.page===step.page&&s.scene===step.scene&&s.phase===step.phase,'sequential phase');t.advance(step.ms/rate+.000001);}
  ok(playback.state().ended&&!t.timers.size,'stops on final recall');ok(Math.abs(t.now()-estimate/rate)<1,'actual rate duration');ok(!t.writes.length,'playback does not write progress or scores');playback.start();ok(playback.state().page===0&&!playback.state().ended,'restart at first');playback.stop();t.dom.window.close();
 }
 const displayed=[];for(const premium of [false,true]){
  const t=setup(.75,premium);t.w.HanqReviewMenu.mount(t.h,{},'joseon',null);await Promise.resolve();await Promise.resolve();ok(t.apiCalls.length===0,'no common auth request');ok(t.h.querySelector('.period-review'),'authorized playback');ok(!t.h.querySelector('.hanq-rm__select'),'no new part selection');displayed.push(t.h.textContent);ok(!t.writes.length,'menu writes no personal record');t.w.HanqReviewMenu.stop();ok(!t.timers.size,'menu cleanup');t.dom.window.close();
 }
 ok(displayed[0]===displayed[1],'free and premium see identical shared content');const guest=setup(.75,false,false);guest.w.HanqReviewMenu.mount(guest.h,{},'joseon');ok(guest.h.querySelector('.period-review')&&!guest.apiCalls.length,'guest common playback available');guest.w.HanqReviewMenu.stop();guest.dom.window.close();
 console.log('Joseon core review',checks,'PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
