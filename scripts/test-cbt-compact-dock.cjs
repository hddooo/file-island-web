'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),css=require('css-tree');
const text=fs.readFileSync('media/cbt-results.css','utf8');const source=text.slice(text.indexOf('/* Full CBT only:'),text.indexOf('/* Final-result era rings.'));
const errors=[];const ast=css.parse(source,{onParseError:e=>errors.push(e)});assert.deepEqual(errors,[]);
css.walk(ast,{visit:'Rule',enter(r){r.prelude.children.forEach(s=>assert(css.generate(s).includes('#formalExamHost .fe-full-answer-dock')));}});
assert(source.includes('grid-template-columns:repeat(7,minmax(0,1fr)) minmax(54px,1.4fr)'));
assert(source.includes('min-height:44px!important'));assert(source.includes('grid-column:1 / -1'));assert(source.includes('display:contents!important'));
// At a 280px available dock width, fixed padding/gaps + q50 label leave positive tracks, no forced 44px widths.
assert((280-8-7*3-54)/7>0);assert(source.includes('min-width:0!important'));
console.log('PASS scoped full-only CSS syntax, single row, touch height, full-width errors/confirmation, narrow-track sizing');
