#!/usr/bin/env node
'use strict';
// Static scene-facing contracts. Browser rendering is verified separately.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const css=fs.readFileSync(process.env.HANQ_HISTORY_CSS||path.join(__dirname,'../media/history-evening.css'),'utf8');
const selector='html body #app .history-evening :is(.he-friend,.he-resident)';
const rules=[...css.matchAll(new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\{([^}]+)\\}','g'))].map(match=>match[1]);
assert.equal(rules.length,2,'One base rule and one reduced-motion rule');
for(const rule of rules){
 assert.match(rule,/transform:translate\(-50%,-90%\) scale\(var\(--he-s0\)\) scaleX\(var\(--he-facing,1\)\)/,'Resting figures retain their authored orientation');
}
assert.match(rules[1],/animation:none!important/,'Reduced motion still disables route travel');
assert.match(css,/@media\(max-width:700px\) and \(orientation:portrait\)\{\s*html body #app \.history-evening \.he-friend\{--he-facing:-1;/,'Portrait Agumon retains the existing inward-facing design');
assert.match(css,/\.history-evening\.he-paused :is\(\.he-friend,\.he-friend-sprite,\.he-resident/,'Pausing still covers each resident');
assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{html body #app \.history-evening \.he-koromon :is\(\.he-native,\.he-resident-shadow\)\{animation:none!important;transform:none!important;opacity:1\}\}/,'Reduced-motion Koromon remains grounded');
console.log('History resting facing: base/reduced-motion preserve authored direction, portrait Agumon faces inward, route pause and grounded Koromon remain intact.');
