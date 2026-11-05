'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../media/rainbow-island.js'),'utf8'),window={};
vm.runInNewContext(source,{window});const T=window.HanqRainbow.track;
const at=seconds=>T.phase(seconds/(T.loopMs/1000));
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);
assert.equal(T.loopMs,20000);
for(const [seconds,u,moving,opacity] of [[0,0,false,0],[1,0,false,1],[2,0,true,1],[8,.5,true,1],[14,1,false,1],[15.6,1,false,1],[16,1,false,1],[17,1,false,0],[19,1,false,0],[20,0,false,0]]){
 const q=at(seconds);close(q.u,u);assert.equal(q.moving,moving);close(q.opacity,opacity);assert.equal(q.direction,1);
}
const velocity=t=>(at(t+1e-5).u-at(t-1e-5).u)/2e-5;
for(const join of [2,3.44,12.56,14])close(velocity(join-1e-4),velocity(join+1e-4),2e-5);
close(velocity(2),0,1e-6);close(velocity(14),0,1e-6);
close(velocity(4),velocity(8));close(velocity(8),velocity(12));
assert.equal(40/12,10/3,'Same rail distance takes 30 percent of the old travel time');
for(const camera of Object.values(T.tracks)){
 const p=T.path(camera),start=T.poses(camera,0)[0],end=T.poses(camera,.78)[0];
 close(start.d,p.total*.28);close(end.d,p.total*.56);
 assert.equal(end.opacity,1);assert.equal(end.moving,false);
 let previous=null;
 for(let ms=0;ms<=40000;ms+=10){const q=T.poses(camera,ms/T.loopMs)[0];assert.equal(q.sx,1);assert.equal(q.direction,1);assert.equal(q.depth,1);assert(q.opacity>=0&&q.opacity<=1);if(previous&&q.opacity>0&&previous.opacity>0){assert(q.d>=previous.d-1e-8,'No visible reset');assert(q.d-previous.d<.13,'No position jump at 100Hz');}previous=q;}
}

// Exercise the actual clock/position functions with synthetic render targets.
// No browser, account, network or API mutation is used.
function extract(name){const start=source.indexOf('function '+name+'(');assert(start>=0);const open=source.indexOf('{',start);let depth=1;for(let i=open+1;i<source.length;i++){if(source[i]==='{')depth++;if(source[i]==='}'&&--depth===0)return source.slice(start,i+1);}assert.fail(name);}
let requested=0,cancelled=0;const car={style:{},dataset:{}};
const h={TRACKS:T.tracks,trainPoses:T.poses,LOOP_MS:T.loopMs,REDUCED_SCENE_MS:49920,elapsed:0,trainElapsed:0,last:0,raf:0,lookX:0,lookY:0,drawnX:0,drawnY:0,view:{camera:'wide',ox:0,oy:0,s:1},cars:[car],document:{hidden:false},reduced:{matches:false},scene:{dataset:{}},world:{style:{setProperty(){}}},root:{requestAnimationFrame(){return ++requested;},cancelAnimationFrame(){cancelled++;}},active:()=>true,positionPatrol(){},positionBabies(){}};
vm.createContext(h);vm.runInContext(extract('positionTrain')+';'+extract('motion')+';'+extract('tick'),h);
h.tick(1000);h.tick(1016);assert.equal(h.elapsed,16);assert.equal(h.trainElapsed,16);
h.reduced.matches=true;h.motion();assert.equal(h.elapsed,49920,'Other residents keep their original static time');assert.equal(h.trainElapsed,15600);assert.equal(h.scene.dataset.paused,'true');assert.equal(car.style.opacity,1);assert.equal(car.dataset.moving,'false');
const parked=car.style.transform;h.tick(9000);assert.equal(car.style.transform,parked);assert.equal(h.trainElapsed,15600);
h.reduced.matches=false;h.motion();h.tick(10000);assert.equal(car.style.transform,parked,'No backward jump when motion resumes');assert.equal(h.elapsed,49920);h.tick(10016);assert.equal(h.trainElapsed,15616);assert.equal(h.elapsed,49936);
h.trainElapsed=6000;h.positionTrain();assert.equal(car.dataset.moving,'true','Hidden test begins during travel');h.document.hidden=true;h.motion();const frozen=[h.elapsed,h.trainElapsed,car.style.transform];h.tick(20000);assert.deepEqual([h.elapsed,h.trainElapsed,car.style.transform],frozen);
h.document.hidden=false;h.motion();h.tick(21000);assert.deepEqual([h.elapsed,h.trainElapsed,car.style.transform],frozen,'No wall-time catch-up on return');h.tick(22000);assert.equal(h.elapsed,frozen[0]+80);assert.equal(h.trainElapsed,frozen[1]+80,'Existing long-frame clamp applies to both clocks');
h.elapsed=0;h.trainElapsed=0;h.reduced.matches=true;h.motion();h.positionTrain();assert.equal(car.style.transform,parked,'Initial reduced mode and resize keep parked train');assert.equal(h.elapsed,49920);h.reduced.matches=false;h.motion();h.tick(30000);assert.equal(car.style.transform,parked,'Initial reduced mode resumes without jump');
assert.match(source,/elapsed=REDUCED_SCENE_MS;trainElapsed=LOOP_MS\*\.78/);
assert.match(source,/trainPoses\(c,\(trainElapsed%LOOP_MS\)\/LOOP_MS\)/);
assert.ok(requested>0&&cancelled>0);
console.log(JSON.stringify({passed:true,loopMs:T.loopMs,travelMs:12000,averageSpeedMultiplier:40/12,smoothVelocity:true,wideAndTall:true,reducedPosePreserved:true,resumeNoJump:true,hiddenClockStops:true,sharedFrameClamp:true}));
