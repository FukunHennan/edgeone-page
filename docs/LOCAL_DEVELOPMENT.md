# 本地开发

生产站点使用 Astro。需要 Node 22.21.1 或更新的 22.x、npm 10.x；建议按
`.node-version` 使用 Node 22.23.2。`npm ci` 安装锁定依赖。

Windows 使用 fnm 时，先在当前 PowerShell 会话切换版本：

```powershell
fnm env --shell powershell | Out-String | Invoke-Expression
fnm use
node --version
npm --version
```

无需改变全局 Node。也可直接运行 `fnm exec --using 22.23.2 npm.cmd run check`。

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

旧 Hexo 配置、站点脚本、模板脚手架和 `public/` 构建产物已随迁移清理删除，
需要核对历史地址时查 Git 历史。主题目录只保留 Astro 仍读取的部分：CSS、
字体、图片、Swup 库、`toolbox.js` 和 3 个 EJS 模板；修改它们需要重新构建验证。
