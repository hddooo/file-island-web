'use strict';
// Existing three poses: distance-coupled cadence, stationary turn, no body rig.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../media/rainbow-island.js'),'utf8');
function extract(text,name){const start=text.indexOf('function '+name+'('),open=text.indexOf('{',start);assert(start>=0,name);let depth=1;for(let i=open+1;i<text.length;i++){if(text[i]==='{')depth++;if(text[i]==='}'&&--depth===0)return text.slice(start,i+1);}assert.fail(name);}
const window={};vm.runInNewContext(source,{window});const api=window.HanqRainbow,h={};vm.createContext(h);vm.runInContext(extract(source,'guardianSpritePose'),h);
let previous=null,changes=0,minHold=Infinity,lastChange=0,neutralStops=0;
for(let ms=0;ms<=72000;ms++){
 const t=ms/1000,q=api.guardianPose(t),original=api.patrolPose(t,{travel:32,rest:4}),p=h.guardianSpritePose(t,q,false);
 for(const key of ['x','y','walking','direction','strength'])assert.equal(q[key],original[key],key+' path/timing must be unchanged');
 assert.equal(q.facing,original.facing<0?-1:1,'Preserve turn instant without compression');
 assert.equal(Math.abs(q.facing),1);assert.equal(q.opacity,1);
 const legT=((t%36)+36)%36,raw=Math.min(legT/32,1),distance=raw*raw*(3-2*raw),index=Math.floor(distance*48+.5)%4;
 const expected=q.walking&&q.strength>.25?[1,0,1,2][index]:1;
 assert.equal(p.frame,expected);assert.equal(p.offset,[-67,0,37][expected]/724*100);
 assert.equal(h.guardianSpritePose(t,q,true).frame,1);
 assert.equal(h.guardianSpritePose(t+123,q,false).frame,p.frame,'No independent wall-clock cadence');
 if(!q.walking){neutralStops++;assert.equal(p.frame,1);assert.equal(p.offset,0);}
 if(previous&&previous.frame!==p.frame){minHold=Math.min(minHold,ms-lastChange);lastChange=ms;changes++;assert(previous.frame===1||p.frame===1,'Alternate each raised pose through neutral');}
 if(previous&&previous.facing!==q.facing){assert(!q.walking);assert.equal(p.frame,1);assert.equal(previous.frame,1);}
 previous={frame:p.frame,facing:q.facing};
}
assert.equal(changes,96);assert(minHold>=440&&minHold<=450);assert.equal(neutralStops,8000);
for(const time of [0,32,34,36,68,70,72,108,144])for(const dt of [-1e-6,0,1e-6]){
 const q=api.guardianPose(time+dt),p=h.guardianSpritePose(time+dt,q,false);assert.equal(p.frame,1,'Neutral through stops and seams');
}
// Exercise the real renderer, including pause conditions and both cameras.
let renders=0;
for(const [width,height] of [[1114,556],[320,500],[390,700],[1440,720],[1024,300]]){
 const camera=width/height<1.1?'tall':'wide',track=api.track,f=track.frame(track.tracks[camera],width,height),nodes={};
 for(const sel of ['.ri-guardian','.ri-helper-red','.ri-helper-blue'])nodes[sel]={style:{setProperty(k,v){this[k]=v;}},dataset:{}};
 const ctx={TRACKS:track.tracks,patrolPose:api.patrolPose,guardianPose:api.guardianPose,guardianSpritePose:h.guardianSpritePose,elapsed:0,height,view:{camera,s:f.s,ox:f.ox,oy:f.oy},reduced:{matches:false},document:{hidden:false},host:{querySelector(s){return nodes[s];}}};
 vm.createContext(ctx);vm.runInContext(extract(source,'positionPatrol'),ctx);
 for(const mode of ['motion','reduce','hidden']){
  ctx.reduced.matches=mode==='reduce';ctx.document.hidden=mode==='hidden';
  for(let ms=0;ms<=144000;ms+=40){ctx.elapsed=ms;ctx.positionPatrol();const g=nodes['.ri-guardian'],q=api.guardianPose(ms/1000);
   assert.equal(g.style['--ri-step'],'0.00deg');assert.equal(g.style['--ri-left-foot'],'0.00px');assert.equal(g.style['--ri-right-foot'],'0.00px');
   assert.equal(g.style['--ri-facing'],String(mode==='reduce'?1:q.facing));assert.equal(g.style.opacity,'1');assert.equal(g.style.pointerEvents,'auto');
   if(mode!=='motion'){assert.equal(g.dataset.walking,'false');assert.equal(g.style['--ri-guardian-frame'],'50%');assert.equal(g.style['--ri-guardian-offset'],'0.000000%');}
   renders++;
  }
 }
}
assert.equal(api.guardianLoopMs,72000);
console.log(JSON.stringify({passed:true,scheduleSamples:72001,frameChanges:changes,minFrameHoldMs:minHold,neutralStopSamples:neutralStops,renderSamples:renders,cameras:2,viewportMathCases:5,bodyRotationDegrees:0,facingMagnitude:1,pathAndTimingPreserved:true}));
