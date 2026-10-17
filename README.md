# EdgeOne Page

EdgeOne Page 是部署在腾讯云 EdgeOne 国际站的 Astro 双语站点，使用以下语言：

- 简体中文：`zh-CN`
- English：`en`

站点不是在浏览器中临时翻译文章，而是分别保存并构建中文、英文两个版本。选择语言后，导航、页面文字、文章标题和文章正文都会打开对应语言的静态页面。

## 站点结构

生产构建会生成：

```text
astro-dist/
├── index.html          # 跳转到中文首页
├── zh-CN/              # 简体中文站点
└── en/                 # English site
```

文章源文件分别保存在：

```text
source/
├── zh-CN/_posts/
└── en/_posts/
```

同一篇文章必须使用相同的相对文件路径和 `translation_key`。例如：

```text
source/zh-CN/_posts/hello-world.md
source/en/_posts/hello-world.md
```

中文文章：

```yaml
---
title: 你好，EdgeOne Page
lang: zh-CN
translation_key: hello-world
---
```

英文文章：

```yaml
---
title: Hello, EdgeOne Page
lang: en
translation_key: hello-world
---
```

## 创建双语文章

运行：

```bash
npm run new:post -- my-article-slug
```

这会同时创建：

```text
source/zh-CN/_posts/my-article-slug.md
source/en/_posts/my-article-slug.md
```

然后分别完成中文和英文正文。文章保存后无需在访问时再次翻译。

## 本地预览

安装依赖：

```bash
npm ci
```

预览 Astro 站点：

```bash
npm run dev:astro
```

生产构建完成后预览产物：

```bash
npm run build:production
npm run preview:astro
```

## 校验与构建

只检查文章是否成对：

```bash
npm run check:content
```

完整检查并构建：

```bash
npm run check
```

生产构建：

```bash
npm run build:production
```

校验器会检查：

- 中文和英文文章是否同时存在
- 两个文件的相对路径是否相同
- `lang` 是否正确
- `translation_key` 是否存在并一致
- 同一语言内是否存在重复 `translation_key`

任何检查失败都会阻止部署。

## 语言切换

导航栏只显示 `简体中文` 和 `English`。

切换语言时，程序会保留当前页面路径，例如：

```text
/zh-CN/posts/hello-world/
/en/posts/hello-world/
```

因为双语文章使用相同的文件路径，所以切换后会直接打开对应语言版本，而不是返回首页。

站点根路径跳转到 `/zh-CN/`；每个页面都提供对应语言的入口。

## 配置文件

```text
astro.config.mjs            # Astro 构建与站点 URL
astro-src/                  # 页面、布局和交互
astro-static/               # 静态资源
edgeone.json                # EdgeOne 构建、路由和响应头
source/{zh-CN,en}/          # 双语内容源
```

更完整的设置说明见 [`CONFIGURATION.md`](CONFIGURATION.md)。

## EdgeOne Pages

仓库中的 `.edgeone/config.json` 使用：

- Build command：`npm run build:production`
- Output directory：`astro-dist`

国际站 `edgeone-page` 项目连接仓库的 `master` 分支，发布到 `edgeone.chenfukun.space`。`chenfukun.space` 根域名不作为当前发布入口。

## License

主题代码沿用仓库内声明的 GPL-3.0 许可。
