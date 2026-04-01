# Preview API 设计方案

> 2026-03-20 — 基于 [notes/260319-3](260319-3-从单次生成到完整作品：Project-和-Preview-设计思考.md) 的讨论落地

## 背景与动机

当前 generation 是散的 — 每个生成任务独立存在，没有上下文、没有关联、没有展示。在 Agent 工作流（如 MV 生成）中，一个完整作品由几十个 generation 组成，它们之间有结构关系，但我们的系统完全不知道。

需要解决三层问题：
1. 单个 generation 缺少标注 → **Comment**
2. 多个 generation 之间没有关联 → **Project**
3. 中间产物和最终成果没有展示方式 → **Preview**

## 设计思想

**把"如何展示作品"的权利交给 Agent，但给它一个框架约束。** Agent 决定内容结构和展示方式，我们提供渲染。不是硬编码的模板（像 VidMuse 那样固定 Music Analysis → Style & Vibe → Shot List 的结构），而是 Agent 自由组合的线性文档。

不做无限画布，只做从上到下的一维线性结构 — 简单、好控制。

---

## 分阶段实施

### Phase 1: Generation Comment

generation 表加 `comment` 字段（TEXT, nullable）。

- Agent 通过模型端点（seedream、veo）提交时可传 `comment`
- `generations/status` 响应带回 `comment`
- 新增 `PATCH /api/agent/generations/:id` 允许事后更新 comment

**comment 的用途：** Agent 给每个生成任务附加上下文信息，如"第 3 镜头 - 雨中街道近景"。用户界面展示时能看到含义，Agent 自己也可以用来回溯。

**长度限制：** comment 限制 100 字符，轮询完整带回不截断。就该短 —— "Shot 3 - 雨中街道近景" 这种快速标注。想表达更丰富的信息放 Preview block 的 title/comment 里。Block 的长度限制：title 50 字符，comment 100 字符。

#### 决策：为什么只有 comment，没有 title？

最初设计是 `title` + `comment` 两个字段：title 短且结构化（用于列表展示、搜索），comment 长且自由（Agent 记笔记）。

**砍掉 title 的原因：** generation 的标注本质上是 Agent 的自由备注，不需要强制分"标题"和"内容"。一个 `comment` 字段足够灵活 — Agent 想写短就写短，想写长就写长。拆成两个字段只是增加 API 调用时的认知负担。

（注意：Block 上是有 `title` + `comment` 的，因为 Block 的展示场景不同 — 见 Phase 3。）

### Phase 2: Project

新建 project 表，generation 表加 `projectId` 外键。

```
project 表:
  id          TEXT PK
  userId      TEXT FK → user
  title       TEXT
  status      TEXT          -- 'active' | 'completed' | 'archived'
  metadata    JSONB         -- 扩展信息（音乐URL、风格描述等）
  createdAt   TIMESTAMP
  updatedAt   TIMESTAMP
```

**关系：** Project : Generation = 1 : N（generation.projectId nullable）

**API：**
- `POST /api/agent/projects` — 创建 project
- `GET /api/agent/projects/:id` — 获取 project + 关联的 generations
- `PATCH /api/agent/projects/:id` — 更新 title/status/metadata
- 模型端点加可选 `project_id`，创建 generation 时自动关联
- `GET /api/agent/generations/status` 支持 `?project_id=xxx` 一次拉整个 project 的状态

#### 决策：1:N 而非 M:N

考虑过 Project 和 Generation 是 M:N（一个 generation 可属于多个 project），但没有实际场景需要这个。generation 属于一个 project，不会被多个 project 共享。M:N 引入中间表，纯属过度设计。

#### 决策：为什么现在要做 Project？

之前 [Agent API 设计决策](260318-2-Agent-API-设计决策.md) 的第 9 条明确说"不做 Project（暂时）"，理由是 Agent 通过 Skill 工作流提示不太会忘 generation ID。

现在要做的原因：Preview 需要 Project 作为容器。没有 Project 的 Preview 是什么？一堆孤立的 block 没有归属。Preview 是 Project 的子资源，所以 Project 必须先有。

### Phase 3: Preview

新建 preview 表，挂在 project 下。

```
preview 表:
  id          TEXT PK
  projectId   TEXT FK → project (unique)
  blocks      JSONB         -- Block[]
  createdAt   TIMESTAMP
  updatedAt   TIMESTAMP
```

**API：**
- `PUT /api/agent/projects/:id/preview` — 创建/覆盖 preview
- `GET /api/agent/projects/:id/preview` — 获取 preview
- 前端渲染路由：`/preview/:projectId`（公开可分享）

