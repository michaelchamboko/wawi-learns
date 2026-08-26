import { activateValidatedPack, type ContentPackManifest } from "./packs";
import type { ActivePackState } from "./offline-auth";

export const ESSENTIAL_PACK_VERSION = "1.0.0";
export const ESSENTIAL_PACK_DIGEST = "42936e89483420a7b04c9d423728f13d23454cfdd85cc5eb18c39206e5716cd1";

export const essentialPackManifest: ContentPackManifest = Object.freeze({
  packVersion: ESSENTIAL_PACK_VERSION,
  curriculumVersion: "mvp",
  engineVersion: "1.0.0",
  issuedAt: 1_700_000_000_000,
  assets: [
    { url: "/content/mvp/images/can.svg", sha256: "e73a7c2f0ee63e97852c322cc3a018c7f5b431d3b7780db218f406b5e284e6eb", bytes: 596, contentType: "image/svg+xml" },
    { url: "/content/mvp/images/cat.svg", sha256: "5caf06593247034c63df632c8793a22473312f48ba0116a0666f1f5353b8c538", bytes: 650, contentType: "image/svg+xml" },
    { url: "/content/mvp/images/sat.svg", sha256: "dda3bea173b73f30a8ebcecf3926a2dd1e07abb6df590b64c7fdbfd56ee1dac2", bytes: 700, contentType: "image/svg+xml" },
    { url: "/content/mvp/images/sit.svg", sha256: "eebb41b1c04a11327fc0c5d7c6dbf8812fe94fee06238723ee5a4732b87021e8", bytes: 633, contentType: "image/svg+xml" },
    { url: "/content/mvp/images/sun.svg", sha256: "6b9a6cb21573bb4e68fa9b484d503714d486f94e6822b0cb6b987842a6ad4eaa", bytes: 621, contentType: "image/svg+xml" },
  ],
  entryUrls: ["/content/mvp/images/can.svg", "/content/mvp/images/cat.svg", "/content/mvp/images/sat.svg", "/content/mvp/images/sit.svg", "/content/mvp/images/sun.svg"],
  sizeBytes: 3_200,
});

export const prepareEssentialPack = async (fetchFile: (url: string) => Promise<ArrayBuffer>): Promise<ActivePackState | null> => {
  const result = await activateValidatedPack(essentialPackManifest, {
    fetchFile: async (url) => {
      const bytes = await fetchFile(url);
      if (!url.endsWith(".svg")) return bytes;
      const text = new TextDecoder().decode(bytes).replaceAll("\r\n", "\n");
      return new TextEncoder().encode(text).buffer;
    },
  });
  if (result.status !== "activated") return null;
  return { packVersion: ESSENTIAL_PACK_VERSION, packDigest: ESSENTIAL_PACK_DIGEST, essentialAssetUrls: essentialPackManifest.entryUrls, complete: true };
};
