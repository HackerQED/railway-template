#!/bin/bash
set -e

echo "🔍 检查分支..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ 当前在 $CURRENT_BRANCH 分支，必须在 main 分支上才能发版"
  exit 1
fi

echo "🔍 同步远程 main..."
git fetch origin main
LOCAL=$(git rev-parse main)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" != "$REMOTE" ]; then
  echo "❌ 本地 main ($LOCAL) 和远程 main ($REMOTE) 不一致"
  echo "   请先 git pull 或 git push 同步"
  exit 1
fi

echo "🔍 检查工作区状态..."
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ 工作区有未提交的改动，请先提交再发版"
  exit 1
fi

echo "📦 运行 build 检查..."
pnpm build
echo "✅ Build 通过"

echo "🚀 开始发版..."
git checkout production
git merge --ff-only main
git push origin production
git checkout "$CURRENT_BRANCH"

echo "✅ 发版完成！production 已更新并推送"
