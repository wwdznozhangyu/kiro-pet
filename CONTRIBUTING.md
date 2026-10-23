# 贡献指南

感谢参与 **Kiro Pet** 的开发。本项目遵循「分支 + Pull Request」的协作流程。

## 分支与 PR 流程

- **不要直接向 `main` 提交或推送**。`main` 始终保持可随时打包的稳定状态。
- 任何改动都在新分支上进行，完成后通过 **Pull Request** 合入 `main`。
- 分支命名建议按类型加前缀：
  - `feat/xxx`：新功能（如 `feat/more-wordbanks`）
  - `fix/xxx`：缺陷修复
  - `docs/xxx`：文档
  - `refactor/xxx`：重构
  - `chore/xxx`：构建、依赖、杂项

### 典型步骤

```bash
git checkout main
git pull origin main
git checkout -b feat/your-change

# ...编码...

npm run typecheck      # 类型检查
npm test               # 词库逻辑单元测试（57 项）

git add -p
git commit -m "feat: 简明描述改动"
git push -u origin feat/your-change
# 然后在 GitHub 上发起 Pull Request，目标分支为 main
```

## 提交信息规范

采用 [Conventional Commits](https://www.conventionalcommits.org/) 前缀：
`feat` / `fix` / `docs` / `refactor` / `test` / `chore`。
标题简洁（建议 ≤ 70 字），正文说明动机与影响。

## 合并前的检查清单

- [ ] `npm run typecheck` 通过
- [ ] `npm test` 全部通过
- [ ] 若改动词库数据，确认每条含 单词 / 英式+美式音标 / 1–3 条带词性的释义 / ≤3 个同义词
- [ ] README 或相关文档已同步更新（如有必要）

## 本地开发

见 [README](./README.md) 的「快速开始」。核心词库逻辑在 `electron/wordbank-core.ts`，
其纯函数由 `electron/wordbank-core.test.ts` 覆盖，可通过 `npm test` 在无 GUI 环境下运行。
