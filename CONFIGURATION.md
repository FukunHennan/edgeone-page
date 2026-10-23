# EdgeOne Page 配置指南

本指南说明站点的配置文件、内容目录和 Front Matter 要求。快速上手见
[`README.md`](README.md)。

## 1. 支持的语言

站点只支持两个语言代码，分别构建为独立的静态站点：

```text
zh-CN   简体中文
en      English
```

不再支持繁体中文，也不在浏览器中即时翻译文章正文。文章正文分别保存在中文和
英文两套 Markdown 里，选择语言后打开对应语言的静态页面。

## 2. 配置分层

当前配置由以下文件组成：

| 文件 | 作用 |
| --- | --- |
| `astro.config.mjs` | Astro 构建配置：站点 URL、源目录、输出目录、静态输出 |
| `edgeone.json` | EdgeOne 生产构建、Node 版本、重定向和响应头（现行主配置） |
| `.edgeone/config.json` | EdgeOne Pages 旧配置，仅保留 `build.command` 与 `build.output` |
| `.node-version` | 本地开发使用的 Node 版本 |
| `package.json` | npm 脚本、依赖和 Node/npm 版本范围 |

`astro.config.mjs` 的关键设置：

- `site: https://edgeone.chenfukun.space`
- `srcDir: ./astro-src`（页面、布局、交互源码）
- `publicDir: ./astro-static`（静态资源）
- `outDir: ./astro-dist`（生产产物，不提交到 Git）
- `output: static`、`trailingSlash: always`

开发和构建前都会检查 Node 版本，仅接受 ≥ 22.21.1 且低于 23 的版本，与依赖安装要求一致。

### Node 版本口径

| 场景 | 版本 | 来源 |
| --- | --- | --- |
| 本地开发 | 22.23.2 | `.node-version` |
| EdgeOne 平台构建 | 22.21.1 | `edgeone.json` 的 `nodeVersion` |
| 最低要求 | ≥ 22.21.1 且 < 23 | `edgeone.json`、`package.json` 与启动检查 |

npm 使用 10.x（`package.json` 的 `engines` 限定 `>=10.9.0 <11`）。

## 3. 内容目录

```text
source/
├── zh-CN/
│   ├── _posts/       博客文章（Astro 内容集合源目录）
│   ├── notes/        知识笔记
│   ├── projects/     项目页
│   ├── tools/        工具页
│   ├── experience/   经历时间轴
│   ├── resume/       简历
│   └── about/        关于
└── en/               （同结构）
```

重复使用的数据放在：

```text
data/
├── zh-CN/
│   ├── projects.yml   项目档案
│   └── tools.yml      工具箱
└── en/                （同结构）
```

`astro-src/` 是页面、布局和浏览器交互源码：

```text
astro-src/
├── components/     页面组件（如 ArticleList）
├── layouts/        布局（Shell）
├── lib/            内容与主题逻辑
├── pages/          路由与页面（含 [lang]、[section]、archives、projects）
├── scripts/        浏览器运行时
└── styles/         站点样式
```

## 4. Front Matter 要求

文章 Front Matter 由 `astro-src/content.config.ts` 校验，字段如下：

| 字段 | 是否必填 | 说明 |
| --- | --- | --- |
| `title` | 必填 | 标题 |
| `lang` | 必填 | `zh-CN` 或 `en`，必须与所在目录一致 |
| `translation_key` | 必填 | 双语文章共享的标识，中英文必须一致 |
| `content_type` | 必填 | `article` / `showcase` / `interactive` |
| `domain` | 必填 | 功能域，非空字符串 |
| `date` | 必填 | 发布日期 |
| `description` | 可选 | 摘要 |
| `updated` | 可选 | 更新日期 |
| `tags` | 可选 | 标签数组，默认 `[]` |
| `categories` | 可选 | 分类数组，默认 `[]` |
| `published` | 可选 | 是否发布，默认 `true` |
| `draft` | 可选 | 是否草稿，默认 `false` |
| `slug` / `permalink` | 可选 | 覆盖默认路径 |

中文示例：

```yaml
---
title: 安装指南
lang: zh-CN
translation_key: install-guide
content_type: article
domain: engineering
date: 2026-07-17
tags:
  - 安装
categories:
  - 指南
---
```

英文版本只翻译 `title`、`tags`、`categories` 和正文，其余字段保持一致：

```yaml
---
title: Installation Guide
lang: en
translation_key: install-guide
content_type: article
domain: engineering
date: 2026-07-17
tags:
  - Installation
categories:
  - Guides
---
```

