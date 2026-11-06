'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const csstree=require('css-tree'),Specificity=require('@bramus/specificity').default;
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const marker='/* Vocabulary entry spacing follows';
const fullVocabulary=read('media/vocabulary-reading.css');
const patch=fullVocabulary.slice(fullVocabulary.indexOf(marker));
const styles=['toeic-notes.css','vocabulary-reading.css','company-mode.css','general-typography.css'];
const notes=[
  {id:'density-one',expression:'clear',partOfSpeech:'형용사',meaning:'분명한',example:'The instructions are clear.',translation:'안내가 분명하다.'},
  {id:'density-two',expression:'hold',partOfSpeech:'타동사',meaning:'개최하다',example:'We will hold the meeting tomorrow.',translation:'우리는 내일 회의를 열 것이다.'},
  {id:'density-three',expression:'would have been able to / wouldn’t have been able to',partOfSpeech:'동사',meaning:'가능했을 것',example:'We would have been able to finish the longer task.',translation:'우리는 더 긴 작업을 마칠 수 있었을 것이다.'},
  {id:'density-four',expression:'an unusually long synthetic vocabulary expression for wrapping',partOfSpeech:'명사구',meaning:'줄바꿈 검사를 위한 긴 합성 뜻이며 내용은 잘리지 않고 모두 남아 있어야 한다.',example:'',translation:''}
].map(n=>({...n,part:'unclassified',synonyms:[],structure:'Synthetic tip retained.',confusion:'',createdAt:'2026-11-06T00:00:00Z',revision:1}));

async function fixture(company=false){
  const dom=new JSDOM('<!doctype html><html><head><title>Fixture</title></head><body><main id="app"><div class="device-content"><section id="toeicNotesHost"></section><section class="tn" id="other"><article class="tn-word-card"><h3>Outside notebook</h3></article></section></div></main></body></html>',{url:'https://hanq.test/#toeic/notebook',runScripts:'outside-only'});
  const w=dom.window;w.HTMLElement.prototype.scrollIntoView=function(){};
  const densityStyle=w.document.createElement('style');densityStyle.textContent=patch;w.document.head.appendChild(densityStyle);
  w.history.replaceState({hanqVocabulary:{version:1,chapterId:'vocab-001-v1',query:''}},'');
  w.fetch=async()=>({ok:true,json:async()=>({schemaVersion:1,version:'vocabulary-chapters-v1',chapters:[{id:'vocab-001-v1',title:'Chapter 1',version:1,wordIds:notes.map(n=>n.id),examStatus:'preparing'}]})});
  const api={state:()=>({signedIn:true,ownerId:'synthetic-density-user'}),toeicNotes:async()=>({notes,canManage:false}),onChange:()=>()=>{}};
  w.eval(read('media/toeic-notes.js'));
  w.HanqToeicNotes.mount(w.document.getElementById('toeicNotesHost'),{api,onHome(){},onAccount(){}});
  await new Promise(r=>setTimeout(r,20));
  w.eval(read('media/display-mode.js'));
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  if(company)w.HanqDisplayMode.select('company');
  await new Promise(r=>setTimeout(r,20));
  return dom;
}

function mediaMatches(text,width,type){
  return text.split(',').some(q=>{
    if(/\bprint\b/.test(q)&&type!=='print')return false;
    if(/\bscreen\b/.test(q)&&type!=='screen')return false;
    for(const m of q.matchAll(/\((min|max)-width:\s*([\d.]+)px\)/g)){
      if(m[1]==='min'&&width<Number(m[2])||m[1]==='max'&&width>Number(m[2]))return false;
    }
    return true;
  });
}
// CSSOM + selector specificity resolves declarations only. This is not a layout engine.
function rules(dom,width,type,includePatch){
  const out=[];
  function visit(items){for(const r of items){
    if(r.selectorText){
      const list=csstree.parse(r.selectorText,{context:'selectorList'});
      list.children.forEach(s=>{const selector=csstree.generate(s);out.push({selector,style:r.style,specificity:Specificity.calculate(selector)[0].toArray(),order:out.length});});
    }else if(r.cssRules&&(!r.media||mediaMatches(r.conditionText,width,type)))visit(r.cssRules);
  }}
  for(const filename of styles){const sheet=dom.window.document.createElement('style');sheet.textContent=(filename==='vocabulary-reading.css'?(includePatch?fullVocabulary:fullVocabulary.slice(0,fullVocabulary.indexOf(marker))):read('media/'+filename));dom.window.document.head.appendChild(sheet);visit(sheet.sheet.cssRules);sheet.remove();}
  return out;
}
function declared(element,property,rs){
  const hits=[];
  for(const r of rs){const value=r.style.getPropertyValue(property);if(!value)continue;if(!element.matches(r.selector))continue;hits.push({value,rank:[r.style.getPropertyPriority(property)==='important'?1:0,...r.specificity,r.order],selector:r.selector});}
  hits.sort((a,b)=>{for(let i=0;i<a.rank.length;i++)if(a.rank[i]!==b.rank[i])return a.rank[i]-b.rank[i];return 0;});
  return hits.at(-1)?.value;
}
function patchRules(){const d=new JSDOM('<style>'+patch+'</style>');const out=[];function visit(rs){for(const r of rs){if(r.selectorText)out.push(r);else if(r.cssRules)visit(r.cssRules);}}visit(d.window.document.styleSheets[0].cssRules);d.window.close();return out;}

