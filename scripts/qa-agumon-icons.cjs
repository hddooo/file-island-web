'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.OUT_DIR||path.join(root,'../evidence/agumon-icons'));
fs.mkdirSync(out,{recursive:true});
const names=[16,32,180,192,512].map(size=>({size,src:`/media/agumon-icon-transparent-${size}-20261030.png`}));
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest')));
 assert.deepEqual(manifest.icons,names.filter(a=>[192,512].includes(a.size)).map(a=>({src:a.src,sizes:`${a.size}x${a.size}`,type:'image/png',purpose:'any'})));
 assert(fs.readFileSync(path.join(root,'apple-touch-icon.png')).equals(fs.readFileSync(path.join(root,names[2].src))));
 const ico=fs.readFileSync(path.join(root,'favicon.ico'));assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),2);
 [16,32].forEach((size,k)=>{const at=6+k*16,len=ico.readUInt32LE(at+8),offset=ico.readUInt32LE(at+12);assert.equal(ico[at],size);assert(ico.subarray(offset,offset+len).equals(fs.readFileSync(path.join(root,names[k].src))));});
 for(const html of ['index.html','inquiries/index.html']){const source=fs.readFileSync(path.join(root,html),'utf8');assert(source.includes('href="'+names[1].src+'"'));assert(source.includes('href="'+names[2].src+'"'));assert(!/koromon-(?:touch|favicon)/.test(source));}
 const headers=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'))).headers;for(const src of ['/manifest.webmanifest','/apple-touch-icon.png','/favicon.ico'])assert(headers.some(h=>h.source===src&&h.headers.some(v=>v.key==='Cache-Control'&&v.value.includes('must-revalidate'))));
 const server=http.createServer((req,res)=>{const f=path.join(root,req.url.split('?')[0]);fs.readFile(f,(e,b)=>{res.statusCode=e?404:200;res.setHeader('Content-Type',f.endsWith('.png')?'image/png':'text/plain');res.end(e?'':b);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const proof={installedDeviceVerified:false,maskable:false,engines:[]};
 try{for(const [engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{const page=await browser.newPage({viewport:{width:1000,height:900},deviceScaleFactor:1});
 await page.goto(`http://127.0.0.1:${server.address().port}/manifest.webmanifest`);
 const stats=await page.evaluate(async names=>{const result=[];for(const a of names){const i=new Image();i.src=a.src;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);const d=x.getImageData(0,0,i.width,i.height).data;let zero=0,white=0;for(let p=0;p<d.length;p+=4){if(d[p+3]===0)zero++;if(d[p]>220&&d[p+1]>220&&d[p+2]>220&&d[p+3]>240)white++;}result.push({size:a.size,width:i.width,height:i.height,transparent:zero/(i.width*i.height),white,corners:[3,(i.width-1)*4+3,(i.height-1)*i.width*4+3,d.length-1].map(at=>d[at])});}return result;},names);
 stats.forEach(a=>{assert.equal(a.width,a.size);assert.equal(a.height,a.size);assert(a.transparent>.15);assert(a.corners.every(x=>x===0));if(a.size>=180)assert(a.white>0);});
 await page.setContent('<style>body{margin:0;font:14px system-ui;background:#ddd}section{padding:20px;display:flex;align-items:center;gap:28px;height:230px}figure{margin:0;text-align:center}figcaption{margin-top:8px}img{display:block;margin:auto}.light{background:white;color:#111}.dark{background:#07130f;color:white}.checker{color:#111;background:repeating-conic-gradient(#ddd 0% 25%,white 0% 50%) 0 0/20px 20px}</style>'+['light','dark','checker'].map(bg=>'<section class="'+bg+'">'+[16,32,64,180,192].map(n=>'<figure><img src="'+names[n===16?0:n===32?1:n===180?2:3].src+'" width="'+n+'" height="'+n+'"><figcaption>'+n+'px</figcaption></figure>').join('')+'</section>').join(''));
 await page.locator('img').evaluateAll(ns=>Promise.all(ns.map(n=>n.decode())));await page.screenshot({path:path.join(out,engine+'-light-dark-checker.png'),fullPage:true});
 proof.engines.push({engine,stats});
 }finally{await browser.close();}}
 proof.files=names.map(a=>({...a,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.src))).digest('hex')}));assert.equal(proof.engines.length,2);proof.passed=true;fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(proof,null,2));console.log(JSON.stringify({passed:true,engines:proof.engines.map(a=>a.engine),installedDeviceVerified:false}));
 }finally{await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
