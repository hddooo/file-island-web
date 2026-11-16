'use strict';
const assert = require('node:assert/strict');
const { JSDOM } = require(process.env.JSDOM_PATH || '../.test-tools/node_modules/jsdom');
const reader = require('../media/textbook-semantic.js');
const SHA = 'd54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
const dom = new JSDOM('<main></main>');
const host = dom.window.document.querySelector('main');
const split = '유엔 총회 남북한 총선거 결정';
const official = 'UN 소총회: 남한 단독 총선거 결의(1948)';
let checks = 0;
const eq = (a,b) => { assert.equal(a,b); checks++; };
function makeCell(r, c, lists, extra = {}) {
  return {id:'synthetic-'+r+'-'+c,rowIndex:r,columnIndex:c,header:c===0,lines:lists.map((parts,i)=>({spans:parts.map((text,j)=>({text,bold:c===1,sourceCharIds:['synthetic-'+r+c+i+j]}))})),...extra};
}
function f(no, opts={}) {
  return {schemaVersion:'hanq-semantic/1',sourceSha256:opts.sha || SHA,pdfPage:no,blocks:[{
    id:'synthetic-table',type:'table',columnCount:2,layoutRole:opts.role,
    rows:[
      {cells:[makeCell(0,0,[[opts.label || (no===128?'전체 순서':'순서 ★')]]),
        makeCell(0,1,[['광복 → ㈀'],opts.duplicate ? ['→ ',split,' → ',split,' → 남북협상 & 제주 4·3 사건 → 총선거'] :
        ['→ ', '유엔 총', '회 남북한 총선', '거 결정', ' → 남북협상 & 제주 4·3 사건 → ', ...(no===128?['5·10 총선거']:['총','선거'])]])]},
      {cells:[makeCell(1,0,[['다른 행']]),makeCell(1,1,[[split,' → 총선거']])]}
    ]}]};
}
function render(page) {
  const before=JSON.stringify(page);
  reader.render(host,page);
  eq(JSON.stringify(page),before);
  eq(host.querySelectorAll('tbody tr').length,2);
  eq(host.querySelectorAll('tbody tr:first-child td').length,1);
  eq(host.querySelector('tbody tr:nth-child(2) td').textContent,split+' → 총선거');
  return host.querySelector('[data-source-cell="synthetic-0-1"]');
}
for(const [page,role] of [[127,undefined],[128,'source-exam-panel']]){
  const td=render(f(page,{role}));
  eq(td.textContent,'광복 → ㈀\n→ '+official+' → 남북협상 & 제주 4·3 사건 → 5·10 총선거');
  eq(td.querySelectorAll('.textbook-semantic-line').length,2);
  eq(Array.from(td.querySelectorAll('strong')).some(n=>n.textContent.includes(official)),true);
  eq(td.textContent.match(/5·10/g).length,1);
}
for(const page of [f(126),f(127,{sha:'b'.repeat(64)}),f(127,{label:'검토 순서'}),f(128,{duplicate:true})]) {
  const td=render(page), original=page.blocks[0].rows[0].cells[1].lines.map(l=>l.spans.map(s=>s.text).join('')).join('\n');
  eq(td.textContent,original);
}
console.log(JSON.stringify({checks,failures:0,scope:'Two source-bound presentation-only corrections, synthetic DOM'}));
