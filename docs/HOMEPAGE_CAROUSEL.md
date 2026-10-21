# 首页风景轮播维护说明

首页已从密集的卡片式 Dashboard 改为四张风景图片的全屏轮播，博客、笔记、项目、经历、简历等页面及顶栏导航保持不变。

## 修改图片

图片统一放在 `astro-static/scenes/`，当前四幅为项目内的原创矢量插画：

- `mountain-lake.svg` — 山湖
- `soft-coast.svg` — 海岸
- `green-meadow.svg` — 草甸
- `misty-forest.svg` — 森林

可换成自己的 JPG / WebP / AVIF 风景照片（建议 1600×900 或更高分辨率、横屏 16:9、单张尽量不超过 300 KB）。将文件放入 `astro-static/scenes/`，并在 `astro-src/components/CalmCarousel.astro` 的 `slides` 数组中修改对应 `src`、中文 / 英文 `alt` 和标题。

请注意：`tools/audit-astro.cjs` 当前校验四幅本地 SVG 资源。如删除或重命名资源，也要同步更新该文件的资源清单和首页标记断言。

## 轮播行为

- 8 秒自动切换，手动选择、左右按钮、键盘方向键及手机左右滑动均可使用。
- 鼠标悬停、焦点停留以及切到其他浏览器标签页时暂停；可以使用暂停 / 播放按钮控制。
- 系统设置“减少动态效果”时关闭自动播放，仍可手动切换。
- 页面通过 Swup 切换时统一清理计时器和监听。
- 桌面采用近满屏画面，手机端让画面优先占据视野；保持原有站点导航与双语路由。

## 代码位置

- `astro-src/pages/[lang]/index.astro` — 首页路由
- `astro-src/components/CalmCarousel.astro` — 轮播视图与中英文文案
- `astro-src/styles/calm-home.css` — 响应式风格
- `astro-src/scripts/calm-carousel.ts` — 自动播放、切换与生命周期
- `astro-src/scripts/theme-runtime.ts` — 全站初始化
- `tools/audit-astro.cjs` — 生产构建审计

## 验证命令

```bash
npm ci
npm run check
npm run dev
```

发布前建议分别检查 375px、768px 和 1280px 宽度，以及中文、英文、浅色、深色和手动轮播控件。
