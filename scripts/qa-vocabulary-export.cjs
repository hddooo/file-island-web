/* Internal content whitelist regression; the temporary export UI has been retired. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,'../deliverables/vocabulary-export');fs.mkdirSync(out,{recursive:true});
const isolated={};vm.runInNewContext(fs.readFileSync(path.join(root,'media/toeic-notes.js'),'utf8'),isolated);
const make=(id,word)=>({id,expression:word,part:'2',partOfSpeech:'명사',meaning:'합성 뜻',example:'The office needs new wallpaper.',translation:'사무실에 새 벽지가 필요하다.',sourceReference:'fixture Part2 Q7',sourceText:'Synthetic source only',revision:2,synonyms:['synthetic-related'],ownerId:'PRIVATE-OWNER',accessToken:'PRIVATE-TOKEN',email:'PRIVATE-EMAIL',studyHistory:{selected:2},checks:true});
const notes=Array.from({length:127},(_,i)=>make('export-'+String(i+1).padStart(3,'0'),'exportword'+String(i+1).padStart(3,'0'))),archived=[make('export-archived','archived-example')];
const before=JSON.stringify(notes),data=JSON.parse(JSON.stringify(isolated.HanqToeicNotes.contentExport(notes,[make('supplement-1','supplement')],archived)));
assert.deepEqual(data.counts,{notes:127,supplemental:1,archived:1});assert.equal(data.notes[126].id,'export-127');assert.equal(data.notes[0].part,'2');assert.equal(data.notes[0].sourceReference,'fixture Part2 Q7');assert(!JSON.stringify(data).includes('PRIVATE-'));assert(!('studyHistory' in data.notes[0]));assert(!('checks' in data.notes[0]));assert.equal(JSON.stringify(notes),before);

assert(!fs.readFileSync(path.join(root,'media/toeic-notes.js'),'utf8').includes("btn('단어 목록 내보내기'"));
console.log('PASS internal content whitelist; export control removed from the learning UI');
