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

class PayloadTooLargeError extends Error {}

function jsonError(status: number, code: string, message: string): Response {
  return Response.json(
    { error: message, code },
    { status, headers: { "cache-control": "no-store" } },
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
