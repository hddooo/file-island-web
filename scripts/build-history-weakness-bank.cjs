'use strict';
const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const input=path.resolve(process.argv[2]||'.'),out=path.resolve(__dirname,'../media/history-weakness-bank.js');
const names=['modern','ancient','opening-colonial'],book={},prompts=new Set();
const good=t=>typeof t==='string'&&t.trim().length>0;
for(const part of names){
 const qs=JSON.parse(fs.readFileSync(path.join(input,part+'.json'),'utf8'));a.equal(qs.length,50);
 const counts=[0,0,0,0];
 qs.forEach((q,i)=>{
  a.equal(q.id,part+'-'+String(i+1).padStart(2,'0'));a([1,2,3,4].includes(q.answer));counts[q.answer-1]++;
  a([q.prompt,q.stem,q.conclusion,q.source].every(good),q.id);
  for(const xs of [q.options,q.explain])a(Array.isArray(xs)&&xs.length===4&&xs.every(good)&&new Set(xs).size===4,q.id);
  a(!prompts.has(q.prompt),q.id);prompts.add(q.prompt);
 });
 a(counts.every(n=>n>=12&&n<=13),part);
 book[part]=qs;
}
book.version=crypto.createHash('sha256').update(JSON.stringify(book)).digest('hex').slice(0,16);
fs.writeFileSync(out,'/* 150 original HanQ study checks: 3 parts, 50 questions each. */\nwindow.HanqWeaknessPracticeBank='+JSON.stringify(book)+';\n');
console.log('150 distinct prompts · 600 options · 600 option explanations · balanced 50-item parts');
