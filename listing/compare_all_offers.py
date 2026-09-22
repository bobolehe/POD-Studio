from pathlib import Path
import collections
root=Path('D:/codex/聚鼎设计页功能调研/listing')
exec((root/'compare_ca_uk.py').read_text('utf-8-sig').split('\nu=read(')[0])
a=read('D:/codex/WALL_ART (1).xlsm');b=read('D:/codex/WALL_ART (2).xlsm')
x={v['key']:(c,v['label'])for c,v in a['fields'].items()};y={v['key']:(c,v['label'])for c,v in b['fields'].items()}
new=[(k,*y[k])for k in y.keys()-x.keys()];removed=[(k,*x[k])for k in x.keys()-y.keys()];same=sum(x[k][0]==y[k][0] for k in x.keys()&y.keys())
print('SUMMARY',json.dumps({'oldColumns':len(x),'newColumns':len(y),'newLastColumn':list(b['fields'])[-1],'sameColumn':same,'common':len(x.keys()&y.keys()),'added':len(new),'removed':removed,'settings':b['settings'],'sheets':b['sheets']},ensure_ascii=False))
print('ADDED_FAMILIES',collections.Counter(re.split(r'[\[#]',k)[0] for k,c,l in new))
print('PRICES',[(c,v['label'],v['key'])for c,v in b['fields'].items() if v['key'].startswith('purchasable_offer') and '[audience=ALL]' in v['key'] and '.our_price#' in v['key']])
print('FIELDS_MOVED_SAMPLE',[(x[k],y[k])for k in x.keys()&y.keys() if x[k][0]!=y[k][0]][:10])
print('CONTENT_MARKETS',collections.Counter(re.search(r'\[marketplace_id=([^]]+)',v['key'])[1] for v in b['fields'].values() if re.search(r'\[marketplace_id=([^]]+)',v['key']) and v['key'].startswith(('item_name[','bullet_point[','product_description['))))
print('ADDED_NONOFFER',[(k,c,l)for k,c,l in new if not k.startswith(('purchasable_offer','fulfillment_availability','merchant_shipping_group'))][:30])
(root/'all-offers-comparison.json').write_text(json.dumps({'singleCA':a,'allOffers':b,'added':new,'removed':removed},ensure_ascii=False,indent=2),encoding='utf8')
