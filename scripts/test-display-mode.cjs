'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('../.test-tools/node_modules/jsdom');
const source=fs.readFileSync(require('node:path').join(__dirname,'../media/display-mode.js'),'utf8');
let checks=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;},ok=(v,m)=>{assert.ok(v,m);checks++;};
function fixture(value,blocked){const d=new JSDOM('<meta name="theme-color" content="#f7f5f0"><main></main>',{url:'https://fixture.test',runScripts:'outside-only'}),w=d.window;
  if(value)w.localStorage.setItem('hanq:display-mode:v1',value);w.localStorage.setItem('existing-learning-record','preserve');
  if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('fixture storage blocked');}});
  w.eval(source);w.document.querySelector('main').innerHTML=w.HanqDisplayMode.html();return d;
}
for(const [stored,expected] of [[null,'default'],['invalid','default'],['terminal','terminal'],['default','default']]){
  const d=fixture(stored),w=d.window;eq(w.HanqDisplayMode.current(),expected);eq(w.document.documentElement.dataset.hanqTheme,expected);
  eq(w.document.querySelectorAll('[data-company-mode]').length,1,'one in-profile toggle');
  w.HanqDisplayMode.select('default');const button=w.document.querySelector('button');button.focus();button.click();
  eq(w.localStorage.getItem('hanq:display-mode:v1'),'terminal');eq(w.document.querySelector('meta').content,'#050706');eq(w.localStorage.getItem('existing-learning-record'),'preserve');
  eq(button.textContent,'블랙 모드 끄기');eq(button.getAttribute('aria-pressed'),'true');eq(w.document.activeElement,button,'toggle retains keyboard focus');
  w.dispatchEvent(new w.StorageEvent('storage',{key:'hanq:display-mode:v1',newValue:'default'}));eq(w.HanqDisplayMode.current(),'default');eq(w.document.querySelector('meta').content,'#f7f5f0');eq(button.textContent,'블랙 모드 켜기');w.close();
}
const d=fixture(null,true),w=d.window;eq(w.HanqDisplayMode.select('terminal'),false);eq(w.document.documentElement.dataset.hanqTheme,'terminal');ok(w.document.querySelector('[role=status]').textContent.includes('이번 화면'));w.close();
console.log(JSON.stringify({checks,failures:0,scope:'in-profile company mode, preference enum, blocked storage, non-secret persistence, unchanged records, keyboard focus, cross-tab display setting'}));
