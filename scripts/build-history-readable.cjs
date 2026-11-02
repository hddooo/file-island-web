/* node scripts/build-history-readable.cjs <existing-normalized-source.json> <existing-option-candidates.json>
 * Only explicit image-reviewed records become runtime text. The complete inventory
 * records all remaining source items; extraction candidates are not treated as verified.
 */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'media/exam-pool.js'),'utf8'),ctx);
const pool=ctx.window.HANQ_EXAM_POOL,source=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),candidates=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
const reviewed=JSON.parse(fs.readFileSync(path.join(root,'docs/history-readable-reviewed.json'),'utf8')),out={},inventory=[];
function sha(s){return crypto.createHash('sha256').update(s).digest('hex');}
for(const id of pool.order){
 const q=pool.questions[id],s=source.records.find(x=>x.id===id),candidate=candidates.records.find(x=>x.id===id),r=reviewed[id];
 if(!s||s.answer!==q.answer||s.points!==q.points||s.contentVersion!==q.v)throw Error('Source identity mismatch '+id);
 if(sha(fs.readFileSync(path.join(root,q.image)))!==q.imageSha256)throw Error('Image mismatch '+id);
 let status=r?.status||'pending-verification';
 if(!['verified-text','image-required','pending-verification'].includes(status))throw Error('Unknown review state '+id);
 if(status==='verified-text'){
  if(!r.stem||!Array.isArray(r.blocks)||r.blocks.some(b=>typeof b.text!=='string'||!b.text.trim())||r.options?.length!==5||r.options.some(t=>typeof t!=='string'||!t.trim()))throw Error('Incomplete text '+id);
  if(!/^source-image-compared-\d{4}-\d{2}-\d{2}$/.test(r.verification||''))throw Error('Missing image review '+id);
  for(const b of [{text:r.stem,underline:r.stemUnderline},...(r.common?.blocks||[]),...r.blocks]){
   let pos=0;for(const entry of Array.isArray(b.underline)?b.underline:b.underline?[b.underline]:[]){const mark=typeof entry==='string'?entry:entry.text,n=entry.occurrence||1;if(!mark||!Number.isInteger(n)||n<1)throw Error('Invalid underline '+id);let at=pos;for(let i=0;i<n;i++){at=b.text.indexOf(mark,at);if(at<0)throw Error('Underline mismatch '+id);if(i+1<n)at+=mark.length;}pos=at+mark.length;}
   if(b.table&&(!b.table.headers?.length||!b.table.rows?.length||b.table.rows.some(c=>c.length!==b.table.headers.length||c.some(t=>typeof t!=='string'))))throw Error('Table mismatch '+id);
  }
  if(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u200b\u200c\ue000-\uf8ff\ufffd]/.test(JSON.stringify(r))||r.options.some(t=>/\[[123]점\]/.test(t)))throw Error('Unresolved extraction artifact '+id);
  if(q.commonImage&&(!r.common?.blocks?.length||r.common.imageSha256!==q.commonImageSha256||sha(fs.readFileSync(path.join(root,q.commonImage)))!==q.commonImageSha256||JSON.stringify(r.common.questionNumbers)!==JSON.stringify(q.commonQuestionIDs.map(id=>pool.questions[id].number))))throw Error('Shared source needs separate review '+id);
  if(r.common&&!q.commonImage)throw Error('Unexpected shared source '+id);
  out[id]={status,version:q.v,exam:q.exam,number:q.number,imageSha256:q.imageSha256,common:r.common||null,stem:r.stem,stemUnderline:r.stemUnderline||null,blocks:r.blocks,options:r.options.map((text,i)=>({id:q.options[i].id,number:i+1,text}))};
 }
 const protectedImage='media/cbt-originals/'+q.exam+'-'+String(q.number).padStart(2,'0')+'.webp';
 inventory.push({id,exam:q.exam,number:q.number,version:q.v,status,verification:r?.verification||null,reason:r?.reason||(r?'원본 이미지 대조':'기존 추출 후보의 원문·기호·자료 배치 검토 전'),sourceFile:q.source.file,page:q.source.page,image:q.image,imageSha256:q.imageSha256,commonImage:q.commonImage||null,commonImageSha256:q.commonImageSha256||null,protectedImage,protectedImageSha256:sha(fs.readFileSync(path.join(root,protectedImage))),candidateOptionCount:candidate?.options?.length||0,sourceTextSha256:sha(s.text),answer:q.answer,points:q.points,notes:r?.notes||[]});
}
if(inventory.length!==500||new Set(inventory.map(r=>r.id)).size!==500)throw Error('Expected 500 unique source questions');
const counts={total:inventory.length,text:Object.keys(out).length,imageRequired:inventory.filter(r=>r.status==='image-required').length,pending:inventory.filter(r=>r.status==='pending-verification').length,inspected:inventory.filter(r=>r.verification).length,pendingAfterInspection:inventory.filter(r=>r.status==='pending-verification'&&r.verification).length,notYetInspected:inventory.filter(r=>!r.verification).length};
fs.writeFileSync(path.join(root,'media/history-readable.js'),'/* Generated from individually image-reviewed text. No answers, reviews or grading fields. */\nwindow.HANQ_HISTORY_READABLE='+JSON.stringify(out,null,2)+';\n');
fs.writeFileSync(path.join(root,'docs/history-readability-inventory.json'),JSON.stringify({counts,sourceSha256:sha(fs.readFileSync(process.argv[2])),candidateSha256:sha(fs.readFileSync(process.argv[3])),questions:inventory},null,2)+'\n');
console.log(JSON.stringify(counts));
