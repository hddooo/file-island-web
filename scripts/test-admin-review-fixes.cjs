'use strict';
// Admin review fixes (2026-11-15): list/detail paging, encoded ids, KST times, focus after re-render,
// membership panel per section and error states, partner-floor XP message, question review busy state.
// Synthetic API only; no network and no real records.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('../.test-tools/node_modules/jsdom');
const root=path.resolve(__dirname,'..'),settle=async()=>{for(let i=0;i<80;i++)await Promise.resolve();await new Promise(r=>setTimeout(r,0));};
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const load=(w,files)=>files.forEach(f=>w.eval(fs.readFileSync(root+'/media/'+f+'.js','utf8')));
const btn=(doc,text,scope='#content')=>[...doc.querySelectorAll(scope+' button')].find(b=>b.textContent===text);

async function membersPage(){
 const html=fs.readFileSync(root+'/ops/members.html','utf8');
 const w=new JSDOM(html,{url:'https://synthetic.invalid/ops/members.html',runScripts:'outside-only'}).window,calls=[];
 let membershipMode='missing',decision='fail',xpMode='partner';
 const member={id:'m/1',nickname:'합성 회원',email:'synthetic@example.invalid',xp:'3000',created_at:'2026-11-14T15:30:00Z'};
 w.confirm=()=>true;
 w.HanqApi={init:async()=>{},ensureSession:async()=>{},state:()=>({signedIn:true,ownerId:'admin',user:{id:'admin'}}),onChange:()=>()=>{},portal:async(m,p,b)=>{calls.push([m,p,b]);
  if(p==='/api/v1/ops')return{admin:true};
  if(p.startsWith('/api/v1/ops/membership-requests')){
   if(m==='POST'){if(decision==='fail')throw Object.assign(Error('x'),{status:500});return{decided:true};}
   if(membershipMode==='missing')throw Object.assign(Error('x'),{status:404});
   return{items:[{id:'p1',nickname:'대기 회원',email:'wait@example.invalid',created_at:'2026-11-14T15:00:00Z'}],total:1};}
  if(m==='POST'&&p.endsWith('/xp')){if(xpMode==='partner')throw Object.assign(Error('xp_partner_insufficient'),{status:409,code:'xp_partner_insufficient',details:{balance:3000,partnerXp:200}});return{confirmed:true};}
  if(p.startsWith('/api/v1/ops/members?'))return{items:[member],total:45};
  if(p.startsWith('/api/v1/ops/members/'))return{user:member,adjustments:[],access:Array.from({length:20},(_,i)=>({id:i,event:'signin',created_at:'2026-11-14T15:30:00Z'})),attempts:[]};
  if(p.startsWith('/api/v1/ops/inquiries?'))return{items:[{id:'q 1',title:'합성 문의',created_at:'2026-11-14T15:30:00Z'}],total:1};
  if(p.startsWith('/api/v1/ops/inquiries/'))return{inquiry:{id:'q 1',title:'합성 문의'},messages:[{id:1,sender_role:'member',body:'질문',created_at:'2026-11-14T15:30:00Z'}]};
  return{items:[],total:0};}};
 load(w,['admin-xp','admin-dashboard','portal-ui','admin-membership']);await settle();
 return{w,doc:w.document,calls,set:(k,v)=>{if(k==='membership')membershipMode=v;if(k==='decision')decision=v;if(k==='xp')xpMode=v;}};
}

