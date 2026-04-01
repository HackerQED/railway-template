---
name: commit-with-simplify
description: >
  提交代码变更。分析工作区所有改动，按逻辑分组提交，绝不丢弃任何已有改动。
  涉及大量代码改动时自动调用 simplify skill 先审查代码质量。
user-invokable: true
argument-hint: "[可选：提交信息或描述]"
---

# Commit

## 提交前检查

1. **扫描工作区** — `git status` + `git diff`，看清所有改动（包括用户之前已有的未提交改动）
2. **判断是否需要代码审查** — 如果改动涉及较大量的代码变更（新增/修改超过 ~100 行代码，不含配置和文档），或者用户提到了简化/代码质量，先调用 `/simplify` skill 审查再提交
3. **分组** — 按逻辑将改动分成若干组，每组一个提交

## 核心规则

**绝不丢弃任何已有改动。** 工作区里用户之前的未提交改动必须保留。如果有不属于当前任务的改动，分开提交——不要从暂存区踢出去。除非改动在逻辑上明显不合理，否则永远保留。

## 提交流程

1. **分析改动** — 理解每组改动的目的
2. **写 commit message** — 中文，简洁，描述"为什么"而不是"改了什么"。格式参考 `git log`
3. **分批提交** — 当前任务的改动先提交，用户已有的改动后提交（或按逻辑顺序）
4. **验证** — 提交后 `git status` 确认工作区状态

## Commit Message 格式

```
{一句话总结}

- {具体改动 1}
- {具体改动 2}
...

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

用 HEREDOC 传递 message，避免 shell 转义问题。

## 注意事项

- 不推送到远端，除非用户明确要求
- 不 amend 已有提交，除非用户明确要求
- 不跳过 hooks（--no-verify）
- 不泄露敏感文件（.env、credentials 等）
