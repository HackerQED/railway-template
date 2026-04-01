#!/usr/bin/env bash
# set -x             # for debug
set -euo pipefail  # fail early

##############################################
# Don't run. This file is a note for commands.
##############################################

# =============================================================================
# 生产数据库操作
# =============================================================================

# 查看生产库表
psql "$PROD_DB" -c "\dt"

# 查看迁移记录
psql "$PROD_DB" -c "SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at;"

# 对生产库跑迁移
DATABASE_URL="$PROD_DB" pnpm db:migrate

# 对生产库打开 Drizzle Studio
DATABASE_URL="$PROD_DB" pnpm db:studio

# =============================================================================
# Stripe 本地开发
# =============================================================================

# 转发 Stripe webhook 到本地（开发时需要在另一个终端跑）
stripe listen --forward-to localhost:3000/api/webhooks/stripe
