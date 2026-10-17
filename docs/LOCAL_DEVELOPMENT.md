# 本地开发

生产站点使用 Astro。需要 Node 22.21.1 或更新的 22.x、npm 10.x；建议按
`.node-version` 使用 Node 22.23.2。`npm ci` 安装锁定依赖。

## 开发预览

```bash
npm run dev
```

Astro 会在终端显示本地地址，默认可访问 `/zh-CN/` 和 `/en/`。修改
`astro-src/`、`source/{zh-CN,en}/`、`data/` 或复用的主题源码后刷新页面。
首页动画、项目筛选、工具箱、经历时间轴、简历和返回控件均在这个预览中检查。

## 发布前检查

```bash
npm run check
npm run preview:astro
```

`check` 依次验证双语内容、Astro 类型、构建产物、文章结构、标签与分类页、
旧文章链接和生产元数据。预览构建产物时检查中英文、移动端、明暗主题、
搜索与页面切换。EdgeOne 国际站从 `master` 自动构建 `astro-dist/`；
生产域名仅为 `edgeone.chenfukun.space`。

旧 Hexo 配置、主题模板和 `public/` 仅供视觉资源复用及历史地址核对，
不参与生产生成器或 CI 发布。主题 CSS/图片与少量 EJS 局部模板仍由
Astro 构建读取，修改它们需要重新构建验证。
