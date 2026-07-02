import type { CheckerMode, PatternHit, PatternSeverity } from "../types.js";
import { inputHash, deriveSeed } from "./hash.js";

// ── Prompt builder ─────────────────────────────────────────────────────

function buildPrompt(text: string, language: string, mode: CheckerMode): string {
  const modeGuidance =
    mode === "academic"
      ? `## Content type: academic / scholarly writing
- Formal vocabulary and standard research structure are NORMAL — do not flag them.
- Focus on: hollow generalizations without data, mechanical section-filling, generic summaries.
- Ignore in-text citations and reference sections.`
      : `## Content type: general writing (blog, marketing, article)
- Flag: generic openings, hollow claims, stacked transitions, hype adjectives.
- Polished grammar alone is NOT an AI signal — look for template-like emptiness.`;

  return `You analyze text for AI-template tone issues. Do NOT claim authorship detection.
Return strict JSON only (no markdown):

{
  "patternScore": <integer 0-100, higher = more AI-template>,
  "hits": [
    {
      "id": "L01",
      "label": "<short issue name in the input's language>",
      "severity": "warn" | "fail",
      "message": "<one sentence, same language as input>",
      "excerpt": "<exact verbatim quote from input, max 120 chars>",
      "humanizeHint": "<actionable revision goal, same language as input>"
    }
  ]
}

Return 3-8 hits. If none, return empty hits array.
Excerpts MUST be exact substrings of the input — copy-paste, not paraphrase.

${modeGuidance}

## Text to analyze
${text}`;
}

// ── Response parsing ───────────────────────────────────────────────────

type LlmHitRaw = {
  id?: string;
  label?: string;
  severity?: string;
  message?: string;
  excerpt?: string;
  humanizeHint?: string;
};

type LlmResponse = {
  patternScore?: number;
  hits?: LlmHitRaw[];
};

function parseLlmJson(raw: string): LlmResponse {
  // Direct JSON
  try { return JSON.parse(raw.trim()) as LlmResponse; } catch { /* fall through */ }

  // Code fence
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    try { return JSON.parse(fence[1]!.trim()) as LlmResponse; } catch { /* fall through */ }
  }

  // Loose JSON object
  const obj = raw.match(/\{[\s\S]*\}/);
  if (obj) {
    try { return JSON.parse(obj[0]) as LlmResponse; } catch { /* fall through */ }
  }

  throw new Error("Failed to parse LLM response");
}

function clampScore(v: unknown): number {
  if (typeof v !== "number" || Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

// ── LLM scan ───────────────────────────────────────────────────────────

type LlmScanResult = {
  patternScore: number;
  hits: PatternHit[];
};

export async function scanWithLlm(
  text: string,
  mode: CheckerMode,
): Promise<LlmScanResult | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const baseUrl = process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: buildPrompt(text, "en", mode) }],
        max_tokens: 1800,
        temperature: 0.1,
        seed: deriveSeed(text),
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error(`[llm-scanner] API error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;

    const parsed = parseLlmJson(raw);
    const patternScore = clampScore(parsed.patternScore);
    const hits = sanitizeHits(parsed.hits, text);

    return { patternScore, hits };
  } catch (error) {
    console.error("[llm-scanner] scan failed:", error);
    return null;
  }
}

function sanitizeHits(rawHits: unknown, sourceText: string): PatternHit[] {
  if (!Array.isArray(rawHits)) return [];
  const hits: PatternHit[] = [];

  for (let i = 0; i < rawHits.length && hits.length < 8; i++) {
    const row = rawHits[i] as LlmHitRaw;
    const label = typeof row.label === "string" ? row.label.trim() : "";
    const message = typeof row.message === "string" ? row.message.trim() : "";
    if (!label || !message) continue;

    const rawExcerpt = typeof row.excerpt === "string" ? row.excerpt.trim() : "";
    const excerpt = sourceText.includes(rawExcerpt) ? rawExcerpt : "";
    if (!excerpt) continue;

    hits.push({
      id: typeof row.id === "string" && row.id.trim() ? row.id.trim() : `L${String(i + 1).padStart(2, "0")}`,
      label,
      severity: row.severity === "fail" ? "fail" : "warn",
      message,
      excerpt,
      humanizeHint:
        typeof row.humanizeHint === "string" && row.humanizeHint.trim()
          ? row.humanizeHint.trim()
          : "Rewrite to sound more natural.",
    });
  }

  return hits;
}

// ── Merge ──────────────────────────────────────────────────────────────

function maxSeverity(a: PatternSeverity, b: PatternSeverity): PatternSeverity {
  return a === "fail" || b === "fail" ? "fail" : "warn";
}

function normForOverlap(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function excerptsOverlap(a: string, b: string): boolean {
  const na = normForOverlap(a);
  const nb = normForOverlap(b);
  if (!na || !nb) return false;
  if (na.includes(nb) || nb.includes(na)) return true;
  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length <= nb.length ? nb : na;
  const probe = shorter.slice(0, Math.min(40, shorter.length));
  return probe.length >= 12 && longer.includes(probe);
}

export function mergeResults(
  llm: LlmScanResult,
  rules: { patternScore: number; hits: PatternHit[] },
): { patternScore: number; hits: PatternHit[] } {
  const hits: PatternHit[] = llm.hits.map((h) => ({ ...h }));

  for (const ruleHit of rules.hits) {
    const sameId = hits.findIndex((h) => h.id === ruleHit.id);
    if (sameId >= 0) {
      hits[sameId]!.severity = maxSeverity(hits[sameId]!.severity, ruleHit.severity);
      continue;
    }

    let merged = false;
    for (let i = 0; i < hits.length; i++) {
      if (hits[i]!.excerpt && ruleHit.excerpt && excerptsOverlap(hits[i]!.excerpt, ruleHit.excerpt)) {
        hits[i]!.severity = maxSeverity(hits[i]!.severity, ruleHit.severity);
        merged = true;
        break;
      }
    }
    if (!merged) hits.push(ruleHit);
  }

  const patternScore = Math.min(100, Math.round(llm.patternScore * 0.4 + rules.patternScore * 0.6));

  return { patternScore, hits: hits.slice(0, 16) };
}
