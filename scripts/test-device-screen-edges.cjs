'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),cs=require('css-tree');
const root=path.resolve(__dirname,'..'),css=fs.readFileSync(path.join(root,'media/device-shell.css'),'utf8');
cs.parse(css);
const start=css.indexOf('/* One continuous screen inside the hardware.');
assert(start>0,'screen fill rules documented and grouped');
const rules=[];cs.walk(cs.parse(css.slice(start)),{visit:'Rule',enter(rule){const declarations={};rule.block.children.forEach(d=>{if(d.type==='Declaration')declarations[d.property]={value:cs.generate(d.value),important:d.important};});rules.push({selector:cs.generate(rule.prelude),declarations});}});
const outer=rules.find(r=>r.declarations.overflow),header=rules.find(r=>r.declarations['border-radius']&&r.selector.includes('>.topline')),content=rules.find(r=>r.selector.endsWith('>.device-content')&&r.declarations.margin),scenes=rules.find(r=>r.selector.includes(':is(.archipelago-shell')&&r.declarations.padding);
for(const [rule,property,value] of [[outer,'padding','0'],[outer,'overflow','clip'],[header,'margin','0'],[header,'border','0'],[header,'box-shadow','none'],[content,'margin','0'],[content,'border','0'],[scenes,'padding','0']]){assert.equal(rule.declarations[property].value,value);assert(rule.declarations[property].important);}
assert(!content.declarations['overflow-y'],'native reader scrolling remains owned by existing styles');
assert(!content.declarations['border-radius'],'no extra rounded clip over corner controls');
assert(!outer.declarations.height&&!outer.declarations.width,'existing route viewport sizing preserved');
assert(header.declarations.padding.value.includes('env(safe-area-inset-top,0px)'),'safe-area top retained');
assert(css.slice(start).includes('env(safe-area-inset-left,0px)')&&css.slice(start).includes('env(safe-area-inset-right,0px)'),'safe-area sides retained');
assert.equal(header.declarations['border-radius'].value,'0','one hardware clip avoids mismatched nested header radii at every breakpoint');
assert(!outer.declarations['border-radius'],'existing hardware shape retained on every route');
let cases=0;
for(const company of [false,true])for(const practice of [false,true])for(const scene of ['overview','english','history','village','reading','account','hall','battle']){
 const host=scene==='overview'?'<section class="archipelago-home"><div class="world-map"></div></section>':scene==='english'||scene==='history'?'<section class="toeic-menu"><div class="subject-travel-map island-harbors"></div></section>':scene==='village'?'<section class="rainbow-game-host"></section>':'<article><h1>Fixture</h1><button>Native control</button></article>';
 const d=new JSDOM('<html data-hanq-theme="terminal"'+(company?' data-company-mode="on"':'')+'><body><main id="app" class="shell digivice-v2 '+(scene==='overview'?'archipelago-shell':'')+'"><header class="topline device-crown"></header><div class="device-content">'+host+(practice?'<section class="tc-study-active"></section>':'')+'</div></main></body></html>');
 const a=d.window.document.querySelector('#app'),h=a.querySelector('header'),c=a.querySelector('.device-content'),active=!company&&!practice;
 assert.equal(a.matches(outer.selector),active,'only normal framed route: '+[company,practice,scene]);assert.equal(h.matches(header.selector),active);assert.equal(c.matches(content.selector),active);assert.equal(c.matches(scenes.selector),active&&['overview','english','history','village'].includes(scene),'full bleed only for real scene hosts; reading spacing retained');
 const map=a.querySelector('.world-map,.island-harbors');if(map)assert.equal(map.matches(rules.find(r=>r.selector.includes(' .world-map')).selector),!company,'company map contract unchanged');
 cases++;d.window.close();
}
console.log('PASS CSS parsing and '+cases+' DOM scope combinations: all framed routes, company/Practice exclusions, edge alignment contracts, reading scroll/spacing, safe area and map art proportions unchanged. This is not rendered geometry QA.');
