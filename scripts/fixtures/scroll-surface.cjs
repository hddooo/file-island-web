/* Synthetic data only. The browser runner intercepts every request. */
module.exports = '(' + function () {
  const state = {enabled:true,signedIn:true,ownerId:'scroll-fixture',user:{id:'scroll-fixture',displayName:'검수 탐험가',email:'fixture@example.test',createdAt:'2026-10-01T00:00:00Z'},premium:{active:true},growth:{points:1300},profileStatus:'ready',access:{total:12,today:true}};
  const people=Array.from({length:20},(_,i)=>({rank:i+1,nickname:'합성 탐험가 '+i,points:2000-i*20,character:{id:'agumon',name:'아구몬'},isMe:i===0}));
  window.HanqApi={enabled:()=>true,state:()=>state,init:async()=>state,onChange:()=>()=>{},onActivity:()=>()=>{},ensureSession:async()=>state,hasSessionHint:()=>true,importEntries:()=>[],plan:async()=>({plan:{developmentOpen:true}}),me:async()=>state,
    portal:async()=>({admin:false,total:20,items:Array.from({length:20},(_,i)=>({id:'synthetic-'+i,title:'검수용 문의 '+i,created_at:'2026-10-28T00:00:00Z'}))}),
    myRecords:async f=>{const all=Array.from({length:43},(_,i)=>({key:'fixture:'+i,subject:i%2?'toeic':'history',source:'battle',at:'2026-10-28T00:00:00Z',detail:{questionId:'synthetic-'+i,battle:{opponent:'합성 상대 '+i,outcome:i%2?'loss':'win'},question:{number:i+1,prompt:'검수용 합성 문제 '+i,choices:[{id:'a',text:'보기 A'},{id:'b',text:'보기 B'}],explanation:'합성 해설입니다. '.repeat(180)},correct:i%2===0,answer:'a',selected:i%2?'b':'a',origin:'battle'}})).filter(r=>f.subject==='all'||f.subject===r.subject);const page=Math.min(f.page,Math.ceil(all.length/20));return{items:all.slice((page-1)*20,page*20),total:all.length,page,pages:Math.ceil(all.length/20),snapshot:'2026-10-28T01:00:00Z',timeZone:'Asia/Seoul'};},
    studyActivity:async m=>({start:m+'-01',end:m+'-31',timeZone:'Asia/Seoul',days:[]}),
    hallOfFame:async()=>({items:people,me:people[0],page:1,limit:20,total:20}),
    hallOwnLearning:async()=>({items:Array.from({length:30},(_,i)=>({at:'2026-10-28T00:'+String(i).padStart(2,'0')+':00Z',subject:'한국사',setName:'합성 풀이 '+i}))}),
    battle:async()=>({serverNow:Date.now(),players:[],invitations:[],matches:[],items:[]})
  };
}.toString() + ')();';
