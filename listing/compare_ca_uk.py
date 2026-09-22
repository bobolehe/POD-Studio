import zipfile,xml.etree.ElementTree as E,re,json,urllib.parse,sys
from pathlib import Path
sys.path.insert(0,'D:/codex/聚鼎设计页功能调研/listing')
from package import cells
N={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def read(p):
 with zipfile.ZipFile(p) as z:
  w=E.fromstring(z.read('xl/workbook.xml'));rels={r.get('Id'):r.get('Target') for r in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))};sheets={s.get('name'):'xl/'+rels[s.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')].lstrip('/') for s in w.find('m:sheets',N)}
  sheets={k:v.replace('xl/xl/','xl/') for k,v in sheets.items()};d=cells(z,sheets['Template']);fields={re.sub(r'\d+$','',k):{'label':d.get(re.sub(r'\d+$','4',k),''),'key':v} for k,v in d.items() if re.search(r'\d+$',k)[0]=='5' and v};settings=urllib.parse.parse_qs(d.get('A1',''));dd=cells(z,sheets.get('Dropdown Lists',sheets['Template']));names={x.get('name'):x.text for x in w.findall('m:definedNames/m:definedName',N)}
  def values(ref):
   m=re.search(r"!\$([A-Z]+)\$(\d+):\$[A-Z]+\$(\d+)",ref or '')
   return sorted(set(dd.get(f'{m[1]}{i}','') for i in range(int(m[2]),int(m[3])+1))-{''}) if m else []
  return {'path':p,'sheets':list(sheets),'fields':fields,'settings':{k:v for k,v in settings.items() if k in ['primaryMarketplaceId','contentLanguageTag','headerLanguageTag','timestamp','labelRow','attributeRow','dataRow','templateIdentifier']},'dropdowns':{k:values(v) for k,v in names.items() if 'Dropdown Lists' in (v or '')}}
def norm(v):return re.sub(r'\[language_tag=[^]]+\]','[language_tag=*]',re.sub(r'\[marketplace_id=[^]]+\]','[marketplace_id=*]',v))
u=read('D:/codex/2026-09-20-amazon-512-copy-audit/outputs/WALL_ART_UK_512组_逐图审核_主题角色补充版.xlsm');c=read('D:/codex/WALL_ART (1).xlsm')
a={norm(v['key']):(k,v) for k,v in u['fields'].items()};b={norm(v['key']):(k,v) for k,v in c['fields'].items()}
result={'UK':u,'CA':c,'uk_only':[a[k] for k in a.keys()-b.keys()],'ca_only':[b[k] for k in b.keys()-a.keys()],'common':len(a.keys()&b.keys()),'moved':[(a[k][0],b[k][0],a[k][1]['label'],b[k][1]['label']) for k in a.keys()&b.keys() if a[k][0]!=b[k][0]]}
p=Path('D:/codex/聚鼎设计页功能调研/listing/ca-uk-comparison.json');p.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
for k in ['UK','CA']:print(k,'sheets',result[k]['sheets'],'fields',len(result[k]['fields']),'settings',result[k]['settings'])
for k in ['common','uk_only','ca_only','moved']:print(k,json.dumps(result[k],ensure_ascii=False))
