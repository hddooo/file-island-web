#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require(process.env.JSDOM_PATH || '../.test-tools/node_modules/jsdom');
const libraryModule = require('../media/textbook-semantic-library');
const pageRenderer = require('../media/textbook-semantic');
let checks = 0;
const ok = (condition, label) => { assert.ok(condition, label); checks++; };
const same = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks++; };
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
async function flush() { await tick(); await tick(); }
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
const OLD_SOURCE='35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442';
const manifest = () => ({source:{sha256:OLD_SOURCE,totalPdfPages:144}, figures: [{id: 'fixture-map'}], schemaVersion: 'hanq-semantic-manifest/1', pages: [{ pdfPage: 12, printedPage: 5 }, { pdfPage: 13, printedPage: 6 }, { pdfPage: 60 }], quizzes: [{ id: 'prehistory', itemCount: 36 }] });
const eraFor = id => id === 'samguk' ? {id:'samguk',from:16,to:30} : id === 'joseon' ? { id: 'joseon', from: 57, to: 84 } : id === 'goryeo' ? { id: 'goryeo', from: 40, to: 56 } : { id: 'prehistory', from: 8, to: 15 };
function sourcePage(n, text = 'TEXT-' + n, figure = false) {
  return {sourceSha256:OLD_SOURCE, schemaVersion: 'hanq-semantic/1', pdfPage: n, printedPage: n - 7, reviewStatus: 'unverified', blocks: [{ id: 'body', type: 'text', lines: [{ spans: [{ text }] }] }].concat(figure ? [{ type: 'figure', assetId: 'fixture-map', alt: '작은 연습 그림' }] : []), sourceBlanks: [], generatedPractice: [] };
}
function setup() {
  const dom = new JSDOM('<!doctype html><main><footer>기존 요약 바로가기</footer></main>', { url: 'https://fixture.test/' });
  const host = dom.window.document.querySelector('main'), calls = [], revoked = [];
  const listeners = new Set(); let state = { signedIn: true, restoring: false, ownerId: 'member-a', epoch: 1, premium: false }, blobs = 0, quizCleanups = 0;
  dom.window.URL.createObjectURL = () => 'blob:figure-' + (++blobs);
  dom.window.URL.revokeObjectURL = url => revoked.push(url);
  const api = {
    state: () => ({ ...state }),
    onChange: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    textbookSemanticManifest: async () => { calls.push(['manifest', state.ownerId]); return manifest(); },
    textbookSemanticPage: async n => { calls.push(['page', n, state.ownerId]); return sourcePage(n); },
    textbookSemanticQuiz: async id => { calls.push(['quiz', id, state.ownerId]); return {source:{sha256:OLD_SOURCE}, id, text: 'SOURCE-QUIZ' }; },
    textbookSemanticFigure: async id => { calls.push(['figure', id, state.ownerId]); return new Blob(['synthetic raster'], { type: 'image/png' }); },
    textbookImage: () => { throw new Error('No raster-page fallback allowed'); },
    textbookManifest: () => { throw new Error('No legacy manifest allowed'); }
  };
  const quizRenderOptions=[];
  const quizRenderer = { render: (container, data, options) => {
    quizRenderOptions.push(options);
    const article = dom.window.document.createElement('article'); article.className = 'fixture-quiz'; article.textContent = data.text; container.replaceChildren(article);
    let cleaned = false;
    return { element: article, ready: Promise.resolve(), cleanup: () => { if (!cleaned) { quizCleanups++; cleaned = true; article.remove(); } } };
  } };
  const library = libraryModule.create({ api, document: dom.window.document, eraFor, pageRenderer, quizRenderer });
  return { dom, host, api, library, calls, revoked, listeners, quizRenderOptions, quizCleanups: () => quizCleanups,
    setState: (next, emit = true) => { state = { ...state, ...next }; if (emit) [...listeners].forEach(listener => listener(state)); },
    close: () => { library.stop(); dom.window.close(); },
    tab: name => host.querySelector('[data-mode=' + name + ']'),
    select: n => { const select = host.querySelector('select'); select.value = String(n); select.dispatchEvent(new dom.window.Event('change')); }
  };
}

