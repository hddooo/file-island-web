'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const source='8d0944e32d86985a4af3dbf28085dba4bb3f65cc0d8379907e2e4693299003a1';
async function main(){
 const dom=new JSDOM('<main id="app"><div id="host"></div></main>',{url:'https://synthetic.invalid/#chapter/joseon-late/webtoon',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document,host=d.querySelector('#host');
 try{
  for(const name of ['joseon-script-reader','joseon-script-session','joseon-script-app'])w.eval(fs.readFileSync(path.join(__dirname,'..','media',name+'.js'),'utf8'));
  const bundle={schema:'hanq-joseon-script/1',source:{sha256:source},
   topics:[['early','조선 전기',59,64],['late','조선 후기',65,72],['society','사회·경제',73,78],['culture','문화',79,87]].map(([id,title,from,to])=>({id,title,from,to})),
   figures:[],segments:[
    [59,'study','전기 내용'],[62,'study','시험에는 이렇게 나온다!\n\n전기 시험'],[65,'study','후기 내용'],[69,'study','시험에는 이렇게 나온다!\n\n후기 시험'],
    [73,'study','사회 내용'],[77,'study','시험에는 이렇게 나온다!\n\n사회 시험'],[79,'study','문화 내용'],[87,'answers','HIDDEN_ANSWERS']
   ].map(([page,kind,body])=>({id:'sample-'+page,kind,page,markdown:'### '+body}))};
  const original=JSON.stringify(bundle),workspaceCalls=[];
  w.HanqHistory81Workspace={fromDocument:()=>opts=>({
   show(body,details){workspaceCalls.push([opts.era,opts.ownerId,details.fresh]);const el=d.createElement('p');el.textContent='기존 빈칸 퀴즈';body.append(el);},
   hasUnsaved:()=>false,leave(){},stop(){}
  })};
  const adapter={fromDocument:()=>({ready:true,sourceSha256:source,loadBundle:async()=>bundle,loadFigure:async()=>null})};
  const api={state:()=>({signedIn:true,ownerId:'synthetic-owner',epoch:1}),onChange:()=>()=>{}};
  const app=w.HanqJoseonScriptApp.create({adapter,api});
  w.addEventListener('popstate',()=>app.handlePopState());
  w.history.replaceState({joseonScript:{source,topic:'late',mode:'study'}},'');
  assert(await app.mount(host,d.querySelector('#app'),'joseon-late',0));
  const topics=()=>[...host.querySelectorAll('.jsr-topics button')],cards=()=>[...host.querySelectorAll('.jsr-source-card')].map(n=>Number(n.dataset.page));
  assert.deepEqual(topics().map(x=>x.textContent),['조선 전기·후기','사회·문화']);
  assert.deepEqual(cards(),[59,65]);assert.equal(topics()[0].getAttribute('aria-current'),'true');
  assert(host.querySelector('.jsr-topics-merged'));
  topics()[1].click();assert.deepEqual(cards(),[73,79]);assert.equal(topics()[1].getAttribute('aria-current'),'true');
  host.querySelector('[data-mode=exam]').click();assert.deepEqual(cards(),[77]);
  topics()[0].click();assert.deepEqual(cards(),[62,69]);assert.equal(w.location.hash,'#chapter/joseon-late/exam-lines');
  const historyChange=go=>new Promise(resolve=>{w.addEventListener('popstate',resolve,{once:true});go();});
  await historyChange(()=>w.history.back());assert.deepEqual(cards(),[77]);
  await historyChange(()=>w.history.forward());assert.deepEqual(cards(),[62,69]);
  for(const [topic,expected] of [['society',[73,79]],['culture',[73,79]],['early',[59,65]]]){
   w.history.replaceState({joseonScript:{source,topic,mode:'study'}},'','#chapter/joseon-late/webtoon');assert(app.handlePopState());assert.deepEqual(cards(),expected);
  }
  host.querySelector('[data-mode=practice]').click();assert.deepEqual(cards(),[]);
  assert.equal(host.querySelector('.jsr-topics').hidden,true);
  assert.equal(host.querySelector('.jsr-body').textContent,'기존 빈칸 퀴즈');
  assert.deepEqual(workspaceCalls,[['joseon','synthetic-owner',true]]);
  assert.equal(JSON.stringify(bundle),original);
  assert(!host.textContent.includes('HIDDEN_ANSWERS'));
  app.stop();assert.equal(host.children.length,0);
  assert.match(fs.readFileSync(path.join(__dirname,'..','media','joseon-script-reader.css'),'utf8'),/\.jsr-topics\.jsr-topics-merged\{grid-template-columns:repeat\(2/);
  console.log('조선 통합: 원본·문항 보존, 개념/시험 범위, 이전 링크와 뒤로/앞으로, 빈칸 퀴즈 확인');
 }finally{w.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
