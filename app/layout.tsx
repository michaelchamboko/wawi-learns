import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { readDeploymentIdentity } from "./deployment-identity";
import { ConvexClientProvider } from "./ConvexClientProvider";
import "./globals.css";

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";
const deployment = readDeploymentIdentity();
const shellRevision = process.env.PWA_E2E_SHELL_REVISION ?? "shell-v1";

export const metadata: Metadata = {
  title: "Wawi Learns",
  description: "Offline-ready child learning shell for Wawi Learns.",
  applicationName: "Wawi Learns",
  manifest: "/manifest.webmanifest",
  other: {
    "wawi:app-version": appVersion,
    "wawi:git-sha": deployment.gitSha,
    "wawi:vercel-project": deployment.project,
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
      <body><ConvexClientProvider>{children}</ConvexClientProvider></body>
    </html>
  );
}
