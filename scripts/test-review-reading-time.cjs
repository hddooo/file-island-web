/* 복습 카드 읽기 시간 · 일시정지/가림 재개 · 끝/경계 버튼 (가짜 시계) */
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require(process.env.HANQ_JSDOM_PATH||'jsdom');
let checks=0;const ok=(v,n)=>{assert(v,n);checks++;};
const dense='1938 · 국가 총동원법 · 인력·물자 동원 체제 강화와 전시 통제',short='8·15';
const deck={era:'test',title:'테스트',sources:['fixture'],cards:[
  {era:'A',topic:'빽빽한 카드',sec:4,points:[dense,'황국 신민 서사 · 신사 참배 강요','일본식 성명 강요 · 우리말 억압','짧음']},
  {era:'B',topic:'여유 있는 카드',sec:12,points:[short,'해방']},
  {era:'C',topic:'마지막 카드',sec:6,points:['끝']}]};
const original=JSON.stringify(deck);
const need=t=>1500+Array.from(t).length*90,dwell=(c,i)=>Math.max(c.sec*1000/c.points.length,need(c.points[i]));
function setup(){const dom=new JSDOM('<main id="h"></main>',{runScripts:'outside-only',url:'http://127.0.0.1:8775',pretendToBeVisual:true}),w=dom.window;
  let now=0,seq=0;const timers=new Map();
  w.setTimeout=(fn,ms)=>{const id=++seq;timers.set(id,{fn,at:now+ms});return id;};w.clearTimeout=id=>{timers.delete(id);};
  w.performance.now=()=>now;w.requestAnimationFrame=()=>0;
  const advance=ms=>{const end=now+ms;for(;;){let id=null,t=null;timers.forEach((v,k)=>{if(v.at<=end&&(!t||v.at<t.at)){id=k;t=v;}});if(!t)break;timers.delete(id);now=t.at;t.fn();}now=end;};
  let hidden=false;Object.defineProperty(w.document,'hidden',{get:()=>hidden});
  const setHidden=v=>{hidden=v;w.document.dispatchEvent(new w.Event('visibilitychange'));};
  w.HANQ_MEMORY_REVIEWS={test:deck};
  w.eval(fs.readFileSync(path.join(__dirname,'../media/review-player.js'),'utf8'));
  const h=w.document.querySelector('#h');w.HanqReviewPlayer.mount(h,'test','테스트');
  const q=s=>h.querySelector(s),btn=t=>Array.from(h.querySelectorAll('.memory-controls button')).find(b=>b.textContent===t);
  const cur=()=>{const li=Array.from(h.querySelectorAll('.memory-points li'));return{card:q('.memory-count').textContent,i:li.findIndex(x=>x.classList.contains('is-current')),text:(li.find(x=>x.classList.contains('is-current'))||{}).textContent};};
  return{dom,w,h,q,btn,cur,advance,setHidden,prev:()=>h.querySelectorAll('.memory-controls button')[0],play:()=>h.querySelectorAll('.memory-controls button')[1],next:()=>h.querySelectorAll('.memory-controls button')[2]};}

const t=setup(),c0=deck.cards[0],c1=deck.cards[1];
// 첫 요점부터 같은 규칙
ok(t.cur().card==='1 / 3'&&t.cur().i===0&&t.cur().text===dense,'first point highlighted with full keyword text');
ok(dwell(c0,0)>c0.sec*1000/c0.points.length,'dense point needs more than even split');
t.advance(dwell(c0,0)-1);ok(t.cur().card==='1 / 3'&&t.cur().i===0,'dense point stays until reading minimum');
t.advance(1);ok(t.cur().i===1,'advances exactly at dense minimum');
t.advance(dwell(c0,1)-1);ok(t.cur().i===1,'second dense point gets its own minimum');t.advance(1);ok(t.cur().i===2,'third point');
t.advance(dwell(c0,2));ok(t.cur().i===3&&t.cur().text==='짧음','last point');
t.advance(dwell(c0,3)-1);ok(t.cur().card==='1 / 3','short point still floored at 1500ms+');t.advance(1);
ok(t.cur().card==='2 / 3'&&t.cur().i===0&&t.cur().text===short,'next card first point');
ok(dwell(c1,0)===c1.sec*1000/c1.points.length,'roomy card keeps even split');
t.advance(5999);ok(t.cur().i===0,'roomy point uses card share');t.advance(1);ok(t.cur().i===1,'roomy advance');
// 직접 일시정지: 가림/복귀가 풀지 않음, 이동해도 정지 유지
t.play().click();ok(t.play().textContent==='재생'&&t.w.HanqReviewPlayer,'manual pause');
t.setHidden(true);t.setHidden(false);t.advance(60000);ok(t.cur().card==='2 / 3'&&t.cur().i===1&&t.play().textContent==='재생','visible again does not resume manual pause');
t.prev().click();ok(t.cur().card==='1 / 3'&&t.cur().i===0&&t.play().textContent==='재생','paused prev shows highlighted first point');
t.advance(60000);ok(t.cur().card==='1 / 3'&&t.cur().i===0,'paused navigation does not advance');
ok(t.prev().disabled&&t.prev().getAttribute('aria-disabled')==='true'&&!t.next().disabled&&t.next().getAttribute('aria-disabled')==='false','first card prev natively disabled');
t.play().click();t.advance(dwell(c0,0)-1);ok(t.cur().i===0,'resume keeps dense dwell');t.advance(1);ok(t.cur().i===1,'resume advances');
// 가림 자동 정지 → 복귀 시 남은 시간부터 재개
t.advance(1000);t.setHidden(true);ok(t.play().textContent==='재생','hidden auto pause');t.advance(60000);ok(t.cur().i===1,'hidden does not advance');
t.setHidden(false);ok(t.play().textContent==='일시정지','visible auto resume');t.advance(dwell(c0,1)-1001);ok(t.cur().i===1,'resume uses remaining time');t.advance(1);ok(t.cur().i===2,'resume completes point');
// 끝 · 경계 · 다시 재생
t.next().click();t.next().click();ok(t.cur().card==='3 / 3'&&t.next().disabled&&t.next().getAttribute('aria-disabled')==='true'&&!t.prev().disabled,'last card next natively disabled');
t.next().click();ok(t.cur().card==='3 / 3','disabled next ignored');
t.advance(dwell(deck.cards[2],0));ok(t.play().textContent==='다시 재생'&&t.cur().i===-1,'finish');
t.setHidden(true);t.setHidden(false);t.advance(60000);ok(t.play().textContent==='다시 재생'&&t.cur().card==='3 / 3','ended stays ended after visibility');
t.play().click();ok(t.cur().card==='1 / 3'&&t.cur().i===0&&t.play().textContent==='일시정지'&&t.prev().disabled,'replay from first card');
// 경계 포커스: 비활성될 버튼에서 포커스가 BODY로 빠지지 않음
t.play().click();t.next().focus();t.next().click();t.next().focus();t.next().click();ok(t.w.document.activeElement===t.play(),'focus leaves disabled next to play');
ok(JSON.stringify(deck)===original,'deck sec and keywords unchanged');
ok(!t.h.querySelector('select')&&!/속도/.test(t.h.textContent),'no speed UI');
t.w.HanqReviewPlayer.stop();t.dom.window.close();
console.log('Review reading time',checks,'PASS');
