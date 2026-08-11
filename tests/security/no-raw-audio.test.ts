import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(__dirname, "..", "..");

const FORBIDDEN_TOKENS = [
  "rawAudio",
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
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    if (entry.name === "tests") continue; // skip the security test itself
    const full = path.join(dir, entry.name);
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