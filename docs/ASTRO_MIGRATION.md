# Astro 生产构建

站点的生产入口已切换到 Astro 7.3.8。EdgeOne 国际站 `edgeone-page` 项目从
`master` 构建 `astro-dist/`，绑定地址为 `edgeone.chenfukun.space`。根域名
`chenfukun.space` 不作为当前发布入口。

## 内容与资源

- `astro-src/`：页面、内容集合、布局和浏览器交互。
- `astro-static/`：Astro 静态资源；主题图片、样式和脚本由 `tools/astro-theme.cjs` 准备。
- `source/{zh-CN,en}/`：双语文章、知识笔记、经历和简历的内容源。
- `data/{zh-CN,en}/projects.yml`：双语项目档案。
- `astro-dist/`：构建产物，不提交到 Git。

现有 Hexo 源码和 `public/` 构建仍保留用于迁移核对，但不参与 EdgeOne 生产构建。

## 本地命令

使用 Node 22.21.1 或更新的 22.x 与 npm 10.x：

```sh
npm ci
npm run dev:astro
npm run check
npm run preview:astro
```

`npm run check` 会检查双语内容、Astro 类型、生产构建、文章结构及产物。
`tools/postprocess-astro.cjs` 生成 RSS、sitemap、robots、离线页、manifest 和
service worker；`tools/audit-astro.cjs` 检查双语路由、资源与生产元数据。

旧 Hexo 生成的标签、分类和归档分页 URL 由 `edgeone.json` 重定向到对应语言的
文章归档。首页、项目、经历时间轴、简历、工具箱、文章和知识笔记均由 Astro 输出。
