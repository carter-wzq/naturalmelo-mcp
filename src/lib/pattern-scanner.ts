import type { PatternHit, PatternSeverity, CheckerMode } from "../types.js";
import {
  R01_EN, R01_ZH,
  R02_EN, R02_ZH,
  R03_EN, R03_ZH,
  R04_EN, R04_ZH,
  R05_EN, R05_ZH,
} from "./lexicon.js";
import {
  countPhraseMatches,
  countRegexMatches,
  findFirstPhraseMatch,
  findStackedConnectorsMatch,
  wordCount,
} from "./text-utils.js";

// ── Excerpt helpers ────────────────────────────────────────────────────

function verbatimExcerpt(text: string, index: number, length: number): string {
  const slice = text.slice(index, index + length);
  return slice.length <= 160 ? slice : `${slice.slice(0, 157)}…`;
}

function verbatimSliceAround(text: string, index: number, radius = 80): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return verbatimExcerpt(text, start, end - start);
}

// ── Scoring ────────────────────────────────────────────────────────────

const WEIGHT_HIGH = 12; // opening / importance patterns
const WEIGHT_MED = 8;   // transitions / connectors
const WEIGHT_LOW = 6;   // vocabulary / hype

function bump(score: number, weight: number, severity: PatternSeverity): number {
  return score + weight * (severity === "fail" ? 2 : 1);
}

function naturalnessLabel(score: number): string {
  if (score <= 20) return "Mostly natural";
  if (score <= 45) return "Some AI writing signals";
  if (score <= 70) return "Noticeably AI-templated";
  return "Strong AI writing signals";
}

type ScanResult = {
  patternScore: number;
  naturalnessLabel: string;
  language: string;
  wordCount: number;
  hits: PatternHit[];
  createdAt: string;
};

// ── Main scanner ───────────────────────────────────────────────────────

