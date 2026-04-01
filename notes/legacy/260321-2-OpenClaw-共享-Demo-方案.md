# OpenClaw 共享 Demo 方案

> **⚠️ 该方案暂时搁置，不放在一期。** 调研和部署单元保留，后续重启时可直接复用。搁置原因见末尾"未解决的困难"。

## 核心想法

部署一个共享的 OpenClaw 实例，让没有 Agent 的用户也能在网站上体验 Skill 能力。对应 [Agent 套壳 SaaS 思路](260319-1-Agent-套壳-SaaS-思路.md) 中的"免费用户"策略。

## 调研结论

### OpenClaw 是什么

开源个人 AI Agent 平台（前身 Clawdbot/Moltbot），247k stars。支持 100+ AgentSkills，模型无关，Railway 有官方一键部署模板。

### 为什么不能直接暴露给用户

- WebChat 和 Admin Dashboard 是**同一个界面**，没有 guest/readonly 模式
- 拿到 Gateway token = 完整管理权限（看到 API Key、改配置、执行 shell）
- 官方安全模型是单用户/单 Gateway，不是多租户架构

## 安全设计

### 威胁模型

OpenClaw 是单用户个人 Agent，设计上假设 operator 是可信的。我们要把它暴露给不可信的公众用户，所以必须做隔离。

### 核心原则：网络隔离

```
yino.ai (Next.js)  ── HTTPS ──→  独立 Railway service (OpenClaw)
     ↑                                   ↑
  用户浏览器                         完全隔离的网络
  (只碰 yino.ai)                    (独立项目/无共享内网)
```

**OpenClaw 和 yino.ai 不在同一个 Railway project**，不共享数据库，不共享内网。互相只通过公网 HTTPS 通信。

### 安全措施清单

1. **网络隔离**：OpenClaw 部署为独立 Railway project/service，与 yino.ai 零内网共享
2. **Gateway token 不暴露**：token 只存在 yino.ai 服务端环境变量（`OPENCLAW_GATEWAY_TOKEN`），前端永远碰不到
3. **Proxy 只转发聊天**：API Route 只代理 `/v1/chat/completions` 的 SSE 流，解析后只提取文本内容，屏蔽所有管理 RPC
4. **被打穿也无害**：OpenClaw 被攻陷后，攻击者碰不到 yino.ai 的数据库、用户数据、Stripe 密钥。最多损失 OpenClaw 自己的 AI API Key
5. **定时刷新**：Railway Cron 定时 redeploy，不挂持久卷，重启即清零
6. **用户必须登录**：Chat 页面在 `(protected)` 路由组下，API Route 用 `resolveApiUser` 验证身份
7. **共享声明**：前端显示 "Shared Demo" 横幅，明确告知用户实例是共享的、对话不私密

### 已知风险（可接受）

- 共享实例意味着用户可能看到其他人的对话（OpenClaw 单 session）→ 定时 redeploy 缓解
- OpenClaw 的 AI API Key 暴露在 OpenClaw 容器内 → 隔离后损失有限，且定时轮换
- OpenClaw 安全更新依赖上游社区 → 定期更新镜像版本

## 方案：OpenClaw + Next.js Proxy

### 排除的方案

- **方案 B（Telegram/Discord Bot）**：零开发量，但用户要跳出网站
- **方案 C（自建 Chat，不用 OpenClaw）**：最简单，但没有 Agent + Skill 编排能力
- **OpenClaw 和 yino.ai 同网络部署**：OpenClaw 有 shell 执行能力，同网络 = 给攻击者进内网的入口

### 代码组织

全部在本仓库 `openclaw/` 目录下，但部署上完全独立：

```
yino.ai/
├── openclaw/                          # OpenClaw 独立部署单元
│   ├── Dockerfile                     # 基于官方镜像，bake 进配置和 skills
│   ├── docker-compose.yml             # 本地开发用（独立 compose，不混入主项目）
│   ├── README.md                      # 启动说明
│   ├── config/openclaw.json           # 开启 /v1/chat/completions
│   └── workspace/skills/              # 自定义 Skill 文件
├── src/
│   ├── app/api/agent/chat/route.ts    # Proxy route：SSE 解析 + 文本流转发
│   └── app/[locale]/(dashboard)/(protected)/chat/
│       ├── page.tsx                   # Chat 页面
│       └── chat-view.tsx              # Chat 组件（useChat + TextStreamChatTransport）
└── docker-compose.yml                 # 主项目不动，只有 PostgreSQL
```

## 技术细节

### 本地开发

OpenClaw 用独立的 docker-compose，**不混入主项目的 compose**：

```bash
# 启动 OpenClaw（从项目根目录）
docker compose -f openclaw/docker-compose.yml up -d

# 健康检查
curl http://localhost:18789/healthz
```

Next.js 通过 `OPENCLAW_GATEWAY_URL=http://localhost:18789` 连本地 OpenClaw。

### Skill 挂载

Skill 是包含 `SKILL.md` 的文件夹，放到 `openclaw/workspace/skills/` 下。本地开发通过 volume 挂载，生产通过 Dockerfile bake 进镜像。

