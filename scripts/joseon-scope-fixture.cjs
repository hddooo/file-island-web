'use strict';
// Content-free shape of the pinned current API projection. All prompts/answers are synthetic.
const {fixture}=require('./test-era-blank-manual-save.cjs');
const sizes=[26,50,15,13,14,18,36],version='6a9f82ac4e33bf69b9a83886aa999656deb7af094916e15ce404fb711388c7b1';
function effectiveModel(){
 const data=fixture(),template=data.items[0];data.id='joseon';data.version=version;data.source.scriptSha256='8d0944e32d86985a4af3dbf28085dba4bb3f65cc0d8379907e2e4693299003a1';
 data.subtopics=sizes.map((_,i)=>({id:'group-'+i,title:'Synthetic group '+i}));let order=0;
 data.items=sizes.flatMap((size,group)=>Array.from({length:size},(_,n)=>{const i=order++,item=JSON.parse(JSON.stringify(template).replaceAll('synthetic-0','synthetic-'+i));return {...item,order:order,originalNumber:n+1,subtopicId:'group-'+group};}));
 data.scriptResponseGroups=data.items.map(i=>({itemId:i.id,fieldId:'field-'+i.id,slotIds:[i.blanks[0].id]}));return data;
}
function metadata(data){return {id:data.id,version:data.version,source:{sha256:data.source.sha256,scriptSha256:data.source.scriptSha256},topics:data.subtopics.map(t=>t.id),groups:data.subtopics.map(t=>({id:t.id,numbers:data.items.filter(i=>i.subtopicId===t.id).map(i=>i.originalNumber).sort((a,b)=>a-b)}))};}
module.exports={effectiveModel,metadata};
