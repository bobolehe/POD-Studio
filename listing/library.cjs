const fs=require('fs/promises'),path=require('path'),crypto=require('crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const PRODUCTS={landscape:'MQ19201068',portrait:'MQ19201067',tinHorizontal:'MG17601058',tinVertical:'GY09031681',cup:'QC1104087',blanketVertical:'JJ0519910',blanketHorizontal:'JJ0519911',posterVertical:'GY09031325',posterHorizontal:'GY09031323'};
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
async function readBody(req,max){const chunks=[];let size=0;for await(const b of req){size+=b.length;if(size>max)throw Error('文件或请求过大');chunks.push(b)}return Buffer.concat(chunks)}
function createLibrary(root){
 const locks=new Map();
 async function locked(key,fn){if(locks.has(key))throw Error('此保存任务正在处理，请稍后重试');locks.set(key,true);try{return await fn()}finally{locks.delete(key)}}
 function folder(id){if(!uuid.test(id))throw Error('记录编号无效');return path.join(root,id)}
 async function read(id){return JSON.parse(await fs.readFile(path.join(folder(id),'record.json'),'utf8'))}
 async function write(r){const f=path.join(folder(r.id),'record.json');await fs.writeFile(f+'.tmp',JSON.stringify(r,null,2));await fs.rename(f+'.tmp',f)}
 async function list(){await fs.mkdir(root,{recursive:true});const out=[];for(const id of await fs.readdir(root)){if(!uuid.test(id))continue;try{const r=await read(id);out.push(r)}catch{}}return out.sort((a,b)=>b.created.localeCompare(a.created))}
 async function begin(data){return locked('create',async()=>{
  if(!Object.hasOwn(PRODUCTS,data.product)||!/^[a-f0-9]{64}$/.test(data.sourceHash))throw Error('产品或素材摘要无效');
  if(!Array.isArray(data.scenes)||!data.scenes.length||data.scenes.length>32||new Set(data.scenes).size!==data.scenes.length||data.scenes.some(s=>!(/^(white|light|dark|other|scene\d{1,2})$/).test(s)))throw Error('场景列表无效');
  if(typeof data.profile!=='string'||data.profile.length>2000)throw Error('版本参数无效');
  const key=hash(JSON.stringify([data.sourceHash,data.product,data.scenes,data.profile]));await fs.mkdir(path.join(root,'keys'),{recursive:true});
  const keyPath=path.join(root,'keys',key+'.json');try{const id=JSON.parse(await fs.readFile(keyPath,'utf8')).id;return await read(id)}catch(e){if(e.code!=='ENOENT')throw e}
  const r={id:crypto.randomUUID(),product:data.product,productSku:PRODUCTS[data.product],sourceName:String(data.sourceName||'素材').slice(0,200),sourceHash:data.sourceHash,profile:data.profile,scenes:data.scenes,status:'saving',images:{},created:new Date().toISOString()};
  await fs.mkdir(folder(r.id));await write(r);await fs.writeFile(keyPath,JSON.stringify({id:r.id}));return r;
 })}
 async function put(id,asset,b){return locked(id,async()=>{const r=await read(id);if(asset!=='source'&&!r.scenes.includes(asset))throw Error('场景不属于此记录');const png=b.length>=24&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));const jpg=b.length>=4&&b[0]===255&&b[1]===216;
  if(!png&&!jpg||asset!=='source'&&!png)throw Error('仅接受PNG/JPG素材及PNG效果图');
  if(asset!=='source'&&(b.readUInt32BE(16)!==1000||b.readUInt32BE(20)!==1000))throw Error('效果图需为1000×1000 PNG');
  const sha256=hash(b);if(asset==='source'&&sha256!==r.sourceHash)throw Error('素材摘要不一致');
  if(r.status==='saved'){const old=asset==='source'?r.source:r.images[asset];if(old?.sha256!==sha256)throw Error('已保存结果为只读快照');return r}
  const name=asset+(png?'.png':'.jpg'),f=path.join(folder(id),name);await fs.writeFile(f+'.tmp',b);await fs.rename(f+'.tmp',f);const entry={name,size:b.length,sha256,mime:png?'image/png':'image/jpeg'};if(asset==='source')r.source=entry;else r.images[asset]=entry;await write(r);return r;
 })}
 async function finish(id){return locked(id,async()=>{const r=await read(id);if(!r.source||r.scenes.some(s=>!r.images[s]))throw Error('素材或场景尚未保存完整，可重新执行续存');for(const entry of [r.source,...Object.values(r.images)]){const b=await fs.readFile(path.join(folder(id),entry.name));if(hash(b)!==entry.sha256)throw Error('文件完整性校验失败')}r.status='saved';await write(r);return r})}
 async function asset(id,name){const r=await read(id),entry=name==='source'?r.source:r.images[name];if(!entry)throw Error('图片未保存');return {entry,data:await fs.readFile(path.join(folder(id),entry.name))}}
 async function handle(req,res,url,json){const bits=url.pathname.split('/').filter(Boolean);if(bits[0]!=='api'||bits[1]!=='library')return false;
  if(req.method==='GET'&&bits.length===2){json(res,200,{items:await list()});return true}
  if(req.method==='POST'&&bits.length===2){json(res,200,await begin(JSON.parse((await readBody(req,16000)).toString())));return true}
  if(req.method==='POST'&&bits[3]==='finish'&&bits.length===4){json(res,200,await finish(bits[2]));return true}
  if(req.method==='PUT'&&bits[3]==='asset'&&bits.length===5){json(res,200,await put(bits[2],bits[4],await readBody(req,bits[4]==='source'?50*1024*1024:15*1024*1024)));return true}
  if(req.method==='GET'&&bits[3]==='asset'&&bits.length===5){const a=await asset(bits[2],bits[4]);res.writeHead(200,{'Content-Type':a.entry.mime,'X-Content-Type-Options':'nosniff'});res.end(a.data);return true}
  json(res,404,{error:'Unknown library endpoint'});return true;
 }
 return {begin,put,finish,read,list,asset,handle};
}
module.exports={createLibrary,hash};
