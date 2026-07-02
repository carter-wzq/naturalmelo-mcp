import type { CheckApiResponse, CheckInput, CheckResult } from "../types.js";

const DEFAULT_BASE_URL = "https://www.naturalmelo.com";

function baseUrl(): string {
  const raw = process.env.CHECKER_API_BASE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return DEFAULT_BASE_URL;
}

export class CheckerApiError extends Error {
  status: number;
  retryAfterSec?: number;

  constructor(message: string, status: number, retryAfterSec?: number) {
    super(message);
    this.name = "CheckerApiError";
    this.status = status;
    this.retryAfterSec = retryAfterSec;
  }
}

/**
 * Call the Naturalmelo public AI text checker API.
 * Throws CheckerApiError on non-OK responses.
 */
export async function checkContent(input: CheckInput): Promise<CheckResult> {
  const url = `${baseUrl()}/api/public/ai-text-checker`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: input.text, mode: input.mode ?? "general" }),
  });

  const body = (await response.json()) as CheckApiResponse;

  if (!response.ok) {
    const retryAfter =
      response.headers.get("Retry-After") ?? undefined;
    const message =
      body.error ?? `API returned ${response.status} ${response.statusText}`;
    throw new CheckerApiError(
      message,
      response.status,
      retryAfter ? Number(retryAfter) : undefined,
    );
  }

  if (body.error) {
    throw new CheckerApiError(body.error, 400);
  }

  return body as CheckResult;
}
