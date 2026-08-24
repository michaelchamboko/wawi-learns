import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");
const expected = {
  "cat.svg": [650, "5caf06593247034c63df632c8793a22473312f48ba0116a0666f1f5353b8c538"],
  "sun.svg": [621, "6b9a6cb21573bb4e68fa9b484d503714d486f94e6822b0cb6b987842a6ad4eaa"],
  "sit.svg": [633, "eebb41b1c04a11327fc0c5d7c6dbf8812fe94fee06238723ee5a4732b87021e8"],
  "sat.svg": [700, "dda3bea173b73f30a8ebcecf3926a2dd1e07abb6df590b64c7fdbfd56ee1dac2"],
  "can.svg": [596, "e73a7c2f0ee63e97852c322cc3a018c7f5b431d3b7780db218f406b5e284e6eb"],
} as const;

describe("private-beta MVP artwork", () => {
  it("ships five real, hashed project-original illustrations", async () => {
    for (const [file, [bytes, digest]] of Object.entries(expected)) {
      const content = await readFile(resolve(root, "public/content/mvp/images", file));
      expect(content.byteLength).toBe(bytes);
      expect(createHash("sha256").update(content).digest("hex")).toBe(digest);
      expect(content.toString("utf8")).toContain("<svg");
    }
  });
});
