/**
 * Wawi Learns — immutable content pack builder.
 *
 * Reads the canonical seed corpus, serialises every content file with a
 * deterministic canonical form, hashes each file, and emits two pack
 * manifests (essential + full) under `public/content/<version>/`.
 *
 * Determinism: files are written in a stable sorted order and serialised with
 * key-sorted canonical JSON, so two builds of the same corpus produce byte-for-
 * byte identical output and identical pack digests.
 *
 * The essential pack is the coherent 14-day offline subset: every word, GPC,
 * asset, formation, maths template, sentence and story that the offline core
 * needs, plus exactly the words those sentences and stories reference (so no
 * dangling references exist inside the pack). The full pack contains the whole
 * committed seed inventory.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { loadCanonicalCorpus, type CanonicalCorpus } from "../../packages/content-schema/src/repository";
import { ContentPackManifestSchema, type ContentPackManifest } from "../../packages/local-data/src/packs";

export interface PackFile {
  readonly relPath: string;
  readonly url: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly contentType: string;
  readonly contents: string;
}

export interface BuiltPack {
  readonly packVersion: string;
  readonly manifest: ContentPackManifest;
  readonly files: readonly PackFile[];
}

export interface BuildPackInput {
  readonly root: string;
  readonly version: string;
  readonly curriculumVersion: string;
  readonly engineVersion: string;
  /** When true, only the coherent offline-essential subset is included. */
  readonly essential: boolean;
}

export interface PackBuildResult {
  readonly essential: BuiltPack;
  readonly full: BuiltPack;
}

const canonicalJson = (value: unknown): string =>
  JSON.stringify(value, (_key, nested) => {
    if (!nested || typeof nested !== "object" || Array.isArray(nested)) return nested;
    return Object.fromEntries(Object.entries(nested).sort(([a], [b]) => a.localeCompare(b)));
  }, 2) + "\n";

const sha256 = (data: string): string => createHash("sha256").update(data, "utf-8").digest("hex");

const contentTypeFor = (relPath: string): string =>
  relPath.endsWith(".json") ? "application/json" : "application/octet-stream";

/** Build the ordered list of content files for either pack variant. */
function planFiles(corpus: CanonicalCorpus, essential: boolean): PackFile[] {
  // Map every sentence id to the word ids it uses (so stories resolve to words
  // through their referenced sentences, not through sentence ids directly).
  const sentenceWordIds = new Map<string, readonly string[]>();
  for (const s of corpus.sentences) sentenceWordIds.set(s.id, s.wordIds);

  // For the essential 14-day pack, keep every word that the included
  // sentences reference (directly, and via stories' sentences), plus every GPC
  // and asset those words/stories reference. Everything else is included in
  // both variants.
  const referencedWordIds = new Set<string>();
  for (const s of corpus.sentences) for (const id of s.wordIds) referencedWordIds.add(id);
  for (const st of corpus.stories)
    for (const p of st.pages)
      for (const sid of p.sentenceIds)
        for (const wid of sentenceWordIds.get(sid) ?? []) referencedWordIds.add(wid);
  const referencedAssetIds = new Set<string>();
  for (const w of corpus.words)
    if (w.illustrationAssetId) referencedAssetIds.add(w.illustrationAssetId);
  // Story page illustrations (if any) also count as required assets.
  for (const st of corpus.stories)
    for (const p of st.pages)
      if (p.illustrationAssetId) referencedAssetIds.add(p.illustrationAssetId);

  const words = essential
    ? corpus.words.filter(
        (w) => referencedWordIds.has(w.id) || referencedAssetIds.has(w.illustrationAssetId ?? ""),
      )
    : corpus.words;
  const gpcIds = new Set<string>();
  for (const w of words) for (const g of w.gpcIds) gpcIds.add(g);

  const records: Array<{ name: string; items: unknown[] }> = [
    { name: "gpcs.json", items: [...corpus.gpcs.filter((g) => gpcIds.has(g.id))] },
    { name: "words.json", items: [...words] },
    { name: "sentences.json", items: [...corpus.sentences] },
    { name: "stories.json", items: [...corpus.stories] },
    { name: "assets.json", items: [...corpus.assets] },
    { name: "formations.json", items: [...corpus.formations] },
    { name: "maths.json", items: [...corpus.mathsTemplates] },
  ];

  const files: PackFile[] = [];
  for (const { name, items } of records) {
    const contents = canonicalJson(items);
    const relPath = `content/${name}`;
    const url = `/content/${name}`;
    files.push({
      relPath,
      url,
      sha256: sha256(contents),
      bytes: Buffer.byteLength(contents, "utf-8"),
      contentType: contentTypeFor(relPath),
      contents,
    });
  }
  // Stable order by url.
  files.sort((a, b) => a.url.localeCompare(b.url));
  return files;
}

