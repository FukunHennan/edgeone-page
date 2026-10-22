# 首页实景视频轮播 · 维护说明

首页采用四段真实自然风景视频（静音、循环）组成的轻量轮播，保留顶部导航；博客、笔记、项目、经历、简历等页面不变。**语言切换统一位于顶部导航栏**，不再出现在页面底部或手机菜单底部。

## 资源清单

| 场景 | MP4 来源 | 静态照片兜底 |
| --- | --- | --- |
| 山湖 | Mixkit: `mixkit-landscape-of-the-snowy-mountain-with-a-lake-4732-large.mp4` | Unsplash: `photo-1501785888041-af3ef285b470` |
| 海浪 | Mixkit: `mixkit-waves-in-the-water-1164-large.mp4` | Unsplash: `photo-1507525428034-b723cf961d3e` |
| 草甸 | Mixkit: `mixkit-countryside-meadow-4077-large.mp4` | Unsplash: `photo-1470252649378-9c29740c9fa8` |
| 森林溪流 | Mixkit: `mixkit-forest-stream-in-the-sunlight-529-large.mp4` | Unsplash: `photo-1448375240586-882707db888b` |

播放器仅在切到对应场景时设置视频 `src`，避免首次打开时同时下载全部视频。照片是视频无法播放、弱网或系统启用“减少动态效果”时的兜底。本地原创 SVG 继续保留为图片无法加载的进一步兜底素材，位于 `astro-static/scenes/`。

**运行依赖**：视频由 Mixkit 的公开资源地址提供，照片由 Unsplash 提供，因此实时视频效果依赖用户设备能访问这两个外部域名。本仓库并未托管 MP4。外部地址未来可能变动或限制跨站引用；正式长期运营推荐在遵守素材许可的前提下下载并转码为短小的 WebM/MP4，自行托管到 EdgeOne 静态资源或对象存储，再将 `video` / `poster` 改为站内 URL。

**素材许可**：使用前/更换素材时核对每个素材的具体许可。Mixkit 的免费素材页面通常采用 [Mixkit Video Free License](https://mixkit.co/license/)，但网站也有受限素材；Unsplash 图像遵循 [Unsplash License](https://unsplash.com/license)。不要未经授权改用受限素材。

## 交互行为

- 8 秒切换一幕。当前场景的静音视频循环播放；离开场景时暂停上一段，手动“暂停”按钮同时停止自动切换和视频播放。
- 支持左右按钮、分页圆点、键盘左右方向键与触屏左右滑动。
- 标签页隐藏时暂停视频和自动切换；鼠标悬停或控制器获取焦点时暂停自动切换，避免操作时跳帧。
- 用户系统偏好减少动画时不自动播放视频或幻灯片，但可以手动切换静态照片。
- Swup 页面切换离开首页时清理定时器、事件和视频播放。

## 语言导航

- `themes/edg-one-page/layout/components/header/navbar.ejs`：顶栏语言选择器，桌面与手机分别适配。
- `astro-src/scripts/theme-runtime.ts`：语言变更时保留当前对应的双语路径、查询字符串及锚点。
- `astro-src/layouts/Shell.astro`：删除原底部语言切换链接。
- 双语路径遵循 `/zh-CN/...`、`/en/...`；既有文章对应双语 slug 需保持一致。

## 主要文件

- `astro-src/components/CalmCarousel.astro`：编辑视频 URL、照片、标题和文案。
- `astro-src/scripts/calm-carousel.ts`：轮播计时、视频加载、暂停和生命周期。
- `astro-src/styles/calm-home.css`：视频铺满画面及手机布局。
- `astro-src/styles/site.css`：顶栏语言选择器尺寸。
- `tools/audit-astro.cjs`：静态产物审计。

## 验证

```bash
npm ci
npm run check
npm run dev
```

上线前检查 375、768、1280px 视口，中英双语、深浅色、手动切换、弱网照片兜底，以及手机 Safari/Chrome 的静音自动播放。GitHub Actions 构建通过不能代替浏览器播放验证。
