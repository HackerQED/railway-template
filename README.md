# Railway Template

AI 媒体生成 SaaS 模板。复制一份，改品牌和配置，就能开出一个新的生成站。

## 快速开始

```bash
pnpm install
cp env.example .env   # 填入你的配置
pnpm db:push          # 同步 schema 到数据库
pnpm db:seed          # 创建测试账号
pnpm dev              # 启动开发服务器
```

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js (App Router) |
| 前端 | React + TailwindCSS + Radix UI |
| 数据库 | PostgreSQL + Drizzle ORM |
| 认证 | Better Auth (Google OAuth + 开发环境 Email/Password) |
| 支付 | Stripe（订阅 + 一次性 + 积分） |
| 存储 | S3 (Cloudflare R2) |
| 部署 | Railway + Docker |
| 代码质量 | Biome |

## 自定义清单

新站需要修改的关键位置：

| 文件 | 修改什么 |
|------|---------|
| `messages/en/common.json` → `Metadata` | 站点名称和描述 |
| `src/config/website.tsx` | 邮箱、支付、功能开关 |
| `src/config/models.ts` | 模型列表和定价 |
| `src/lib/auth.ts` → `trustedOrigins` | 生产域名 |
| `env.example` / `.env` | 所有环境变量 |
| `public/logo.png`, `public/og.png` | 品牌图标 |
| `content/pages/` | 隐私政策、服务条款 |

## 目录结构

```
src/
├── app/               # Next.js 路由（含 [locale]）
│   └── api/           # API Routes
│       ├── models/    # 生成模型端点（每模型一个）
│       ├── generations/ # 生成记录查询
│       ├── upload/    # 文件上传
│       ├── auth/      # Better Auth
│       ├── webhooks/  # Stripe webhooks
│       └── ...
├── config/            # 应用配置（website.tsx = 功能总开关，models.ts = 模型注册）
├── db/                # Schema + 迁移
├── worker/            # 异步生成任务轮询
├── credits/           # 积分系统
├── payment/           # Stripe 集成
└── ...
```

## 开发命令

```bash
pnpm dev              # 开发服务器
pnpm dev:all          # 开发服务器 + Worker
pnpm build            # 构建
pnpm lint             # Biome 检查
pnpm db:generate      # 生成迁移
pnpm db:migrate       # 应用迁移
pnpm db:push          # 同步 schema（仅 dev）
pnpm db:seed          # 种植测试账号
pnpm worker           # 启动异步 Worker
```
