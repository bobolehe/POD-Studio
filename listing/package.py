"""Preserve the XLSM package; transfer Artifact Tool-authored values only into Template rows."""
import json,sys,re,zipfile,hashlib,xml.etree.ElementTree as E
from pathlib import Path
from xml.sax.saxutils import escape
ROOT=Path(__file__).resolve().parent
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def cells(z,part):
 ss=[''.join(t.text or '' for t in e.findall('.//m:t',NS)) for e in E.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',NS)] if 'xl/sharedStrings.xml' in z.namelist() else []
 out={}
 for c in E.fromstring(z.read(part)).findall('m:sheetData/m:row/m:c',NS):
  v=c.find('m:v',NS);out[c.get('r')]=''.join(t.text or '' for t in c.findall('.//m:t',NS)) if c.get('t')=='inlineStr' else (ss[int(v.text)] if c.get('t')=='s' else v.text) if v is not None else ''
 return out
def main(folder):
 folder=Path(folder);plan=json.loads((folder/'plan.json').read_text('utf8'));configs=json.loads((ROOT/'markets.json').read_text('utf8'));config=configs[plan.get('market','UK')];schema=json.loads((ROOT/config['schemaFile']).read_text('utf8'));src=Path(schema['source']);part=schema['part'];plan['rows']=plan.get('exportRows',plan['rows'])
 with zipfile.ZipFile(folder/'authored.xlsx') as z: authored=cells(z,'xl/worksheets/sheet1.xml')
 with zipfile.ZipFile(src) as z:
  xml=z.read(part).decode();data=re.search(r'<sheetData>(.*?)</sheetData>',xml,re.S);rows={int(m[1]):m.group() for m in re.finditer(r'<row\b[^>]*\br="(\d+)"[^>]*>.*?</row>',data[1],re.S)}
  before=cells(z,part)
  assert all(before.get(k)==v for k,v in schema['headers'].items()), 'Source template headers changed; re-register template'
  body=''.join(rows[n] for n in range(1,7));styles={}
  def column_name(n):
   result=''
   while n:n,k=divmod(n-1,26);result=chr(65+k)+result
   return result
  for c in E.fromstring(xml).findall('m:cols/m:col',NS):
   for n in range(int(c.get('min')),int(c.get('max'))+1):styles[column_name(n)]=c.get('style','0')
  for m in re.finditer(r'<c\b[^>]*\br="([A-Z]+)8"[^>]*>',rows.get(8,'')):
   style=re.search(r'\bs="(\d+)"',m.group());styles[m[1]]=style[1] if style else '0'
  for i,row in enumerate(plan['rows'],1):
   n=i+6;body+=f'<row r="{n}" spans="1:{config["columns"]}">'
   for col,val in sorted(row.items(),key=lambda x:(len(x[0]),x[0])):
    if val is None or val=='':continue
    got=authored.get(f'{col}{i}','');expected=str(val)
    if isinstance(val,(float,int)):assert float(got)==float(val),(col,i,got,val)
    else:assert got==expected,(col,i,got,val)
    style=styles.get(col,'0');body+=f'<c r="{col}{n}" s="{style}">'+f'<v>{got}</v></c>' if isinstance(val,(float,int)) else f'<c r="{col}{n}" s="{style}" t="inlineStr"><is><t xml:space="preserve">{escape(got)}</t></is></c>'
   body+='</row>'
  updated=xml[:data.start(1)]+body+xml[data.end(1):]
  updated=re.sub(r'<dimension\b[^>]*/>',f'<dimension ref="A1:{config["lastColumn"]}{len(plan["rows"])+6}"/>',updated,count=1)
  out=folder/'商品表格_草稿.xlsm'
  with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as target:
   for name in z.namelist():target.writestr(name,updated.encode() if name==part else z.read(name))
  with zipfile.ZipFile(out) as target:
   assert target.testzip() is None;after=cells(target,part)
   assert all(target.read(n)==z.read(n) for n in z.namelist() if n!=part)
   assert all(after.get(k)==v for k,v in before.items() if int(re.search(r'\d+$',k)[0])<=6)
   assert len([k for k,v in after.items() if re.match(r'^A\d+$',k) and int(k[1:])>=7 and v])==len(plan["rows"])
   assert not any(v in ('#REF!','#VALUE!','#DIV/0!') for v in after.values())
   by_row={}
   for k,v in after.items():
    match=re.fullmatch(r'([A-Z]+)(\d+)',k)
    if match and v!='':by_row.setdefault(int(match[2]),{})[match[1]]=v
   for i,row in enumerate(plan['rows'],7):
    actual=by_row.get(i,{})
    assert set(actual)=={k for k,v in row.items() if v is not None and v!=''}
    for col,value in row.items():
     if value is None or value=='':continue
     assert (float(actual[col])==float(value)) if isinstance(value,(float,int)) else actual[col]==str(value)
  report={'market':plan.get('market','UK'),'currency':plan.get('currency','GBP'),'rows':len(plan['rows']),'parents':sum(r.get('D')=='Parent' for r in plan['rows']),'children':sum(r.get('D')=='Child' for r in plan['rows']),'source_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'unchanged_other_package_parts':True,'headers_preserved':True,'status':'DRAFT','issues':plan['issues']}
 (folder/'校验报告.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
 print(json.dumps({**{k:v for k,v in report.items() if k!='issues'},'issue_count':len(report['issues'])},ensure_ascii=False))
if __name__=='__main__':main(sys.argv[1])
