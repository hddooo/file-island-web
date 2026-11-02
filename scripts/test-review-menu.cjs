'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require(process.env.JSDOM_PATH||'jsdom'),root=path.resolve(__dirname,'..');let checks=0;const ok=(v,m)=>{assert(v,m);checks++;};
const dom=new JSDOM('<main id="h"></main>',{url:'https://fixture.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,h=w.document.querySelector('#h');let owner={signedIn:false,ownerId:null,epoch:0,premium:{active:false}},seq=0,timers=new Map,requests=[],writes=[],subscriptions=[];
w.requestAnimationFrame=()=>0;w.setTimeout=(fn,ms)=>{const id=++seq;timers.set(id,{fn,ms});return id;};w.clearTimeout=id=>timers.delete(id);w.Storage.prototype.setItem=k=>writes.push(k);
const api={state:()=>owner,onChange:fn=>{subscriptions.push(fn);throw Error('public playback must not depend on owner');},coreReview:()=>{requests.push('coreReview');throw Error('offline');}};
w.fetch=url=>{requests.push(url);throw Error('no private data fetch');};w.HanqApi=api;
for(const file of ['review-memory-cards','review-ancient-cards','review-goryeo-cards','review-joseon-cards','review-opening-cards','review-colonial-cards','review-modern-cards','period-reviews','joseon-core-review','review-player','focused-review','shared-core-review','review-menu'])w.eval(fs.readFileSync(path.join(root,'media',file+'.js'),'utf8'));
const baseline=JSON.stringify(w.HANQ_MEMORY_REVIEWS),fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/shared-core-review.json')));ok(JSON.stringify(w.HANQ_SHARED_CORE_REVIEWS)===JSON.stringify(fixture),'same curated common content');
const data=JSON.stringify(w.HANQ_SHARED_CORE_REVIEWS);for(const field of ['userId','email','ownerId','questionId','submitted_answer','wrong_reason','attempts','growth','accessToken'])ok(!data.includes('"'+field+'"'),'public asset has no '+field);
for(const era of ['ancient','goryeo','joseon','opening','colonial','modern']){
 let same;w.HanqApi=api;
 for(const [id,premium]of [[null,false],['free',false],['premium',true],['other',false]]){
  owner={signedIn:!!id,ownerId:id,epoch:owner.epoch+1,premium:{active:premium}};w.HanqReviewMenu.mount(h,{},era);ok(h.querySelector('.memory-card')&&timers.size===1,'direct playback '+era+' '+id);ok(!h.querySelector('.hanq-rm__select')&&h.querySelectorAll('.review-rate select').length===1,'same UI');ok(h.querySelector('select').value==='0.75','same default speed');const text=h.querySelector('.memory-card').textContent;if(same)ok(same===text,'identical content');same=text;
  const timer=[...timers.keys()][0],title=h.querySelector('.memory-card').textContent;owner={signedIn:false,ownerId:null,epoch:owner.epoch+1,premium:{active:false}};subscriptions.forEach(fn=>fn(owner));ok(timers.has(timer)&&h.querySelector('.memory-card').textContent===title,'logout preserves position and timer');w.HanqReviewMenu.stop();ok(!timers.size,'stop cleanup');
 }
 w.HanqReviewMenu.mount(h,{});const buttons=h.querySelectorAll('.hanq-rm__group');ok(buttons.length===6,'six era menu');ok(!h.textContent.includes('로그인'),'no review login prompt');buttons[['ancient','goryeo','joseon','opening','colonial','modern'].indexOf(era)].click();ok(h.querySelector('.memory-card')&&timers.size===1,'one-click guest entry');w.HanqReviewMenu.stop();
 delete w.HanqApi;w.HanqReviewMenu.mount(h,{},era);ok(h.querySelector('.memory-card')&&timers.size===1,'API unavailable '+era);w.HanqReviewMenu.stop();
}
for(const era of ['ancient','goryeo']){w.HanqReviewMenu.mount(h,{},era,'personal');ok(h.querySelector('.memory-card'),'old alias guest');w.HanqReviewMenu.stop();}
ok(!requests.length&&!subscriptions.length&&!writes.length,'no owner requests/subscriptions/record writes');ok(JSON.stringify(w.HANQ_MEMORY_REVIEWS)===baseline,'original decks unchanged');ok(!timers.size,'no leaked timers');console.log('Review menu',checks,'PASS');dom.window.close();
