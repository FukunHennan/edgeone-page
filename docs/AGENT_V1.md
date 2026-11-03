# 稻田鼠网站 Agent · V1

本功能作为 `edgeone-page` 的**可选分支功能**开发，保持 Astro 静态构建、不替换原有中文/英文页面。

## 已实现

- `/zh-CN/agent/`、`/en/agent/`：双语聊天页及全站悬浮入口。
- `POST /site-assistant`：OpenAI Agents SDK + Makers Agent Runtime，SSE 文字输出，工具调用提示。
- `search_articles(query, kind)` / `get_article(id)`：只读工具，数据来自构建期公开文章/项目索引。
- `/zh-CN/agent-index.json`、`/en/agent-index.json`：构建时生成的公开索引；`postsFor()` 自动排除草稿、未发布和未来文章。
- `POST /agent-history`：仅依据随机会话 ID 读取此 Agent 的近期对话；EdgeOne Store 保存对话，浏览器仅存储会话 ID。
- 新对话、停止（前端 AbortSignal）、中英文引导、失效与限流提示。

## 站长启用操作

1. 在 EdgeOne Makers 的**预览/测试环境**导入此分支，确认 Agent Runtime 已在当前项目和账号中启用。
2. 环境变量由平台后端读取。密钥**不要**写入 GitHub 源码或 `PUBLIC_*` 前端变量。`DEEPSEEK_API_KEY` 与 `AI_GATEWAY_API_KEY` 两种方式任选其一；两者同时存在时优先使用 DeepSeek 官方 API。

   | 变量 | 示例 | 必要性 |
   | --- | --- | --- |
   | `PUBLIC_SITE_AGENT_ENABLED` | `true` | 必填；默认不对公众调用模型 |
   | `DEEPSEEK_API_KEY` | DeepSeek 官方 API Key | 使用官方 API 时必填，仅后端保存 |
   | `DEEPSEEK_MODEL` | `deepseek-flash` | 官方 API 模型；可选，默认 `deepseek-flash` |
   | `AI_GATEWAY_API_KEY` | Makers Models 密钥 | 使用 Makers 网关时必填，仅后端保存 |
   | `AI_GATEWAY_BASE_URL` | `https://ai-gateway.edgeone.link/v1` | Makers 网关地址；可选 |
   | `AI_GATEWAY_MODEL` | `@makers/deepseek-v4-flash` | Makers 网关模型；可选 |
   | `AGENT_CONTENT_ORIGIN` | 你的 EdgeOne **预览域名** | 测试部署时推荐填写，生产默认 `https://edgeone.chenfukun.space` |

3. 本地需要 Node 22.21.1–22.x、npm 10.x 和 EdgeOne CLI 1.6.26 或更高：

   ```bash
   npm ci
   npm run build:production
   npm install -g edgeone@latest
   edgeone makers link
   edgeone makers dev
   ```

   纯 `astro dev` **不会**启动 Makers 的 `agents/` 或 `cloud-functions/`，应使用 Makers CLI 联合调试。

4. 先检查静态索引 `/zh-CN/agent-index.json` 能否打开，再测试 `/zh-CN/agent/` 对话；浏览器网络面板确认 `POST /site-assistant` 正常返回 `text/event-stream`。
   可先问“Fish 机器鱼平台用了哪些技术？”，检查回答能引用已发布的项目或文章，再到英文页面测试相同主题。未配置密钥或启用开关时接口返回 503。
5. 测试通过后再合并到 `master`；结合 EdgeOne 站点频率限制/WAF、配额告警和访问策略保护模型费用。

## 请求协议

```http
POST /site-assistant
Content-Type: application/json
Makers-Conversation-Id: c_<32位十六进制UUID>
{"message":"找一下ESP32文章","lang":"zh-CN"}
```

返回 SSE 事件：`text_delta`、`tool_called`、`done`、`error`。会话由 SDK 使用 `context.store.openaiSession(conversation_id)`，同一浏览器刷新页面后复用原 ID。

## 安全边界

- Agent 仅公开的已发布文章、项目资料；工具没有写入 API 或 shell 访问权。
- 上游索引源只能通过服务器环境变量配置；模型返回的文本以 DOM 文本节点显示，不使用不可信 HTML。
- 不将模型 API Key 发送给浏览器；默认模型调用开关关闭。
- 官方 DeepSeek API 使用固定的 `https://api.deepseek.com` 服务端地址；选择 Makers 网关时继续使用原有模型和地址配置。
- 公开访问仍会消耗模型额度，生产部署**务必设置用量限制、速率限制和必要的访问控制**。
- 会话 ID 并非账号鉴权；强随机 ID 降低猜测风险，但不适合存放个人秘密和敏感数据。后续若接入用户登录或站长工具，需要独立的鉴权与授权。
- `AGENT_CONTENT_ORIGIN` 用于索引来源。预览环境未配置时会读取当前正式域名；如果正式域名尚无索引，检索会失败，这是预期的部署前置条件。
- 流式停止通过浏览器连接的 AbortSignal 尽力取消；应通过 Makers 运行日志检查是否真正结束服务端执行。

## 后续升级

V2 可以添加词条索引优化 / 向量检索、多轮上下文剪裁与 MCP 查询工具。
任何写入、PR 创建、管理后台操作都必须在登录身份和明确批准后开启；V1 不包含这类功能。

官方文档：
- https://pages.edgeone.ai/zh/document/agents-quick-start
- https://pages.edgeone.ai/zh/document/agents-conversation-storage
- https://pages.edgeone.ai/zh/document/node-functions
- https://api-docs.deepseek.com/api/create-chat-completion/
