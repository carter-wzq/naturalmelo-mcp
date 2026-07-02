// ── Rule R01: Generic era-of-AI / grand-opening phrases ──────────────

export const R01_EN = [
  /in today(?:'s)?\s+(?:digital|modern|fast-paced|rapidly\s+evolving)/i,
  /with\s+the\s+(?:rapid|fast)\s+(?:evolution|advancement|development)\s+of/i,
  /in\s+(?:an|the)\s+era\s+of\s+(?:ai|digital|technology)/i,
  /as\s+(?:we|businesses|organizations)\s+(?:navigate|move\s+into|embrace)/i,
];

export const R01_ZH = [
  /在当今(?:数字化|AI|智能)/,
  /随着.{0,12}(?:快速发展|迅猛发展|不断演进)/,
  /在.{0,6}时代/,
];

// ── Rule R02: Hollow importance / ceremonial phrasing ──────────────────

export const R02_EN = [
  /(?:has|have)\s+become\s+(?:essential|indispensable|crucial|vital|a\s+necessity)/i,
  /(?:plays|play)\s+(?:a|an)\s+(?:vital|crucial|pivotal|key)\s+role/i,
];

export const R02_ZH = [
  /(?:已经|日益)(?:成为|是).{0,8}(?:不可或缺|至关重要|必不可少)/,
  /扮演着.{0,8}(?:重要|关键|核心)角色/,
];

// ── Rule R03: Empty transition / filler phrases ────────────────────────

export const R03_EN = [
  "it is worth noting that",
  "it is important to note",
  "it is worth mentioning that",
  "needless to say",
  "at the end of the day",
  "when it comes to",
  "in the realm of",
  "it goes without saying",
  "in today's rapidly evolving landscape",
];

export const R03_ZH = [
  "值得注意的是",
  "需要指出的是",
  "不得不说",
  "总而言之",
  "在当今社会",
  "众所周知",
];

// ── Rule R04: Stacked connectors ───────────────────────────────────────

export const R04_EN = [
  "furthermore",
  "moreover",
  "in addition",
  "additionally",
  "consequently",
  "thus",
  "hence",
];

export const R04_ZH = [
  "此外",
  "而且",
  "与此同时",
  "不仅如此",
  "因此",
  "由此可见",
];

// ── Rule R05: Marketing hype / superlative adjectives ──────────────────

export const R05_EN = [
  "revolutionary",
  "game-changing",
  "cutting-edge",
  "transformative",
  "groundbreaking",
  "unparalleled",
  "state-of-the-art",
  "best-in-class",
];

export const R05_ZH = [
  "革命性",
  "颠覆性",
  "前所未有",
  "顶尖",
  "划时代",
  "游戏规则",
];
