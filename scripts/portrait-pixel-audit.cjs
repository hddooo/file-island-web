'use strict';
const assert=require('node:assert/strict'),zlib=require('node:zlib');
// Decode browser screenshots, not source sprites: ready classes and HTTP 200
// do not establish that an actual character is painted inside its shop viewport.
function pngPixels(buffer){
 assert(buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'PNG screenshot required');
 let width,height,channels,idat=[];
 for(let offset=8;offset<buffer.length;){const length=buffer.readUInt32BE(offset),type=buffer.toString('ascii',offset+4,offset+8),data=buffer.subarray(offset+8,offset+8+length);offset+=length+12;
  if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);assert.equal(data[8],8,'8-bit PNG');assert([2,6].includes(data[9]),'RGB/RGBA PNG');assert.equal(data[12],0,'noninterlaced PNG');channels=data[9]===6?4:3;}
  if(type==='IDAT')idat.push(data);
 }
 assert(width>0&&height>0&&width*height<=16e6,'bounded screenshot size');
 const stride=width*channels,raw=zlib.inflateSync(Buffer.concat(idat)),pixels=Buffer.alloc(stride*height);assert.equal(raw.length,(stride+1)*height);
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];assert(filter<=4,'known PNG filter');for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=channels?pixels[i-channels]:0,b=y?pixels[i-stride]:0,c=y&&x>=channels?pixels[i-stride-channels]:0;pixels[i]=(raw[y*(stride+1)+1+x]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;}}
 return{width,height,channels,pixels};
}
function patamonPixels(buffer){const {width,height,channels,pixels}=pngPixels(buffer);let orange=0;for(let i=0;i<pixels.length;i+=channels){const[r,g,b]=pixels.subarray(i,i+3),alpha=channels===4?pixels[i+3]:255;if(alpha>128&&r>170&&g>65&&g<205&&b<125&&r>g*1.16&&g>b*1.2)orange++;}return{width,height,orange,ratio:orange/(width*height)};}
module.exports={pngPixels,patamonPixels};
