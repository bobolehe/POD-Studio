const {build}=require('./model.cjs');
async function buildLibrary(input,library){
 if(!Array.isArray(input.items)||!input.items.length||input.items.length>500)throw Error('请选择1–500条已保存帆布画');
 if(new Set(input.items.map(x=>x.id)).size!==input.items.length)throw Error('请勿重复选择记录');
 const plans=[],sources=new Set();for(const selected of input.items){const record=await library.read(selected.id);if(record.status!=='saved')throw Error(record.sourceName+'尚未保存完成');if(!['landscape','portrait'].includes(record.product))throw Error('商品表格目前仅支持帆布画');
  const sourceKey=record.product+':'+record.sourceHash;if(sources.has(sourceKey))throw Error(record.sourceName+'：同一素材与产品选择了多个保存版本，请只保留一个版本');sources.add(sourceKey);
  const p=build({...input,product:record.product,designId:record.id.replaceAll('-','').slice(0,18),sourceFile:record.sourceName,subject:selected.subject,detail:selected.detail,images:{}});
  p.imageMap=p.imageMap.map(m=>({...m,recordId:record.id,sourceName:record.sourceName,localFile:record.images[m.scene]?record.id+'/'+record.images[m.scene].name:null,assetUrl:record.images[m.scene]?'/api/library/'+record.id+'/asset/'+m.scene:null,status:record.images[m.scene]?'本地已保存，公网链接待补':'此场景未保存，图片待补'}));
  if(p.imageMap.some(x=>!x.assetUrl))p.issues.push(record.sourceName+'：部分规格所需场景未保存，相关图片待补');p.design={id:record.id,sourceName:record.sourceName,product:record.product};plans.push(p);
 }
 const rows=plans.flatMap(p=>p.rows);if(rows.length>10000)throw Error('单次表格最多10000行，请减少选择记录或规格数量');if(new Set(rows.map(r=>r.A)).size!==rows.length)throw Error('SKU重复，请分开导出');
 return {...plans[0],schema:'juding.amazon-library-draft.v1',rows,exportRows:plans.flatMap(p=>p.exportRows),imageMap:plans.flatMap(p=>p.imageMap),variants:plans.flatMap(p=>p.variants),designs:plans.map(p=>p.design),issues:[...new Set(plans.flatMap(p=>p.issues))]};
}
module.exports={buildLibrary};
