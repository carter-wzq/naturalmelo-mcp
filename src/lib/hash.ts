import { createHash } from "node:crypto";

export function inputHash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function deriveSeed(text: string): number {
  return parseInt(inputHash(text).slice(0, 8), 16) >>> 0;
}
