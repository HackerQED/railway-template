# CLAUDE.md — yino.ai 项目指导 + AI 自验证约定

## Git 工作流

- **main 分支禁止直推**，所有变更通过 PR 合入
- 开发功能时，如果当前没有工作分支，先切一个新分支再开始

## 语言约定

- **默认用中文回复**，包括代码注释以外的所有交互
- **Git commit message 用中文**
- **PR 标题和描述用中文**
- 代码中的一切保持英文，包括变量名、函数名等

## 快速参考

```bash
pnpm dev          # 启动开发服务器 (localhost:3000)
pnpm build        # 构建
pnpm lint         # Biome 检查
pnpm format       # 格式化
pnpm db:push      # 同步 schema 到数据库（仅 dev）
pnpm db:generate  # 生成迁移文件
pnpm db:migrate   # 应用迁移
pnpm db:studio    # Drizzle Studio
pnpm db:seed      # 种植测试账号（幂等，可重复跑）
```

## 环境启动（懒加载策略）

默认假设环境已经在跑。从最后一步开始试，失败了再往前补。

1. **先尝试 health check** → `curl -s http://localhost:3000/api/health | python3 -m json.tool` → `status: "healthy"` 就直接用
2. health 失败 → **尝试登录** → `curl` sign-in（见下方"验证方式"）→ 成功就用
3. 登录失败 → **跑 seed** → `pnpm db:seed`，再试登录
4. seed 失败 → **启动 dev server** → `pnpm dev`，再从 seed 开始
5. dev server 报数据库错误 → **同步 schema** → `pnpm db:push`，再从 dev 开始
6. push 连不上数据库 → **起数据库**（见下方"数据库启动"），再从 push 开始

### 数据库启动

**本地 / WSL（有 Docker）：**
```bash
docker compose up -d    # PostgreSQL 16, 端口 5432
```
连接串：`postgresql://postgres:password@localhost:5432/mksaas`

**Claude Code Web 沙箱（无 Docker）：**
```bash
pg_ctlcluster 16 main start
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'password';"
sudo -u postgres psql -c "CREATE DATABASE mksaas OWNER postgres;"
```

**判断方法：** `docker compose up -d` 失败 → 回退到系统 PostgreSQL。

### 环境变量

复制 `env.example` 为 `.env`。**最小可用配置：**

```
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
DATABASE_URL="postgresql://postgres:password@localhost:5432/mksaas"
BETTER_AUTH_SECRET="随便一个字符串-仅dev用"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Google OAuth 凭证为空时，auth 初始化可能报错 — dev 环境用 email/password 登录（需确认 `enableCredentialLogin` 已开启）。

**沙箱环境变量注入：**
1. Web UI 环境配置（推荐，凭证不落盘）
2. `.claude/settings.json` 的 `env` 字段
3. SessionStart Hook 写入 `$CLAUDE_ENV_FILE`

## AI 验证策略

**原则：能自动验证的自动验证，复杂端到端交给人。**

- **单个 API 调用**（如 health check、CRUD 接口）：AI 可以通过 curl 自行验证
- **单个页面渲染**（如组件是否报错、snapshot 检查）：AI 可以通过 Playwright 自行验证
- **复杂端到端 UI 流程**：交给人手动验证，AI 只确保 TypeScript 编译通过即可

## AI 验证方式

### 健康检查（快速验证环境就绪）
```bash
curl -s http://localhost:3000/api/health | python3 -m json.tool
```
返回 DB 连通性、seed 数据状态。`status: "healthy"` = 一切正常。

### 测试登录（拿 session cookie）
```bash
curl -c /tmp/yino-cookies.txt -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"email":"test@yino.dev","password":"test-password-123"}'
```
测试账号定义在 `seed.ts`，是唯一事实来源。

### 访问受保护端点
```bash
# 验证 session 有效
curl -b /tmp/yino-cookies.txt http://localhost:3000/api/auth/get-session

# 实验 API（返回当前用户 + 环境信息）
curl -b /tmp/yino-cookies.txt http://localhost:3000/api/lab

