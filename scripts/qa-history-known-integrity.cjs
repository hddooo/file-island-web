'use strict';
// Private local candidates only. No API, accounts, network or content output.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const reader=require('../media/textbook-semantic');
const [baseline,candidate,output]=process.argv.slice(2).map(p=>path.resolve(p||''));
for(const p of [baseline,candidate])assert(p.split(path.sep).includes('private-data'));
const N='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de',O='35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442';
const read=p=>JSON.parse(fs.readFileSync(p)),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const n=path.join(candidate,N),b=path.join(baseline,N),review=read(path.join(n,'validation/known-integrity-reviewed-pages.json'));
assert.equal(hash(path.join(n,'raw/source/original.pdf')),N);assert.equal(hash(path.join(candidate,O,'raw/source/original.pdf')),O);
const expected=new Set(['manifest.json',...review.records.map(r=>`pages/page-${String(r.pdfPage).padStart(3,'0')}.json`)]),changed=[],checks=[];
function files(root,prefix=''){return fs.readdirSync(path.join(root,prefix),{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(root,path.join(prefix,e.name)):[path.join(prefix,e.name)]).sort();}
const all=files(path.join(n,'semantic'));assert.deepEqual(all,files(path.join(b,'semantic')));
for(const f of all){if(hash(path.join(n,'semantic',f))!==hash(path.join(b,'semantic',f)))changed.push(f);}
assert.deepEqual(changed.sort(),[...expected].sort());
for(const rec of review.records){
 const p=read(path.join(n,'semantic/pages',`page-${String(rec.pdfPage).padStart(3,'0')}.json`));assert.deepEqual(p,rec.page);reader.validatePage(p);
 const tables=p.blocks.filter(b=>b.type==='table');const cellById=new Map(tables.flatMap(t=>t.rows.flatMap(r=>r.cells.map(c=>[c.id,c]))));
 function ids(x){if(Array.isArray(x))return x.flatMap(ids);if(x&&typeof x==='object'){if(x.sourceCharIds)return x.sourceCharIds;return Object.entries(x).filter(([k])=>!['transcriptionAudit','referenceTranscriptionAudit'].includes(k)).flatMap(([,v])=>ids(v));}return [];}
 for(const correction of p.knownIntegrityReview.corrections){
  if(correction.kind==='source-subcolumns')for(const r of correction.rows){const found=[...cellById.values()].filter(c=>c.sourceRole==='row-heading'&&JSON.stringify([...ids(c)].sort())===JSON.stringify([...r.labelCharacterIds].sort()));assert.equal(found.length,1);}
  if(correction.kind==='source-child-cell-association'){const child=p.blocks.find(x=>x.id===correction.blockId);assert.equal(child.sourceTargetCellId,correction.target);assert(cellById.has(correction.target));}
  if(correction.kind==='source-photo-caption'){const gallery=tables.find(t=>(t.figures||[]).some(f=>f.assetId===correction.photoAsset));assert(gallery);assert.equal(gallery.sourceTargetCellId,correction.targetCell);const f=gallery.figures.find(f=>f.assetId===correction.photoAsset);assert(gallery.rows.some(r=>r.cells.some(c=>c.id===f.sourceCaptionCellId&&c.lines.some(l=>l.spans.some(s=>s.sourceRasterText)))));}
  if(correction.kind==='source-number-anchored-answer-reference'){const refs=tables.filter(t=>t.sourceAnswerDisplayAudit);assert.equal(refs.length,3);for(const t of refs){const nums=t.rows.slice(1).flatMap(r=>r.cells.map(c=>c.sourceAnswerNumber)).filter(Number.isInteger);assert.deepEqual(nums,Array.from({length:t.sourceAnswerDisplayAudit.answers},(_,i)=>i+1));}}
 }
 checks.push({pdfPage:rec.pdfPage,schemaValid:true,pinnedReviewApplied:true,relationshipChecks:true});
}
let legacy=0;const snapshot=read(path.join(candidate,O,'snapshot-integrity.json'));for(const f of snapshot.files){assert.equal(hash(path.join(candidate,O,'semantic',f.path)),f.sha256);legacy++;}assert.equal(legacy,298);
const digest=q=>crypto.createHash('sha256').update(JSON.stringify({schema:q.schemaVersion,source:q.source,items:q.items})).digest('hex');
const quizVersions=files(path.join(n,'semantic/quizzes')).map(f=>{const q=path.join(n,'semantic/quizzes',f),old=path.join(b,'semantic/quizzes',f);assert.equal(hash(q),hash(old));assert.equal(digest(read(q)),digest(read(old)));return {quizId:read(q).id,sourceVersion:digest(read(q)),unchanged:true};});assert.equal(quizVersions.length,8);
let schemaPages=0;for(const f of files(path.join(n,'semantic/pages'))){reader.validatePage(read(path.join(n,'semantic/pages',f)));schemaPages++;}
const report={sourceRevision:N,scope:'Source relationship/data checks only; human visual comparison, final FE/API integration and deployment are separate.',semanticFiles:all.length,changedFiles:changed.length,correctedPages:checks.length,allPagesSchemaValid:schemaPages,legacySnapshotFilesUnchanged:legacy,quizBytesAndSourceVersionsUnchanged:quizVersions,sourcePdfHashesUnchanged:true,checks};fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(`PASS: ${checks.length} corrected pages, ${schemaPages} valid pages, ${legacy} immutable legacy files, 8 identical quiz versions.`);
