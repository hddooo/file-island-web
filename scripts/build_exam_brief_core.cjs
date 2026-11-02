'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),input=JSON.parse(fs.readFileSync(path.join(root,'docs/exam-brief-core-input.json'))),w={};
vm.runInNewContext(fs.readFileSync(path.join(root,'media/exam-pool.js'),'utf8'),{window:w});
const bank={schema:1,questions:{}};
assert.equal(input.rows.length,500);
for(const row of input.rows){
 const q=w.HANQ_EXAM_POOL.questions[row.id];assert(q&&row.ready&&q.v===row.contentVersion&&q.rv===row.reviewVersion,row.id+' exact saved review snapshot');
 assert(row.core.length>=3&&row.core.length<=5&&new Set(row.core).size===row.core.length,row.id+' distinct related facts');
 assert(row.coreFacts.length===row.core.length&&row.coreFacts.every(f=>f.sourceRefs&&f.sourceRefs.length),row.id+' source evidence');
 assert(!row.core.some(x=>/^[ㄱ-ㅎ0-9]{1,3}[.)]?$/.test(x.trim())),row.id+' no isolated choice labels');
 assert(!bank.questions[row.id],row.id+' duplicate');bank.questions[row.id]={v:row.contentVersion,rv:row.reviewVersion,core:row.core};
}
const file=path.join(root,'media/exam-brief-core.js'),body='window.HANQ_EXAM_BRIEF_CORE='+JSON.stringify(bank)+';\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),body);else fs.writeFileSync(file,body);
console.log('Version-scoped original-exam display core:500; originals untouched');