**Preview URL 导航：** PUT/GET 响应中返回 `preview_url`（如 `https://yino.ai/preview/proj_xxx`）。Agent 直接把这个 URL 贴到聊天里，用户点击即跳转到 Preview 页面。支持 anchor 定位到特定区块（如 `#block-2`），Agent 知道刚创建的 block 位置，可以拼 anchor 引导用户聚焦。这样不管用户在 Claude、ChatGPT、Dify 还是任何 Agent 里，都是一个标准 URL，零集成成本。

#### 决策：Preview 必须依附 Project，不能独立存在

原始 notes 写"Preview 引用 Generation 的产物，但本身是独立展示层"。讨论后否决了独立 Preview — 没有 Project 的 Preview 语义不明，一个孤立的 block 列表没有归属。Preview 就是 Project 的展示层。

#### 决策：不做版本管理

原始 notes 提到"是否支持多版本（v1 storyboard → v2 加了视频）"。初版不做 — PUT 覆盖，Agent 每次提交完整 blocks 数组，旧的就没了。YAGNI，等真有用户需要版本回溯再加。

#### 决策：Preview 渲染方案选择

考虑过三种方案：
- **(A) 静态页面托管** — Agent 生成 HTML，我们托管（类似 Claude Artifacts）→ 太重，安全问题多
- **(B) 结构化数据 + 模板渲染** — Agent 提交结构化 block 数据，我们渲染 → **选这个**
- **(C) 纯数据 API** — 只提供数据接口，前端自己渲染 → 太弱，依赖 Agent 有前端能力

选 B：Agent 只管数据，我们控制渲染。安全、可控、Agent 调用简单。

#### 决策：Preview 是多媒体展示层，不是完整文档

最初受 VidMuse 影响，把 Preview 设计成"完整作品文档" — 从 Music Analysis、Creative Brief 到 Shot List 全部放进去，模仿 VidMuse 左侧面板的固定结构。

**修正：** VidMuse 那样做是因为它是封闭产品 — 虽然也有聊天窗口，但它要把整个体验闭环在自己产品里，所以所有中间产物都塞进左侧面板。我们不一样 — 我们接受外部 Agent 调用，大部分体验可以 offload 到 Agent 那边。Agent 本身就是文本高手，音乐分析、创意方向这些纯文本内容在 Agent 的聊天窗口里展示更自然。

Preview 的核心价值是**Agent 聊天窗口做不到的事：展示多媒体内容**。分镜图、视频片段、最终成品 — 这些才是需要结构化展示的东西。纯文本分析和讨论留在聊天里。

这个认知也让 markdown block 的定位更清晰：它在 Preview 里的作用是**为多媒体内容提供上下文标注**（比如 group 的 comment），而不是承载独立的长文本内容。

---

## Block 数据结构

```typescript
type Block =
  | { type: 'markdown'; title?: string; comment?: string; content: string }
  | { type: 'media'; title?: string; comment?: string; generationId: string }
  | { type: 'media'; title?: string; comment?: string; url: string }
  | { type: 'group'; title?: string; comment?: string; children: Block[] }
```

三种原子类型：`markdown`、`media`、`group`。`group` 是唯一能包含 children 的类型，children 里可以放任何 Block（包括 group），运行时校验嵌套深度 ≤ 3。

### Block 嵌套示例

```
Block: text    (title: "Music Analysis", content: "BPM: 120, Key: Am...")
Block: text    (title: "Creative Brief", content: "...")
Block: group   (title: "Storyboard", comment: "45 shots, Shunji Iwai style")
  ├── group    (title: "Shot 1 - 雨中街道")
  │   ├── media  (generationId: "gen-001")    ← storyboard 图
  │   └── media  (generationId: "gen-003")    ← 视频片段
  ├── group    (title: "Shot 2 - 窗边特写")
  │   ├── media  (generationId: "gen-002")
  │   └── media  (generationId: "gen-004")
  └── group    (title: "Shot 3 - 全景")
      ├── media  (generationId: "gen-005")
      └── media  (generationId: "gen-006")
Block: media   (title: "Final Mix", url: "https://...")    ← 用户上传的音乐
```

### 决策记录

#### title + comment 而非合成一个字段

Block 上保留 `title` 和 `comment` 两个字段（和 generation 上只有 `comment` 不同）。

- `title` — 短标签，渲染为区块标题，如 "Storyboard"、"Shot 1"
- `comment` — 标题下方的补充描述，如 "45 镜头，岩井俊二风格"

参考 VidMuse 的截图：区块名（Storyboard）和区块描述是两层信息，对应 title 和 comment。

