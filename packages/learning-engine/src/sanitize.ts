/**
 * Operational event sanitiser (SLC-009-T004).
 * Strips child identifiers, raw audio, raw stroke data, and other
 * privacy-sensitive fields from any operational log payload.
 */
const FORBIDDEN_KEYS = new Set([
  "childProfileId",
  "childName",
  "audio",
  "pcm",
  "rawAudio",
  "strokePath",
  "traceBuffer",
  "voice",
  "transcript",
  "parentEmail",
]);

const MAX_PAYLOAD_BYTES = 1024;

const truncateString = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, max)}…`;

export const sanitizeOperationalEvent = (input: unknown): unknown => {
  const seen = new WeakSet<object>();
  const walk = (value: unknown): unknown => {
    if (value === null || value === undefined) return value;
    if (typeof value === "string") return truncateString(value, 256);
    if (typeof value === "number" || typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.map((item) => walk(item));
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if (seen.has(obj)) return "[circular]";
      seen.add(obj);
      const out: Record<string, unknown> = {};
      for (const [key, raw] of Object.entries(obj)) {
        if (FORBIDDEN_KEYS.has(key)) {
          out[key] = "[redacted]";
        } else {
          out[key] = walk(raw);
        }
      }
      return out;
    }
    return value;
  };
  const result = walk(input);
  const json = JSON.stringify(result);
  if (json.length <= MAX_PAYLOAD_BYTES) return result;
  return { truncated: true, preview: json.slice(0, MAX_PAYLOAD_BYTES) };
};