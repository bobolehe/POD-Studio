from pathlib import Path
import json,zipfile,re,shutil
from package import cells
r=Path(__file__).resolve().parent
for name in ['model.cjs','package.py','author.mjs'] :shutil.copy2(r/name,r/(name+'.before-markets'))
for name in ['listing.html','listing.js']:shutil.copy2(r.parent/name,r.parent/(name+'.before-markets'))
u=json.loads((r/'source-schema.json').read_text('utf8'));p='D:/codex/WALL_ART (1).xlsm'
with zipfile.ZipFile(p) as z:d=cells(z,'xl/worksheets/sheet5.xml')
c={'source':p,'part':'xl/worksheets/sheet5.xml','headers':{k:v for k,v in d.items() if int(re.search(r'\d+$',k)[0])<=6}}
(r/'ca-source-schema.json').write_text(json.dumps(c,ensure_ascii=False),encoding='utf8')
def fields(s):return {k[:-1]:v for k,v in s['headers'].items() if re.fullmatch('[A-Z]+5',k) and v}
def norm(v):return re.sub(r'\[(marketplace_id|language_tag|content_language)=[^]]+\]','',v)
b={norm(v):k for k,v in fields(c).items()}
m={k:b.get(norm(v)) for k,v in fields(u).items()}
(r/'markets.json').write_text(json.dumps({'UK':{'currency':'GBP','schemaFile':'source-schema.json','columns':289,'lastColumn':'KC','map':{k:k for k in fields(u)}},'CA':{'currency':'CAD','schemaFile':'ca-source-schema.json','columns':305,'lastColumn':'KS','map':m}},ensure_ascii=False,indent=2),encoding='utf8')
p=r/'model.cjs';s=p.read_text('utf8');s=s.replace("const crypto=require('crypto');","const markets=require('./markets.json');")
s=s.replace('function build(input){','function buildBase(input){')
s=s.replace('module.exports={build,SIZES,IMAGE_COLS};', '''function build(input){
 const market=input.market||'UK',config=markets[market];if(!config)throw Error('请选择英国或加拿大单站模板');
 const plan=buildBase(input);const exportRows=plan.rows.map(row=>{const out={};for(const [col,value] of Object.entries(row)){const target=config.map[col];if(!target)throw Error('目标站点缺少字段：'+col);out[target]=market==='CA'&&value==='Centimetres'?'Centimeters':value}if(market==='CA')out[config.map.L]='Home & Kitchen > Artwork > Posters & Prints (2223982011)';return out});
 return {...plan,market,currency:config.currency,columns:config.columns,lastColumn:config.lastColumn,exportRows,imageMap:plan.imageMap.map(x=>({...x,field:config.map[x.field]}))};
}
module.exports={build,SIZES,IMAGE_COLS};''');p.write_text(s,encoding='utf8')
p=r/'author.mjs';s=p.read_text('utf8').replace('plan.rows.map(r=>{const a=Array(289)','(plan.exportRows||plan.rows).map(r=>{const a=Array(plan.columns||289)').replace("'A1:KC'+matrix.length","'A1:'+ (plan.lastColumn||'KC')+matrix.length");p.write_text(s,encoding='utf8')
p=r/'package.py';s=p.read_text('utf8');s=s.replace("folder=Path(folder);schema=json.loads((ROOT/'source-schema.json').read_text('utf8'));src=Path(schema['source']);part=schema['part'];plan=json.loads((folder/'plan.json').read_text('utf8'))", "folder=Path(folder);plan=json.loads((folder/'plan.json').read_text('utf8'));configs=json.loads((ROOT/'markets.json').read_text('utf8'));config=configs[plan.get('market','UK')];schema=json.loads((ROOT/config['schemaFile']).read_text('utf8'));src=Path(schema['source']);part=schema['part'];plan['rows']=plan.get('exportRows',plan['rows'])")
s=s.replace('spans="1:289"','spans="1:{config[\"columns\"]}"').replace('A1:KC{len(plan["rows"])+6}','A1:{config["lastColumn"]}{len(plan["rows"])+6}')
s=s.replace("report={'rows':11", "report={'market':plan.get('market','UK'),'currency':plan.get('currency','GBP'),'rows':11")
p.write_text(s,encoding='utf8')
p=r.parent/'web/listing.html';s=p.read_text('utf8').replace('基于现有英国站 WALL_ART 模板','按所选英国 / 加拿大单站 WALL_ART 模板').replace('<h2>1. 素材与商品文案</h2>','<h2>1. 素材与商品文案</h2><label>目标站点<select id="market"><option value="UK">英国 · GBP · 单站模板</option><option value="CA">加拿大 · CAD · 单站模板</option></select></label>')
s=s.replace('英国站配送模板名','<span id="shippingLabel">英国站配送模板名</span>').replace('<th>售价GBP</th>','<th id="priceLabel">售价GBP</th>');p.write_text(s,encoding='utf8')
p=r.parent/'web/listing.js';s=p.read_text('utf8').replace("const data={product:","const data={market:$('market').value,product:")
s=s.replace("['product','brand','origin','shipping']","['market','product','brand','origin','shipping']")
s=s.replace("const p=JSON.parse(await file.text());","const p=JSON.parse(await file.text());p.market=p.market||'UK';if(!['UK','CA'].includes(p.market))throw Error('不支持的站点配置');")
s=s.replace("$('status').textContent='已加载产品配置'","marketLabels();$('status').textContent='已加载'+$('market').value+'产品配置'")
s=s.replace("'JD-'+data.designId+'-'","'JD-'+data.market+'-'+data.designId+'-'")
s+="\nfunction marketLabels(){const ca=$('market').value==='CA';$('priceLabel').textContent='售价'+(ca?'CAD':'GBP');$('shippingLabel').textContent=(ca?'加拿大':'英国')+'站配送模板名'}\n$('market').onchange=()=>{document.querySelectorAll('[data-key=price]').forEach(e=>e.value='');$('shipping').value='';$('rows').replaceChildren();$('issues').replaceChildren();$('downloads').replaceChildren();marketLabels();$('status').textContent='已切换站点，售价和配送模板已清空，请按目标站点重新填写或加载配置。'};\n"
p.write_text(s,encoding='utf8')
