'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const d=new JSDOM('<div id="header"></div><main id="hero"></main>',{url:'https://synthetic.test',runScripts:'outside-only'}),w=d.window;
try{
 w.eval(fs.readFileSync('media/rainbow-island.js','utf8'));
 w.eval(fs.readFileSync('media/characters.js','utf8'));
 const first='11111111-1111-4111-8111-111111111111',second='22222222-2222-4222-8222-222222222222';
 const st={signedIn:true,restoring:false,profileStatus:'ready',ownerId:'synthetic',user:{id:'synthetic',displayName:'합성 회원'},growth:{points:1500},premium:{active:false},partners:{version:1,claimEnabled:true,equipEnabled:true,revision:0,totalPoints:1500,equippedId:first,items:[{id:first,family:'gabumon',character:'punimon',stage:0,points:250,revision:0,equipped:true,firstPartner:true,nextCharacter:'tsunomon',nextThreshold:500,eligible:false,final:false},{id:second,family:'agumon',character:'greymon',stage:3,points:1250,revision:0,equipped:false,firstPartner:false,nextCharacter:'metalgreymon',nextThreshold:1500,eligible:false,final:false}]}};
 assert(w.HanqCollection.ready(st),'fixture must satisfy the real owner/collection contract');
 const original=JSON.stringify(st),h=w.document.querySelector('#header'),hero=w.document.querySelector('#hero');
 h.innerHTML=w.HanqCharacters.member(st);
 assert.equal(h.querySelector('.hm-pts').textContent,'XP : 250 (1,500)');
 assert.equal(h.querySelector('.hm-partner').textContent,'250');
 assert.equal(h.querySelector('.hm-total').textContent,'(1,500)');
 assert(h.querySelector('#headerAccount').getAttribute('aria-label').includes('장착 디지몬 XP 250 · 계정 총 XP 1,500'));
 assert(!h.querySelector('.hm-pts').textContent.includes('계정 총'));
 w.HanqCharacters.mount(hero,st);
 assert.equal(hero.querySelector('.ac-growth-next').textContent,'성장 XP · 250');
 assert.equal(hero.querySelector('.ac-progress-label').textContent,'이번 단계 250 / 500 XP');
 assert(!hero.textContent.includes('1,500'),'account total not duplicated as partner XP');
 assert.equal(JSON.stringify(st),original);
 w.HanqCharacters.stop();
 const legacy=JSON.parse(original);delete legacy.partners;
 h.innerHTML=w.HanqCharacters.member(legacy);
 assert.equal(h.querySelector('.hm-pts').textContent,'XP : — (1,500)');
 assert.equal(h.querySelector('.hm-partner').textContent,'—');
 assert(h.querySelector('#headerAccount').getAttribute('aria-label').includes('장착 디지몬 XP 확인 불가 · 계정 총 XP 1,500'));
 const zero=JSON.parse(original);zero.partners.items[0].points=0;zero.partners.items[1].points=1500;zero.partners.items[1].stage=4;zero.partners.items[1].character='metalgreymon';zero.partners.items[1].nextCharacter='wargreymon';zero.partners.items[1].nextThreshold=1800;
 assert(w.HanqCollection.ready(zero),'zero is displayed only from a valid real partner field');
 h.innerHTML=w.HanqCharacters.member(zero);assert.equal(h.querySelector('.hm-pts').textContent,'XP : 0 (1,500)');
 for(const mutate of [s=>{s.ownerId='other';},s=>{s.restoring=true;},s=>{s.partners.totalPoints=999;},s=>{delete s.growth;},s=>{s.partners.items[0].points='250';}]){
  const bad=JSON.parse(original);mutate(bad);const before=JSON.stringify(bad);h.innerHTML=w.HanqCharacters.member(bad);assert.equal(h.querySelector('.hm-pts,.hm-partner,.hm-total'),null);assert.equal(JSON.stringify(bad),before);
 }
 const collection=w.HanqCollection;delete w.HanqCollection;h.innerHTML=w.HanqCharacters.member(st);assert.equal(h.querySelector('.hm-pts'),null,'missing collection module cannot invent partner XP');w.HanqCollection=collection;
 assert.equal(JSON.stringify(st),original);
 console.log('PASS compact equipped XP / account total, real collection contract, legacy unavailable marker, actual zero, owner and missing-field guards; source state unchanged');
}finally{d.window.close();}
