# 自托管 Agent 调研：Deep Agents 方案

> **最终结论（260323 讨论后确定）：Deep Agents Python，独立 Railway project 部署，与 yino.ai 完全隔离。** 不用 JS 版（二等公民，不太可能追上 Python），不同机部署（完全隔离更清晰），不自建（手搓经验证明坑更多）。一个人的团队，开发成本最小化优先，能开箱即用就不自己搓，运行成本高一点无所谓。
>
> 以下保留了完整的调研和决策过程——从最初对 JS 版的乐观分析，到悲观反思，到最终选定 Python 独立部署。**思考过程本身就是价值。**

## 背景

在 [OpenClaw 共享 Demo 方案](260321-2-OpenClaw-共享-Demo-方案.md) 中，我们搁置了自托管 Agent 的方向，原因是：

1. **每个实例需要一个容器**：OpenClaw 是单用户设计，多用户 = 多容器，我们不想搭建容器编排基础设施
2. **API Key 泄露风险**：OpenClaw 有 shell 执行能力，共享实例中用户可能读取容器内的环境变量
3. **Chat UI 与用户数据关联的复杂度**：session 管理、身份传递、聊天持久化的工程量超出 MVP

LangChain Deep Agents 可能从根本上绕过这些问题。

## Deep Agents 是什么

> *注：以下最初是从 JS 版角度写的（9.9k 是 JS 版发布时的数据）。后来深入调研后发现 Python 版（16.9k stars）远比 JS 版（934 stars）成熟，最终选定 Python 版。见后文"悲观分析"和"最终决策"章节。*

