from pathlib import Path
p=Path('listing.js');s=p.read_text('utf8');a=s.index('for(let i=0;i<10');b=s.index('for(const scene',a)
s=s[:a]+"""function variantRows(){return [...$('variants').rows].map(tr=>Object.fromEntries([...tr.querySelectorAll('[data-key]')].map(i=>[i.dataset.key,i.value])))}
function refreshSpecs(){
 const n=$('variants').rows.length;$('specCount').textContent=n+'条规格 → 1个父体 + '+n+'个子体';$('preview').textContent='检查'+(n+1)+'条商品记录';$('addVariant').disabled=busy||n>=VariantConfig.MAX;
 [...$('variants').rows].forEach((tr,i)=>{tr.querySelector('[data-remove]').disabled=busy||n<=1;tr.querySelector('[data-remove]').setAttribute('aria-label','删除第'+(i+1)+'条规格');for(const el of tr.querySelectorAll('[data-key]'))el.setAttribute('aria-label','第'+(i+1)+'行 '+({frame:'框型',widthIn:'宽度英寸',heightIn:'高度英寸',price:'售价',quantity:'库存',handling:'处理天数',weight:'净重',length:'包装长',width:'包装宽',height:'包装高',packageWeight:'包装重'}[el.dataset.key]))});
}
function invalidateSpecs(){refreshSpecs();$('rows').replaceChildren();$('issues').replaceChildren();$('downloads').replaceChildren();$('status').textContent='规格已修改，请重新检查商品记录。尺寸改变不会重绘效果图模板。'}
function addVariant(v={frame:'framed',widthIn:'',heightIn:''}){
 const tr=document.createElement('tr');
 for(const k of ['frame','widthIn','heightIn',...keys]){
  const cell=document.createElement('td'),el=document.createElement(k==='frame'?'select':'input');el.dataset.key=k;
  if(k==='frame'){for(const [value,label]of [['framed','有框'],['unframed','无框']]){const o=document.createElement('option');o.value=value;o.textContent=label;el.append(o)}}
  else{el.type='number';el.min=['widthIn','heightIn'].includes(k)?'0.01':'0';el.step=['quantity','handling'].includes(k)?'1':['widthIn','heightIn'].includes(k)?'0.01':'any';if(['widthIn','heightIn'].includes(k))el.max='120'}
  el.value=v[k]??'';cell.append(el);tr.append(cell);
 }
 const cell=document.createElement('td'),button=document.createElement('button');button.type='button';button.textContent='删除';button.dataset.remove='';button.onclick=()=>{tr.remove();invalidateSpecs()};cell.append(button);tr.append(cell);$('variants').append(tr);
}
function setVariantRows(rows){$('variants').replaceChildren();rows.forEach(addVariant);refreshSpecs()}
setVariantRows(VariantConfig.defaults($('product').value));
$('variants').addEventListener('input',invalidateSpecs);
$('addVariant').onclick=()=>{if($('variants').rows.length>=VariantConfig.MAX)return;addVariant();invalidateSpecs()};
$('resetVariants').onclick=()=>{if(!confirm('恢复默认10条规格会清空当前规格的售价、库存和包装参数，是否继续？'))return;setVariantRows(VariantConfig.defaults($('product').value));invalidateSpecs()};
"""+s[b:]
a=s.index("variants:[...$('variants').rows]");b=s.index(',mapping:',a);s=s[:a]+"variantSchema:2,variants:VariantConfig.normalize(variantRows())"+s[b:]
s=s.replace('e=>e.disabled=v)}','e=>e.disabled=v);refreshSpecs()}')
s=s.replace("$('status').textContent='已检查：1个父体 + 10个子体。以下待补项保留为空。'","$('status').textContent='已检查：1个父体 + '+p.variants.length+'个子体。以下待补项保留为空。'")
s=s.replace("$('saveConfig').onclick=()=>{const p=payload();","$('saveConfig').onclick=()=>{try{const p=payload();").replace('setTimeout(()=>URL.revokeObjectURL(u),1000)};',"setTimeout(()=>URL.revokeObjectURL(u),1000)}catch(e){$('status').textContent=e.message}};")
s=s.replace("p.market=p.market||'UK';","const specs=VariantConfig.normalize(p.variants,{allowLegacy:p.variantSchema!==2});p.market=p.market||'UK';")
a=s.index('if(p.variants?.length===10)');b=s.index("for(const k of ['framed','unframed'])",a);s=s[:a]+"setVariantRows(specs);$('rows').replaceChildren();$('issues').replaceChildren();$('downloads').replaceChildren();"+s[b:]
s=s.replace('+ 10个子体，保存到','+ ${plan.variants.length}个子体，保存到')
p.write_text(s,'utf8')
p=Path('listing.html');s=p.read_text('utf8').replace('1张素材、1个父体、10个子体','1张素材、1个父体、按配置生成子体').replace('5种尺寸来自现有表格。','默认5种尺寸来自现有表格，可编辑框型与宽高、添加或删除规格。').replace('<th>框型 / 英寸</th>','<th>框型</th><th>宽（英寸）</th><th>高（英寸）</th>').replace('<th>包装重g</th>','<th>包装重g</th><th>操作</th>').replace('<div class="scroll"><table><thead><tr><th>框型</th>','<div class="variant-actions"><button id="addVariant" type="button">＋ 添加规格</button><button id="resetVariants" type="button">恢复默认10条规格</button><span id="specCount" role="status"></span></div><p>宽高单位为英寸，可填两位小数；支持1–50条规格，单边大于0且不超过120英寸。相同框型与尺寸不可重复。自定义尺寸用于商品字段，效果图仍使用所选产品的原模板比例，请核对实物。</p><div class="scroll"><table><thead><tr><th>框型</th>',1).replace('<script src="listing.js">','<script src="variant-config.js"></script><script src="listing.js">');p.write_text(s,'utf8')
