'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require(process.env.HANQ_JSDOM_PATH);
(async()=>{
 const dom=new JSDOM('<main id="feRoundMaterials"></main>',{runScripts:'outside-only',url:'https://review.test'}),w=dom.window,host=w.document.querySelector('main');
 w.URL.createObjectURL=()=> 'blob:fixture';w.URL.revokeObjectURL=()=>{};
 w.eval(fs.readFileSync('media/cbt-round-materials.js','utf8'));
 const run='10000000-0000-4000-8000-000000000001';
 const opts=[1,2,3,4,5].map(n=>({id:'choice'+n,number:n}));
 const make=(n,version)=>({questionId:'exam-72-'+n,version,exam:72,number:n,position:n-1,points:2,runId:run,
  starred:true,everWrong:false,selectedOptionId:null,options:opts,image:'/api/v1/cbt/runs/'+run+'/questions/'+(n-1)+'/image',
  common:null,review:{status:'unanswered',correctNumber:1,correctOptionId:'choice1'}});
 let items=[make(47,'c37aabe163a2bede'),make(48,'f2013ab3f0b2b180')];
 const api={state:()=>({signedIn:true,ownerId:'fixture',epoch:1}),cbt:async()=>({scope:'exam-starred-or-ever-wrong',round:72,items,hasMore:false,pendingStarCount:0,resetAt:null}),cbtImage:async()=>new Blob(['fixture'],{type:'image/webp'})};
 const tick=()=>new Promise(r=>setImmediate(r));
 const image=(width,height)=>{const im=host.querySelector('.fe-round-question-image img');assert(im);Object.defineProperties(im,{naturalWidth:{value:width},naturalHeight:{value:height}});im.onload();return im;};
 let ctl=w.HanqCbtRoundMaterials.mount(host,{api,round:72});await ctl.ready;await tick();
 const q47=image(657,632);assert.equal(q47.parentElement.style.aspectRatio,'657 / 273');assert.equal(q47.src,'blob:fixture');
 host.querySelector('.fe-round-practice-list-toggle').click();host.querySelectorAll('.fe-round-practice-grid button')[1].click();await tick();
 const q48=image(657,430);assert.equal(q48.parentElement.style.aspectRatio,'657 / 353');assert.equal(q48.src,'blob:fixture');
 ctl.stop();items=[make(48,'modified-source')];
 // A mismatched version must not use the hard boundary even at matching dimensions.
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 ctl=w.HanqCbtRoundMaterials.mount(host,{api,round:72});await ctl.ready;await tick();assert(!image(657,430).closest('.fe-round-question-clip'));
 ctl.stop();dom.window.close();console.log('PASS exact 72회47/48 review crop, zoom source unchanged, reject stale version');
})().catch(e=>{console.error(e);process.exitCode=1;});
