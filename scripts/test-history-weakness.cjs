'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require(process.env.HANQ_JSDOM_PATH||'jsdom');
const {allowed}=require('./build-static-site.cjs');
const index=fs.readFileSync('index.html','utf8'),start=index.indexOf('    function openHistoryWeakness('),end=index.indexOf('    function openFormalExams(',start);
const dom=new JSDOM('<main id="app"></main>',{url:'https://weakness.test/#history',runScripts:'outside-only'}),w=dom.window,d=w.document,app=d.querySelector('main');
let owner=null,company=false,route='',home=0,listener=null;
w.scrollTo=()=>{};
w.HanqDisplayMode={current:()=>company?'company':'default'};
w.HanqApi={state:()=>({signedIn:!!owner,ownerId:owner}),onChange:fn=>{listener=fn;return()=>{listener=null;}}};
const images=[],blobs=[],downloads=[];
class ImageStub{set src(src){images.push(src);this.naturalWidth=1500;this.naturalHeight=2121;queueMicrotask(()=>this.onload());}}
w.URL.createObjectURL=b=>{blobs.push(b);return 'blob:https://weakness.test/'+blobs.length;};
w.URL.revokeObjectURL=()=>{};w.setTimeout=()=>{};
w.HTMLAnchorElement.prototype.click=function(){downloads.push(this.download);};
w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){},drawImage(){}});
w.HTMLCanvasElement.prototype.toBlob=cb=>cb(new Blob([Uint8Array.of(255,216,255,217)],{type:'image/jpeg'}));
w.Blob=Blob;w.TextEncoder=TextEncoder;w.Image=ImageStub;
for(const f of ['content','bank','practice','pdf'])w.eval(fs.readFileSync('media/history-weakness-'+f+'.js','utf8'));
const open=Function('app','window','requireStudyLogin','subjectRoute','header','home',index.slice(start,end)+'\nreturn openHistoryWeakness;')(app,w,()=>!owner,(hash)=>{route=hash;w.HanqWeaknessPractice.stop();},()=>'<div class="known-header"></div>',()=>{home++;});
const find=s=>app.querySelector(s),a=(x,v)=>find('[data-wp-action="'+x+'"]'+(v==null?'':'[data-wp-value="'+v+'"]'));
const part=x=>find('[data-weakness-part="'+x+'"] [data-weakness-start]');
const tick=()=>new Promise(r=>setImmediate(r));
async function pdfAfter(){
 const n=blobs.length;find('[data-chart-pdf="save-all"]').click();
 for(let i=0;i<30&&blobs.length===n;i++)await tick();
 assert.equal(blobs.length,n+1);
 const pdf=await blobs.at(-1).text();
 assert(pdf.startsWith('%PDF-1.4'));assert(pdf.includes('/Count 3'));assert.equal((pdf.match(/Subtype \/Image/g)||[]).length,3);assert(!pdf.includes('/Font'));
 assert.equal(downloads.at(-1),'한능검 약점 보완 전체.pdf');
}
(async()=>{
 open(false);assert(!app.children.length);
 owner='alpha';open(false);
 assert.equal(route,'#history/weakness');
 assert.deepEqual([...app.querySelectorAll('article h2')].map(x=>x.textContent),['대한민국','고대사','개화기·일제강점기']);
 assert.equal(app.querySelectorAll('button[data-chart-pdf]').length,1);
 assert.match(find('#ancient-timeline-caption').textContent,/554년.*642년/);
 assert.equal(app.querySelectorAll('article .timeline-event').length,11);
 assert(allowed(find('[data-weakness-study-image]').getAttribute('src')));
 assert(!find('#historyWeaknessMaterials').hidden);assert.equal(images.length,0);assert(find('#historyWeaknessPracticeHost').hidden);
 await pdfAfter();assert.deepEqual(images.slice(-3),['1','2-timeline','3'].map(x=>'media/history-weakness/weakness-priority-'+x+'.webp'));
 company=true;await pdfAfter();assert.deepEqual(images.slice(-3),['1','2-timeline','3'].map(x=>'media/history-weakness/weakness-priority-'+x+'-dark.webp'));
 for(const p of ['modern','ancient','opening-colonial']){
  const book=w.HanqWeaknessPracticeBank[p];assert.equal(book.length,50);assert.equal(new Set(book.map(q=>q.id)).size,50);
  part(p).click();assert(find('#historyWeaknessMaterials').hidden);assert(find('.history-weakness-all').hidden);
  assert.equal(find('#wpHeading').textContent,book[0].prompt);
  assert.equal(app.querySelectorAll('.wp-choices button').length,4);assert(!find('.wp-explain'));
  assert(!find('.wp-score'));assert(a('prev').disabled);
  a('select',book[0].answer).click();assert(!find('.wp-explain'));assert.equal(a('select',book[0].answer).getAttribute('aria-pressed'),'true');
  a('next').click();assert.equal(find('#wpHeading').textContent,book[1].prompt);
  a('back').click();assert(!find('#historyWeaknessMaterials').hidden);assert.equal(listener,null);
  open(true);part(p).click();assert.equal(find('#wpHeading').textContent,book[1].prompt);
  a('list').click();assert.equal(app.querySelectorAll('#wpList button').length,50);a('jump',0).click();
  assert(a('select',book[0].answer).getAttribute('aria-pressed')==='true');
  a('submit').click();assert.match(find('.wp-confirm').textContent,/미응답 49문항/);assert(!find('.wp-explain'));
  a('cancel').click();assert(!find('.wp-confirm'));
  a('submit').click();a('finalize').click();assert.equal(find('.wp-score strong').textContent,'2%');
  assert.match(a('jump',0).textContent,/O/);assert.match(a('jump',1).textContent,/X/);
  a('jump',0).click();assert.deepEqual([...app.querySelectorAll('.wp-explain h3')].map(x=>x.textContent),['지문 해설','보기별 해설','결론']);
  assert.equal(app.querySelectorAll('.wp-explain li').length,4);assert(a('select',book[0].answer).disabled);
  a('summary').click();a('retry').click();assert(!find('.wp-explain'));assert.equal(a('select',book[0].answer).getAttribute('aria-pressed'),'false');
  a('select',1).click();a('back').click();
 }
 owner='beta';open(true);part('modern').click();assert.equal(a('select',1).getAttribute('aria-pressed'),'false');
 owner=null;listener();assert(find('#historyWeaknessPracticeHost').hidden);
 owner='gamma';open(false);find('#historyWeaknessBack').click();assert.equal(route,'#history');assert.equal(home,1);
 console.log('PASS login/owner isolation, 3 semantic study sections, 1 PDF in both modes, all three independent 50-question sessions, resume, no early grading, submit/results/answer explanations, restart');
})().catch(e=>{console.error(e);process.exitCode=1;});
