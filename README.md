# check-ai-content-mcp

Lightweight MCP server for AI content detection — calls the [Naturalmelo](https://www.naturalmelo.com) public API to analyze text for AI-generated patterns.

One tool only:

**`check_ai_content`**

## What it returns

- **patternScore** (0–100) — higher = more AI-template patterns
- **naturalnessLabel** — human-readable score tier ("Mostly natural" → "Strong AI writing signals")
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

No API key required — uses the free Naturalmelo public endpoint.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CHECKER_API_BASE_URL` | `https://www.naturalmelo.com` | Override for self-hosted or local dev |

## MCP Config Example

```json
{
  "mcpServers": {
    "check-ai-content-mcp": {
      "command": "node",
      "args": ["<ABSOLUTE_PATH>/check-ai-content-mcp/dist/index.js"],
      "env": {
        "CHECKER_API_BASE_URL": "https://www.naturalmelo.com"
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
- `mode` (optional) — `"general"` (default) or `"academic"` (scholarly writing, skips formal-vocab / hedging flags)

## Notes

- Public API enforces a daily rate limit per IP address.
- 429 responses include a `Retry-After` header — the tool translates it into a human-readable message.
- Academic mode treats formal vocabulary, hedging, and citations as normal — it focuses on templated structure and shallow content.
- Never commit `CHECKER_API_BASE_URL` with secrets into git.
