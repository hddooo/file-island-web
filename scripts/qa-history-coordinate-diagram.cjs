'use strict';
const assert=require('node:assert/strict'),{fixture}=require('./test-history-coordinate-diagram.cjs');
module.exports=async function checkCoordinateDiagram(page){
 const data=fixture();data.blocks[0].rows[0].cells[0].lines[0].spans[0].text='Root';data.blocks[0].rows[0].cells[1].lines[0].spans[0].text='Child';
 const result=await page.evaluate(async data=>{
  const host=document.querySelector('#privateTextbook'),c=HanqTextbookSemantic.render(host,data);try{const ready=await c.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const region=host.querySelector('.textbook-coordinate-diagram'),canvas=region.querySelector('.textbook-coordinate-diagram-canvas'),b=canvas.getBoundingClientRect();return{warnings:ready.warnings,overflow:document.documentElement.scrollWidth>innerWidth+1,nodes:[...region.querySelectorAll('.textbook-coordinate-diagram-label')].map(n=>{const a=n.getBoundingClientRect();return{text:n.textContent,font:parseFloat(getComputedStyle(n).fontSize),inside:a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1};}),arrows:region.querySelectorAll('polyline[marker-end]').length,highlight:getComputedStyle(region.querySelector('.textbook-coordinate-diagram-highlight')).backgroundColor,focusable:region.tabIndex===0,description:region.getAttribute('aria-description')};}finally{c.cleanup();}
 },data);
 assert(!result.overflow&&result.focusable&&result.description);assert.deepEqual(result.warnings,[]);assert.equal(result.arrows,1);assert.equal(result.highlight,'rgb(255, 208, 82)');assert.deepEqual(result.nodes.map(n=>n.text),['Root','Child']);assert(result.nodes.every(n=>n.inside&&n.font>=16),JSON.stringify(result));return result;
};
