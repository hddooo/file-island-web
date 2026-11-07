'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const line=html.split('\n').find(x=>x.includes('function readRoute()'));
assert(line,'actual index reader');
const context={URL,location:{href:'https://synthetic.invalid/',hash:''},chapterById:id=>['opening','goryeo','joseon','joseon-early','joseon-late','modern'].includes(id),stepSlugs:['webtoon','summary','quiz','mock','review','culture','bookquiz','exam-lines','source-quiz']};
vm.createContext(context);vm.runInContext(line,context);
function route(hash,query=''){context.location={href:'https://synthetic.invalid/'+query+hash,hash};return context.readRoute();}
for(const id of ['opening','goryeo','joseon','joseon-early','joseon-late']){assert.equal(route('#chapter/'+id+'/source-quiz').step,8);assert.equal(route('#chapter/'+id+'/source-quiz','?textbookSource=legacy'),null);}
assert.equal(route('#chapter/opening/webtoon').step,0);assert.equal(route('#chapter/opening/exam-lines').step,7);assert.equal(route('#chapter/modern/source-quiz'),null);assert.equal(route('#chapter/%E0%A4/source-quiz'),null);assert.equal(route('#chapter/opening/unknown'),null);
console.log('PASS Opening direct quiz/reload route, legacy/source boundaries and other-era routes');
