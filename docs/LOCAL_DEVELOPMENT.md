# Personal Hub 本地开发与低成本构建流程

线上双语构建较慢，所以日常 UI 开发不要每改一次就等待 GitHub Actions。仓库已经提供“快速单语言预览”和“正式双语验收”两条路径。

## 1. 第一次准备

要求 Node.js 22.23.2、npm 10.9.8。克隆仓库后只需要安装一次依赖：

```bash
git clone https://github.com/FukunHennan/edgeone-page.git
cd edgeone-page
npm ci
```

## 2. 日常改界面：快速模式

中文界面：

```bash
npm run dev
```

浏览器打开：

```text
http://127.0.0.1:4000/zh-CN/
```

英文界面：

```bash
npm run dev:en
```

浏览器打开：

```text
http://127.0.0.1:4000/en/
```

Hexo server 会监听文件变化。修改 EJS、Stylus、Markdown 后刷新浏览器即可，不需要提交 GitHub，也不需要完整构建中英文站点。

## 3. 推荐的 UI 开发节奏

一次完整界面改造建议集中完成后再提交：

1. 修改 Theme Foundation：颜色、间距、导航、背景、页面 Canvas。
2. 修改 Workspace Shell：Hero、Sidebar、Content、Cards、Panels。
3. 一次性检查 Home / Notes / Projects / Toolbox / Experience / About。
4. 检查 1440px、1024px、768px、390px 四种宽度。
5. 检查 Light / Dark。
6. 检查 Swup 页面切换后交互是否还工作。
7. 本地满意后运行 `npm run check:content`。
8. 准备推送前运行 `npm run check` 做完整双语构建和 audit。
9. 最后只推送一个完整阶段的 commit，让 GitHub Actions 只跑一次。

## 4. 正式发布前检查

```bash
npm run check
```

它会执行运行环境检查、双语内容校验、生产构建和生产 audit。这一步比 `npm run dev` 慢，但应该只在一个阶段完成后运行。

如果只想构建生产文件并在本机查看：

```bash
npm run preview:production
```

默认生产预览地址为：

```text
http://127.0.0.1:4173/zh-CN/
http://127.0.0.1:4173/en/
```

## 5. 页面架构约定

Personal Hub 页面分为两类：

- 普通内容页：继续使用 Hexo 的 `.page-template-container`。
- Workspace 页：根节点使用 `.workspace-page` 或 `.hub-shell`，由 Personal Hub 自己接管画布，不再套旧主题卡片。

Workspace 页面应优先复用这些公共类：

```text
.workspace-page
.workspace-hero
.workspace-kicker
.workspace-search
.workspace-layout
.workspace-sidebar
.workspace-content
.workspace-content-head
.workspace-side-card
```

不要在每个 Markdown 页面重新复制一整套视觉 CSS。页面只保留内容结构和必要的业务交互；公共视觉进入 `themes/edg-one-page/source/css/layout/personal-hub.styl`。

## 6. 下一轮重构目标

先完成界面系统，不继续堆功能：

- 全站统一导航与背景 Canvas。
- Notes / Projects / Toolbox 使用同一 Workspace Shell。
- Blog 使用阅读型列表，不强行做成工具工作区。
- Experience 增加 Web / Resume 两种模式。
- About 使用 Profile + Skills + Contact 布局。
- Footer、Search、Side Tools、文章页全部收口到同一视觉语言。
- 清理 Markdown 内重复 CSS，逐步把 JS 抽到 Theme assets。

目标是一次较大的 UI 阶段完成后再触发一次正式构建，而不是每修改一个卡片就构建一次。
