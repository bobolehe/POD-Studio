(function(root){
const base='http://127.0.0.1:8767';
async function request(route,method='GET',data){const binary=data&&typeof data.arrayBuffer==='function'&&typeof data.size==='number';const r=await fetch(base+'/api/library'+route,{method,headers:binary?{'Content-Type':data.type||'application/octet-stream'}:data?{'Content-Type':'application/json'}:{},body:binary?data:data?JSON.stringify(data):undefined});const p=await r.json();if(!r.ok)throw Error(p.error||'保存失败');return p}
async function digest(blob){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('')}
async function save({file,product,jobs,profile,render,stop=()=>false,progress=()=>{}}){
 const r=await request('','POST',{product,sourceName:file.name||'素材.png',sourceHash:await digest(file),scenes:jobs.map(j=>j.scene),profile});
 if(r.status==='saved'){await request('/'+r.id+'/finish','POST');progress({done:jobs.length,total:jobs.length,skipped:true});return r}
 if(!r.source)await request('/'+r.id+'/asset/source','PUT',file);
 for(let i=0;i<jobs.length;i++){if(stop())return {...r,stopped:true};const j=jobs[i];if(!r.images[j.scene]){const b=await render(file,j);await request('/'+r.id+'/asset/'+j.scene,'PUT',b)}progress({done:i+1,total:jobs.length})}
 return await request('/'+r.id+'/finish','POST');
}
root.LibraryClient={save,request,digest};
})(window);