async function members(){
 const x=await membersPage(),{doc,calls}=x,panel=doc.querySelector('.membership-panel');
 ok(doc.getElementById('adminTitle').textContent==='회원 관리','shell names the members section');
 ok(panel&&panel.textContent.includes('가입 승인 기능을 불러오지 못했습니다'),'membership 404 is not reported as a login problem');
 x.set('membership','ok');btn(doc,'다시 시도','.membership-panel').click();await settle();
 ok(panel.textContent.includes('대기 1건'),'membership retry loads the queue');
 const approve=btn(doc,'승인','.membership-panel');approve.click();await settle();
 ok(!approve.disabled&&panel.textContent.includes('처리하지 못했습니다'),'failed decision re-enables the row');
 // List page 2 -> detail -> records page 2 -> back to list keeps list page 2.
 btn(doc,'다음').click();await settle();ok(calls.at(-1)[1].includes('members?page=2'),'list page 2 requested');
 ok(doc.querySelector('#content td')&&doc.body.textContent.includes('합성 회원'),'member row rendered');
 doc.body.focus();btn(doc,'보기').click();await settle();
 ok(calls.at(-1)[1]==='/api/v1/ops/members/'+encodeURIComponent('m/1')+'?page=1','detail starts at record page 1');
 ok(doc.activeElement===doc.querySelector('#content'),'focus moves to the re-rendered content');
 ok(!doc.querySelector('#content').textContent.includes('2026-11-14T15:30:00Z'),'access times are formatted, not raw ISO');
 btn(doc,'다음 기록').click();await settle();ok(calls.at(-1)[1].endsWith('?page=2'),'record paging is separate');
 btn(doc,'목록으로').click();await settle();ok(calls.at(-1)[1].includes('members?page=2'),'back to list keeps the list page');
 btn(doc,'보기').click();await settle();
 const form=doc.querySelector('.admin-xp form');form.querySelector('[name=xpDelta]').value='-1000';form.querySelector('[name=xpReason]').value='합성 차감';
 form.dispatchEvent(new x.w.Event('submit',{cancelable:true}));btn(doc,'XP 조정 확정','.admin-xp').click();await settle();
 ok(doc.querySelector('.admin-xp').textContent.includes('200 XP')&&doc.querySelector('.admin-xp').textContent.includes('차감할 수 없어요'),'partner floor explained');
 ok(!form.querySelector('[name=xpDelta]').disabled,'admin can lower the amount and retry');
 // Nickname save uses an encoded id.
 const nick=[...doc.querySelectorAll('#content form')].find(f=>f.querySelector('[name=displayName]'));nick.querySelector('[name=displayName]').value='새 이름';nick.dispatchEvent(new x.w.Event('submit',{cancelable:true}));await settle();
 ok(calls.some(c=>c[0]==='PATCH'&&c[1]==='/api/v1/ops/members/'+encodeURIComponent('m/1')),'nickname PATCH encodes the id');
 // Other sections hide the approval queue; members shows it again.
 doc.querySelector('button[data-admin-section=inquiries]').click();await settle();
 ok(panel.hidden,'approval queue hidden outside members');
 btn(doc,'보기').click();await settle();ok(calls.at(-1)[1]==='/api/v1/ops/inquiries/'+encodeURIComponent('q 1'),'inquiry detail has no stray page query');
 const reply=[...doc.querySelectorAll('#content form')].find(f=>f.querySelector('[name=body]'));reply.querySelector('[name=body]').value='답변';reply.dispatchEvent(new x.w.Event('submit',{cancelable:true}));await settle();
 ok(calls.some(c=>c[0]==='POST'&&c[1]==='/api/v1/ops/inquiries/'+encodeURIComponent('q 1')+'/messages'),'reply POST encodes the id');
 x.w.close();
}

async function questionReview(){
 const w=new JSDOM('<!doctype html><body><div id="host"></div></body>',{url:'https://synthetic.invalid/ops/questions.html',runScripts:'outside-only'}).window;
 const calls=[];let release;w.URL.createObjectURL=()=>'blob:synthetic';w.URL.revokeObjectURL=()=>{};
 const request={id:'r1',status:'submitted',subject:'history',sourceLabel:'합성 요청',revision:1,questions:[{number:1,stem:'문항',choices:[{id:'1',text:'보기'}],correctOptionId:'1'}],assets:[{id:'a1',purpose:'source_image'}]};
 const api={state:()=>({signedIn:true,ownerId:'admin'}),questionRequests:async(m,p,b)=>{calls.push([m,p,b]);if(m==='PATCH')return new Promise(r=>{release=r;});if(p.includes('?page='))return{items:[request],total:1};return request;},questionRequestAsset:async()=>new w.Blob(['x'],{type:'image/png'})};
 load(w,['question-requests']);const host=w.document.getElementById('host');w.HanqQuestionRequests.mount(host,api,{admin:true});await settle();
 btn(w.document,'열기','#host').click();await settle();
 const view=btn(w.document,'형광펜 원본 사진 보기','#host');view.click();await settle();view.click();await settle();
 ok(host.querySelectorAll('img').length===1,'repeated asset clicks show one preview');
 const reject=btn(w.document,'보완 요청','#host'),content=btn(w.document,'내용 검수 완료','#host'),image=btn(w.document,'이미지 2차 검수 완료','#host');
 ok(image.disabled&&!content.disabled,'only allowed transitions start enabled');
 host.querySelector('textarea').value='메모';reject.click();await settle();
 ok(reject.disabled&&content.disabled&&host.textContent.includes('저장 중'),'review buttons lock and show progress while saving');
 release({id:'r1',status:'needs_revision',revision:2});await settle();
 ok(calls.filter(c=>c[0]==='PATCH').length===1,'one review request sent');
 w.close();
}

(async()=>{await members();await questionReview();console.log('admin review fixes: '+checks+' checks passed (synthetic data only)');})().catch(e=>{console.error(e);process.exitCode=1;});
