/* Sequential bounded-memory writer. A receipt is committed only after the PNG closes. */
(function(root){
const encode=new TextEncoder();
async function digest(blob){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function write(dir,name,blob){const handle=await dir.getFileHandle(name,{create:true}),stream=await handle.createWritable();try{await stream.write(blob);await stream.close()}catch(e){try{await stream.abort()}catch{}throw e}}
async function read(dir,name){try{return await (await dir.getFileHandle(name)).getFile()}catch(e){if(e.name==='NotFoundError')return null;throw e}}
function clean(s){return s.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[. ]+$/,'').slice(0,70)||'image'}
async function run({files,jobs,directory,version,render,stop=()=>false,progress=()=>{},preview=()=>{}}){
 const total=files.length*jobs.length,stats={total,done:0,success:0,skipped:0,failed:0,stopped:false};
 const runDir=await directory.getDirectoryHandle('product-'+clean(jobs[0].sku)+'-'+version.slice(0,16),{create:true});
 for(const file of files){if(stop())break;
 let dir;try{if(file.size>50*1024*1024)throw Error('素材超过50MB');const hash=await digest(file);dir=await runDir.getDirectoryHandle('image_'+clean(file.name)+'_'+hash.slice(0,16),{create:true})}catch(e){stats.failed+=jobs.length;stats.done+=jobs.length;progress({...stats,error:file.name+': '+e.message});continue}
 for(const job of jobs){if(stop())break;const name=clean(job.scene)+'.png',receipt=name+'.done.json';
 try{
 const recordFile=await read(dir,receipt),png=await read(dir,name);let record;try{record=recordFile&&JSON.parse(await recordFile.text())}catch{}
 if(record?.version===version&&png&&png.size===record.size&&await digest(png)===record.sha256){stats.skipped++}
 else{const blob=await render(file,job);await write(dir,name,blob);await write(dir,receipt,new Blob([JSON.stringify({version,size:blob.size,sha256:await digest(blob)})]));stats.success++;preview(blob)}
 }catch(e){stats.failed++;progress({...stats,error:file.name+' / '+job.scene+': '+e.message})}
 stats.done++;progress({...stats});await new Promise(r=>setTimeout(r,0));
 }}stats.stopped=stop();await write(runDir,'最近任务记录.json',new Blob([JSON.stringify({...stats,created:new Date().toISOString(),files:files.map(f=>f.name),templates:jobs.map(j=>j.scene)},null,2)]));return stats;
}
root.ProductBatch={run,digest,write};
})(typeof window==='undefined'?globalThis:window);
