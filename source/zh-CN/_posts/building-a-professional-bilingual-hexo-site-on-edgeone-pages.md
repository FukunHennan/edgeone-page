---
title: 从单页主题到专业级双语博客：EdgeOne Page 的工程化实践
description: 记录 EdgeOne Page 如何从普通 Hexo 主题演进为支持中英双语、搜索、RSS、PWA、确定性构建和生产审计的专业静态博客。
date: 2026-07-18 01:30:00
updated: 2026-07-18 01:30:00
lang: zh-CN
translation_key: building-a-professional-bilingual-hexo-site-on-edgeone-pages
published: true
categories:
  - 工程实践
tags:
  - Hexo
  - EdgeOne Pages
  - 双语网站
  - PWA
  - CI/CD
---

一个博客真正进入生产环境后，问题很快就不再只是“页面能不能打开”。语言切换是否可靠、搜索和 RSS 是否只包含已发布内容、构建结果是否可重复、缓存是否会错误地保留旧页面、部署平台是否使用固定版本的 Node.js，这些细节共同决定了站点能否长期稳定运行。

EdgeOne Page 的目标，是把一个普通 Hexo 主题改造成一套适合腾讯云 EdgeOne Pages 的专业双语静态博客。本文记录这次工程化改造的核心设计，以及过程中最值得保留的经验。

## 为什么不使用浏览器实时翻译

项目最初面临的第一个选择，是如何实现中英文内容。浏览器端实时翻译看起来简单，但它会带来几个问题：页面首次渲染可能出现错误语言，搜索引擎难以稳定索引，文章链接无法可靠对应，离线访问也会依赖运行时脚本。

最终项目采用两套独立内容目录：

```text
source/zh-CN/_posts/
source/en/_posts/
```

同一篇文章在两个目录中使用相同文件名和 `translation_key`。构建时分别生成：

```text
/zh-CN/
/en/
```

这种结构让语言切换变成“打开对应文章”，而不是“在当前页面重新翻译”。它也让 Canonical、hreflang、RSS、Sitemap 和离线缓存都能按语言独立管理。

## 双语内容必须在构建前通过验证

仅仅规定目录结构还不够。随着文章数量增加，最常见的问题是只写了一种语言、翻译键不一致、文件名与文章链接不匹配，或者把仍含占位文字的草稿发布出去。

因此项目加入了双语内容验证器。每一篇正式发布的文章必须具备：

- 中文和英文两个版本；
- 与文件路径一致的 `translation_key`；
- 有效的发布时间和更新时间；
- 适合搜索与社交分享的摘要；
- 至少一个分类和两个标签；
- 足够长度的正文；
- 两个语言版本一致的发布状态。

新文章脚手架默认生成 `published: false` 的双语草稿。只有删除占位内容、完善元数据并将两个版本一起发布后，生产检查才会通过。

## 一次命令构建两套站点

生产构建由一个统一脚本完成：

```bash
npm run build:production
```

它依次执行中文站和英文站的 Hexo 构建，然后生成根目录语言入口，并补充静态博客通常需要的生产文件：

- 本地搜索索引；
- 中英文 RSS；
- 分语言 Sitemap 和根 Sitemap 索引；
- `robots.txt`；
- 根级与分语言 404 页面；
- 双语 hreflang；
- PWA Manifest；
- 离线页面；
- Service Worker；
- Schema.org 结构化数据。

所有这些功能都由仓库中的 JavaScript 构建脚本生成，不依赖服务器数据库，也不要求 EdgeOne 运行长期驻留进程。

## 搜索、RSS 和 Sitemap 只包含已发布文章

静态博客很容易出现一个隐蔽问题：Hexo 不输出草稿，但自定义脚本直接扫描 Markdown 时，可能把 `published: false` 的文章写入搜索索引或 RSS。

EdgeOne Page 将“是否发布”统一为内容记录的一部分。搜索、RSS、Sitemap 和生产审计都读取同一套文章记录，并明确过滤：

```yaml
published: false
```

或：

```yaml
draft: true
```

这样草稿不会通过任何旁路泄漏到公开站点。

## 搜索与推荐保持零原生依赖

站点搜索使用构建时生成的 JSON 索引，浏览器端完成标题、摘要和正文匹配。文章推荐则综合标签、分类、关键词相似度和发布时间。

项目曾考虑使用 `nodejieba` 提升中文分词精度，但它包含原生模块，会增加 EdgeOne 构建环境对编译工具链和 Node ABI 的依赖。最终推荐算法采用纯 JavaScript 的英文词元和中文双字组合，牺牲少量语义精度，换取更稳定的自动部署。

## PWA 的重点不是“能安装”，而是缓存正确

项目为中英文站点分别生成 Manifest，并提供统一 Service Worker。页面导航使用网络优先策略，CSS、JavaScript、图片和字体使用缓存优先与后台刷新结合的策略。

更重要的是，缓存版本不使用时间戳，而是根据最终 `public` 目录的文件路径和内容计算哈希。这样相同源码会生成相同缓存版本，内容变化才会触发更新。

Service Worker 还会忽略 Range 请求、第三方不透明响应、错误响应和自身文件，避免把不可用结果长期写入缓存。网络不可用时，则根据当前路径打开中文或英文离线页面。

## 把 EdgeOne 部署参数写进仓库

项目根目录的 `edgeone.json` 固定了安装和构建行为：

```json
{
  "installCommand": "npm ci",
  "buildCommand": "npm run build:production",
  "outputDirectory": "public",
  "nodeVersion": "20.18.0"
}
```

同时配置旧语言路径重定向、Service Worker 缓存控制、Manifest 内容类型和基础安全响应头。部署规则随代码版本管理，减少控制台手工配置与仓库实际要求之间的偏差。

## CI 不只是构建，还要审计产物

GitHub Actions 使用与 EdgeOne 一致的 Node.js 版本和锁文件安装依赖，然后执行：

```bash
npm run check
```

这个命令会完成双语内容验证、完整生产构建和产物审计。审计器会逐篇检查所有已发布文章，确认它们具备：

- 对应的 HTML 文件；
- `BlogPosting` 结构化数据；
- Canonical；
- 中英文 hreflang；
- Manifest；
- Service Worker 注册；
- 唯一的 robots 元标签。

它还会核对搜索索引和 RSS 条目数量是否与已发布文章数量一致，并检查 Service Worker 是否仍保持确定性。

## 这次改造带来的经验

第一，双语网站应该从内容模型开始设计，而不是最后在前端增加一个翻译按钮。

第二，静态站点也需要正式的发布状态管理。任何直接读取源文件的生成器，都必须使用与主构建一致的过滤规则。

第三，PWA 最难的部分不是生成 Manifest，而是定义可靠的更新和失败策略。

第四，生产质量不能只靠“本地看起来正常”。构建脚本应该主动验证关键文件、元数据和内容数量，让错误在部署前暴露。

第五，部署配置、内容规则和审计规则都应保存在仓库中。这样站点才能被复现、迁移和持续维护。

## 当前工作流

日常写作流程已经简化为：

```bash
npm run new:post -- article-slug
# 完成中英文内容，并将 published 改为 true
npm run check
```

推送到 GitHub 后，GitHub Actions 会执行同样的生产检查，EdgeOne Pages 再按照仓库中的配置重新构建并发布。

EdgeOne Page 仍会继续优化图片响应式输出、性能预算、无障碍体验和主题品牌清理，但它已经从一个可用的 Hexo 页面，演进为一套具备内容规范、部署规范、缓存策略和质量门禁的双语博客工程。
