# Personal Hub UI Roadmap

本文档用于跟踪界面建设，避免一边开发一边重新定义页面。

## 页面状态

| 页面 | 当前目标 | 状态 |
|---|---|---|
| Home | Personal Hub 总入口 + 动态 Hero + 模块卡片 | 🟢 Demo v1 |
| Blog | 阅读优先的文章列表/归档 | 🟡 Demo v1，待正式主题迁移 |
| Notes | 知识树 + 阅读器 + TOC + 搜索 | 🟢 交互 Demo |
| Projects | 项目档案 + 状态/技术栈 + 筛选 | 🟢 交互 Demo |
| Toolbox | 工具分类 + 搜索 + 独立工具工作区 | 🟢 交互 Demo，已有 6 个工具 |
| Experience | 时间线 + Skills + HTML Resume + Print | 🟢 交互 Demo |
| About | 精简个人介绍 | 🟡 正式站已有内容，待统一视觉 |

状态说明：🟢 已达到当前原型目标；🟡 已有基础；🔵 待设计；🔴 阻塞。

## 已实现交互

- 全站 Hash 路由式 UI 切换和 Active Navigation。
- Light / Dark 切换。
- 响应式侧边导航和移动端布局。
- Notes：知识树切换、笔记搜索、正文工作区和 TOC 结构。
- Projects：项目状态、技术栈和分类筛选。
- Toolbox：工具搜索、独立工作区、JSON Formatter、进制转换、时间戳、Base64、CRC-16/CCITT-FALSE、文本 Diff。
- Experience：Profile、Skills、Timeline、Resume Mode 和浏览器 Print/PDF。
- `prefers-reduced-motion` 降低动画。

## UI Component Plan

正式迁移时逐步抽出：

- `HubSectionHeader`：Eyebrow + Title + Action
- `HubCard`：统一内容卡片
- `ProjectCard`：状态、技术栈、描述、链接
- `ToolCard`：工具图标、分类、快捷打开
- `TimelineItem`：Experience 时间线节点
- `SkillBadge`：技能标签
- `ContentRelation`：关联 Blog / Notes / Project
- `EmptyState`：未完成模块的统一占位状态

Hexo/EJS 阶段优先以 partial 实现；只有交互复杂度真正需要时再引入更重的前端架构。

## Design Tokens

```text
Primary       #2563EB
Accent        #06B6D4
Light BG      #F6F8FC
Dark BG       #080D18
Radius Large  22–32px
Card Motion   250–300ms
Content Max   1180–1320px
```

颜色通过 CSS Variables / Theme variables 管理，不在新组件中不断散落新的色值。

## 下一阶段任务

当前 UI Demo 已达到可以整体浏览和交互验收的程度。下一阶段不再继续无限扩展 Demo，而进入正式站迁移：

1. 抽取正式 Theme 的 Personal Hub Design Tokens 和基础组件。
2. 将 Experience / Projects / Notes 建立专用 EJS 页面模板。
3. 将 Toolbox 的工具 Registry 与工具逻辑迁入正式站点静态资源。
4. 统一 Blog / About 与新设计语言。
5. 建立 Experience / Projects 的结构化数据文件，减少模板硬编码。
6. 做中英文、移动端、Dark Mode、SEO 和构建专项检查。

## Definition of Done

一个正式页面只有满足以下条件才算完成：桌面/移动可用；Light/Dark 正常；中文/英文结构兼容；键盘和链接交互正常；无明显布局抖动；构建通过；内容可通过数据/Markdown 更新而不是修改模板硬编码。
