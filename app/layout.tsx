import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";
const gitSha = process.env.NEXT_PUBLIC_GIT_SHA ?? "development";
const vercelProject = process.env.NEXT_PUBLIC_VERCEL_PROJECT ?? "wawi-learns";
const shellRevision = process.env.PWA_E2E_SHELL_REVISION ?? "shell-v1";

export const metadata: Metadata = {
  title: "Wawi Learns",
  description: "Offline-ready child learning shell for Wawi Learns.",
  applicationName: "Wawi Learns",
  manifest: "/manifest.webmanifest",
  other: {
    "wawi:app-version": appVersion,
    "wawi:git-sha": gitSha,
    "wawi:vercel-project": vercelProject,
    "x-shell-revision": shellRevision,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        {children}
      </body>
    </html>
  );
}
