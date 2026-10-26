# naturalmelo-mcp

Lightweight MCP server for AI content detection — detects AI-template patterns in text.

One tool only:

**`check_ai_content`**

## How it works

1. **Rule-based scan** (always runs, no API key needed) — 5 built-in pattern rules covering generic openings, hollow claims, filler transitions, stacked connectors, and marketing hype.
2. **LLM scan** (optional, BYOK) — if `OPENAI_API_KEY` is set, a second pass with GPT-4o-mini catches subtler patterns and merges results with the rule scan.

## What it returns

- **patternScore** (0–100) — higher = more AI-template patterns
- **naturalnessLabel** — human-readable tier ("Mostly natural" → "Strong AI writing signals")
- **hits** — list of flagged issues, each with:
  - `id`, `label`, `severity` (warn / fail)
  - `message` — what's wrong
  - `excerpt` — the exact text flagged
  - `humanizeHint` — how to rewrite it
- **language**, **wordCount**, **createdAt**

## Quick Start

```bash
npm install
npm run build
```

Works out of the box with zero configuration (rule-based scan only).
Add `OPENAI_API_KEY` for better accuracy.

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | No | — | Your OpenAI API key. Without it, only rule-based scan runs. |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | Custom OpenAI-compatible endpoint. |
| `OPENAI_MODEL` | No | `gpt-6-luna` | Model override. |

## MCP Config Example

```json
{
  "mcpServers": {
    "naturalmelo-mcp": {
      "command": "node",
      "args": ["<ABSOLUTE_PATH>/naturalmelo-mcp/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-key-here"
      }
    }
  }
}
```

## Tool Input

```json
{
  "text": "In today's rapidly evolving digital landscape, AI has become essential...",
  "mode": "general"
}
```

- `text` (required) — minimum 20 characters
- `mode` (optional) — `"general"` (default) or `"academic"`

## Notes

- Rule-based scan runs locally — no network calls, no API keys.
- LLM scan uses your own OpenAI key (BYOK) — you control usage and billing.
- Academic mode skips connector-stacking and hype-flagging rules.
- Never commit `.env` or API keys into git.
