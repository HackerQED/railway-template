# yino.ai

> **所有设计决策、实验记录、战略思考都在 `notes/` 目录下，按日期排序（YYMMDD）。** 这份 README 只是两万米高空的概览，细节去 notes 里找。

All-in-One AI 媒体生成平台。API 是核心，表单是给人的皮，Skill 是给 Agent 的皮。

主打 **Music Video Generator** 切入市场——这是有稳定流量和付费意愿的赛道。底层是通用的生图/生视频能力，后续自然扩展到 All-in-One。

## 核心理念

**"正确做 Agent 的方法是不做 Agent。"**

不在产品里造 Chat，不做 MCP，不嵌 Agent。做一个人能用的表单站，在此基础上开放 API + 发布 Skill，让 Claude Code、OpenClaw、Codex 这些通用 Agent 来调。

竞品调研的结论：Chat 界面的竞品用户抱怨远多于表单界面的（B.ai 成绩最好，抱怨最少）。先做表单，赚到钱再加 Chat。加 Chat 的方式也不是自己手搓——找一个 OpenClaw 供应商预装我们的 Skill，按需调用，天然就有了 Chat 能力。

```
REST API（核心）
   ├── 表单前端（给人用）
   ├── Skill（给 Agent 用）
   └── Chat（后期，接 OpenClaw 供应商，不自己做）
```

## 产品策略

- **流量入口**：Music Video Generator（SEO 关键词、ClawHub Skill 分发）
- **实际形态**：All-in-One 媒体生成（生图、生视频、音乐分析、视频合成...）
- **Agent 分发**：OpenClaw ClawHub 是主要渠道（13,000+ 社区 Skill），同时兼容 Claude Code、Cowork、Codex
- **扩圈路径**：先服务有 Agent 的用户 → 后期接 OpenClaw 供应商提供 Chat 入口 → 覆盖无 Agent 用户

## 架构

```
用户 / Agent
   │
   ├── 表单前端（给人用）
   ├── Skill（给 Agent 用，纯 instruction，不带代码）
   └── Chat（后期，接 OpenClaw 供应商，不自己做）
         │
         └── REST API（核心，所有入口调同一套）
               ├── 模型端点（一个模型一个端点，异步）
               ├── 服务端点（同步：分析、合成、上传）
               ├── 发现机制（llms.txt → capabilities → docs）
               └── 双轨鉴权（API Key / Session Cookie）
```

具体端点、参数、鉴权方式等见 `CLAUDE.md` 和代码。API 能力列表从 `src/lib/api-capabilities.ts` 的 CAPABILITIES 数组生成，是所有出口的单一数据源。

## Skill 设计

两个 Skill，递进关系：

| Skill | 定位 | 结构 |
|-------|------|------|
| **yino-ai** | 通用入口，调所有能力 | 只有 SKILL.md |
| **yino-music-video** | MV 完整编排 | SKILL.md（接口层 + 编排知识）+ knowledge/（领域知识） |

设计原则：
- **不带代码**：纯 instruction-only，跨平台兼容性最好
- **不硬编码路径**：用自然语言描述，让 Agent 自己定位
- **接口层和知识层分离**：调优质量 = 调优知识文档，不碰代码
- **关键信息放最显眼位置**：Agent 不会主动深挖，重要的东西必须在 SKILL.md 顶部

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js (App Router) |
| 前端 | React + TailwindCSS + Radix UI |
| 数据库 | PostgreSQL + Drizzle ORM |
| 认证 | Better Auth (Google OAuth + 开发环境 Email/Password) |
| 支付 | Stripe（订阅 + 一次性 + 积分） |
| 存储 | S3 (Cloudflare R2) |
| 视频合成 | FFmpeg |
| 部署 | Railway + Docker |
| 代码质量 | Biome |

## 实验仓库

技术验证在独立仓库完成：[cc-music-video-playground](https://github.com/HackerQED/cc-music-video-playground)（本地路径：`/home/hackerqed/workspace/cc-music-video-playground`）

| 实验 | 验证什么 | 结论 |
|------|---------|------|
| 1. API 发现机制 | Agent 只拿到 URL 能否自主发现并调用 API | ✅ 通过。三层递进发现（llms.txt → capabilities → docs）有效 |
| 2. Skill 设计 | Skill 怎么写、带不带代码、怎么跨平台 | ✅ 完成。不带代码、接口知识分离、自然语言描述路径 |

实验结论已迁移到主仓库落地。详见 `notes/` 目录。

