export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Sentence / word utilities ──────────────────────────────────────────

function mergeStandaloneNumberedListLines(text: string): string {
  const lines = text.split(/\n/);
  const merged: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const next = lines[i + 1];
    if (/^\d+\.$/.test(line.trim()) && next?.trim()) {
      merged.push(`${line.trim()} ${next.trim()}`);
      i++;
    } else {
      merged.push(line);
    }
  }
  return merged.join("\n");
}

export function splitSentences(text: string, isZh: boolean): string[] {
  if (!text.trim()) return [];
  if (isZh) {
    return text
      .split(/[。！？；\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  const prepared = mergeStandaloneNumberedListLines(text);
  return prepared
    .split(/(?<=[.!?])(?<!\d\.)\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function sentenceWordCount(sentence: string, isZh: boolean): number {
  if (isZh) {
    const cjk = sentence.match(/[一-鿿㐀-䶿豈-﫿]/g);
    return (cjk?.length ?? 0) +
      sentence.replace(/[一-鿿㐀-䶿豈-﫿]/g, " ").trim().split(/\s+/).filter(Boolean).length;
  }
  return sentence.split(/\s+/).filter(Boolean).length;
}

export function wordCount(text: string, isZh: boolean): number {
  const plain = text.trim();
  if (!plain) return 0;
  if (isZh) {
    const cjk = plain.match(/[一-鿿㐀-䶿豈-﫿]/g);
    return (cjk?.length ?? 0) +
      plain.replace(/[一-鿿㐀-䶿豈-﫿]/g, " ").trim().split(/\s+/).filter(Boolean).length;
  }
  return plain.split(/\s+/).filter(Boolean).length;
}

// ── Phrase / regex match helpers ───────────────────────────────────────

export function countPhraseMatches(text: string, phrases: string[]): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const phrase of phrases) {
    const p = phrase.toLowerCase();
    let idx = 0;
    while (true) {
      const found = lower.indexOf(p, idx);
      if (found === -1) break;
      count++;
      idx = found + p.length;
    }
  }
  return count;
}

export function countRegexMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  for (const re of patterns) {
    const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
    const regex = new RegExp(re.source, flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) count++;
  }
  return count;
}

export function findFirstPhraseMatch(
  text: string,
  phrases: string[],
): { index: number; length: number } | null {
  const lower = text.toLowerCase();
  let earliest = -1;
  let matchedLen = 0;
  for (const phrase of phrases) {
    const idx = lower.indexOf(phrase.toLowerCase());
    if (idx >= 0 && (earliest === -1 || idx < earliest)) {
      earliest = idx;
      matchedLen = phrase.length;
    }
  }
  return earliest < 0 ? null : { index: earliest, length: matchedLen };
}

export function findStackedConnectorsMatch(
  text: string,
  connectors: string[],
): { index: number; length: number } | null {
  const lower = text.toLowerCase();
  for (let i = 0; i < connectors.length; i++) {
    for (let j = 0; j < connectors.length; j++) {
      if (i === j) continue;
      const pattern = new RegExp(
        `${escapeRegex(connectors[i]!)}[^.!?]{0,120}${escapeRegex(connectors[j]!)}`,
        "i",
      );
      const match = pattern.exec(lower);
      if (match) return { index: match.index, length: match[0].length };
    }
  }
  return null;
}
