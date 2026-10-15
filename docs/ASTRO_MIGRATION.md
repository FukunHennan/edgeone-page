# Astro 迁移：第一阶段

## 当前边界

Astro 作为独立的迁移验证入口运行，当前线上构建仍为 Hexo。
第一阶段覆盖中英项目档案、文章列表和所有已发布文章，不代表全站已完成迁移。

- `astro-src/`：Astro 页面、布局、内容集合与 TypeScript。
- `astro-static/`：Astro 静态资源，独立于 Hexo 生成目录。
- `astro-dist/`：Astro 构建输出，不提交到 Git。
- 文章继续维护在 `source/{zh-CN,en}/_posts/`。
- 项目继续维护在 `data/{zh-CN,en}/projects.yml`。

## 使用

Astro 使用固定版本 7.3.8，需要 Node >=22.12；建议按 `.node-version` 使用
Node 22.23.2 和仓库指定的 npm 10.9.8。旧 EdgeOne 配置为 Node 22.11.0，
正式切换时须同步提高平台运行时版本。当前全局 Node 26/npm 11 可验证 Astro，
但不能通过 Hexo 的运行时检查。

```sh
npm ci
npm run dev:astro
npm run check:astro
npm run build:astro
npm run preview:astro
```

开发首页：`http://localhost:4321/zh-CN/projects/`。
英文版本：`http://localhost:4321/en/projects/`。

内容通过 Astro 内容集合加载并进行 schema 校验。项目数据键必须唯一；文章保留
`translation_key`、`slug`、`permalink` 和双语 URL，缺少译文会阻止构建。
当前项目搜索和主题切换使用页面级 TypeScript，不引入 UI 框架。

## 验证与后续

`check:astro` 检查双语配对和 Astro 类型；`build:astro` 构建并校验项目关联文章。
与 Hexo 共存期间，不修改 `.edgeone/config.json`、原有生产构建和当前主题源码。
试验目录的 robots.txt 禁止索引，正式切换时需要更换。

下一阶段依次迁移首页、知识库、经历/简历、工具箱；工具复杂到需要组件状态时再选 React 或 Vue。
正式切换前必须完成路由清单对比（含分类、标签、分页）、站内链接验证、搜索、RSS、
sitemap、结构化数据、PWA、移动端和打印验证，以及 EdgeOne 构建入口切换。

样式以 CSS 变量和页面组件为边界，不继续叠加 Stylus/Tailwind 两套规则。
迁移第一阶段的布局用于验证内容与交互组织方式，并非旧主题的逐像素复刻。

## 本阶段验证结果

- Astro 7.3.8：类型检查 0 errors / 0 warnings / 0 hints。
- 静态构建生成 29 页，包含 24 篇双语文章。
- 现有双语文章配对、文章输出元数据、项目关联文章校验通过。
- EdgeOne Makers 本地代理的中英项目页和文章页返回 HTTP 200。
- 浏览器控制连接失败，截图、移动端视觉和交互验证仍待完成。
- npm audit 未报告 Astro 本身的漏洞；共存依赖树仍报告 13 项漏洞，
  尚未做完整依赖升级，不应据此把整个仓库视作已通过安全审计。
- 本机 Node 26/npm 11 与 Hexo 约束不同，因此本阶段未执行旧生产构建回归。
