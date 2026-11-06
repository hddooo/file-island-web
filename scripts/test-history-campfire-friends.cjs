#!/usr/bin/env node
'use strict';
// Geometry and source contracts only. Actual browser rendering is separate.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'../media/history-evening.css'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'../media/history-evening.js'),'utf8');
assert.doesNotMatch(css+js,/he-chairs/,'No chair layer remains');
assert.equal((js.match(/class="he-firepit"/g)||[]).length,1);
assert.match(js,/layer\.setAttribute\('aria-hidden','true'\)/);
assert.match(css,/\.history-evening \*\{pointer-events:none!important/);
const pit=css.match(/\.he-firepit\{([^}]+)\}/)[1];
assert.match(pit,/background:var\(--he-camp-art\) center\/contain no-repeat!important/);
const polygon=pit.match(/clip-path:polygon\(([^)]+)\)/)[1].split(',').map(p=>p.split(' ').map(Number.parseFloat));
function inside(x,y){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [xi,yi]=polygon[i],[xj,yj]=polygon[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)yes=!yes;}return yes;}
for(const [x,y] of [[49,80],[49,90],[42,75],[58,80]])assert(inside(x,y),'Stone pit is retained');
for(const [x,y] of [[20,40],[20,60],[20,80],[80,40],[80,60],[80,80],[40,30],[60,30]])assert(!inside(x,y),'Chair backs, seats, legs and outer shadows are excluded');
const routes={};
for(const name of ['friend','koromon','gabumon','patamon']){
 const blocks=[...css.matchAll(new RegExp('html body #app \\.history-evening \\.he-'+name+'\\{(?:--he-facing:-1;)?--he-size:([^}]+)\\}','g'))];
 assert.equal(blocks.length,2,'Separate wide and portrait route');
 routes[name]=blocks.map((b,index)=>{const points=[];for(let i=0;i<4;i++){const x=Number(b[0].match(new RegExp('--he-x'+i+':([\\d.]+)%'))[1]),y=Number(b[0].match(new RegExp('--he-y'+i+':([\\d.]+)%'))[1]);assert(x>=(index?30:42)&&x<=(index?50:55));assert(y>=(index?69:55)&&y<=(index?74:62),'Feet remain above the shore');points.push([x,y]);}assert(points[3][0]-points[0][0]<=1.5+1e-9,'Short stroll stays within each side of the gathering');return points;});
}
for(let layout=0;layout<2;layout++){
 const [min,max]=layout?[34.11,45.27]:[44.58,51.06];
 assert(routes.koromon[layout].every(([x])=>x<min));
 assert(routes.friend[layout].every(([x])=>x>max));
 assert(routes.gabumon[layout].every(([,y])=>y<(layout?71:57)));
 assert(routes.patamon[layout].every(([,y])=>y<(layout?71:57)));
}
assert.match(css,/@keyframes he-path-walk/);
assert.match(css,/\.he-paused :is\(\.he-friend,\.he-friend-sprite,\.he-resident/);
console.log('History campfire friends: chair exclusion, retained stone pit, four grouped wide/portrait routes, shore bounds and decorative pointer/ARIA contracts passed.');
