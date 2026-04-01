FROM ghcr.io/openclaw/openclaw:latest

# Bake config and skills into the image (no persistent volumes needed)
COPY config/openclaw.json /home/node/.openclaw/openclaw.json
COPY workspace/skills/ /home/node/.openclaw/workspace/skills/

EXPOSE 18789

CMD ["node", "dist/index.js", "gateway", "--bind", "lan", "--port", "18789", "--allow-unconfigured"]
