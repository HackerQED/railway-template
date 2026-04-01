import { CAPABILITIES } from '@/lib/api-capabilities';

export async function GET() {
  const models = CAPABILITIES.filter((c) => c.kind === 'model');
  const tools = CAPABILITIES.filter((c) => c.kind === 'tool');

  const modelList = models
    .map(
      (c) =>
        `- [${c.name}](${c.doc}): ${c.summary} → \`${c.method} ${c.endpoint}\``
    )
    .join('\n');

  const toolList = tools
    .map(
      (c) =>
        `- [${c.name}](${c.doc}): ${c.summary} → \`${c.method} ${c.endpoint}\``
    )
    .join('\n');

  const text = `# yino.ai Media API

> Agent-friendly media generation API. Generate images, generate videos,
> and manage media projects programmatically.

## API Discovery

- [Capabilities](/api/agent/capabilities): List all available capabilities (JSON)
- Each capability has a \`doc\` field linking to its raw Markdown documentation

## Models

Each model has its own endpoint. Supports single and batch submission.

${modelList}

## Tools

${toolList}

## Authentication

All model and tool endpoints require:
- \`Authorization: Bearer <api-key>\` header (recommended for agents)
- Or session cookie (for browser-based access)

Discovery endpoints (this file, /api/agent/capabilities) are public.

## Quick Start

1. \`GET /api/agent/capabilities\` — see what's available
2. Read the doc for the capability you need (follow the \`doc\` link — returns raw Markdown)
3. Call the endpoint with your API key

## Agent Integration

Install the yino.ai skill:

\`\`\`
npx clawhub@latest install yino-ai
\`\`\`

This works with Claude Code, OpenClaw, Codex, and any agent that supports AgentSkills.
`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
