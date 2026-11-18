'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const window={},src=fs.readFileSync('media/cbt-round-materials.js','utf8');
for(const f of ['cbt-explanation-data','cbt-explanation80-data','cbt-explanations','cbt-round-materials'])vm.runInNewContext(fs.readFileSync('media/'+f+'.js','utf8'),{window});
const map=JSON.parse(src.match(/var choiceGovernmentMemos=(\{[\s\S]*?\});/)[1]),items={...window.HANQ_CBT_EXPLANATIONS.items,...window.HANQ_CBT_EXPLANATIONS_80.items},copy=x=>JSON.parse(JSON.stringify(x));
function q(item){const old=copy(item);return {questionId:item.id,version:item.v,exam:item.exam,number:item.number,points:item.points,options:copy(old.options),review:{status:'unanswered',correctNumber:item.answer,correctOptionId:item.options[item.answer-1].id,item:old,options:copy(old.options)}};}
const notes=window.HanqCbtRoundMaterials.choiceNotes;
let correct=0,changed=0,total=0;const exams=new Set(),counts={};
for(const item of Object.values(items)){
 const fixture=q(item),before=JSON.stringify(fixture),source=JSON.stringify(item),lines=notes(fixture);total+=lines.length;
 item.options.forEach((o,i)=>{if(!map[o.id])return;const m=map[o.id];assert.equal(m[0],item.v);assert.equal(lines[i],m[2]+' · '+m[1]+' · '+m[3]);assert.match(m[1],/정부|군정기/);assert(m[2]&&m[3]);correct+=Number(o.correct);changed++;exams.add(item.exam);counts[item.exam]=(counts[item.exam]||0)+1;
  for(const mutate of [x=>x.version='invalid',x=>x.review.item.v='invalid',x=>x.options[0].id='invalid',x=>x.review.correctOptionId='invalid']){const invalid=copy(fixture);mutate(invalid);assert.equal(window.HanqCbtExplanations.resolve(invalid,'final'),null);assert.notEqual(notes(invalid)[i],lines[i],o.id+' guard');}
 });
 assert.equal(JSON.stringify(fixture),before);assert.equal(JSON.stringify(item),source);
}
assert.equal(changed,136);assert.equal(exams.size,11);assert(correct>0&&correct<changed);assert.equal(total,2750);
const five=Array.from(notes(q(items['exam-70-44'])));
assert.deepEqual(five,[
 '반민족 행위 특별 조사 위원회 · 이승만 정부 시기 · 1948년·제헌 국회의 친일 청산',
 '평화 통일론·조봉암 처형 · 이승만 정부 시기 · 1959년·진보당 사건',
 '비상계엄·발췌 개헌 · 이승만 정부 · 1952년·부산·대통령 직선제',
 '애치슨 라인 · 이승만 정부 시기 · 1950년 1월·미국 방위선 발표',
 '유상 매수·유상 분배 농지 개혁법 · 이승만 정부 · 1949년·농지 개혁법 제정']);
assert(notes(q(items['exam-80-48']))[1].includes('노태우 정부 · 1991년'));
assert(notes(q(items['exam-80-49']))[3].includes('김대중 정부 · 2000년'));
assert(notes(q(items['exam-80-45']))[1].includes('박정희 정부 · 1967~1971년'));
// Same calendar year can have different governments; dates never trigger a lookup.
for(const key of ['71.46.4','71.47.4','71.48.5','72.43.1','73.47.1','74.48.2','76.48.5','79.47.2','80.43.1','80.46.1','80.49.3']){
 const [e,n,o]=key.split('.'),id='exam-'+e+'-'+n;assert(!map[id+'-option-'+o]);
}
assert(notes(q(items['exam-80-46']))[2].includes('최규하 정부 시기·신군부'));
assert(notes(q(items['exam-80-41']))[1].includes('전두환 정부 시기 · 1980년 12월'));
assert(notes(q(items['exam-80-47']))[4].includes('최규하→전두환 정부 시기·신군부'));
// A date or government appearing in an arbitrary old note is not authorization to infer.
const synthetic={options:[{id:'unknown'}],review:{item:{options:[{id:'unknown',review:['알 수 없는 사건 — 1948년: 설명']}]}}};assert.equal(notes(synthetic)[0],'알 수 없는 사건 · 1948년');
console.log('PASS '+changed+' explicit government memos ('+correct+' correct/'+(changed-correct)+' wrong), all '+total+' original choices immutable; per round '+JSON.stringify(counts));
