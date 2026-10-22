# 文章与项目封面 · 临时占位图

本仓库的临时封面采用 2026-10-22 用户确认的四张 AI 生成设计图（原图来自该次对话），经等比缩小、WebP 压缩后直接托管在站点，之后可逐篇、逐项目替换。

| 位置 | 明亮主题 | 深色主题 |
| --- | --- | --- |
| 文章列表与文章归档 | `/covers/article-light.webp` | `/covers/article-dark.webp` |
| 项目卡片 | `/covers/project-light.webp` | `/covers/project-dark.webp` |

4 张图片均存放在 `astro-static/covers/`，尺寸为 520px 宽、约 16:9。原图由用户在本次聊天中生成，压缩前为 1672×941 PNG；本仓库暂存用于卡片显示的轻量 WebP 版本，非编辑源文件。深浅色主题由已有的 `html.dark` 主题状态控制，两种语言共用对应艺术设计（图片主文案为“待插入”，英文辅助文案为“Cover Coming Soon”）。

## 现在的封面显示策略

- **文章列表**：不再使用随机轮播风景图当作各篇封面；没有指定封面的文章显示用户确认的“文章待插入”图片。
- **项目卡片**：增加 16:9 的封面区域，没有指定封面的项目显示“项目待插入”图片。
- **主页/内页背景**：原来的风景视频、WebP 横幅和图片保持不变，因为它们承担背景而不是文章或项目封面的功能。
- **可替换性**：单篇文章或项目有自己的 `cover` 时优先显示自定义图片，且不再切换占位图。原卡片标题、标签、分类、项目状态、链接和筛选均保留。

## 后面如何替换

文章 Markdown 文件（位于 `source/zh-CN/_posts` 或 `source/en/_posts`）的 frontmatter 增加：

```yaml
---
title: 示例文章
cover: /covers/custom-article.webp
---
```

项目在 `data/zh-CN/projects.yml` / `data/en/projects.yml` 对应的记录增加：

```yaml
cover: /covers/custom-project.webp
```

把正式设计图片放到 `astro-static/covers/`，推荐 16:9 WebP、至少 800×450px，尽量控制在 200KB 内。同一项目的两个语言记录各自配置 `cover`，可使用相同文件路径。

本次不为旧文章或项目虚构正式封面，也不会删除仍被网站背景、首页轮播或离线回退使用的 `/scenes/` 资源。

## 验证

`npm ci && npm run check`，然后查看中英文博客、项目页，在浅色/深色模式分别确认四张占位图加载正常，页面无溢出，卡片可点击，项目筛选仍然正常。
