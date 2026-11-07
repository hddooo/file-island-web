'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{JSDOM}=require(process.env.JSDOM_PATH);
const root=path.resolve(__dirname,'..');
const dom=new JSDOM('<main></main>',{runScripts:'outside-only'}),w=dom.window;
for(const f of ['cbt-explanation-data.js','cbt-explanation80-data.js','cbt-explanations.js','cbt-round-materials.js'])w.eval(fs.readFileSync(path.join(root,'media',f),'utf8'));
const copy=x=>JSON.parse(JSON.stringify(x));const doc=JSON.parse(fs.readFileSync(path.join(root,'docs/cbt-explanations/round-80-supplement.json')));
assert.equal(Object.keys(w.HANQ_CBT_EXPLANATIONS.items).length,500);assert.equal(doc.items.length,50);
let checks=0;
for(const {item,sourceImageSha256} of doc.items){
 assert.match(sourceImageSha256,/^[0-9a-f]{64}$/);assert(item.overview.reason.length>=2);assert(item.options.every(o=>o.review.length&&o.review[0].trim()));
 const old=copy(item);old.overview.reason=[];old.options.forEach(o=>o.review=[]);
 const q={questionId:item.id,version:item.v,exam:80,number:item.number,position:item.number-1,points:item.points,options:copy(old.options),selectedOptionId:null,review:{status:'unanswered',correctNumber:item.answer,correctOptionId:item.options[item.answer-1].id,item:old,options:copy(old.options)}};
 const before=JSON.stringify(q);assert.equal(w.HanqCbtExplanations.resolve(q,'active'),null);assert(w.HanqCbtExplanations.resolve(q,'final'));
 const html=w.HanqCbtExplanations.render(q,null,'final');assert(html.includes(item.overview.reason[0]));assert.equal((html.match(/class="fe-exp-option /g)||[]).length,5);
 const lines=w.HanqCbtRoundMaterials.sourceLines(q);assert(lines.includes(item.overview.reason[0]));assert(lines.includes(item.overview.reason[1]));
 assert.equal(JSON.stringify(q),before);
 for(const mutate of [x=>x.version='changed',x=>x.review.item.v='changed',x=>x.review.correctNumber=item.answer%5+1,x=>x.review.correctOptionId='wrong',x=>x.options[0].id='wrong',x=>x.review.item.options[0].text='wrong',x=>x.number=0,x=>x.points=0]){const invalid=copy(q);mutate(invalid);assert.equal(w.HanqCbtExplanations.resolve(invalid,'final'),null);}
 const visible=copy(old);visible.options=old.options.map(o=>({id:o.id,text:o.text}));const displayed={kind:'mock',questionId:item.id,version:item.v,optionOrder:old.options.map(o=>o.id),item:visible};
 assert(w.HanqCbtExplanations.renderGraded({item:old},null,q.review.correctOptionId,0,displayed).includes(item.overview.reason[0]));checks++;
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(html.indexOf('media/cbt-explanation80-data.js')<html.indexOf('media/cbt-explanations.js'));
console.log('PASS '+checks+' exact-version 80th explanations, 250 option reasons, final-only, immutable, wrong-version rejection, read-only review and graded replay.');dom.window.close();
