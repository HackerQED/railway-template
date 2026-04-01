# /generations 页面设计与实现方案

## 概览

将 sidebar "Creation History" 从 `/gallery`（demo 页面）迁移到 `/generations`，展示用户真实的 AI 生成记录。

## 设计决策

- 展示形式：**表格**
- 详情交互：**右侧抽屉（Sheet）**
- Gallery 处理：**直接删除**

## 页面结构

### 头部
- 标题：Creation History
- 副标题：View and manage all your AI generations

### 筛选栏
- 搜索框（按 prompt 搜索）
- Model 下拉（All Models / Seedream 4.5 / Veo 3.1，动态从 MODELS 配置生成）
- Status 下拉（All / Pending / Processing / Done / Failed）

### 表格列
| 列 | 数据来源 | 说明 |
|---|---|---|
| Output | output.url / output.urls[0] | 缩略图，done 时显示，否则占位 |
| Model | provider → MODELS_MAP 映射 | 显示模型名 |
| Prompt | input.prompt | 截断到 ~80 字符 |
| Status | status | 彩色 badge |
| Created | createdAt | 相对时间 |
| Actions | - | 下载按钮（done 时）|

### 抽屉（Sheet）
点击表格行打开右侧 Sheet，显示：
- 大图/视频预览
- 完整 prompt
- 生成参数（aspect_ratio, quality 等）
- 状态 + 时间信息
- 下载按钮
- 关联 Project 链接（如有）
- 错误信息（failed 时）

### 空状态
"No generations yet. Use the model pages or Agent API to create your first generation."

### 分页
使用 cursor-based 分页 + "Load More" 按钮，每页 20 条

## 实现步骤

### 1. 路由与配置变更
- `routes.ts`: 添加 `Generations = '/generations'`，更新 `DashboardEntry`，删除 `ToolsGallery`
- `sidebar-config.tsx`: Creation History 指向 `/generations`
- 删除 `/gallery` 路由目录

### 2. API 端点
- `GET /api/generations` — 查询当前用户的 generations
  - Query: `?cursor=xxx&limit=20&model=seedream-4-5&status=done&search=cat`
  - 返回: `{ items: Generation[], nextCursor: string | null }`
  - 需要 session 认证

### 3. 页面组件
- `src/app/[locale]/(dashboard)/(protected)/generations/page.tsx` — Server Component，认证 + 初始数据
- `src/app/[locale]/(dashboard)/(protected)/generations/generations-table.tsx` — Client Component，表格 + 筛选 + 分页
- `src/app/[locale]/(dashboard)/(protected)/generations/generation-detail-sheet.tsx` — 抽屉组件

### 4. 清理
- 删除 `src/app/[locale]/(dashboard)/gallery/` 目录
- 清理相关 i18n 翻译引用（保留 key 但可不急删）
