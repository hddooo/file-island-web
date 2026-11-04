'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs');
const {JSDOM}=require('jsdom');
const reader=require('../media/joseon-script-reader.js');
const {convert}=require('./build-joseon-script.cjs');
const dom=new JSDOM('<div id="host"></div>',{url:'https://synthetic.invalid/#chapter/joseon/story'});
const doc=dom.window.document,host=doc.querySelector('#host');
doc.defaultView.HTMLElement.prototype.scrollIntoView=function(){};
const bundle={schema:'hanq-joseon-script/1',source:{sha256:'a'.repeat(64)},topics:[{id:'early',title:'합성 전기',from:59,to:64},{id:'late',title:'합성 후기',from:65,to:72}],figures:[],segments:[
  {id:'s1',kind:'study',page:60,markdown:'#### 합성 학습\n\n**강조** <strong>굵음</strong> <u>밑줄</u>\n\n| 구분 | 내용 |\n| --- | --- |\n| 상위 | 하위 |'},
  {id:'s2',kind:'practice',page:64,markdown:'#### 원문 퀴즈\n\n(1) 합성 빈칸 (　　　　　)\n(제도/왕)'},
  {id:'s3',kind:'answers',page:64,markdown:'#### 원문 인쇄 정답\n\nSECRET_SYNTHETIC_ANSWER'},
  {id:'s4',kind:'study',page:65,markdown:'#### 합성 후기\n\n후기 내용'}]};
let app=reader.mount(host,bundle);
assert(!host.textContent.includes('SECRET_SYNTHETIC_ANSWER'));
assert.equal(host.querySelectorAll('strong').length,2);assert.equal(host.querySelectorAll('u').length,1);
assert.equal(host.querySelectorAll('table th').length,2);
host.querySelector('[data-mode="practice"]').click();assert(host.textContent.includes('(제도/왕)'));assert(host.textContent.includes('(　　　　　)'));assert(!host.textContent.includes('SECRET_SYNTHETIC_ANSWER'));
host.querySelector('[data-mode="answers"]').click();assert(!host.textContent.includes('SECRET_SYNTHETIC_ANSWER'));host.querySelector('.jsr-reveal button').click();assert(host.textContent.includes('SECRET_SYNTHETIC_ANSWER'));
host.querySelector('[data-topic="late"]').click();assert(host.textContent.includes('후기 내용'));assert(!host.textContent.includes('SECRET_SYNTHETIC_ANSWER'));
host.querySelector('[data-mode="answers"]').click();assert(!host.textContent.includes('SECRET_SYNTHETIC_ANSWER'));
const attack=doc.createElement('div');reader.inline(doc,attack,'<script>alert(1)</script><span style="color:red" onclick="x()">bad</span><img src=x onerror=x()> [x](javascript:alert(1)) <span style="color:#ed7d31">안전</span>');
assert.equal(attack.querySelectorAll('script,img,a,[onclick]').length,0);assert.equal(attack.querySelector('[data-source-color]').dataset.sourceColor,'#ed7d31');
app.stop();assert.equal(host.children.length,0);app=reader.mount(host,bundle);assert(!host.textContent.includes('SECRET_SYNTHETIC_ANSWER'));app.stop();dom.window.close();
if(process.argv[2]) {
  const bytes=fs.readFileSync(process.argv[2]),b=convert(bytes);
  assert.equal(b.source.questions,172);assert.equal(b.figures.length,38);assert.equal(b.source.pages.length,29);
  assert.equal(b.segments.map(s=>s.markdown).join('\n'),bytes.toString('utf8').replace(/\r\n/g,'\n'));
  assert(b.segments.filter(s=>s.kind==='practice').some(s=>s.markdown.includes('(제도/왕)')));
  assert(!b.segments.filter(s=>s.kind==='study').some(s=>s.markdown.includes('원문 인쇄 정답')));
  assert.deepEqual(b.segments.filter(s=>s.kind==='answers').map(s=>s.page),[64,72,87]);
  console.log('Private source: lossless partition; 29 pages / 172 questions / 38 figures; answers isolated');
}
console.log('Joseon reader: rendering, answer concealment, multiline blank, repeat entry and injection guards passed');
