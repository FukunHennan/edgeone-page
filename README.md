# EdgeOne Page

EdgeOne Page 是一个面向腾讯云 EdgeOne Pages 的 Hexo 双语站点项目，只支持：

- 简体中文：`zh-CN`
- English：`en`

站点不是在浏览器中临时翻译文章，而是分别保存并构建中文、英文两个版本。选择语言后，导航、页面文字、文章标题和文章正文都会打开对应语言的静态页面。

## 站点结构

生产构建会生成：

```text
public/
├── index.html          # 根据已保存语言或浏览器语言跳转
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

预览简体中文：

```bash
npm run server:zh-CN
```

预览英文：

```bash
npm run server:en
```

默认 `npm run server` 打开简体中文站点。

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

用户选择保存在浏览器 `localStorage` 中。访问站点根目录时，会优先使用已保存语言；没有保存记录时，中文浏览器进入简体中文，其余浏览器进入英文。

## 配置文件

```text
_config.yml                 # 两种语言共享的 Hexo 配置
_config.zh-CN.yml           # 简体中文站点配置
_config.en.yml              # 英文站点配置
_config.edg-one-page.yml    # 共享主题外观配置
scripts/localized-theme.js  # 将语言配置应用到主题
scripts/bilingual-runtime.js# 语言切换与 hreflang
```

更完整的设置说明见 [`CONFIGURATION.md`](CONFIGURATION.md)。

## EdgeOne Pages

仓库中的 `.edgeone/config.json` 使用：

- Build command：`npm run build:production`
- Output directory：`public`

连接仓库的 `master` 分支后即可部署。

## License

主题代码沿用仓库内声明的 GPL-3.0 许可。
