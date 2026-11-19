'use strict';
// Private input contract: audited round JSON, official keys from PDFs, and reviewed question crops.
// Emits only public formal-exam crops and reviewed explanation overlays under media, and a
// separate 67–69 append payload outside the web repository. Does not touch existing pools.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'..'),input=path.resolve(process.argv[2]||'.'),output=process.argv[3]&&path.resolve(process.argv[3]);
assert(output&&!output.startsWith(repo+path.sep),'Pass an explicit private output path outside the web repository');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const inputFile=(...p)=>path.join(input,...p);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const seq=Array.from({length:50},(_,i)=>String(i+1).padStart(2,'0'));
const rounds=[67,68,69], expected=rounds.flatMap(r=>seq.map(n=>r+'-'+n)), archives={67:'1000029978',68:'1000029984',69:'1000029997'};
const glyph='①②③④⑤',eraSet=new Set('prehistory gojoseon samguk nambuk goryeo joseon-early joseon-late opening colonial modern integrated'.split(' '));
const rows=read(inputFile('exam67-69-crops','manifest.json'));
assert.equal(rows.length,150);
const crops=new Map(rows.map(x=>[x.id,x]));
assert.deepEqual([...crops.keys()].sort(),expected);
const originals=path.join(repo,'media','cbt-originals'), manifestPath=path.join(originals,'manifest.json');
const manifest=read(manifestPath), items={}, questions={}, images=new Map();
const validLine=s=>typeof s==='string'&&s.trim().length>0;
const lines=v=>Array.isArray(v)?v.filter(validLine):validLine(v)?[v]:[];
const optional=[['clue','clue'],['ctx','context'],['mem','memory'],['cmp','contrast']];
for(const round of rounds){
 const filename=f=>inputFile('exam'+round+'-new',f);
 const manuscript=read(filename('round-'+round+'.json')),key=read(filename('official-key.json'));
 const questionPdfSha=sha(fs.readFileSync(filename('questions.pdf'))),answerPdfSha=sha(fs.readFileSync(filename('answers.pdf')));
 assert.equal(manuscript.round,round);assert.deepEqual(Object.keys(manuscript.items).sort(),seq);
 assert.equal(Object.keys(key).length,50);let total=0;
 for(const n of seq){
  const num=Number(n),subid=round+'-'+n,id='exam-'+subid, ms=manuscript.items[n], crop=crops.get(subid);
  const {answer,points}=key[num]||{};
  assert.equal(ms.answer,answer,id+' authored answer');
  assert.equal(ms.points??ms.point,points,id+' authored points');
  assert(answer>=1&&answer<=5&&[1,2,3].includes(points));total+=points;
  assert.equal(typeof (ms.neg??ms.negative),'boolean',id+' original question polarity');
  assert(eraSet.has(ms.era)&&validLine(ms.part),id+' era and part');
  assert(validLine(ms.a)&&validLine(ms.conclusion)&&lines(ms.why).length,id+' stem and conclusion');
  assert(Array.isArray(ms.o)&&ms.o.length===5&&ms.o.every(validLine),id+' all explanations');
  assert.equal(crop.file,subid+'.webp');assert(crop.page>=1&&crop.page<=12&&crop.round===round&&crop.question===num);if(ms.sourcePage)assert.equal(crop.page,ms.sourcePage,id+' source page');
  assert.equal(!!crop.sharedIntroBbox,(round===67||round===69)&&[47,48].includes(num),id+' shared passage embedded');
  assert.equal(crop.source,'exam'+round+'-new/questions.pdf');
  const bytes=fs.readFileSync(inputFile('exam67-69-crops',crop.file));
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
  const imageSha=sha(bytes);
  assert.equal(crop.sha256,imageSha,id+' audited crop checksum');
  const version=sha(JSON.stringify([id,answer,points,questionPdfSha,imageSha])).slice(0,16);
  const options=Array.from(glyph,(text,i)=>({id:id+'-option-'+(i+1),number:i+1,text,correct:i===answer-1,review:[ms.o[i].trim()]}));
  const refs=[{label:'한국사능력검정시험 제'+round+'회 '+num+'번 공식 문제지·정답표',url:'https://www.historyexam.go.kr/pst/view.do?bbs=dat&pst_sno='+archives[round]}];
  const overview={answer:glyph[answer-1]+' '+ms.a,ask:ms.ask||null,reason:lines(ms.why),conclusion:ms.conclusion};
  for(const [from,to] of optional)overview[to]=lines(ms[from]);
  overview.refs=[{kind:'exam',exam:round,number:num,page:crop.page}];
  const base={id,exam:round,number:num,v:version,points,answer,options,overview,references:refs};
  items[id]=base;
  const relatedEras=(ms.eraScope||[]).filter(x=>x!==ms.era&&eraSet.has(x)&&x!=='integrated');
  if(ms.era==='integrated')relatedEras.push('joseon-late');
  // Composite-source prompts use the first historical clue to identify the API-visible era.
  const compositeFallback={46:'goryeo',47:'goryeo',48:'goryeo'};
  const era=ms.era==='integrated'?(compositeFallback[num]||null):ms.era;
  questions[id]={...base,subject:'history',era,relatedEras,negative:ms.neg??ms.negative,part:ms.part,image:'media/cbt-originals/'+crop.file,imageSha256:imageSha,
   source:{file:'제'+round+'회 심화 공식 문제지',sha256:questionPdfSha,page:crop.page,pixelCrop:crop.bbox,sourceSize:crop.sourceSize,sharedIntroBbox:crop.sharedIntroBbox||null,answerFile:'제'+round+'회 심화 공식 정답표',answerSha256:answerPdfSha}};
  images.set(crop.file,{bytes,sha:imageSha});
 }
 assert.equal(total,100);
}
assert.equal(Object.keys(items).length,150);
for(const [name,o] of images){assert(!manifest.files[name]||manifest.files[name]===o.sha,'existing source image differs: '+name);}
for(const [name,o] of images){fs.writeFileSync(path.join(originals,name),o.bytes);manifest.files[name]=o.sha;}
manifest.files=Object.fromEntries(Object.entries(manifest.files).sort(([a],[b])=>a.localeCompare(b)));
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(repo,'media','cbt-explanation67-69-data.js'),'/* Reviewed CBT explanations: final-result display only; exact public exam versions. */\nwindow.HANQ_CBT_EXPLANATIONS_67_69='+JSON.stringify({schema:1,items})+';\n');
const data=JSON.stringify({questions})+'\n';fs.writeFileSync(output,data,{mode:0o600});
console.log('67–69 advanced: 150 official answers and crops · 750 option explanations · 3 × 100 points; private seed SHA-256 '+sha(data));
