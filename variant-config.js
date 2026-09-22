(function(root){
'use strict';
const SIZES=[[8,12],[12,18],[16,24],[20,30],[24,36]],MAX=50;
function defaults(product='portrait'){return ['framed','unframed'].flatMap(frame=>SIZES.map(([w,h])=>({frame,widthIn:product==='landscape'?h:w,heightIn:product==='landscape'?w:h})))}
function dimension(value,name){
 if(!['number','string'].includes(typeof value)||!/^\d+(?:\.\d{1,2})?$/.test(String(value).trim()))throw Error(name+'请填写正数，最多两位小数');
 const n=Number(value);if(n<=0||n>120)throw Error(name+'需大于0且不超过120英寸');return n;
}
function normalize(rows,{allowLegacy=false}={}){
 if(!Array.isArray(rows)||rows.length<1||rows.length>MAX)throw Error('请配置1–50条规格');
 const legacy=allowLegacy&&rows.length===10&&rows.every(v=>v&&typeof v==='object'&&!Array.isArray(v)&&!['frame','widthIn','heightIn'].some(k=>Object.hasOwn(v,k)));
 const seen=new Set();
 return rows.map((raw,i)=>{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('规格行格式错误');
  const v=legacy?{...raw,...defaults()[i]}:raw;
  if(!['framed','unframed'].includes(v.frame))throw Error('第'+(i+1)+'行请选择有框或无框');
  const widthIn=dimension(v.widthIn,'第'+(i+1)+'行宽度'),heightIn=dimension(v.heightIn,'第'+(i+1)+'行高度');
  const key=v.frame+':'+widthIn+'x'+heightIn;if(seen.has(key))throw Error('重复规格：'+(v.frame==='framed'?'有框':'无框')+' '+widthIn+'×'+heightIn);seen.add(key);
  return {...v,frame:v.frame,widthIn,heightIn};
 });
}
const api={SIZES,MAX,defaults,normalize};if(typeof module==='object'&&module.exports)module.exports=api;else root.VariantConfig=api;
})(typeof window==='object'?window:globalThis);
