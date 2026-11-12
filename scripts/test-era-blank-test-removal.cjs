'use strict';
// All fixtures are synthetic. No production API, user account or stored study data is changed.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const eras=['prehistory','gojoseon','samguk','nambuk','goryeo','joseon','joseon-early','joseon-late','opening','islands','colonial','modern'];
const title=era=>era[0].toUpperCase()+era.slice(1);
function fixture(era){
 const topics=[{id:'first',title:'합성 첫 주제',from:1,to:2},{id:'second',title:'합성 두 번째 주제',from:3,to:4}];
 const segments=topics.map((t,i)=>({id:'synthetic-'+i,kind:'study',page:t.from,topic:t.id,items:['synthetic-item-'+i],headings:[],markdown:'#### '+t.title+'\n\n합성 원문 **중요 내용 '+i+'**'}));
 const bundle={schema:'hanq-'+era+'-script/1',source:{sha256:'a'.repeat(64)},topics,segments,figures:[]};
 return {bundle,segments,blocks:segments.map((s,i)=>({id:'synthetic-item-'+i,markdown:s.markdown})),tables:[],review:[],figures:[],rootTitle:'합성 고려',rootTitleMarkdown:'합성 개화기',orientationMarkdown:'합성 안내',presentation:{itemKinds:{},examItems:[],hiddenItems:[],practiceGuidanceTopics:[]}};
}
function assertSafe(host,era){
 const modes=host.querySelector('.'+({joseon:'jsr',goryeo:'gsr',opening:'osr'}[era])+'-modes');
 assert.deepEqual([...modes.querySelectorAll('button')].map(b=>b.dataset.mode),['study','exam','practice']);
 assert.equal(host.querySelectorAll('[data-mode="recall"],.blank-recall,textarea').length,0);
 assert(!host.textContent.includes('백지 테스트'));
 assert(host.querySelector('[data-mode="study"]').getAttribute('aria-current')==='step'||host.querySelector('[data-mode="study"]').getAttribute('aria-current')==='true');
}
async function main(){
 const html=read('index.html'),routeCode=html.slice(html.indexOf('    function readRoute()'),html.indexOf('    function changeStep('));
 const slugs=JSON.parse(html.match(/var stepSlugs=(\[[^;]+\]);/)[1].replaceAll("'",'"'));
 assert(!slugs.includes('blank-test'));
 for(const era of eras){
  const w=new JSDOM('',{url:'https://synthetic.invalid/?textbookSource=preserved&textbookMode=choices#chapter/'+era+'/blank-test'}).window;
  w.localStorage.setItem('existing-study-data','preserve-me');const state={hanq:true,depth:4,chapterId:era,step:9,legacy:{answer:'saved'}};w.history.replaceState(state,'');
  const ctx={location:w.location,history:w.history,document:w.document,URL:w.URL,stepSlugs:slugs,chapterById:id=>eras.includes(id)?{id}:null};vm.runInNewContext(routeCode,ctx);
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.readRoute())),{id:era,step:0});assert.equal(w.location.hash,'#chapter/'+era+'/webtoon');
  assert.equal(w.location.search,'?textbookSource=preserved&textbookMode=choices');assert.deepEqual(w.history.state,state);assert.equal(w.localStorage.getItem('existing-study-data'),'preserve-me');assert.equal(w.history.length,1,'legacy normalization does not add history');
  w.history.replaceState(state,'','#chapter/'+era+'/bookquiz');assert.equal(ctx.readRoute().step,6,'existing blank quiz route survives');w.close();
 }
 for(const era of ['joseon','goryeo','opening']){
  const w=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://synthetic.invalid/#chapter/'+era+'/webtoon'}).window,data=fixture(era),original=JSON.stringify(data),host=w.document.querySelector('main');
  w.HTMLElement.prototype.scrollIntoView=function(){};w.HanqBlankRecall={decorate(){throw Error('Removed blank test must not mount');}};
  if(era!=='joseon')w['Hanq'+title(era)+'Structure']={isPrepared:x=>x===data};
  w.eval(read('media/'+era+'-script-reader.js'));let quizShows=0;
  const controller=w['Hanq'+title(era)+'ScriptReader'].mount(host,era==='joseon'?data.bundle:data,{initialMode:'recall',workspace:{show(body){quizShows++;body.textContent='합성 빈칸 퀴즈';}}});
  assertSafe(host,era);assert(host.textContent.includes('중요 내용 0'));
  host.querySelector('[data-topic="second"]').click();assertSafe(host,era);assert(host.textContent.includes('중요 내용 1'));
  host.querySelector('[data-mode="practice"]').click();assert.equal(quizShows,1);assert(host.textContent.includes('합성 빈칸 퀴즈'));
  w.history.replaceState({[era+'Script']:{source:data.bundle.source.sha256,topic:'second',mode:'recall'}},'');controller.handlePopState();assertSafe(host,era);assert(host.textContent.includes('중요 내용 1'),'legacy history keeps its topic');
  assert.equal(JSON.stringify(data),original,'source IDs, text and answers remain untouched');controller.stop();assert.equal(host.children.length,0);w.close();

  const d=new JSDOM('<main></main>',{url:'https://synthetic.invalid/?textbookSource=keep#chapter/'+era+'/blank-test'}),win=d.window;
  win.localStorage.setItem('stored-progress','keep');let renderOptions,pops=0;
  const api={state:()=>({signedIn:true,ownerId:'synthetic',epoch:1}),onChange:()=>()=>{}};
  const renderer={prepare:async b=>b,mount:(element,b,opts)=>{renderOptions=opts;return {stop(){},handlePopState(){pops++;return true;}};}};
  const session=require('../media/'+era+'-script-session.js').create({document:win.document,api,renderer,modeRouting:true});
  const transport={ready:true,sourceSha256:'a'.repeat(64),loadBundle:async()=>({source:{sha256:'a'.repeat(64)}}),loadFigure:async()=>{},loadStructure:async()=>({})};
  assert(await session.mount(win.document.querySelector('main'),transport));assert.equal(win.location.hash,'#chapter/'+era+'/webtoon');assert.equal(renderOptions.modeFromLocation(),'study');assert(new URL(renderOptions.routeForMode('recall')).hash.endsWith('/webtoon'));
  win.history.pushState({[era+'Script']:{mode:'recall'}},'','#chapter/'+era+'/blank-test');assert(session.handlePopState());assert.equal(pops,1);assert.equal(win.location.hash,'#chapter/'+era+'/webtoon');assert.equal(win.location.search,'?textbookSource=keep');assert.equal(win.localStorage.getItem('stored-progress'),'keep');session.stop();win.close();
 }
 assert(!read('media/textbook-semantic-library.js').includes('blankRecall:'),'semantic reader never opts into removed blank test');
 console.log(JSON.stringify({passed:true,eras:eras.length,readers:3,sessions:3,legacyLinks:'concept study',sourceAndSavedDataPreserved:true}));
}
module.exports={fixture,eras,title};if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
