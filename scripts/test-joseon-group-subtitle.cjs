'use strict';
// Private source input stays outside the repository; never log its text or answers.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const input=process.argv[2];
if(!input)throw Error('Provide the private Joseon bundle JSON path');
const bytes=fs.readFileSync(input),bundle=JSON.parse(bytes),original=JSON.stringify(bundle);
const root=path.resolve(__dirname,'..'),reader=fs.readFileSync(path.join(root,'media/joseon-script-reader.js'),'utf8');
const css=fs.readFileSync(path.join(root,'media/joseon-script-reader.css'),'utf8');
const baseline=process.argv[3]?fs.readFileSync(process.argv[3],'utf8'):null;
function mount(code){
 const dom=new JSDOM('<!doctype html><style>'+css+'</style><div id="joseonScript"></div>',{url:'https://synthetic.invalid/',runScripts:'outside-only'}),w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=function(){};w.URL.revokeObjectURL=()=>{};
 w.eval(fs.readFileSync(path.join(root,'media/blank-recall.js'),'utf8'));w.eval(code);
 const host=w.document.querySelector('#joseonScript'),app=w.HanqJoseonScriptReader.mount(host,bundle);
 return {dom,w,host,app};
}
const after=mount(reader),before=baseline?mount(baseline):null;
const instances=[before,after].filter(Boolean);
function click(v,selector){const target=v.host.querySelector(selector);assert(target,selector);target.click();}
function normalizedBody(v){const body=v.host.querySelector('.jsr-body').cloneNode(true);for(const sub of body.querySelectorAll('.jsr-group-subtitle'))sub.textContent=sub.textContent.replace(/^\((.*)\)$/,'$1');return body.innerHTML;}
let views=0;const answerCounts=[];
for(let cycle=0;cycle<2;cycle++)for(const topic of bundle.topics){
 for(const v of instances)click(v,'[data-topic="'+topic.id+'"]');
 for(const mode of ['study','exam']){
  for(const v of instances)click(v,'[data-mode="'+mode+'"]');
  if(before)assert.equal(normalizedBody(after),normalizedBody(before),'unrelated DOM preserved');
  const sub=after.host.querySelector('.jsr-group-subtitle');
  if(topic.id==='society'&&mode==='study'){
   assert(sub);assert.equal(after.host.querySelectorAll('.jsr-group-subtitle').length,1);
   assert.equal(sub.textContent,'(평등으로 가는 시기)');assert.equal(sub.previousElementSibling.textContent,'조선후기 사회');
   assert.equal(sub.tagName,'SMALL');assert.equal(sub.dataset.layoutLabel,'true');
   const style=after.w.getComputedStyle(sub),heading=after.w.getComputedStyle(sub.previousElementSibling);
   assert.equal(style.display,'block');assert.equal(style.fontSize,'14px');assert.equal(style.fontWeight,'400');
   assert(parseFloat(style.fontSize)<parseFloat(heading.fontSize));
  }else assert.equal(sub,null,'other topics/modes have no new subtitle');
  views++;
 }
 const answers=[];
 for(const v of instances){click(v,'[data-mode="study"]');const recall=v.w.HanqBlankRecall.decorate(v.host.querySelector('.jsr-body'));recall.grade();answers.push([...v.host.querySelectorAll('.blank-recall-feedback')].map(n=>n.textContent));recall.stop();}
 if(before)assert.deepEqual(answers[0],answers[1],'recall answers preserved');
 if(!cycle)answerCounts.push({topic:topic.id,count:answers.at(-1).length});
}
for(const v of instances){v.app.stop();assert.equal(v.host.children.length,0);v.dom.window.close();}
assert.equal(JSON.stringify(bundle),original);assert.deepEqual(fs.readFileSync(input),bytes);
console.log(JSON.stringify({views,subtitle:'14px below 20px heading',parentheses:true,baselineDOMCompared:!!baseline,answerCounts,sourceUnchanged:true,stopClean:true}));
