# Agent API 设计决策

**日期**：2026-03-18
**状态**：Phase 2 完成（生成能力 + 发现机制），Mock 模式验证通过
**PR**：#40

---

## 当前端点清单

### 发现层（公开，无需鉴权）

| 端点 | 说明 |
|------|------|
| `GET /llms.txt` | Agent 入口，纯文本 Markdown，指向 capabilities |
| `GET /api/agent/capabilities` | 能力列表 JSON，从 CAPABILITIES 数组生成 |
| `GET /api/agent/skills/music-video` | MV 工作流 Skill（读 Fumadocs mdx 返回原始 Markdown）|

### 模型端点（需鉴权，异步）

| 端点 | 说明 |
|------|------|
| `POST /api/agent/models/seedream-4-5` | 文生图，支持批量（items 数组，max 20）|
| `POST /api/agent/models/veo-3` | 图生视频，支持批量（items 数组，max 20）|

### 服务端点（需鉴权）

| 端点 | 说明 |
|------|------|
| `POST /api/agent/music/analyze` | 音乐分析，同步，Gemini multimodal |
| `POST /api/agent/video/compose` | 视频合成，同步，FFmpeg |
| `POST /api/agent/upload` | 文件上传，同步，S3 |
| `GET /api/agent/generations/status` | 批量状态查询，`?ids=id1,id2,...`，max 100 |

### 兜底

| 端点 | 说明 |
|------|------|
| `ANY /api/agent/*` | 404 → 返回 hint 指向 `/api/agent/capabilities` |

---

## 关键设计决策

### 1. 一个模型一个端点

**做法**：`/api/agent/models/seedream-4-5`、`/api/agent/models/veo-3`

**排除**：统一的 `/api/agent/image/generate?model=seedream-4-5`

**为什么**：
- 每个模型参数不同（Seedream 有 aspect_ratio + style，Veo 有 image_url + model variant），统一接口会变成一堆 `if model === xxx`
- Agent 调一个 URL 比理解参数路由更直观
- 和成熟 API 厂商对齐（WaveSpeed `/api/v1/models/<id>/predict`、KIE 类似）
- 加新模型 = 加新文件，不改已有代码

### 2. generations 而非 tasks

**做法**：`/api/agent/generations/status`、schema 里是 `generation` 表

**排除**：`/api/agent/tasks/status`

**为什么**：和 schema 保持一致，减少概念。数据库里叫 generation，API 也叫 generation，不引入第三个词。

### 3. Fumadocs 文档而非自建文档端点

**做法**：API 文档写在 `content/docs/api/*.mdx`，capabilities 里的 `doc` 字段指向 Fumadocs 路径（如 `/docs/api/seedream-4-5`）。Skill route 从 Fumadocs source 读 mdx 返回原始 Markdown。

**排除**：自建 `/api/agent/docs/:capability` 端点 + `src/lib/api-docs.ts` 硬编码文档字符串

**为什么**：
- 已有 Fumadocs 脚手架，不重复造轮子
- 人看 HTML 和 Agent 看 Markdown 是同一份源文件
- 改文档不用改代码

### 4. 404 返回 hint 而非全量端点列表

**做法**：404 响应返回 `{ error: "...", hint: "GET /api/agent/capabilities to discover available endpoints", doc: "/docs/api" }`

**排除**：404 时列出所有 `available_endpoints`

**为什么**：端点会越来越多，全量列表不 scale。给一个指向 capabilities 的 hint，让 Agent 自己去查。

### 5. 双轨鉴权：API Key + Session Cookie

**做法**：
1. `Authorization: Bearer yino_xxx` → SHA-256 hash 查 `apiKey` 表
2. 失败 → 检查 session cookie
3. 都失败 → 401

**排除**：只支持 API key

**为什么**：
- API key 给 Agent 用（Bearer token 是 Agent 的标准模式）
- Session cookie 给前端表单用（同一套 API 服务两层皮）
- API key 只存 hash，创建时返回一次明文（安全）

### 6. Mock 模式

**做法**：`src/lib/mock.ts` 的 `isMocked()` — 开发环境默认 mock，生产默认真实，`MOCK` 环境变量可覆盖

**排除**：不做 mock / 自动检测 API key 是否存在

**为什么**：
- 本地开发不想烧真实额度
- 自动检测 key 存在与否太隐式，显式的环境变量更可控
- Mock 数据带真实结构（延迟、URL 格式），验证 Agent 工作流不需要真实供应商

### 7. CAPABILITIES 数组是单一数据源

**做法**：`src/lib/api-capabilities.ts` 的 `CAPABILITIES` 数组驱动 llms.txt、/api/agent/capabilities、404 hint

**排除**：各端点各自描述自己

**为什么**：
- 之前实验发现 Agent 在不同信息源拿到矛盾信息会做出错误判断
- 改一个地方自动同步到所有出口
- 加新模型只需要在数组里加一条 + 写一个 route + 写一个 mdx

