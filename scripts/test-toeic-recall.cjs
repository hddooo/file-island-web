'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../media/toeic-recall.js'),'utf8'),{window});
const batches=window.HanqToeicRecall.batches;
const notes=n=>Array.from({length:n},(_,i)=>({id:String(i).padStart(4,'0'),createdAt:'2026-01-01',meaning:'테스트 뜻',part:['1','2','3-4','5-6','7'][i%5]}));
for(const [n,lengths] of [[0,[]],[1,[1]],[99,[99]],[100,[100]],[101,[100,1]],[200,[100,100]],[201,[100,100,1]]])assert.equal(JSON.stringify(batches(notes(n),'').map(x=>x.length)),JSON.stringify(lengths));
assert.equal(batches(notes(201),'7').flat().length,40);assert.equal(batches([{...notes(1)[0],meaning:'   '}],'').length,0);
const data=notes(101).reverse();const result=batches(data,'').flat();assert.equal(result[0].id,'0000');assert.equal(result.at(-1).id,'0100');assert.equal(data[0].id,'0100');assert.equal(new Set(result.map(x=>x.id)).size,101);
console.log('TOEIC recall batches: empty/1/99/100/101/200/201, Part filter, blank-meaning exclusion, stable nonmutating order PASS');
