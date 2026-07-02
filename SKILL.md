# AI Content Checker MCP Skill

## What it does

Analyzes text for AI-generated template patterns using built-in rules (no API key needed).
Optionally runs an LLM pass with your own OpenAI key for better accuracy.

## Use when

- You need to check whether text sounds AI-generated.
- You want specific revision hints to make text more natural.

## Input

- `text` (required) — minimum 20 characters
- `mode` (optional: `general` | `academic`)

## Output

- `patternScore: number` — 0 = natural, 100 = heavy AI-template
- `naturalnessLabel: string`
- `hits: { id, label, severity, message, excerpt, humanizeHint }[]`
- `language: string`, `wordCount: number`, `createdAt: string`

## Requirements

- No API key required (rule-based scan works offline).
- Set `OPENAI_API_KEY` for LLM-powered analysis.
