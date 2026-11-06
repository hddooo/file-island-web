'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_PATH||'../.test-tools/node_modules/jsdom');
const root=path.resolve(__dirname,'..'),index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const start=index.indexOf('    function openAccount('),end=index.indexOf('    /* 서버 연결이 켜져 있을 때만:',start),source=index.slice(start,end);
assert(start>=0&&end>start);
for(const signedIn of [true,false]){
 const w=new JSDOM('<main id="app"></main>',{url:'https://synthetic.test/#account',runScripts:'outside-only'}).window;
 const noop=()=>{};Object.assign(w,{app:w.document.querySelector('#app'),HanqApi:{state:()=>({signedIn})},stopLearningResources:noop,clearAutoAdvance:noop,closeMockZoom:noop,rcStopTimer:noop,acNorm:v=>v,header:()=>'',bindHeaderParent:noop,home:noop,acHash:()=> '#account',scrollTo:noop,openWrongNotes:noop,finishLoginLanding:noop,studySummaryTargets:[],studyGoSummary:noop});
 let rendered=false;w.HanqAccountUI={render:(host,ctx)=>{rendered=true;assert.equal(ctx.view,'main');host.textContent='계정 관리 유지';}};
 w.eval(source);w.openAccount('main',true);const h=w.document.querySelector('.module-head h1');
 assert(rendered);assert(w.document.querySelector('#acRoot'));assert.equal(h.classList.contains('ac-sr'),signedIn);assert.equal(h.textContent,signedIn?'마이페이지':'파일섬 스터디');assert(!w.document.querySelector('.module-head').textContent.includes('내 계정'));
 assert(w.document.querySelector('#acBack'));assert(w.document.querySelector('#acHome'));w.close();
}
const display=fs.readFileSync(path.join(root,'media/display-mode.js'),'utf8');assert(display.includes("'#account','마이페이지'"));assert(!display.includes("'#account','MyPage'"));
console.log('PASS signed-in redundant title hidden accessibly, login heading and account actions retained, Korean My Page label');