### 8. 不做 MCP

**做法**：REST API + Skill（Markdown）+ llms.txt

**排除**：MCP Server

**为什么**：
- MCP 是给框架层用的（Dify、Semantic Kernel），不是给 Agent 层用的
- MCP 全量注入 tool schema 到 context，我们的三层递进发现节省 token
- 实验验证 Agent 完全能自主发现和调用 REST API
- 以后需要接 Dify 时，加一个 MCP 端点把同一套 CAPABILITIES 转成 MCP schema 即可

### 9. 不做 Project（暂时）

**做法**：批量提交（items 数组）+ 批量查询（`?ids=...`），不引入 project 概念

**排除**：project 表 + `project_id` 关联所有 generation

**为什么**：
- Project 解决的是"Agent 忘掉 generation ID 怎么办"的问题
- 但当前 Agent 通过 Skill 的工作流提示，不太会忘
- 先跑起来再说，真有问题再加 project 不迟
- 少一张表 = 少一个概念 = 更简单

### 10. 批量提交和单个提交共用一个端点

**做法**：同一个模型端点，传 `{ prompt: "..." }` 是单个，传 `{ items: [...] }` 是批量

**排除**：独立的 `/api/agent/models/seedream-4-5/batch` 端点

**为什么**：
- Agent 只需要记一个 URL
- 实验验证 Agent 完全能理解"传一个就是单个，传数组就是批量"
- 以后要拆也容易，现在合着更简洁

---

## 代码地图

```
src/lib/
├── api-capabilities.ts   — CAPABILITIES 数组（单一数据源），所有端点信息从这里派生
├── api-auth.ts           — 双轨鉴权（resolveApiUser）+ API key 生成（generateApiKey）
├── api-response.ts       — apiSuccess / apiError / validateRequired / sanitizeErrorMessage
└── mock.ts               — isMocked()，开发环境默认 true

src/app/
├── llms.txt/route.ts                         — 从 CAPABILITIES 生成纯文本
├── api/agent/
│   ├── capabilities/route.ts                 — 从 CAPABILITIES 生成 JSON
│   ├── skills/music-video/route.ts           — 读 Fumadocs mdx 返回 Markdown
│   ├── models/seedream-4-5/route.ts          — 文生图（mock + 真实双通道）
│   ├── models/veo-3/route.ts                 — 图生视频（mock + 真实双通道）
│   ├── music/analyze/route.ts                — Gemini 音乐分析
│   ├── video/compose/route.ts                — FFmpeg 视频合成
│   ├── upload/route.ts                       — S3 文件上传
│   ├── generations/status/route.ts           — 批量状态查询
│   └── [...notfound]/route.ts                — 404 hint

src/ai/analysis/
├── service.ts    — Gemini 调用（base64 音频 → 结构化分析）
├── prompt.ts     — 分析 Prompt + JSON schema
└── types.ts      — MusicAnalysis 类型

src/worker/
├── index.ts                  — Worker 入口（轮询调度）
├── poll.ts                   — 轮询逻辑（查 pending generation → 调 provider → 更新状态）
├── providers/kie.ts          — Seedream 适配器
└── providers/kie-veo.ts      — Veo 适配器

content/docs/api/
├── seedream-4-5.mdx          — Seedream 参数文档
├── veo-3.mdx                 — Veo 参数文档
├── music-analyze.mdx         — 音乐分析文档
├── video-compose.mdx         — 视频合成文档
├── upload.mdx                — 文件上传文档
├── generations.mdx           — 状态查询文档
└── skills/music-video.mdx    — MV 工作流 Skill（YAML frontmatter + 完整示例）
```

---

## 验证状态

### 已通过（Mock 模式）

- [x] `pnpm build` 构建通过
- [x] llms.txt 生成正确，包含所有能力
- [x] capabilities JSON 从 CAPABILITIES 数组正确派生
- [x] Seedream 批量提交 → mock task_id → Worker poll → generations/status → done
- [x] Veo 批量提交 → 同上
- [x] 音乐分析 → mock 返回结构化分段数据
- [x] 401 鉴权拦截（无 token 被拒）
- [x] 404 兜底返回 hint

### 待验证

- [ ] `MOCK=false` 真实供应商端到端（需要 KIE_API_KEY）
- [ ] Agent 终极验收：干净 Claude Code 工作空间，只给 URL，自主完成 MV 生成
- [ ] 视频合成（FFmpeg，需要真实视频文件）

---

## 下一步

1. **Agent 调试**：拿真实 Agent 跑一遍完整 MV 工作流，发现接口设计的问题
2. **前端表单**：Human First 的"第一层皮"，调同一套 API
3. **积分扣费**：现在 API 不扣积分，需要加上
4. **Skill 发布**：发到 ClawHub，打 SEO
