'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../media/history-evening.js'),'utf8');
const window={};
vm.runInNewContext(source,{window,Intl,Map,matchMedia:()=>({matches:false}),document:{currentScript:null}});
const at=window.HanqHistoryEvening.daylightAt;
const cases=[['2026-11-05T15:00:00Z','night',0,0],['2026-11-05T20:30:00Z','dawn',330,0],['2026-11-05T23:00:00Z','day',480,1],['2026-11-06T08:00:00Z','dusk',1020,1],['2026-11-06T11:00:00Z','night',1200,0]];
for(const [date,period,minutes,light]of cases){const p=at(new Date(date));assert.equal(p.period,period);assert.equal(p.minutes,minutes);assert.equal(p.light,light);}
let last=null,maxDelta=0;
for(let minute=0;minute<=1440;minute++){const p=at(new Date(Date.UTC(2026,10,5,15,minute)));assert(p.light>=0&&p.light<=1);if(last)maxDelta=Math.max(maxDelta,Math.abs(p.light-last.light));last=p;}
assert(maxDelta<=.011,'Minute-to-minute light change remains gradual');
assert.equal(at(new Date('2026-11-06T00:00:00+09:00')).minutes,0);
assert.equal(at(new Date('2026-11-05T07:00:00-08:00')).minutes,0);
assert(source.includes('clearTimeout(clockTimer)'));
const css=fs.readFileSync(path.join(__dirname,'../media/history-evening.css'),'utf8');
assert(css.includes('filter:brightness(var(--he-brightness,.47))'));
assert(css.includes('filter:opacity(var(--he-night-strength,1))'));
assert(css.includes('transition:none!important'));
assert(css.includes('calc(.8 - .74 * var(--he-daylight,0))'));
assert(css.includes('calc(.85 - .79 * var(--he-daylight,0))'));
assert(css.includes('calc(.6 - .54 * var(--he-daylight,0))'));
assert(css.includes('calc(.72 - .66 * var(--he-daylight,0))'));
assert(css.includes('brightness(calc(.83 + .17 * var(--he-daylight,0)))'));
assert(css.includes('brightness(calc(.8 + .2 * var(--he-daylight,0)))'));
console.log(JSON.stringify({passed:true,cases:cases.length,minuteSamples:1441,maxDelta,hostTimezone:process.env.TZ||'default'}));
