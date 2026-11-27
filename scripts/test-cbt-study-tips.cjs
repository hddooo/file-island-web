'use strict';
// 2차 보완 해설(지문 분석 + 핵심 요지 · 보기 분석 · Tip)이 해설 화면에 나오고, tips가 없는 예전 해설은 '결론' 그대로인지 확인한다.
const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
(async()=>{
const w=new JSDOM('<main></main>',{url:'https://synthetic.invalid/',runScripts:'outside-only'}).window;
w.eval(fs.readFileSync('media/cbt-explanations.js','utf8'));
const E=w.HanqCbtExplanations;assert.ok(E&&E.loadStudy&&E.studyFor&&E.render,'study explanation API');
const opt=(n,ans)=>({number:n,correct:n===ans,keyword:'보기 **키워드'+n+'** → 판정',memo:n===ans?'외울 말 **메모**':null});
const item=(id,exam,number,extra)=>Object.assign({id,exam,number,answer:2,passage:['지문 **단서** → 대상'],options:[1,2,3,4,5].map(n=>opt(n,2)),flow:'단원 **흐름** 한 줄',source:'교재 44쪽'},extra);
const items={80:[item('exam-80-12',80,12,{gist:'두 사건 **사이**에 있었던 일을 고르는 문제',tips:['**(가)~(나) 사이**: 만부교 사건 → **서희** 담판 → 2차 침입','→ 이 문제가 물은 것: **강동 6주**']})],79:[item('exam-79-12',79,12,{})]};
const api={cbt:(m,p)=>{const r=Number(p.split('/').pop());return Promise.resolve({items:items[r]||[]});}};
await E.loadStudy(api,[80,79]);
const q=(exam)=>({exam,number:12,position:0,questionId:'exam-'+exam+'-12',version:'v',selectedOptionId:'o1',options:[1,2,3,4,5].map(n=>({id:'o'+n,number:n})),review:{status:'wrong',correctNumber:2,correctOptionId:'o2',item:{},options:[]}});
const d=w.document.createElement('div');
d.innerHTML=E.render(q(80),null,'final');
assert.equal(d.querySelector('.fe-stem-analysis h4').textContent,'지문 분석');
assert.match(d.querySelector('.fe-study-gist').textContent,/핵심 요지\s*두 사건 사이에 있었던 일을 고르는 문제/);
assert.equal(d.querySelector('.fe-study-gist strong').textContent,'사이','gist keeps bold keywords');
assert.equal(d.querySelector('.fe-exp-conclusion h4').textContent,'Tip');
const tips=[...d.querySelectorAll('.fe-study-tips li')];assert.equal(tips.length,2);
assert.equal(tips[0].querySelectorAll('strong').length,2);assert.match(tips[1].textContent,/이 문제가 물은 것: 강동 6주/);
assert.match(d.querySelector('.fe-exp-answer').textContent,/정답 ②/);assert.match(d.querySelector('.fe-study-flow').textContent,/흐름\s*단원 흐름 한 줄/);
d.innerHTML=E.render(q(79),null,'final');
assert.equal(d.querySelector('.fe-exp-conclusion h4').textContent,'결론','older explanations without tips keep 결론');
assert.equal(d.querySelector('.fe-study-tips'),null);assert.equal(d.querySelector('.fe-study-gist'),null);
// The answer-sheet PDF prints the same parts.
const pdf=fs.readFileSync('media/cbt-wrong-pdf.js','utf8');
assert.ok(pdf.includes("'핵심 요지: '+studied.gist")&&pdf.includes("await textLine('Tip',8.5,true)"),'PDF answer sheet prints 핵심 요지 and Tip');
assert.ok(/function startColumns\(\)/.test(pdf)&&pdf.includes("else{startColumns();var shared")&&pdf.includes("'해설':'간결 해설',13,true);startColumns();"),'wrong-answer PDFs use the two-column exam layout');
assert.ok(pdf.includes("src.split('**')")&&pdf.includes("'#1555a0'"),'PDF keeps **keywords** as bold blue ink');
// The pixel font has only a 400 face and the app sets font-synthesis:none, so explanations must opt back into synthesized bold.
const css=fs.readFileSync('media/cbt-results.css','utf8');
assert.ok(/:is\(\.fe-study-explanation,\.fe-round-review-explanation,\.uig-note,\.uig-note-flows\) \*\{font-synthesis:weight\}/.test(css),'explanations synthesize bold');
assert.ok(css.includes('.fe-study-tips li,.fe-study-flow) strong')&&css.includes('color:#1555a0'),'keywords use the 시대별 학습 blue ink');
w.close();console.log('PASS 해설 2차 보완: 지문 분석 + 핵심 요지 · 보기 분석 · Tip (예전 해설은 결론 유지)');
})().catch(e=>{console.error(e);process.exit(1);});
