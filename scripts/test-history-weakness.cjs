'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require(process.env.HANQ_JSDOM_PATH||'jsdom');
const {allowed}=require('./build-static-site.cjs');
const index=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('media/history-weakness.css','utf8'),start=index.indexOf('    function openHistoryWeakness('),end=index.indexOf('    function openFormalExams(',start);
const script=fs.readFileSync('media/history-weakness-pdf.js','utf8'),display=fs.readFileSync('media/display-mode.js','utf8');
assert(start>0&&end>start);
const dom=new JSDOM('<main id="app"></main>',{url:'https://weakness.test/#history'}),w=dom.window,app=w.document.querySelector('main'),d=w.document;
let logged=false,company=false,route='',homeCalls=0;
w.scrollTo=()=>{};
w.open=()=>({opener:w,closed:false,location:{replace(url){assert(url.startsWith("blob:"));}}});
w.HanqDisplayMode={current:()=>company?'company':'default'};
const images=[],blobs=[],downloads=[];
class TestImage{
  set src(src){images.push(src);this.naturalWidth=1500;this.naturalHeight=2121;queueMicrotask(()=>this.onload());}
}
w.URL.createObjectURL=b=>{blobs.push(b);return 'blob:https://weakness.test/'+blobs.length;};
w.URL.revokeObjectURL=()=>{};
w.setTimeout=()=>{};
w.HTMLAnchorElement.prototype.click=function(){downloads.push(this.download);};
w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){},drawImage(){}});
w.HTMLCanvasElement.prototype.toBlob=function(cb){cb(new Blob([Uint8Array.of(255,216,255,217)],{type:'image/jpeg'}));};
Function('window','Image','URL','document',script)(w,TestImage,w.URL,d);
const open=Function('app','window','requireStudyLogin','subjectRoute','header','home',index.slice(start,end)+'\nreturn openHistoryWeakness;')(app,w,()=>!logged,(hash)=>{route=hash;},()=>'<div class="known-header"></div>',()=>{homeCalls++;});
const titles=['1순위 약점 보완 · 대한민국','2순위 약점 보완 · 고대사','3순위 약점 보완 · 개화기·일제강점기'];
const path=(i,theme)=>'media/history-weakness/weakness-priority-'+(i+1)+(i===1?'-timeline':'')+(theme==='company'?'-dark':'')+'.webp';
function assertCards(theme){
  const cards=[...app.querySelectorAll('.history-weakness-card')];assert.equal(cards.length,3);
  assert.deepEqual(cards.map(c=>c.querySelector('h2').textContent),titles);
  cards.forEach((card,i)=>{
    const pic=card.querySelector('a.history-weakness-preview'),image=card.querySelector('img'),imageUrl=path(i,theme);
    assert.equal(pic.getAttribute('href'),imageUrl);assert.equal(pic.target,'_blank');assert.equal(image.getAttribute('src'),imageUrl);assert.equal(image.loading||image.getAttribute('loading'),'lazy');
    const pdfs=[...card.querySelectorAll('.history-weakness-links button')];
    assert.deepEqual(pdfs.map(b=>b.dataset.chartPdf),['open','save']);assert(pdfs.every(b=>b.type==='button'));
    assert.equal(card.querySelector('[role=status]').hidden,true);
    assert(allowed(imageUrl));assert(!allowed(imageUrl.replace(/\.webp$/,'.pdf')));
  });
  assert.equal(app.querySelector('[data-chart-pdf=save-all]').textContent,'전체 PDF 다운로드');
}
async function pdfAfter(button,count){
  const n=blobs.length;button.click();
  for(let attempts=0;attempts<25&&blobs.length===n;attempts++)await new Promise(r=>setImmediate(r));
  assert.equal(blobs.length,n+1);
  const pdf=await blobs.at(-1).text();
  assert(pdf.startsWith('%PDF-1.4'));assert(pdf.includes('/Count '+count));assert.equal((pdf.match(/Subtype \/Image/g)||[]).length,count);assert((pdf.match(/595\.28 841\.89/g)||[]).length===count);
  const xref=Number(pdf.match(/startxref\n(\d+)/)[1]),bytes=Buffer.from(await blobs.at(-1).arrayBuffer());
  assert.equal(bytes.subarray(xref,xref+4).toString(),'xref');
  assert.equal(pdf.includes('/Font'),false);
}
(async()=>{
  open(false);assert(!app.children.length);
  logged=true;open(false);assert.equal(route,'#history/weakness');assert.equal(app.querySelector('h1').textContent,'약점 보완');assertCards('default');
  await pdfAfter(app.querySelector('[data-chart-pdf=save-all]'),3);
  assert.deepEqual(images.map(u=>new URL(u).pathname.slice(1)),[0,1,2].map(i=>path(i,'default')));
  assert.equal(downloads[0],'한능검 약점 보완 전체.pdf');
  company=true;w.dispatchEvent(new w.Event('hashchange'));d.dispatchEvent(new w.CustomEvent('hanq:display-mode-change',{detail:{mode:'company'}}));assertCards('company');
  await pdfAfter(app.querySelector('[data-chart-pdf=save]'),1);
  assert.equal(new URL(images.at(-1)).pathname.slice(1),path(0,'company'));
  await pdfAfter(app.querySelector('[data-chart-pdf=save-all]'),3);
  assert.deepEqual(images.slice(-3).map(u=>new URL(u).pathname.slice(1)),[0,1,2].map(i=>path(i,'company')));
  await pdfAfter(app.querySelector('[data-chart-pdf=open]'),1).catch(error=>{throw error;});
  open(false);assertCards('company');
  assert(display.includes("['weakness','#history/weakness','약점 보완'"));
  assert(css.includes('minmax(min(100%,235px),1fr)'));assert(css.includes('repeat(3,minmax(0,1fr))'));assert(css.includes('aspect-ratio:210/297'));
  assert(css.includes('data-company-history] #app#app#app .history-weakness .history-weakness-preview img'));
  assert(!allowed('media/history-weakness/unreviewed.pdf'));assert(!allowed('media/private-data/not-for-web.pdf'));
  assert(allowed('media/history-weakness-pdf.js'));assert(index.includes('media/history-weakness-pdf.js?v='));
  assert(index.includes('id="homeHistoryWeakness"'));assert.equal((index.match(/location.hash==='#history\/weakness'/g)||[]).length,2);
  for(const key of ['default','company'])for(let i=0;i<3;i++){
    const src=path(i,key);if(process.env.HANQ_REQUIRE_WEAKNESS_ASSETS!=='1'&&!fs.existsSync(src))continue;
    const data=fs.readFileSync(src);assert.equal(data.subarray(0,4).toString(),'RIFF');assert.equal(data.subarray(8,12).toString(),'WEBP');
    assert(data.length<2_000_000,'WebP optimized for mobile');
  }
  app.querySelector('#historyWeaknessBack').click();assert.equal(route,'#history');assert.equal(homeCalls,1);
  console.log('PASS signed-in weakness route, 3 handouts, company mode + zoom links, individual + combined raster PDF, return to history');
})().catch(error=>{console.error(error);process.exitCode=1;});
