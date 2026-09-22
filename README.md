# 印品工坊 · POD Studio

内置产品效果图生成、批量保存、生成列表与英国/加拿大帆布画商品表格草稿工具。

## 当前流程
选择产品 → 上传素材 → 生成并保存效果图 → 生成列表勾选 → 生成商品表格草稿。
图片公网托管及自动链接回填尚未接入。

## 启动与环境
- 图片工作台：Node.js 执行 `node server.cjs`，访问 http://127.0.0.1:8766/。
- 完整本地入口：运行 `启动.ps1`。商品表格服务使用 8767 端口。
- 当前脚本依赖原机器的 Node/Python/Artifact Tool 路径，迁移到其他电脑需调整启动脚本与 listing/server.cjs 的运行时路径。
- Amazon 源表格和 schema 含店铺相关信息，不随仓库发布。建表需在本地准备 listing/source-schema.json、listing/ca-source-schema.json 及对应原始表格，可参考 listing/inspect_source.py、listing/compare_ca_uk.py。
- 本地生成记录 library-data、导出文件 listing/outputs、依赖、日志及历史备份均排除于 Git。请另行备份。
- 功能使用说明见《生成列表使用说明.md》。仓库上传不代表跨机器部署已验收。

## 早期渲染说明
# 帆布画效果工作台 — V5

启动：在此目录运行 `node server.cjs`，打开 http://127.0.0.1:8766/ 。也可运行 启动.ps1。
验收页：http://127.0.0.1:8766/acceptance-v5.html 。

选择横/竖版、上传JPG/PNG、拖动画布、缩放旋转、下载1000×1000 PNG。素材只在本地浏览器处理，刷新不保留。
V5重新建立独立轮廓、光影及投影；图片JPG只作缩略图，不参与合成。可切换查看轮廓/光影/投影，下载始终导出效果图。
文件名带 mockup-v5，避免与旧文件混淆。

技术测试22项通过；实际文件上传与两款四角200%放大自检完成。视觉验收待用户确认，不保证与聚鼎原图的明暗完全一致。
模板源代码 template-v5.js；运行 python build-v5.py 更新内嵌页面。build-acceptance-v5.py 生成验收页。
细节见 V5验收报告.md；旧版本/历史报告保留供对照，当前交付以V5为准。

