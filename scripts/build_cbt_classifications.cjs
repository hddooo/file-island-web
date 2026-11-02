'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const rounds={};
for(let round=70;round<=78;round++){
 const file=path.join(__dirname,`fixtures/round${round}-classification.json`);
 if(!fs.existsSync(file))continue;
 const data=JSON.parse(fs.readFileSync(file));
 if(data.round!==round||data.items.length!==50||new Set(data.items.map(x=>x.number)).size!==50||data.items.some(x=>x.number<1||x.number>50||!x.version||!x.questionId||!x.part||!['ancient','goryeo','joseon','opening','colonial','modern','unknown'].includes(x.era)))throw Error(`Invalid classification: ${round}`);
 rounds[round]={round,items:data.items.map(({number,questionId,version,era,part,verified,note})=>({number,questionId,version,era,part,verified,note:note?'복합 시대 또는 부정형 문항은 질문 대상과 검수된 핵심을 기준으로 분류합니다.':''}))};
}
fs.writeFileSync(path.join(root,'media/cbt-classifications.js'),'/* Original-verified classifications; no answers or account records. */\nwindow.HANQ_CBT_CLASSIFICATIONS='+JSON.stringify(rounds)+';\n');
console.log('검수 분류 회차: '+Object.keys(rounds).join(', '));
