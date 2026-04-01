---
name: add-upstream-api
description: 新增或修改上游 API 对接。当需要接入新模型、扩展现有端点参数、调试上游调用、或理解上游 API 行为时使用此 skill。
---

# Add Upstream API

## 设计原则

- **C 端站，不是 API 站** — 只暴露对终端用户有用的参数，不暴露内部/安全参数（如 nsfw_checker、callBackUrl）
- **合并端点** — 同一模型的多个上游端点合并为我们的一个端点，通过参数区分
- **API 响应绝不暴露上游提供商名称、taskId、成本等内部信息**

## 工作流程

### 1. 调研

1. 读 [providers.md](../../../reference/providers.md) 了解目标提供商的接入方式
2. 读该提供商已有的 adapter（`src/worker/providers/`）和 API Route

### 2. 设计对齐（必须）

读完上游文档后，**先向用户汇报设计方案再动手**：
- 上游提供了哪些参数/能力
- 我们打算暴露哪些、过滤哪些、如何命名映射
- 多个上游端点如何合并

### 3. 实现

**在已有提供商上新增 API：**
1. 新增或修改 API Route（`src/app/api/agent/models/{model}/route.ts`）
2. 在 `src/lib/api-capabilities.ts` 声明能力

**接入新提供商（额外步骤）：**
1. 在 `src/worker/providers/` 新建 adapter
2. 在 `src/worker/registry.ts` 注册，更新 `src/worker/types.ts` 的 `ProviderName`
3. 在 `src/lib/sanitize-error.ts` 的提供商列表中添加新名称

## 职责分层

- **API Route**：组装请求参数，过滤掉用户不需要的上游参数
- **Adapter（submit/poll）**：通用的提交和轮询逻辑
- **Worker**：状态轮询和结果更新

## 提供商

各提供商的注册信息见 [providers.md](../../../reference/providers.md)。
