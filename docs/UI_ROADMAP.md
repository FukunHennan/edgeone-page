# Personal Hub UI Roadmap

本文档用于跟踪界面建设，避免一边开发一边重新定义页面。

## 页面状态

| 页面 | 当前目标 | 状态 |
|---|---|---|
| Home | Personal Hub 总入口 + 动态 Hero + 模块卡片 | 🟡 UI v1 已建立 |
| Blog | 阅读优先的文章列表/归档 | 🟡 复用现有主题，待重构 |
| Notes | 知识树 + Markdown 阅读器 + TOC | 🔵 待设计 |
| Projects | 项目卡片 + 项目详情 + 状态/技术栈 | 🔵 待设计 |
| Toolbox | 工具分类 + 搜索 + 独立工具工作区 | 🔵 待设计 |
| Experience | 时间线 + Skills + HTML Resume | 🔵 待设计 |
| About | 精简个人介绍 | 🟡 已有内容，待统一视觉 |

状态说明：🟢 完成；🟡 已有基础；🔵 待设计；🔴 阻塞。

## UI Component Plan

建议逐步抽出以下视觉组件：

- `HubSectionHeader`：Eyebrow + Title + Action
- `HubCard`：统一内容卡片
- `ProjectCard`：状态、技术栈、描述、链接
- `ToolCard`：工具图标、分类、快捷打开
- `TimelineItem`：Experience 时间线节点
- `SkillBadge`：技能标签
- `ContentRelation`：关联 Blog / Notes / Project
- `EmptyState`：未完成模块的统一占位状态

Hexo/EJS 阶段可先以 partial 实现；只有交互复杂度真正需要时再引入更重的前端架构。

## Design Tokens

```text
Primary       #2563EB
Accent        #06B6D4
Light BG      #F6F8FC
Dark BG       #080D18
Radius Large  22–32px
Card Motion   250–300ms
Content Max   1180–1220px
```

颜色应通过 CSS Variables / Theme variables 管理，不要在新组件中不断散落新的色值。

## 下一阶段任务

1. 完成 Experience 专用模板和 Resume Mode。
2. 完成 Projects 专用卡片及详情页模型。
3. 完成 Notes 三栏知识库界面。
4. 完成 Toolbox 首页及第一批真实工具。
5. 回头统一 Blog、About 与新设计语言。
6. 做一次移动端和深色模式专项检查。

## Definition of Done

一个页面只有满足以下条件才算完成：桌面/移动可用；Light/Dark 正常；中文/英文结构兼容；键盘和链接交互正常；无明显布局抖动；构建通过；内容可通过数据/Markdown 更新而不是修改模板硬编码。
