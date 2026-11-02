'use strict';
const base=require('./cbt-stars-fixture.js');
module.exports=function(win){
 const f=base(win),original=f.api.cbt,stars=new Map(),imports=new Set(),submits=new Map(),wrong=new Set();let failStar=false;
 const key=q=>JSON.stringify([f.api.state().ownerId,q.questionId,q.version]);
 const sig=d=>JSON.stringify(d.items.map(q=>[q.questionId,q.version,q.options.map(o=>o.id)]));
 const view=d=>({signature:sig(d),flags:d.items.map(q=>stars.get(key(q))===true)});
 f.api.cbt=async function(method,path,body){
  const star=path.match(/\/(runs|reviews)\/([^/]+)\/stars(\/import)?$/);
  if(star){f.calls.push({method,path,body:body&&JSON.parse(JSON.stringify(body))});const d=f.snapshot(star[2]);
   if(method==='POST'){
    if(failStar){failStar=false;throw Object.assign(Error('offline'),{status:0});}
    if(body.signature!==sig(d))throw Object.assign(Error('signature'),{status:409});
    if(star[3]){const receipt=f.api.state().ownerId+'|'+star[2];if(!imports.has(receipt)){imports.add(receipt);d.items.forEach((q,i)=>{if(body.flags[i]&&!stars.has(key(q)))stars.set(key(q),true);});}}
    else stars.set(key(d.items[body.position]),body.starred);
   }return view(d);
  }
  if(path.endsWith('/reviews')&&method==='GET')return{reviews:Object.values(f.runs).filter(r=>r.owner===f.api.state().ownerId&&r.data.run.kind==='review').map(r=>({...r.data.run,questions:r.data.items.length}))};
  if(path.endsWith('/reviews')&&method==='POST'){
   f.calls.push({method,path,body:JSON.parse(JSON.stringify(body))});
   const old=Object.values(f.runs).find(r=>r.owner===f.api.state().ownerId&&r.key===body.idempotencyKey);if(old)return f.snapshot(old.data.run.id);
   const id=f.create(body.round,false),r=f.runs[id];r.key=body.idempotencyKey;
   r.data.items=r.data.items.filter(q=>wrong.has(key(q))||stars.get(key(q))===true).map((q,i)=>({...q,position:i}));
   if(!r.data.items.length){delete f.runs[id];throw Object.assign(Error('empty'),{status:409,code:'review_empty'});}
   r.data.run.kind='review';return f.snapshot(id);
  }
  const m=path.match(/\/reviews\/([^/]+)(?:\/(\w+))?$/);
  if(m){const id=m[1],action=m[2],d=f.snapshot(id);if(method==='GET')return d;
   if(action==='submit'){
    f.calls.push({method,path,body:JSON.parse(JSON.stringify(body))});const canonical=JSON.stringify(body);
    if(submits.has(id)){if(submits.get(id)!==canonical)throw Object.assign(Error('conflict'),{status:409});return f.snapshot(id);}
    submits.set(id,canonical);const actual=f.runs[id].data;actual.run.status='final';let correct=0,wrongCount=0,unanswered=0;
    actual.items.forEach((q,i)=>{q.selectedOptionId=body.answers[i].optionId;const good=q.selectedOptionId===q.options[1].id;if(q.selectedOptionId===null)unanswered++;else if(good)correct++;else{wrongCount++;wrong.add(key(q));}q.review={status:q.selectedOptionId===null?'unanswered':good?'correct':'wrong',earned:good?2:0,correctNumber:2,correctOptionId:q.options[1].id,options:q.options.map((o,n)=>({...o,correct:n===1})),item:{}};});
    actual.run.result={kind:'review',total:actual.items.length,answered:correct+wrongCount,correct,wrong:wrongCount,unanswered};return f.snapshot(id);
   }
   return original(method,path.replace('/reviews/','/runs/'),body);
  }
  const result=await original(method,path,body);
  if(path.endsWith('/runs')&&method==='GET')result.runs=result.runs.filter(r=>!r.kind);
  if(path.endsWith('/submit')&&result.run&&!result.run.kind)result.items.forEach(q=>{if(q.selectedOptionId&&q.review.status==='wrong')wrong.add(key(q));});
  return result;
 };
 f.failStar=()=>{failStar=true;};f.serverStar=(id,position,value)=>stars.set(key(f.snapshot(id).items[position]),value);
 f.wrong=(id,position)=>wrong.add(key(f.snapshot(id).items[position]));
 return f;
};
