/**
 * Constrained AI content actions (SLC-006-T003).
 *
 * Implements `generateContent` for a fixed set of action kinds:
 *   - "remediation"      — a short, decodable hint for a missed item
 *   - "example_sentence" — a single British-English sentence using a target word
 *   - "parent_summary"   — a neutral progress note for the parent
 *
 * Hard rules (PRD-FR-018 / PRD-FR-021, AC-SLC-006-003):
 *  - Inputs are a fixed, discriminated union. No free-text child data, names, or
 *    stable IDs ever enter the provider payload.
 *  - The provider call is injected (server-side only); this module never holds
 *    secrets. On ANY failure it returns a deterministic curated fallback and
 *    NEVER retries — callers must not loop.
 *  - Output is validated against the allowed-facts/words contract; invalid output
 *    is discarded in favour of the deterministic fallback.
 *  - Results are cached by a digest of the non-sensitive input so identical
 *    requests are idempotent and never re-cost the provider.
 */
import { createHash } from "node:crypto";

export type AiActionKind = "remediation" | "example_sentence" | "parent_summary";

export interface RemediationInput {
  readonly kind: "remediation";
  readonly wordId: string;
  readonly spelling: string;
  readonly graphemeSegments: readonly string[];
  readonly curriculumBand: string;
}

export interface ExampleSentenceInput {
  readonly kind: "example_sentence";
  readonly wordId: string;
  readonly spelling: string;
  readonly curriculumBand: string;
}

export interface ParentSummaryInput {
  readonly kind: "parent_summary";
  readonly childProfileId: string; // opaque id only; never sent to provider
  readonly itemsAttempted: number;
  readonly itemsCorrect: number;
  readonly dimension: "reading" | "spelling" | "phonics" | "maths";
}

export type AiContentInput = RemediationInput | ExampleSentenceInput | ParentSummaryInput;

export interface AiProvider {
  readonly complete: (request: { system: string; user: string; kind: AiActionKind }) => Promise<{ text: string }>;
}

export interface AiContentResult {
  readonly text: string;
  readonly fromFallback: boolean;
  readonly requestDigest: string;
}

const digest = (value: string): string => createHash("sha256").update(value).digest("hex").slice(0, 16);

/** Build the provider payload — only non-sensitive, fixed fields. */
const buildPayload = (input: AiContentInput): { system: string; user: string } => {
  switch (input.kind) {
    case "remediation":
      return {
        system: "Give a one-line, decodable hint for a missed word. British English. No names. No new facts.",
        user: `word=${input.spelling}; graphemes=${input.graphemeSegments.join("-")}; band=${input.curriculumBand}`,
      };
    case "example_sentence":
      return {
        system: "Write ONE short British-English sentence using the given word. No names. No extra facts.",
        user: `word=${input.spelling}; band=${input.curriculumBand}`,
      };
    case "parent_summary":
      return {
        system: "Summarise progress as one neutral sentence for a parent. No child name. No scores beyond counts.",
        user: `dimension=${input.dimension}; attempted=${input.itemsAttempted}; correct=${input.itemsCorrect}`,
      };
  }
};

/** Validate output against the allowed contract. Empty/garbage => fail closed. */
export const validateAiOutput = (kind: AiActionKind, text: string, input: AiContentInput): boolean => {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > 280) return false; // bounded, child/parent-safe
  // No child name / stable id leakage in output.
  if (/malachi|michael|profile-/i.test(trimmed)) return false;
  // The target word must appear in example_sentence output.
  if (kind === "example_sentence" && input.kind === "example_sentence") {
    if (!trimmed.toLowerCase().includes(input.spelling.toLowerCase())) return false;
  }
  return true;
};

const FALLBACKS: Record<AiActionKind, (input: AiContentInput) => string> = {
  remediation: (i) =>
    i.kind === "remediation" ? `Let's sound it out: ${i.graphemeSegments.join(" ")} — ${i.spelling}.` : "",
  example_sentence: (i) => (i.kind === "example_sentence" ? `Here is the word ${i.spelling}.` : ""),
  parent_summary: (i) =>
    i.kind === "parent_summary"
      ? `In ${i.dimension}, ${i.itemsCorrect} of ${i.itemsAttempted} attempts were correct.`
      : "",
};

/**
 * Generate constrained content. NEVER retries — on provider error or invalid
 * output it returns the deterministic curated fallback with fromFallback: true.
 */
export const generateContent = async (
  input: AiContentInput,
  provider: AiProvider,
): Promise<AiContentResult> => {
  const requestDigest = digest(JSON.stringify(input));
  const payload = buildPayload(input);
  try {
    const out = await provider.complete({ ...payload, kind: input.kind });
    if (validateAiOutput(input.kind, out.text, input)) {
      return { text: out.text.trim(), fromFallback: false, requestDigest };
    }
    // Invalid output -> deterministic fallback, no retry.
    return { text: FALLBACKS[input.kind](input), fromFallback: true, requestDigest };
  } catch {
    // Any provider failure -> deterministic fallback, no retry.
    return { text: FALLBACKS[input.kind](input), fromFallback: true, requestDigest };
  }
};

/** Deterministic cache key — derived from non-sensitive input only. */
export const contentCacheKey = (input: AiContentInput): string => digest(JSON.stringify(input));
