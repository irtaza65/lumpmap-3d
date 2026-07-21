import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { parseDemoDescription } from "../../../lib/openai/demo";
import {
  LumpDescriptionSchema,
  MAX_DESCRIPTION_CHARS,
  NavigateRequestSchema,
  type LumpDescription,
  type NavigateResponse,
} from "../../../lib/openai/schema";
import { LUMP_EXTRACTION_SYSTEM_PROMPT } from "../../../lib/openai/systemPrompt";

const MAX_REQUEST_BYTES = 16 * 1024;
const DEFAULT_MODEL = "gpt-5.6";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_MAX_TRACKED_KEYS = 2_048;
const RATE_LIMIT_SALT = globalThis.crypto.randomUUID();

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

// Process-local by design: keys are salted, ephemeral hashes and disappear on
// restart. This bounds spend without retaining IP addresses or health text.
const rateLimitEntries = new Map<string, RateLimitEntry>();

class PayloadTooLargeError extends Error {}

function jsonError(
  status: number,
  code: string,
  message: string,
  headers?: HeadersInit,
): Response {
  return Response.json(
    { error: message, code },
    {
      status,
      headers: { "cache-control": "no-store", ...headers },
    },
  );
}

function jsonSuccess(response: NavigateResponse): Response {
  return Response.json(response, {
    headers: { "cache-control": "no-store" },
  });
}

async function readBodyWithinLimit(request: Request): Promise<string> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new PayloadTooLargeError();
  }

  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let byteLength = 0;
  let body = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new PayloadTooLargeError();
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return body;
  } finally {
    reader.releaseLock();
  }
}

function deploymentClientAddress(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  const address =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    forwardedFor ??
    "unattributed";

  // Avoid letting an attacker inflate hashing work with an oversized header.
  return address.trim().slice(0, 128) || "unattributed";
}

async function anonymousClientKey(request: Request): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(
      `${RATE_LIMIT_SALT}:${deploymentClientAddress(request)}`,
    ),
  );

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function pruneRateLimitEntries(now: number): void {
  for (const [key, entry] of rateLimitEntries) {
    if (entry.resetAt <= now) rateLimitEntries.delete(key);
  }

  while (rateLimitEntries.size >= RATE_LIMIT_MAX_TRACKED_KEYS) {
    const oldestKey = rateLimitEntries.keys().next().value as string | undefined;
    if (!oldestKey) break;
    rateLimitEntries.delete(oldestKey);
  }
}

async function checkRateLimit(
  request: Request,
): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number }> {
  const now = Date.now();
  const key = await anonymousClientKey(request);
  const existing = rateLimitEntries.get(key);

  if (!existing || existing.resetAt <= now) {
    if (!existing) pruneRateLimitEntries(now);
    rateLimitEntries.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1_000)),
    };
  }

  existing.count += 1;
  return { allowed: true };
}

