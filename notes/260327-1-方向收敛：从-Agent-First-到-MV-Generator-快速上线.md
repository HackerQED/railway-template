# 方向收敛：从 Agent First 到 MV Generator 快速上线

> 2026-03-27 | 方向决策

## 背景

过去两周我们在 Agent First 路线上做了大量探索——自研 Agent API、OpenClaw 共享 Demo、Preview Block、Project 体系、Skill 调优。
这些技术本身可行，但离"能卖"还有距离。现在需要收敛到一条**最短路径**把产品推上线、验证 PMF。

## 决策：暂停 Agent，聚焦 MV Generator 套壳 + Seedance 2.0 投放

### 为什么

1. **更短的验证路径**
   Vidu 已经上线了 MV 生成器，支持 3 分钟音乐视频。我们直接套壳对接，不需要自己设计 agent 编排逻辑，大幅降低上线成本和不确定性。

2. **Seedance 2.0 = 快速现金流**
   我们拿到了 Seedance 2.0 API，市场上几乎没人能像我们一样卖现货。做投放是最快带来收入的方式。

3. **手搓的东西先封存**
   Agent API、OpenClaw、Preview、Project 体系——这些都是技术探索，不应该在产品验证期出现。先冻结，等有流量和收入了再决定是否继续。

### 封存范围

| 模块 | 状态 | 说明 |
|------|------|------|
| Agent API (`/api/agent/*`) | 保留代码，停止开发 | 已有的端点继续服务，但不再新增功能 |
| OpenClaw 集成 | 清理前端入口 | `openclaw/` 目录保留，但主页和 hero 区域去掉 OpenClaw 相关内容 |
| Preview Block / Project 体系 | 冻结 | 代码不删，但不再进入开发流程 |
| Skill 调优 | 冻结 | 实验结论已在 notes/legacy 中归档 |
| `llms.txt` / Agent 能力发现 | 保留 | 零维护成本，留着不碍事 |

### 新定位

**Yino AI = AI Music Video Generator（All-in-One）**

- 核心功能：MV 生成（Vidu 套壳）、Seedance 2.0 视频生成、图片生成
- 不再强调 "Agent First"，回归 All-in-One 工具站定位
- 面向 C 端用户，而非开发者/Agent

## 接下来的工作

### 立即执行

1. **主页内容更新**
   - 去掉 OpenClaw 安装横幅、Agent 标签页
   - hero 文案回归 "AI Music Video Generator"
   - 保留 Features、Pricing、FAQ 等标准 SaaS 结构

2. **Vidu MV 生成器对接**
   - 调研 Vidu API，实现套壳
   - 新增 MV 生成页面

3. **Seedance 2.0 投放准备**
   - 确保 Seedance 2.0 页面和支付流程顺畅
   - 准备投放素材

### 后续（有流量后再说）

- Vidu 效果一般的话，可以考虑自研 MV 编排
- Agent API 体系随时可以重启，代码都在
- OpenClaw 方案也保留，等时机成熟再上

## 内部工作流调整

- 开发笔记中不再涉及 Agent 相关设计
- Skill（Claude Code 开发辅助）继续使用，但内容不再提及 Agent API
- Preview API 不再开发

### Skill 和参考资料重构（已完成）

`.claude/skills/` 下的 reference 文件移到根目录 `reference/`（避免每次读取需要权限申请）：
- `reference/pages.md` — 各页面关键词数据（原 `.claude/skills/write-seo-page/references/pages.md`）
- `reference/providers.md` — 上游提供商注册表（原 `.claude/skills/add-upstream-api/references/providers.md`）
- `reference/page-template.md` — 模型页 page.tsx + JSON 结构模板（新建，整合自 generate-model-page 工作流）
- `reference/sources/` — 调研来源记录（自动生成）

`write-seo-page` skill 整合了自动调研逻辑（网络搜索 → 信息提取 → 来源记录）。
`pages.md` 清理了 OpenClaw/Agent 相关指导，更新资料引用。

## 总结

**先有流量和收入，再谈技术深度。** Vidu 套壳给我们一个"能交代"的 MV 功能，Seedance 2.0 现货优势带来现金流。技术探索的成果不丢，但现在不是它登场的时候。
