from PIL import Image
from pathlib import Path
import json
p=Path(r'D:\codex\聚鼎设计页功能调研')
results=[]
for key,name,x0,x1,y0,y1 in [('portrait','MQ19201067-portrait.jpg',257,269,907,912),('landscape','MQ19201068-landscape.jpg',58,79,803,809)]:
 a=Image.open(p/name).convert('RGB'); b=Image.open(p/f'corner-fixed-{key}.png').convert('RGB')
 changed=[(x,y) for y in range(y0,y1) for x in range(x0,x1) if a.getpixel((x,y))!=b.getpixel((x,y))]
 results.append(dict(product=key,outside_corner_pixels_changed=len(changed),pass_test=not changed))
 assert not changed,(key,changed)
print(json.dumps(results,ensure_ascii=False))
(p/'tests/corner-test-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
