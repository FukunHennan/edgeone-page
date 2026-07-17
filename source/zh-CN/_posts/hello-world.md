---
title: 你好，EdgeOne Page
date: 2026-07-17 13:30:00
lang: zh-CN
translation_key: hello-world
categories:
  - 指南
tags:
  - Hexo
  - EdgeOne Pages
---

欢迎使用 EdgeOne Page。

这个项目现在采用真正的中英双语结构。简体中文文章和英文文章分别保存，构建时生成两套独立的静态站点，因此访问者切换语言后，导航、页面文字和文章正文都会切换到对应语言。

## 双语文章如何保存

同一篇文章使用相同的文件名和 `translation_key`：

```text
source/zh-CN/_posts/hello-world.md
source/en/_posts/hello-world.md
```

中文版本声明：

```yaml
lang: zh-CN
translation_key: hello-world
```

英文版本声明：

```yaml
lang: en
translation_key: hello-world
```

以后只需要维护这两个 Markdown 文件，不需要访问者每次打开页面时临时翻译。

## 创建新文章

运行：

```bash
npm run new:post -- my-new-article
```

项目会同时创建中文和英文两个文章模板。完成两种语言的内容后，运行：

```bash
npm run check
```

构建校验会检查两个版本是否成对存在，以及 `translation_key` 是否一致。
