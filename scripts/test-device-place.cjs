'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),tick=()=>new Promise(r=>setTimeout(r,15));
// jsdom history traversal is asynchronous. Wait for its real event rather than
// assuming the navigation queue finishes before a fixed 15ms timer on busy CI.
function navigate(w, action) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      w.removeEventListener('popstate', done);
      reject(Error('History traversal did not emit popstate'));
    }, 2000);
    function done() { clearTimeout(timer); resolve(); }
    w.addEventListener('popstate', done, { once: true });
    action();
  });
}
(async()=>{const d=new JSDOM('<style>:root{--device-shell-ready:1}</style><main id="app"><header class="topline"><button id="homeBrand">지도 돌아가기</button><button id="headerLogout">로그아웃</button></header><h1>fixture</h1></main>',{url:'https://fixture.test/#toeic/map',runScripts:'outside-only'}),w=d.window;w.eval(fs.readFileSync(path.join(__dirname,'../media/device-shell.js'),'utf8'));let checks=0;for(const [route,text]of [['#toeic/map','영어섬'],['#toeic/notebook','영어섬'],['#toeic-cbt','영어섬'],['#history','역사숲'],['#chapter/prehistory/quiz','역사숲'],['#wrongnotes','역사숲'],['#battle','얼음섬'],['#account','마이페이지'],['#hall-of-fame','명예의 전당'],['#subjects','']]){w.history.pushState({},'',route);w.dispatchEvent(new w.PopStateEvent('popstate'));await tick();const place=w.document.querySelector('.device-place');assert.equal(place.textContent,text,route);assert.equal(place.hidden,!text,route);assert.equal(w.document.querySelectorAll('.device-crown').length,1);assert(w.document.querySelector('#homeBrand')&&w.document.querySelector('#headerLogout'));checks+=4;}await navigate(w,()=>w.history.back());assert.equal(w.document.querySelector('.device-place').textContent,'명예의 전당');checks++;await navigate(w,()=>w.history.go(-3));assert.equal(w.document.querySelector('.device-place').textContent,'역사숲');checks++;w.history.pushState({},'','/inquiries/');w.dispatchEvent(new w.PopStateEvent('popstate'));await tick();assert.equal(w.document.querySelector('.device-place').textContent,'건의함');checks++;console.log('PASS '+checks+' assertions: island/device title, dedicated shared-route titles, back navigation, one hardware header, action controls preserved');d.window.close();})().catch(e=>{console.error(e);process.exitCode=1;});

