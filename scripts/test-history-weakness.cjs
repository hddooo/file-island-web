'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require(process.env.HANQ_JSDOM_PATH||'jsdom');
const {allowed}=require('./build-static-site.cjs');
const index=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('media/history-weakness.css','utf8'),start=index.indexOf('    function openHistoryWeakness('),end=index.indexOf('    function openFormalExams(',start);
assert(start>0&&end>start);
const body=index.slice(start,end);
const dom=new JSDOM('<main></main>',{url:'https://weakness.test/#history'}),w=dom.window,app=w.document.querySelector('main');
let logged=false,route='',homeCalls=0;
const open=Function('app','window','requireStudyLogin','subjectRoute','header','home',body+'\nreturn openHistoryWeakness;')(app,{scrollTo(){}},()=>!logged,(hash)=>{route=hash;},()=>'<div class="known-header"></div>',()=>{homeCalls++;});
open(false);assert(!app.children.length);
logged=true;open(false);assert.equal(route,'#history/weakness');assert.equal(app.querySelector('h1').textContent,'약점 보완');
const cards=[...app.querySelectorAll('.history-weakness-card')];assert.equal(cards.length,4);
const basenames=['three-kingdoms','opening-era','constitution-reform','money-history'];
for(let i=0;i<cards.length;i++){
 const card=cards[i],prefix='media/history-weakness/'+basenames[i],pic=card.querySelector('.history-weakness-preview a, a.history-weakness-preview'),image=card.querySelector('img');
 const imageUrl=prefix+'.png'+(basenames[i]==='money-history'?'?v=20261118b':'');assert.equal(pic.getAttribute('href'),imageUrl);assert.equal(pic.target,'_blank');assert.equal(image.getAttribute('src'),imageUrl);assert.equal(image.getAttribute('loading'),'lazy');
 const pdfs=[...card.querySelectorAll('.history-weakness-links button')];
 assert.deepEqual(pdfs.map(b=>b.dataset.chartPdf),['open','save']);assert(pdfs.every(b=>b.type==='button'));
 assert.equal(card.querySelector('[role=status]').hidden,true);
 assert(allowed(prefix+'.png'));assert(!allowed(prefix+'.pdf'));
 assert.equal(fs.readFileSync(prefix+'.png').subarray(0,8).toString('hex'),'89504e470d0a1a0a');
}
assert(!allowed('media/history-weakness/unreviewed.pdf'));assert(!allowed('media/private-data/not-for-web.pdf'));assert(!allowed('docs/history-weakness/three-kingdoms.pdf'));
assert(allowed('media/history-weakness-pdf.js'));assert(index.includes('media/history-weakness-pdf.js?v='));
assert(index.includes('id="homeHistoryWeakness"'));assert.equal((index.match(/location.hash==='#history\/weakness'/g)||[]).length,2);assert(css.includes('minmax(min(100%,235px),1fr)'));assert(css.includes('repeat(2,minmax(0,1fr))'));assert(css.includes('repeat(4,minmax(0,1fr))'));assert.equal(cards[3].querySelector('h2').textContent,'4. 시대별 돈의 흐름');
app.querySelector('#historyWeaknessBack').click();assert.equal(route,'#history');assert.equal(homeCalls,1);
console.log('PASS weakness menu route, signed-in guard, 4 preview/PDF actions, PNG-only deployment, return to history');