#### 去掉 shot-list block 类型

最初设计有一个 `shot-list` 类型（结构化镜头列表：编号 + prompt + 缩略图 + 视频）。

**砍掉的原因：** 太场景绑定。shot-list 把 block 系统和 MV 生成这个具体场景耦合了。用 `group` 嵌套可以表达同样的结构（一个 group "Storyboard" 包含多个 group "Shot N"，每个 shot group 里放 media），而且更灵活 — Agent 想用来做产品对比、多方案展示也行。如何用 group 组合出 storyboard，放在 Skill 文档里引导即可。

#### media 不需要 mediaType 字段

最初设计有 `mediaType: 'image' | 'video' | 'audio'`。

**砍掉的原因：** 冗余信息。来自 generation 的 media，generation 表有 `type` 字段可查；外部 URL 看扩展名即可判断。让 Agent 声明 mediaType 只是增加调用负担，没有信息增量。

#### media 的两种来源互斥，不共存

最初设计 `url` 和 `generationId` 可以同时存在。

**改为互斥的原因：** 如果 media 引用 generation，Agent 还要先查 generation 拿 URL 再填进 block — 多余。填 `generationId` 就够了，渲染时我们 join 查 output URL。`url` 只用于非 generation 来源的外部资源（如用户上传的音乐）。

#### 统一 Block 类型，不区分 LeafBlock

讨论过引入 `LeafBlock`（去掉 comment/title）来约束深层嵌套不能有标注。

**不做的原因：** 在设计阶段硬想交互细节没有意义，深层要不要 comment 等前端渲染时自然有答案。类型系统管不了 Agent（它看文档不看 TypeScript），引入 LeafBlock 只是让类型变复杂。所有层级的 block 都有可选 title 和 comment，渲染策略和 Agent 引导在 Skill 文档层面控制。

#### 嵌套深度 ≤ 3，运行时校验而非类型约束

考虑过用 L0Block / L1Block / L2Block 三层类型在编译时约束深度。

**选运行时校验的原因：** 这个约束本质上是给 Agent 的，Agent 不看 TypeScript 类型，它看 Skill 文档。类型系统简单（统一 Block），校验逻辑在 API 层递归检查深度即可。

---

## 端到端案例：MV 生成工作流中 Preview 的演进

以一首歌的 MV 生成为例，展示 Agent 如何逐步构建 Preview。

**关键原则：纯文本在聊天里说，Preview 专注多媒体。** 音乐分析、创意方向讨论、用户选择 — 这些都发生在聊天窗口。Preview 只在有多媒体内容需要结构化展示时才介入。

### Step 1: 音乐分析（聊天里完成，不进 Preview）

```
用户: [上传音乐文件]
Agent: 分析结果 — BPM: 128, Key: Am, Mood: Melancholic...
       我为你准备了 3 个创意方向，每个方向生成了一张风格示意图，请看 Preview。
```

音乐分析是纯文本，在聊天里说就行。但创意方向需要"用图说话" — Preview 在这里首次介入。

### Step 2: 创意方向示意图 — Preview 第一次出现

Agent 为每个创意方向生成一张风格示意图，打包成 group 放进 Preview。文字描述在聊天里说，视觉展示在 Preview 里看。

```
Agent 调用:
  POST /api/agent/projects                → { title: "Shadows in the Rain MV" }
  POST /api/agent/models/seedream-4-5     ← 批量提交 3 张风格示意图，带 project_id
  （等待生成完成）
  PUT /api/agent/projects/:id/preview
```

```
Preview 第 1 版:
┌──────────────────────────────────────────┐
│ Creative Direction                       │  ← group
│ comment: "3 个风格方向，请选择"            │
│                                          │
│ ┌─ A. 岩井俊二式青春影像 ──────────────┐ │
│ │  [image gen-001]                      │ │
│ └───────────────────────────────────────┘ │
│ ┌─ B. 王家卫式都市霓虹 ────────────────┐ │
│ │  [image gen-002]                      │ │
│ └───────────────────────────────────────┘ │
│ ┌─ C. Wes Anderson 对称构图 ───────────┐ │
│ │  [image gen-003]                      │ │
│ └───────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

用户在聊天中选择方向后，Agent 继续推进。

### Step 3: 分镜 Storyboard

Agent 批量生成分镜图后，创建 Project 和 Preview，让用户在结构化界面中审阅多媒体。

```
Agent 调用:
  POST /api/agent/projects                → { title: "Shadows in the Rain MV" }
  POST /api/agent/models/seedream-4-5     ← 批量提交 12 张分镜图，带 project_id 和 comment
    items: [
      { prompt: "...", comment: "Shot 1 - Intro: 雨滴打在玻璃窗上的特写" },
      { prompt: "...", comment: "Shot 2 - Verse 1: 少女在教室窗边发呆" },
      ...
    ]
  （等待生成完成）
  PUT /api/agent/projects/:id/preview     ← 创建 Preview
