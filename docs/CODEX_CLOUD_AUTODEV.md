# Cloud Codex autonomous development

## State and task queue
- `.codex/TASKS.json`: prioritized work queue.
- `.codex/PROGRESS.md`: durable proposed/completed work log.
- GitHub PRs are the review/merge source of truth. Close or merge an open codex/autodev PR before the next run.
- `AGENTS.md`: restrictions that Codex must follow.

## Owner setup
1. In repository Settings > Secrets and variables > Actions, create `OPENAI_API_KEY` (separately billed OpenAI API key).
2. In Settings > Actions > General, allow GitHub Actions to create and approve PRs as appropriate.
3. Protect `master` with required checks and approval for non-trivial changes. Do NOT give the action deployment secrets.
4. Manually run the workflow from Actions and review its first PR.
5. Check GitHub Actions minutes and OpenAI API usage and configure budget alerts.

## Safety behavior
- The trusted file guard is captured BEFORE the agent runs and rejects config/workflow changes, deletions, binary files, oversized edits, and disallowed paths.
- `npm run check` executes production build and bilingual article verification.
- Only docs/ files and the text-only progress record can be merged by the automatic merge step.
- UI/source/post changes always remain for manual PR review.
- Successful CI for a generated PR can require external branch protection rules and independent PR checks; a green pre-PR job alone is not a sufficient organizational policy.
- If repo settings disallow the merge, the step fails and leaves a PR to be reviewed.
- The scheduled trigger is five UTC clock slots per day (00:17, 05:17, 10:17, 15:17, 20:17); it is NOT a strict every-5-hours elapsed timer, and GitHub can delay jobs.

## Failure and continuation
- A failed workflow records errors in Actions; it does not automatically retry changes.
- No-change runs stop without a PR.
- Don't auto-merge functional changes or deploy from this automation.
- Review all new PRs before enabling any broader autonomy.
