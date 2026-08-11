export const dynamic = "force-static";
export const revalidate = false;

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";
const gitSha = process.env.NEXT_PUBLIC_GIT_SHA ?? "development";
const vercelProject = process.env.NEXT_PUBLIC_VERCEL_PROJECT ?? "wawi-learns";

export default function HomePage() {
  return (
    <main
      data-app-version={appVersion}
      data-git-sha={gitSha}
      data-testid="home-shell"
      data-vercel-project={vercelProject}
    >
      <h1>Wawi Learns</h1>
      <p>Offline-ready child learning shell.</p>
      <p data-testid="build-identity">
        Version {appVersion} · Build {gitSha} · Hosted by {vercelProject}
      </p>
      <p>
        <a href="/offline">Open the offline page</a>
      </p>
    </main>
  );
}
