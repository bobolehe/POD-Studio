import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const dir=process.argv[2],plan=JSON.parse(await fs.readFile(dir+'/plan.json','utf8'));
const w=Workbook.create(),s=w.worksheets.add('Rows');
function index(col){return [...col].reduce((a,c)=>a*26+c.charCodeAt(0)-64,0)-1}
const matrix=(plan.exportRows||plan.rows).map(r=>{const a=Array(plan.columns||289).fill(null);for(const [c,v] of Object.entries(r))a[index(c)]=v;return a});
s.getRange('A1:'+ (plan.lastColumn||'KC')+matrix.length).values=matrix;
s.getRange('A1:'+ (plan.lastColumn||'KC')+matrix.length).format.font={name:'Arial',size:10};
s.getRange('A1:A'+matrix.length).format.columnWidth=28;s.getRange('D1:F'+matrix.length).format.columnWidth=24;
w.recalculate();
console.log((await w.inspect({kind:'table',range:'Rows!A1:F3',tableMaxRows:3,tableMaxCols:6,maxChars:1500})).ndjson);
await(await SpreadsheetFile.exportXlsx(w)).save(dir+'/authored.xlsx');
// Compact acceptance view of exactly the authored values, without reformatting the Amazon template.
if(process.argv.includes('--preview')){
const view=w.worksheets.add('Review'),last=plan.rows.length+1;
view.getRange('A1:F'+last).values=[['SKU','Level','Parent SKU','Frame','Size','Price '+(plan.currency||'GBP')],...plan.rows.map(r=>[r.A,r.D,r.E||'',r.BG||'',r.BH||'',r.GD??null])];
view.getRange('A1:F'+last).format.font={name:'Arial',size:10};view.getRange('A1:F1').format.fill='#20374d';view.getRange('A1:F1').format.font.color='#ffffff';view.getRange('A1:F'+last).format.rowHeight=28;
for(const [c,width]of [['A',42],['B',12],['C',34],['D',20],['E',36],['F',15]])view.getRange(c+'1:'+c+last).format.columnWidth=width;
w.recalculate();const preview=await w.render({sheetName:'Review',range:'A1:F'+last,scale:1});await fs.writeFile(dir+'/review.png',new Uint8Array(await preview.arrayBuffer()));
}
