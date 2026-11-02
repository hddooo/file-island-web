const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),cp=require('child_process');
function entries(source,notes=[]){const window={};vm.runInNewContext(fs.readFileSync('media/toeic-research-data.js','utf8'),{window});vm.runInNewContext(source,{window});return JSON.parse(JSON.stringify(window.HanqToeicSupplement.vocabularyEntries(notes)));}
const source=fs.readFileSync('media/toeic-supplement.js','utf8');
const previous=entries(cp.execFileSync('git',['show','32b91121de6d540bec459e91df472ebd0ef9d639:media/toeic-supplement.js'],{encoding:'utf8'}));
const all=entries(source),terms=['throughout','other than','notwithstanding','upon','severe','in the event of','of the following','rate','nevertheless','diminish','obvious'];
assert.deepEqual(all.filter(x=>!terms.includes(x.expression)),previous);
for(const term of terms){const matches=all.filter(x=>x.expression===term);assert.equal(matches.length,1,term);const item=matches[0];assert.equal(item.id,'supplement:'+encodeURIComponent(term));assert.equal(item.exampleKind,'authored_learning');assert(item.meaning&&item.example&&item.translation);assert(!('exampleSource' in item));assert.equal(entries(source,[{expression:term}]).filter(x=>x.expression===term).length,0);}
const scope={window:{}};vm.runInNewContext(fs.readFileSync('media/vocabulary-paraphrases.js','utf8'),scope);for(const term of terms){const p=scope.window.HanqVocabularyParaphrases.get({expression:term});assert(p&&p.items.length&&p.items.every(x=>x.expression&&x.meaning&&x.note),term);}
console.log(JSON.stringify({newCards:terms.length,oldCardsPreserved:previous.length,deduplication:true,accountWrites:0}));
