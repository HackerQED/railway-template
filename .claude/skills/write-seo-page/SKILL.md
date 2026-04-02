---
name: write-seo-page
description: Write SEO-optimized web copy — page titles, meta descriptions, hero text, headings, FAQ, and all user-facing text on marketing pages. Use when writing or rewriting metadata (title, description, og tags), homepage copy, landing page text, tool page text, feature descriptions, FAQ sections, testimonials, or CTA text. Also use when the user asks to optimize a page for a target keyword, or when creating new tool/feature pages.
---

# SEO 文案撰写

## 关键词数据

每个页面的一级词、二级词等关键词规划数据存放在 [pages.md](../../../reference/pages.md)。写文案前先查阅该文件获取当前页面的关键词。

## 工作流程

1. **查阅关键词数据** — 读取 [pages.md](../../../reference/pages.md) 找到当前页面的一级词、二级词和指导。如果页面尚未记录，向用户确认后补充到 pages.md。
2. **网络调研（模型页必须）** — 按下方"调研协议"执行，输出 `reference/sources/{model-slug}.md`。
3. **读取资料** — pages.md 中"资料"字段列出了该页面的背景文档，写文案前先读取了解卖点和上下文。如果模型已有 sources 文档（`reference/sources/` 下），也一并读取。
4. **判断页面类型** — 工具页需满足下方"工具页专用规则"中的密度硬指标。
5. **撰写文案** — 按照下方的分层策略和 metadata 规范执行。参考 [page-template.md](../../../reference/page-template.md) 的结构模板。
6. **自检** — 用末尾的 checklist 验证。

## 分层关键词策略

### 一级关键词

- 出现在 h1、h2、h3 标签中
- 用于 metadata 页面标题
- 总密度 3%（800 字需出现约 20 次）

### 二级关键词

- 与一级相关但流量不足以做独立页面
- 出现在内容正文和 metadata description 中
- 每个二级词至少出现 10 次

### 分层逻辑

```
一级词 → 搜索量足够支撑独立页面 → 做该页面的主词
二级词 → 搜索量不够做独立页面 → 融入一级词页面
```

## Metadata 规范

### Title

**公式：** `[一级词] — [差异化/利益点] | [品牌名]`

- 约 60 字符（Google 约 60 字符截断）
- 一级词放最前面
- 品牌名用管道符 `|` 分隔放末尾
- 一级二级尽量都在 title 中出现，title 重点一级

差：`Railway Template - The Best AI Platform for Everything`
好：`AI Music Video Generator — Create Videos from Any Song | Railway Template`

### Description

**公式：** `[一级词句子]. [二级词/功能]. [CTA 或价值主张].`

- 约 160 字符（Google 约 155 字符截断）
- 一级二级尽量都出现，description 覆盖二级
- 为人类而写——这是搜索结果中用户看到的内容

差：`Railway Template is an AI platform that uses AI to generate videos and images using artificial intelligence models.`
好：`Generate stunning AI music videos from any song. Powered by Seedream, Veo & top AI models. Use the web app or integrate with your AI agent.`

### 其他 meta

- **不使用 keywords meta**（Google 已明确无用）
- **canonical**: 用网站域名 const 写死，防止同一页面被多个 URL 索引
- **og:title** = 同 title（或稍短）
- **og:description** = 同 description（或为社交平台微调）
- 必须设置 **og:image**

## 工具页专用规则

工具页/功能页在通用规则之上，还需满足以下硬指标：

- **内容量**：≥ 800 词
- **一级词密度**：3%（800 词 ≈ 出现 20 次）
- **二级词密度**：每个二级词至少出现 10 次
- **工具集成**：页面中嵌入相关 Generator 组件，让用户直接体验功能
- **内容来源**：基于官方资料编写（用 Perplexity 或 Claude 收集英文原始资料，不要总结）

核心思路：**关键词密度是基础，工具交互提升用户体验和停留时间，实现"关键词和用户数据双高"**。

## 各 Section 文案模式

### Hero 区域
- H1 = 一级词（可为了可读性改写）
- 副标题 = 展开价值主张，自然融入二级词
- CTA 按钮 = 动作导向的动词（"Start Creating"、"Try Free"），不要含糊的（"Learn More"）

### Feature 区域
- 每个 feature 的 H3 = 一个可搜索的 use case 或利益点
- 描述中自然包含关键词
- 不要每个 feature 重复同一个词——把不同的二级词分散开

### FAQ 区域
- 每个问题 = 一个用户真实会搜索的长尾 query
- 至少 1-2 个问题包含一级词
- 回答简洁（2-3 句），自然包含相关关键词

### CTA 区域
- 标题 = 一级词变体重述核心价值
- 按钮文案 = 清晰的动作动词

## 自检清单

### 通用（所有页面）

