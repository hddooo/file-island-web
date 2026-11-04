'use strict';
// Source stays outside the public tree. This adapter never changes canonical quizzes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const topics = [
  ['early', '조선 전기', 59, 64], ['late', '조선 후기', 65, 72],
  ['society', '정치·사회', 73, 78], ['economy', '경제', 74, 78],
  ['culture', '문화', 79, 87]
];
function convert(bytes) {
  const original = bytes.toString('utf8');
  const lines = original.replace(/\r\n/g, '\n').split('\n');
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const segments = []; let page = null, kind = 'metadata', start = 0;
  function flush(end) {
    if (end > start) segments.push({ id: `script-${sha256.slice(0,12)}-L${start+1}`, page, kind,
      startLine: start+1, endLine: end, markdown: lines.slice(start,end).join('\n') });
    start = end;
  }
  lines.forEach((line, i) => {
    const p = /^### PDF (\d+)쪽\s*$/.exec(line);
    if (p) { flush(i); page = Number(p[1]); kind = 'study'; }
    else if (/^## /.test(line)) { flush(i); page = null; kind = 'metadata'; }
    else if (/^#### 원문 (퀴즈|인쇄 정답)/.test(line)) {
      flush(i); kind = line.includes('인쇄 정답') ? 'answers' : 'practice';
    }
  });
  flush(lines.length);
  // A quiz-only page's imprint is provenance, not an empty study card.
  segments.forEach(s=>{if(s.kind==='study'&&!s.markdown.split('\n').some(line=>line.trim()&&!/^### PDF \d+쪽|^원문 (머리말|인쇄 쪽수|바닥글):/.test(line)))s.kind='metadata';});
  const pages = [...new Set(segments.filter(s=>s.page!==null).map(s=>s.page))];
  if (pages.length!==29 || pages.some((p,i)=>p!==59+i)) throw Error('Expected complete PDF 59–87 source');
  const figures = [...new Set([...original.matchAll(/!\[[^\]]*\]\((p\d{3}-\d{2}\.png)\)/g)].map(m=>m[1]))];
  const questions = segments.filter(s=>s.kind==='practice').reduce((n,s)=>n+[...s.markdown.matchAll(/^\(\d+\) /gm)].length,0);
  if (questions!==172 || figures.length!==38) throw Error(`Source coverage mismatch: ${questions} questions / ${figures.length} figures`);
  if (segments.map(s=>s.markdown).join('\n')!==lines.join('\n')) throw Error('Lossy source partition');
  return { schema:'hanq-joseon-script/1', source:{sha256,bytes:bytes.length,pages,questions,
    assetKeyPrefix:`history/joseon/81-2026/${sha256.slice(0,12)}/`,
    access:'authenticated-private-only', canonicalQuizMapping:'not-established'},
    topics:topics.map(([id,title,from,to])=>({id,title,from,to})), figures, segments };
}
if (require.main===module) {
  const [input,out,imageDirectory] = process.argv.slice(2);
  if (!input || !out) throw Error('Usage: node scripts/build-joseon-script.cjs PRIVATE_INPUT PRIVATE_OUTPUT');
  const root=path.resolve(__dirname,'..'), target=path.resolve(out);
  if (target===root || target.startsWith(root+path.sep) && !target.startsWith(path.join(root,'private-data')+path.sep)) throw Error('Output must be outside repo or inside ignored private-data');
  if(fs.existsSync(target)) throw Error('Refusing to overwrite existing source output');
  const result=convert(fs.readFileSync(input));
  if(imageDirectory)result.figureManifest=result.figures.map(name=>{
    const bytes=fs.readFileSync(path.join(imageDirectory,name));
    if(bytes.length<24||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Invalid PNG: '+name);
    return {name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),assetKey:result.source.assetKeyPrefix+name};
  });
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({sha256:result.source.sha256,pages:result.source.pages.length,questions:result.source.questions,figures:result.figures.length}));
}
module.exports={convert};
