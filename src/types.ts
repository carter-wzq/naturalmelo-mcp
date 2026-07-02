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

/** Analysis mode. */
export type CheckerMode = "general" | "academic";

/** Full result from the checker. */
export type CheckResult = {
  patternScore: number;
  naturalnessLabel: string;
  language: string;
  wordCount: number;
  hits: PatternHit[];
  createdAt: string;
};

/** Input for the check_ai_content tool. */
export type CheckInput = {
  text: string;
  mode?: CheckerMode;
};