Skill 文件格式：
```markdown
---
name: my-skill
description: 这个 skill 做什么
metadata: {"openclaw": {"requires": {"env": ["MY_API_KEY"]}, "primaryEnv": "MY_API_KEY"}}
---

Agent 指令内容...
```

### Proxy 对接

API Route (`/api/agent/chat`) 流程：
1. 验证用户身份（session cookie 或 API key）
2. 转发消息到 OpenClaw `/v1/chat/completions`（SSE streaming）
3. 解析 SSE 事件，提取文本 delta
4. 通过 `createTextStreamResponse` 返回纯文本流给前端

前端用 Vercel AI SDK v5 的 `useChat` + `TextStreamChatTransport` 对接。

### 关键参数速查

| 项目 | 值 |
|---|---|
| 镜像 | `ghcr.io/openclaw/openclaw:latest` |
| 默认端口 | 18789 |
| API | `/v1/chat/completions`（OpenAI 兼容） |
| 认证 | `Authorization: Bearer <GATEWAY_TOKEN>` |
| 健康检查 | `GET /healthz` |

### Railway 生产部署

- OpenClaw 单独一个 Railway **project**（不是 service），与 yino.ai 完全隔离
- **不挂持久卷** → redeploy = 全部状态清零
- **Railway Cron Service 定时 redeploy**（每 6 小时或每天），实现自动刷新
- 配置通过环境变量注入，Skill 文件通过 Dockerfile bake 进镜像
- yino.ai 通过 `OPENCLAW_GATEWAY_URL` 环境变量指向 OpenClaw 的公网地址

## 模型选型（2026-03-21 调研）

### 决定：MiniMax M2.7

- **价格**：$0.30/M 输入，$1.20/M 输出（与 M2.5 完全相同，Claude Sonnet 的 1/25）
- M2.7 相比 M2.5：软件工程任务提升、幻觉减少，价格不变，没理由用老版本
- Tool calling 可靠，能处理复杂 API schema
- 共享 demo 场景预估月费 $1-5
- 接入方式：直连 MiniMax 官方 API（`platform.minimax.io`）或通过 OpenRouter 中转

### 排除的模型

| 模型 | 排除原因 |
|---|---|
| Claude / GPT 旗舰 | 共享 demo 没必要烧钱 |
| DeepSeek | Reasoner 不支持 tool calling；prompt 泄露 bug（#10387）；503 频繁 |
| Qwen 本地 | 需要 GPU，Railway 部署不现实 |
| Mistral | rate limit 激进，长任务容易崩 |

### 备选

- **Gemini 3 Flash**：通过 Google AI Studio 免费，PinchBench 榜首，可作为 fallback 或零成本启动方案

## 未解决的困难（搁置原因）

### 1. 共享实例的 API Key 泄露风险

OpenClaw 容器内必须存放 AI provider 的 API Key（MiniMax 等）。共享实例意味着用户通过 OpenClaw 的 shell 执行能力可能读取到容器内的环境变量，导致 API Key 泄露。定时轮换 key 可以缓解但运维成本高，且窗口期内仍有风险。

**目前没有低成本的解决方案。** OpenClaw 的安全模型假设 operator 是可信的，没有内置的 secret 隔离机制。

### 2. Chat UI 与用户数据关联的复杂度

要实现"用户聊天记录与 Project 关联、刷新不丢失"，涉及：
- OpenClaw 的 session 管理机制（WebSocket 协议，非简单 HTTP）
- 用户身份传递（不能直接传 API Key，需要 OTP 等临时凭证）
- 聊天持久化存储的归属问题（存在 yino.ai 还是 OpenClaw？proxy 层存还是让 OpenClaw 存？）
- OpenClaw 的 `/v1/chat/completions` HTTP API 是简化接口，不支持完整的 session 管理能力（需要 WebSocket 协议）

这些问题每个都可以解决，但组合在一起的工程量超出了 MVP 范围。

### 可能的后续方向

- **PinchChat 模式**：参考 PinchChat（纯前端 SPA 直连 Gateway WebSocket），做一个裁剪版的 Chat UI，但需要解决 token 暴露问题
- **每用户独立实例**：每个用户一个 OpenClaw 容器（成本高但安全），类似 GitHub Codespaces 模式
- **等 OpenClaw 多租户支持**：社区有 Claworc、users-for-openclaw 等方案在推进，等成熟后再接入

## 已完成的部分（可复用）

- `openclaw/` 目录：Dockerfile + 独立 docker-compose + config + demo skill — **OpenClaw Gateway 本地可跑通**
- MiniMax M2.7 模型已验证可用（通过 `/v1/chat/completions` API 测试通过）
- 安全设计文档、模型选型调研 — 后续重启时不需要重新调研
- Next.js 侧的 Chat 页面和 API proxy 代码已回退（git 历史中保留，commit `9cac5b0`）

## 状态

**搁置。** 调研和 OpenClaw 部署单元保留。Next.js 侧代码已回退。
