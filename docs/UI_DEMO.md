# Personal Hub UI Demo

`docs/ui-demo/` 是与正式 Hexo 构建解耦的交互式界面原型。

## 目的

先确定多个页面之间的视觉关系、导航、动效和信息密度，再把确认后的设计逐步移植到 `themes/edg-one-page`。这样可以避免每次试 UI 都触碰线上主题核心。

## 页面

- `#home`：Personal Hub 首页
- `#blog`：博客
- `#notes`：三栏知识库
- `#projects`：项目档案
- `#tools`：工具中心
- `#experience`：个人经历 / Resume

## 本地预览

直接打开 `docs/ui-demo/index.html` 即可。也可以在仓库根目录运行任意静态 HTTP Server 后访问 `/docs/ui-demo/`。

## 动效

原型已经包含：页面切换淡入/上移动画、导航 Hover/Active、卡片 Hover、Hero 浮动光晕、主题切换和响应式布局。正式主题仍继续使用 Swup 完成无刷新页面切换。

## 注意

此目录是设计原型，不参与正式内容模型。正式站点页面仍由 Hexo + `themes/edg-one-page` 构建。原型确认后，将组件逐步迁移到 EJS partial / Stylus，并保持中文、英文和移动端一致。