test('patch is valid, host-scoped, screen-only and layout-only',()=>{
  const errors=[];csstree.parse(patch,{onParseError:e=>errors.push(e)});assert.equal(errors.length,0);
  const d=new JSDOM('<style>'+patch+'</style>');const top=d.window.document.styleSheets[0].cssRules;assert.equal(top.length,1);assert.equal(top[0].conditionText,'screen');d.window.close();
  for(const r of patchRules()){
    assert(r.selectorText.includes('#toeicNotesHost.tn .tn-readonly-list'));
    for(const p of r.style)assert(/^(?:padding|margin|gap|row-gap|column-gap|grid-template-columns|min-height|top|box-sizing)(?:-|$)/.test(p),p);
  }
  assert.doesNotMatch(patch,/(?:^|[;{])\s*(?:font(?:-size|-family)?|line-height|display|visibility|overflow|pointer-events|content|position|color|background|transform)\s*:/m);
});

test('both modes preserve type and 44px controls across narrow/wide CSS breakpoints',async()=>{
  const evidence=[];
  for(const company of [false,true]){
    const d=await fixture(company),doc=d.window.document;
    const card=doc.querySelector('.tn-word-card'),lexeme=card.querySelector('.tn-lexeme'),check=card.querySelector('.tn-word-check'),summary=card.querySelector('.tn-extra>summary'),example=card.querySelector('.tn-example-main');
    for(const width of [320,390,700,759,760,1024,1440]){
      const before=rules(d,width,'screen',false),after=rules(d,width,'screen',true);
      for(const s of ['h3','.tn-general-meaning','.tn-original','.tn-translation','.tn-pos-badge'])for(const e of card.querySelectorAll(s))for(const p of ['font-size','line-height'])assert.equal(declared(e,p,after),declared(e,p,before),s+' type changed');
      assert.equal(declared(card,'padding-left',after),'52px');assert.equal(declared(card,'padding-top',after),'14px');assert.equal(declared(card,'padding-bottom',after),'12px');
      assert.equal(declared(card,'min-height',after),'64px');assert.equal(declared(card,'row-gap',after),'8px');
      assert.equal(declared(check,'width',after),'44px');assert.equal(declared(check,'height',after),'44px');assert.equal(declared(check,'top',after),'10px');
      assert.equal(declared(summary,'min-height',after),'44px');assert.equal(declared(doc.querySelector('.tn-test-toggle'),'height',after),'44px');
      assert.equal(declared(card,'grid-template-columns',after),width>=760?'minmax(160px, 30%) minmax(0, 1fr)':'minmax(0, 1fr)');
      if(width>=760)assert.equal(declared(lexeme,'grid-template-columns',after),declared(card,'grid-template-columns',after));
      assert.equal(declared(example,'margin-right',after),'0px');
      const other=doc.querySelector('#other .tn-word-card');for(const p of ['padding-left','padding-top','row-gap'])assert.equal(declared(other,p,after),declared(other,p,before));
      evidence.push({company,width,columns:declared(card,'grid-template-columns',after),padding:declared(card,'padding',after),checkTarget:'44px',summaryTarget:'44px',fontDeclarationsUnchanged:true});
    }
    d.window.close();
  }
  fs.writeFileSync(path.join(root,'evidence/cascade-matrix.json'),JSON.stringify({method:'JSDOM CSSOM declaration cascade, not browser geometry',cases:evidence},null,2)+'\n');
});

test('print declaration cascade is unchanged',async()=>{
  const d=await fixture();const before=rules(d,1440,'print',false),after=rules(d,1440,'print',true);assert.equal(after.length,before.length);
  for(const e of d.window.document.querySelectorAll('#toeicNotesHost .tn-word-card, #toeicNotesHost .tn-word-card *'))for(const p of ['padding','margin','grid-template-columns','font-size','height','min-height','display'])assert.equal(declared(e,p,after),declared(e,p,before));d.window.close();
});

test('native checks, meaning visibility, filtering and disclosure survive repeated mode changes',async()=>{
  const d=await fixture(),w=d.window,doc=w.document;try{
    const host=doc.getElementById('toeicNotesHost'),ids=()=>Array.from(host.querySelectorAll('.tn-word-card'),c=>c.dataset.vocabularyId);
    const initial=ids();assert.deepEqual(initial,notes.map(n=>n.id));
    const check=host.querySelector('.tn-word-check input'),card=check.closest('.tn-word-card'),extra=card.querySelector('.tn-extra');check.click();assert(check.checked);extra.open=true;
    const text=card.textContent;
    for(let i=0;i<3;i++){w.HanqDisplayMode.select('company');await new Promise(r=>setTimeout(r,0));w.HanqDisplayMode.select('default');await new Promise(r=>setTimeout(r,0));assert.equal(host.querySelector('.tn-word-check input'),check);assert.equal(card.textContent,text);assert(extra.open);assert(check.checked);}
    for(let i=0;i<2;i++){
      host.querySelector('.tn-test-toggle').click();assert.equal(host.dataset.vocabularyTest,'true');
      for(const e of host.querySelectorAll('.tn-card-meaning,.tn-translation,.tn-extra,.tn-form-meaning'))assert.equal(e.hidden,true);
      host.querySelector('.tn-test-toggle').click();assert.equal(host.dataset.vocabularyTest,'false');assert.deepEqual(ids(),initial);
      assert.equal(host.querySelector('.tn-word-check input').checked,true);assert.equal(host.querySelector('.tn-word-card').textContent,text);
    }
    host.querySelector('.tn-checked-only').click();assert.deepEqual(ids(),[notes[0].id]);host.querySelector('.tn-checked-only').click();assert.deepEqual(ids(),initial);
    assert(host.querySelector('.tn-useful-forms'));assert(host.querySelector('.tn-expression-card'));assert.equal(host.querySelectorAll('.tn-expression-form').length,2);
  }finally{w.HanqToeicNotes.stop();w.close();}
});
