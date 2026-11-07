'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');const root=path.resolve(__dirname,'..');
const doc=JSON.parse(fs.readFileSync(path.join(root,'docs/cbt-explanations/round-80-supplement.json'),'utf8'));assert.equal(doc.items.length,50);
const items={};for(const {item,sourceImageSha256} of doc.items){assert.equal(item.id,'exam-80-'+String(item.number).padStart(2,'0'));assert.match(item.v,/^[a-f0-9]{16}$/);assert.match(sourceImageSha256,/^[a-f0-9]{64}$/);assert(item.answer>=1&&item.answer<=5);assert(item.overview.reason.length>=2);assert.equal(item.options.length,5);assert(item.options.every((o,i)=>o.id===item.id+'-option-'+(i+1)&&o.number===i+1&&o.correct===(i+1===item.answer)&&o.review.length&&o.review.every(t=>typeof t==='string'&&t.trim())));assert(!items[item.id]);items[item.id]=item;}
assert.deepEqual(Object.values(items).map(x=>x.number),Array.from({length:50},(_,i)=>i+1));
const out='/* Authored display-only explanations, exact original identities; never grades or updates saved questions. */\nwindow.HANQ_CBT_EXPLANATIONS_80='+JSON.stringify({schema:1,items})+';\n';
const file=path.join(root,'media/cbt-explanation80-data.js');if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),out);else fs.writeFileSync(file,out);console.log('PASS round80 supplement: 50 exact identities, 250 option reasons');
