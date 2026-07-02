import { z } from "zod";
import { checkContent, CheckerApiError } from "../lib/api.js";
import type { CheckResult } from "../types.js";

const inputSchema = z.object({
  text: z.string().min(20, "Text must be at least 20 characters."),
  mode: z.enum(["general", "academic"]).optional(),
});

export async function checkAiContent(rawInput: unknown): Promise<CheckResult> {
  const parsed = inputSchema.parse(rawInput);

  try {
    return await checkContent(parsed);
  } catch (error) {
    if (error instanceof CheckerApiError) {
      if (error.status === 429) {
        const waitMin = error.retryAfterSec
          ? Math.ceil(error.retryAfterSec / 60)
          : "a few";
        throw new Error(
          `Daily limit reached. Retry in about ${waitMin} minute(s). (${error.message})`,
        );
      }
      throw new Error(`API error (${error.status}): ${error.message}`);
    }
    throw error;
  }
}
