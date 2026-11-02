'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'..'),w={};let checks=0;const ok=(x,m)=>{assert(x,m);checks++;};
for(const f of ['exam-pool.js','exam-brief-core.js','quiz-brief-feedback.js'])vm.runInNewContext(fs.readFileSync(path.join(root,'media',f),'utf8'),{window:w});
const before=JSON.stringify(w.HANQ_EXAM_POOL);let unresolved=0;
for(const q of Object.values(w.HANQ_EXAM_POOL.questions)){
 const rows=w.HanqQuizBriefFeedback.core(q);ok(rows.length>=3&&rows.length<=5,q.id+' related3–5 facts');
 const selected=q.options.find(o=>!o.correct).id,out=w.HanqQuizBriefFeedback.render(q,selected);
 ok((out.match(/class="qb-option/g)||[]).length===5,q.id+' all original options');ok(out.includes('× 고른 답')&&out.includes('✓ 정답'),q.id+' selected and correct state');
 for(const o of q.options)if(!w.HanqQuizBriefFeedback.brief(q,o))unresolved++;
 const changed={...q,v:'unrecognized-snapshot',rv:'unrecognized-review',overview:{}};
 ok(w.HanqQuizBriefFeedback.core(changed).length===0,q.id+' no overlay on a different saved version');
}
ok(JSON.stringify(w.HANQ_EXAM_POOL)===before,'all original IDs/versions/options/images/points unchanged');ok(unresolved===3,'three unidentified image options remain explicit');
console.log(JSON.stringify({checks,failures:0,questions:500,unresolvedImageOptions:unresolved}));
