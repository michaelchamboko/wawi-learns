/**
 * Verify a built content pack: re-read every manifest-listed file, confirm the
 * SHA-256 and byte size match, and confirm the manifest parses. A single-byte
 * corruption anywhere fails the verification (fails closed).
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { ContentPackManifestSchema } from "../../packages/local-data/src/packs";

export interface VerifyResult {
  readonly ok: boolean;
  readonly failures: readonly string[];
}

export async function verifyPack(root: string, packVersion: string): Promise<VerifyResult> {
  const dir = resolve(root, "public", "content", packVersion);
  const manifestRaw = await readFile(resolve(dir, "manifest.json"), "utf-8");
  const parsed = ContentPackManifestSchema.safeParse(JSON.parse(manifestRaw));
  if (!parsed.success) {
    return { ok: false, failures: ["manifest-invalid", ...parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)] };
  }
  const failures: string[] = [];
  let total = 0;
  for (const file of parsed.data.assets) {
    const path = resolve(root, "public", file.url.replace(/^\//, ""));
    let data: Buffer;
    try {
      data = await readFile(path);
    } catch {
      failures.push(`missing-file:${file.url}`);
      continue;
    }
    const digest = createHash("sha256").update(data).digest("hex");
    if (digest !== file.sha256) failures.push(`hash-mismatch:${file.url}`);
    if (data.byteLength !== file.bytes) failures.push(`size-mismatch:${file.url}`);
    total += data.byteLength;
  }
  if (total !== parsed.data.sizeBytes) failures.push("size-sum-mismatch");
  return { ok: failures.length === 0, failures };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  const pack = process.argv[2] ?? "1.0.0-essential";
  const result = await verifyPack(root, pack);
  if (!result.ok) {
    // eslint-disable-next-line no-console
    console.error(`pack ${pack} FAILED:`, result.failures);
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log(`pack ${pack} verified OK`);
}
