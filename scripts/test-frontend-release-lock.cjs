'use strict';
// A legacy or partial profile must never unlock purchases. A complete deployed
// collection may unlock only when owner, revision, equipment and XP reconcile.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{}};vm.runInNewContext(fs.readFileSync('media/rainbow-island.js','utf8'),context);const C=context.window.HanqCollection;
for(const st of [undefined,{}, {signedIn:true,profileStatus:'ready',user:{id:'A'},ownerId:'A',growth:{points:1000},partners:{version:1,claimEnabled:true,equipEnabled:true}}])assert.equal(C.ready(st),false);
const id='22222222-2222-4222-8222-222222222222',p={id,family:'agumon',character:'agumon',points:1000,stage:2,revision:0,equipped:true,firstPartner:true,nextCharacter:'greymon',nextThreshold:1200,eligible:false,final:false};
const st={signedIn:true,restoring:false,profileStatus:'ready',ownerId:'A',user:{id:'A'},growth:{points:1000},partners:{version:1,claimEnabled:true,equipEnabled:true,purchaseEnabled:true,hatchEnabled:true,hatchSeconds:60,serverNow:'2026-10-30T00:00:00Z',coinBalance:0,revision:0,totalPoints:1000,equippedId:id,items:[p]}};
assert.equal(C.ready(st),true);assert.equal(C.current(st).points,1000);
for(const mutate of [s=>s.ownerId='B',s=>s.restoring=true,s=>s.growth.points=999,s=>s.partners.items[0].equipped=false,s=>s.partners.revision=1,s=>s.partners.hatchSeconds=1,s=>s.partners.items.push({...s.partners.items[0]})]){const x=JSON.parse(JSON.stringify(st));mutate(x);assert.equal(C.ready(x),false);}
console.log('PASS collection capability guard: complete owner-confirmed contract required; old/malformed/mismatched profiles fail closed');
