import withSerwistInit from "@serwist/next";

const shellRevision = process.env.NEXT_PUBLIC_GIT_SHA ?? "development";

const withSerwist = withSerwistInit({
  cacheOnNavigation: true,
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [
    { url: "/", revision: shellRevision },
    { url: "/offline", revision: shellRevision },
  ],
});

/** @type {import("next").NextConfig} */
const nextConfig = {
  typedRoutes: true,
};

export default withSerwist(nextConfig);
