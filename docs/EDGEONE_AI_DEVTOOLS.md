# EdgeOne 官方 Skills 与 MCP（开发工具）

本配置仅用于 **V1 开发分支中的本地 Codex / AI 编程开发环境**，不是给网站访客使用的 Agent 功能。网站 Agent 依旧由 `agents/site-assistant/` 和 EdgeOne Makers Runtime 提供。

## 官方来源

- Skills: https://github.com/TencentEdgeOne/edgeone-makers-tools
- MCP: https://github.com/TencentEdgeOne/edgeone-makers-mcp
- 官方说明：https://edgeone.ai/zh/document/205349902153826304
- MCP 文档：https://pages.edgeone.ai/zh/document/mcp

## 项目级配置

- `.agents/skills/edgeone-makers-tools/`：官方 Skill，包含 Agent、Astro 框架、云函数、部署等模块；复制到仓库以便 Codex 自动发现。来源安装命令为 `npx skills add TencentEdgeOne/edgeone-makers-tools -a codex -y --copy`。
- `.codex/config.toml`：注册 EdgeOne Makers 部署 MCP。Codex 在信任本项目后读取该文件，首次打开可能需要重启客户端。
- 使用的是国际站默认 MCP，适用于此项目的 EdgeOne 国际版。中国站需要将 MCP 命令参数附加 `--region china`。
- 此 MCP 用于开发阶段部署、预览及发布，**不会**自动接入网站访客聊天 Agent，也不会在构建时运行。

## 在自己的电脑使用

1. 切换 `V1` 分支，使用支持项目配置的 Codex，信任此仓库。
2. 打开 Codex，执行 `codex mcp list`，确认出现 `edgeone_makers`。
3. 首次调用部署工具需要完成腾讯云账号登录；也可以在自己的环境中设置 `EDGEONE_PAGES_API_TOKEN`（敏感凭证不要提交 Git）、可选 `EDGEONE_PAGES_PROJECT_NAME`。国际版项目使用国际版凭证。
4. 在 Codex 中查看可用 Skills，确认 `edgeone-makers-tools` 存在。它的完整官方文本随 V1 仓库提供。
5. 仅当用户明确要求时才执行部署；遵循 V1 开发、master 发行的流程，生产部署必须事先批准。

## 更新官方 Skills

```sh
npx skills add TencentEdgeOne/edgeone-makers-tools -a codex -y --copy
```

更新后检查 `git diff`、测试并提交到 `V1`。此命令需要本机可连接 GitHub，Node.js 与 npm 可用。

## 注意

当前聊天的 ChatGPT 运行环境不继承本项目 `.codex/config.toml` 的 MCP 配置。该文件用于本地或能读取仓库的 Codex IDE/CLI。安装配置不表示 MCP 已登录或部署已完成。

## 只读诊断（Windows）

若本地已安装 `edgeone-makers` MCP，可以在仓库 `V1` 根目录执行：

```powershell
git switch V1
git pull --ff-only origin V1
powershell -NoProfile -ExecutionPolicy Bypass -File .\\tools\\verify-edgeone-mcp.ps1
```

诊断首先按用户电脑上的本地安装路径启动 MCP，通过标准 JSON-RPC 调用 `initialize` 和 `tools/list`。它**不会**调用 `deploy_html` 或 `deploy_folder_or_zip`。如果 MCP 安装在不同位置，可通过本机环境变量 `EDGEONE_MCP_ENTRY` 指定入口 `index.js`。

接着脚本通过官方只读 `DescribePagesProjects` 接口验证 `EDGEONE_PAGES_API_TOKEN`。如果本机还没有 Token，PowerShell 会用隐藏输入提示你填写；该 Token 仅用于当前测试进程，不会写入 Git 文件。请勿将 Token、终端环境变量原文或凭据截图发到聊天中。

成功输出示例（仅示意，不是实际测试结果）：

```text
[PASS] MCP initialized: ...
[PASS] MCP tools/list succeeded (... tools): ...
[PASS] Tencent EdgeOne read-only API authorized ...; Code=0
[RESULT] MCP=PASS; CloudAPI=PASS
```

如果输出 `CloudAPI=NOT_TESTED`，表示未提供 Token，不能证明云端授权成功。如果出现 `CloudAPI=FAIL`，需要检查 Token 区域、权限或网络。这个脚本无法验证实际部署权限，但可以确认只读云端 API 调用是否成功。

仅检查本机 MCP（跳过 API 授权）可运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\\tools\\verify-edgeone-mcp.ps1 -SkipCloudApi
```
