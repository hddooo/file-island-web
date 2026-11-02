'use strict';
const assert=require('node:assert/strict'),zlib=require('node:zlib'),{pngPixels,patamonPixels}=require('./portrait-pixel-audit.cjs');
// CRC is irrelevant to this decoder's synthetic byte fixtures; browser PNGs own it.
function chunk(type,data){const n=Buffer.alloc(4);n.writeUInt32BE(data.length);return Buffer.concat([n,Buffer.from(type),data,Buffer.alloc(4)]);}
function png(rows,filter=0){const h=rows.length,w=rows[0].length/4,header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=8;header[9]=6;const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};const raw=Buffer.concat(rows.map((row,y)=>Buffer.concat([Buffer.from([filter]),Buffer.from(row.map((v,x)=>{const a=x>=4?row[x-4]:0,b=y?rows[y-1][x]:0,c=y&&x>=4?rows[y-1][x-4]:0;return(v-[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;}))])));return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
const rows=[[240,140,30,255,245,240,210,255],[40,40,40,255,240,140,30,0]];
for(const filter of [0,1,2,3,4]){const b=png(rows,filter),d=pngPixels(b);assert.equal(d.width,2);assert.deepEqual([...d.pixels],rows.flat());assert.equal(patamonPixels(b).orange,1);assert.equal(patamonPixels(b).ratio,.25);}
assert.equal(patamonPixels(png([[245,240,210,255,40,40,40,255]])).orange,0,'empty cream panel and shadow fail character pixel test');
assert.throws(()=>pngPixels(Buffer.from('not PNG')));
console.log('PASS portrait screenshot pixel decoder (all five PNG filters, alpha, blank panel)');
