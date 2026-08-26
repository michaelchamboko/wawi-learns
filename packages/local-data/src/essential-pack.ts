import { activateValidatedPack, type ContentPackManifest } from "./packs";
import type { ActivePackState } from "./offline-auth";

export const ESSENTIAL_PACK_VERSION = "1.0.0";
export const ESSENTIAL_PACK_DIGEST = "fd40e9000dd033b90b3a7c61fab091220d5ce96e496e1471cc681f1947deb352";

export const essentialPackManifest: ContentPackManifest = Object.freeze({
  packVersion: ESSENTIAL_PACK_VERSION,
  curriculumVersion: "mvp",
  engineVersion: "1.0.0",
  issuedAt: 1_700_000_000_000,
  assets: [
    { url: "/content/mvp/images/can.svg", sha256: "ac99775331fd62f3c76f208ed9fb3d43d321fca76059f37162aea83b25d1b6f3", bytes: 597, contentType: "image/svg+xml" },
    { url: "/content/mvp/images/cat.svg", sha256: "1a9e5955390ce9e917d5d9b863a994946a1d7ab2a6e532c3e46b259f5ec36a67", bytes: 651, contentType: "image/svg+xml" },
    { url: "/content/mvp/images/sat.svg", sha256: "fe108747fa87bffd55728ed0aef5858ab8514d24bd37fa2d74834020ca33be5d", bytes: 701, contentType: "image/svg+xml" },
    { url: "/content/mvp/images/sit.svg", sha256: "d73d29318238d8fa3f54515d3ca70ed2e81a0a09b18b0bfd20652b5cb5536aeb", bytes: 634, contentType: "image/svg+xml" },
    { url: "/content/mvp/images/sun.svg", sha256: "b0da0f9a0cc95d479d3cac90ae5e0206f0813f71ecdea8b4272a3e12bcaedb71", bytes: 622, contentType: "image/svg+xml" },
  ],
  entryUrls: ["/content/mvp/images/can.svg", "/content/mvp/images/cat.svg", "/content/mvp/images/sat.svg", "/content/mvp/images/sit.svg", "/content/mvp/images/sun.svg"],
  sizeBytes: 3_205,
});

export const prepareEssentialPack = async (fetchFile: (url: string) => Promise<ArrayBuffer>): Promise<ActivePackState | null> => {
  const result = await activateValidatedPack(essentialPackManifest, { fetchFile });
  if (result.status !== "activated") return null;
  return { packVersion: ESSENTIAL_PACK_VERSION, packDigest: ESSENTIAL_PACK_DIGEST, essentialAssetUrls: essentialPackManifest.entryUrls, complete: true };
};
