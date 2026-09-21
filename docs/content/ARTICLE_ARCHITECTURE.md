# 文章架构规范

## 目标

文章内容采用“Markdown 为主、组件化增强”的方式维护。文章正文、组件样式、交互脚本和重复数据必须分别归属到明确的层级，避免每篇文章复制一套 HTML、CSS 和 JavaScript。

## 内容类型

文章 Front Matter 使用 `content_type` 标记内容类型：

- `article`：普通技术文章，以 Markdown 为主。
- `showcase`：项目展示文章，可使用 `callout`、`grid`、`tabs`、`folding` 和 `button`。
- `interactive`：需要独立前端交互的专题页。交互脚本放在主题或站点脚本目录，不直接在文章正文中写 `<script>`。

未标记的旧文章暂按 `article` 处理，迁移时再补充字段。

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

优先使用主题已有的 Hexo 组件：

```text
{% callout type="info" title="说明" %}
内容
{% endcallout %}

{% grid cols=2 %}
{% ... %}
{% endgrid %}

{% tabs %}
{% folding %}
{% button %}
```

组件只表达结构和语义。颜色、间距、响应式行为统一由主题样式管理。文章中禁止新增大段内联 `<style>` 或 `<script>`；确需交互时，应创建可复用主题模块并在构建中验证。

## 目录策略

当前保留 `source/<language>/_posts/` 作为 Hexo 发布入口，以保证双语校验和现有 URL 稳定。功能分类通过 Front Matter 的 `domain`、`categories` 和 `tags` 实现，不直接移动文件破坏 URL。

辅助资料按功能放置：

```text
data/                    重复使用的数据源
docs/content/            文章架构和迁移规范
docs/operations/         本地构建、同步和发布流程
themes/.../scripts/      Hexo 组件和构建逻辑
themes/.../source/css/   组件样式
themes/.../source/js/    浏览器交互
```

## 双语要求

中文和英文文章必须保持：

- 相同的相对文件名
- 相同的 `translation_key`
- 相同的 `content_type`
- 相同的 `domain`
- 相同的发布状态

每次迁移至少同时更新中英文版本，并执行 `npm run check:content`。
