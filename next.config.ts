import withSerwistInit from "@serwist/next";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const buildGitSha = process.env.VERCEL_GIT_COMMIT_SHA
  ?? execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();

process.env.NEXT_PUBLIC_GIT_SHA = buildGitSha;

const shellRevision = buildGitSha;

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
  env: {
    NEXT_PUBLIC_GIT_SHA: buildGitSha,
  },
  typedRoutes: true,
  webpack: (config: { resolve: { alias: Record<string, string> } }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@wawi-learns/ui": resolve(__dirname, "packages/ui/src/index.ts"),
    };
    return config;
  },
};

export default withSerwist(nextConfig);
