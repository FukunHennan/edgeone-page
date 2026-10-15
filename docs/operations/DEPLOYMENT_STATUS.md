# 部署状态记录

更新于 2026-10-15。记录本次排查的结论，避免重复推导。

## 现状

线上 `edgeone.chenfukun.space`（CNAME 指向 EdgeOne Pages）自 2026-09-23 后未更新，
仍返回 `Last-Modified: Wed, 23 Sep 2026 02:12:56 GMT` 的产物。

## 已排除

- 分支名不是原因。`master` 当日多次推送（`cbb1633`、`84d6319`、`0684394`），并额外
  创建 `main` 分支且推入提交，均未触发平台构建。
- 构建内容不是原因。本地按平台工具链（Node 22.23.2，npm 10.9.8 与 10.9.0）执行
  `npm ci` 与 `npm run check` 全部通过；GitHub Actions 三次推送均为 success。
- CI 的直传步骤不可用。线上项目是 GitHub 集成类型，`edgeone makers deploy -n edgeone-page`
  会被拒绝（`Project edgeone-page exists but has Provider 'Github'`）。该步骤已改为受仓库
  变量 `EDGEONE_DEPLOY_MODE` 守卫、默认跳过；构建产物以 artifact 形式保留 7 天作为手动兜底。
- 运行时版本已对齐。平台按 `edgeone.json` 使用 Node 22.11.0（自带 npm 10.9.0），此前
  `engines.npm` 与 `tools/check-runtime.js` 都要求恰好 10.9.8，加上 `.npmrc` 的
  `engine-strict`，平台侧 `npm ci` 会以 EBADENGINE 失败；已放开为 npm 10.x。

## 待确认

- 承载 `edgeone.chenfukun.space` 的项目是否就是 `edgeone-page`。本仓库
  `docs/operations/PLATFORM_SKILLS.md` 记录的是 `chenfukun-space` / `makers-y4jkcqsp8hqa`，
  与实际不符，需以控制台为准。
- 平台侧 Git 集成的仓库授权与构建记录。只能在该项目控制台的 Build & Deploy 页面查看；
  该页的 Redeploy 按钮可在不推送的情况下用现有源码重建。

## 本文件用途

除记录状态外，本次提交同时用于验证「关联 Git 仓库后，推送能否触发平台构建」。