- [ ] 一级词出现在：title、h1、h2/h3、description
- [ ] 二级词出现在：description、正文内容
- [ ] Title 约 60 字符，一级词在最前面
- [ ] Description 约 160 字符，覆盖二级词
- [ ] 没有关键词堆砌——文案对人类读起来自然
- [ ] canonical 已设置
- [ ] 不使用 keywords meta

### 工具页额外检查

- [ ] 内容 ≥ 800 词
- [ ] 一级词出现约 20 次（3% 密度）
- [ ] 每个二级词出现 ≥ 10 次
- [ ] 页面嵌入了相关 Generator 组件
- [ ] 内容基于官方资料，不是凭空编写

## 调研协议（模型页必须）

全自动执行，不需要用户确认。调研是内容质量的基础——没有调研的页面是无效的。

### 来源要求

| 要求 | 阈值 |
|------|------|
| 总来源数 | 6-10 |
| 官方来源 | ≥ 1 |
| 平台来源 | ≥ 2 |

**来源不足 6 个 → 继续搜索，不要开始写文案。**

### 来源分层

**Tier 0 — 官方（最高优先级）**

满足以下任一条件才算官方：
1. 模型母公司持有的域名（如 `bytedance.com`、`stability.ai`）
2. 公司官方 GitHub org
3. 从已验证官方来源链出的页面

**不要仅凭域名包含模型名就认定为官方**（如 `seedance.ai` 可能是第三方）。

**Tier 1 — 推荐平台**

| 平台 | 提取内容 |
|------|----------|
| wavespeed.ai | 分辨率、时长、规格 |
| huggingface.co | 模型卡片、demo |

**Tier 2 — 新闻和第三方评测**

### 搜索策略

```
Step 1 — 广泛搜索：WebSearch "{model-name} AI {video/image} generation features"
         → 提取官方网站 URL 和关键平台 URL

Step 2 — 官方来源：WebFetch 官方产品页

Step 3 — 平台搜索：
         WebSearch "site:wavespeed.ai {model-name}"
         WebSearch "{model-name} huggingface replicate"

Step 4 — 交叉验证：跨 2+ 来源核实分辨率、时长、支持格式
```

### 必须提取的信息

| 类别 | 内容 |
|------|------|
| 基本信息 | 模型名称、开发者、版本 |
| 输入模式 | Text-to-X、Image-to-X 等 |
| 输出规格 | 分辨率、时长、宽高比 |
| 独特功能 | 与其他模型的差异点 |
| 性能数据 | 速度、生成时间（如有） |

### 来源拒绝名单

- SEO 空壳站（无原创内容）
- 镜像/爬虫站（搬运官方内容）
- 无作者归属的站点
- 过时内容（旧版本信息）
- 仅营销无规格的站点

### 输出：sources 文档

调研完成后，保存到 `reference/sources/{model-slug}.md`：

```markdown
# {Model Name} Research Sources

## Official Sources
1. **{Source Name}**
   - URL: {url}
   - Key Information: {what was extracted}

## Platform Sources
2. **{Platform} - {Model}**
   - URL: {url}
   - Key Information: {specs}

## Key Specifications Verified
- **Resolution**: {verified across X sources}
- **Duration**: {verified across X sources}
- **Input Modes**: {verified}

## Source Quality Assessment
- Total sources: X
- Official sources: X
- Platform sources: X
```

### 调研质量门控

开始写文案前必须全部通过：
- [ ] ≥ 6 个来源已记录
- [ ] 访问了官方来源（如果存在）
- [ ] 关键规格跨 2+ 来源交叉验证
- [ ] sources 文档已保存

**任一未通过 → 继续调研，不要开始生成内容。**

## 模型页专用规则

模型页（视频/图片生成器落地页）在通用规则之上，还需注意：

### 标题多样性

禁止使用模板化标题：
- ❌ "{Model} Core Capabilities"
- ❌ "Six Applications of {Model}"
- ❌ "Create AI Content in 3 Simple Steps"

必须使用特定于模型的、独特的标题。

### Feature (Why Choose) 部分

- 结构：3 个优势 + 3 个用例
- **100% 原创**：不从其他模型页面复制
- 禁止套话："Short-Form Content Creators"、"Social media content"、"Content creators" 等
- 必须基于调研数据，引用具体能力
- 与 Features 部分内容不重复

### FAQ 部分

- 6 个问题
- 第一个问题不能是 "What is {Model}?"
- 无内容重复来自 Features 或 Why Choose
- 每个回答包含具体细节
- 不提及定价

### 禁止内容

- testimonials / reviews / endorsements
- 技术术语（API、SDK、developer、GPU、VRAM 等）
- 外部网站链接或"在某平台上试试"
- 硬件和部署相关内容

## 参考资料

- [pages.md](../../../reference/pages.md) — 各页面关键词数据
- [page-template.md](../../../reference/page-template.md) — page.tsx 和 JSON 结构模板
- `reference/sources/` — 调研来源记录（自动生成）
- 现有页面参考：`messages/en/SeedancePage.json`、`messages/en/VeoPage.json`（参考格式，不抄内容）
