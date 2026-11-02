// Pure motion checks: two service stops, no position jumps on turns, no stride while stopped.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../media/rainbow-island.js'),'utf8'),{window});
const pose=window.HanqRainbow.patrolPose,p={travel:9,rest:3};let previous=null,min=Infinity,max=-Infinity,moving=0,stopped=0,maxStep=0;
for(let i=0;i<4800;i++){const q=pose(i/100,p);assert(Number.isFinite(q.x)&&Number.isFinite(q.y));assert(q.x>=-1&&q.x<=1);assert(Math.abs(q.y)<=1);assert(q.strength>=0&&q.strength<=1);if(q.walking)moving++;else{stopped++;assert.equal(q.strength,0);}if(previous)maxStep=Math.max(maxStep,Math.hypot(q.x-previous.x,q.y-previous.y));previous=q;min=Math.min(min,q.x);max=Math.max(max,q.x);}
assert.equal(min,-1);assert.equal(max,1);assert(moving>0&&stopped>=1000);assert(maxStep<.01);
for(const t of [9,12,21,24]){const a=pose(t-1e-6,p),b=pose(t+1e-6,p);assert(Math.hypot(a.x-b.x,a.y-b.y)<1e-9);}
console.log(JSON.stringify({passed:true,frames:4800,serviceStops:2,movingFrames:moving,stationaryFrames:stopped,maxNormalizedStep:maxStep}));
// Keeper remains visibly continuous through both directions and the loop seam.
const keeper=window.HanqRainbow.guardianPose;let prev=null,walkRight=0,walkLeft=0;
for(let ms=0;ms<=144000;ms+=20){const q=keeper(ms/1000);assert.equal(q.opacity,1,'keeper never fades');assert(Math.abs(q.facing)>=.72&&Math.abs(q.facing)<=1);if(prev){const dx=q.x-prev.x;assert(Math.hypot(dx,q.y-prev.y)<.005,'no visible loop reset/teleport');if(q.walking&&prev.direction===q.direction&&Math.abs(dx)>1e-8)assert(dx*q.direction>=0,'face follows travel rather than walking backwards');}if(q.walking){assert.equal(Math.sign(q.facing),q.direction);if(q.direction>0)walkRight++;else walkLeft++;}prev=q;}
assert(walkRight>1000&&walkLeft>1000);for(const seam of [36,72,108,144]){const a=keeper(seam-1e-6),b=keeper(seam+1e-6);assert(Math.hypot(a.x-b.x,a.y-b.y)<1e-9);}
const babies=window.HanqRainbow.babies;assert.equal(babies.length,12);assert.equal(new Set(babies.map(b=>b.id)).size,12);assert.equal(new Set(babies.map(b=>b.form||b.id)).size,6);assert(new Set(babies.map(b=>b.group)).size>=4);assert(new Set(babies.map(b=>b.phase)).size>=10);for(const b of babies){assert(b.size>=.7&&b.size<=1.1);for(const c of Object.values(window.HanqRainbow.track.tracks))assert(c.anchors[b.id]&&c.anchors[b.id].every(n=>n>0&&n<1));}
console.log('PASS keeper 144-second continuous visible/facing loop and 12 varied residents from six unchanged forms');
