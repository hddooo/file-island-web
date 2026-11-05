'use strict';
// Display-only registration of the existing three 724px guardian cells.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'media/rainbow-island.js'),'utf8'),css=fs.readFileSync(path.join(root,'media/rainbow-island.css'),'utf8');
function extract(text,name){const start=text.indexOf('function '+name+'(');assert(start>=0,name);const open=text.indexOf('{',start);let depth=1;for(let i=open+1;i<text.length;i++){if(text[i]==='{')depth++;if(text[i]==='}'&&--depth===0)return text.slice(start,i+1);}assert.fail(name);}
const window={};vm.runInNewContext(source,{window});const T=window.HanqRainbow.track;
const helper={};vm.createContext(helper);vm.runInContext(extract(source,'guardianSpritePose'),helper);
const expectedOffsets=[-67/724*100,0,37/724*100];
const near=(a,b,epsilon=1e-6)=>assert(Math.abs(a-b)<=epsilon,`${a} != ${b}`);
let scheduleSamples=0;
for(let ms=0;ms<=144000;ms+=20){const seconds=ms/1000,q=window.HanqRainbow.guardianPose(seconds);
 for(const paused of [false,true]){const p=helper.guardianSpritePose(seconds,q,paused),phase=(q.direction>0?q.x+1:1-q.x)*24,frame=!paused&&q.walking&&q.strength>.25?[1,0,1,2][Math.floor(phase+.5)%4]:1;assert.equal(p.frame,frame,'Distance-coupled frame schedule');near(p.offset,expectedOffsets[frame]);if(paused||!q.walking||q.strength<=.25){assert.equal(p.frame,1);assert.equal(p.offset,0);}scheduleSamples++;}}
assert.match(css,/background-image:url\('world-art\/rainbow-guardian-walk-v1\.webp'\);background-size:300% 100%;background-position:var\(--ri-guardian-frame,50%\) center;transform:scaleX\(var\(--ri-facing,1\)\) rotate\(var\(--ri-step,0deg\)\) translateX\(var\(--ri-guardian-offset,0%\)\);transform-origin:50% 97%/,'Register local pixels before existing rotate/mirror');
assert.match(css,/#rainbowHost \.ri-sprite\{[^}]*background-repeat:no-repeat;pointer-events:none/);
// Measured eye midpoints of unchanged source asset SHA256 5ae51e4a...0c85a5.
// Pixel decoding is independently reproducible in the private QA evidence.
const eyes=[[463.0225497137783,198.46878344572372],[395.7944165956001,196.75271092899584],[358.6532489244555,198.0658679030784]],dx=[-67,0,37];
const corrected=eyes.map((p,i)=>p[0]+dx[i]);assert(Math.max(...corrected)-Math.min(...corrected)<1);
// A mirrored sprite must also mirror the correction. No zero/negative size or
// changes to vertical registration, shadow, node hit rectangle or path.
for(const width of [86,92,125,178.6,190])for(const facing of [-1,-.72,.72,1])for(const angle of [-1.8,0,1.8]){
 const rad=angle*Math.PI/180,cos=Math.cos(rad),sin=Math.sin(rad),origin=[362,724*.97];
 const transformed=eyes.map((p,i)=>{const x=p[0]+dx[i]-origin[0],y=p[1]-origin[1];return[(facing*(cos*x-sin*y)+origin[0])*width/724,(sin*x+cos*y+origin[1])*width/724];});
 assert(Math.max(...transformed.map(p=>p[0]))-Math.min(...transformed.map(p=>p[0]))<.3,'Registration survives original rotation and both directions');
}
function renderHarness(text,camera,width,height){const api={};vm.runInNewContext(text,{window:api});const selectors=['.ri-guardian','.ri-helper-red','.ri-helper-blue'];const nodes=Object.fromEntries(selectors.map(s=>[s,{style:{setProperty(k,v){this[k]=v;}},dataset:{}}]));const track=api.HanqRainbow.track,f=track.frame(track.tracks[camera],width,height),h={TRACKS:track.tracks,patrolPose:api.HanqRainbow.patrolPose,guardianPose:api.HanqRainbow.guardianPose,elapsed:0,height,view:{camera,s:f.s,ox:f.ox,oy:f.oy},reduced:{matches:false},document:{hidden:false},host:{querySelector(s){assert(nodes[s]);return nodes[s];}}};vm.createContext(h);if(text.includes('function guardianSpritePose('))vm.runInContext(extract(text,'guardianSpritePose'),h);vm.runInContext(extract(text,'positionPatrol'),h);return{h,nodes};}
const oldPath=process.env.HANQ_BASELINE_RAINBOW,baseline=oldPath?fs.readFileSync(oldPath,'utf8'):null;let renderSamples=0;
for(const [width,height]of [[1114,556],[320,500],[390,700],[1440,720],[1024,300]]){const camera=width/height<1.1?'tall':'wide',r=renderHarness(source,camera,width,height),b=baseline?renderHarness(baseline,camera,width,height):null;
 for(let ms=0;ms<=144000;ms+=20){r.h.elapsed=ms;r.h.positionPatrol();const g=r.nodes['.ri-guardian'],q=window.HanqRainbow.guardianPose(ms/1000),p=helper.guardianSpritePose(ms/1000,q,false);assert.equal(g.style['--ri-guardian-frame'],p.frame*50+'%');near(parseFloat(g.style['--ri-guardian-offset']),p.offset);assert.equal(g.style.opacity,'1');assert.equal(g.style.pointerEvents,'auto');assert.equal(g.dataset.direction,q.direction>0?'right':'left');
  if(b){b.h.elapsed=ms;b.h.positionPatrol();for(const sel of Object.keys(r.nodes)){const actual=JSON.parse(JSON.stringify(r.nodes[sel])),previous=JSON.parse(JSON.stringify(b.nodes[sel]));if(sel==='.ri-guardian')for(const property of ['--ri-step','--ri-left-foot','--ri-right-foot','--ri-facing','--ri-guardian-frame','--ri-guardian-offset']){delete actual.style[property];delete previous.style[property];}assert.deepEqual(actual,previous,'Guardian geometry and all helper outputs stay unchanged');}}
  for(const sel of ['.ri-helper-red','.ri-helper-blue'])assert(!Object.hasOwn(r.nodes[sel].style,'--ri-guardian-offset'));renderSamples++;}
 // These are direct renderer calls, not visibility-event simulation. Existing
 // motion() freezes the last rendered pose on hide without invoking this path.
 for(const mode of ['reduce','hidden']){r.h.reduced.matches=mode==='reduce';r.h.document.hidden=mode==='hidden';for(const elapsed of [0,500,10000,31999,34000,49920,71999]){r.h.elapsed=elapsed;r.h.positionPatrol();assert.equal(r.nodes['.ri-guardian'].style['--ri-guardian-frame'],'50%');assert.equal(r.nodes['.ri-guardian'].style['--ri-guardian-offset'],'0.000000%');assert.equal(r.nodes['.ri-guardian'].dataset.walking,'false');}}
}
console.log(JSON.stringify({passed:true,scheduleSamples,renderSamples,viewportMathCases:5,baselineCompared:!!baseline,distanceCoupledFrameSchedule:true,pausedRenderNeutral:true,helperOutputsPreserved:true,mirroredRegistration:true}));
