'use strict';
const assert = require('node:assert/strict');
const {create} = require('../media/api-client');
const Auth = require('../media/auth-session');
const Quiz = require('../media/quiz-progress');
let checks = 0;
const eq = (a,b,m) => { assert.deepEqual(a,b,m); checks++; };
const ok = (a,m) => { assert.ok(a,m); checks++; };
const response = (status,data) => ({ok:status<400,status,text:async()=>JSON.stringify(data)});
const profile = owner => ({user:{id:owner},growth:{points:1000},access:{total:20},premium:{active:true}});
const session = owner => ({user:{id:owner},accessToken:'fixture-memory-token',accessTokenExpiresAt:'2030-01-01T00:00:00Z'});
const storage = () => { const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k),m}; };
const tick = async()=>{for(let i=0;i<40;i++)await Promise.resolve();};
(async()=>{
  for(const failure of ['network',500,503,'malformed']) {
    let refreshes=0,mode=failure,meCalls=0;const store=storage(),events=[];
    const api=create({base:'https://fixture.test',storage:store,locks:null,fetch:async(url)=>{
      if(url.endsWith('/signin'))return response(200,session('A'));
      if(url.endsWith('/refresh')){refreshes++;if(mode==='network')throw Error('fixture');if(mode==='malformed')return response(200,{});return response(mode,{error:{code:'server_unavailable'}});}
      if(url.endsWith('/me')){meCalls++;return response(200,profile('A'));}
      return response(401,{error:{code:'invalid_token'}});
    }});
    api.onActivity(e=>events.push(e));await api.signin('fixture','fixture');
    // Current policy never refreshes/replays a protected 401. Exercise a direct
    // refresh failure here; protected 401 behavior is tested in test-auth-recovery.
    eq(await api.refresh(),false,'explicit refresh reports failure');
    eq(refreshes,1,'one explicit refresh, no automatic retry');ok(api.state().signedIn&&api.hasSessionHint(),'transient or malformed renewal retains auth');eq(api.state().ownerId,'A');
    ok(api.state().sessionError,'renewal failure is exposed');ok(!JSON.stringify(events).includes('fixture-memory-token'),'activity contains no credentials');
    const before=meCalls;await api.retryConnection();eq(meCalls,before+1,'manual retry checks session');eq(api.state().connectionError,null);
    eq(events.filter(e=>e.pending).length,events.filter(e=>!e.pending).length,'all request indicators end');
  }
  let release,writes=0,fail=false;const api=create({base:'https://fixture.test',locks:null,storage:storage(),fetch:async(url)=>{
    if(url.endsWith('/signin'))return response(200,session('A'));if(url.endsWith('/me'))return response(200,profile('A'));
    writes++;return new Promise(r=>release=()=>r(response(fail?503:200,fail?{error:{code:'server_unavailable'}}:{saved:true})));
  }});await api.signin('fixture','fixture');
  const a=api.saveToeicNote('fixture',{meaning:'draft'}),b=api.saveToeicNote('fixture',{meaning:'draft'});eq(a,b,'duplicate mutation shares promise');await tick();eq(writes,1);release();await a;
  fail=true;const failed=api.saveToeicNote('fixture',{meaning:'draft'});await tick();release();await assert.rejects(failed);checks++;eq(writes,2,'no automatic write retry');
  // A cold-start refresh 401 has no in-memory owner, but still retains a safe return path.
  let state={signedIn:false,ownerId:null},listener,navigated=[],required=0;
  const cold={state:()=>state,onChange:f=>(listener=f,()=>{})};
  const manager=Auth.create({api:cold,storage:storage(),route:()=> '#toeic/notebook'});
  manager.configure({requireLogin:()=>required++,navigate:p=>navigated.push(p)});
  state={signedIn:false,ownerId:null,authReason:'expired'};listener(state);await tick();eq(required,1);
  state={signedIn:true,ownerId:'A',authReason:'signin'};listener(state);ok(manager.resume());eq(navigated,['#toeic/notebook']);
  for(const route of ['#toeic','#toeic/notebook','#toeic/wrongnotes'])eq(Auth.safeReturnTo(route),route);
  eq(Auth.safeReturnTo('#toeic/notebook?returnTo=//other.test'),null);manager.stop();
  let quizState={signedIn:true,ownerId:'A',epoch:1},lastPayload;
  const stub={state:()=>quizState,onChange:()=>{},enabled:()=>true,newSubmissionId:()=> 'quiz-fixture-stable',submitAttempt:async(...args)=>{lastPayload=args;throw Error('uncertain');}};
  const q=Quiz.create(stub),pair={questionId:'fixture-q',version:'v1'};
  await assert.rejects(q.submit(pair,'fixture-option'));checks++;const suspended=q.capturePending('A');
  const q2=Quiz.create(stub);q2.restorePending(suspended);await assert.rejects(q2.submit(pair,'fixture-option'));checks++;eq(lastPayload,['fixture-q','v1','fixture-option','quiz-fixture-stable'],'restored uncertain save reuses submission identity');
  quizState={signedIn:true,ownerId:'B',epoch:2};eq(q2.pending(pair),null,'different account sees no pending answer');
  console.log(JSON.stringify({checks,failures:0,scope:'transient refresh/malformed response, recovery feedback, mutation sharing, cold expiry return, pending submission identity and owner isolation; synthetic transport'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
