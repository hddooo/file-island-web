'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const f of ['cbt-classification79.js','cbt-classifications.js','cbt-result-analysis.js'])vm.runInContext(fs.readFileSync(path.join(root,'media',f),'utf8'),ctx);
let checks=0;function ok(v){assert(v);checks++;}
for(const round of [...Object.keys(ctx.window.HANQ_CBT_CLASSIFICATIONS).map(Number),79]){
 const data=round===79?ctx.window.HANQ_CBT_CLASSIFICATION79:ctx.window.HANQ_CBT_CLASSIFICATIONS[round];
 const items=data.items.map((x,i)=>({exam:round,number:x.number,questionId:x.questionId,version:x.version,position:i,review:{status:i===0?'wrong':i===49?'unanswered':'correct'}}));
 const a=ctx.window.HanqCbtResultAnalysis.analyze(items);
 ok(a.rows.length===50);ok(a.verified===data.items.every(x=>x.verified===true));ok(a.wrongNumbers.join(',')==='1,50');ok(a.unansweredNumbers.join(',')==='50');ok(a.eras.reduce((n,e)=>n+e.total,0)===50);ok(a.priorities.reduce((n,e)=>n+e.wrong,0)===2);
 for(const x of items){ok(ctx.window.HanqCbtResultAnalysis.classification(x).verified===data.items[x.position].verified);ok(!ctx.window.HanqCbtResultAnalysis.classification({...x,version:'stale'}).verified);ok(!ctx.window.HanqCbtResultAnalysis.classification({...x,questionId:'different'}).verified);}
 ok(items.every(x=>!Object.hasOwn(data.items[x.position],'answer')));
}
console.log(`${checks} multi-round checks passed`);
