/** Severity of a pattern hit. */
export type PatternSeverity = "warn" | "fail";

/** A single flagged issue in the text. */
export type PatternHit = {
  id: string;
  label: string;
  severity: PatternSeverity;
  message: string;
  excerpt: string;
  humanizeHint: string;
};

/** Result from the AI content checker API. */
export type CheckResult = {
  patternScore: number;
  naturalnessLabel: string;
  language: string;
  wordCount: number;
  hits: PatternHit[];
  createdAt: string;
  sourceText: string;
  mode: "general" | "academic";
};

/** Input parameters for the check_ai_content tool. */
export type CheckInput = {
  text: string;
  mode?: "general" | "academic";
};

/** Raw response shape from the Naturalmelo public API. */
export type CheckApiResponse = CheckResult & {
  share?: unknown;
  error?: string;
};
