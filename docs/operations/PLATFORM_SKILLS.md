# Cloudflare 与 EdgeOne 平台 Skill 记录

本文记录本项目使用的 Cloudflare 与腾讯云 EdgeOne Skill、MCP 和日常操作边界。

## 当前状态

| 平台 | Skill / MCP | 本机位置或地址 | 当前用途 |
| --- | --- | --- | --- |
| Cloudflare | 官方 `cloudflare` Skill | `~/.codex/skills/cloudflare` | Cloudflare 产品选择、DNS、Workers、Pages、R2、D1、WAF、日志和最佳实践 |
| Cloudflare | 官方 API MCP | `https://mcp.cloudflare.com/mcp` | 通过 OAuth 或受限 API Token 查询和管理 Cloudflare API |
| Cloudflare | Docs MCP | `https://docs.mcp.cloudflare.com/mcp` | 检索最新 Cloudflare 官方文档 |
| Cloudflare | DNS Analytics MCP | `https://dns-analytics.mcp.cloudflare.com/mcp` | 分析 DNS 性能和解析问题 |
| EdgeOne | `edgeone-makers-tools` | `~/.codex/skills/edgeone-makers-tools` | EdgeOne Makers 构建、部署、存储、函数和 CLI 规范 |
| EdgeOne | `edgeone-pages-ops` | `~/.codex/skills/edgeone-pages-ops` | EdgeOne Pages/Makers 项目状态、域名、Cloudflare DNS 和 CI/CD 运维 |

## Skill 职责边界

### Cloudflare Skill

Cloudflare Skill 用于 Cloudflare 侧的能力和知识，包括：

- Cloudflare DNS 和 Zone 管理；
- Workers、Pages 和 Wrangler；
- R2、D1、KV、Durable Objects；
- Workers AI、Agents SDK 和 MCP；
- WAF、Zero Trust、SSL/TLS、日志与可观测性；
- Cloudflare 产品选择和官方文档检索。

Skill 只提供操作规范和产品知识，不等于已经登录 Cloudflare，也不会自动获得 Cloudflare 账号权限。

### EdgeOne Skill

EdgeOne Skill 用于腾讯云 EdgeOne 侧的能力和知识，包括：

- EdgeOne Makers 项目构建与部署；
- `edgeone` CLI、项目绑定、环境变量和生产发布；
- EdgeOne Pages/Makers 自定义域名和项目状态；
- EdgeOne 与 Cloudflare DNS 的协同配置；
- Edge Functions、Cloud Functions、MCP、KV 和 Blob。

当前站点的 EdgeOne 项目：

- 项目名：`chenfukun-space`
- 项目 ID：`makers-y4jkcqsp8hqa`
- 部署区域：Global
- 生产输出目录：`public`
- 构建命令：`npm run build:production`
- Node.js 云端版本：`22.11.0`

## MCP 使用建议

### 查询和修改 Cloudflare DNS

优先使用 Cloudflare API MCP，并采用最小权限 Token 或 OAuth 授权。典型流程：

1. 查询 Zone 和现有 DNS 记录；
2. 确认目标主机名、记录类型、目标值和代理状态；
3. 在执行写入前再次确认生产域名；
4. 修改记录后查询验证，并用 DNS 检查工具确认传播状态。

不要把 API Token、Global API Key、Secret ID 或 Secret Key 写入仓库、文档或聊天内容。

### EdgeOne 自定义域名

EdgeOne 控制台负责生成自定义域名验证要求和 CNAME 目标，Cloudflare DNS 负责添加或更新 DNS 记录。两边的职责不能混淆：

- EdgeOne：添加项目域名、选择生产/预览环境、域名验证、SSL 证书；
- Cloudflare：维护权威 DNS 记录和 CNAME；
- 本项目：构建静态产物并部署到 EdgeOne。

当前 `chenfukun.space` 使用 Cloudflare DNS。绑定 EdgeOne 时应优先使用 `www.chenfukun.space` 等子域名，并保留现有 DNS 托管方式，除非明确决定迁移权威 DNS。

## 项目操作规则

- 本地先执行 `npm run check`，再执行生产部署；
- GitHub 推送和 EdgeOne 部署分开记录；
- DNS 修改属于生产外部变更，执行前必须确认目标记录；
- 不在仓库中保存 Cloudflare 或 EdgeOne 凭据；
- Cloudflare MCP 的读取、分析和写入权限应按任务最小化；
- EdgeOne 预览域名可能需要带有效访问签名，正式访问应绑定自定义域名；
- 中文版本是当前正式入口，英文版本暂保留在构建结构中但不作为当前导航入口。

## 相关官方资源

- Cloudflare 官方 Skill：<https://github.com/cloudflare/skills>
- Cloudflare API MCP：<https://github.com/cloudflare/mcp>
- Cloudflare Codex 配置：<https://developers.cloudflare.com/agent-setup/codex/>
- EdgeOne Makers Skill：<https://github.com/TencentEdgeOne/edgeone-makers-tools>
- EdgeOne 自定义域名文档：<https://pages.edgeone.ai/zh/document/custom-domain>
