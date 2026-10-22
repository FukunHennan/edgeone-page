# 首页照片轮播：纯图片、真全屏、无旧视频

2026-10-22 实施记录：**首页不再播放 MP4 视频，而是四张独立风景照片每 14 秒缓慢切换。** 风景铺满浏览器整个可视区域，无四周留白、外框圆角或卡片阴影。中文和英文页面同样生效。

## 新的网页照片资源

| 场景 | 本地资源 | 来源 |
| --- | --- | --- |
| 山间湖泊 | `/scenes/gallery-mountain.webp` | Unsplash `photo-1501785888041-af3ef285b470` |
| 宁静海岸 | `/scenes/gallery-coast.webp` | Unsplash `photo-1507525428034-b723cf961d3e` |
| 日光草甸 | `/scenes/gallery-meadow.webp` | Unsplash `photo-1470252649378-9c29740c9fa8` |
| 森林 | `/scenes/gallery-forest.webp` | Unsplash `photo-1448375240586-882707db888b` |

资源通过一次性流程从 Unsplash 官方图片分发链接下载并压缩成 1920×1080 WebP，尺寸约 106–368 KB/张。正式网站从自己的 `/scenes/` 静态目录加载，不需要实时访问 Unsplash。来源许可：[Unsplash License](https://unsplash.com/license)。

**特别说明：** 这次 Git 仓库中导入的是可公开获取并自托管的风景摄影照片，**不是**聊天中生成的四张原创风景图。你选定的四张原创图片仍保留在本对话的素材 ZIP 中；后续如果要精确使用那四张，请将其作为仓库新资源上传并更新下面的 `slides` 路径。不能把这两套照片称为相同素材。

## 旧资源清理

- 删除所有 `astro-static/scenes/{mountain-lake,soft-coast,green-meadow,misty-forest}.{mp4,webp,svg}`：包括 4 个旧 MP4、4 张从视频截取的 WebP、4 张旧 SVG 插画。
- 删除旧的 `tools/prepare-home-media.sh` 和一次性照片导入工作流，避免误操作恢复视频架构。
- 首页 Astro 组件不包含 `<video>`、`data-video-src` 或 `poster`，脚本无视频播放、缓存、流量判断和监听。
- 内页横幅（博客、项目、关于等）改为新图库的静态照片；文章与项目的 `/covers/article-*.`、`/covers/project-*.` 临时封面保持不变。
- CI 审计拒绝老旧图片、视频文件以及代码中的首页视频标签。

## 视觉标准

- **画面完全填充窗口**：`width:100%`、`height:100dvh`（兼容 `100svh`）、`object-fit:cover`。风景将按设备屏幕比例裁切，确保不露底。
- 顶部导航半透明直接叠加在照片上，不是单独一条留白的导航栏。
- 左侧欢迎文字，取消首页 CTA 和右下角常驻轮播控件；双击可切换沉浸模式。
- 自动每 14 秒切换，照片之间 1.5 秒柔和淡化；支持手机左右滑动、键盘方向键和键盘聚焦时显示的暂停按钮。
- 遵守系统“减少动画效果”设置，不自动切换且关闭镜头轻微推近。

## 维护

- 资源：`astro-static/scenes/gallery-*.webp`
- 页面：`astro-src/components/CalmCarousel.astro`
- 样式：`astro-src/styles/calm-home.css`
- 控制：`astro-src/scripts/calm-carousel.ts`
- 内页风景：`astro-src/components/ScenicBanner.astro` 和 `astro-src/styles/interior-pages.css`
- 构建核查：`tools/audit-astro.cjs`

执行 `npm ci && npm run check`。通过后还需真实浏览器视觉验收：1440×900、390×844、中英文首页、顶部导航、图像裁切和 Swup 导航。GitHub Actions 的静态构建不能证明线上 EdgeOne 已更新。
