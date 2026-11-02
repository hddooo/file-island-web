'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),fixture=JSON.parse(fs.readFileSync(path.resolve(__dirname,'fixtures/shared-core-review.json'))).goryeo,d=new JSDOM('<main id="h"></main>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://fixture.test'}),w=d.window,h=w.document.querySelector('#h');
let checks=0,writes=0,seq=0,now=0,timers=new Map,subs=[],pending=[],owner={signedIn:true,ownerId:'owner-a',epoch:1,premium:{active:true}};
const ok=(v,n)=>{assert(v,n);checks++},settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
Object.defineProperty(w.performance,'now',{value:()=>now});w.setTimeout=(fn,ms)=>{const id=++seq;timers.set(id,{fn,ms});return id;};w.clearTimeout=id=>timers.delete(id);w.Storage.prototype.getItem=()=> '1';w.Storage.prototype.setItem=()=>writes++;
w.HanqApi={state:()=>owner,onChange:f=>{subs.push(f);return()=>subs=subs.filter(x=>x!==f);},coreReview:era=>new Promise((resolve,reject)=>pending.push({era,resolve,reject}))};
for(const f of ['review-memory-cards.js','review-ancient-cards.js','review-goryeo-cards.js','review-joseon-cards.js','review-opening-cards.js','review-colonial-cards.js','review-modern-cards.js','review-player.js','focused-review.js','shared-core-review.js','review-menu.js'])w.eval(fs.readFileSync(path.join(root,'media',f),'utf8'));
(async()=>{const snapshot=JSON.stringify(w.HANQ_MEMORY_REVIEWS),deck=w.HanqFocusedReview.build(fixture);
ok(deck.era==='goryeo'&&deck.questionCount===22,'22 actual topics, Goryeo');ok(deck.cards[0].title.includes('기준점'),'short timeline first');ok(deck.cards[1].title==='무신정권','military priority');ok(deck.cards.at(-1).scenes[0].rows.length===3,'final 3 lines');
const visual=deck.cards.flatMap(c=>c.scenes).filter(s=>s.visual);ok(visual.length===12,'6 photos, teaching then recall');ok(visual.filter(s=>s.visual.recall).every(s=>!s.visual.boxes.length),'recall no overlay');
w.HanqReviewMenu.mount(h,{},'goryeo');ok(!h.querySelector('.hanq-rm__select'),'no nested range selector');ok(h.querySelector('.memory-count'),'public Goryeo immediately available');ok(!pending.length&&!subs.length,'no account API or listener');ok(h.textContent.includes('핵심 복습 · 22개 핵심'),'same shared title');ok(timers.size===1,'one autoplay timer');
let steps=0;while(timers.size){const[id,t]=timers.entries().next().value;timers.delete(id);now+=t.ms;t.fn();assert(++steps<10000);}
ok(now===w.HanqReviewPlayer.estimate(deck,true),'actual calculated duration');ok([...h.querySelectorAll('.pr-scene')].filter(x=>!x.hidden)[0].querySelectorAll('.pr-row').length===3,'only final 3 rows');
const before=h.textContent;owner={signedIn:false,ownerId:null,epoch:2,premium:{active:false}};subs.slice().forEach(f=>f(owner));await settle();ok(h.textContent===before,'logout keeps shared final page');
w.HanqReviewMenu.stop();delete w.HanqApi;w.HanqReviewMenu.mount(h,{},'goryeo');ok(h.querySelector('.memory-count')&&timers.size===1,'available without API module');
w.HanqReviewMenu.stop();ok(timers.size===0&&subs.length===0,'all cleanup');ok(writes===0&&JSON.stringify(w.HANQ_MEMORY_REVIEWS)===snapshot,'no progress writes, common decks preserved');
console.log(JSON.stringify({checks,passed:true,pages:deck.cards.length,scenes:deck.cards.reduce((n,c)=>n+c.scenes.length,0),durationMs:w.HanqReviewPlayer.estimate(deck,true)}));d.window.close();})().catch(e=>{console.error(e);d.window.close();process.exitCode=1;});
