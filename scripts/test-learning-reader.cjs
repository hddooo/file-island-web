'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
for(const f of ['exam-pool','history-readable','passage-layouts','learning-reader'])vm.runInNewContext(fs.readFileSync(path.join(root,'media/'+f+'.js'),'utf8'),ctx);
const reader=ctx.window.HanqLearningReader,pool=ctx.window.HANQ_EXAM_POOL,data=ctx.window.HANQ_HISTORY_READABLE;
ctx.HANQ_HISTORY_READABLE=data;ctx.HANQ_PASSAGE_LAYOUTS=ctx.window.HANQ_PASSAGE_LAYOUTS;
const inventory=JSON.parse(fs.readFileSync(path.join(root,'docs/history-readability-inventory.json')));
assert.equal(inventory.questions.length,500);assert.equal(inventory.counts.text,Object.keys(data).length);
for(const [id,row] of Object.entries(data)){
 const q=pool.questions[id];assert(reader.historyData(q),id);assert(!reader.historyData({...q,v:'different-version'}));assert(!reader.historyData({...q,options:[...q.options].reverse()}));
 assert.equal(row.imageSha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,q.image))).digest('hex'));
 assert.equal(row.options.length,5);assert(!('answer' in row));assert(!('review' in row));
 if(row.common){assert(!reader.historyData({...q,commonImageSha256:'changed-source'}));assert(!reader.historyData({...q,common:{questionNumbers:[1,2]}}));}
}
let groups=0,documents=0;
for(const file of process.argv.slice(2)){
 let d=JSON.parse(fs.readFileSync(file));d=d.content||d;
 for(const g of Array.isArray(d)?d:d.groups||[]){
  const text=g.passage;if(!text||!ctx.HANQ_PASSAGE_LAYOUTS[reader.signature(text)])continue;
  const parts=reader.documents(text);assert.equal(parts.map(p=>text.slice(p.start,p.end)).join(''),text);
  const seen={};for(const p of parts){seen[p.type]=(seen[p.type]||0)+1;assert.equal(p.rank,seen[p.type]);assert(p.start<p.end);}
  if((g.id||g.groupId)==='vol1-rc-186-190')assert.equal(parts[2].label,'지문 3 · 두 번째 이메일');
  if((g.id||g.groupId)==='wd1-p7-176-180')assert.equal(parts[1].label,'지문 2 · 두 번째 이메일');
  groups++;documents+=parts.length;
 }
}
assert.equal(reader.documents('From: A\nTo: B\n\nA quoted message:\nFrom: C\nTo: D').length,1,'unreviewed quoted emails must not be split');
assert.equal(reader.documents('DOCUMENT 1 — E-mail\nX\nDOCUMENT 3 — E-mail\nY').length,1,'nonconsecutive source labels fall back');
assert.equal(reader.documents('one\n\ntwo\n\nthree').length,1,'paragraphs are not documents');
console.log(JSON.stringify({passed:true,inventory:inventory.counts,groups,documents,identityAndVersionGuard:true,sourcePreserved:true,noAnswersInTextData:true}));
