#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'../media/history-evening.css'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
function block(marker){const start=css.indexOf(marker);assert.ok(start>=0,marker);const open=css.indexOf('{',start);let depth=1;for(let i=open+1;i<css.length;i++){if(css[i]==='{')depth++;if(css[i]==='}'&&--depth===0)return css.slice(open+1,i);}assert.fail('Unclosed '+marker);}
function frames(name){const all=new Map();for(const [,keys,body] of block('@keyframes '+name+'{').matchAll(/([^{}]+)\{([^{}]+)\}/g)){for(const key of keys.trim().split(',')){const n=Number.parseFloat(key);assert.ok(n>=0&&n<=100);assert.ok(!all.has(n),'Unique keyframe '+n);all.set(n,body);}}return all;}
const body=frames('he-koromon-hop'),shadow=frames('he-koromon-hop-shadow');
const expected=new Set([0,8,44,56,92,100]);
for(const start of [8,56])for(let n=0;n<12;n++){for(const phase of [0,.12,.43,.62,.88,1])expected.add(Number((start+3*n+3*phase).toFixed(4)));}
const sorted=x=>[...x].sort((a,b)=>a-b);
assert.deepEqual(sorted(body.keys()),sorted(expected));assert.deepEqual(sorted(shadow.keys()),sorted(expected));
assert.equal(body.get(0),body.get(100));assert.equal(shadow.get(0),shadow.get(100));
let apex=0;
for(const [t,transform] of body){
  assert.match(transform,/^transform:translateY\((?:0|-20%|-18%)\) scale\((?:1|1\.04,\.96|\.98,1\.02|\.99,1\.01)\)$/);
  assert.doesNotMatch(transform,/background|clip|mask|opacity|left|top/,'Original sprite stays whole');
  if(transform.includes('-20%')){apex++;assert.equal(shadow.get(t),'transform:scaleX(.68);opacity:.55');}
  if(t<=8||(t>=44&&t<=56)||t>=92){assert.equal(transform,'transform:translateY(0) scale(1)');assert.equal(shadow.get(t),'transform:scaleX(1);opacity:1');}
  assert.doesNotMatch(shadow.get(t),/translate|top|bottom/,'Shadow never jumps off the path');
}
assert.equal(apex,24,'Twelve hops on each travel leg');
const native=block('html body #app .history-evening .he-koromon .he-native{');
assert.match(native,/hanq-koromon-actions 13s -4s steps\(1,end\) infinite,he-koromon-hop var\(--he-duration\) var\(--he-delay\) ease-in-out infinite!important/);
assert.match(block('html body #app .history-evening .he-koromon .he-resident-shadow{'),/he-koromon-hop-shadow var\(--he-duration\) var\(--he-delay\)/);
assert.match(css,/\.history-evening\.he-paused \.he-koromon :is\(\.he-native,\.he-resident-shadow\)\{animation-play-state:paused!important\}/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{html body #app \.history-evening \.he-koromon :is\(\.he-native,\.he-resident-shadow\)\{animation:none!important;transform:none!important;opacity:1\}\}/);
const koromon=block('html body #app .history-evening .he-koromon{');
assert.match(koromon,/--he-duration:28s;--he-delay:-12s/);
const route=frames('he-path-walk');
for(const [a,b] of [[0,8],[44,50],[50.01,56],[92,99.99]])assert.equal(route.get(a),route.get(b),'Original standing interval');
assert.match(route.get(44),/left:var\(--he-x3\);top:var\(--he-y3\)/);
assert.match(route.get(56),/left:var\(--he-x3\);top:var\(--he-y3\)/);
const sizes={};
for(const character of ['friend','koromon','gabumon','patamon']){
 const matches=[...css.matchAll(new RegExp('\\.he-'+character+'\\{(?:--he-facing:-1;)?--he-size:([\\d.]+)%','g'))];
 assert.equal(matches.length,2);sizes[character]=matches.map(x=>Number(x[1]));
}
assert.deepEqual(sizes,{friend:[3.8,5.8],koromon:[2.9,5.2],gabumon:[2.6,4.6],patamon:[3,4.2]});
assert.ok(sizes.gabumon[0]*1.075<sizes.friend[0],'Distant figure stays smaller');
assert.doesNotMatch(css,/he-agumon-walk|he-gabumon-walk/,'No claim of unavailable walk cels');
console.log('History characters: 24 synchronized hops, grounded rest/landing/shadows, intact cels, paused/reduced-motion and perspective-size contracts passed. Biped walking remains outside this unit.');
