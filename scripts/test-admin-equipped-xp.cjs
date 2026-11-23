'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
function screen(partner,account='1000'){
 const d=new JSDOM('<section id="host"></section>',{url:'https://fixture.test',runScripts:'outside-only'}),w=d.window;
 w.eval(fs.readFileSync('media/admin-xp.js','utf8'));
 const h=w.document.querySelector('#host'),calls=[];
 const api={state:()=>({signedIn:true,ownerId:'fixture-admin'}),portal:async(method,url,body)=>{calls.push({method,url,body});return{confirmed:true}}};
 w.HanqAdminXp.mount(h,{id:'fixture-member',xp:account},[],api,async()=>{}, {equippedPartner:partner,partnerXpReady:false});
 const delta=h.querySelector('[name=xpDelta]');
 const input=n=>{delta.value=String(n);delta.dispatchEvent(new w.Event('input',{bubbles:true}));return h.querySelector('.admin-xp-projection')};
 return{h,w,calls,input,done:()=>w.close()};
}
(async()=>{
 const s=screen({family:'agumon',stage:3,xp:'250'});
 try{
  assert.match(s.h.querySelector('.admin-xp-equipment').textContent,/그레이몬.*현재 250 XP/);
  assert.match(s.h.querySelector('.admin-xp-current').textContent,/1,000/);
  assert.match(s.input(100).textContent,/350 XP/);assert.match(s.input(-200).textContent,/50 XP/);
  assert.match(s.input(-251).textContent,/XP가 부족/);assert(s.input('').hidden);
  assert.equal(s.calls.length,0);assert.equal(s.h.querySelectorAll('select').length,0);
  s.input(-200);const form=s.h.querySelector('form');form.querySelector('textarea').value='fixture';
  form.dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(s.calls.length,0);form.querySelector('.admin-xp-preview button').click();
  await new Promise(r=>setTimeout(r,0));assert.equal(s.calls[0].method,'POST');
  assert.equal(s.calls[0].url,'/api/v1/ops/members/fixture-member/xp');
  assert.equal(s.calls[0].body.expectedBalance,1000);assert.equal(s.calls[0].body.delta,-200);
  assert(!('expectedPartnerXp' in s.calls[0].body));
 }finally{s.done()}
 const z=screen({family:'gabumon',stage:-1,xp:'10'},'10');
 try{assert.match(z.h.textContent,/파피몬 계열 알.*10 XP/);assert.match(z.input(-11).textContent,/0 XP.*하한/)}finally{z.done()}
 const empty=screen(null);
 try{assert.match(empty.h.textContent,/장착 중인 디지몬이 없습니다/);assert.match(empty.input(-10).textContent,/XP가 부족/)}finally{empty.done()}
 const old=screen(undefined);
 try{assert.match(old.h.textContent,/XP를 확인할 수 없어요/);assert(old.input(+50).hidden);assert.equal(old.calls.length,0)}finally{old.done()}
 console.log('PASS equipped identity, separate balances, live delta preview, unavailable/no-equipped and unchanged legacy POST');
})().catch(e=>{console.error(e);process.exitCode=1});