export function scanPatterns(text: string, mode: CheckerMode = "general"): ScanResult & { language: "zh" | "en" } {
  const plain = text.trim();
  const language = detectLanguageHeuristic(plain);
  const isZh = language === "zh";
  const isAcademic = mode === "academic";
  const wc = Math.max(wordCount(plain, isZh), 1);
  const hits: PatternHit[] = [];
  let score = 0;

  // ── R01: Generic grand opening ───────────────────────────────────────
  const r01Patterns = isZh ? R01_ZH : R01_EN;
  const r01 = countRegexMatches(plain, r01Patterns);
  if (r01 > 0) {
    const firstPara = plain.split(/\n\s*\n/)[0] ?? plain;
    const inOpening = countRegexMatches(firstPara.slice(0, 200), r01Patterns) > 0;
    const severity: PatternSeverity = inOpening ? "fail" : "warn";
    score = bump(score, WEIGHT_HIGH, severity);
    hits.push({
      id: "R01",
      label: isZh ? "泛化开篇" : "Generic grand opening",
      severity,
      message: inOpening
        ? (isZh ? "开篇读起来像模板化的时代论述——从一个具体的场景或事实切入。" : "Opening reads like a templated era-of-X thesis — start with a concrete hook or fact.")
        : (isZh ? "发现泛化的时代变迁或重要性宣告句式。" : "Found era-of-change or importance-announcement phrasing."),
      humanizeHint: isZh
        ? "去掉泛化时代开篇，从具体场景、问题或事实开始。"
        : "Drop the broad era-of-X opening; start with a concrete scene, problem, or fact.",
      excerpt: verbatimSliceAround(plain, 0),
    });
  }

  // ── R02: Hollow importance claims ────────────────────────────────────
  const r02Patterns = isZh ? R02_ZH : R02_EN;
  const r02 = countRegexMatches(plain, r02Patterns);
  if (r02 > 0) {
    score = bump(score, WEIGHT_HIGH, "warn");
    hits.push({
      id: "R02",
      label: isZh ? "空洞重要性声明" : "Hollow importance statement",
      severity: "warn",
      message: isZh
        ? `${r02} 处空洞的重要性声明——用事实说明为什么重要。`
        : `${r02} hollow importance statement(s) — show why it matters with facts.`,
      humanizeHint: isZh
        ? "用具体事实替代仪式化的重要性声明。"
        : "Replace ceremonial importance lines with facts that show why it matters.",
      excerpt: verbatimSliceAround(plain, 0),
    });
  }

  // ── R03: Empty transition phrases ────────────────────────────────────
  const r03Phrases = isZh ? R03_ZH : R03_EN;
  const r03Count = countPhraseMatches(plain, r03Phrases);
  const r03Min = isAcademic ? 4 : 2;
  if (r03Count >= r03Min) {
    const severity: PatternSeverity = r03Count >= (isAcademic ? 6 : 4) ? "fail" : "warn";
    const match = findFirstPhraseMatch(plain, r03Phrases);
    score = bump(score, WEIGHT_MED, severity);
    hits.push({
      id: "R03",
      label: isZh ? "空洞过渡词" : "Empty transition phrase",
      severity,
      message: isZh
        ? `${r03Count} 处空洞过渡词——用逻辑串联观点，而非堆砌填充词。`
        : `${r03Count} empty transition phrase(s) — bridge ideas with logic, not filler.`,
      humanizeHint: isZh
        ? "移除空洞过渡词，用逻辑自然地串联观点。"
        : "Remove empty transitions; bridge ideas with logic instead of filler phrases.",
      excerpt: match
        ? verbatimExcerpt(plain, match.index, match.length)
        : verbatimSliceAround(plain, 0),
    });
  }

  // ── R04: Stacked connectors ──────────────────────────────────────────
  const r04Connectors = isZh ? R04_ZH : R04_EN;
  const r04Match = findStackedConnectorsMatch(plain, r04Connectors);
  if (r04Match && !isAcademic) {
    score = bump(score, WEIGHT_MED, "warn");
    hits.push({
      id: "R04",
      label: isZh ? "连接词堆砌" : "Stacked connectors",
      severity: "warn",
      message: isZh
        ? "连接词堆砌（此外、而且、因此……）——变化句子间的衔接方式。"
        : "Stacked transition words (furthermore, moreover, etc.) — vary how ideas connect.",
      humanizeHint: isZh
        ? "改变句子间的衔接方式，避免堆砌 此外/而且/因此 等连接词。"
        : "Vary how ideas connect; avoid stacking furthermore, moreover, etc.",
      excerpt: verbatimExcerpt(plain, r04Match.index, r04Match.length),
    });
  }

  // ── R05: Marketing hype ──────────────────────────────────────────────
  const r05Phrases = isZh ? R05_ZH : R05_EN;
  const r05Count = countPhraseMatches(plain, r05Phrases);
  if (r05Count >= 2 && !isAcademic) {
    const severity: PatternSeverity = r05Count >= 4 ? "fail" : "warn";
    const match = findFirstPhraseMatch(plain, r05Phrases);
    score = bump(score, WEIGHT_LOW, severity);
    hits.push({
      id: "R05",
      label: isZh ? "营销夸张词" : "Marketing hype",
      severity,
      message: isZh
        ? `${r05Count} 处营销夸张词——用具体对比或可验证的数据替代。`
        : `${r05Count} hype phrase(s) — replace with concrete comparisons or verifiable claims.`,
      humanizeHint: isZh
        ? "用具体对比或可验证的数据替代夸张形容词。"
        : "Replace hype adjectives with concrete comparisons or verifiable claims.",
      excerpt: match
        ? verbatimExcerpt(plain, match.index, match.length)
        : verbatimSliceAround(plain, 0),
    });
  }

  const patternScore = Math.min(100, score);

  return {
    patternScore,
    naturalnessLabel: naturalnessLabel(patternScore),
    language,
    wordCount: wc,
    hits,
    createdAt: new Date().toISOString(),
  };
}

// ── Language detection (bundled) ───────────────────────────────────────

function detectLanguageHeuristic(text: string): "zh" | "en" {
  const plain = text.replace(/\s/g, "");
  if (!plain) return "en";
  const cjk = (plain.match(/[一-鿿㐀-䶿豈-﫿]/g) ?? []).length;
  return cjk / plain.length > 0.2 ? "zh" : "en";
}
