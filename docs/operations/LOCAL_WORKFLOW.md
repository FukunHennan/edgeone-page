# 本地构建与同步流程

## 工作边界

本地重写、构建和测试与上传仓库是两个独立动作。默认只在本地修改和验证，不执行 `git push`；只有在确认差异和测试结果后，才由维护者安排上传。

## 内容迁移循环

每批文章按以下顺序处理：

1. 同时打开 `source/zh-CN/_posts/` 和 `source/en/_posts/` 对应文件。
2. 保留 `translation_key`、文件名和已有 URL。
3. 补齐 `content_type` 和 `domain`。
4. 使用主题组件替代重复的 HTML、内联样式和内联脚本。
5. 运行 `npm run check:content`。
6. 运行 `npm run build:production` 和 `npm run audit:production`。
7. 检查 `git diff`，确认没有生成物、密钥或无关文件被意外修改。

## 完整本地验证

```bash
npm ci
npm run check
npm run check:articles
git status --short
git diff --stat
```

`npm run check` 是构建和双语内容的门禁；`npm run check:articles` 是文章组件和结构门禁。

## 与远端同步

开始工作前：

```bash
git fetch origin
git status -sb
git log --oneline --decorate -5
```

本地有未提交修改时，不使用 `reset --hard` 或 `checkout --` 覆盖工作区。先完成本地检查，再由维护者决定是否提交和推送。

推送前应确认：

```bash
git diff --check
npm run check
git status -sb
```

远端 CI 和 EdgeOne 部署由仓库工作流负责。没有明确授权时，本地助手不执行 `git push`、生产部署或删除远端内容。
