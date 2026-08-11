/// <reference lib="webworker" />
import { CacheFirst, NetworkOnly, ExpirationPlugin, Serwist } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

// Explicit safe runtime-cache whitelist (ADR-007). Only public shell build assets
// (same-origin `/_next/static/*`) and the manifest icons (`/icons/*`) may enter a
// cache, via bounded CacheFirst rules. Every other request — navigation documents,
// `/api/*`, Convex traffic, RSC/data payloads, and all cross-origin requests — is
// NetworkOnly and can never cache a private or authenticated response. The offline
// shell and its generated static assets are already covered by precache
// (`__SW_MANIFEST` + the `/` and `/offline` shell entries).
const runtimeCaching = [
  {
    matcher: ({ sameOrigin, url: { pathname } }: { sameOrigin: boolean; url: { pathname: string } }) =>
      sameOrigin && pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({
      cacheName: "shell-static",
      plugins: [
        new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      ],
    }),
  },
  {
    matcher: ({ sameOrigin, url: { pathname } }: { sameOrigin: boolean; url: { pathname: string } }) =>
      sameOrigin && pathname.startsWith("/icons/"),
    handler: new CacheFirst({
      cacheName: "shell-icons",
      plugins: [
        new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: 365 * 24 * 60 * 60 }),
      ],
    }),
  },
  {
    matcher: /.*/,
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
