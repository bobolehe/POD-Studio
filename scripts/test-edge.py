from PIL import Image
from pathlib import Path
import json
p=Path(r'D:\codex\聚鼎设计页功能调研');rows=[]
for key,filename,left,right,yL,yR in [('portrait','MQ19201067-portrait.jpg',269,789,906,882),('landscape','MQ19201068-landscape.jpg',79,956,802,785)]:
 base=Image.open(p/filename).convert('RGB');old=Image.open(p/f'corner-fixed-{key}.png').convert('RGB');new=Image.open(p/f'edge-fixed-{key}.png').convert('RGB')
 outside=0;improved=0
 for x in range(left+4,right-4):
  edge=yL+(yR-yL)*(x-left)/(right-left)
  for y in range(int(edge)+5,min(1000,int(edge)+20)):
   outside+=base.getpixel((x,y))!=new.getpixel((x,y))
  for y in range(int(edge)-1,int(edge)+3):
   a=old.getpixel((x,y));b=new.getpixel((x,y))
   if max(a)-min(a)<8 and max(b)-min(b)>12:improved+=1
 assert outside==0,(key,outside)
 assert improved>0,(key,improved)
 rows.append(dict(product=key,outer_shadow_changed_pixels=outside,neutral_edge_pixels_now_colored=improved))
print(json.dumps(rows,ensure_ascii=False));(p/'tests/edge-test-results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
