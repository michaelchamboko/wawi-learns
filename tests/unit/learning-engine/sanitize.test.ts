import { describe, expect, it } from "vitest";
import { sanitizeOperationalEvent } from "../../../packages/learning-engine/src/sanitize";

describe("SLC-009-T004 — operational telemetry sanitiser", () => {
  it("redacts child identifiers, audio, strokes and parent email", () => {
    const input = {
      childProfileId: "child-1234",
      childName: "Malachi",
      parentEmail: "[email protected]",
      audio: "base64-bytes",
      pcm: "pcm-bytes",
      strokePath: ["m0,0", "l10,10"],
      durationMs: 1500,
    };
    const sanitized = sanitizeOperationalEvent(input) as Record<string, unknown>;
    expect(sanitized.childProfileId).toBe("[redacted]");
    expect(sanitized.childName).toBe("[redacted]");
    expect(sanitized.parentEmail).toBe("[redacted]");
    expect(sanitized.audio).toBe("[redacted]");
    expect(sanitized.pcm).toBe("[redacted]");
    expect(sanitized.strokePath).toBe("[redacted]");
    expect(sanitized.durationMs).toBe(1500);
  });

  it("truncates oversized payloads and reports the preview", () => {
    const input = { big: Array.from({ length: 2000 }, (_, i) => `item-${i}`) };
    const sanitized = sanitizeOperationalEvent(input) as Record<string, unknown>;
    expect(sanitized.truncated).toBe(true);
    expect((sanitized.preview as string).length).toBeLessThanOrEqual(1024);
  });

  it("passes through non-PII fields and short strings", () => {
    const sanitized = sanitizeOperationalEvent({ eventId: "ev-1", kind: "schedule" }) as Record<string, unknown>;
    expect(sanitized.eventId).toBe("ev-1");
    expect(sanitized.kind).toBe("schedule");
  });
});
