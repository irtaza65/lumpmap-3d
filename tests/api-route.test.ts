import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { POST } from "../app/api/navigate/route";
import { parseDemoDescription } from "../lib/openai/demo";
import { LumpDescriptionSchema } from "../lib/openai/schema";
import { evaluateTriage } from "../lib/triage";

const savedApiKey = process.env.OPENAI_API_KEY;
const savedModel = process.env.OPENAI_MODEL;
const savedFetch = globalThis.fetch;

beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_MODEL;
  globalThis.fetch = savedFetch;
});

afterEach(() => {
  if (savedApiKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = savedApiKey;
  if (savedModel === undefined) delete process.env.OPENAI_MODEL;
  else process.env.OPENAI_MODEL = savedModel;
  globalThis.fetch = savedFetch;
});

function requestWithBody(body: string): Request {
  return new Request("http://localhost/api/navigate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

test("rejects malformed, empty, extra-field, and oversized input", async (t) => {
  await t.test("malformed JSON", async () => {
    const response = await POST(requestWithBody("{"));
    assert.equal(response.status, 400);
  });

  await t.test("blank text", async () => {
    const response = await POST(requestWithBody(JSON.stringify({ text: "   " })));
    assert.equal(response.status, 400);
  });

  await t.test("unknown request fields", async () => {
    const response = await POST(
      requestWithBody(JSON.stringify({ text: "A lump", urgency: "low" })),
    );
    assert.equal(response.status, 400);
  });

  await t.test("oversized description", async () => {
    const response = await POST(
      requestWithBody(JSON.stringify({ text: "x".repeat(4_001) })),
    );
    assert.equal(response.status, 413);
  });

  await t.test("oversized byte payload", async () => {
    const response = await POST(
      requestWithBody(JSON.stringify({ text: "x", padding: "x".repeat(17_000) })),
    );
    assert.equal(response.status, 413);
  });
});

test("no-key Demo Mode returns strict extraction with no urgency field", async () => {
  const response = await POST(
    requestWithBody(
      JSON.stringify({
        text: "There is severe pain and swelling right beside the anus and I feel feverish.",
      }),
    ),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");

  const result = await response.json();
  assert.equal(result.mode, "demo");
  assert.equal(result.description.bodyRegion, "perianal");
  assert.equal(result.description.pain, "severe");
  assert.equal(result.description.feverOrChills, true);
  assert.equal(result.description.urgency, undefined);
  assert.equal(evaluateTriage(result.description).category, "same_day_urgent");
  assert.equal(LumpDescriptionSchema.safeParse(result.description).success, true);
  assert.ok(result.description.suggestedFollowUpQuestions.length <= 3);
});

test("OpenAI request uses strict Responses output, no storage, and the safe fallback model", async () => {
  const originalText = "A lump on my wrist.";
  const extraction = parseDemoDescription(originalText);
  let upstreamBody: Record<string, unknown> | undefined;

  process.env.OPENAI_API_KEY = "test-only-key";
  globalThis.fetch = (async (_input, init) => {
    if (typeof init?.body !== "string") {
      throw new Error("Expected the SDK to send a JSON request body");
    }
    upstreamBody = JSON.parse(init.body);

    return Response.json({
      id: "resp_test",
      object: "response",
      created_at: 0,
      status: "completed",
      model: "gpt-5.6",
      output: [
        {
          id: "msg_test",
          type: "message",
          role: "assistant",
          status: "completed",
          content: [
            {
              type: "output_text",
              annotations: [],
              logprobs: [],
              text: JSON.stringify(extraction),
            },
          ],
        },
      ],
    });
  }) as typeof fetch;

  const response = await POST(
    requestWithBody(JSON.stringify({ text: originalText })),
  );
  assert.equal(response.status, 200);
  const result = await response.json();

  assert.equal(result.mode, "openai");
  assert.equal(upstreamBody?.model, "gpt-5.6");
  assert.equal(upstreamBody?.store, false);
  assert.equal(
    (upstreamBody?.text as { format: { type: string; strict: boolean } }).format
      .type,
    "json_schema",
  );
  assert.equal(
    (
      upstreamBody?.text as {
        format: {
          type: string;
          strict: boolean;
          schema: { additionalProperties: boolean; properties: object };
        };
      }
    ).format.strict,
    true,
  );
  assert.equal(
    (
      upstreamBody?.text as {
        format: { schema: { additionalProperties: boolean } };
      }
    ).format.schema.additionalProperties,
    false,
  );
  assert.equal(
    (
      (upstreamBody?.text as { format: { schema: { properties: object } } })
        .format.schema.properties as Record<string, unknown>
    ).urgency,
    undefined,
  );
  assert.match(
    (upstreamBody?.input as Array<{ content: string }>)[0].content,
    /Never determine urgency/,
  );
  assert.equal(result.description.urgency, undefined);
});

test("unusable Demo Mode text stays unknown and asks a safe clarification", async () => {
  const response = await POST(
    requestWithBody(JSON.stringify({ text: "What is the weather tomorrow?" })),
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.description.bodyRegion, "unknown");
  assert.equal(result.description.feverOrChills, null);
  assert.equal(result.description.rednessOrWarmth, null);
  assert.equal(
    result.description.suggestedFollowUpQuestions[0],
    "Where on your body is the lump?",
  );
  assert.ok(result.description.suggestedFollowUpQuestions.length <= 3);
});

test("OPENAI_MODEL overrides the fallback without becoming client input", async () => {
  const originalText = "A lump on my wrist.";
  const extraction = parseDemoDescription(originalText);
  let upstreamBody: Record<string, unknown> | undefined;

  process.env.OPENAI_API_KEY = "test-only-key";
  process.env.OPENAI_MODEL = "configured-model";
  globalThis.fetch = (async (_input, init) => {
    upstreamBody = JSON.parse(init?.body as string);
    return Response.json({
      id: "resp_test",
      object: "response",
      created_at: 0,
      status: "completed",
      model: "configured-model",
      output: [
        {
          id: "msg_test",
          type: "message",
          role: "assistant",
          status: "completed",
          content: [
            {
              type: "output_text",
              annotations: [],
              logprobs: [],
              text: JSON.stringify(extraction),
            },
          ],
        },
      ],
    });
  }) as typeof fetch;

  const response = await POST(
    requestWithBody(JSON.stringify({ text: originalText })),
  );
  assert.equal(response.status, 200);
  assert.equal(upstreamBody?.model, "configured-model");
});

test("model extraction cannot erase explicit deterministic warning facts", async () => {
  const originalText =
    "There is severe pain and swelling right beside the anus and I feel feverish.";
  const downgradedExtraction = {
    ...parseDemoDescription(originalText),
    bodyRegion: "unknown" as const,
    pain: "none" as const,
    feverOrChills: false,
  };

  process.env.OPENAI_API_KEY = "test-only-key";
  globalThis.fetch = (async () =>
    Response.json({
      id: "resp_test",
      object: "response",
      created_at: 0,
      status: "completed",
      model: "gpt-5.6",
      output: [
        {
          id: "msg_test",
          type: "message",
          role: "assistant",
          status: "completed",
          content: [
            {
              type: "output_text",
              annotations: [],
              logprobs: [],
              text: JSON.stringify(downgradedExtraction),
            },
          ],
        },
      ],
    })) as typeof fetch;

  const response = await POST(
    requestWithBody(JSON.stringify({ text: originalText })),
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.description.bodyRegion, "perianal");
  assert.equal(result.description.pain, "severe");
  assert.equal(result.description.feverOrChills, true);
  assert.equal(result.description.urgency, undefined);
  assert.equal(evaluateTriage(result.description).category, "same_day_urgent");
});

test("Demo Mode preserves unknowns instead of inventing missing symptoms", async () => {
  const originalText = "Baghal mein baar baar dard wali phinsi hoti hai aur nishan reh jata hai.";
  const response = await POST(
    requestWithBody(JSON.stringify({ text: originalText })),
  );
  const result = await response.json();

  assert.equal(result.description.originalText, originalText);
  assert.equal(result.description.bodyRegion, "armpit");
  assert.equal(result.description.recurrent, true);
  assert.equal(result.description.tunnelsPitsOrScars, true);
  assert.equal(result.description.pain, "unknown");
  assert.equal(result.description.feverOrChills, null);
  assert.equal(result.description.drainage, "unknown");
});

test("originalText preserves the user's exact submitted wording", async () => {
  const originalText = "  A lump on my wrist.\n";
  const response = await POST(
    requestWithBody(JSON.stringify({ text: originalText })),
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.description.originalText, originalText);
  assert.equal(result.description.bodyRegion, "wrist_hand");
});

test("Demo Mode keeps scrotal skin distinct from inside-testicle wording", async (t) => {
  await t.test("scrotal skin", async () => {
    const response = await POST(
      requestWithBody(JSON.stringify({ text: "There is one lump on the skin of my scrotum." })),
    );
    const result = await response.json();
    assert.equal(result.description.bodyRegion, "scrotal_skin");
  });

  await t.test("inside testicle", async () => {
    const response = await POST(
      requestWithBody(JSON.stringify({ text: "I can feel a new lump inside my testicle." })),
    );
    const result = await response.json();
    assert.equal(result.description.bodyRegion, "inside_testicle");
    assert.equal(result.description.layer, "deep_or_internal");
  });
});
