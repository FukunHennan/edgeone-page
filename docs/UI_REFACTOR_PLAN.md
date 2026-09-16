# Personal Hub UI 全面重构计划

## 目标

把当前“Hexo 主题 + 新页面局部样式”彻底收敛成一套 Personal Hub Design System。Hexo 只负责内容和生成，Theme 负责完整产品界面。

## Layer 1 — Design Tokens

统一背景、Surface、文字、Border、Accent、Shadow、Radius、Spacing 和 Motion。Light / Dark 只切换 Token，不让页面分别维护两套颜色。

## Layer 2 — Global Shell

统一：Navbar、Page Canvas、Main Width、Footer、Search Overlay、Side Tools、Mobile Drawer、Swup transition。

Navbar 保持紧凑悬浮玻璃栏；内容区最大宽度 1220–1320px；背景只保留低对比网格和环境光，避免每个页面使用不同背景。

## Layer 3 — Workspace System

Notes、Projects、Toolbox 共用：

```text
Workspace
├── Hero
│   ├── Kicker
│   ├── Title
│   ├── Description
│   └── Search / Primary Action
├── Sidebar
│   ├── Category
│   └── Context Card
└── Content
    ├── Header
    ├── Filter / Meta
    └── Cards / App Panel
```

三个页面只改变数据和功能，不改变整体布局语言。

## Layer 4 — Content System

Blog / Article 使用阅读型系统：Archive Header、Article List、Tag、Metadata、Code Block、TOC。

Experience 使用 Profile + Timeline + Skills，并提供 A4 Resume Mode。

About 使用 Profile、Now、Capabilities、Contact，避免做成第二个首页。

## Layer 5 — Interaction

所有页面遵守：hover 120–220ms；页面进入由 Swup 负责；Reduced Motion 时关闭非必要动画；移动端不依赖 hover；Toolbox 操作面板必须可关闭并可键盘操作。

## Layer 6 — Code Cleanup

1. Markdown 只保留语义结构与页面数据。
2. 公共 CSS 全部进入 Theme。
3. 页面 JS 迁移到 `themes/edg-one-page/source/js/`。
4. 初始化函数必须兼容 DOMContentLoaded 和 Swup content replacement。
5. 删除重复旧样式前先确认没有普通 Hexo 页面依赖。

## 一次构建前应该完成的批次

### Batch A — Foundation
Navbar + Canvas + Workspace bypass + tokens + responsive shell。

### Batch B — Core Workspaces
Notes + Projects + Toolbox 一次完成并本地联调。

### Batch C — Identity
Experience + Resume + About。

### Batch D — Publishing
Blog archive + Article + Search + Footer + Side tools。

### Batch E — QA
中英文、Light/Dark、桌面/手机、Swup、打印、SEO、生产 audit。

每个 Batch 最好只触发一次 GitHub Actions。
