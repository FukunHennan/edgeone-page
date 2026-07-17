---
title: 你好，EdgeOne Page
description: 介绍 EdgeOne Page 的中英双语内容结构、文章配对规则和日常发布检查流程。
date: 2026-07-17 13:30:00
updated: 2026-07-18 01:30:00
lang: zh-CN
translation_key: hello-world
published: true
categories:
  - 指南
tags:
  - Hexo
  - EdgeOne Pages
  - 双语网站
---

欢迎使用 EdgeOne Page。

这个项目采用真正的中英双语内容结构。简体中文文章和英文文章分别保存，并在构建时生成两套独立静态站点。因此，访问者切换语言后，导航、界面文字、文章正文、搜索索引和订阅源都会打开对应语言版本，而不是在浏览器中临时翻译当前页面。

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
published: true
```

英文版本声明：

```yaml
lang: en
translation_key: hello-world
published: true
```

两个版本必须成对存在，并保持相同发布状态。构建系统会在生成站点前检查标题、摘要、日期、分类、标签、正文长度和翻译键，防止缺少翻译或仍含占位内容的文章进入生产环境。

## 创建新文章

运行：

```bash
npm run new:post -- my-new-article
```

项目会同时创建中文和英文两个文章模板。新模板默认为：

```yaml
published: false
```

完成两个语言版本后，将它们一起改为 `published: true`，然后运行：

```bash
npm run check
```

这个命令会执行双语内容验证、完整生产构建和 EdgeOne 产物审计。草稿不会进入搜索、RSS、Sitemap 或推荐系统。
