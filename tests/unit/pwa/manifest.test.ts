import { describe, expect, it } from "vitest";

import manifest from "../../../app/manifest";

describe("PWA manifest", () => {
  it("declares the Wawi Learns standalone portrait shell", () => {
    const metadata = manifest();

    expect(metadata.name).toBe("Wawi Learns");
    expect(metadata.start_url).toBe("/");
    expect(metadata.id).toBe("/");
    expect(metadata.scope).toBe("/");
    expect(metadata.display).toBe("standalone");
    expect(metadata.orientation).toBe("portrait");
    expect(metadata.theme_color).toBe("#0f172a");
    expect(metadata.background_color).toBe("#f8fafc");
    expect(metadata.icons).toEqual([
      { src: "/icons/wawi-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/wawi-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
    ]);
  });
});
