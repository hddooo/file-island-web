'use strict';
const assert=require('node:assert/strict');
// Synthetic unequal source strips catch WebKit's intrinsic-image-height fallback.
// Actual source pixels, caption associations and source review are separate checks.
module.exports=async function checkFigureSizing(page){
 const result=await page.evaluate(async()=>{
  const host=document.createElement('div');host.style.width='217px';document.querySelector('#privateTextbook').appendChild(host);
  const figures=[{id:'upper',assetId:'upper',type:'figure',bbox:[0,0,100,50]},{id:'lower',assetId:'lower',type:'figure',bbox:[0,50,100,150]}];
  const data={pdfPage:1,width:600,height:800,blocks:figures},group={assetIds:['upper','lower'],relationship:'vertical-contiguous-fragments-of-one-source-illustration',reviewStatus:'verified',sourceBBox:[0,0,100,150]};
  const before=JSON.stringify(data),c=HanqTextbookFigureGroups.render(host,data,group,{resolveFigure:f=>{
   const canvas=document.createElement('canvas');canvas.width=100;canvas.height=f.assetId==='upper'?50:100;const ctx=canvas.getContext('2d');ctx.fillStyle=f.assetId==='upper'?'red':'blue';ctx.fillRect(0,0,canvas.width,canvas.height);return new Promise(r=>canvas.toBlob(r));
  }});
  try{
   const ready=await c.ready;await Promise.all([...host.querySelectorAll('img')].map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const parts=[...host.querySelectorAll('.textbook-figure-group-part')].map(e=>{const a=e.getBoundingClientRect(),b=e.querySelector('img').getBoundingClientRect();return{part:{x:a.x,y:a.y,width:a.width,height:a.height},image:{x:b.x,y:b.y,width:b.width,height:b.height}};});
   return{supported:ready.supported,warnings:ready.warnings,parts,unchanged:JSON.stringify(data)===before};
  }finally{c.cleanup();host.remove();}
 });
 assert(result.supported&&result.unchanged);assert.deepEqual(result.warnings,[]);assert.equal(result.parts.length,2);
 for(const {part,image} of result.parts){assert(part.height>0);for(const key of ['x','y','width','height'])assert(Math.abs(part[key]-image[key])<1,'decoded source strip fills its exact rectangle: '+JSON.stringify({part,image}));}
 assert(Math.abs(result.parts[1].part.height/result.parts[0].part.height-2)<0.02,'unequal source-strip proportions are preserved');
 return result;
};
