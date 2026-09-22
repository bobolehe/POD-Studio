const assert=require('node:assert/strict'),{build}=require('./model.cjs'),{normalize}=require('../variant-config.js'),fs=require('fs'),path=require('path');
const base={...require('./sample-input.json'),product:'portrait',variantSchema:2};
const variants=[{frame:'unframed',widthIn:10.5,heightIn:15.75,price:19.95,quantity:0},{frame:'framed',widthIn:12,heightIn:18,price:29.5},{frame:'framed',widthIn:20,heightIn:30,price:39.5}];
for(const market of ['UK','CA']){
 const plan=build({...base,market,variants});assert.equal(plan.rows.length,4);assert.equal(plan.rows[1].A,'JD-DEMO001-U-10.5X15.75');assert.equal(plan.rows[1].BH,'10.5x15.75inch(26.67x40.01cm)');assert.equal(plan.rows[1].ED,26.67);assert.equal(plan.rows[1].EB,40.01);assert.equal(plan.rows[0].AK,'Sizes: 10.5x15.75, 12x18, 20x30 inches.');assert.equal(plan.imageMap[0].scene,'other');assert.equal(plan.exportRows[1][market==='CA'?'FZ':'GD'],19.95);assert.equal(plan.exportRows[1][market==='CA'?'FV':'FZ'],0);
 const folder=path.join(__dirname,'outputs','editable-'+market);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'plan.json'),JSON.stringify(plan,null,2));
}
const one=build({...base,variants:variants.slice(0,1)});assert.equal(one.rows.length,2);assert.equal(one.rows[0].AL,'Frame options: Unframed.');assert(one.imageMap.every(v=>v.scene==='other'));
assert.equal(build({...base,variants:Array.from({length:50},(_,i)=>({frame:'framed',widthIn:i+1,heightIn:60}))}).rows.length,51);
for(const invalid of [[],[variants[0],variants[0]],[{...variants[0],widthIn:0}],[{...variants[0],heightIn:-1}],[{...variants[0],widthIn:120.01}],[{...variants[0],widthIn:2.555}],[{...variants[0],frame:'bad'}],[{price:1}],Array(51).fill(variants[0])])assert.throws(()=>build({...base,variants:invalid}));
assert.equal(normalize(Array.from({length:10},()=>({price:12})),{allowLegacy:true})[5].frame,'unframed');
assert.throws(()=>normalize(Array.from({length:10},()=>({price:12}))));
const landscape=build({...base,product:'landscape',variants:[{frame:'framed',widthIn:18,heightIn:12}]});assert.equal(landscape.rows[1].ED,30.48);assert.equal(landscape.rows[1].EB,45.72);assert(!landscape.issues.some(v=>v.startsWith('自定义尺寸比例')));
assert.deepEqual(normalize(JSON.parse(JSON.stringify(variants))),variants);
console.log('Editable specs passed: UK/CA, 1/3/50 variants, decimals, prices, dimensions, frame mapping, duplicate/invalid rejection, legacy config and JSON round trip.');
