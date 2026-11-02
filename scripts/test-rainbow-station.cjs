'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync('media/rainbow-island.js','utf8'),{window});
const T=window.HanqRainbow.track;let frames=0,stationary=0,maxStep=0,maxTilt=0;
for(const c of Object.values(T.tracks)){let previous=null,forward=0;for(let ms=0;ms<=T.loopMs*2;ms+=20){const q=T.poses(c,ms/T.loopMs)[0];frames++;assert.equal(q.sx,1);assert.equal(q.depth,1);assert.equal(q.direction,1);assert(q.front);assert(Math.abs(q.tilt)<.5);maxTilt=Math.max(maxTilt,Math.abs(q.tilt));if(previous){const d=q.d-previous.d;if(q.opacity>0&&previous.opacity>0){assert(d>=-1e-8,'no visible backwards motion');maxStep=Math.max(maxStep,Math.abs(d));assert(Math.abs(d)<1,'no visible jump');}if(d>1e-6)forward++;if(!q.moving&&!previous.moving)stationary++;}previous=q;}assert(forward>1000);}
for(const file of ['rainbow-island','world-map','device-shell','adventure','characters']){const s=fs.readFileSync('media/'+file+'.js','utf8');assert(!/무지개섬|무지개마을/.test(s),'consistent village name: '+file);}
assert.equal(T.loopMs,64000);assert.equal(T.units.length,1);assert.equal(window.HanqCollection.ready({signedIn:true}),false);
console.log(JSON.stringify({passed:true,frames,stationary,maxStep,maxTiltDegrees:maxTilt*180/Math.PI,noMirror:true,forwardOnly:true,sourceFacingPreserved:true,collectionClosed:true}));
