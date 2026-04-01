# Preview Block 两层结构简化

> **日期**: 2026-03-24
> **前置**: 260320-1（Preview API 设计方案）、260321-1（布局层级设计）

## 动机

三层结构（L1 章节 → L2 卡片 → L3 Tab 切换）在实际使用中感觉过于复杂。Group 嵌套 Group 再配合 Tab 切换，理解成本高，Agent 构造 blocks 时也容易出错。

简化为两层后，整体更像一个文档，清晰直观。

## 新结构

```
Level 1 (顶层): markdown | group
Level 2 (group 内部): media
```

### 规则

1. 顶层只允许 `markdown` 和 `group`，不能直接放 `media`
2. `group` 的 children 只允许 `media`，不能嵌套 group
3. 没有 Tab 切换，没有第三层
4. Media 类型统一为一个 interface（`generationId` 和 `url` 都是 optional，但必须有其一）

### 布局

- **markdown** 在顶层：大标题 + 正文，文档风格
- **group** 在顶层：章节标题 + 响应式卡片网格（1→2→3 列）
- **media** 在 group 内：卡片样式（圆角边框 + 固定高度 h-48 + object-contain）

### 工作流适配

多阶段工作流（比如先出分镜图再出分镜视频）的处理方式：放在不同的 group 里上下排列。

```
[markdown] "Storyboard - 12 shots"
[group] "Storyboard Images"
  ├─ [media] shot-1-img
  ├─ [media] shot-2-img
  └─ ...
[group] "Storyboard Videos"
  ├─ [media] shot-1-vid
  ├─ [media] shot-2-vid
  └─ ...
```

比起之前每个 shot 用一个嵌套 group + tab 切换图片/视频，这种方式更直观，也更容易增量更新（直接 append 新 group）。

## 变更范围

- `src/lib/preview-blocks.ts` — 类型简化 + 验证逻辑重写
- `src/components/preview/` — 去掉 depth 参数、Tab 切换、L2/L3 分支
- `skills/yino-ai/references/project-preview.md` — 文档更新
- Preview API route 无需改动（委托给 validateBlocks）

## 向后兼容

这是破坏性变更。已有的三层结构 blocks 数据如果包含 group 嵌套或顶层 media，PUT 更新时会被新验证拒绝。但目前产品还在开发阶段，没有生产数据需要迁移。
