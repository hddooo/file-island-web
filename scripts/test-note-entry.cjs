'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..'),{JSDOM}=require('jsdom');
const csstree=require('css-tree');
const script=fs.readFileSync(path.join(base,'media/toeic-notes.js'),'utf8'),css=fs.readFileSync(path.join(base,'media/toeic-notes.css'),'utf8');
fs.mkdirSync(path.join(base,'evidence'),{recursive:true});
const results=[],windows=[];const settle=async()=>{for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r));};
const existing={id:'existing-note',expression:'existing',part:'unclassified',meaning:'기존',example:'Existing example.',translation:'기존 예문.',partOfSpeech:'형용사',revision:1,synonyms:[]};
function setup(options={}){
 const dom=new JSDOM('<!doctype html><main id="app"></main>',{url:'https://synthetic.invalid/#toeic/notebook',runScripts:'outside-only',pretendToBeVisual:true});windows.push(dom.window);const w=dom.window,host=w.document.querySelector('main');
 w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>true;w.fetch=async()=>({ok:true,json:async()=>({schemaVersion:1,version:'vocabulary-chapters-v1',chapters:[{id:'vocab-001-v1',title:'Chapter 1',version:1,wordIds:['existing-note'],examStatus:'ready'}]})});
 let state={signedIn:true,ownerId:'owner-a'},listener,records=[JSON.parse(JSON.stringify(existing))],reads=0,saves=[];
 let readHook=null,saveHook=null,canManage=options.canManage===undefined?true:options.canManage;
 const data=()=>({notes:records,archived:[],visibility:'members',...(canManage==='missing'?{}:{canManage})});
 const api={state:()=>state,onChange:fn=>(listener=fn,()=>{}),toeicNotes:async()=>{reads++;if(readHook)return readHook();return data();},saveToeicNote:async(id,note)=>{saves.push({id,note:JSON.parse(JSON.stringify(note))});if(saveHook)return saveHook(id,note);const n={...note,id,revision:1};records=[n,...records];return{note:n};}};
 if(options.session)w.HanqAuthSession=options.session;w.eval(script);const opts={api,onHome(){},onAccount(){}};let mounted=w.HanqToeicNotes.mount(host,opts);
 return{w,host,api,data,get reads(){return reads},saves,get records(){return records},set records(v){records=v},set readHook(f){readHook=f},set saveHook(f){saveHook=f},set canManage(v){canManage=v},switch(ownerId){state={signedIn:!!ownerId,ownerId};listener();},stop(){mounted.stop()},remount(){mounted=w.HanqToeicNotes.mount(host,opts)},fill(values={}){host.querySelector('.tn-add-note').click();for(const [name,value]of Object.entries({expression:'new word',meaning:'새 단어',example:'A new word.',translation:'새로운 단어.',...values}))host.querySelector('[name="'+name+'"]').value=value;},submit(){host.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}};
}
(async()=>{
 const parseErrors=[];csstree.parse(css,{onParseError:e=>parseErrors.push(e.message)});assert.deepEqual(parseErrors,[]);
 for(const capability of [false,'missing']){const h=setup({canManage:capability});await settle();assert.equal(h.host.querySelector('.tn-add-note'),null);assert.equal(h.saves.length,0);}
 results.push('Absent/false canManage never exposes an add button');
 const h=setup();await settle();assert(h.host.querySelector('.tn-add-note'));assert.equal(h.saves.length,0);h.fill();assert.match(h.host.textContent,/로그인한 회원에게 공개/);assert.equal(h.host.querySelector('[name=expression]'),h.w.document.activeElement);assert.equal(h.saves.length,0);h.submit();h.submit();await settle();assert.equal(h.saves.length,1);assert.equal(h.saves[0].note.revision,0);assert.equal(h.saves[0].note.part,'unclassified');assert.equal(h.saves[0].note.example,'A new word.');assert(h.host.querySelector('.tn-word-card h3').textContent==='new word');assert.match(h.host.textContent,/단어장에 추가했어요/);assert.equal(h.host.querySelector('form'),null);
 results.push('Explicit save creates exactly one note, sends meaning/examples, updates searchable card, then closes form; double click does not duplicate');
 const cancel=setup();await settle();cancel.fill();cancel.w.confirm=()=>false;[...cancel.host.querySelectorAll('button')].find(n=>n.textContent==='취소').click();assert(cancel.host.querySelector('form'));cancel.w.confirm=()=>true;[...cancel.host.querySelectorAll('button')].find(n=>n.textContent==='취소').click();assert.equal(cancel.host.querySelector('form'),null);assert.equal(cancel.saves.length,0);assert.equal(cancel.w.document.activeElement,cancel.host.querySelector('.tn-add-note'));
 results.push('Cancel confirms dirty input, does not save, and restores focus');
 const dup=setup();await settle();dup.fill({expression:'  EXISTING  '});dup.submit();await settle();assert.equal(dup.saves.length,0);assert.match(dup.host.textContent,/같은 표현이 이미/);assert(dup.host.querySelector('form'));assert.equal(dup.host.querySelector('button[type=submit]').disabled,false);
 results.push('Normalized duplicate leaves existing record and draft untouched');
 const failedRead=setup();await settle();failedRead.fill();failedRead.readHook=async()=>{throw Error('offline')};failedRead.submit();await settle();assert.equal(failedRead.saves.length,0);assert.match(failedRead.host.textContent,/저장하지 않았어요/);
 results.push('Failed permission/duplicate preflight prevents write');
 const revoked=setup();await settle();revoked.fill();revoked.canManage=false;revoked.submit();await settle();assert.equal(revoked.saves.length,0);assert.equal(revoked.host.querySelector('button[type=submit]').disabled,true);
 results.push('Fresh server canManage=false prevents save even after editor opened');
 const lost=setup();await settle();lost.fill();lost.saveHook=async(id,note)=>{lost.records=[{...note,id,revision:1},...lost.records];throw Error('response lost')};lost.submit();await settle();assert.equal(lost.saves.length,1);assert.equal(lost.host.querySelector('form'),null);assert.match(lost.host.textContent,/저장된 것을 확인/);
 results.push('Lost write response is reconciled by UUID through fresh read, without repeat write');
 const retry=setup();await settle();retry.fill();retry.saveHook=async()=>{throw Error('offline')};retry.submit();await settle();assert.equal(retry.saves.length,1);assert(retry.host.querySelector('form'));retry.readHook=async()=>{throw Error('still offline')};retry.submit();await settle();assert.equal(retry.saves.length,1);retry.readHook=null;retry.saveHook=null;retry.submit();await settle();assert.equal(retry.saves.length,2);assert.equal(retry.saves[0].id,retry.saves[1].id);
 results.push('Uncertain save retries only after fresh successful read and retains the same UUID');
 const stale=setup();await settle();stale.fill();let resolveSave;stale.saveHook=()=>new Promise(r=>resolveSave=r);stale.submit();await settle();assert.equal(stale.saves.length,1);stale.switch('owner-b');await settle();stale.switch('owner-a');await settle();resolveSave({note:{...stale.saves[0].note,id:stale.saves[0].id,revision:1}});await settle();assert.equal(stale.host.querySelector('form'),null);assert.doesNotMatch(stale.host.textContent,/추가했어요/);assert.equal(stale.host.querySelector('.tn-add-note').disabled,false);stale.switch(null);assert.equal(stale.host.querySelector('.tn-add-note'),null);assert.equal(stale.host.querySelector('[name=expression]'),null);
 results.push('Account switch, logout and A→B→A stale response cannot carry or display another generation’s draft/save');
 const sessionDraft={id:'b-restored-draft',part:'unclassified',revision:0,expression:'B private draft',meaning:'B 뜻',example:'B example.',translation:'B 해석',synonyms:[]};
 const restored=setup({session:{takeDraft:(name,owner)=>owner==='owner-b'?JSON.parse(JSON.stringify(sessionDraft)):null,register:()=>()=>{}}});await settle();restored.fill({expression:'A private draft',meaning:'A 뜻'});restored.switch('owner-b');await settle();assert.equal(restored.host.querySelector('[name=expression]').value,'B private draft');assert.equal(restored.host.querySelector('[name=meaning]').value,'B 뜻');restored.submit();await settle();assert.equal(restored.saves[0].note.expression,'B private draft');assert.equal(restored.saves[0].note.meaning,'B 뜻');
 results.push('Restored B session draft never captures the still-mounted A form; owner and draft ID are matched before capture');
 const remount=setup();await settle();remount.fill({expression:'return draft'});remount.stop();remount.remount();await settle();assert.equal(remount.host.querySelector('[name=expression]').value,'return draft');assert.equal(remount.saves.length,0);remount.submit();await settle();assert.equal(remount.saves.length,1);
 results.push('Navigation/unmount keeps only the same owner’s unsaved draft and never auto-saves');
 const xss=setup();await settle();xss.fill({expression:'<img src=x onerror=alert(1)>',meaning:'<script>alert(1)</script>'});xss.submit();await settle();assert.equal(xss.host.querySelector('img'),null);assert.equal(xss.host.querySelector('script'),null);assert.match(xss.host.textContent,/<script>/);
 results.push('Entered text remains inert text content');
 const result={passed:true,base:'80115ca',scope:'Synthetic DOM and mocked API; no production writes or user data',results};fs.writeFileSync(path.join(base,'evidence/note-entry-tests.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>windows.forEach(w=>w.close()));
