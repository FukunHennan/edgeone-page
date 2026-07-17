# EdgeOne Page

EdgeOne Page 是一个面向腾讯云 EdgeOne Pages 的 Hexo 站点项目，提供响应式布局、深色模式、文章目录以及简体中文、繁體中文和 English 运行时切换。

## 当前配置

- 默认语言：`zh-CN`
- 构建命令：`npm run build:production`
- 输出目录：`public`
- Node.js：20 或更高版本
- 主题：`themes/edg-one-page`
- 主题覆盖：`_config.edg-one-page.yml`
- 部署配置：`.edgeone/config.json`

## 本地开发

```bash
npm ci
npm run server
```

访问终端中显示的本地地址即可预览。需要显示草稿时运行：

```bash
npm run server:draft
```

## 构建与检查

```bash
npm run build
npm run check
```

`npm run build` 会先清理旧输出，再生成完整静态站点。生成结果位于 `public/`。

## 配置分层

项目将配置分成两层：

1. `_config.yml`：Hexo 站点、URL、文章路径、分页和构建行为。
2. `_config.edg-one-page.yml`：主题品牌、导航栏、首页、文章样式、评论、页脚和插件。

尽量不要直接修改 `themes/edg-one-page/_config.yml`。项目专属设置应写入主题覆盖文件，便于后续升级主题代码。

## EdgeOne Pages 部署

仓库已经包含 `.edgeone/config.json`：

- Build command：`npm run build:production`
- Output directory：`public`

在 EdgeOne Pages 控制台连接此仓库并选择 `master` 分支即可。推送到 `master` 后，平台可以按上述配置重新构建。

## 可选功能

以下功能默认关闭，需要填写真实服务信息后再启用：

- 评论系统：`comment.enable`
- Google Analytics：`global.google_analytics`
- 网站访问计数：`global.website_counter`
- CDN：`cdn`
- 本地搜索：安装搜索生成插件后启用 `navbar.search`

更完整的说明见 [`CONFIGURATION.md`](CONFIGURATION.md)。

## 项目结构

```text
.
├── .edgeone/config.json
├── .github/workflows/build.yml
├── _config.yml
├── _config.edg-one-page.yml
├── CONFIGURATION.md
├── package.json
├── source/
└── themes/edg-one-page/
```

## License

主题代码沿用仓库内声明的 GPL-3.0 许可。
