(function(root){
 'use strict';
 const SOURCE='245d166b2a252293903f87654028a648772f8c78dbb8ade09c86a21a223bb5a9',BUNDLE='ed4fcfab4b25b0e896c93bcfe0240372b70da0fcbb22c1fa81afad14bbc71943',prepared=new WeakSet();
 const encode=s=>new TextEncoder().encode(s),decode=b=>new TextDecoder('utf-8',{fatal:true}).decode(b);
 async function digest(b){return Array.from(new Uint8Array(await root.crypto.subtle.digest('SHA-256',b)),n=>n.toString(16).padStart(2,'0')).join('');}
 async function prepare(bundle){
  if(!bundle||bundle.schema!=='hanq-goryeo-script/1'||bundle.source?.sha256!==SOURCE||await digest(encode(JSON.stringify(bundle,null,2)+'\n'))!==BUNDLE)throw Error('goryeo_bundle_mismatch');
  const source=bundle.segments.map(s=>s.markdown).join('\n'),bytes=encode(source),lines=source.split('\n');
  if(bytes.length!==60806||await digest(bytes)!==SOURCE)throw Error('goryeo_source_mismatch');
  const data=root.HanqGoryeoStructureData,policy=root.HanqGoryeoPresentationData;
  if(data.sourceSha256!==SOURCE)throw Error('goryeo_mapping_source');
  async function fragment(r){if(!Number.isInteger(r.start)||!Number.isInteger(r.end)||r.start<0||r.end>bytes.length||r.start>=r.end)throw Error('goryeo_range');const b=bytes.slice(r.start,r.end);if(await digest(b)!==r.sha256)throw Error('goryeo_fragment_hash');return decode(b);}
  async function bands(items){return Promise.all((items||[]).map(async b=>({...b,markdown:(await Promise.all(b.ranges.map(fragment))).join('\n'),panels:await bands(b.panels)})));}
  const figures=await Promise.all((data.stage3Figures||[]).map(async f=>{if(bundle.figureManifest.find(x=>x.name===f.name)?.sha256!==f.sha256)throw Error('goryeo_figure_owner');return {...f,captionMarkdown:f.caption?await fragment(f.caption):''};}));
  const tables=[];
  for(const t of data.tables){
   for(const [start,end,sha256] of t.envelopes)await fragment({start,end,sha256});
   const grid=Array.from({length:t.rows},()=>Array(t.columns).fill(null)),cells=[];
   for(const [index,c] of t.cells.entries()){
    for(const key of ['row','column','rowspan','colspan'])if(!Number.isInteger(c[key])||c[key]<1)throw Error('goryeo_grid');
    for(let y=c.row-1;y<c.row-1+c.rowspan;y++)for(let x=c.column-1;x<c.column-1+c.colspan;x++){if(!grid[y]||x>=t.columns||grid[y][x]!==null)throw Error('goryeo_overlap');grid[y][x]=index;}
    cells.push({...c,id:'gs-'+t.id+'-'+c.row+'-'+c.column,markdown:(await Promise.all(c.ranges.map(fragment))).join('\n'),noteMarkdown:(await Promise.all([...(c.note?[c.note]:[]),...(c.notes||[])].map(fragment))).join('\n'),bands:await bands(c.bands),parts:await Promise.all(c.ranges.map(async r=>({markdown:await fragment(r),inset:(c.insets||[]).some(i=>i.range.start===r.start&&i.range.end===r.end)})))});
   }
   if(grid.some(row=>row.some(c=>c===null)))throw Error('goryeo_grid_gap');
   for(const c of cells)if(c.contentFigure&&bundle.figureManifest.find(f=>f.name===c.contentFigure)?.sha256!==c.figureSha256)throw Error('goryeo_figure_owner');
   tables.push({...t,captionMarkdown:t.caption?await fragment(t.caption):t.captionLiteral,cells});
  }
  if(tables.length!==14||tables[0].cells.find(c=>c.row===5&&c.column===4)?.colspan!==2||tables[1].cells.find(c=>c.figure)?.rowspan!==3)throw Error('goryeo_schema');
  for(const [name,sha] of [['p042-01.png','3248959a8ff8fc90f18b6bfbc681d5394468a9ba2e0c5629120c21c8ea87872d'],['p042-02.png','23aaaceb5fc1231c164ec56a1b371e0e803255befa0efdf5e53a94bc00fc7e8a']])if(bundle.figureManifest.find(f=>f.name===name)?.sha256!==sha)throw Error('goryeo_figure_owner');
  const projected=lines.slice(),removed=new Set();
  for(const e of policy.editorial){if(await digest(encode(lines[e.line-1]))!==e.sha256)throw Error('goryeo_editorial_hash');projected[e.line-1]=e.keepPrefixLength?lines[e.line-1].slice(0,e.keepPrefixLength):'';removed.add(e.line);}
  for(const e of policy.labels){if(await digest(encode(lines[e.line-1]))!==e.sha256)throw Error('goryeo_label_hash');projected[e.line-1]=e.replacement;}
  // Study is allowlist-only. Unimplemented era structures remain in the
  // immutable bundle, never displayed as flattened fallback or raw disclosures.
  const stageMarkers=new Map([[58,'@@table15@@'],[119,'@@early-diagram@@'],[123,'@@table16@@'],[191,'@@exam-early@@'],[376,'@@exam-military@@']]);
  for(const t of tables)stageMarkers.set(t.anchor,'@@'+t.id+'@@');
  for(const s of [...data.stage2Sections,...data.stage3Sections])stageMarkers.set(s.anchor,'### '+await fragment(s.range));
  stageMarkers.set(data.gallery.anchor,'@@gallery-culture@@');
  const segments=bundle.segments.map(s=>({...s,markdown:s.kind==='study'?lines.slice(s.startLine-1,s.endLine).map((_,i)=>stageMarkers.get(s.startLine+i)||'').join('\n'):projected.slice(s.startLine-1,s.endLine).join('\n')}));
  const result={bundle,tables,figures,gallery:data.gallery,rootTitle:await fragment(data.rootTitle),earlyTitle:await fragment(data.earlyTitle),diagramText:await fragment(data.diagramText),segments};
  const immutable=JSON.parse(JSON.stringify(result));
  function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
  freeze(immutable);prepared.add(immutable);return immutable;
 }
 root.HanqGoryeoStructure={prepare,isPrepared:value=>prepared.has(value)};
})(typeof window==='object'?window:globalThis);
