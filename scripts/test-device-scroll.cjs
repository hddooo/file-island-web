/* Minimal reproduction of the fixed document / scrolling device boundary. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const d=new JSDOM('<style>:root{--device-shell-ready:1}.device-content{overflow-y:auto;line-height:20px}</style><body class="study-global-footer"><main id="app"><header class="topline"><button id="headerAccount">My</button></header><p>Content</p></main></body>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://fixture.test/#hall-of-fame'}),w=d.window,doc=w.document;
w.eval(fs.readFileSync(path.join(__dirname,'../media/device-shell.js'),'utf8'));
const pane=doc.querySelector('.device-content'),header=doc.querySelector('.topline');let top=0,checks=0;
Object.defineProperties(pane,{clientHeight:{value:400},scrollHeight:{value:1600},scrollTop:{get:()=>top,set:v=>top=Math.max(0,Math.min(1200,v))}});
function wheel(target,options={},preempt=false){const e=new w.WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:60,...options});if(preempt)e.preventDefault();target.dispatchEvent(e);return e.defaultPrevented;}
function check(value,expected,label){assert.equal(value,expected,label);checks++;}
check(wheel(header),true,'unused header wheel consumed');check(top,60,'header reaches reading pane');
wheel(doc.body,{deltaY:2});check(top,62,'small trackpad delta');wheel(header,{deltaY:2,deltaMode:1});check(top,102,'line units');wheel(header,{deltaY:1,deltaMode:2});check(top,502,'page units');
for(const [target,opts,preempt] of [[pane,{}],[header,{ctrlKey:true}],[header,{metaKey:true}],[header,{shiftKey:true}],[header,{deltaX:90,deltaY:10}],[header,{},true]]){const before=top;wheel(target,opts,preempt);check(top,before,'native/zoom/horizontal/claimed input stays with owner');}
const modal=doc.createElement('aside');modal.setAttribute('aria-modal','true');modal.getClientRects=()=>[];doc.body.appendChild(modal);wheel(header);check(top,562,'hidden request-wait is not an active lock');modal.getClientRects=()=>[{}];wheel(header);check(top,562,'visible modal locks background');modal.remove();wheel(header);check(top,622,'modal close restores wheel');
doc.querySelector('#app').inert=true;wheel(header);check(top,622,'cinematic inert locks background');doc.querySelector('#app').inert=false;wheel(header);check(top,682,'cancel restores wheel');
const nested=doc.createElement('div');nested.style.overflowY='auto';Object.defineProperties(nested,{clientHeight:{value:100},scrollHeight:{value:200}});header.appendChild(nested);wheel(nested);check(top,682,'independent scroll surface retains input');nested.remove();
const select=doc.createElement('select');header.appendChild(select);wheel(select);check(top,682,'select retains input');select.remove();
pane.style.overflowY='hidden';wheel(header);check(top,682,'map viewport retains overflow contract');pane.style.overflowY='auto';pane.scrollTop=1200;check(wheel(header),false,'no wheel claimed at bottom boundary');
doc.body.classList.remove('study-global-footer');pane.scrollTop=0;wheel(header);check(top,0,'standalone document keeps native scroll');
setImmediate(()=>{w.close();console.log('PASS '+checks+' assertions: wheel units, hardware/background forwarding, nested inputs, boundaries, modal/cinematic/hidden-dialog guards');});

