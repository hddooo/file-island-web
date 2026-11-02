'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/mixed-review-questions.json'))),eras=['ancient','goryeo','joseon','opening','colonial','modern'];
if(data.questions.length!==30||new Set(data.questions.map(x=>x.id)).size!==30)throw Error('Expected30 unique curated questions');
for(const e of eras)if(data.questions.filter(q=>q.era===e).length!==5)throw Error('Expected5 questions per era');
const questions=data.questions.map(q=>{
 if(!eras.includes(q.era)||!q.question||!q.explanation||q.options.length!==4||new Set(q.options.map(x=>x.text)).size!==4||q.options.filter(o=>o.sourceOption===q.correctSourceOption).length!==1)throw Error('Invalid curated question');
 const options=q.options.map((o,i)=>({id:q.id+'-choice-'+(i+1),text:o.text}));
 return {id:q.id,era:q.era,question:q.question,explanation:q.explanation,options,correctOptionId:options[q.options.findIndex(o=>o.sourceOption===q.correctSourceOption)].id};
});
fs.writeFileSync(path.join(root,'media/mixed-review-bank.js'),'/* Public conceptual practice only: own choice IDs, no CBT IDs, account records, API calls or growth rewards. */\nwindow.HANQ_MIXED_REVIEW_BANK='+JSON.stringify(questions)+';\n');
console.log('전체범위 개념 퀴즈30문항 · 시대별5문항 · 4지선다');
