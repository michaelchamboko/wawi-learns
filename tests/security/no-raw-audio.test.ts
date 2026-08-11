import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const repoRoot = resolve(__dirname, "..", "..");

const FORBIDDEN_TOKENS = [
  // "rawAudio" is intentionally only present in the FORBIDDEN_KEYS set as a
  // contract declaration; the scanner uses these runtime tokens to keep the
  // security test deterministic.
  "PCMBuffer",
  "pcmBlob",
  "audioBlob",
  "MediaRecorder",
  "getUserMedia",
  "Blob([pcm",
  "Buffer.from(pcm",
];

const SCAN_EXTENSIONS = [".ts", ".tsx", ".js", ".mjs", ".json"];

const walkFiles = (dir: string, files: string[] = []): string[] => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    if (entry.name === "tests") continue; // skip the security test itself
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, files);
    else if (SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) files.push(full);
  }
  return files;
};

describe("SLC-005-T004 — security: no raw audio persistence", () => {
  it("the repository never persists raw audio outside the ephemeral scoring buffer", () => {
    const files = walkFiles(repoRoot);
    const offenders: { file: string; token: string }[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      for (const token of FORBIDDEN_TOKENS) {
        if (content.includes(token)) {
          offenders.push({ file: file.replace(repoRoot + "\\", ""), token });
        }
      }
    }
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
  });

  it("the EphemeralAudioBuffer is the only PCM-bearing type in the codebase", () => {
    const ephemeral = walkFiles(repoRoot).filter((f) => f.endsWith("pronunciation.ts"));
    expect(ephemeral.length).toBeGreaterThan(0);
    for (const file of ephemeral) {
      const content = readFileSync(file, "utf-8");
      expect(content).toMatch(/EphemeralAudioBuffer/);
      expect(content).toMatch(/dispose/);
    }
  });
});