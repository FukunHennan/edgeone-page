---
title: Hello, EdgeOne Page
description: An introduction to EdgeOne Page's bilingual content structure, article pairing rules, and production publishing checks.
date: 2026-07-17 13:30:00
updated: 2026-07-18 01:30:00
lang: en
translation_key: hello-world
published: true
categories:
  - Guides
tags:
  - Hexo
  - EdgeOne Pages
  - Bilingual Web
---

Welcome to EdgeOne Page.

This project uses a true bilingual content structure. Simplified Chinese and English articles are stored separately and built as two independent static sites. When a visitor switches languages, navigation, interface text, article content, search indexes, and feeds all open the matching language version instead of translating the current page in the browser.

## How bilingual articles are stored

Both versions use the same file name and `translation_key`:

```text
source/zh-CN/_posts/hello-world.md
source/en/_posts/hello-world.md
```

The Chinese file declares:

```yaml
lang: zh-CN
translation_key: hello-world
published: true
```

The English file declares:

```yaml
lang: en
translation_key: hello-world
published: true
```

Both files must exist and use the same publication state. Before the site is generated, the build validates titles, descriptions, dates, categories, tags, body length, and translation keys so incomplete or placeholder content cannot enter production.

## Create a new article

Run:

```bash
npm run new:post -- my-new-article
```

The project creates both language templates. New templates default to:

```yaml
published: false
```

After completing both versions, change them together to `published: true`, then run:

```bash
npm run check
```

This command validates bilingual content, builds the complete production site, and audits the EdgeOne output. Drafts never enter search, RSS, sitemaps, or recommendations.
