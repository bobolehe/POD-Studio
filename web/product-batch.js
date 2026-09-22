'use strict';
const el=id=>document.getElementById(id);let api,jobs=[],directory,version,busy=false,stopped=false,url;
function selected(){return jobs.filter(j=>j.product===el('product').value)}
function update(){el('folderControls').hidden=el('destination').value!=='folder';const list=selected(),n=el('files').files.length;el('scenes').textContent='全部 '+list.length+' 个模板：'+list.map(j=>j.scene).join('、');el('estimate').textContent=n+' 张素材 × '+list.length+' 个模板 = '+n*list.length+' 张效果图';el('start').disabled=busy||!api||!version||(el('destination').value==='folder'&&!directory)||!n;for(const id of ['files','product','folder','destination'])el(id).disabled=busy;el('stop').disabled=!busy}
el('files').onchange=el('product').onchange=el('destination').onchange=update;
el('folder').onclick=async()=>{try{el('destination').value='folder';if(!window.showDirectoryPicker)throw Error('请在 Chrome 或 Edge 中打开此页使用目录保存');directory=await window.showDirectoryPicker({mode:'readwrite'});el('folderName').textContent=directory.name;update()}catch(e){el('status').textContent=e.name==='AbortError'?'已取消选择':e.message}};
el('stop').onclick=()=>{stopped=true;el('status').textContent='当前图片保存后停止…'};
window.addEventListener('beforeunload',e=>{if(busy){e.preventDefault();e.returnValue=''}});
el('start').onclick=async()=>{busy=true;stopped=false;update();el('log').textContent='';try{if(el('destination').value==='library'){await saveBatchLibrary();return}const result=await ProductBatch.run({files:[...el('files').files],jobs:selected(),directory,version,render:(f,j)=>api.render(f,j),stop:()=>stopped,preview:blob=>{if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);el('preview').src=url;el('preview').hidden=false},progress:s=>{el('progress').max=s.total;el('progress').value=s.done;el('status').textContent=`处理 ${s.done}/${s.total}；新生成 ${s.success}；跳过 ${s.skipped}；失败 ${s.failed}`;if(s.error){el('log').textContent=(el('log').textContent+s.error+'\n').slice(-20000)}}});el('status').textContent=`${result.stopped?'已停止':'已完成'}：新生成 ${result.success}，已完成跳过 ${result.skipped}，失败 ${result.failed}，未处理 ${result.total-result.done}。结果已保存到文件夹。`}catch(e){el('status').textContent='任务停止：'+e.message+'。已落盘结果保留，可重新开始续跑。'}finally{busy=false;update()}};
async function init(){api=el('engine').contentWindow.batchAPI;if(!api?.ready()){setTimeout(init,300);return}jobs=api.catalog();for(const product of [...new Set(jobs.map(j=>j.product))]){const list=jobs.filter(j=>j.product===product),o=document.createElement('option');o.value=product;o.textContent=list[0].label.split(' / ')[0]+' · '+list[0].sku+' · '+list.length+'个模板';el('product').append(o)}version=await ProductBatch.digest(new Blob([(await (await fetch('/index.html')).text()).match(/<script\b[^>]*>[\s\S]*?<\/script>/g).join(''),JSON.stringify(jobs),'product-batch-v1']));el('status').textContent='已就绪，选择产品后自动包含全部模板';update()}
el('engine').addEventListener('load',()=>init().catch(e=>el('status').textContent=e.message));

async function saveBatchLibrary(){
 const files=[...el('files').files],list=selected();let saved=0,failed=0;
 el('progress').max=files.length*list.length;el('progress').value=0;
 for(let i=0;i<files.length;i++){
  if(stopped)break;
  try{const record=await LibraryClient.save({file:files[i],product:list[0].product,jobs:list,profile:'batch:'+version,render:(file,job)=>api.render(file,job),stop:()=>stopped,progress:s=>{el('progress').value=i*list.length+s.done;el('status').textContent='保存素材 '+(i+1)+'/'+files.length+'，场景 '+s.done+'/'+s.total+(s.skipped?'（已保存，跳过）':'')}});if(record.stopped)break;saved++}
  catch(e){failed++;el('log').textContent+=files[i].name+'：'+e.message+'\n'}
 }
 el('status').textContent=(stopped?'已停止':'处理完成')+'：'+saved+'条素材已完整保存到生成列表，失败'+failed+'条。未完成的记录可用相同素材重新执行续存。';
}