[Deep Agents](https://docs.langchain.com/oss/javascript/deepagents/overview) 是 LangChain 团队开源的 **agent harness**（代理框架），2025 年 7 月首发，2026 年 3 月大版本更新后 GitHub 9.9k stars。

**关键定位**：它不是一个独立运行的 Agent 服务（像 OpenClaw），而是一个 **npm 库**（`pnpm add deepagents`），你在自己的 Node.js 进程里调用它。

### 四大核心能力

| 能力 | 说明 | 对应我们的需求 |
|---|---|---|
| **任务规划** | `write_todos` 工具，将复杂任务拆解为离散步骤并跟踪进度 | Agent 编排 MV 生成的多步骤工作流 |
| **子代理派生** | `task` 工具，生成专项子代理，隔离上下文防止膨胀 | 图片生成、视频生成、音乐分析可以是不同子代理 |
| **虚拟文件系统** | ls/read/write/edit/glob/grep 工具，可插拔后端（内存/磁盘/LangGraph Store） | 存放 Skill 文件、用户会话状态、中间产物 |
| **持久化记忆** | 通过 LangGraph Memory Store 跨会话保存信息 | 用户偏好、项目上下文 |

### 技术栈

- **语言**：TypeScript（TypeScript-first，完整类型安全）
- **底层**：LangChain core + LangGraph
- **默认模型**：Claude Sonnet 4.5（可换成任何 LangChain 兼容模型）
- **安装**：`pnpm add deepagents @langchain/core`
- **运行要求**：Node.js + TypeScript 5.0+，**不需要 Docker/容器**

## 与 OpenClaw 的对比

| 维度 | OpenClaw | Deep Agents |
|---|---|---|
| **部署形态** | 独立容器化服务 | npm 库，集成到现有 Node.js 进程 |
| **多租户** | 单用户设计，多用户需多容器 | 库级别，通过 LangGraph thread 天然多租户 |
| **隔离方式** | 容器级隔离（重量级） | 进程内上下文隔离（轻量级） |
| **API Key 安全** | 存在容器内，用户可通过 shell 读取 | 存在服务端环境变量，用户完全碰不到 |
| **Skill 支持** | agentskills.io 格式 SKILL.md | 同样支持 SKILL.md 格式（agentskills.io 规范） |
| **代码执行** | 有 shell 执行能力 | 默认无 shell 执行，工具完全可控 |
| **运维成本** | 需要容器编排、定时 redeploy、Key 轮换 | 跟随主应用部署，零额外运维 |
| **成熟度** | 社区活跃（247k stars），但多租户方案不成熟 | 较新（9.9k stars），但 LangChain 生态强大 |

**核心差异**：OpenClaw 是一个"完整的 Agent 产品"需要被隔离部署；Deep Agents 是一个"Agent 引擎"可以嵌入到我们的产品中。

## 集成到 yino.ai 的架构设想

### 当前架构（无自托管 Agent）

```
用户浏览器 → yino.ai (Next.js)
                ├── 表单页面 → 直接调用后端 API（图片/视频生成）
                └── Skill/llms.txt → 外部 Agent（Claude Code/Codex）调用我们的 API
```

### 加入 Deep Agents 后

```
用户浏览器 → yino.ai (Next.js)
                ├── 表单页面 → 直接调用后端 API（不变）
                ├── Chat 页面 → Deep Agent（进程内）→ 调用我们自己的 API
                │                    ├── 子代理：图片生成
                │                    ├── 子代理：视频生成
                │                    └── 子代理：音乐分析
                └── Skill/llms.txt → 外部 Agent 调用我们的 API（不变）
```

### 关键设计点

#### 1. Agent 调用自己的 API

Deep Agent 的工具就是 HTTP 调用我们自己的 `/api/agent/models/*` 端点。这意味着：
- **复用现有 API 层**：不需要为 Agent 单独写一套后端逻辑
- **复用现有鉴权**：Agent 代表用户身份调用 API，积分扣费等逻辑不变
- **复用现有 Skill**：把 SKILL.md 加载到 Deep Agent 的虚拟文件系统中

#### 2. 多租户通过 LangGraph Thread

每个用户的每次对话是一个独立的 LangGraph thread：
- 上下文完全隔离（不同用户的对话互不可见）
- 支持断点续聊（LangGraph 的 durable checkpointing）
- 状态存储可以用 PostgreSQL（我们已有）

#### 3. 模型选择灵活

- 高级用户：用 Claude Sonnet（质量好但贵）
- 免费用户：用 MiniMax M2.7 或 Gemini Flash（我们在 OpenClaw 调研中已验证）
- 按用户订阅等级切换模型 = 成本可控

#### 4. 工具集完全可控

不像 OpenClaw 有内置的 shell 执行能力，Deep Agents 的工具集完全由我们定义：
```typescript
const agent = createDeepAgent({
  tools: [
    generateImageTool,    // 调 /api/agent/models/seedream-4-5
    generateVideoTool,    // 调 /api/agent/models/veo-3
    analyzeAudioTool,     // 调 /api/agent/models/music-analyze
    updatePreviewTool,    // 更新 Preview 展示
  ],
  systemPrompt: skillContent, // 从 SKILL.md 加载
  model: getUserModel(user),  // 按用户等级选模型
});
```

**没有 shell，没有文件系统写入，没有网络访问**——用户通过 Agent 只能做我们允许的事情。

## 与我们现有设计的契合度

### Skill 体系（高度契合）

我们在 [Skill 调优实验](260319-2-Skill-调优实验启动.md) 中确定了 instruction-only 的 Skill 设计：

> **决策：不带代码，纯 instruction-only**
> - 跨平台兼容性最好

Deep Agents 的 Skill 系统也采用 agentskills.io 规范（SKILL.md 文件），与我们的设计完全一致。同一份 Skill 文件可以同时服务于：
- 外部 Agent（Claude Code、Codex）通过 llms.txt 发现
- 内部 Deep Agent 通过虚拟文件系统加载

### Project + Preview 系统（天然适配）

Deep Agent 的子代理可以在每个步骤调用 `updatePreviewTool`，逐步充实 Preview：
1. 创意方向 → 子代理生成图片 → 更新 Preview Block
2. 分镜设计 → 子代理生成视频 → 追加 Preview Block
3. 最终成品 → 更新 Preview 状态为 complete

这完美匹配了 [Preview API 设计方案](260320-1-Preview-API-设计方案.md) 中的"渐进式充实"设计。

### Agent 套壳 SaaS（直接实现）

[Agent 套壳 SaaS 思路](260319-1-Agent-套壳-SaaS-思路.md) 的公式：

> SaaS = Agent（壳）+ Skill（能力定义）+ 后端 API（实际生成）+ 付费包装（网站）

Deep Agents 就是那个"Agent 壳"，而且是我们完全可控的壳。

## 成本分析

### 开发成本

- **集成工作量**：中等。需要实现自定义工具、Chat UI、LangGraph 状态存储配置
- **运维成本**：极低。跟随主应用部署，不需要额外的容器/服务
- **Skill 迁移**：零成本。现有 SKILL.md 直接可用

### 运行成本

主要是 LLM token 消耗。Deep Agents 的规划、子代理机制会消耗额外 token，但：
- 使用便宜模型（MiniMax M2.7：$0.30/M 输入）可以控制在可接受范围
- 子代理隔离上下文反而减少了单次调用的 token 数
- 按用户等级切换模型，免费用户用便宜模型

### 与 OpenClaw 方案的成本对比

| 项目 | OpenClaw | Deep Agents |
|---|---|---|
| 基础设施 | 独立 Railway service ($5+/月) | 零（共用主应用） |
| 容器运维 | 定时 redeploy、Key 轮换 | 无 |
| LLM 费用 | 相同（取决于模型选择） | 相同 |
| 开发工作量 | Proxy + 安全隔离 + Chat UI | 工具定义 + Chat UI |

## 风险与局限（乐观面）

### 1. LangGraph 生态绑定

Deep Agents 深度依赖 LangGraph。如果 LangGraph 方向变化或停止维护，迁移成本高。

**缓解**：LangChain 是 AI 工具链领域最活跃的开源组织之一，LangGraph 是其核心产品线，短期停止维护的风险低。且我们只用 Deep Agents 的 SDK 部分，不用 LangGraph Cloud。

### 2. JS 版本成熟度

文档提到 "TypeScript ecosystem has been lagging"，JS 版经历过不确定期，虽然 2026 年 3 月有大版本更新。

### 3. Token 消耗不可预测

Agent 的规划和重试行为可能导致 token 消耗超预期。

---

## 悲观分析：Deep Agents 的真实风险

> 以下是对 Deep Agents 方案的批判性审视。调研不能只看官方文档，要看社区真实反馈。
> **这一节的分析直接导致了我们从"JS 版同进程"转向"Python 版独立部署"的决策。**

### 1. JS 版是二等公民

> **决策影响：这一条直接否决了 JS 版。**

这是最大的红旗：

| 指标 | Python (deepagents) | JS (deepagentsjs) |
|---|---|---|
| Stars | 9,900+ | 934 |
| Issues | 活跃，大量讨论 | 16 个，冷清 |
| 社区关注 | 博客、教程、NVIDIA 合作都指向 Python | 官方承认 "JS 版经历过不确定期" |

所有的生产案例——LangChain 内部 GTM Agent（250% 转化提升）、NVIDIA AI-Q Blueprint、Open SWE——**全部是 Python 版**。JS 版零生产案例。934 stars 更像是 LangChain 品牌效应带来的关注，不是真有人在用。

### 2. 已知 JS 版 Bug 令人担忧

从 [GitHub Issues](https://github.com/langchain-ai/deepagentsjs/issues) 看：

- **#292**: 浏览器环境构建失败（Vite/Rollup 报 Node.js imports）→ 打包层没做好
- **#314**: Gemini 模型 400 错误 → 非 Anthropic 模型支持不完善
- **#284**: 子代理流式输出缺失（Python 版有）→ JS 版功能缺失
- **#167**: 连接失败后无法自动重连 → 生产环境致命问题
- **#206**: 多层级子代理不支持 → 架构能力缺失

16 个 open issues 看着少，但对一个只有 934 stars 的项目来说，说明**用的人本来就不多**。

### 3. HN 社区对 LangChain 整体的不信任

[Hacker News 讨论](https://news.ycombinator.com/item?id=44761299)的主旋律：

> "LangChain 试图使简单的东西看起来很复杂"
> "看起来像一个周末被黑客入侵的东西"
> "制造术语来销售 LangSmith"

这不只是对 Deep Agents 的批评，是对 LangChain **整个生态**的不信任。LangChain 在开发者社区的口碑一直有争议——抽象层太多、API 频繁破坏性变更、文档和实现不一致。**绑定 LangChain 生态 = 继承这些风险。**

### 4. "不是新东西"的质疑是成立的

Deep Agents 的四大支柱（规划、子代理、文件系统、详细 prompt）确实不是什么新发明。它本质上是：

> **一个配置好的 LangGraph 图 + 预设的工具集 + 一份好的 system prompt**

如果我们只需要"Agent 调用我们的 API"这个能力，用 LangGraph 甚至 Vercel AI SDK 自己搭一个可能也就 **200-300 行代码**。引入 Deep Agents 的额外价值存疑。

> **后续反思**：这个分析技术上成立，但低估了"自己搓"的隐性成本。我们之前手搓 Agent 的经验是问题越来越多。Deep Agents 的价值不在于"新"，而在于边界情况别人已经趟过了。最终还是选择了 Deep Agents 而非自建。

### 5. Token 消耗不可控是商业风险

对 SaaS 来说：
- Agent 的规划、重试、子代理每个都要消耗 token
- 一次复杂任务可能吃掉用户一个月的积分
- 用户会觉得"我就生成一个视频，怎么扣了这么多积分？"
- 无法精确预估成本 → 无法精确定价

### 6. 我们真正需要的可能更简单

回到我们的场景：Agent 调用 `/api/agent/models/*` 生成图片/视频。工作流其实很结构化：解析意图 → 调用 API → 轮询结果 → 更新 Preview。这不需要"深度代理"的全部能力。Vercel AI SDK 的 `streamText` + `tools` 可能就够了，而且我们已经在用。

---

## 核心洞察与最终决策

### 决策原则：一个人的团队，开发成本最小化

> **能开箱即用就不要自己搓。运行成本高一点无所谓，开发成本才是瓶颈。**

之前过度追求"轻量"和"零依赖"，倾向于用 Vercel AI SDK 自建。但回顾我们之前手搓 Agent 的经验：**问题越来越多**。Skill 解析、工具映射、错误处理、上下文管理……每个看起来简单的东西都会长出边界情况。

Deep Agents Python 版的价值不在于它做了什么"新"的事情，而在于：**这些边界情况别人已经趟过了。**

### 为什么选 Deep Agents Python

| 我们的需求 | Deep Agents Python 怎么满足 |
|---|---|
| 能吃 SKILL.md | ✅ 原生 agentskills.io 支持，第三方 Skill 即插即用 |
| 不需要容器 | ✅ 普通 Python 进程，不需要 Docker |
| 不需要管很多容器 | ✅ 一个进程，不是 OpenClaw 的一用户一容器 |
| 独立服务隔离 | ✅ 独立 Railway project，完全隔离 |
| 开箱即用 | ✅ `pip install deepagents`，配个工具就能跑 |
| 成熟可靠 | ✅ 16.9k stars，真实生产案例 |

### 与 OpenClaw 的本质区别（为什么这次可行）

OpenClaw 搁置的两个死结，Deep Agents 都不存在：

1. **OpenClaw 需要容器隔离**（因为有 shell 执行 → API Key 泄露）
   → Deep Agents 工具集完全由我们定义，没有 shell，不需要隔离

2. **OpenClaw 一用户一容器**（单用户设计 → 多租户需要容器编排）
   → Deep Agents 是库，通过 thread 隔离用户上下文，一个进程服务所有用户

### 部署架构

> *注：最初设想是同机部署，后来讨论后改为独立 Railway project 部署——完全隔离更好，不需要迁就同进程或同机。*

```
Railway Project A: yino.ai
└── Service: Next.js (前端 + API)
    └── /api/agent/chat → HTTPS 代理到 Agent 服务

Railway Project B: yino-agent（独立 project，完全隔离）
└── Service: Python (FastAPI + Uvicorn)
    ├── POST /stream     → Deep Agent 流式调用
    ├── Authorization    → Bearer token 验证
    └── 内部:
        ├── SkillsMiddleware → 加载 SKILL.md
        ├── 自定义工具 → HTTPS 调 yino.ai 公网 API
        └── 不共享内网、数据库、环境变量
```

**为什么独立部署比同机更好**：
- **完全隔离**：不共享内网、不共享数据库、不共享环境变量
- **独立扩缩容**：Agent 服务可以独立调整资源
- **故障隔离**：Agent 挂了不影响主站
- **简化安全模型**：只需在 Agent 服务设一个 Bearer token

与 OpenClaw 独立部署的区别：OpenClaw 被迫独立部署是因为安全问题（shell + API Key 泄露）。Deep Agents 独立部署是主动选择，为了架构清晰。

### 能力是否过剩？

Deep Agents 的规划、子代理、文件系统、记忆——我们可能只用到一部分。但：
- **能力过剩 ≠ 负担**：不用的功能不会增加开发成本，只是不配置而已
- **能力过剩 > 能力不足**：自建方案在需求增长时会不断暴露新问题
- **渐进式使用**：先只用基础工具调用，后续按需开启规划/子代理/记忆

## 方案对比（最终版）

| 方案 | 开发成本 | 运行成本 | Skill 兼容 | 推荐度 |
|---|---|---|---|---|
| **Deep Agents Python 独立部署** | 低（开箱即用） | 中（多一个 service） | 原生支持 | ✅ **选定方案** |
| **Vercel AI SDK 自建** | 高（手搓 Skill 层） | 低（同进程） | 需自己实现 | ❌ 看起来轻但坑多 |
| **Deep Agents JS** | 低 | 低 | 原生支持 | ❌ JS 版是二等公民 |
| **OpenClaw** | 中 | 高（容器） | 原生支持 | ❌ 容器隔离难题 |

## 行动计划

### 不放在一期

一期聚焦表单站 + 外部 Agent 接入。自托管 Agent 作为二期。

### 二期：Deep Agents Python 独立部署

1. **POC（1-2 天）**：在实验仓库验证核心链路
   - `pip install deepagents` + 自定义工具（mock API 调用）
   - 加载我们的 SKILL.md + 一个第三方 Skill
   - 用 FastAPI 包一层 HTTP 接口
   - 验证多用户 thread 隔离

2. **部署（1-2 天）**：
   - Python HTTP 服务 + Dockerfile
   - Railway 独立 project 部署（与 yino.ai 完全隔离）
   - Next.js API Route 代理请求（Bearer token 鉴权）

3. **集成（2-3 天）**：
   - Chat UI（复用 `useChat`）
   - 工具集：HTTPS 调用 yino.ai `/api/agent/models/*`、更新 Preview
   - 用户身份传递和积分扣费

4. **优化（按需）**：
   - 模型按用户等级切换
   - Token 消耗监控和上限
   - 开启子代理/记忆等高级功能

### 持续观察

- agentskills.io 规范的演进和第三方 Skill 生态
- LangChain 生态的稳定性（breaking changes 频率）
- Deep Agents SDK 版本更新（锁版本，选择性升级）

---

## Deep Agents Python 深度调研（260323 补充）

### 基本面

| 指标 | 数值 |
|---|---|
| Stars | 16,900 |
| Forks | 2,400 |
| Contributors | 98 |
| Commits | 1,111 |
| Releases | 74（最新 v0.4.12，2026-03-20） |
| Open Issues | 99 |
| 发布频率 | 每周 1-2 次 |
| License | MIT |
| 语言 | Python 99.4% |

### 生产案例

**LangChain 内部**：
- GTM Agent：处理销售线索，250% 转化提升，86% 周活跃率（2025.12-2026.03）
- NVIDIA AI-Q Blueprint：企业级研究系统（2026.03 合作发布）
- Open SWE：内部编码 Agent 框架（Stripe Minions、Ramp Inspect 等采用类似架构）

**外部**：没有搜到具体公司名，但教程生态丰富（DataCamp、Substack、byteiota 等），说明有开发者在用。

### 已知问题

**严重**：
- [#934](https://github.com/langchain-ai/deepagents/issues/934) Skill 路径解析导致无限循环 → 对我们有影响
- [#2086](https://github.com/langchain-ai/deepagents/issues/2086) 子代理流式数据在 React 中不完整 → 影响 Chat UI
- [#1991](https://github.com/langchain-ai/deepagents/issues/1991) MCP broken（p0）→ 我们不用 MCP，不影响

**需注意**：
- AGENTS.md 明确提醒 race conditions 和 resource leaks
- 99 个 open issues 中有多个 p1 高优先级
- 上下文管理是已知挑战（pydantic-deepagents 专门做了大输出驱逐）

**评估**：问题主要集中在 CLI 和边缘场景（沙箱、MCP）。我们只用 SDK 最小子集，踩坑概率低。

### Skill 系统详解

**核心机制：Progressive Disclosure**

1. Agent 创建时，`SkillsMiddleware` 只读取每个 Skill 的 YAML frontmatter（name + description）
2. Agent 运行时，根据用户任务匹配相关 Skill → 才读取完整 SKILL.md
3. 不匹配的 Skill 不加载 → 节省 token

**加载方式**：

```python
# 方式 1：从文件系统加载（适合固定 Skill）
agent = create_deep_agent(
    backend=FilesystemBackend(root_dir="/app"),
    skills=["/app/skills/"],
)

# 方式 2：从 Store 加载（适合动态加载远程 Skill）
store = InMemoryStore()
store.put(("filesystem",), "/skills/yino-mv/SKILL.md", create_file_data(content))
agent = create_deep_agent(
    backend=lambda rt: StoreBackend(rt),
    store=store,
    skills=["/skills/"],
)
```

**多来源叠加**：`skills=["/base/", "/custom/"]`，同名 Skill 后者覆盖前者。

**与我们的 Skill 兼容**：我们的 SKILL.md 遵循 agentskills.io 规范，Deep Agents 原生支持。理论上零适配。

### 中间件裁剪方案

Deep Agents 中间件执行顺序：`Memory → Skills → TodoList → Filesystem → SubAgent → Summarization`

| 中间件 | 功能 | 我们需要？ | 理由 |
|---|---|---|---|
| **SkillsMiddleware** | 加载 SKILL.md | ✅ 需要 | 核心需求 |
| **TodoListMiddleware** | 任务规划 | ✅ 需要 | MV 生成是多步骤任务 |
| **SummarizationMiddleware** | 上下文压缩 | ✅ 需要 | 防止长对话 token 爆炸 |
| **FilesystemMiddleware** | 文件读写 + shell 执行 | ❌ 不需要 | 我们的 Agent 只调 API，不操作文件 |
| **SubAgentMiddleware** | 子代理派生 | ⏳ 后期 | 复杂任务时再开启 |
| **MemoryMiddleware** | 跨会话记忆 | ⏳ 后期 | 用户偏好记忆 |

**关键发现**：不传 `backend=FilesystemBackend` → 默认用 `StateBackend`（纯内存）→ 没有文件系统工具、没有 shell 执行。**安全问题直接消失，不需要任何额外的隔离措施。**

### 最小可用配置

```python
from deepagents import create_deep_agent
from langchain.chat_models import init_chat_model

agent = create_deep_agent(
    model=init_chat_model("anthropic:claude-sonnet-4-5-20250929"),
    tools=[
        generate_image_tool,    # HTTP 调 yino.ai /api/agent/models/seedream-4-5
        generate_video_tool,    # HTTP 调 yino.ai /api/agent/models/veo-3
        update_preview_tool,    # HTTP 调 yino.ai Preview API
        check_status_tool,      # HTTP 调 yino.ai 状态查询
    ],
    skills=["/skills/"],        # 加载 SKILL.md
    system_prompt="你是 yino.ai 的视频和图片创作助手...",
    # 不传 backend → StateBackend → 无文件系统/shell
    checkpointer=PostgresSaver(...),  # 用我们已有的 PostgreSQL
)

# 多租户：通过 thread_id 隔离
result = agent.invoke(
    {"messages": [{"role": "user", "content": "..."}]},
    config={"configurable": {"thread_id": f"user_{user_id}_{session_id}"}},
)
```

### 部署架构

参考 [agent-service-toolkit](https://github.com/JoshuaC215/agent-service-toolkit)（LangGraph + FastAPI 的成熟模板）：

```
Railway Project A: yino.ai
└── Service: Next.js (前端 + API)
    └── /api/agent/chat → HTTPS 代理到 Agent 服务

Railway Project B: yino-agent（独立 project，完全隔离）
└── Service: Python (FastAPI + Uvicorn)
    ├── POST /stream     → Deep Agent 流式调用
    ├── GET  /info       → Agent 信息
    ├── Authorization    → Bearer token 验证
    └── 内部:
        ├── SkillsMiddleware → 加载 SKILL.md
        ├── TodoListMiddleware → 规划
        ├── SummarizationMiddleware → 上下文压缩
        └── 自定义工具 → HTTPS 调 yino.ai 公网 API
```

### 诚实评价

**选它的理由**：
- Skill 系统开箱即用，progressive disclosure 设计精良
- 中间件可选，不需要的关掉即可
- StateBackend 默认 = 无文件系统/shell = 安全
- LangGraph thread 天然多租户
- 16.9k stars、98 contributors、每周更新
- agent-service-toolkit 提供 FastAPI 部署模板
- 一个人的团队，自己搓只会越来越多坑

**风险**：
- 99 个 open issues，Skill 路径解析有过无限循环 bug
- 不是"装上就能用"，需要调试
- LangChain 生态绑定不可避免
- 外部生产案例主要靠推断，没有明确的大公司背书
- 子代理流式数据在 React 中有兼容问题

**总体**：核心 SDK（Skill + 工具调用 + 规划）稳定。问题集中在 CLI 和边缘场景。我们用最小子集，风险可控。

## 参考资料

- [Deep Agents Python 仓库](https://github.com/langchain-ai/deepagents)（16.9k stars）
- [Deep Agents Python 文档](https://docs.langchain.com/oss/python/deepagents/overview)
- [Deep Agents Skills 文档](https://docs.langchain.com/oss/python/deepagents/skills)
- [Deep Agents 架构分析（DeepWiki）](https://deepwiki.com/langchain-ai/deepagents)
- [Skills 系统技术细节（DeepWiki）](https://deepwiki.com/langchain-ai/deepagents/2.4-skills-system)
- [agent-service-toolkit（FastAPI 部署模板）](https://github.com/JoshuaC215/agent-service-toolkit)
- [Deep Agents 博客](https://blog.langchain.com/deep-agents/)
- [Skills 使用博客](https://blog.langchain.com/using-skills-with-deep-agents/)
- [多代理应用构建](https://blog.langchain.com/building-multi-agent-applications-with-deep-agents/)
- [agentskills.io 规范](https://deepwiki.com/agentskills/agentskills/2.2-skill.md-specification)
- [Hacker News 讨论](https://news.ycombinator.com/item?id=44761299)
- [Deep Agents JS 仓库](https://github.com/langchain-ai/deepagentsjs)（934 stars，JS 版对比参考）