```

```
Preview 第 1 版:
┌──────────────────────────────────────────┐
│ Storyboard                               │  ← group, title: "Storyboard"
│ comment: "12 镜头，岩井俊二风格"           │
│                                          │
│ ┌─ Shot 1 - Intro: 雨滴玻璃窗 ─────────┐ │  ← 子 group
│ │  [image gen-001]                      │ │  ← media block
│ └───────────────────────────────────────┘ │
│ ┌─ Shot 2 - Verse 1: 窗边少女 ─────────┐ │
│ │  [image gen-002]                      │ │
│ └───────────────────────────────────────┘ │
│ ┌─ Shot 3 - Verse 1: 走廊回眸 ─────────┐ │
│ │  [image gen-003]                      │ │
│ └───────────────────────────────────────┘ │
│ ...                                      │
└──────────────────────────────────────────┘
```

Agent 在聊天中发 Preview 链接："分镜已生成，请查看并确认。"

### Step 4: 视频生成 — Preview 逐步丰富

用户确认分镜后，Agent 基于每张分镜图生成视频片段，更新 Preview。

```
Agent 调用:
  POST /api/agent/models/veo-3-1         ← 批量提交 12 个视频
  （等待生成完成）
  PUT /api/agent/projects/:id/preview    ← 每个 Shot group 里加入视频
```

```
Preview 第 2 版（Shot group 里追加视频）:
┌──────────────────────────────────────────┐
│ Storyboard                               │
│ comment: "12 镜头，岩井俊二风格"           │
│                                          │
│ ┌─ Shot 1 - Intro: 雨滴玻璃窗 ─────────┐ │
│ │  [image gen-001]                      │ │  ← 分镜图
│ │  [video gen-013]                      │ │  ← 视频片段（新增）
│ └───────────────────────────────────────┘ │
│ ┌─ Shot 2 - Verse 1: 窗边少女 ─────────┐ │
│ │  [image gen-002]                      │ │
│ │  [video gen-014]                      │ │
│ └───────────────────────────────────────┘ │
│ ...                                      │
└──────────────────────────────────────────┘
```

### Step 5: 最终合成 — Preview 完成

Agent 合成完整 MV，在 Preview 顶部加入成品视频。

```
Agent 调用:
  POST /api/agent/video/compose          ← 合成最终视频
  POST /api/agent/upload                 ← 上传合成结果
  PUT  /api/agent/projects/:id/preview   ← 顶部加入最终成品
  PATCH /api/agent/projects/:id          ← status: 'completed'
```

```
Preview 最终版:
┌──────────────────────────────────────────┐
│ Shadows in the Rain                      │  ← media block, title: 作品名
│ comment: "完整 MV, 3:24"                 │
│ [video - 最终合成视频]                     │
├──────────────────────────────────────────┤
│ Storyboard                               │
│ comment: "12 镜头，岩井俊二风格"           │
│                                          │
│ ┌─ Shot 1 ─────────────────────────────┐ │
│ │  [image gen-001]  [video gen-013]    │ │
│ └───────────────────────────────────────┘ │
│ ...                                      │
├──────────────────────────────────────────┤
│ Original Track                           │  ← media block, url: 用户上传的音乐
└──────────────────────────────────────────┘
```

### 案例总结

- **聊天窗口**：音乐分析、创意讨论、用户决策、进度通知 — Agent 擅长的文本交互
- **Preview**：分镜图、视频片段、最终成品 — 聊天做不到的多媒体结构化展示

Preview 不是在第一步就创建的，而是**等到有多媒体内容需要展示时才介入**。整个流程中 Agent 用 PUT 逐步更新 blocks 数组，Preview 从只有分镜图演进到图+视频再到完整作品。

这个结构不是硬编码的 — Agent 通过 Skill 文档学习"MV 生成应该怎么组织 Preview"，但 block 系统本身是通用的。换一个场景（比如产品图生成），Agent 可以组织完全不同的 Preview 结构。

---

## 开放问题（留到实施时决定）

- Preview 分享页的权限：是否需要登录？初版建议公开可访问（有链接即可看）
- Block schema 未来扩展时的向前兼容策略
- 深层嵌套的具体渲染交互
