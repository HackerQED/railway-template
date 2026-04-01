# Provider 注册表

## KIE (kie.ai)

AI 模型 API 代理平台。

**认证**: Bearer Token — 环境变量 `KIE_API_KEY`
**文档站**: https://docs.kie.ai

### 如何获取端点文档

文档站对 Agent 自动检索不友好——导航无法程序化发现，URL 路径规则不一致。**不要猜测文档 URL**，让用户提供具体链接后用 WebFetch 抓取。

已知的文档链接：

- Seedream 4.5 文生图: https://docs.kie.ai/market/seedream/4-5-text-to-image
- Seedream 4.5 图片编辑: https://docs.kie.ai/market/seedream/4-5-edit
- Veo 视频生成: https://docs.kie.ai/veo3-api/generate-veo-3-video

### KIE 通用模式

大部分 KIE 端点遵循统一模式：`POST /api/v1/jobs/createTask`，请求体嵌套在 `input` 对象里，轮询用 `GET /api/v1/jobs/recordInfo?taskId={taskId}`。

**Veo 是例外**——它有独立的 endpoint（`/api/v1/veo/generate`）、独立的轮询路径（`/api/v1/veo/record-info`），请求体是扁平的（不嵌套 `input`），字段命名风格也不同（`imageUrls` vs `image_urls`）。对接 Veo 时不要套用 Seedream 的模式。

## WaveSpeed (wavespeed.ai)

AI 模型 API 平台，提供即时视频生成（无排队）。

**认证**: Bearer Token — 环境变量 `WAVESPEED_API_KEY`
**Base URL**: `https://api.wavespeed.ai/api/v3`
**文档站**: https://wavespeed.ai/docs

### WaveSpeed 通用模式

提交：`POST /api/v3/{model}`，请求体扁平（不嵌套）。
轮询：`GET /api/v3/predictions/{requestId}/result`。

响应格式统一：`{ code: 200, message: "success", data: { id, status, outputs, ... } }`。
状态流转：`created` → `processing` → `completed` / `failed`。

### 已接入端点

- Seedance 2.0 Express（Cinematic Video Generator）: `wavespeed-ai/cinematic-video-generator`
  - 参数: prompt, images (max 4), aspect_ratio (16:9/9:16/4:3/3:4), duration (5/10/15)
  - 定价: $0.80 per 5s
