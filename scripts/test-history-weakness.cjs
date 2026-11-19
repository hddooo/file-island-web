'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require(process.env.HANQ_JSDOM_PATH||'jsdom');
const {allowed}=require('./build-static-site.cjs');
const index=fs.readFileSync('index.html','utf8'),start=index.indexOf('    function openHistoryWeakness('),end=index.indexOf('    function openFormalExams(',start);
const dom=new JSDOM('<main id="app"></main>',{url:'https://weakness.test/#history',runScripts:'outside-only'}),w=dom.window,d=w.document,app=d.querySelector('main');
let owner=null,company=false,route='',home=0,listener=null;
w.scrollTo=()=>{};
w.HanqDisplayMode={current:()=>company?'company':'default'};
const hooks=new Set();
w.HanqApi={state:()=>({signedIn:!!owner,ownerId:owner}),onChange:fn=>{hooks.add(fn);return()=>hooks.delete(fn);}};
listener=()=>[...hooks].forEach(fn=>fn());
let printCalls=0,requestCount=0,failEra=false,hold=null;
w.print=()=>{printCalls++;};
const sha='fixture-pinned-revision';
const ranges={modern:126,samguk:16,nambuk:31,colonial:108};
const cell=(rowIndex,columnIndex,text,extra={})=>({rowIndex,columnIndex,lines:[{spans:[{text}]}],...extra});
const head={126:'이승만 정부',16:'삼국 고분',31:'통일 신라',108:'독립운동'};
const table=(p,studySection)=>({id:'p'+p+'-'+studySection,type:'table',studySection,columnCount:2,rows:[
 {cells:[cell(0,0,head[p],{header:true,scope:'row'}),cell(0,1,'근거 ** 원문 그대로')]},
 {cells:[cell(1,0,'둘째 행',{header:true,scope:'row'}),cell(1,1,'둘째 행 내용')]}]});
w.HanqPrivateTextbook={currentRevision:()=>sha,revisionRoutesReady:()=>true,eraFor:era=>({from:ranges[era],to:ranges[era]}),sourceInfo:()=>({sha256:sha,edition:'81회 대비'})};
w.HanqSemanticLibrary={validManifest:(m,s)=>m.source.sha256===s};
w.HanqApi.textbookSemanticManifest=async()=>({source:{sha256:sha},pages:Object.values(ranges).map(n=>({pdfPage:n,title:head[n],studySectionCounts:{concept:2}}))});
w.HanqApi.textbookSemanticPage=async(p,rev)=>{requestCount++;if(hold)await hold;assert.equal(rev,sha);if(p===108&&failEra)throw Error('simulated');
 return {schemaVersion:'hanq-semantic/1',pdfPage:p,sourceSha256:sha,studySectionPartition:{schemaVersion:'hanq-study-sections/1'},blocks:[table(p,'concept'),table(p,'exam')],sourceBlanks:[{displayText:'숨겨진 답안 섹션'}]};};
