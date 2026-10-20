# AI 交接说明

本压缩包是 `FukunHennan/edgeone-page` 在 `master` 提交
`bb5e39600de1ef6039974cd331f13f1c80378e4c` 的源码快照（2026-10-17）。
不包含 Git 历史、本地 `.env`、依赖目录或构建产物。压缩包中的旧 Hexo
源码和主题仍用于迁移核对及部分资源准备；生产入口已经是 Astro。

## 本地运行

- Node.js 22.23.2（见 `.node-version`），npm 10.x。
- `npm ci`
- `npm run dev`：启动 Astro 本地开发服务。
- `npm run check`：检查双语内容、类型、生产构建及产物。
- `npm run build`：生成 `astro-dist/`。

## 主要位置

- `astro-src/`：Astro 页面、布局、样式与浏览器交互。
- `source/zh-CN/`、`source/en/`：双语文章、知识笔记、经历和简历内容。
- `data/zh-CN/`、`data/en/`：项目及工具箱数据。
- `tools/`：内容校验、资源准备和构建后处理脚本。
- `docs/ASTRO_MIGRATION.md`：迁移结构与本地构建说明。
- `docs/operations/DEPLOYMENT_STATUS.md`：部署记录；其中个别记录早于本次快照，发布前请重新核实线上状态。

## 产品与发布约束

- 保留现有动态特效和插图风格。经历页采用时间轴，与简历页分开；未知项目日期显示“时间待补充”，不要编造日期。
- 生产站点使用 EdgeOne 国际站 GitHub 集成，从 `master` 构建 `astro-dist/`，域名为 `https://edgeone.chenfukun.space/`。
- 不要将项目部署到根域名 `chenfukun.space`。发布前先运行 `npm run check`；推送 `master` 会触发平台构建。
- 本包不包含账户凭据或部署授权。需要发布时，应在接手环境中重新核对 Git、EdgeOne 项目配置和线上版本。
