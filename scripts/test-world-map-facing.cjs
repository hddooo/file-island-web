'use strict';
// Extract actual animation declarations, then model standard WAAPI timing.
// This checks contracts/math, not rendered browser animation or pixel quality.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'media/world-map.js'),'utf8');
const start=source.indexOf('actors.forEach(function(a,i)'),end=source.indexOf("if(!stage.classList.contains('wm-art-ready'))return;",start);
assert(start>=0&&end>start);const code=source.slice(start,end);
const ids=['meramon','shellmon','frigimon','monzaemon'],durations=[14500,16600,18700,20800];
function faceAt(animation,phase){
 let p=phase%1;if(p<0)p+=1;
 if(animation.options.easing==='steps(1,end)')p=Math.floor(p);
 else assert.equal(animation.options.easing,'linear');
 const frames=animation.frames.map((f,i)=>({...f,offset:f.offset??(i===0?0:1)}));
 let k=0;while(k+1<frames.length&&frames[k+1].offset<=p)k++;
 const a=frames[k],b=frames[k+1]||a,from=Number(/scaleX\((-?\d+)\)/.exec(a.transform)[1]),to=Number(/scaleX\((-?\d+)\)/.exec(b.transform)[1]);
 const progress=b.offset===a.offset?0:(p-a.offset)/(b.offset-a.offset);
 return a.easing==='steps(1,end)'?from:from+(to-from)*progress;
}
const cases=[];
for(const [w,isSmall] of [[320,true],[390,true],[700,true],[1112,false],[1440,false]]){
 const actors=ids.map((id,i)=>({node:{id,kind:'travel'},face:{id,kind:'face'},sprite:{id,kind:'sprite'},bgY:[0,338/(1254-297)*100,635/(1254-290)*100,100][i]})),calls=[];
 vm.runInNewContext(code,{actors,w,small:{matches:isSmall},animate:(node,frames,options)=>calls.push({node,frames:JSON.parse(JSON.stringify(frames)),options:{...options}})});
 assert.equal(calls.length,12,'No added timers or animation tracks');
 for(let i=0;i<4;i++){
  const [travel,face,sprite]=calls.slice(i*3,i*3+3),amp=w*(isSmall?.022:.027),dy=w*.004;
  assert.equal(face.node.id,ids[i]);assert.equal(face.node.kind,'face');
  assert.deepEqual(face.options,{duration:durations[i],iterations:Infinity,easing:'linear'});
  assert.deepEqual(face.frames.map(f=>f.offset??(face.frames.indexOf(f)===0?0:1)),[0,.45,.95,1]);
  assert.deepEqual(face.frames.map(f=>f.transform),['scaleX(1)','scaleX(-1)','scaleX(1)','scaleX(1)']);
  assert(face.frames.every(f=>f.easing==='steps(1,end)'),'Step individual intervals, not the whole effect');
  assert.deepEqual(travel.options,{duration:durations[i],iterations:Infinity,easing:'linear'});
  assert.deepEqual(travel.frames,[{transform:`translate(calc(-50% - ${amp}px),-100%)`},{offset:.4,transform:`translate(calc(-50% + ${amp}px),calc(-100% - ${dy}px))`},{offset:.5,transform:`translate(calc(-50% + ${amp}px),calc(-100% - ${dy}px))`},{offset:.9,transform:`translate(calc(-50% - ${amp}px),calc(-100% + ${dy}px))`},{transform:`translate(calc(-50% - ${amp}px),-100%)`}],'Original path and endpoint pauses are unchanged');
  assert.deepEqual(sprite.options,{duration:1050+i*110,iterations:Infinity,easing:'linear'});
  assert.deepEqual(sprite.frames,[0,1,2,3,0].map((f,k)=>({offset:k/4,easing:'steps(1,end)',backgroundPosition:f*100/3+'% '+actors[i].bgY+'%'})),'Native atlas cadence/crops stay unchanged');
  for(let tick=0;tick<=4000;tick++){
   const phase=tick/2000,local=phase%1,direction=faceAt(face,phase),expected=local>=.45&&local<.95?-1:1;
   assert.equal(direction,expected,'Whole shape flips instantly without scale-through-zero');
   if(local<.4)assert.equal(direction,1,'Face right on outward travel');
   if(local>=.5&&local<.9)assert.equal(direction,-1,'Face left on return travel');
  }
  for(const turn of [.45,.95]){
   const epsilon=.001/durations[i];assert.notEqual(faceAt(face,turn-epsilon),faceAt(face,turn+epsilon),'Flip at the pause boundary with no missed phase');
   assert(turn>.4&&turn<.5||turn>.9&&turn<1,'Only flip while horizontal travel pauses');
  }
  assert.equal(faceAt({...face,options:{...face.options,easing:'steps(1,end)'}},.7),1,'Reproduce the prior effect-level timing defect');
  assert.equal(faceAt(face,.7),-1,'Fix the prior return-leg regression');
  cases.push({id:ids[i],mapWidth:w,small:isSmall,duration:durations[i],flipTimesMs:[durations[i]*.45,durations[i]*.95]});
 }
}
assert.match(source,/animations\.forEach\(function\(a\)\{a.cancel\(\);\}\);animations=\[\];if\(dead\|\|reduce.matches\)return;/,'Reduced motion cancels all tracks before returning');
const report={passed:true,scope:'20 declaration/timing cases and 80,020 phase samples; not browser rendering',cases};
if(process.env.HANQ_QA_REPORT)fs.writeFileSync(process.env.HANQ_QA_REPORT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