function normalizeModelExtraction(
  extraction: LumpDescription,
  originalText: string,
): LumpDescription {
  const explicit = parseDemoDescription(originalText);
  const protectedRegion = new Set<LumpDescription["bodyRegion"]>([
    "inside_testicle",
    "perianal",
    "scrotal_skin",
    "vulvar_opening",
  ]).has(explicit.bodyRegion)
    ? explicit.bodyRegion
    : extraction.bodyRegion;

  // A model extraction can add useful multilingual normalization, but it may
  // not erase high-signal facts that deterministic parsing found verbatim.
  const safetyProtectedExtraction: LumpDescription = {
    ...extraction,
    bodyRegion: protectedRegion,
    layer:
      explicit.layer === "deep_or_internal"
        ? explicit.layer
        : extraction.layer,
    onset: explicit.onset !== "unknown" ? explicit.onset : extraction.onset,
    trend:
      explicit.trend === "rapidly_worsening"
        ? explicit.trend
        : extraction.trend,
    pain: explicit.pain === "severe" ? explicit.pain : extraction.pain,
    rednessOrWarmth:
      explicit.rednessOrWarmth === true
        ? true
        : extraction.rednessOrWarmth,
    drainage:
      explicit.drainage !== "unknown" && explicit.drainage !== "none"
        ? explicit.drainage
        : extraction.drainage,
    feverOrChills:
      explicit.feverOrChills === true ? true : extraction.feverOrChills,
    faintConfusedOrVeryUnwell:
      explicit.faintConfusedOrVeryUnwell === true
        ? true
        : extraction.faintConfusedOrVeryUnwell,
    recurrent: explicit.recurrent === true ? true : extraction.recurrent,
    tunnelsPitsOrScars:
      explicit.tunnelsPitsOrScars === true
        ? true
        : extraction.tunnelsPitsOrScars,
    diabetesOrImmunocompromised:
      explicit.diabetesOrImmunocompromised === true
        ? true
        : extraction.diabetesOrImmunocompromised,
    troubleBreathing:
      explicit.troubleBreathing === true
        ? true
        : extraction.troubleBreathing,
    spreadingRednessOrSwelling:
      explicit.spreadingRednessOrSwelling === true
        ? true
        : extraction.spreadingRednessOrSwelling,
    severeSystemicSymptoms:
      explicit.severeSystemicSymptoms === true
        ? true
        : extraction.severeSystemicSymptoms,
    blackGreyBlisteringOrNumbSkin:
      explicit.blackGreyBlisteringOrNumbSkin === true
        ? true
        : extraction.blackGreyBlisteringOrNumbSkin,
    painOutOfProportion:
      explicit.painOutOfProportion === true
        ? true
        : extraction.painOutOfProportion,
    suddenOnset:
      explicit.suddenOnset === true ? true : extraction.suddenOnset,
    swelling: explicit.swelling === true ? true : extraction.swelling,
    nearEyeOrCentralFace:
      explicit.nearEyeOrCentralFace === true
        ? true
        : extraction.nearEyeOrCentralFace,
    hardOrFixed:
      explicit.hardOrFixed === true ? true : extraction.hardOrFixed,
    steadilyGrowing:
      explicit.steadilyGrowing === true
        ? true
        : extraction.steadilyGrowing,
    unexplained:
      explicit.unexplained === true ? true : extraction.unexplained,
    persistent:
      explicit.persistent === true ? true : extraction.persistent,
    durationDays:
      explicit.durationDays !== null
        ? explicit.durationDays
        : extraction.durationDays,
    age: explicit.age !== null ? explicit.age : extraction.age,
  };

  return LumpDescriptionSchema.parse({
    ...safetyProtectedExtraction,
    originalText,
    normalizedPlainLanguage:
      safetyProtectedExtraction.normalizedPlainLanguage.trim() || originalText,
    unknowns: [
      ...new Set(
        safetyProtectedExtraction.unknowns
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ],
    suggestedFollowUpQuestions: [
      ...new Set(
        safetyProtectedExtraction.suggestedFollowUpQuestions
          .map((question) => question.trim())
          .filter(Boolean),
      ),
    ].slice(0, 3),
  });
}

async function extractWithOpenAI(
  apiKey: string,
  originalText: string,
): Promise<LumpDescription> {
  const client = new OpenAI({
    apiKey,
    logLevel: "off",
    maxRetries: 1,
    timeout: 20_000,
  });

  const response = await client.responses.parse({
    model: process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
    store: false,
    input: [
      { role: "system", content: LUMP_EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: originalText },
    ],
    text: {
      format: zodTextFormat(LumpDescriptionSchema, "lump_description"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("Structured extraction was unavailable");
  }

  return normalizeModelExtraction(response.output_parsed, originalText);
}

export async function POST(request: Request): Promise<Response> {
  const rateLimit = await checkRateLimit(request);
  if (!rateLimit.allowed) {
    return jsonError(
      429,
      "rate_limited",
      "Too many requests. Please wait before trying again.",
      { "retry-after": String(rateLimit.retryAfterSeconds) },
    );
  }

  let rawBody: string;
  try {
    rawBody = await readBodyWithinLimit(request);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return jsonError(413, "payload_too_large", "The request is too large.");
    }
    return jsonError(400, "invalid_request", "The request body could not be read.");
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(rawBody);
  } catch {
    return jsonError(400, "invalid_json", "Send a valid JSON request body.");
  }

  const parsed = NavigateRequestSchema.safeParse(decoded);
  if (!parsed.success) {
    const isTextTooLong =
      typeof decoded === "object" &&
      decoded !== null &&
      "text" in decoded &&
      typeof decoded.text === "string" &&
      decoded.text.length > MAX_DESCRIPTION_CHARS;
    return jsonError(
      isTextTooLong ? 413 : 400,
      isTextTooLong ? "payload_too_large" : "invalid_input",
      isTextTooLong
        ? "The description is too long."
        : "Provide one non-empty text description and no additional fields.",
    );
  }

  const originalText = parsed.data.text;
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    const response: NavigateResponse = {
      mode: "demo",
      description: parseDemoDescription(originalText),
    };
    return jsonSuccess(response);
  }

  try {
    const response: NavigateResponse = {
      mode: "openai",
      description: await extractWithOpenAI(apiKey, originalText),
    };
    return jsonSuccess(response);
  } catch {
    // Never log raw health text or upstream response content.
    return jsonError(
      502,
      "extraction_unavailable",
      "Language interpretation is temporarily unavailable. Try Demo Mode or complete the guided questions.",
    );
  }
}
