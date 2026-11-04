'use strict';
// Consumer-local immutable extraction. Never changes canonical quizzes or raw bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const SOURCE='245d166b2a252293903f87654028a648772f8c78dbb8ade09c86a21a223bb5a9';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function convert(bytes){
  if(bytes.length!==60806||hash(bytes)!==SOURCE)throw Error('Unreviewed Goryeo source bytes');
  const lines=bytes.toString('utf8').replace(/\r\n/g,'\n').split('\n');
  const segments=[];let page=null,kind='metadata',start=0;
  function flush(end){if(end>start)segments.push({id:`script-${SOURCE.slice(0,12)}-L${start+1}`,page,kind,startLine:start+1,endLine:end,markdown:lines.slice(start,end).join('\n')});start=end;}
  lines.forEach((line,i)=>{
    const p=/^### PDF (\d+)쪽\s*$/.exec(line);
    if(p){flush(i);page=Number(p[1]);kind=[49,50,51,57,58].includes(page)?'practice':page===52?'metadata':'study';}
    else if(/^## /.test(line)){flush(i);page=null;kind='metadata';}
    else if(/^#### (?:인쇄 답안 — 〈정답〉|〈정답〉 · 원문 인쇄 답안)$/.test(line)){flush(i);kind='answers';}
  });flush(lines.length);
  const pages=[...new Set(segments.filter(s=>s.page!==null).map(s=>s.page))];
  const questions=segments.filter(s=>s.kind==='practice').reduce((n,s)=>n+[...s.markdown.matchAll(/^\(\d+\) /gm)].length,0);
  const answers=segments.filter(s=>s.kind==='answers').reduce((n,s)=>n+[...s.markdown.matchAll(/^(?:\| |\- )\(\d+\)/gm)].length,0);
  const figures=[...new Set([...bytes.toString('utf8').matchAll(/!\[[^\]]*\]\((p\d{3}-\d{2}\.png)\)/g)].map(m=>m[1]))];
  if(pages.length!==18||pages.some((p,i)=>p!==41+i)||questions!==100||answers!==100||figures.length!==24)throw Error('Goryeo source coverage mismatch');
  if(segments.map(s=>s.markdown).join('\n')!==lines.join('\n'))throw Error('Lossy source partition');
  return {schema:'hanq-goryeo-script/1',source:{sha256:SOURCE,bytes:bytes.length,pages,questions,responseItems:103,printedAnswers:answers,assetKeyPrefix:`history/goryeo/81-2026/${SOURCE.slice(0,12)}/`,access:'authenticated-private-only',canonicalQuizMapping:'not-established'},topics:[
    {id:'politics',title:'정치의 흐름',from:41,to:48},{id:'society',title:'사회·경제',from:53,to:54},{id:'culture',title:'문화·문화재',from:55,to:56}
  ],figures,segments};
}
function build(input,output,images){
  const root=path.resolve(__dirname,'..'),target=path.resolve(output);
  if(target===root||target.startsWith(root+path.sep))throw Error('Output must be outside source repository');
  if(fs.existsSync(target))throw Error('Refusing to overwrite immutable bundle');
  const b=convert(fs.readFileSync(input));
  b.figureManifest=b.figures.map(name=>{const bytes=fs.readFileSync(path.join(images,name));if(bytes.length<24||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Invalid PNG');return {name,bytes:bytes.length,sha256:hash(bytes),width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),assetKey:b.source.assetKeyPrefix+name};});
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(b,null,2)+'\n',{flag:'wx'});
  const bytes=fs.readFileSync(target);console.log(JSON.stringify({source:SOURCE,bundleSha256:hash(bytes),bundleBytes:bytes.length,pages:18,questions:100,responseItems:103,answers:100,figures:24}));return b;
}
if(require.main===module){const [input,out,images]=process.argv.slice(2);if(!input||!out||!images)throw Error('Pass PRIVATE_MD PRIVATE_OUTPUT PRIVATE_IMAGES');build(input,out,images);}
module.exports={convert,build,SOURCE};
