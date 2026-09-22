const http=require('http'),fs=require('fs'),fsp=fs.promises,path=require('path'),{execFile}=require('child_process'),{promisify}=require('util'),crypto=require('crypto');
const exec=promisify(execFile),root=path.resolve(__dirname,'..'),{build}=require('./model.cjs');
const runtime='C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const library=require('./library.cjs').createLibrary(path.join(root,'library-data'));
const {buildLibrary}=require('./library-plan.cjs');
const origins=['http://127.0.0.1:8767','http://localhost:8767','http://127.0.0.1:8766','http://localhost:8766'];
let working=false;
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
async function body(req){let b='',size=0;for await(const chunk of req){size+=chunk.length;if(size>1000000)throw Error('请求超过1MB');b+=chunk}return JSON.parse(b)}
http.createServer(async(req,res)=>{try{
 if(req.headers.host!=='127.0.0.1:8767'&&req.headers.host!=='localhost:8767')return json(res,403,{error:'Host rejected'});
 const url=new URL(req.url,'http://127.0.0.1:8767'),pathname=url.pathname;
 if(pathname.startsWith('/api/')){
  const origin=req.headers.origin;if(origin&&!origins.includes(origin))return json(res,403,{error:'Local origin required'});
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin')}
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.writeHead(204).end();return}
  if(req.method!=='GET'&&!origins.includes(origin))return json(res,403,{error:'Local origin required'});
  if(await library.handle(req,res,url,json))return;
 }
 if(pathname.startsWith('/api/')){
  if(req.method!=='POST')return json(res,405,{error:'POST required'});
  if(!origins.includes(req.headers.origin)||!req.headers['content-type']?.startsWith('application/json'))return json(res,403,{error:'Local origin required'});
  if(!['/api/preview','/api/generate','/api/preview-library','/api/generate-library'].includes(pathname))return json(res,404,{error:'Unknown endpoint'});
  const input=await body(req),plan=pathname.endsWith('-library')?await buildLibrary(input,library):build(input);if(pathname.startsWith('/api/preview'))return json(res,200,plan);
  if(working)return json(res,409,{error:'当前正在生成表格，请稍后重试'});
  working=true;try{
   const id=crypto.randomUUID(),folder=path.join(__dirname,'outputs',id);await fsp.mkdir(folder,{recursive:true});await fsp.writeFile(path.join(folder,'plan.json'),JSON.stringify(plan,null,2));
   await fsp.writeFile(path.join(folder,'图片对应清单.json'),JSON.stringify(plan.imageMap,null,2));
   await exec(runtime+'/node/bin/node.exe',[path.join(__dirname,'author.mjs'),folder],{windowsHide:true,timeout:300000,maxBuffer:1000000});
   await exec(runtime+'/python/python.exe',[path.join(__dirname,'package.py'),folder],{windowsHide:true,timeout:300000,maxBuffer:1000000,env:{...process.env,PYTHONIOENCODING:'utf-8'}});
   return json(res,200,{id,rows:plan.rows.length,status:'DRAFT',issues:plan.issues,files:['商品表格_草稿.xlsm','校验报告.json','plan.json','图片对应清单.json'].map(name=>({name,url:'/listing/outputs/'+id+'/'+encodeURIComponent(name)}))});
  }finally{working=false}
 }
 if(req.method!=='GET')return json(res,405,{error:'GET required'});
 const p=decodeURIComponent(pathname),file=path.resolve(root,'.'+(p==='/'?'/listing.html':p));
 if(p.startsWith('/library-data/')||!file.startsWith(root+path.sep)||p.includes('node_modules')||/\.(?:py|cjs|mjs|xlsm)$/i.test(p)&&!p.startsWith('/listing/outputs/'))return json(res,403,{error:'Not public'});
 const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.xlsm':'application/vnd.ms-excel.sheet.macroEnabled.12'})[ext]||'application/octet-stream');res.setHeader('Cache-Control','no-store');
 if(ext==='.xlsm')res.setHeader('Content-Disposition',"attachment; filename*=UTF-8''"+encodeURIComponent(path.basename(file)));
 const data=await fsp.readFile(file);res.end(data);
 }catch(e){json(res,e.code==='ENOENT'?404:400,{error:e.message})}
}).listen(8767,'127.0.0.1',()=>console.log('http://127.0.0.1:8767/listing.html'));
