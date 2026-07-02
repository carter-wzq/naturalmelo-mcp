import { z } from "zod";
import type { CheckInput, CheckResult } from "../types.js";
import { scanPatterns } from "../lib/pattern-scanner.js";
import { scanWithLlm, mergeResults } from "../lib/llm-scanner.js";

const inputSchema = z.object({
  text: z.string().min(20, "Text must be at least 20 characters."),
  mode: z.enum(["general", "academic"]).optional(),
});

export async function checkAiContent(rawInput: unknown): Promise<CheckResult> {
  const parsed = inputSchema.parse(rawInput) as CheckInput;
  const mode = parsed.mode ?? "general";

  // 1. Always run rule-based scanner
  const ruleResult = scanPatterns(parsed.text, mode);

  // 2. Optionally run LLM scan (BYOK)
  const llmResult = await scanWithLlm(parsed.text, mode);

  if (llmResult) {
    const merged = mergeResults(llmResult, ruleResult);
    return {
      patternScore: merged.patternScore,
      naturalnessLabel: ruleResult.naturalnessLabel,
      language: ruleResult.language,
      wordCount: ruleResult.wordCount,
      hits: merged.hits,
      createdAt: ruleResult.createdAt,
    };
  }

  return ruleResult;
}
