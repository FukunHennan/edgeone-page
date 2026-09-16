# Personal Hub 产品与界面设计文档

> EdgeOne Page 不再只是个人博客，而是一个长期维护的个人数字工作空间。

## 1. 产品定位

Personal Hub = 个人主页 + 博客 + 知识库 + 项目档案 + 在线简历 + 工具平台。

设计目标：

- 内容可以持续增长，而不是所有功能堆在首页。
- Blog、Notes、Projects、Toolbox、Experience 使用不同的信息架构，但保持统一视觉语言。
- 桌面端强调信息密度与效率，移动端保持完整可用。
- 保留浅色/深色模式、全局搜索、多语言和 Swup 页面切换。
- 页面动效应帮助理解层级，不做无意义的高频动画。

## 2. 顶级导航

```text
Home · Blog · Notes · Projects · Toolbox · Experience · About
                                           Search · Theme · GitHub
```

## 3. 页面体系

### Home
Personal Hub 总入口。包含 Hero、核心模块入口、最近更新、精选项目与快捷工具。

### Blog
面向发布和阅读。支持文章封面、日期、分类、标签、目录、推荐阅读和搜索。

### Notes
面向个人知识管理。左侧知识树，中间正文，可扩展右侧目录。优先服务 Linux、ESP32、STM32、KiCad、网络、视觉与研究笔记。

### Projects
项目档案。每个项目应包含状态、简介、技术栈、时间线、相关仓库、相关 Blog/Notes，以及可选 Demo。

### Toolbox
在线工具中心。按开发、网络、嵌入式、文本分类。工具应尽量本地运行，避免不必要的数据上传。

### Experience
个人经历与 HTML Resume。普通模式用于展示个人故事、技能和项目时间线；Resume 模式提供干净的 A4 打印布局，并作为 PDF 简历的数据源。

### About
更轻量的个人介绍、联系方式、站点说明和链接。

## 4. 首页视觉规范

首页使用大尺寸 Hero + Bento/Card Grid，而不是传统博客文章瀑布流。

```text
┌──────────────────────────────────────────────────────────┐
│ PERSONAL HUB · BUILD / LEARN / CREATE                    │
│                                                          │
│ 我的数字工作空间                                         │
│ 记录技术、项目与知识，也把真正有用的小工具放在这里。      │
│                                                          │
│ [探索项目 ↗] [打开工具箱 →]                              │
│                            ESP32 LINUX ROBOTICS VISION    │
└──────────────────────────────────────────────────────────┘

EXPLORE
从这里开始
┌─────────────────────┐ ┌─────────────────────┐
│ Notes / Knowledge   │ │ Projects            │
└─────────────────────┘ └─────────────────────┘
┌─────────────────────┐ ┌─────────────────────┐
│ Toolbox             │ │ Experience          │
└─────────────────────┘ └─────────────────────┘

LATEST
最近更新
┌────────────┐ ┌────────────┐ ┌────────────┐
│ Post 01    │ │ Post 02    │ │ Post 03    │
└────────────┘ └────────────┘ └────────────┘
```

视觉关键词：工程感、克制、清晰、现代、轻科技，不使用过度 AI 风格的霓虹和复杂装饰。

动效：
- Hero 背景使用低频漂移光晕。
- 卡片 Hover 上浮 4–7px。
- Swup 页面切换继续作为全站主过渡。
- 尊重 `prefers-reduced-motion`。

## 5. Experience / Resume 设计

```text
Experience
├── Profile
├── Skills
├── Timeline
├── Selected Projects
├── Education
├── Awards / Research
└── Resume Mode
    ├── 中文
    ├── English
    └── Print / PDF
```

原则：Experience 数据只维护一份。网页展示和打印简历都从相同数据生成，避免 HTML、Word、PDF 三份内容长期不同步。

## 6. 内容模型

```text
Content
├── posts/       Blog
├── notes/       Knowledge Base
├── projects/    Project Showcase
├── tools/       Interactive Apps
└── experience/  Resume / Timeline
```

共享能力：Tags、Categories、Search、Metadata、i18n、Theme。

## 7. 项目关联

内容之间应建立关系，而不是形成孤岛：

```text
             Blog
              │
Experience ─ Project ─ Notes
              │
             Tools
```

例如 Fish 项目页可以关联 Fish 开发日志、ESP32/WebSocket/OTA 笔记，以及相关调试工具。

## 8. 目录约定

主题 UI：

```text
themes/edg-one-page/
├── layout/
│   ├── components/
│   └── pages/
└── source/css/
    └── layout/
```

内容：

```text
source/
├── zh-CN/
│   ├── _posts/
│   ├── notes/
│   ├── projects/
│   ├── tools/
│   └── experience/
└── en/
```

设计文档统一放在 `docs/`。

## 9. 开发阶段

### Phase 1 — UI Foundation
完成首页、全局导航、设计 Token、响应式和基础动效。

### Phase 2 — Core Pages
分别建立 Notes、Projects、Toolbox、Experience 的专用界面，不再仅依赖通用 Markdown Page 模板。

### Phase 3 — Data & Relations
为 Project / Tool / Experience 建立结构化数据模型，并加入跨内容关联。

### Phase 4 — Search & Productivity
增强全局搜索、快捷入口、标签筛选、知识树、项目状态与工具收藏。

### Phase 5 — Resume & Polish
完成打印简历、中英文数据同步、SEO、性能、可访问性和最终视觉统一。

## 10. 当前开发原则

1. `master` 必须始终保持可构建。
2. 大规模 UI 改造优先拆成可验证的小提交。
3. 不为了动画牺牲移动端性能。
4. 内容数据与视觉组件分离。
5. 新功能必须考虑中英文路径和后续扩展。
6. 每完成一个核心页面，同步更新本设计文档。
