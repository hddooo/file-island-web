'use strict';
// CSS sizing contract and mathematical samples only, not browser pixel QA.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),css=fs.readFileSync(path.join(root,'media/world-map.css'),'utf8'),source=fs.readFileSync(path.join(root,'media/world-map.js'),'utf8');
const clamp=(min,percent,max,width)=>Math.max(min,Math.min(max,width*percent/100));
function triple(text){const m=/clamp\((\d+(?:\.\d+)?)px,(\d+(?:\.\d+)?)%,(\d+(?:\.\d+)?)px\)/.exec(text);assert(m,'A bounded percentage width is required');return m.slice(1).map(Number);}
const base=/\.wm-roamer\{([^}]+)\}/.exec(css)[1];
const small=/@media\(max-width:700px\)\{[^\n]*?\.wm-roamer\{([^}]+)\}/.exec(css)[1];
assert.match(base,/width:var\(--wm-roamer-wide,clamp\(26px,4\.6%,58px\)\)/);
assert.match(base,/transform:translate\(-50%,-100%\)/,'Keep the existing foot anchor');
assert.match(base,/pointer-events:none/,'Decorative sprites cannot steal navigation clicks');
assert.match(base,/contain:layout style/);
assert.match(small,/width:var\(--wm-roamer-small,clamp\(20px,8\.1%,38px\)\)/);
assert(!/min-width|max-width/.test(small),'Old mobile width clamps must not override the new size');
const specs={meramon:{wide:triple(base),small:triple(small)}};
for(const id of ['frigimon','shellmon','monzaemon']){
 const block=css.match(new RegExp('\\.wm-roamer\\[data-character="'+id+'"\\]\\{([^}]+)\\}'))?.[1];assert(block,id+' depth size must be explicit');
 assert(block.split(';').filter(Boolean).every(d=>/^--wm-roamer-(wide|small):/.test(d)),'Character overrides only set size variables');
 specs[id]={wide:triple(block.split(';')[0]),small:triple(block.split(';')[1])};
}
assert.deepEqual(specs,{meramon:{wide:[26,4.6,58],small:[20,8.1,38]},frigimon:{wide:[24,4.1,52],small:[18,7.2,34]},shellmon:{wide:[28,5,64],small:[22,8.7,40]},monzaemon:{wide:[30,5.2,66],small:[22,9.1,42]}});
const samples=[];
for(const mode of ['wide','small'])for(const width of [200,280,320,390,700,768,1112,1440,2000]){
 const old=mode==='wide'?clamp(40,8,100,width):clamp(32,14,64,width),sizes={};
 for(const [id,s] of Object.entries(specs)){
  const size=clamp(...s[mode],width);sizes[id]=size;
  assert(size>=18&&size<=66,'Decorative sprite remains bounded');
  assert(size<old*.78,'Each character is materially smaller than before');
 }
 assert(sizes.frigimon<sizes.meramon&&sizes.meramon<sizes.shellmon&&sizes.shellmon<=sizes.monzaemon,'Far ice character stays smaller than middle and foreground characters');
 samples.push({mode,width,oldWidth:old,sizes});
}
assert.match(css,/background-image:url\('world-map-roamers-v1\.png'\)/,'Reuse the original atlas');
assert.match(source,/windows=\[\[0,338\],\[338,297\],\[635,290\],\[925,329\]\]/,'Keep unequal native row crops');
assert.match(css,/\.wm-destination:focus-visible\{outline:3px solid/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(source,/animations=\[\];if\(dead\|\|reduce\.matches\)return;/,'Cancel animations and return for reduced motion');
assert.equal((source.match(/id:'(?:hall|ice|history|toeic|rainbow|inquiry)',label:/g)||[]).length,6,'All six destinations remain registered');
const report={passed:true,scope:'Static CSS contract and 18 mathematical width cases, not rendered layout or FPS',samples};
if(process.env.HANQ_QA_REPORT)fs.writeFileSync(process.env.HANQ_QA_REPORT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