(async () => {
  ok(libraryModule.validManifest(manifest()), 'valid manifest');
  for (const invalid of [null, {}, {...manifest(),schemaVersion:'old'}, {...manifest(),pages:[{pdfPage:12},{pdfPage:12}]}, {...manifest(),quizzes:[{id:'../public'}]}, {...manifest(),pages:[{pdfPage:145}]}]) ok(!libraryModule.validManifest(invalid),'bad manifest rejected');
  for (const error of [{status:401},{status:403},{status:404},{status:503},{code:'timeout'}]) ok(libraryModule.errorText(error).length>10,'explicit error');
  let t=setup();
  try {
    t.setState({signedIn:false,ownerId:null},false); await t.library.mount(t.host,'prehistory');same(t.calls,[],'signed out: no private requests');
    t.setState({signedIn:true,ownerId:'member-a',epoch:2,restoring:true});await flush();same(t.calls,[],'restoring: no private requests');
    t.setState({restoring:false});await flush();
    same([...t.host.querySelectorAll('[data-reader-page]')].map(e=>+e.dataset.readerPage),[12,13],'all era pages in source order');
    ok(t.host.textContent.includes('TEXT-12')&&t.host.textContent.includes('TEXT-13'),'all pages load without selecting or clicking');
    same(t.host.querySelectorAll('select:not([data-textbook-revision])').length,0,'no page selection gate; edition control is separate');
    same(t.calls.filter(c=>c[0]==='page').map(c=>c[1]),[12,13],'each era page fetched once');
    same(t.host.querySelector('[data-semantic-coverage]').textContent,'이 범위의 학습 자료 · 빈칸 36문항','coverage counts retained');
    same(t.host.querySelectorAll('.textbook-reader-toc').length,0,'reader TOC area removed entirely');ok(t.host.querySelector('[data-reader-page] .textbook-semantic'),'source body appears directly without a navigation gate');
    t.tab('quiz').click();await flush();ok(t.host.textContent.includes('SOURCE-QUIZ')&&!t.host.querySelector('[data-reader-page]'),'quiz replaces reader');same(t.host.querySelectorAll('.textbook-reader-toc').length,0,'no reader TOC in quiz');
    t.tab('text').click();await flush();ok(t.host.textContent.includes('TEXT-12')&&t.host.textContent.includes('TEXT-13'),'reader restores entire era');same(t.quizCleanups(),1,'quiz child cleaned');
    t.setState({signedIn:false,ownerId:null,epoch:3});ok(!t.host.querySelector('[data-reader-page]')&&!t.host.querySelector('.textbook-semantic'),'logout clears all pages synchronously');
    t.library.stop();same(t.listeners.size,0,'stop unsubscribes');same(t.host.innerHTML,'<footer>기존 요약 바로가기</footer>','unrelated footer preserved');same(t.dom.window.localStorage.length,0,'no new persistent source storage');
  } finally{t.close();}
  t=setup();try{
    await t.library.mount(t.host,'prehistory',{fixedMode:true,initialMode:'quiz'});same(t.host.querySelectorAll('.textbook-supplement-links').length,0,'era screen omits people and region appendix links');same(t.quizRenderOptions.at(-1).manualSave,true,'era quiz uses explicit saving');
    await t.library.mount(t.host,'prehistory');ok(t.host.querySelector('.textbook-supplement-links'),'standalone reader keeps appendix navigation');
  }finally{t.close();}
  t=setup();try{
    const profile={schemaVersion:'synthetic-selected-profile'},foreign={schemaVersion:'synthetic-foreign-profile'};
    t.api.textbookSemanticManifest=async()=>({...manifest(),sourcePromptStylesByQuiz:{prehistory:profile,goryeo:foreign}});
    await t.library.mount(t.host,'prehistory');t.tab('quiz').click();await flush();same(t.quizRenderOptions.at(-1).sourcePromptStyles,profile,'only selected quiz source styles forwarded');
    t.api.textbookSemanticManifest=async()=>manifest();await t.library.mount(t.host,'prehistory');t.tab('quiz').click();await flush();same(t.quizRenderOptions.at(-1).sourcePromptStyles,undefined,'legacy manifest adds no prompt styles');
  }finally{t.close();}
  t=setup();try{
    await t.library.mount(t.host,'goryeo');ok(t.host.textContent.includes('준비 중'),'honest unavailable era');same(t.calls.filter(c=>c[0]==='page').length,0,'no wrong-era fallback');
    await t.library.mount(t.host,'joseon');ok(t.host.textContent.includes('TEXT-60'),'other era loads correctly');same(t.host.querySelectorAll('.textbook-semantic-library').length,1,'one owned shell');
  }finally{t.close();}
  t=setup();try{
    t.api.textbookSemanticManifest=async()=>({...manifest(),quizzes:[{id:'ancient',eraId:'ancient',itemCount:66}]});
    await t.library.mount(t.host,'samguk');ok(t.host.textContent.includes('SOURCE-QUIZ'),'samguk reads the existing ancient source quiz');same(t.calls.filter(c=>c[0]==='quiz').map(c=>c[1]),['ancient'],'existing quiz ID preserved');
  }finally{t.close();}
  t=setup();try{
    const delayed=deferred();t.api.textbookSemanticPage=n=>n===12?delayed.promise:Promise.resolve(sourcePage(n));
    const mounting=t.library.mount(t.host,'prehistory');await flush();ok(t.host.textContent.includes('TEXT-13'),'slow first page does not block following source page');
    await t.library.mount(t.host,'joseon');delayed.resolve(sourcePage(12,'STALE-ERA'));await mounting;await flush();ok(t.host.textContent.includes('TEXT-60')&&!t.host.textContent.includes('STALE-ERA'),'late prior era cannot replace current reader');
    const late=deferred();t.api.textbookSemanticQuiz=()=>late.promise;t.tab('quiz').click();await flush();t.tab('text').click();await flush();late.resolve({id:'prehistory',text:'STALE-QUIZ'});await flush();ok(!t.host.textContent.includes('STALE-QUIZ'),'late quiz cannot replace reader');
    const pending=deferred();t.api.textbookSemanticPage=()=>pending.promise;const stopped=t.library.mount(t.host,'prehistory');await flush();t.library.stop();pending.resolve(sourcePage(12,'STOPPED'));await stopped;ok(!t.host.textContent.includes('STOPPED'),'stop defeats pending source');
  }finally{t.close();}
  t=setup();try{
    const waiting=deferred();t.api.textbookSemanticManifest=()=>waiting.promise;const pending=t.library.mount(t.host,'prehistory');await flush();t.setState({signedIn:false,ownerId:null,epoch:2});waiting.resolve(manifest());await pending;same(t.calls.length,0,'late manifest after logout makes no page requests');
  }finally{t.close();}
  t=setup();try{
    t.api.textbookSemanticPage=async n=>sourcePage(n,'WITH-FIGURE-'+n,true);await t.library.mount(t.host,'prehistory');await flush();same(t.calls.filter(c=>c[0]==='figure').length,2,'auth-only image resolution for both pages');
    t.setState({signedIn:false,ownerId:null,epoch:2});same(t.revoked.sort(),['blob:figure-1','blob:figure-2'],'logout revokes all page image URLs');ok(!t.host.querySelector('img'),'logout removes all source images');
  }finally{t.close();}
  t=setup();try{
    const observers=[];class Observer{constructor(cb,opts){this.cb=cb;this.targets=new Set();observers.push(this);same(opts.rootMargin,'800px 0px','nearby-only image prefetch margin');}observe(e){this.targets.add(e);}unobserve(e){this.targets.delete(e);}disconnect(){this.targets.clear();}}
    t.library.stop();const lazy=libraryModule.create({api:t.api,document:t.dom.window.document,eraFor,pageRenderer,IntersectionObserver:Observer});t.api.textbookSemanticPage=async n=>sourcePage(n,'LAZY-'+n,true);
    await lazy.mount(t.host,'prehistory');await flush();same(t.calls.filter(c=>c[0]==='figure').length,0,'offscreen images make no eager Blob requests');ok(t.host.textContent.includes('LAZY-12')&&t.host.textContent.includes('LAZY-13'),'text does not wait for image viewport');
    const obs=observers[0],target=[...obs.targets][0];obs.cb([{target,isIntersecting:true}]);await flush();same(t.calls.filter(c=>c[0]==='figure').length,1,'only intersecting image fetched');lazy.stop();same(obs.targets.size,0,'stop disconnects all deferred images');await flush();
  }finally{t.close();}
  for(const stage of ['manifest','page','quiz'])for(const status of [401,404,503]){
    t=setup();try{
      const error=Object.assign(new Error('fixture'),{status});
      if(stage==='manifest')t.api.textbookSemanticManifest=async()=>{throw error;};
      if(stage==='page')t.api.textbookSemanticPage=async()=>{throw error;};
      if(stage==='quiz')t.api.textbookSemanticQuiz=async()=>{throw error;};
      await t.library.mount(t.host,'prehistory');if(stage==='quiz'){t.tab('quiz').click();await flush();}
      ok(t.host.textContent.includes(libraryModule.errorText(error)),stage+'/'+status+' specific error');ok(t.host.querySelector('[data-semantic-retry],[data-page-retry]'),'retry available');ok(t.host.querySelector('footer'),'footer retained on error');
      if(stage==='page'&&status===401)ok(!t.host.querySelector('.textbook-semantic'),'auth failure clears every private page');
    }finally{t.close();}
  }
  t=setup();try{
    t.api.textbookSemanticPage=async n=>{if(n===12)throw Object.assign(new Error('fixture'),{status:404});return sourcePage(n);};await t.library.mount(t.host,'prehistory');ok(t.host.textContent.includes('TEXT-13'),'one missing page does not hide remaining era');
    t.api.textbookSemanticPage=async n=>sourcePage(n);t.host.querySelector('[data-page-retry]').click();await flush();ok(t.host.textContent.includes('TEXT-12')&&t.host.textContent.includes('TEXT-13'),'page-local retry recovers without discarding neighbor');same(t.listeners.size,1,'retry does not duplicate auth subscriptions');
  }finally{t.close();}
  console.log(JSON.stringify({checks,failures:0,scope:'continuous era reading; bounded page loading; anchor navigation; lazy authenticated figures; auth cleanup and stale response races'}));
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
