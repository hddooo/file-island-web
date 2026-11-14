'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {studyCellMarkdown:filter}=require('../media/opening-script-reader.js');
const dir=process.env.OPENING_PRIVATE_SOURCE_DIR||'C:/Users/INNOGRID/local-dev/hanq-api-private/opening-script/history/opening/81-2026/255c37fb6812';
const bytes=fs.readFileSync(path.join(dir,'scirpt.md')),raw=fs.readFileSync(path.join(dir,'structure.json')),data=JSON.parse(raw),sha=crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(sha,'255c37fb68122a329cca00ae1c15035590b6a7b21f601e4a5b5f7515fdfbf695');assert.equal(data.sourceSha256,sha);
const target='- 친위대, 진위대 확대(친위대, 진위대 설치는 을미개혁 때 했음)';let checked=0,changed=0,eulmi=0;
for(const table of data.tables)for(const cell of table.cells){const markdown=(cell.ranges||[]).map(r=>{const b=bytes.subarray(r.start,r.end);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),r.sha256);return b.toString('utf8');}).join('\n'),candidate=Object.freeze({...cell,markdown});
 for(const mode of ['study','exam','practice','answers','recall']){const result=filter(sha,mode,table.id,candidate);checked++;if(result!==markdown){changed++;assert.equal(mode,'study');assert.equal(table.id,'table34');assert.equal(cell.id,'os-table34-5-body');assert.equal(result,markdown.split('\n').filter(l=>l!==target).join('\n'));assert(!result.includes(target));}else if(markdown.includes('친위대')&&markdown.includes('설치'))eulmi++;}
 assert.equal(filter('f'.repeat(64),'study',table.id,candidate),markdown,'new source version must remain unchanged');
}
assert.equal(changed,1);assert(eulmi>0);
const cell={id:'os-table34-5-body',sourceId:'대한제국(1897년) & 광무개혁',markdown:'before\n'+target+'\nafter'};
for(const changedCell of [{...cell,id:'other'},{...cell,sourceId:'other'},{...cell,markdown:cell.markdown.replace('확대','확장')},{...cell,markdown:target+'\n'+target}])assert.equal(filter(sha,'study','table34',changedCell),changedCell.markdown);
assert.equal(filter(sha,'study','other',cell),cell.markdown);
assert(fs.readFileSync(path.join(dir,'scirpt.md')).equals(bytes));assert(fs.readFileSync(path.join(dir,'structure.json')).equals(raw));
console.log(JSON.stringify({pass:true,cellModeChecks:checked,changedStudyCells:changed,questionModesUnchanged:true,unknownSourceUnchanged:true,nearMissesUnchanged:true,privateBytesUnchanged:true}));