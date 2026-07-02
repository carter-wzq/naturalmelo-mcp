# AI Content Checker MCP Skill

## What it does

Analyzes text for AI-generated patterns and returns:
- a 0–100 naturalness score
- a list of flagged issues with excerpts and humanizing hints

## Use when

- You need to check whether a piece of text sounds AI-generated.
- You want specific revision hints to make text more natural.

## Input

- `text` (required)
- `mode` (optional: `general` | `academic`)

## Output

- `patternScore: number` — 0 = natural, 100 = heavy AI-template
- `naturalnessLabel: string`
- `hits: { id, label, severity, message, excerpt, humanizeHint }[]`
- `language: string`, `wordCount: number`, `createdAt: string`

## Requirements

No API key required. Calls the Naturalmelo public API.
