#!/bin/sh
set -e

# Start worker in background with auto-restart
echo "[worker] Starting worker with auto-restart..."
(
  while true; do
    echo "[worker] Launching worker process..."
    npx tsx src/worker/index.ts || true
    echo "[worker] Worker exited, restarting in 5s..."
    sleep 5
  done
) &

# Start Next.js server
echo "[entrypoint] Starting Next.js server..."
exec npx next start
