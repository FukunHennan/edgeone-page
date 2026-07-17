---
title: Hello, EdgeOne Page
date: 2026-07-17 13:30:00
lang: en
translation_key: hello-world
categories:
  - Guides
tags:
  - Hexo
  - EdgeOne Pages
---

Welcome to EdgeOne Page.

This project now uses a true bilingual structure. Simplified Chinese and English articles are stored separately and built as two independent static sites. When visitors switch languages, the navigation, interface text, and article body all open in the selected language.

## How bilingual articles are stored

The two versions of an article use the same file name and `translation_key`:

```text
source/zh-CN/_posts/hello-world.md
source/en/_posts/hello-world.md
```

The Chinese version declares:

```yaml
lang: zh-CN
translation_key: hello-world
```

The English version declares:

```yaml
lang: en
translation_key: hello-world
```

You only maintain these two Markdown files. Visitors do not need to translate the article again every time they open the page.

## Create a new article

Run:

```bash
npm run new:post -- my-new-article
```

The project creates both Chinese and English article templates. After completing both versions, run:

```bash
npm run check
```

The build validator confirms that both files exist and that their `translation_key` values match.
