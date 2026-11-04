'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('../.test-tools/node_modules/jsdom'),{fixture}=require('./test-source-quiz-prompt-styles.cjs');
async function run(){
 const dom=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://synthetic.invalid'}),w=dom.window,host=w.document.querySelector('main');w.HTMLElement.prototype.scrollIntoView=function(){};w.eval(fs.readFileSync(path.join(__dirname,'../media/textbook-source-quiz.js'),'utf8'));
 let checks=0;function eq(a,b){assert.deepEqual(a,b);checks++;}
 async function render(data){const before=JSON.stringify(data),controller=w.HanqTextbookSourceQuiz.render(host,data,{loadProgress:async()=>({version:'synthetic-version',revision:0,workspace:{cursor:0,status:'active',responses:{}}}),saveProgress:async()=>{throw Error('Unexpected write');}});await controller.ready;eq(JSON.stringify(data),before);return controller;}
 const data=fixture();data.subtopics[0].title='합성 범위 안내\n원래 기호 유지 <img src=x>';
 let c=await render(data),heading=host.querySelector('.textbook-source-quiz-instruction'),input=host.querySelector('input');eq(heading.textContent,data.subtopics[0].title);eq(host.querySelectorAll('.textbook-source-quiz-instruction').length,1);eq(host.querySelectorAll('img').length,0);assert(input.getAttribute('aria-describedby').split(' ').includes(heading.id));checks++;assert(heading.nextElementSibling.matches('[data-source-item-id]'));checks++;c.cleanup();
 const empty=fixture();empty.subtopics[0].title='';c=await render(empty);eq(host.querySelectorAll('.textbook-source-quiz-instruction').length,0);eq(host.querySelectorAll('[data-source-item-id]').length,1);c.cleanup();
 const repeated=fixture();delete repeated.sourcePromptStyles;const base=repeated.items[0];repeated.subtopics=[{id:'one',title:'합성 첫 지시문'},{id:'two',title:'합성 두 번째 지시문'}];repeated.items=[0,1,2,3].map((n)=>{const item=JSON.parse(JSON.stringify(base));item.id='item-'+n;item.order=n+1;item.originalNumber=n+1;item.subtopicId=n<2?'one':n===2?'two':'one';return item;});
 c=await render(repeated);eq([...host.querySelectorAll('.textbook-source-quiz-instruction')].map(n=>n.textContent),['합성 첫 지시문','합성 두 번째 지시문','합성 첫 지시문']);eq(host.querySelectorAll('input').length,4);eq(new Set([...host.querySelectorAll('.textbook-source-quiz-instruction')].map(n=>n.id)).size,3);c.cleanup();dom.window.close();console.log(JSON.stringify({checks,passed:true,scope:'synthetic optional source subtopic instructions, exact text, safe DOM, contiguous order, accessible inputs, unchanged source and no writes'}));
}
if(require.main===module)run().catch(e=>{console.error(e.stack);process.exitCode=1});module.exports={run};
