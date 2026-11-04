'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),{JSDOM}=require('jsdom');
const reader=require('../media/joseon-script-reader.js'),{convert}=require('./build-joseon-script.cjs');
const sha='8d0944e32d86985a4af3dbf28085dba4bb3f65cc0d8379907e2e4693299003a1';
const bytes=fs.readFileSync(process.argv[2]),bundle=convert(bytes),before=JSON.stringify(bundle);
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),sha);
assert.equal(bundle.segments.map(s=>s.markdown).join('\n'),bytes.toString('utf8').replace(/\r\n/g,'\n'));
const drops=[93,165,247,394,430,504,514,534,560,609,920,988,1015,1084,1111,1139,1216,1296,1345,1377,1386,1411,1432,1455,1457,1484,1570,1698,1783,1791,1836,1845,1864,2216];
const edits=[67,73,78,81,82,88,102,116,118,119,120,179,485,495,499,556,1107,1109,1110,1534,1572,1578,1585,1591,1595,1601,1607,1612,1618,1781,1876,1878,1879,1880,1881,1882,1883,1884,1885,1886,1887,1888,2218,2238,2256,2275,2298];
let figures=0,questions=0,answers=0,figureNotes=0,dropCount=0,editCount=0;
const editedOutput=[],sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
for(const s of bundle.segments.filter(s=>s.kind!=='metadata')){
 const output=reader.readingMarkdown(s,sha).split('\n'),source=s.markdown.split('\n');assert.equal(output.length,source.length);
 assert.equal(reader.readingMarkdown(s,'a'.repeat(64)),s.markdown); // another source never inherits positional exclusions
 source.forEach((line,i)=>{
  const number=s.startLine+i,result=output[i];
  if(drops.includes(number)){assert.equal(result,'');dropCount++;}
  else if(edits.includes(number)){assert.notEqual(result,line);editedOutput.push([number,result]);editCount++;}
  else if(/^#### 원문 퀴즈(?: · .*|)$/.test(line))assert.equal(result,line.replace('원문 퀴즈','빈칸 문제'));
  else if(/^#### 원문 인쇄 정답(?: · 〈정답〉|)$/.test(line))assert.equal(result,'#### 교재 정답');
  else if(((s.kind==='answers'&&[64,72].includes(s.page))||(number>=1620&&number<=1630))&&/^\|/.test(line)){
   const content=line.split('|')[3].trim();assert.equal(result,'| '+(content==='번호 · 인쇄 정답'?'번호 · 교재 정답':content)+' |');
  }
  else if(s.kind==='answers'&&s.page===87&&line==='| 원문 번호 | 인쇄 답안 |')assert.equal(result,'| 번호 | 교재 정답 |');
  else if([75,487].includes(number))assert.equal(result,'| 왕 | 업적 |');
  else if(number===181)assert.equal(result,'| 방향 | 관계 |');
  else if(/^\*PDF \d+쪽\(인쇄 \d+쪽\),/.test(line)){assert.equal(result,'');figureNotes++;}
  else if(/^### PDF \d+쪽$|^원문 (머리말:|바닥글:|인쇄 쪽수(?::| ))/.test(line))assert.equal(result,'');
  else assert.equal(result,line,'Unaudited content changed at '+number);
  if(/^!\[/.test(line)){assert.equal(result,line);figures++;}
  if(s.kind==='practice'&&/^\(\d+\) /.test(line)){assert.equal(result,line);questions++;}
  if(s.kind==='answers'&&/^\|.*\(\d+\)/.test(line)){if(s.page===87)assert.equal(result,line);answers++;}
 });
}
assert.equal(figures,38);assert.equal(questions,172);assert.equal(answers,172);assert.equal(figureNotes,38);assert.equal(dropCount,drops.length);assert.equal(editCount,edits.length);
// Exact snapshot of all 47 audited outputs, without publishing private source excerpts.
assert.equal(sha256(JSON.stringify(editedOutput)),'0a9f9302690f1533de221b49736d3d4087c8426f66757f0316fdf956429c4273');
const dom=new JSDOM('<main></main>',{url:'https://synthetic.invalid/'}),host=dom.window.document.querySelector('main');dom.window.URL.revokeObjectURL=()=>{};
function answerText(container,id,source){if(!source)return [...container.querySelectorAll('.jsr-answer-item')].map(item=>{const match=/^\((\d+)\)\s*([\s\S]*)$/.exec(item.textContent);assert(match);assert.equal(item.value,Number(match[1]));return [id,match[1],match[2]];});return [...container.querySelectorAll('tr')].flatMap(row=>{
 const cells=[...row.querySelectorAll('td')].map(td=>td.textContent.trim());if(!cells.length)return [];
 const text=source&&cells.length===3?cells[2]:cells.join(' '),match=/^\((\d+)\)\s*([\s\S]*)$/.exec(text);
 return match?[[id,match[1],match[2]]]:[];
});}
function questionText(container,id){return [...container.querySelectorAll('p')].filter(p=>/^\(\d+\) /.test(p.textContent)).map(p=>[id,p.textContent]);}
const expectedAnswers=[],expectedQuestions=[];
for(const s of bundle.segments.filter(s=>['answers','practice'].includes(s.kind))){const raw=dom.window.document.createElement('article');reader.renderMarkdown(dom.window.document,raw,s.markdown,()=>{});if(s.kind==='answers')expectedAnswers.push(...answerText(raw,s.id,true));else expectedQuestions.push(...questionText(raw,s.id));}
assert.equal(expectedAnswers.length,172);assert.equal(expectedQuestions.length,172);
const app=reader.mount(host,bundle);let views=0;
const banned=/원문 행|원문 열|원문 번호|원문 퀴즈|원문 인쇄 정답|원문 순서|원문 업적|원문 화살표|원문 배치 좌표|별도 패널|패널에 분리|역사적 정오|교정한 채점표|원문 힌트를 유지|어미를 원문 그대로|전사 한계|표 머리:|병합 셀|위 행 \d|도판.*배치|원문 회색 칸|원문 회색 왕명|원문 머리말|원문 바닥글|원문 인쇄 쪽수|아래에서는|범위와 확인 상태/;
for(const topic of bundle.topics){host.querySelector('[data-topic="'+topic.id+'"]').click();for(const mode of ['study','practice','answers']){
 host.querySelector('[data-mode="'+mode+'"]').click();if(mode==='answers'){assert.equal(host.querySelector('.jsr-body>h2').textContent,'조선 교재 정답');assert.equal(host.querySelector('.jsr-reveal button').textContent,'교재 정답 펼치기');assert.equal(host.querySelector('[data-mode="answers"]').textContent,'교재 정답');assert.equal(host.querySelector('.jsr-reveal p').textContent,'교재 정답입니다. 먼저 문제를 풀어 본 뒤 확인하세요.');host.querySelector('.jsr-reveal button').click();}
 assert(!banned.test(host.querySelector('.jsr-body').textContent),topic.id+'/'+mode+': '+host.querySelector('.jsr-body').textContent.match(banned)?.[0].slice(0,140));assert.equal(host.querySelectorAll('.jsr-provenance').length,0);
 const display=host.textContent+' '+[...host.querySelectorAll('[aria-label],[aria-description],[title]')].flatMap(e=>['aria-label','aria-description','title'].map(a=>e.getAttribute(a)||'')).join(' ');
 assert(!/PDF|인쇄 \d+쪽|원문 비교표/.test(display),topic.id+'/'+mode+' generated display metadata');
 assert.equal(host.querySelectorAll('.jsr-source-label,.jsr-row-source').length,0);
 assert([...host.querySelectorAll('figcaption')].every(c=>!/ · PDF \d+쪽$/.test(c.textContent)));
 if(mode==='practice'){assert.equal(host.querySelectorAll('textarea').length,172);assert.deepEqual([...host.querySelectorAll('.jsr-source-card')].flatMap(a=>questionText(a,a.id)),expectedQuestions);}
 if(mode==='answers'){assert.deepEqual([...host.querySelectorAll('.jsr-source-card')].flatMap(a=>answerText(a,a.id,false)),expectedAnswers);assert.equal(host.querySelectorAll('.jsr-answer-list').length,7);assert.equal(host.querySelectorAll('.jsr-body table,.jsr-body [role="region"]').length,0);}
 if(mode==='study'&&topic.id==='late'){assert(host.textContent.includes('세도정치: 순조·헌종·철종'));assert(host.querySelector('[data-source-color="#9b9ba8"]'));}
 views++;
}}
app.stop();dom.window.close();assert.equal(JSON.stringify(bundle),before);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(process.argv[2])).digest('hex'),sha);
if(process.argv[3])assert.equal(sha256(fs.readFileSync(process.argv[3])),'32a33b006d1c4b113dcc2e9df23a81e14b7b07ce2afe7400eafdde9f8750386b');
console.log(JSON.stringify({views,figures,questions,answers,figureNotes,dropCount,editCount,editorialResidual:0,renderedAnswersExact:true,renderedQuestionsExact:true,editedOutputsExact:47,sourceLossless:true,sourceUnchanged:true}));
