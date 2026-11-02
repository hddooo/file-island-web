'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/round79-classification.json')));
if(data.round!==79||data.items.length!==50||new Set(data.items.map(x=>x.number)).size!==50||data.items.some(x=>x.number<1||x.number>50||!x.version||!x.verified))throw Error('Invalid reviewed classification');
fs.writeFileSync(path.join(root,'media/cbt-classification79.js'),'/* Generated from original-verified round79 classification; contains no answers or account records. */\nwindow.HANQ_CBT_CLASSIFICATION79='+JSON.stringify({...data,items:data.items.map(({number,questionId,version,era,part,verified})=>({number,questionId,version,era,part,verified,note:number===50?'여러 시대를 비교하는 복합 문항으로 정답 핵심을 기준으로 분류합니다.':''}))})+';\n');
console.log('79회 검수 분류 50문항');