function buildManifest(
  dirSegment: string,
  packVersion: string,
  curriculumVersion: string,
  engineVersion: string,
  files: readonly PackFile[],
): ContentPackManifest {
  const base = `/content/${dirSegment}`;
  const assets = files.map((f) => ({
    url: `${base}${f.url}`,
    sha256: f.sha256,
    bytes: f.bytes,
    contentType: f.contentType,
  }));
  const sizeBytes = assets.reduce((acc, a) => acc + a.bytes, 0);
  const manifest: ContentPackManifest = {
    packVersion,
    curriculumVersion,
    engineVersion,
    issuedAt: 0, // deterministic; set by caller if needed
    assets,
    entryUrls: [
      `${base}/content/gpcs.json`,
      `${base}/content/words.json`,
      `${base}/content/sentences.json`,
      `${base}/content/stories.json`,
      `${base}/content/assets.json`,
      `${base}/content/formations.json`,
      `${base}/content/maths.json`,
    ],
    sizeBytes,
  };
  // Validate shape before returning.
  return ContentPackManifestSchema.parse(manifest);
}

function buildVariant(input: BuildPackInput, corpus: CanonicalCorpus, essential: boolean): BuiltPack {
  // `dirSegment` is the on-disk/URL directory (e.g. "1.0.0" or "1.0.0-essential").
  // The manifest `packVersion` field is always the released semver, which the
  // consumer schema requires; it does not vary by directory.
  const dirSegment = essential ? `${input.version}-essential` : input.version;
  const files = planFiles(corpus, essential);
  const manifest = buildManifest(
    dirSegment,
    "1.0.0",
    input.curriculumVersion,
    input.engineVersion,
    files,
  );
  return { packVersion: dirSegment, manifest, files };
}

export async function buildPacks(input: BuildPackInput): Promise<PackBuildResult> {
  const corpus = await loadCanonicalCorpus(input.root);
  const essential = buildVariant(input, corpus, true);
  const full = buildVariant(input, corpus, false);
  return { essential, full };
}

/** Write a built pack to `public/content/<version>/` (idempotent, clean dir first). */
export async function writePack(root: string, pack: BuiltPack): Promise<string> {
  const dir = resolve(root, "public", "content", pack.packVersion);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await writeFile(
    resolve(dir, "manifest.json"),
    canonicalJson(pack.manifest),
    "utf-8",
  );
  for (const file of pack.files) {
    const target = resolve(dir, file.relPath);
    await mkdir(resolve(target, ".."), { recursive: true });
    await writeFile(target, file.contents, "utf-8");
  }
  return dir;
}

// CLI entry point. Activated when invoked as `npm run build:packs` (the
// npm_lifecycle_event is set) or when RUN_BUILD_PACKS=1 is exported. Plain
// imports from this module (e.g. in tests) do not trigger a build.
const isCli =
  process.env.npm_lifecycle_event === "build:packs" || process.env.RUN_BUILD_PACKS === "1";
if (isCli) {
  const root = process.cwd();
  const version = process.env.PACK_VERSION ?? "1.0.0";
  const curriculumVersion = process.env.CURRICULUM_VERSION ?? "v1";
  const engineVersion = process.env.ENGINE_VERSION ?? "1.0.0";
  const result = await buildPacks({ root, version, curriculumVersion, engineVersion, essential: true });
  await writePack(root, result.essential);
  await writePack(root, result.full);
  // eslint-disable-next-line no-console
  console.log(
    `built essential (${result.essential.manifest.assets.length} files, ${result.essential.manifest.sizeBytes} bytes) and full (${result.full.manifest.assets.length} files, ${result.full.manifest.sizeBytes} bytes)`,
  );
}
