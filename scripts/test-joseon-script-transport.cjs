'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {create}=require('../media/api-client.js'),transport=require('../media/joseon-script-transport.js');
(async()=>{
 let mode='normal',calls=[],resolveLate;const source=transport.sourceSha256;
 const api=create({base:'https://synthetic.invalid',storage:null,fetch:async(url,opts)=>{
  if(url.endsWith('/auth/logout'))return Response.json({ok:true});
  if(url.endsWith('/auth/signin'))return Response.json({accessToken:'synthetic-script-token',user:{id:'synthetic-a'}});
  if(url.endsWith('/me'))return Response.json({user:{id:'synthetic-a'},growth:{points:0},premium:{active:false},access:{total:0}});
  calls.push({url,opts});if(mode==='late')return new Promise(r=>resolveLate=r);
  if(mode==='401')return Response.json({error:{code:'unauthorized'}},{status:401});
  if(mode==='503')return Response.json({error:{code:'script_unavailable'}},{status:503});
  if(mode==='abort')return new Promise((r,j)=>opts.signal.addEventListener('abort',()=>j(new DOMException('aborted','AbortError'))));
  const headers={'content-type':url.includes('/figures/')?'image/png':'application/json','cache-control':mode==='public'?'public, max-age=3600':'private, no-store'};
  if(mode==='mime')headers['content-type']='text/html';return new Response(url.includes('/figures/')?new Uint8Array([137,80,78,71]):'{"synthetic":true}',{headers});
 }});
 await api.signin('synthetic@example.invalid','synthetic');calls=[];
 assert.equal(await api.joseonScriptBundle(source),'{"synthetic":true}');await api.joseonScriptFigure(source,'p060-01.png');
 assert(calls.every(c=>c.opts.method==='GET'&&c.opts.cache==='no-store'&&c.opts.headers.Authorization.startsWith('Bearer ')));assert(calls[0].url.endsWith('/scripts/joseon/'+source+'/bundle'));
 for(const invalid of ['../x.png','p060-01.svg','https://external.invalid/x.png'])await assert.rejects(api.joseonScriptFigure(source,invalid),e=>e.code==='invalid_script_figure');
 mode='public';await assert.rejects(api.joseonScriptBundle(source),e=>e.code==='invalid_private_response');mode='mime';await assert.rejects(api.joseonScriptBundle(source),e=>e.code==='invalid_private_response');
 mode='503';await assert.rejects(api.joseonScriptBundle(source),e=>e.code==='script_unavailable');mode='abort';const ac=new AbortController(),pending=api.joseonScriptBundle(source,ac.signal);await new Promise(r=>setImmediate(r));ac.abort();await assert.rejects(pending,e=>e.code==='aborted');
 mode='late';const late=api.joseonScriptBundle(source);await new Promise(r=>setImmediate(r));void api.logout();resolveLate(new Response('{}',{headers:{'content-type':'application/json','cache-control':'private, no-store'}}));await assert.rejects(late);await api.signin('synthetic@example.invalid','synthetic');mode='401';await assert.rejects(api.joseonScriptBundle(source),e=>e.status===401);assert.equal(api.state().signedIn,false);
 assert.equal(transport.fromDocument({querySelector:()=>({content:'unverified:'+source})},api),null);
 assert.equal(transport.fromDocument({querySelector:()=>null},api),null);assert.equal(transport.fromDocument({querySelector:()=>({content:transport.reviewedApiRelease+':'+source})},api).ready,true);
 await assert.rejects(transport.create({joseonScriptBundle:async()=>'{}'}).loadBundle(),/script_bundle_mismatch/);
 if(process.argv[2]){
  const text=fs.readFileSync(process.argv[2],'utf8'),imageRoot=process.argv[3];let bad=false;
  const t=transport.create({joseonScriptBundle:async()=>text,joseonScriptFigure:async(s,n)=>new Blob([bad?'invalid':fs.readFileSync(path.join(imageRoot,n))],{type:'image/png'})});
  await assert.rejects(t.loadFigure('p060-01.png'),/invalid_script_figure/);const b=await t.loadBundle();assert.equal(b.source.sha256,source);assert.equal((await t.loadFigure(b.figures[0])).size,b.figureManifest[0].bytes);bad=true;await assert.rejects(t.loadFigure(b.figures[0]),/script_figure_mismatch/);
  const aborted=new AbortController();aborted.abort();await assert.rejects(t.loadBundle({signal:aborted.signal}),/aborted/);
 }
 console.log('Script transport: authenticated GET, source/name validation, private cache/MIME, 401/503, abort, exact deployment gate and byte integrity passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
