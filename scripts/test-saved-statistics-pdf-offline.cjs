'use strict';
// Exercises the shipped exporter with synthetic DOM and native Canvas; does not claim browser QA.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom'),{createCanvas}=require(process.env.HANQ_CANVAS_PATH||'@napi-rs/canvas');
const {fixture,initial}=require('./test-era-blank-manual-save.cjs');
(async()=>{const out=path.resolve('evidence/saved-statistics-return');fs.mkdirSync(out,{recursive:true});
const w=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://synthetic.invalid',pretendToBeVisual:true}).window;
w.Blob=Blob;w.TextEncoder=TextEncoder;w.HTMLElement.prototype.scrollIntoView=function(){};
w.HTMLCanvasElement.prototype.getContext=function(){this.native=createCanvas(this.width,this.height);return this.native.getContext('2d');};
w.HTMLCanvasElement.prototype.toBlob=function(done){done(new Blob([this.native.toBuffer('image/jpeg')],{type:'image/jpeg'}));};
for(const file of ['textbook-source-quiz','era-quiz-review-pdf'])w.eval(fs.readFileSync('media/'+file+'.js','utf8'));
const data=fixture(),stored=initial();stored.workspace.status='completed';data.items.forEach((item,i)=>stored.workspace.responses[item.id]={values:[i===1?'PRIVATE_WRONG':item.answer.text],submitted:true,correct:i!==1,checkedSlots:[true]});
const c=w.HanqTextbookSourceQuiz.render(w.document.querySelector('main'),data,{manualSave:true,sequential:true,ownerId:'synthetic',loadProgress:async()=>structuredClone(stored),saveProgress:async()=>{throw Error('unexpected write');}});await c.ready;w.document.querySelector('.textbook-source-history-entry').click();
const source=w.document.querySelector('[data-source-review-item-id]'),review=w.document.createElement('section');
for(let i=0;i<50;i++){const card=source.cloneNode(true);card.dataset.sourceReviewItemId='synthetic-'+i;card.querySelector('h4').textContent=(101+i)+'. 합성 공식 번호';card.querySelector('.textbook-source-review-user-answer').textContent='내 답: PRIVATE_WRONG_'+i;review.appendChild(card);}
const original=review.innerHTML,r=await w.HanqEraQuizReviewPdf.create({review,title:'합성 PDF 독립 검수',isCurrent:()=>true});assert.equal(review.innerHTML,original);assert.equal(r.count,50);assert.equal(new Set(r.layout.map(l=>l.id)).size,50);assert(r.layout.some(l=>l.column===0)&&r.layout.some(l=>l.column===1));assert(r.layout.every((l,i,a)=>!i||l.page*2+l.column>=a[i-1].page*2+a[i-1].column));assert(r.layout.every(l=>l.y<=807&&l.x+l.width<=567.29));
const file=path.join(out,'synthetic-50.pdf');fs.writeFileSync(file,Buffer.from(await r.blob.arrayBuffer()));const text=execFileSync('pdftotext',['-raw',file,'-'],{encoding:'utf8'});fs.writeFileSync(path.join(out,'synthetic-50.txt'),text);assert(!text.includes('PRIVATE_WRONG')&&!text.includes('내 답:'));assert(text.includes('베타'));assert.deepEqual([...text.matchAll(/\b(1[0-5][0-9])\. 합성 공식 번호/g)].map(m=>Number(m[1])),Array.from({length:50},(_,i)=>101+i));
execFileSync('pdftoppm',['-f','1','-singlefile','-scale-to','1200','-png',file,path.join(out,'pdf-page-1')]);const summary={engine:'jsdom + native Canvas (not browser)',questions:r.count,pages:r.pages,columns:[...new Set(r.layout.map(l=>l.column))],officialNumbers:'101–150 exactly once and in order',personalAnswers:0,sourceMutations:0};fs.writeFileSync(path.join(out,'pdf-result.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));c.cleanup();w.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
