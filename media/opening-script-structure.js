(function(root){
 'use strict';
 const prepared=new WeakSet();
 const encode=s=>new TextEncoder().encode(s);
 async function digest(b){return Array.from(new Uint8Array(await root.crypto.subtle.digest('SHA-256',b)),n=>n.toString(16).padStart(2,'0')).join('');}
 async function prepare(input,data,presentation){
  const SOURCE=data?.bundleDescriptor?.source?.sha256;
  if(!/^[a-f0-9]{64}$/.test(SOURCE)||!presentation)throw Error("opening_structure_required");
  // Immutable local whole-era input; deployment remains gated.
  if(!input||input.schema!=='hanq-opening-local/1'||input.source?.sha256!==SOURCE||typeof input.markdown!=='string')throw Error('opening_bundle_mismatch');
  const bytes=encode(input.markdown);
  if(!data||data.sourceSha256!==SOURCE)throw Error("opening_structure_required");
  const {bundleDescriptor,bundlePin,...projection}=data;if(await digest(encode(JSON.stringify(projection)))!==input.projectionSha256)throw Error('opening_projection_pin');
  const serialized=encode(JSON.stringify(input));if(serialized.length!==data.bundlePin.bytes||await digest(serialized)!==data.bundlePin.sha256)throw Error('opening_bundle_pin');
  if(bytes.length!==data.bundleDescriptor.source.bytes||await digest(bytes)!==SOURCE||data.sourceSha256!==SOURCE)throw Error('opening_source_mismatch');
  async function fragment(r){if(!r||!Number.isInteger(r.start)||!Number.isInteger(r.end)||r.start<0||r.end<=r.start||r.end>bytes.length)throw Error('opening_range');const b=bytes.slice(r.start,r.end);if(await digest(b)!==r.sha256)throw Error('opening_fragment_mismatch');return new TextDecoder('utf-8',{fatal:true}).decode(b);}
  for(const item of data.whitelist)await fragment(item.range);
  for(const item of data.emphasis)await fragment(item.range);
  const figures=await Promise.all(data.figures.map(async f=>({...f,captionMarkdown:f.caption?await fragment(f.caption):'',events:await Promise.all(f.events.map(async e=>({dateMarkdown:await fragment(e.date),eventMarkdown:await fragment(e.event)})))})));
  const tables=[];
  for(const t of data.tables){const grid=Array.from({length:t.rows},()=>Array(t.columns).fill(false)),cells=[];
   for(const c of t.cells){for(const k of ['row','column','rowspan','colspan'])if(!Number.isInteger(c[k])||c[k]<1)throw Error('opening_grid');for(let y=c.row-1;y<c.row-1+c.rowspan;y++)for(let x=c.column-1;x<c.column-1+c.colspan;x++){if(!grid[y]||x>=t.columns||grid[y][x])throw Error('opening_overlap');grid[y][x]=true;}
    const parts=await Promise.all(c.ranges.map(async r=>({markdown:await fragment(r)})));
    // The parent category has its own rowspan; show the exact leaf label in the phase cell.
    for(const rule of presentation.stripCellPrefixes||[])if(t.id===rule.table&&c.column===rule.column&&c.isHeader)for(const part of parts)if(part.markdown.startsWith(rule.prefix))part.markdown=part.markdown.slice(rule.prefix.length);
    cells.push({...c,markdown:parts.map(p=>p.markdown).join('\n'),parts,insets:await Promise.all(c.insets.map(async i=>({...i,titleMarkdown:await fragment(i.title),itemsMarkdown:await Promise.all(i.items.map(fragment))})))});
   }
   if(grid.flat().some(x=>!x))throw Error('opening_grid_gap');tables.push({...t,cells,captionMarkdown:t.caption?await fragment(t.caption):t.captionLiteral});
  }
  const review=await Promise.all(data.review.map(async g=>({...g,titleMarkdown:(await fragment(g.title)).replace(/^#+\s*/,''),questions:await Promise.all(g.questions.map(async q=>({...q,markdown:await fragment(q.prompt),blankMarkdown:q.combinedBlank?await fragment(q.combinedBlank):'',fields:await Promise.all(q.fields.map(async f=>({...f,markdown:q.combinedBlank?'':await fragment(f.blank)}))),optionsMarkdown:(await Promise.all(q.options.map(fragment))).join('\n')}))),answers:await Promise.all(g.answers.map(async a=>({...a,markdown:await fragment(a.value)}))),notes:g.id===presentation.answerNotesGroup?await Promise.all(data.answerNotes.map(fragment)):[]})));
  if(tables.length!==data.tables.length||review.flatMap(g=>g.questions).length!==input.counts.questions||review.flatMap(g=>g.answers).length!==input.counts.answers||review.flatMap(g=>g.questions).flatMap(q=>q.fields).length!==input.counts.fields)throw Error('opening_counts');
  const topics=data.topics;
  const segments=await Promise.all(data.segments.map(async s=>({...s,kind:'study',headings:await Promise.all(s.headings.map(fragment))})));
  segments.forEach(s=>s.markdown='@@structured@@');
  const bundle={schema:'hanq-opening-script/1',source:{sha256:SOURCE},topics,segments,figures:figures.map(f=>f.name),figureManifest:figures.map(f=>({name:f.name,sha256:f.sha256,bytes:f.bytes}))};
  const blocks=await Promise.all(data.blocks.map(async b=>({...b,markdown:(await Promise.all(b.ranges.map(fragment))).join("\n")})));
  const result={presentation,blocks,bundle,review,tables,figures,segments,rootTitle:(await fragment(data.titles[0])).replace(/^#+\s*/,''),rootTitleMarkdown:(await fragment(data.titles[1])).replace(/^#+\s*/,''),headings:await Promise.all(data.titles.slice(2).map(fragment)),practiceGuidance:await fragment(data.practiceGuidance),orientationMarkdown:await fragment(data.orientation)};
  function freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}freeze(result);prepared.add(result);return result;
 }
 root.HanqOpeningStructure={prepare,isPrepared:x=>prepared.has(x)};
})(typeof window==='object'?window:globalThis);
