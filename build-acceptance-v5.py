from pathlib import Path
p=Path(r'D:\codex\聚鼎设计页功能调研')
html='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>V5 分层模板验收</title><style>body{font:15px system-ui;color:#21354a;background:#f3f5f8;margin:0;padding:28px}main{max-width:1360px;margin:auto}h1{font-size:26px}h2{margin-top:32px}p{line-height:1.8}a{color:#2567d5}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.two{grid-template-columns:repeat(2,1fr)}figure{min-width:0;margin:0;padding:16px;background:white;border-radius:12px;min-width:0}figcaption{font-weight:600;margin-bottom:12px}img{max-width:100%;display:block}svg{width:100%;display:block}.note{padding:16px;background:#e7eefc;border-radius:10px}.corners{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.zoom{overflow:auto;border:1px solid #e6e8ec}.zoom svg{width:320px;max-width:none}small{color:#66778b}@media(max-width:800px){.cards,.corners{grid-template-columns:1fr 1fr}}</style><main><h1>V5 / 分层模板验收</h1><p class="note">状态：技术检查通过，视觉效果待 Ethan 验收。此版是参照产品外形重新建立的独立模板，不是聚鼎 PSD 分层文件，也不保证光影完全一致。原来的 JPG 不再参与效果合成。</p><p><a href="/">打开 V5 工作台</a> · <a href="v5-tests.json">22 项技术测试记录</a></p><h2>第一步：检查图层独立性</h2><p>轮廓只规定产品范围；光影只规定明暗；投影独立放在轮廓外。正面与左侧使用同一外轮廓，不通过放大图片补白。</p><div class="cards">'''
for name,title in [('mask','轮廓遮罩'),('light','独立光影'),('shadow','独立投影')]:html+=f'<figure><figcaption>{title}</figcaption><img src="v5-portrait-{name}.png"></figure>'
html+='</div><h2>第二步：旧版与新版同图比较</h2><p>左右为相同测试素材、相同居中裁切。新版投影与明暗是重建效果，应同时检查是否符合真实商品观感。</p>'
for key,label in [('landscape','横版'),('portrait','竖版')]:
 html+=f'<h3>{label}</h3><div class="cards two"><figure><figcaption>旧版（带白底的 JPG 合成）</figcaption><img src="edge-fixed-{key}.png"></figure><figure><figcaption>V5（独立分层）</figcaption><img src="v5-{key}.png"></figure></div>'
html+='<h2>第三步：四角约 200% 放大</h2><p>查看顶部折角、左右端点与底边：应无灰白漏块、孤立尖角或矩形补丁。边界约一个像素的柔和过渡是抗锯齿，不应形成产品内部的连续浅色条带。</p>'
regions={'landscape':[(35,175),(890,180),(35,745),(890,735)],'portrait':[(235,75),(720,95),(235,845),(720,835)]}
for key,label in [('landscape','横版'),('portrait','竖版')]:
 html+=f'<h3>{label}</h3><div class="corners">'
 for (x,y),title in zip(regions[key],['左上','右上','左下','右下']):html+=f'<figure><figcaption>{title} / 200%</figcaption><div class="zoom"><svg viewBox="{x} {y} 160 100"><image href="v5-{key}.png" width="1000" height="1000"/></svg></div></figure>'
 html+='</div>'
html+='<h2>第四步：极端素材检查</h2><p>纯黑检查漏白；纯红检查无色底图残留；棋盘格检查正侧面接缝。两款的全不透明遮罩内部均无额外灰白像素，遮罩外均无素材写入。</p>'
for key,label in [('landscape','横版'),('portrait','竖版')]:
 html+=f'<h3>{label}</h3><div class="cards">'
 for kind,title in [('black','纯黑'),('red','纯红'),('checker','棋盘格与边框')]:html+=f'<figure><figcaption>{title}</figcaption><img src="v5-{key}-{kind}.png"></figure>'
 html+='</div>'
html+='''<h2>待确认的视觉验收项</h2><ul><li>顶部与底部没有连续浅色露底线。</li><li>四角平顺，左侧包边连接自然，无突出尖角。</li><li>新光影与厚度观感可以接受。</li><li>用实际业务素材导出后，在 100% 和 200% 下也可接受。</li></ul><p>测试图下载：<a href="v5-landscape-export.png" download>横版 PNG</a> · <a href="v5-portrait-export.png" download>竖版 PNG</a></p><p>这是商品效果预览，不是生产打印展开图；尚未实现其他场景、3D 旋转或精确实物尺寸建模。</p></main></html>'''
(p/'acceptance-v5.html').write_text(html,encoding='utf-8')

