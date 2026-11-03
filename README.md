# EdgeOne Page

EdgeOne Page 是部署在腾讯云 EdgeOne 国际站的 Astro 双语站点，使用以下语言：

- 简体中文：`zh-CN`
- English：`en`

站点不是在浏览器中临时翻译文章，而是分别保存并构建中文、英文两个版本。选择语言后，导航、页面文字、文章标题和文章正文都会打开对应语言的静态页面。

## 站点结构

生产构建会生成：

```text
astro-dist/
├── index.html          # 跳转到中文首页
├── zh-CN/              # 简体中文站点
└── en/                 # English site
```

文章源文件分别保存在：

```text
source/
├── zh-CN/_posts/
└── en/_posts/
```

同一篇文章必须使用相同的相对文件路径和 `translation_key`。例如：

```text
source/zh-CN/_posts/hello-world.md
source/en/_posts/hello-world.md
```

中文文章：

```yaml
---
title: 你好，EdgeOne Page
lang: zh-CN
translation_key: hello-world
content_type: article
domain: site
---
```

英文文章：

```yaml
---
title: Hello, EdgeOne Page
lang: en
translation_key: hello-world
content_type: article
domain: site
---
```

## 创建双语文章

运行：

```bash
npm run new:post -- my-article-slug
```

这会同时创建：

```text
source/zh-CN/_posts/my-article-slug.md
source/en/_posts/my-article-slug.md
```

然后分别完成中文和英文正文，选择具体的 `domain`，并在发布前把 `published` 改为 `true`。文章保存后无需在访问时再次翻译。

## 本地预览

使用 Node.js ≥ 22.21.1 且 < 23、npm ≥ 10.9.0 且 < 11。仓库通过
`.node-version` 和 `.nvmrc` 固定本地版本为 22.23.2。
Windows 已安装 fnm 时，可在当前 PowerShell 会话执行：

```powershell
fnm env --shell powershell | Out-String | Invoke-Expression
fnm use
```

安装依赖：

```bash
npm ci
```

预览 Astro 站点：

```bash
npm run dev:astro
```

生产构建完成后预览产物：

```bash
npm run build:production
npm run preview:astro
```

## 校验与构建

只检查文章是否成对：

```bash
npm run check:content
```

完整检查并构建：

```bash
npm run check
```

生产构建：

```bash
npm run build:production
```

校验器会检查：

- 中文和英文文章是否同时存在
- 两个文件的相对路径是否相同
- `lang` 是否正确
- `translation_key` 是否存在并一致
- 同一语言内是否存在重复 `translation_key`
- 文章类型、功能域和旧分类/标签地址对应的 Astro 页面是否完整

任何检查失败都会阻止部署。

## 语言切换

导航栏只显示 `简体中文` 和 `English`。

切换语言时，程序会保留当前页面路径，例如：

```text
/zh-CN/posts/hello-world/
/en/posts/hello-world/
```

因为双语文章使用相同的文件路径，所以切换后会直接打开对应语言版本，而不是返回首页。

站点根路径跳转到 `/zh-CN/`；每个页面都提供对应语言的入口。

## 配置文件

```text
astro.config.mjs            # Astro 构建与站点 URL
astro-src/                  # 页面、布局和交互
astro-static/               # 静态资源
edgeone.json                # EdgeOne 构建、路由和响应头
source/{zh-CN,en}/          # 双语内容源
```

更完整的设置说明见 [`CONFIGURATION.md`](CONFIGURATION.md)。

## EdgeOne Pages

现行主配置是 `edgeone.json`：

- Build command：`npm run build:production`
- Output directory：`astro-dist`
- Node 版本：`22.21.1`

`.edgeone/config.json` 是旧配置，仅保留构建命令和输出目录，同样指向 `astro-dist`。

国际站 `edgeone-page` 项目连接仓库的 `master` 分支，发布到 `edgeone.chenfukun.space`。`chenfukun.space` 根域名不作为当前发布入口。

## 仓库管理规范

### 分支

- `master` 是唯一的主干分支，始终保持可上线状态，只接收合并、不直接提交。
- 新功能或修复开独立分支（如 `feat/xxx`、`fix/xxx`），完成后合并回 `master` 并**立即删除**该分支，避免分支堆积。

### 提交信息

遵循 Conventional Commits，统一使用 `<type>(<scope>): <描述>` 格式，其中 `type` 取值：

- `feat` 新功能
- `fix` 修复
- `refactor` 重构（不改行为）
- `docs` 文档
- `style` 格式（不影响逻辑）
- `chore` 杂项（构建、依赖等）

### 版本 tag

使用语义化版本（SemVer）标记里程碑，格式 `v主.次.补丁`：

- 主版本：不兼容的大改动
- 次版本：向后兼容的新功能
- 补丁：仅修复 bug

只在「值得标记的节点」打 tag（如发布、大功能完成），不要用描述性文字命名（避免「第一版本」这类无法排序的名称）。

## License

主题代码沿用仓库内声明的 GPL-3.0 许可。
