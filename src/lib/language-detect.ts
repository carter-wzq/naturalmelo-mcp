// ── Latin language marker words ────────────────────────────────────────

const LATIN_MARKERS: Record<string, readonly string[]> = {
  en: ["the","and","of","to","in","is","that","this","these","with","for","are","has","have","was","an","be","by","on","it","as","at"],
  pt: ["não","são","está","você","também","muito","como","isso","uma","dos","das","pelo","pela","então","mais"],
  es: ["el","los","las","del","está","también","cómo","muy","como","una","son","más"],
  fr: ["les","des","une","dans","pour","avec","est","sont","cette","très","comme","plus"],
  de: ["der","die","das","und","nicht","über","ist","sind","auch","mit","für","wie"],
};

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMarkers(text: string, markers: readonly string[]): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const word of markers) {
    const re = new RegExp(`\\b${escapeRegex(word)}\\b`, "gi");
    count += (lower.match(re) ?? []).length;
  }
  return count;
}

function detectLatin(text: string): string {
  const scores = Object.entries(LATIN_MARKERS)
    .map(([code, markers]) => ({ code, score: countMarkers(text, markers) }))
    .sort((a, b) => b.score - a.score);
  const top = scores[0]!;
  const second = scores[1] ?? { code: "en", score: 0 };
  return top.score >= 2 && top.score - second.score >= 1 ? top.code : "en";
}

/**
 * Heuristic language detection: returns "zh", "ja", "ko", or a Latin code.
 * Simplified from Naturalmelo production — accurate enough for rule matching.
 */
export function detectLanguage(text: string): string {
  const plain = text.replace(/\s/g, "");
  if (!plain) return "en";

  const len = plain.length || 1;

  const hangul = (plain.match(/[\uac00-\ud7af]/g) ?? []).length;
  if (hangul / len > 0.15) return "ko";

  const kana = (plain.match(/[\u3040-\u30ff]/g) ?? []).length;
  if (kana / len > 0.08) return "ja";

  const cjk = (plain.match(/[一-鿿㐀-䶿豈-﫿]/g) ?? []).length;
  if (cjk / len > 0.2) return "zh";

  return detectLatin(text);
}
