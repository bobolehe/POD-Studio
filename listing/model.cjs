const markets=require('./markets.json');
const {SIZES,normalize}=require('../web/variant-config.js');
const IMAGE_COLS=['X','Y','Z','AA','AB','AC','AD','AE','AF'];
function text(v,max=500){v=String(v??'').trim();if(v.length>max||/^[=+@]/.test(v)||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v))throw Error('文字过长、以公式符号开头或含无效字符');return v}
function num(v,name,integer=false){if(v===''||v==null)return null;const n=Number(v);if(!Number.isFinite(n)||n<0||(integer&&!Number.isInteger(n)))throw Error(name+'需要非负'+(integer?'整数':'数字'));return n}
function buildBase(input){
 if(!['portrait','landscape'].includes(input.product))throw Error('第一版仅接入3:2横版和2:3竖版帆布画');
 const id=text(input.designId,18);if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,17}$/.test(id))throw Error('素材编号需为1–18位字母、数字、下划线或连字符');
 const subject=text(input.subject,65),detail=text(input.detail,500);if(!subject||!detail)throw Error('请填写素材英文主题和画面描述');
 const parent='JD-'+id,orientation=input.product==='portrait'?'Portrait':'Landscape',issues=[];
 const brand=text(input.brand,80),origin=text(input.origin,80),shipping=text(input.shipping,100);
 if(!brand)issues.push('品牌待填写');if(!input.gtinExempt)issues.push('商品编码/GTIN豁免待确认');if(!origin)issues.push('原产国待确认');if(!shipping)issues.push('配送模板待填写');
 if(!input.mappingConfirmed)issues.push('有框/无框图片分组及主图选择待人工核对');
 issues.push('草稿未通过亚马逊平台校验；上架前核对完整必填项及实际商品信息');
 const base={B:'WALL_ART',C:'Create or Replace (Full Update)',F:'COLOR/SIZE',I:brand,J:input.gtinExempt?'GTIN Exempt':'',L:'Home & Kitchen > Artwork > Posters & Prints (331991011)',AZ:'Canvas',BJ:'Rectangular',CN:orientation,DY:'Indoor',HO:'No',HP:'No',HN:origin};
 const jobs=['white','light','dark','scene3','scene4','scene5','scene6','other'];
 const supplied=input.images||{};const images={};for(const scene of jobs){const v=text(supplied[scene]||'',2000);if(v){let u;try{u=new URL(v)}catch{throw Error('图片链接格式错误：'+scene)}if(!['https:','http:'].includes(u.protocol)||u.username||u.password||['localhost','127.0.0.1'].includes(u.hostname))throw Error('图片需要公网HTTP(S)链接');images[scene]=v}}
 const mapping=input.mapping||{framed:jobs.slice(0,7),unframed:['other']};
 for(const k of ['framed','unframed']){if(!Array.isArray(mapping[k])||!mapping[k].length||mapping[k].length>9||new Set(mapping[k]).size!==mapping[k].length||mapping[k].some(x=>!jobs.includes(x)))throw Error('图片分组设置错误');}
 const specs=normalize(input.variants,{allowLegacy:input.variantSchema!==2});
 const sizeSummary=[...new Set(specs.map(v=>v.widthIn+'x'+v.heightIn))].join(', ');
 const frameLabels={framed:'Framed',unframed:'Unframed'};
 const frameSummary=[...new Set(specs.map(v=>frameLabels[v.frame]))].join(' and ');
 const ratio=input.product==='portrait'?2/3:3/2;
 if(specs.some(v=>Math.abs(v.widthIn/v.heightIn-ratio)>0.01))issues.push('自定义尺寸比例与所选效果图模板不一致：效果图仍按原模板裁切，请核对实物及生产图，不会按尺寸重绘模板');
 const rows=[],imageMap=[];const variants=[];
 const setImages=(r,frame)=>mapping[frame].forEach((scene,i)=>{r[IMAGE_COLS[i]]=images[scene]||'';imageMap.push({sku:r.A,field:IMAGE_COLS[i],scene,localFile:`images/${scene}.png`,url:images[scene]||'',status:images[scene]?'链接待访问验证':'待托管'})});
 const title=subject+' Canvas Wall Art';
 const copy=(size,frame)=>({G:title+(size?`, ${size}, ${frame}`:''),H:detail.slice(0,125),AH:detail+'\n\nCanvas wall art for indoor display. '+(size?`Size: ${size}. ${frame}.`:'Available sizes: '+sizeSummary+' inches. Frame options: '+frameSummary+'.'),AI:'Design: '+detail,AJ:'Material: Canvas.',AK:size?'Size: '+size+'.':'Sizes: '+sizeSummary+' inches.',AL:frame?('Frame option: '+frame+'.'):'Frame options: '+frameSummary+'.',AM:'Orientation: '+orientation+'.',AN:text(input.keywords,249)});
 const p={...base,A:parent,D:'Parent',...copy(),EX:'Yes'};setImages(p,specs[0].frame);rows.push(p);
 for(const v of specs){
  const {frame,widthIn:w,heightIn:h}=v,label=frameLabels[frame],framed=frame==='framed';
  const price=num(v.price,'价格'),weight=num(v.weight,'商品净重'),quantity=num(v.quantity,'库存',true),handling=num(v.handling,'处理天数',true);
  if(price!==null&&price===0)throw Error('售价需大于0');
  const r={...base,A:parent+'-'+(framed?'F':'U')+'-'+w+'X'+h,D:'Child',E:parent,...copy(`${w}x${h} in`,label),BG:framed?'Frame-style':'Unframe-style',BH:`${w}x${h}inch(${(w*2.54).toFixed(2)}x${(h*2.54).toFixed(2)}cm)`,DN:framed?'Yes':'No',EB:+(Math.max(w,h)*2.54).toFixed(2),EC:'Centimeters',ED:+(Math.min(w,h)*2.54).toFixed(2),EE:'Centimeters',EX:'No',EY:'New',GD:price,FZ:quantity,GA:handling,FY:'Fulfilment by Merchant (Default)',HC:shipping,EU:weight,EV:weight===null?'':'Grams',BE:input.singlePiece?1:null};
  const parcel=['length','width','height','packageWeight'].map(k=>num(v[k],k));
  for(let j=0;j<4;j++){const [a,b]=[['HD','HE'],['HF','HG'],['HH','HI'],['HJ','HK']][j];r[a]=parcel[j];r[b]=parcel[j]===null?'':j===3?'Grams':'Centimetres'}
  if(price===null)issues.push(r.A+'：售价待填');if(quantity===null)issues.push(r.A+'：库存待填');if(handling===null)issues.push(r.A+'：处理天数待填');if(weight===null)issues.push(r.A+'：商品净重待填');if(parcel.some(x=>x===null))issues.push(r.A+'：包装参数待填');
  setImages(r,frame);rows.push(r);variants.push({sku:r.A,frame,widthIn:w,heightIn:h,price});
 }
 if(!input.singlePiece)issues.push('每个子体是否单幅待确认，Number of Items留空');
 if(imageMap.some(x=>!x.url))issues.push('存在待托管图片，表格中对应URL留空');
 if(Object.keys(images).length)issues.push('已填写图片链接仅做格式检查，尚未验证公网可访问性和内容');
 for(const row of rows)if(row.G.length>200)throw Error('生成标题过长');
 return {schema:'juding.amazon-draft.v2',product:input.product,designId:id,sourceFile:text(input.sourceFile,200),rows,imageMap,variants,issues:[...new Set(issues)],status:'DRAFT',created:new Date().toISOString()};
}
function build(input){
 const market=input.market||'UK',config=markets[market];if(!config)throw Error('请选择英国或加拿大单站模板');
 const plan=buildBase(input);const exportRows=plan.rows.map(row=>{const out={};for(const [col,value] of Object.entries(row)){const target=config.map[col];if(!target)throw Error('目标站点缺少字段：'+col);out[target]=market==='CA'&&value==='Centimetres'?'Centimeters':value}if(market==='CA')out[config.map.L]='Home & Kitchen > Artwork > Posters & Prints (2223982011)';return out});
 return {...plan,market,currency:config.currency,columns:config.columns,lastColumn:config.lastColumn,exportRows,imageMap:plan.imageMap.map(x=>({...x,field:config.map[x.field]}))};
}
module.exports={build,SIZES,IMAGE_COLS};
