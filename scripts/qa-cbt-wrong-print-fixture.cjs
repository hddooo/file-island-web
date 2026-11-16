// Synthetic-only standalone visual fixtures. No API/user data or network needed.
'use strict';
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const out=path.resolve(process.argv[2]||'../wrong-print-fixtures');fs.mkdirSync(out,{recursive:true});
for(const count of [21,500]){
 const dom=new JSDOM('',{runScripts:'outside-only'}),w=dom.window;w.eval(fs.readFileSync('media/cbt-wrong-print.js','utf8'));
 const items=[],pictures=new Map();
 function picture(label,ratio){const height=Math.round(600*ratio);const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${height}"><rect width="600" height="${height}" fill="white" stroke="#555"/><g font-family="sans-serif" fill="black" font-size="23"><text x="15" y="35">${label} · 한글 인쇄 검수용 가상 문항</text><text x="15" y="80">자료를 읽고 알맞은 것을 고르시오.</text><text x="20" y="130">한국사 · 고려 · 조선 · 독립운동</text><text x="20" y="180">① 첫 번째 보기</text><text x="20" y="220">② 두 번째 보기</text><text x="20" y="260">③ 세 번째 보기</text><text x="20" y="300">④ 네 번째 보기</text><text x="20" y="340">⑤ 다섯 번째 보기</text></g></svg>`;return{url:'data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'),ratio};}
 for(let i=0;i<count;i++){const exam=70+Math.floor(i/50),number=i%50+1,image=`synthetic-${exam}-${number}`,ratio=i%7===0?2.4:i%3===0?1.5:1.05;const q={exam,number,image,common:null,review:{correctNumber:i%5+1}};pictures.set(image,picture(`${exam}회 ${number}번`,ratio));if(i<2){q.common={image:'common',questionNumbers:[1,2]};pictures.set('common',picture('공통 자료',.65));}items.push(q);}
 w.HanqCbtWrongPrint.renderSheet(w.document,items,pictures);
 const script=w.document.createElement('script');script.textContent=`addEventListener('load',()=>{const pages=[...document.querySelectorAll('.wp-page')];const overflow=pages.map((p,i)=>({page:i+1,h:p.scrollHeight-p.clientHeight,w:p.scrollWidth-p.clientWidth})).filter(p=>p.h>2||p.w>2);document.title=JSON.stringify({questions:document.querySelectorAll('.wp-question').length,pages:pages.length,answerPages:document.querySelectorAll('.wp-answer-sheet').length,answers:document.querySelectorAll('.wp-answer-cell').length,overflow});});`;w.document.body.appendChild(script);
 fs.writeFileSync(path.join(out,`worksheet-${count}.html`),'<!doctype html>'+w.document.documentElement.outerHTML);console.log(JSON.stringify({count,questionPages:w.document.querySelectorAll('.wp-question-page').length,file:path.join(out,`worksheet-${count}.html`)}));dom.window.close();
}
