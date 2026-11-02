'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../media/toeic-grammar-data.js'),'utf8'),{window});
const d=JSON.parse(JSON.stringify(window.HANQ_TOEIC_GRAMMAR_DATA));
assert.deepEqual(d.chapters.map(c=>c.id),['adjectives-adverbs','clauses-connectors','word-forms']);
assert.deepEqual(d.archivedChapters.map(c=>c.id),['pronouns']);
const all=[...d.chapters,...d.archivedChapters],byId=Object.fromEntries(all.map(c=>[c.id,c]));
const numberRows=byId.pronouns.quickRecallTables[0].rows;
for(const row of ['a number of + 복수명사 + 복수동사','the number of + 복수명사 + 단수동사'])assert(numberRows.some(r=>r[0]===row),row);
for(const c of all){
 assert(c.quickRecallTables.length,c.id+' recall tables retained');
 if(c.focusLessons){assert.equal(c.focusLessons.length,{'adjectives-adverbs':7,'word-forms':2,pronouns:4}[c.id],c.id+' focused lessons');for(const l of c.focusLessons)assert(l.concept&&l.en&&l.analysis&&l.remember);}
 for(const b of c.quickRecallTables){assert(b.rows.length);for(const r of b.rows){assert.equal(r.length,b.headers.length);assert(r.every(v=>typeof v==='string'&&v.length>0&&v.length<65));assert(!r.join(' ').includes('둘 다 가능'));}}
}
assert.equal(d.topicRedirects['pc-comparative'],'more-most');
assert.equal(d.routeAliases['more-most'],'adjectives-adverbs');
assert.equal(d.topicRedirects['cc-relative'],'pronouns');
assert.equal(d.routeAliases.pronouns,'adjectives-adverbs');
assert.deepEqual(byId['clauses-connectors'].quickRecallTables[0].headers,['접속사 + S + V','전치사 + 명사구']);
const adjectiveRows=byId['adjectives-adverbs'].quickRecallTables.flatMap(b=>b.rows);
for(const example of ['use resources more effectively','a more effective method','her most recent book','the most recently updated file'])assert(adjectiveRows.some(r=>r[0]===example),example+' transferred comparison recall');
const wordRows=byId['word-forms'].quickRecallTables[0].rows;
for(const [base,derived] of [['hard','hardly'],['high','highly'],['late','lately'],['near','nearly'],['close','closely'],['free','freely'],['wide','widely']])assert(wordRows.some(r=>r[0].startsWith(base+' ·')&&r[1].startsWith(derived+' ·')),base+' contrast');
const text=JSON.stringify(all.map(c=>c.quickRecallTables));for(const excluded of ['i/my/me/mine','unless','until','elderly'])assert(!text.includes(excluded));
console.log('PASS three active chapters + archived pronouns; transferred comparison; concise tables; number agreement and seven -ly contrasts');
