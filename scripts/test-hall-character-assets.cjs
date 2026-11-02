const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ids=['botamon','koromon','agumon','greymon','metalgreymon','wargreymon','tokomon','patamon','angemon','magnaangemon'];
const items=ids.map((id,i)=>({rank:i+1,nickname:'fixture <'+id+'>',points:1000+i,character:{id,name:id}}));
const data={items,me:items[2],total:10,limit:20,hasNext:false},before=JSON.stringify(data),host={isConnected:true,addEventListener(){},querySelector(){return {};}};
const context={window:{},document:{},Set};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'media/hall-of-fame.js'),'utf8'),context);
context.window.HanqHall.mount(host,{hallOfFame:async()=>data});
setImmediate(()=>{try{
 const html=host.innerHTML;
 assert.equal((html.match(/class="hall-person(?: |")/g)||[]).length,10);
 for(const id of ['agumon','patamon']){assert(html.includes('hanq-mascot--'+id));assert(!html.includes('/'+id+'.png'));assert(fs.existsSync(path.join(root,'media/characters',id+'-idle-sprite.png')));}
 assert(html.includes('/holyangemon.png'));assert(!html.includes('/magnaangemon.png'));
 for(const match of html.matchAll(/src="([^"]+)"/g))assert(fs.existsSync(path.join(root,match[1])),match[1]);
 assert(html.includes('fixture &lt;agumon&gt;'));assert.equal(JSON.stringify(data),before);
 console.log('PASS: all 10 stages, single explorer list, existing assets, HTML escaping, unchanged ranking data');
 }catch(e){console.error(e);process.exitCode=1;}});
