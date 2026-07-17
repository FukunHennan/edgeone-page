# EdgeOne Page 配置指南

## 1. 站点地址与身份

编辑 `_config.yml`：

```yaml
title: EdgeOne Page
author: FukunHennan
url: https://your-domain.example
root: /
```

绑定自定义域名后，必须将 `url` 修改为最终 HTTPS 地址。站点部署在子目录时，同时修改 `root`。

## 2. 主题品牌

编辑 `_config.edg-one-page.yml` 中的 `info`、`defaults` 和 `home_banner`。项目专属配置不应写回 `themes/edg-one-page/_config.yml`，否则后续同步主题代码时容易产生冲突。

## 3. 导航栏

`navbar.links` 支持站内路径和完整外部地址：

```yaml
navbar:
  links:
    Home:
      path: /
      icon: fa-regular fa-house
    GitHub:
      path: https://github.com/FukunHennan/edgeone-page
      icon: fa-brands fa-github
```

名称会尝试从语言包中查找翻译。自定义名称没有翻译时会显示配置名称。

## 4. 多语言

站点默认语言由 `_config.yml` 的 `language` 决定。页面右上角可在以下语言间切换：

- `zh-CN`
- `zh-TW`
- `en`

浏览器会在本地保存用户选择。新增界面文案时，应同步维护 `themes/edg-one-page/languages/` 下对应语言文件，并为模板元素添加 `data-i18n` 属性。

## 5. 评论系统

评论默认关闭。启用 Giscus 前，需要在 GitHub Discussions 中创建分类，然后填写：

```yaml
comment:
  enable: true
  system: giscus
  config:
    giscus:
      repo: owner/repository
      repo_id: your-repository-id
      category: Announcements
      category_id: your-category-id
```

不要提交私钥、客户端密钥或其他敏感凭据。

## 6. 统计和分析

访问计数和 Google Analytics 默认关闭。启用分析时，仅提交公开的 Measurement ID；其他密钥应通过部署平台环境变量管理。

## 7. CDN

默认使用仓库内静态资源：

```yaml
cdn:
  enable: false
```

只有在资源已发布到稳定 CDN 后才启用。自定义 CDN 地址必须能映射到主题 `source/` 目录结构。

## 8. 构建命令

```bash
npm ci
npm run build:production
```

部署输出为 `public/`。`npm run check` 会使用调试日志执行一次完整构建，适合排查模板和配置错误。

## 9. EdgeOne Pages

`.edgeone/config.json` 是平台构建入口。通常无需修改输出目录。更换构建脚本时，应同步更新 `package.json` 和 `.edgeone/config.json`，避免本地与云端行为不一致。

## 10. 安全建议

- 不要提交 `.env`、令牌、私钥或评论服务密钥。
- 外部链接使用 HTTPS。
- 修改依赖后同时提交更新后的 `package-lock.json`。
- 合并到 `master` 前确认 GitHub Actions 构建通过。
