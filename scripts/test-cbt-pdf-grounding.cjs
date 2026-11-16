'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),{JSDOM}=require(process.env.HANQ_JSDOM_PATH||'jsdom');
const d=new JSDOM('<main></main>',{runScripts:'outside-only'}),w=d.window,h=w.document.querySelector('main');
for(const name of ['cbt-explanation-data','cbt-explanation80-data','cbt-explanations'])w.eval(fs.readFileSync(require.resolve('../media/'+name+'.js'),'utf8'));
const qFor=x=>({questionId:x.id,version:x.v,exam:x.exam,number:x.number,points:x.points,position:x.number-1,
 options:x.options.map(({id,number})=>({id,number})),
 review:{status:'wrong',correctNumber:x.answer,correctOptionId:x.options[x.answer-1].id,item:x,options:x.options}});
const api=w.HanqCbtExplanations;
const all=Object.values(w.HANQ_CBT_EXPLANATIONS.items).concat(Object.values(w.HANQ_CBT_EXPLANATIONS_80.items));
const expectedBoard={70:'1000030012',71:'1000030032',72:'1000030043',73:'1000030052',74:'1000030069',75:'1000030080',76:'1000030098',77:'1000030110',78:'1000030119',79:'1000030131',80:'1000030154'};
assert.equal(all.length,550);
for(const item of all){
 const markup=api.render(qFor(item),null,'final');
 assert.match(markup,/data-reviewed="true"/);
 assert(markup.includes('https://www.historyexam.go.kr/pst/view.do?bbs=dat&amp;pst_sno='+expectedBoard[item.exam]));
 assert(markup.includes('제'+item.exam+'회 '+item.number+'번 · 공식 문제지'));
 assert.equal((markup.match(/class="fe-exp-option /g)||[]).length,5);
}
for(const [n,cue,reference] of [
 [1,/비파형 동검.*사유 재산·계급 발생/,/PDF 9–10쪽/],
 [2,/비교용.*단궁·과하마·반어피/,/PDF 12–13쪽/],
 [3,/한성 공격.*개로왕 전사/,/PDF 17, 19–20, 22–23쪽/],
 [4,/율령·태학·전진.*소수림왕/,/PDF 17, 19쪽/],
 [5,/사신도와 산수무늬 벽돌.*도교/,/PDF 18, 21쪽/],
 [6,/일심·화쟁.*원효.*대승기신론소/,/PDF 24, 32쪽/],
 [7,/조영.*대조영.*발해/,/PDF 35, 37쪽/],
 [8,/시무책 10여 조.*최치원/,/PDF 31–32, 34쪽/]
]){
 const item=all.find(x=>x.exam===70&&x.number===n),q=qFor(item);
 h.innerHTML=api.render(q,null,'final');
 assert.match(h.querySelector('.fe-exp-meaning').textContent,cue);
 const context=api.groundedOverview(api.resolve(q,'final'));
 assert.match(context.reason[0],cue);
 assert.notEqual(context.reason,item.overview.reason);
 assert.match(h.querySelector('.fe-exp-sources').textContent,reference);
 assert.equal(h.querySelector('.fe-exp-option.is-correct').dataset.optionId,q.review.correctOptionId);
 assert.equal(api.render(q,null,'active'),'');
 const incompatible=JSON.parse(JSON.stringify(q));incompatible.version='different';
 h.innerHTML=api.render(incompatible,null,'final');
 assert.equal(h.querySelector('.fe-exp-sources'),null);
 assert.equal(h.querySelector('[data-reviewed]').dataset.reviewed,'false');
}
console.log('550 exact-identity source links; first eight 70th questions grounded in current book; final-only gate passed');
w.close();
