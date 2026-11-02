const fs=require('fs'),vm=require('vm'),cp=require('child_process'),assert=require('assert/strict');
const w={window:{}};vm.runInNewContext(fs.readFileSync('media/toeic-grammar-data.js','utf8'),w);vm.runInNewContext(fs.readFileSync('media/toeic-grammar.js','utf8'),w);
const core=JSON.parse(JSON.stringify(w.window.HanqConnectorSummary.model));
assert.equal(core.comparison.length,3);assert.deepEqual(core.evidence.map(e=>e.id),['test1-113','test1-114','test1-119','test2-127','test2-146']);
assert(core.evidence[3].source.includes('뜻의 공백'));assert(core.evidence[4].source.includes('뜻의 공백'));assert(core.evidence[4].why.includes('접속부사가 아닙니다'));
const file='media/weakness-banks/focus-connectors-v4-100.json',before=JSON.parse(cp.execFileSync('git',['show','b3ff575:'+file],{encoding:'utf8'})),after=JSON.parse(fs.readFileSync(file));
const changed=[];after.questions.forEach((q,i)=>{const prev=before.questions[i];for(const key of ['id','number','version','stem','choices','answer','translation','tags','source','clues'])assert.deepEqual(q[key],prev[key],q.number+' '+key);q.optionDetails.forEach((d,j)=>{for(const key of Object.keys(d).filter(k=>k!=='reason'))assert.deepEqual(d[key],prev.optionDetails[j][key]);if(d.reason!==prev.optionDetails[j].reason){changed.push(q.number);assert.equal(q.choices[j],'However');}});});assert.deepEqual(changed,[4,18,92]);
const data=w.window.HANQ_WEAKNESS_LEARNING;assert.equal(data.chapters.length,3);assert.equal(data.chapters[1].bankId,'focus-connectors-v4-100');
console.log('PASS concepts/provenance; only 3 option explanations changed; IDs/answers/versions/stems preserved');
