from pathlib import Path
p=Path('index.html');s=p.read_text('utf8')
s=s.replace('<button id="export"','<button id="saveRecord" class="primary" disabled>保存当前效果到生成列表</button><p>保存当前场景和素材，刷新后仍可查看。全部场景请使用整产品批量生成。</p><button id="export"',1)
s=s.replace('<script>','<script src="library-client.js"></script><script>',1)
s=s.replace("['zoom','reset','rotate','export']","['zoom','reset','rotate','export','saveRecord']")
s=s.replace('function setArt(img,name){','let savedSource=null,librarySaving=false;\nfunction setArt(img,name,file=null){savedSource=file;')
s=s.replace('setArt(img,file.name)','setArt(img,file.name,file)')
pos=s.index('const originalScenes=')
s=s[:pos]+"""
$('#saveRecord').onclick=async()=>{
 if(!art||!ready||librarySaving)return;librarySaving=true;
 const controls=[...document.querySelectorAll('button,input,select')].map(el=>[el,el.disabled]);controls.forEach(([el])=>el.disabled=true);canvas.style.pointerEvents='none';
 const view=$('#layerView').value;
 try{
  $('#status').textContent='正在保存当前效果到本地生成列表…';
  let file=savedSource;
  if(!file){const source=document.createElement('canvas');source.width=art.width;source.height=art.height;source.getContext('2d').drawImage(art,0,0);const b=await new Promise(r=>source.toBlob(r,'image/png'));file=new File([b],'内置测试图案.png',{type:'image/png'})}
  $('#layerView').value='effect';render();const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));if(!blob)throw Error('效果图导出失败');
  const result=await LibraryClient.save({file,product:current,jobs:[{scene:sceneKey}],profile:'single:'+await LibraryClient.digest(blob),render:async()=>blob});
  $('#status').textContent='已保存到生成列表：'+result.sourceName+'（当前场景）。可从顶部生成列表继续查看。';
 }catch(e){$('#error').textContent='保存失败：'+e.message+'。请确认商品表格服务8767已启动。'}finally{$('#layerView').value=view;render();controls.forEach(([el,value])=>el.disabled=value);canvas.style.pointerEvents='';librarySaving=false}
};
window.addEventListener('beforeunload',e=>{if(librarySaving){e.preventDefault();e.returnValue=''}});
"""+s[pos:]
p.write_text(s,'utf8')
p=Path('product-batch.html');s=p.read_text('utf8').replace('<h2>02 / 选择输出文件夹</h2>','<h2>02 / 保存位置</h2><label>保存方式<select id="destination"><option value="library">保存到生成列表（推荐，可用于生成商品表格）</option><option value="folder">仅保存到自选文件夹（原方式）</option></select></label><p>生成列表保存在本机项目目录；完整记录可再次查看。相同素材和版本重试会跳过已保存场景。</p>')
s=s.replace('<script src="product-batch-core.js">','<script src="library-client.js"></script><script src="product-batch-core.js">');p.write_text(s,'utf8')
p=Path('product-batch.js');s=p.read_text('utf8').replace('||!directory||!n',"||(el('destination').value==='folder'&&!directory)||!n").replace("['files','product','folder']","['files','product','folder','destination']").replace("el('files').onchange=el('product').onchange=update;","el('files').onchange=el('product').onchange=el('destination').onchange=update;")
s=s.replace("el('folder').onclick=async()=>{try{","el('folder').onclick=async()=>{try{el('destination').value='folder';")
s=s.replace("try{const result=await ProductBatch.run", "try{if(el('destination').value==='library'){await saveBatchLibrary();return}const result=await ProductBatch.run")
s+="""
async function saveBatchLibrary(){
 const files=[...el('files').files],list=selected();let saved=0,failed=0;
 el('progress').max=files.length*list.length;el('progress').value=0;
 for(let i=0;i<files.length;i++){
  if(stopped)break;
  try{const record=await LibraryClient.save({file:files[i],product:list[0].product,jobs:list,profile:'batch:'+version,render:(file,job)=>api.render(file,job),stop:()=>stopped,progress:s=>{el('progress').value=i*list.length+s.done;el('status').textContent='保存素材 '+(i+1)+'/'+files.length+'，场景 '+s.done+'/'+s.total+(s.skipped?'（已保存，跳过）':'')}});if(record.stopped)break;saved++}
  catch(e){failed++;el('log').textContent+=files[i].name+'：'+e.message+'\\n'}
 }
 el('status').textContent=(stopped?'已停止':'处理完成')+'：'+saved+'条素材已完整保存到生成列表，失败'+failed+'条。未完成的记录可用相同素材重新执行续存。';
}
"""
p.write_text(s,'utf8')
