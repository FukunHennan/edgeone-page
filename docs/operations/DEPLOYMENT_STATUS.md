# 部署状态记录

更新于 2026-10-17。线上项目是 EdgeOne 国际站 `edgeone-page`，项目 ID
`pages-xidayxfw3y70`，GitHub 源为 `FukunHennan/edgeone-page` 的 `master`。
生产地址为 `https://edgeone.chenfukun.space/`。

## 已验证

- 提交 `9f6862a` 将平台 Node 从 22.11.0 提升至 22.21.1，解决 Astro 依赖安装失败。
- 平台部署 `dp4w6m26yzig` 成功，中文和英文页面均返回 2026-10-17 的新产物。
- 生产构建现由 `npm run build:production` 运行 Astro，输出 `astro-dist/`。发布前用
  Node 22.21.1 和 npm 10.x 执行 `npm run check`。
- GitHub 集成项目由 EdgeOne 在 `master` 更新后自动构建；CI 的直传步骤默认跳过。
  对该 GitHub 项目运行 `edgeone makers deploy` 会因 Provider 类型不符而被拒绝。

## 域名边界

`edgeone.chenfukun.space` 已绑定生产环境。`chenfukun.space` 根域名不作为当前发布
入口，Cloudflare 没有为它配置网站解析记录。此前曾在 EdgeOne 添加根域名，添加后
界面显示“部署中”且删除按钮不可用；待平台允许操作时需撤销该绑定，不要修改
Cloudflare 根域名 DNS。
