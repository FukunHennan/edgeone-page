# EdgeOne Page 双语配置指南

## 1. 支持的语言

项目只支持两个语言代码：

```text
zh-CN
 en
```

不再支持繁体中文，也不在浏览器中即时翻译文章正文。

## 2. 配置分层

项目配置分为四层：

```text
_config.yml
_config.zh-CN.yml
_config.en.yml
_config.edg-one-page.yml
```

- `_config.yml`：永久链接、分页、代码高亮等共享设置。
- `_config.zh-CN.yml`：简体中文站点标题、描述、目录和本地化文字。
- `_config.en.yml`：英文站点标题、描述、目录和本地化文字。
- `_config.edg-one-page.yml`：颜色、图片、排版、评论、导航结构等共享主题设置。

修改域名时，需要同步更新两个语言配置中的 `url`：

```yaml
# _config.zh-CN.yml
url: https://your-domain.example/zh-CN
root: /zh-CN/

# _config.en.yml
url: https://your-domain.example/en
root: /en/
```

## 3. 双语文章目录

简体中文文章：

```text
source/zh-CN/_posts/
```

英文文章：

```text
source/en/_posts/
```

同一篇文章必须拥有相同的相对路径。例如：

```text
source/zh-CN/_posts/guides/install.md
source/en/_posts/guides/install.md
```

这样构建后会得到：

```text
/zh-CN/posts/guides/install/
/en/posts/guides/install/
```

语言切换时可以直接替换 URL 中的语言代码。

## 4. Front Matter 要求

中文版本：

```yaml
---
title: 安装指南
date: 2026-07-17 12:00:00
lang: zh-CN
translation_key: install-guide
categories:
  - 指南
tags:
  - 安装
---
```

英文版本：

```yaml
---
title: Installation Guide
date: 2026-07-17 12:00:00
lang: en
translation_key: install-guide
categories:
  - Guides
tags:
  - Installation
---
```

`title`、分类、标签和正文可以分别翻译，但两个文件的 `translation_key` 必须完全一致。

## 5. 创建新文章

推荐使用双语文章生成器：

```bash
npm run new:post -- install-guide
```

文章标识只允许小写字母、数字和连字符。命令会同时创建中英文模板，避免忘记其中一个版本。

## 6. 内容校验

运行：

```bash
npm run check:content
```

检查内容包括：

1. 每篇中文文章都有英文版本。
2. 每篇英文文章都有中文版本。
3. 两个版本相对路径相同。
4. `lang` 与所在目录一致。
5. `translation_key` 存在且相同。
6. 同一语言内不能重复使用 `translation_key`。

校验失败时，生产构建和 GitHub Actions 都会失败。

## 7. 本地开发

简体中文：

```bash
npm run server:zh-CN
```

英文：

```bash
npm run server:en
```

两个命令分别读取对应语言配置，界面、首页介绍和文章内容都会使用相应语言。

## 8. 生产构建

```bash
npm ci
npm run build:production
```

构建器会依次生成两个站点：

```text
public/zh-CN/
public/en/
```

同时生成 `public/index.html` 作为语言入口。入口优先读取用户上一次选择，没有记录时再根据浏览器语言跳转。

## 9. 导航与语言切换

语言选择器只保留：

```text
简体中文
English
```

切换程序会：

- 保存用户选择
- 保留查询参数和锚点
- 将 `/zh-CN/` 替换为 `/en/`，或反向替换
- 在对应文章不存在时回退到目标语言首页
- 输出 `hreflang="zh-CN"`、`hreflang="en"` 和 `x-default`

## 10. 界面翻译

主题界面语言文件只保留：

```text
themes/edg-one-page/languages/zh-CN.yml
themes/edg-one-page/languages/en.yml
```

新增菜单或界面文案时，需要同时维护这两个文件。

文章正文不要写入语言包，应分别写在双语 Markdown 文件中。

## 11. 评论系统

评论默认关闭。启用 Giscus 后，`scripts/localized-theme.js` 会根据当前站点语言设置评论界面语言。

```yaml
comment:
  enable: true
  system: giscus
```

不要把密钥、令牌或其他敏感信息提交到仓库。

## 12. EdgeOne Pages

`.edgeone/config.json` 应保持：

```json
{
  "build": {
    "command": "npm run build:production",
    "output": "public"
  }
}
```

GitHub Actions 也会检查中文首页、英文首页和示例文章的两个语言版本是否成功生成。