`content_type` 取值：

- `article`：普通技术文章，以 Markdown 为主。
- `showcase`：项目展示文章，可使用 `callout`、`grid`、`tabs`、`folding` 和 `button`。
- `interactive`：需要独立前端交互的专题页。

`domain` 推荐值：`engineering`、`robotics`、`vision`、`development`、`research`、`site`。
中英文版本的 `content_type` 和 `domain` 必须一致。

## 5. 项目数据

项目档案不在文章里维护，而在 `data/<lang>/projects.yml`，字段为 `key`、`status`、
`category`、`label`、`title`、`description`、`tags`、`github`、`post` 和 `order`。
`key` 在同一语言内不能重复，构建时按 `order` 排序。

## 6. 创建新文章

```bash
npm run new:post -- install-guide
```

这会同时创建 `source/zh-CN/_posts/install-guide.md` 和
`source/en/_posts/install-guide.md`，避免遗漏其中一个语言版本。文章标识只允许
小写字母、数字和连字符。

## 7. 内容校验

```bash
npm run check:content     # 只检查双语文章是否成对
npm run check             # 完整校验并生产构建
```

校验器检查：中英文文章是否同时存在、相对路径是否相同、`lang` 是否正确、
`translation_key` 是否存在且一致、同一语言内是否重复、`content_type`/`domain`/
`published` 是否合法，以及分类、标签、旧文章地址对应的 Astro 页面是否完整。
任何检查失败都会阻止部署。

## 8. 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev`（或 `dev:astro`、`server`） | 启动 Astro 本地开发服务 |
| `npm run check` | 完整校验并构建（部署前的门禁） |
| `npm run check:content` | 只校验双语文章成对 |
| `npm run build:production`（或 `build`） | 生产构建，输出 `astro-dist/` |
| `npm run preview:astro` | 预览生产产物 |
| `npm run subset:icons` | 重新生成 `assets/fa-subset/` 图标字体（增删图标时才需要） |

`dev`、`build`、`server` 是 `dev:astro`、`build:production` 的别名。

### 图标（Font Awesome）

站点用的是**按图标裁剪过的字体**，不是 Font Awesome 完整字体：

- `assets/fa-subset/*.woff2` —— 三个 woff2，合计约 2.5KB（完整版是 812KB）
- `assets/fa-subset/subset.min.css` —— 与上面字形一一对应的 `@font-face` 和 `.fa-xxx:before` 规则

这两者必须同步。**新增或删除图标时**：

1. 改 `tools/subset-icons.py` 里的 `ICONS`（类名 + 码点）；
2. 在 `assets/fa-subset/subset.min.css` 里加/删对应的 `:before` 规则；
3. 运行 `npm run subset:icons`，把重新生成的 woff2 一起提交。

产物已入库，所以**正常构建不需要 Python**；只有第 3 步需要 `pyftsubset`（`pip install fonttools brotli`）。

## 9. EdgeOne Pages

现行主配置是 `edgeone.json`：

- 安装命令：`npm ci`
- 构建命令：`npm run build:production`
- 输出目录：`astro-dist`
- Node 版本：`22.21.1`

`.edgeone/config.json` 是旧配置，仅保留 `build.command` 和 `build.output`（同样指向
`astro-dist`），与 `edgeone.json` 保持一致。

国际站 `edgeone-page` 项目连接仓库的 `master` 分支，发布到
`edgeone.chenfukun.space`。`chenfukun.space` 根域名不作为当前发布入口。

## 10. 重定向与响应头

`edgeone.json` 中维护了旧地址的重定向（301）：

- `/zh`、`/zh/*`、`/cn`、`/cn/*` → `/zh-CN/`
- `/en-US`、`/en-US/*` → `/en/`
- 旧分页 `/zh-CN/page/*`、`/en/page/*` 及年月归档分页 → 对应完整归档列表

同时为全站设置安全响应头（`X-Content-Type-Options`、`X-Frame-Options`、
`Referrer-Policy`、`Permissions-Policy`），并为 `service-worker.js` 和
`manifest.webmanifest` 设置专用 Content-Type 与缓存策略。

## 11. 语言切换

导航栏只保留「简体中文」和「English」。切换时保留当前页面路径，把 `/zh-CN/`
替换为 `/en/`（或反向）；因为双语文章使用相同相对路径，切换后直接打开对应语言
版本，而不是返回首页。站点根路径跳转到 `/zh-CN/`，每个页面都提供对应语言入口。
