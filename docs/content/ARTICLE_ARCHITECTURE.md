# 文章架构规范

## 目标

文章内容采用“Markdown 为主、组件化增强”的方式维护。文章正文、组件样式、交互脚本和重复数据必须分别归属到明确的层级，避免每篇文章复制一套 HTML、CSS 和 JavaScript。

## 内容类型

文章 Front Matter 使用 `content_type` 标记内容类型：

- `article`：普通技术文章，以 Markdown 为主。
- `showcase`：项目展示文章，可使用 `callout`、`grid`、`tabs`、`folding` 和 `button`。
- `interactive`：需要独立前端交互的专题页。交互脚本放在主题或站点脚本目录，不直接在文章正文中写 `<script>`。

所有文章必须明确标记 `content_type`；未标记的文章无法通过构建检查。

## 功能域

使用 `domain` 标记文章所属功能域，推荐值包括：

- `engineering`：工程实践、架构和部署
- `robotics`：机器人、嵌入式和控制
- `vision`：计算机视觉和图像处理
- `development`：软件开发、工具和自动化
- `research`：研究记录和实验
- `site`：站点建设和内容系统

中英文版本必须使用相同的 `content_type` 和 `domain`。

## 组件规则

文章使用 Astro 内容集合渲染 Markdown；不要在新文章中写 Hexo 模板标签。
组件只表达结构和语义。颜色、间距、响应式行为统一由主题样式管理。文章中禁止新增大段内联 `<style>` 或 `<script>`；确需交互时，应创建可复用的 Astro 页面或浏览器模块并在构建中验证。

## 目录策略

当前保留 `source/<language>/_posts/` 作为 Astro 内容集合的源目录，以保证双语校验和现有 URL 稳定。功能分类通过 Front Matter 的 `domain`、`categories` 和 `tags` 实现，不直接移动文件破坏 URL。

辅助资料按功能放置：

```text
data/                         重复使用的数据源（项目、工具箱）
astro-src/                    页面、布局、内容集合和浏览器交互
tools/                        内容校验、资源准备和构建后处理
themes/edg-one-page/          Astro 仍读取的主题资源，见下方说明
docs/content/                 文章架构和迁移规范
docs/operations/              本地构建、同步和发布流程
```

主题目录只保留 Astro 构建实际读取的部分：`_config.yml`（供 Stylus 的
`hexo-config()` 取值）、`source/css/`（`style.styl` 及其 `@require` 树和
`build/tailwind.css`）、`source/{images,fonts,fontawesome,webfonts}/`、
`source/js/toolbox.js`、`source/js/libs/` 中简历页用到的两个 PDF 库与五个
Swup 文件，以及 `layout/` 下的 `home-banner.ejs`、`home-content.ejs`、
`navbar.ejs`。其余主题文件已随迁移清理删除。

## 双语要求

中文和英文文章必须保持：

- 相同的相对文件名
- 相同的 `translation_key`
- 相同的 `content_type`
- 相同的 `domain`
- 相同的发布状态

每次更新至少同时检查中英文版本，并执行 `npm run check`。
