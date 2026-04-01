# OpenClaw Demo Instance

Yino.ai 的共享 AI Agent 体验实例。

## 本地开发

```bash
# 启动（从项目根目录）
docker compose -f openclaw/docker-compose.yml up -d

# 健康检查
curl http://localhost:18789/healthz

# 测试聊天 API
curl -sS http://localhost:18789/v1/chat/completions \
  -H 'Authorization: Bearer dev-openclaw-token' \
  -H 'Content-Type: application/json' \
  -d '{"model":"openclaw:main","stream":false,"messages":[{"role":"user","content":"Hello"}]}'

# 停止
docker compose -f openclaw/docker-compose.yml down
```

## 生产部署

独立 Railway service，与 yino.ai 主项目完全网络隔离。详见 `notes/260321-2-OpenClaw-共享-Demo-方案.md`。
