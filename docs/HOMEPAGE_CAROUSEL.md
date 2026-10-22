# 首页实景轮播 · 维护与部署

首页维持「安静的风景 + 极简入口」，四段真实风景素材搭配静态照片；博客、笔记、项目与经历仍通过顶栏访问。2026-10-22 的优化优先考虑稳定性、节省流量和中英文对应页面跳转。

## 实景资源

| 场景 | 来源条目 | 备选照片 | 本地离线兜底 |
| --- | --- | --- | --- |
| 山湖 | [Mixkit 42490](https://mixkit.co/free-stock-video/landscape-with-mountains-and-a-lake-seen-from-above-42490/) | Unsplash 1501785888041 | `/scenes/mountain-lake.svg` |
| 海浪 | [Mixkit 1164](https://mixkit.co/free-stock-video/waves-in-the-water-1164/) | Unsplash 1507525428034 | `/scenes/soft-coast.svg` |
| 草甸 | [Mixkit 4075](https://mixkit.co/free-stock-video/countryside-meadow-4075/) | Unsplash 1470252649378 | `/scenes/green-meadow.svg` |
| 森林 | [Mixkit 529](https://mixkit.co/free-stock-video/forest-stream-in-the-sunlight-529/) | Unsplash 1448375240586 | `/scenes/misty-forest.svg` |

修正了原先草甸 4077、山湖 4732 等未核实编号；现在四个条目均对应公开的素材页面。**仍需在真实浏览器核验每个视频预览 MP4 的可访问性**：素材页面存在不等于 CDN 预览链接永远有效。

授权：使用或重新托管素材前，请分别核对素材具体许可；上述对应页面列为 Mixkit Stock Video Free License，且 [Mixkit 许可](https://mixkit.co/license/) 对 Free / Restricted 有不同条款。照片遵循 [Unsplash License](https://unsplash.com/license)。

### 长期自托管建议（待实施）

目前视频仍为 Mixkit CDN、照片为 Unsplash CDN，未直接保存到 GitHub 或 EdgeOne。这是运行时外部依赖，无法用静态构建审计保证可用。

长期建议：从各素材官方页面依法下载 HD 原文件，裁出 8–15 秒片段，使用 H.264 MP4（可选 WebM）压缩至单段约 2–5 MB；制作 1200–1600px 的 WebP 真实照片封面。上传 EdgeOne 支持的静态资源或对象存储后，将 `astro-src/components/CalmCarousel.astro` 中 `video` / `poster` 修改为站内 URL。不要把不明版权的视频直接上传到公共仓库。

## 前端行为

- 每 14 秒自动切换一次，画面之间 1.2 秒交叉淡化；不再因鼠标停留在首页大图上而冻结轮播。
- 视频只在成为当前场景时才设置 `src`。旧画面与浏览器非活动标签页停止播放。
- 低流量模式、2G / 3G、离线以及系统启用「减少动态效果」时不加载/播放视频，优先保留风景照片。照片加载失败回退至仓库自带的 SVG。
- 保留手动上一张、下一张、圆点、键盘方向键及手机滑动；键盘焦点操作时暂停自动切换。
- 新增右下角「沉浸模式」，只展示风景与退出按钮；按 Esc 可退出。离开首页自动还原原有导航。
- 用户主动暂停时同时停止自动换页和视频，恢复播放后再重新计时。
- 不自动播放音频。

## 中英文跳转

`Shell.astro` 将当前页面实际翻译地址传给 `themePartial('navbar', ...)`；导航选择器通过 `data-alternate-href` 获取目标地址，而不是单纯替换 `/zh-CN/` 或 `/en/`。文章可能有不同的翻译路径，也能跳转正确。

涉及文件：

- `astro-src/lib/theme.ts` — 注入翻译地址到 EJS。
- `astro-src/layouts/Shell.astro` — 传递 `otherPath`。
- `themes/edg-one-page/layout/components/header/navbar.ejs` — 顶栏控件接收 `data-alternate-href`。
- `astro-src/scripts/theme-runtime.ts` — 顶栏切换语言。
- `astro-src/components/CalmCarousel.astro` — 视频及封面资源。
- `astro-src/scripts/calm-carousel.ts` — 轮播、沉浸和网络状态控制。
- `astro-src/styles/calm-home.css` — 过渡和沉浸样式。
- `tools/audit-astro.cjs` — 页面静态结构、双语导航、资源引用审计。

## 验证

```bash
npm ci
npm run check
npm run dev
```

构建成功不等于视频实际播放成功。发布后应人工检查：4 个 MP4 实际可播、封面加载失败回退、网络限制、低流量模式、手机 Safari/Chrome、320px/375px/768px/1280px 排版、首页沉浸按钮、Esc 退出、中文文章切换英文文章及返回、Swup 页面切换。
