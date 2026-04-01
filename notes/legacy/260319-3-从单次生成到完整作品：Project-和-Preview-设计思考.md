# 从单次生成到完整作品：Project 和 Preview 设计思考

> 2026-03-19 — 基于 VidMuse（vidmuse.com）产品体验的思考

## 背景

当前的 generation 是散的 — 每个生成任务独立存在，没有上下文关系。但在实际的 Agent 工作流中（比如 MV 生成），一个完整作品由几十个 generation 组成（storyboard 图片 + 视频片段），它们之间有明确的结构关系。

需要解决三个层次的问题：
1. 单个 generation 缺少标注 → **Comment / Title**
2. 多个 generation 之间没有关联 → **Project**
3. 中间产物和最终成果没有展示方式 → **Preview**

## Idea 1: Generation Comment / Title

每个 generation 加一个自由文本字段，由调用方（Agent）写入。

**用途：**
- Agent 给每个生成任务附加上下文，比如"第 3 镜头 - 雨中街道近景"
- 用户界面展示时能看到每个生成的含义，而不是一堆无标注的图片/视频
- Agent 自己也可以用来回溯和整理

**实现：** generation 表加字段，API 入参加可选参数，很直接。

## Idea 2: Project — 生成任务的容器

一个 project 将多个 generation 关联起来。

**核心价值：**
- 语义关联 — 一个镜头 = prompt + 图 + 视频，只有在同一个 project 内才有意义
- 工程价值 — 轮询归并（一个 project 一次 poll 而不是 N 个 generation 各自 poll）
- 展示基础 — Preview 需要知道哪些 generation 属于同一组

**设计要点：**
- Project 是 generation 的分组容器
- 一个 project 包含多个 generation
- generation 可以有顺序/角色标记（如 shot_number、role: storyboard / video）

## Idea 3: Preview API — 结构化 Block + 模板渲染

### 方向选择

考虑过三种方案：
- (A) 静态页面托管 — Agent 生成 HTML，我们托管（类似 Claude Artifacts）→ 太重
- (B) 结构化数据 + 模板渲染 — Agent 提交结构化 block 数据，我们渲染 → **选这个**
- (C) 纯数据 API — 只提供数据接口，前端自己渲染 → 太弱，依赖 Agent 前端能力

### Block 模型

Preview 是一个**线性文档**，由不同类型的 block 组成。

**设计原则：**
- 模块内部强 schema 约束
- 模块之间自由组合、顺序自由（Agent 决定）
- 渲染是我们的事，Agent 只需要提交结构化数据

**Block 类型（初步）：**
1. **Text / Markdown** — 纯文本段落，用于分析、brief、说明
2. **Media** — 单张图片 / 单个视频 / 单个音频
3. **Shot List** — 结构化列表：编号 + prompt + 可选缩略图 + 可选视频
4. （未来扩展）对比、时间线、参考图板等

### 参考产品：VidMuse

VidMuse（vidmuse.com）的 MV 生成流程是一个很好的参考。它的左侧面板是一个线性文档结构：

```
Music Analysis
Style & Vibe
Creative Brief
Reference
Music
Shot List
Storyboard
Video Storyboard
```

每个区块是一个不同类型的内容，对应到我们的 block 模型：
- Music Analysis / Style & Vibe / Creative Brief → Text block
- Shot List → Shot List block（纯文本）
- Storyboard → Shot List block（带图片）
- Video Storyboard → Shot List block（带视频）

## 三个概念的关系

```
Project
├── Preview (线性 block 文档，可多个版本)
│   ├── Block: Text (Music Analysis)
│   ├── Block: Text (Creative Brief)
│   ├── Block: Shot List (Storyboard)
│   └── Block: Shot List (Video Storyboard)
└── Generations (底层资源)
    ├── gen-001 (image, shot 1)
    ├── gen-002 (image, shot 2)
    └── gen-003 (video, shot 1)
```

Preview 引用 Generation 的产物，但本身是一个独立的展示层。

## 开放问题

- Project 的 API 设计：创建、关联 generation、查询
- Preview 的权限模型：是否可以分享给未登录用户？
- Block schema 的版本管理：如何向前兼容？
- Preview 是否支持多版本（比如 v1 storyboard → v2 加了视频）？