w.HanqOpeningScriptTransport={fromDocument:()=>({loadBundle:async()=>({}),loadStructure:async()=>({}),presentation:{}})};
w.HanqOpeningScriptReader={prepare:async()=>({bundle:{topics:[{id:'opening1',title:'개항기 단원'}]}}),mount(host,p,opts){assert(opts.studyTablesOnly&&opts.externalNavigation);host.innerHTML='<table><tbody><tr><td>개화기 원래 표</td></tr></tbody></table>';return {ready:Promise.resolve(),stop(){host.replaceChildren();}};}};
w.eval(fs.readFileSync('media/textbook-semantic.js','utf8'));
for(const f of ['timeline','content','bank','practice'])w.eval(fs.readFileSync('media/history-weakness-'+f+'.js','utf8'));
const open=Function('app','window','document','requireStudyLogin','subjectRoute','header','home',index.slice(start,end)+'\nreturn openHistoryWeakness;')(app,w,d,()=>!owner,(hash)=>{route=hash;w.HanqWeaknessPractice.stop();w.HanqWeaknessStudyContent.stop();},()=>'<div class="known-header"></div>',()=>{home++;});
const find=s=>app.querySelector(s),a=(x,v)=>find('[data-wp-action="'+x+'"]'+(v==null?'':'[data-wp-value="'+v+'"]'));
const part=x=>find('[data-weakness-part="'+x+'"] [data-weakness-start]');
const tick=()=>new Promise(r=>setImmediate(r));
async function until(predicate){for(let i=0;i<40;i++){if(predicate())return;await tick();} assert(predicate(),'condition timed out');}
(async()=>{
 open(false);assert(!app.children.length);
 owner='alpha';open(false);
 assert.equal(route,'#history/weakness');
 assert.deepEqual([...app.querySelectorAll('article h2')].map(x=>x.textContent),['대한민국','고대사','개화기·일제강점기']);
 assert.equal(app.querySelectorAll('button[data-chart-pdf]').length,1);
 assert.match(find('#ancient-timeline-caption').textContent,/554년.*642년/);
 assert.equal(app.querySelectorAll('.hw-time-spine').length,1);
 assert.equal(app.querySelectorAll('.hw-time-period').length,5);
 assert.equal(app.querySelectorAll('.hw-time-event').length,40);
 assert.equal(app.querySelectorAll('.material-timeline,.hw-triangle').length,0);
 assert.deepEqual([...app.querySelectorAll('.hw-time-key .hw-time-badge')].map(x=>x.textContent),['구간 시작','사이 · ② 정답','구간 끝']);
 assert(allowed(find('[data-weakness-study-image]').getAttribute('src')));
 assert(!find('#historyWeaknessMaterials').hidden);assert(find('#historyWeaknessPracticeHost').hidden);
 await until(()=>!find('[data-chart-pdf]').disabled);
 assert.equal(requestCount,4);
 assert.equal(app.querySelectorAll('.hw-concept-table table').length,4);
 assert.equal(app.querySelectorAll('[data-source-block$="-exam"]').length,0);
 assert(!app.textContent.includes('숨겨진 답안 섹션'));
 assert.equal(app.querySelectorAll('.hw-concept-table table tr').length,8);
 assert.equal(app.querySelectorAll('.hw-source-location,a[href*=textbookOriginal]').length,0);
 assert(!app.textContent.includes('해당 쪽 열기'));
 assert.match(find('.hw-opening-source table').textContent,/개화기 원래 표/);
 assert.match(find('.hw-concept-table table').textContent,/이승만 정부.*근거 \*\* 원문 그대로.*둘째 행/);
 find('[data-chart-pdf]').click();assert.equal(printCalls,1);
 company=true;find('[data-chart-pdf]').click();assert.equal(printCalls,2);
 assert.deepEqual([...app.querySelectorAll('.hw-time-star')].map(x=>x.textContent.slice(2)).sort(),['소수림왕','광개토왕','근초고왕','장수왕','무령왕','성왕','지증왕','법흥왕','진흥왕','선덕여왕','의자왕','문무왕'].sort());
 assert([...app.querySelectorAll('.hw-time-event')].every(x=>x.querySelector('.hw-time-when strong')&&x.querySelector('.hw-time-body h5')&&x.querySelector('.hw-time-parties')&&x.querySelectorAll('.hw-time-body p').length===2));
 assert.match([...app.querySelectorAll('.hw-time-key')][1].textContent,/562년.*② 정답.*대가야/);
 const dated=[...app.querySelectorAll('.hw-time-when strong')].map(x=>x.textContent);
 for(const sequence of [['433년','475년','493년'],['538년','551년','553년','554년','562년','612년','634년','639년','642년 음력 8월','642년 음력 10월','645년','648년','660년','663년','668년','674년','675년','676년']]){
   const indices=sequence.map(x=>dated.indexOf(x));
   assert(indices.every((n,i)=>n>=0&&(i===0||n>indices[i-1])),sequence.join(' < '));
 }
 assert.match(find('.hw-time-spine').textContent,/551.*한강 유역 공격.*553.*관산성/);
 assert.match(find('.hw-time-spine').textContent,/금관가야가 신라에 항복/);
 assert.equal(app.querySelectorAll('.hw-exam-aid').length,3);
 assert.match(app.querySelector('.hw-exam-aid').textContent,/노사정 위원회/);
 const pid='parent',nested=table(16,'concept');nested.id='nested';nested.sourceParentTableId=pid;
 const grouped=w.HanqWeaknessStudyContent.select({blocks:[{...table(16,'concept'),id:pid,rows:[{cells:[cell(0,0,'구분'),cell(0,1,'일반')]}]},nested,
 {id:'figure-a',type:'figure',studySection:'concept',caption:'고구려 고분',assetId:'p016-figure-1'},
 {id:'figure-b',type:'figure',studySection:'exam',caption:'고구려 고분',assetId:'p016-figure-2'}]},'samguk','기타');
 assert.equal(grouped.map(x=>x.blocks.map(b=>b.id).join(',')).join('|'),'parent,nested|figure-a');

 assert.match(find('.hw-time-spine').textContent,/매소성 전투.*당.*기벌포 전투.*문무왕.*삼국 통일/);
 assert.match(find('.hw-time-spine').textContent,/연개소문 정변.*삼국사기.*다른 사료/);
 failEra=true;open(true);await until(()=>find('[data-source-era=colonial] button'));
 assert(find('[data-chart-pdf]').disabled);find('[data-chart-pdf]').click();assert.equal(printCalls,2);
 failEra=false;find('[data-source-era=colonial] button').click();await until(()=>!find('[data-chart-pdf]').disabled);
 for(const p of ['modern','ancient','opening-colonial']){
  const book=w.HanqWeaknessPracticeBank[p];assert.equal(book.length,50);assert.equal(new Set(book.map(q=>q.id)).size,50);
  part(p).click();assert(find('#historyWeaknessMaterials').hidden);assert(find('.history-weakness-all').hidden);
  assert.equal(find('#wpHeading').textContent,book[0].prompt);
  assert.equal(app.querySelectorAll('.wp-choices button').length,4);assert(!find('.wp-explain'));
  assert(!find('.wp-score'));assert(a('prev').disabled);
  a('select',book[0].answer).click();assert(!find('.wp-explain'));assert.equal(a('select',book[0].answer).getAttribute('aria-pressed'),'true');
  a('next').click();assert.equal(find('#wpHeading').textContent,book[1].prompt);
  a('back').click();assert(!find('#historyWeaknessMaterials').hidden);assert.equal(hooks.size,1);
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
 owner=null;listener();assert(find('#historyWeaknessPracticeHost').hidden);assert(!find('.hw-concept-table'));
 owner='gamma';open(false);find('#historyWeaknessBack').click();assert.equal(route,'#history');assert.equal(home,1);
 console.log('PASS login/owner isolation, 4 concept sources + opening, exact rows and section fences, print, failure/retry, 3 priorities, all three independent 50-question sessions, resume, no early grading, submit/results/answer explanations, restart');
})().catch(e=>{console.error(e);process.exitCode=1;});
