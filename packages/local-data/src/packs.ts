import { z } from "zod";

/**
 * ContentPackManifest is the immutable descriptor of one pack version.
 * The two-slot activation pattern lets a new manifest replace an old one only
 * after a complete download and SHA-256 verification.
 */
export const ContentPackFileSchema = z.object({
  url: z.string(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  bytes: z.number().int().nonnegative(),
  contentType: z.string(),
});

export const ContentPackManifestSchema = z.object({
  packVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  curriculumVersion: z.string(),
  engineVersion: z.string(),
  issuedAt: z.number(),
  expiresAt: z.number().optional(),
  assets: z.array(ContentPackFileSchema),
  entryUrls: z.array(z.string()).min(1),
  sizeBytes: z.number().int().nonnegative(),
});

export type ContentPackFile = z.infer<typeof ContentPackFileSchema>;
export type ContentPackManifest = z.infer<typeof ContentPackManifestSchema>;

export interface ActivationResult {
  readonly status: "activated" | "rejected";
  readonly reason?: string;
  readonly previousPackVersion?: string;
  readonly activePackVersion: string;
}

interface PackSlot {
  readonly manifest: ContentPackManifest | null;
  readonly downloadedFiles: ReadonlyMap<string, ArrayBuffer>;
}

const sha256Hex = async (data: ArrayBuffer): Promise<string> => {
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
};

export interface ActivateOptions {
  readonly fetchFile: (url: string) => Promise<ArrayBuffer>;
  readonly now?: () => number;
  readonly previousPackVersion?: string;
}

/**
 * Two-slot pack activation. The new manifest downloads into a sibling slot;
 * the prior slot remains active until every required asset passes
 * hash verification. A failed download or hash mismatch leaves the prior
 * pack active.
 */
export async function activateValidatedPack(
  manifest: ContentPackManifest,
  options: ActivateOptions,
): Promise<ActivationResult> {
  const now = options.now?.() ?? Date.now();
  if (manifest.expiresAt && manifest.expiresAt < now) {
    return {
      status: "rejected",
      reason: "manifest-expired",
      activePackVersion: options.previousPackVersion ?? "",
    };
  }
  const downloaded = new Map<string, ArrayBuffer>();
  for (const file of manifest.assets) {
    let blob: ArrayBuffer;
    try {
      blob = await options.fetchFile(file.url);
    } catch (error) {
      return {
        status: "rejected",
        reason: `download-failed:${file.url}`,
        previousPackVersion: options.previousPackVersion,
        activePackVersion: options.previousPackVersion ?? "",
      };
    }
    const digest = await sha256Hex(blob);
    if (digest !== file.sha256) {
      return {
        status: "rejected",
        reason: `hash-mismatch:${file.url}`,
        previousPackVersion: options.previousPackVersion,
        activePackVersion: options.previousPackVersion ?? "",
      };
    }
    if (blob.byteLength !== file.bytes) {
      return {
        status: "rejected",
        reason: `size-mismatch:${file.url}`,
        previousPackVersion: options.previousPackVersion,
        activePackVersion: options.previousPackVersion ?? "",
      };
    }
    downloaded.set(file.url, blob);
  }

  const total = [...downloaded.values()].reduce((acc, b) => acc + b.byteLength, 0);
  if (total !== manifest.sizeBytes) {
    return {
      status: "rejected",
      reason: "size-sum-mismatch",
      previousPackVersion: options.previousPackVersion,
      activePackVersion: options.previousPackVersion ?? "",
    };
  }

  return {
    status: "activated",
    previousPackVersion: options.previousPackVersion,
    activePackVersion: manifest.packVersion,
  };
}

/**
 * Two-slot storage helper. The active slot is the only one the runtime
 * reads from. The pending slot is replaced wholesale on activation.
 */
export class PackSlots {
  private slots: { active: PackSlot; pending: PackSlot } = {
    active: { manifest: null, downloadedFiles: new Map() },
    pending: { manifest: null, downloadedFiles: new Map() },
  };

  activeManifest(): ContentPackManifest | null {
    return this.slots.active.manifest;
  }

  stagePending(manifest: ContentPackManifest): void {
    this.slots.pending = { manifest, downloadedFiles: new Map() };
  }

  promotePending(): { previousPackVersion: string | undefined } | null {
    const pending = this.slots.pending.manifest;
    if (!pending) return null;
    const previousPackVersion = this.slots.active.manifest?.packVersion;
    this.slots.active = this.slots.pending;
    this.slots.pending = { manifest: null, downloadedFiles: new Map() };
    return { previousPackVersion };
  }
}