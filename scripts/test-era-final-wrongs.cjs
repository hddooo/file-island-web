'use strict';
// Synthetic workspaces only. Never reads or writes a real user's study records.
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const source='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
const eras=['prehistory','ancient','nambuk','goryeo','joseon','opening','colonial','modern'];
const tick=()=>new Promise(resolve=>setTimeout(resolve,20));
(async()=>{
  const w=new JSDOM('<div id="app"><main></main></div>',{url:'https://synthetic.invalid',runScripts:'outside-only',pretendToBeVisual:true}).window,d=w.document,errors=[];
  w.addEventListener('error',e=>errors.push(e.message));
  for(const file of ['ui-locks','textbook-source-quiz','era-study-progress','hongmungwan'])w.eval(fs.readFileSync('media/'+file+'.js','utf8'));
  const make=(era,n)=>({id:era+'-'+n,originalNumber:n,kind:'fill-in',verification:{status:'source-verified',textVerified:true,answerPairVerified:true},segments:[{type:'text',text:'합성 <strong onclick="bad()">강조</strong> <script>bad()</script><img src="bad" onerror="bad()"> 문항 '},{type:'blank',id:'b'}],blanks:[{id:'b',answerIds:['a']}],answers:[{id:'a',text:'합성 정답'}],answer:{text:'합성 정답'}});
  const models=Object.fromEntries(eras.map(id=>[id,{id,version:'v',source:{sha256:source},items:[1,2,3].map(n=>make(id,n))}]));
  const records=Object.fromEntries(eras.map(id=>[id,{version:'v',workspace:{status:'completed',responses:Object.fromEntries(models[id].items.map((q,i)=>[q.id,{submitted:i!==2,correct:i===1?true:i===0?false:null,values:[i===2?'':'합성 이전 답'],checkedSlots:[i!==2]}]))}}]));
  records.modern.workspace.responses={};
  let state={signedIn:true,ownerId:'A',epoch:1},listener,writes=0,failed=null,hold=null;
  const calls=[],api={state:()=>state,onChange:fn=>{listener=fn;return()=>{};},hongmungwan:async()=>({resetAt:null,items:[]}),textbookSemanticQuiz:async id=>{calls.push(['model',id]);assert(eras.includes(id));return models[id];},textbookSourceWorkspace:async id=>{calls.push(['workspace',id]);if(failed===id)throw Error('synthetic unavailable');if(hold?.id===id)return hold.promise;return state.ownerId==='A'?records[id]:{version:'v',workspace:{responses:{}}};},saveTextbookSourceWorkspace:()=>{writes++;throw Error('unexpected write');},request:()=>{writes++;throw Error('unexpected request');}};
  const host=d.querySelector('main');let controller=w.HanqEraProgress.mount(host,{api,aggregate:true});await controller.ready;
  const open=async id=>{d.querySelector('.era-wrong-review[data-era="'+id+'"]').click();await tick();};
  const close=()=>d.querySelector('.era-wrong-close').click();
  assert.equal(d.querySelectorAll('.era-wrong-review').length,8);assert.equal(calls.length,16);assert(!calls.some(c=>c[1]==='samguk'));
  assert.match(d.querySelector('[data-review-era="samguk"] .era-progress-status').textContent,/최종 오답 1문항/);
  for(const [i,id] of eras.entries()){
    const menuId=id==='ancient'?'samguk':id,previous=calls.length;await open(menuId);
    assert.deepEqual(calls.slice(previous),[['model',id],['workspace',id]],'opening reads only the selected era');
    assert.equal(d.querySelectorAll('.era-wrong-item').length,id==='modern'?0:1);
    for(const card of d.querySelectorAll('.era-wrong-item')){assert.equal(card.dataset.era,menuId);assert.equal(card.dataset.itemId,id+'-1');}
    if(id==='modern')assert.match(d.querySelector('.era-wrong-empty').textContent,/현대/);
    else{
      assert.equal(d.querySelector('.era-wrong-question strong').textContent,'강조');assert.equal(d.querySelector('.era-wrong-question strong').attributes.length,0);
      assert.equal(d.querySelector('.era-wrong-question img,.era-wrong-question script'),null);assert(!d.querySelector('.era-wrong-question').textContent.includes('<strong'));assert(!d.querySelector('.era-wrong-question').textContent.includes('bad()'));
      const input=d.querySelector('input'),snapshot=JSON.stringify(records);assert.equal(input.value,'');input.value='합성 정답';input.focus();input.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));assert.equal(d.querySelector('.era-practice-feedback').dataset.result,'correct');assert.equal(JSON.stringify(records),snapshot);
    }
    close();assert.equal(d.activeElement,d.querySelector('.era-wrong-review[data-era="'+menuId+'"]'));
  }
  // A newly acknowledged snapshot replaces the previous final wrong, never appends it.
  const partial=structuredClone(records.colonial);
  for(const status of ['active','paused']){
    records.colonial.workspace.status=status;await open('colonial');assert.equal(d.querySelector('.era-wrong-item'),null);assert.match(d.querySelector('.era-wrong-empty').textContent,/최종 제출 기록이 없습니다/);assert.equal(d.querySelector('[data-review-era="colonial"] .era-progress-status').textContent,'최종 제출 없음');close();
    assert.equal(w.HanqEraProgress.summary(models.colonial,records.colonial).wrong.length,1,'the existing summary contract retains partial progress');
  }
  records.colonial.workspace.status='active';records.colonial.workspace.responses['colonial-3']={submitted:true,correct:true,values:['합성 정답'],checkedSlots:[true]};
  await open('colonial');assert.equal(d.querySelectorAll('.era-wrong-item').length,1,'legacy full completion remains reviewable');close();records.colonial=partial;
  await open('colonial');assert.equal(d.querySelectorAll('.era-wrong-item').length,1,'explicit completed partial submission remains reviewable');close();
  records.joseon.workspace.responses['joseon-1'].correct=true;
  records.joseon.workspace.responses['joseon-2'].correct=false;
  await open('joseon');assert.deepEqual([...d.querySelectorAll('.era-wrong-item')].map(n=>n.dataset.itemId),['joseon-2']);close();
  failed='goryeo';await open('goryeo');assert(d.querySelector('.era-wrong-error'));assert.equal(d.querySelector('.era-wrong-empty'),null);close();failed=null;await open('goryeo');assert.equal(d.querySelectorAll('.era-wrong-item').length,1);close();
  let release;hold={id:'opening',promise:new Promise(resolve=>release=resolve)};await open('opening');assert.equal(d.querySelector('.era-wrong-body').getAttribute('role'),'status');close();await open('joseon');release(records.opening);await tick();assert.equal(d.querySelector('.era-wrong-item').dataset.itemId,'joseon-2');close();hold=null;
  controller.stop();const older=structuredClone(records.prehistory);hold={id:'prehistory',promise:new Promise(resolve=>release=resolve)};
  controller=w.HanqEraProgress.mount(host,{api,aggregate:true});await tick();hold=null;records.prehistory.workspace.responses['prehistory-2'].correct=false;
  await open('prehistory');assert.equal(d.querySelectorAll('.era-wrong-item').length,2);release(older);await controller.ready;
  assert.match(d.querySelector('[data-review-era="prehistory"] .era-progress-status').textContent,/최종 오답 2문항/,'a late menu response cannot replace a newer modal count');close();
  await open('joseon');state={signedIn:true,ownerId:'B',epoch:2};listener();assert.equal(d.querySelector('dialog'),null);assert.equal(d.querySelector('.era-aggregate'),null);assert.equal(d.querySelector('#app').inert,false);
  controller=w.HanqEraProgress.mount(host,{api,aggregate:true});await controller.ready;await open('joseon');assert(d.querySelector('.era-wrong-empty'));assert.equal(d.querySelector('input'),null);close();controller.stop();
  state={signedIn:true,ownerId:'A',epoch:3};await w.HanqHongmungwan.mount(host,{api}).ready;assert.equal(d.querySelectorAll('.era-wrong-review').length,8);await open('joseon');assert.equal(d.querySelector('.era-wrong-item').dataset.itemId,'joseon-2');w.HanqHongmungwan.stop();
  assert.equal(writes,0);assert.deepEqual(errors,[]);w.close();
  console.log(JSON.stringify({eras:8,latestSnapshotOnly:true,canonicalAncient:true,emptyAndError:true,closeReopenAndLateResponse:true,ownerIsolation:true,safeEmphasis:true,writes}));
})().catch(error=>{console.error(error);process.exitCode=1;});
