# 部署状态记录

更新于 2026-10-17。记录本次排查的结论，避免重复推导。

## 现状

线上 `edgeone.chenfukun.space`（CNAME 指向 EdgeOne Pages）自 2026-09-23 后未更新，
仍返回 `Last-Modified: Wed, 23 Sep 2026 02:12:56 GMT` 的产物。

## 已确认

- `edgeone.chenfukun.space` 绑定在国际站 `edgeone-page`（项目 ID `pages-xidayxfw3y70`），
  GitHub 源为 `FukunHennan/edgeone-page` 的 `master`。
- Git 集成已触发构建。控制台显示 `cbb1633`、`84d6319`、`0684394`、`9da52ad`
  均为失败部署；最近一次 `dp2w93svrhob` 于 2026-10-15 15:12:53 创建。
- `dp2w93svrhob` 在 `npm ci` 安装阶段失败：平台 Node 22.11.0 / npm 10.9.0，
  开发依赖 `@astrojs/astro2tsx@0.1.2` 要求 Node `^20.19.0 || >=22.12.0`。
  `npm ci --omit=dev` 仍会校验锁文件中的开发依赖并失败，因此将 `edgeone.json`
  的构建 Node 版本改为平台支持的 22.21.1。
- GitHub Actions 在 Node 22.23.2 上构建成功；它无法代表平台的 Node 22.11.0 安装结果。
- CI 的直传步骤不可用。线上项目是 GitHub 集成类型，`edgeone makers deploy -n edgeone-page`
  会被拒绝（`Project edgeone-page exists but has Provider 'Github'`）。该步骤已改为受仓库
  变量 `EDGEONE_DEPLOY_MODE` 守卫、默认跳过；构建产物以 artifact 形式保留 7 天作为手动兜底。
- npm 版本要求已放开。原配置使用 Node 22.11.0（自带 npm 10.9.0），此前
  `engines.npm` 与 `tools/check-runtime.js` 都要求恰好 10.9.8，加上 `.npmrc` 的
  `engine-strict`，平台侧 `npm ci` 会以 EBADENGINE 失败；已放开为 npm 10.x。

## 待确认

- 修复提交推送后，确认平台构建成功且 `edgeone.chenfukun.space` 返回新产物。
- `chenfukun.space` 根域名当前无 A/AAAA 记录；如需作为正式入口，还需核对 EdgeOne
  域名绑定和 Cloudflare DNS。

## 本文件用途

记录生产部署事实和待验证项，供后续发布排查使用。
