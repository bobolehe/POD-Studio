from pathlib import Path
import sys,zipfile,re,json,xml.etree.ElementTree as E
sys.path.insert(0,'D:/codex/2026-09-19-amazon-sku-viewer')
from prepare_listing_copy import read_cells,PART
src=Path('D:/codex/2026-09-20-amazon-512-copy-audit/outputs/WALL_ART_UK_512组_逐图审核_主题角色补充版.xlsm')
with zipfile.ZipFile(src) as z:
 d=read_cells(z); print(z.read('xl/workbook.xml').decode()[:3500])
 for k,v in d.items():
  if re.search(r'\d+$',k)[0] in ['4','5','6'] and v: print(k,v)
 print('FIRST GROUP')
 for n in [7,8,12,13,17]:print(n,{re.sub(r'\d+$','',k):v for k,v in d.items() if re.search(r'\d+$',k)[0]==str(n) and v})
Path('D:/codex/聚鼎设计页功能调研/listing/source-schema.json').write_text(json.dumps({'source':str(src),'part':PART,'headers':{k:v for k,v in d.items() if int(re.search(r'\d+$',k)[0])<=6},'reference':[{re.sub(r'\d+$','',k):v for k,v in d.items() if re.search(r'\d+$',k)[0]==str(n) and v} for n in range(7,18)]},ensure_ascii=False,indent=2),encoding='utf8')
