# 首页风景轮播 · 自托管素材说明

2026-10-22：已将首页四段风景视频和对应 WebP 封面**直接保存到仓库**，构建后作为 EdgeOne Pages 站内静态资源使用。浏览首页时不再向 Mixkit 或 Unsplash 请求视频、图片；离线兜底仍保留最初的本地 SVG。

## 已部署至仓库的资源

| 场景 | 视频（MP4） | WebP 封面 | 来源与作者 |
| --- | ---: | ---: | --- |
| 湖泊与远山 | `/scenes/mountain-lake.mp4` (2.42 MB) | `/scenes/mountain-lake.webp` (127 KB) | [Mikata Five Lakes (Video)](https://commons.wikimedia.org/wiki/File:Mikata_Five_Lakes_(Video).webm), Yoshi Canopus |
| 挪威海岸 | `/scenes/soft-coast.mp4` (0.28 MB) | `/scenes/soft-coast.webp` (16 KB) | [Ocean in Sommaroy](https://commons.wikimedia.org/wiki/File:Ocean_in_Sommaroy.webm), Netha Hussain |
| 微风草地 | `/scenes/green-meadow.mp4` (1.36 MB) | `/scenes/green-meadow.webp` (72 KB) | [The wind plays with grasses by a stream in Nickel Plate Park](https://commons.wikimedia.org/wiki/File:The_wind_plays_with_grasses_by_a_stream_in_Nickel_Plate_Park.webm), Extemporalist |
| 林间溪流 | `/scenes/misty-forest.mp4` (3.43 MB) | `/scenes/misty-forest.webp` (273 KB) | [Overlooking a forest creek in the Tsimpsean Peninsula](https://commons.wikimedia.org/wiki/File:Overlooking_a_forest_creek_in_the_Tsimpsean_Peninsula.webm), Extemporalist |

**许可**：以上四件原始媒体在各自 Wikimedia Commons 文件页面标注为 **CC0 1.0 Universal Public Domain Dedication**；保留这些来源与作者记录以便审计。许可详情：[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.en)。未经许可不要把素材声明为个人原创。

## 编码和大小

由 `tools/prepare-home-media.sh` 在 GitHub Actions Ubuntu 环境实际执行生成：

- H.264 MP4，1280 × 720，20 fps，最长 12 秒，禁用音轨，`faststart` 适合网页流式加载。
- WebP 封面取剪辑第 2 秒，质量 75。
- 运行时只给当前风景设置视频 `src`，切换后暂停上一段视频。
- 四段 MP4 合计约 **7.48 MB**，四张 WebP 合计约 **488 KB**。
- 单视频大小预算 6.5 MB；单 WebP 封面大小预算 600 KB。
- 所有 `/scenes/*.mp4`、`/scenes/*.webp`、`/scenes/*.svg` 均随 Astro 从 `astro-static/` 复制到构建产物。

## 交互与节能

- 每 14 秒自动切换，1.2 秒淡化；不再因鼠标悬停在大图上冻结轮播。
- 首页正文下的两个按钮入口与右下角常驻轮播栏已按视觉标注删除。博客和项目仍可从顶部导航进入。轮播自动进行，每 14 秒切换；也保留键盘左右方向键与手机左右滑动。
- 为兼顾无障碍，“暂停风景动画”和“沉浸模式”通过键盘 Tab 聚焦时显示，不常驻画面。鼠标双击风景可进入或退出沉浸模式；沉浸模式下仍显示退出按钮，也可按 Esc 退出。
- 移动设备启用低流量/慢速网络、用户启用减少动态效果、离线状态或播放错误时优先显示**本地 WebP 封面**。
- WebP 加载失败时回退到本地 SVG 插画，不依赖外站。
- 离开首页时清理定时器与播放状态。
- 全站双语切换仍在顶部导航，并使用页面真实的翻译目标链接。

## 维护方法

1. 在 `astro-src/components/CalmCarousel.astro` 的 `slides` 数组修改路径、标题和无障碍描述。
2. 如需更换风景，先确定素材版权与来源，再使用 `tools/prepare-home-media.sh` 中的白名单清单更新源地址；在能联网、安装 FFmpeg 的机器上执行 `bash tools/prepare-home-media.sh`。
3. 重新生成的四对 MP4/WebP 需存放到 `astro-static/scenes/` 并提交 GitHub，编辑 `tools/audit-astro.cjs` 对应清单。
4. 测试命令：`npm ci && npm run check`；构建审计会检查静态媒体的存在、文件签名和大小预算。
5. EdgeOne 部署后分别打开 `/zh-CN/` 与 `/en/`，用手机及桌面浏览器验证视频播放、滚动、暂停、静态回退和双语跳转。

**注意**：GitHub Actions 的生产构建审计不能替代真实浏览器视频播放和 EdgeOne 缓存验证，首次部署后仍须现场检查。
