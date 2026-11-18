'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync('media/cbt-round-materials.js','utf8');
function context(code){const window={};for(const f of ['cbt-explanation-data','cbt-explanation80-data','cbt-explanations'])vm.runInNewContext(fs.readFileSync('media/'+f+'.js','utf8'),{window});vm.runInNewContext(code,{window});return window;}
const w=context(src),bare=context(src.replace(" return line+(hints.length?' · '+hints.join(', '):'');"," return line;"));
function q(item){return {questionId:item.id,version:item.v,exam:item.exam,number:item.number,points:item.points,options:item.options,review:{status:'unanswered',correctNumber:item.answer,correctOptionId:item.options[item.answer-1].id,item,options:item.options}};}
const items={...w.HANQ_CBT_EXPLANATIONS.items,...w.HANQ_CBT_EXPLANATIONS_80.items};let covered=0,total=0,right=0;
for(const item of Object.values(items)){
 const input=q(item),before=JSON.stringify(input);assert(w.HanqCbtExplanations.resolve(input,'final'));
 const lines=w.HanqCbtRoundMaterials.choiceNotes(input),plain=bare.HanqCbtRoundMaterials.choiceNotes(input);
 lines.forEach((line,i)=>{total++;if(line===plain[i])return;covered++;right+=Number(item.options[i].correct);assert(line.startsWith(plain[i]+' · '));const hints=line.slice(plain[i].length+3).split(', ');assert(hints.length>=1&&hints.length<=3);for(const h of hints)assert(!plain[i].replace(/\s/g,'').includes(h.replace(/\s/g,'')));});assert.equal(JSON.stringify(input),before);
}
assert.equal(total,2750);assert.equal(covered,566);
function note(subject,clue='새 단서'){return w.HanqCbtRoundMaterials.choiceNotes({options:[{id:'x'}],review:{item:{options:[{id:'x',review:[clue+' — '+subject+': 설명']}]}}})[0];}
assert.equal(note('부여'),'새 단서 · 부여 · 사출도, 영고, 1책 12법');
assert.equal(note('고려 지눌'),'새 단서 · 고려 지눌 · 수선사 결사, 정혜쌍수, 돈오점수');
assert.equal(note('조선 광해군'),'새 단서 · 조선 광해군 · 중립외교, 기유약조, 경기 대동법');
assert.equal(note('제2차 갑오개혁'),'새 단서 · 제2차 갑오개혁 · 홍범 14조, 교육입국조서, 23부');
assert.equal(note('의열단'),'새 단서 · 의열단 · 김원봉, 조선 혁명 선언');
assert.equal(note('노태우 정부','남북 기본 합의서'),'남북 기본 합의서 · 노태우 정부 · 북방외교, 유엔 동시 가입');
for(const subject of ['이승만 정부 수립 전','최규하→전두환 정부 시기·신군부','고려 현종','성종','고려 숙종과 조선 숙종','알 수 없는 1980년 사건'])assert.equal(note(subject),'새 단서 · '+subject);
console.log('PASS actual resolver coverage '+covered+'/'+total+' ('+right+' correct/'+(covered-right)+' wrong), all hints bounded and deduplicated; no transition/name-substring inference.');
