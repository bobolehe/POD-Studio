"""Compile the common UI shell/theme inline for both existing local static servers.
No changes to rendering, template data, form IDs, or workflow scripts.
"""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parent.parent
css=(ROOT/'ui/theme.css').read_text('utf8')
pages=[('index.html','单张工作台','选择产品、上传素材，调整裁切并生成效果图。'),('product-batch.html','整产品批量生成','一个产品的全部模板，逐张保存，支持断点续跑。'),('batch.html','自选模板生成','自由组合素材与模板，生成后打包下载 ZIP。'),('library.html','生成列表','查看已保存的素材与效果图，勾选帆布画用于生成商品表格。'),('listing.html','商品表格生成','图片与商品数据一起准备，按英国或加拿大单站模板导出草稿。')]
# Temporarily hide custom template generation; retain the page and implementation.
nav_pages=[item for item in pages if item[0]!='batch.html']
def navigation(filename):
 return ''.join('<a href="'+('http://127.0.0.1:8767/'+f if f in ['listing.html','library.html'] else 'http://127.0.0.1:8766/'+('' if f=='index.html' else f))+'"'+(' aria-current="page"' if f==filename else '')+'>'+t+'</a>' for f,t,_ in nav_pages)
for filename,title,subtitle in pages:
 p=ROOT/'web'/filename;s=p.read_text('utf8')
 if '<!-- unified-ui -->' in s:
  s=re.sub(r'(<nav class="app-nav"[^>]*>).*?</nav>',lambda m:m[1]+navigation(filename)+'</nav>',s,flags=re.S)
  s=re.sub(r'<!-- unified-theme -->.*?<!-- /unified-theme -->','<!-- unified-theme --><style>'+css+'</style><!-- /unified-theme -->',s,flags=re.S)
  if filename!='index.html':
   step=[0]
   def number_heading(m):
    step[0]+=1
    return '<h2>'+str(step[0]).zfill(2)+' / '
   s=re.sub(r'<h2>(?:\d+[. /]+)?',number_heading,s)
  p.write_text(s,'utf8');continue
 (ROOT/'ui'/('before-'+filename)).write_text(s,'utf8')
 theme='<!-- unified-theme --><style>'+css+'</style><!-- /unified-theme -->'
 nav=navigation(filename)
 shell='<body class="'+('workbench' if filename=='index.html' else 'workflow')+'"><!-- unified-ui --><header class="app-header"><a class="app-brand" href="http://127.0.0.1:8766/">产品效果工作台</a><span>本地制作 · 图片生成 · 商品表格</span></header><nav class="app-nav" aria-label="功能导航">'+nav+'</nav>'
 heading='<div class="page-heading"><h1>'+title+'</h1><p>'+subtitle+'</p></div>'
 # Place the common stylesheet after legacy page rules so existing geometry can remain.
 end=s.index('</style>')+len('</style>');s=s[:end]+theme+s[end:]
 if filename=='index.html':
  s=re.sub(r'<header>.*?</header>',shell,s,count=1,flags=re.S).replace('<main>','<main class="app-content">',1)
 else:
  start=s.index('<h1>');end=s.index('<section>',start)
  # Listing draft notice is functional guidance; keep it in the page intro.
  intro=s[start:end];warning=re.search(r'<p class="warn">.*?</p>',intro,re.S)
  replacement=heading+(warning[0] if warning else '')
  s=s[:start]+replacement+s[end:]
  if filename=='batch.html':s=s.replace('<main>',shell+'<main class="app-content">',1)
  else:
   pos=s.index('<div class="page-heading">');s=s[:pos]+shell+'<main class="app-content">'+s[pos:]
   pos=s.index('<iframe') if '<iframe' in s else s.index('<script');s=s[:pos]+'</main>'+s[pos:]
  s=s.replace('</html>','<footer class="app-footer">本地制作 · 原始素材保留 · 商品表格为待审核草稿</footer></body></html>')
 p.write_text(s,'utf8')
 print(filename)
