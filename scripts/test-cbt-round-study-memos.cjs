'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const code=fs.readFileSync('media/cbt-round-materials.js','utf8');
function context(mode,source=code){
 const window={};
 for(const module of ['cbt-explanation-data','cbt-explanation80-data','cbt-explanations',...(mode==='enhanced'?['cbt-round-study-memos-data']:[])])vm.runInNewContext(fs.readFileSync('media/'+module+'.js','utf8'),{window});
 vm.runInNewContext(source,{window});return window;
}
const enhanced=context('enhanced'),old=context('existing'),bare=context('bare',code.replace(" return line+(hints.length?' · '+hints.join(', '):'');"," return line;"));
const stats={};let total=0,unchanged=0,addedRight=0,addedWrong=0,memoTamperTest;
const book={...old.HANQ_CBT_EXPLANATIONS.items,...old.HANQ_CBT_EXPLANATIONS_80.items};
function request(item){return {questionId:item.id,version:item.v,exam:item.exam,number:item.number,points:item.points,options:item.options,review:{status:'unanswered',correctNumber:item.answer,correctOptionId:item.options[item.answer-1].id,item,options:item.options}};}
for(const item of Object.values(book)){
 const q=request(item),saved=JSON.stringify(q),a=enhanced.HanqCbtRoundMaterials.choiceNotes(q),b=old.HanqCbtRoundMaterials.choiceNotes(q),c=bare.HanqCbtRoundMaterials.choiceNotes(q);
 const row=stats[item.exam]||(stats[item.exam]={existing:0,newRight:0,newWrong:0});
 assert.equal(a.length,5);assert.equal(JSON.stringify(q),saved);
 for(let i=0;i<5;i++){
  total++;
  if(b[i]!==c[i]){row.existing++;unchanged++;assert.equal(a[i],b[i],'existing verified enrichment changed: '+item.options[i].id);}
  if(a[i]!==b[i]){
   const id=item.options[i].id,memo=enhanced.HANQ_CBT_ROUND_STUDY_MEMOS[id];
   assert.equal(a[i],memo[2],id);assert.equal(memo[0],item.v,id);assert(memo[3]>=1&&memo[3]<=3,id);
   if(item.options[i].correct){addedRight++;row.newRight++;}
   else{addedWrong++;row.newWrong++;}
   memoTamperTest||={q,i,id,memo,oldText:b[i]};
  }
 }
}
assert.equal(total,2750);assert.equal(unchanged,566);assert(addedRight>0&&addedWrong>0);
assert.equal(Object.keys(stats).length,11);
if(!process.argv.includes('--partial')){
 assert(Object.values(stats).every(x=>x.newRight+x.newWrong>0),'all rounds gain confirmed explanations');
 execFileSync(process.execPath,['scripts/build-cbt-round-study-memos.cjs','--check']);
}
const {q,i,id,memo,oldText}=memoTamperTest;
enhanced.HANQ_CBT_ROUND_STUDY_MEMOS[id]=['wrong-version',memo[1],memo[2],memo[3]];
assert.equal(enhanced.HanqCbtRoundMaterials.choiceNotes(q)[i],oldText);
enhanced.HANQ_CBT_ROUND_STUDY_MEMOS[id]=[memo[0],'wrong-source',memo[2],memo[3]];
assert.equal(enhanced.HanqCbtRoundMaterials.choiceNotes(q)[i],oldText);
console.log(JSON.stringify({total,existing:unchanged,addedRight,addedWrong,newCoverage:unchanged+addedRight+addedWrong,stats}));