# 无 cookie 应返回 401
curl http://localhost:3000/api/lab
```

### UI 验证（Playwright MCP）

> **⚠️ Claude Code Web 沙箱不要使用 Playwright**，当前兼容性有问题。沙箱环境下跳过 UI 验证，仅通过 curl API 验证。

**本地 / WSL：**
```bash
claude mcp add playwright -- npx @playwright/mcp@latest --headless --no-sandbox --caps vision
```

MCP 模式下浏览器会话持久。通过页面内 fetch 登录（无需一键登录按钮）：
1. `browser_navigate('http://localhost:3000')`
2. `browser_evaluate` 执行：`await fetch('/api/auth/sign-in/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'test@yino.dev', password: 'test-password-123' }) })`
3. 登录后浏览器保持 cookie，可直接导航到受保护页面（如 `/gallery`）
4. `browser_snapshot` 验证功能，`browser_take_screenshot` 验证视觉


## 实验仓库

技术验证和竞品研究在独立仓库完成：

- **本地路径**: `/home/hackerqed/workspace/cc-music-video-playground`
- **GitHub**: `https://github.com/HackerQED/cc-music-video-playground`

Skills 实验、竞品分析等放这里，不要放到主仓库。实验结论迁移到主仓库 `notes/` 目录落地。

## 项目架构

Next.js 全栈 SaaS 应用。包管理器：pnpm。业务详情（产品愿景、战略思考等）见 `README.md`。

### 技术栈
- **框架**: Next.js (App Router)
- **数据库**: PostgreSQL + Drizzle ORM
- **认证**: Better Auth (Google OAuth + 开发环境 Email/Password)
- **支付**: Stripe (订阅 + 一次性支付)
- **UI**: Radix UI + TailwindCSS
- **状态管理**: Zustand
- **国际化**: next-intl (当前仅英语)
- **代码质量**: Biome

### 目录结构
```
src/
├── app/               # Next.js 路由（含 [locale]）
│   └── api/           # API Routes
│       ├── auth/      # Better Auth handler
│       ├── health/    # 环境健康检查
│       ├── lab/       # 实验 API（AI 验证用，仅 dev）
│       ├── ping/      # 存活检测
│       ├── storage/   # S3 文件上传
│       └── webhooks/  # Stripe webhooks
├── components/        # 可复用组件（按功能组织）
├── lib/               # 工具函数和共享代码
├── db/                # Schema（schema.ts）和迁移（migrations/）
├── actions/           # Server Actions
├── stores/            # Zustand 状态
├── hooks/             # 自定义 Hooks
├── config/            # 应用配置（website.tsx = 功能总开关）
├── i18n/              # 国际化
├── mail/              # 邮件模板（Resend）
├── payment/           # Stripe 集成
└── credits/           # 积分系统
```

### 认证系统
- Better Auth + PostgreSQL 适配器
- **生产环境**：仅 Google OAuth + One Tap
- **开发/测试环境**：额外开放 email/password（`website.tsx` → `auth.enableCredentialLogin`）
- email 登录需要邮件验证 — dev 环境通过 seed 脚本预设 `emailVerified: true` 绕过
- 插件：admin（用户管理/封禁）、emailHarmony（邮件标准化）、oneTap
- better-auth 要求请求带 `Origin` header，裸 curl 不带会被拒

### 支付系统
- Stripe（订阅 + 一次性支付）
- 三层定价：Free、Basic、Pro
- 积分系统（注册赠送 + 月度免费 + 按量购买）

### 数据库
- Schema：`src/db/schema.ts`
- 表：user, session, account, verification, payment, userCredit, creditTransaction
- 连接：`src/db/index.ts`（单例 + `prepare: false`）

## 开发规范

1. TypeScript 必须
2. Biome 格式（单引号、尾随逗号）
3. Server Actions → `src/actions/`
4. 客户端状态 → Zustand
5. 数据库变更 → Drizzle 迁移
6. UI 组件 → Radix UI
7. 表单提交 → `next-safe-action` + Zod 验证
8. 错误处理 → `error.tsx` + `not-found.tsx`
9. 路径别名：`@/*` → `src/*`
10. **不泄露上游提供商信息**：API 响应不暴露上游服务提供商名称、任务 ID、成本等内部信息

### 关键配置文件
- **功能总开关**: `src/config/website.tsx`
- **环境变量模板**: `env.example`
- **数据库**: `drizzle.config.ts`
- **代码规范**: `biome.json`

## 云部署注意

- **部署平台**: Railway（不是 Cloudflare Workers）
- Docker Compose 仅用于本地开发，生产用托管 PostgreSQL
- 环境变量通过 Railway 平台注入（不走 .env 文件）
- `NEXT_PUBLIC_BASE_URL` 需设为实际域名
- Google OAuth 回调 URL 需在 Google Console 更新
- Stripe webhook endpoint 需更新为生产 URL

## 踩坑记录

- seed 脚本需要 `--env-file=.env`（tsx 不像 Next.js 自动加载 .env）
- better-auth 要求 `Origin` header，curl 必须加 `-H "Origin: http://localhost:3000"`
- Google OAuth 凭证为空时 socialProviders 初始化可能报错，需条件注册
- Claude Code Web 沙箱无 Docker daemon，但预装 PostgreSQL 16
- Claude Code Web 沙箱 Playwright 兼容性有问题，不要在沙箱中使用 Playwright，改用 curl API 验证
- `websiteConfig.auth.enableCredentialLogin` 控制 email 登录开关，dev 环境验证前需确认已开启
