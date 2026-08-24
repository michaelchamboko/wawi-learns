import { readDeploymentIdentity } from "./deployment-identity";

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";
const deployment = readDeploymentIdentity();

export default function HomePage() {
  return (
    <main
      data-app-version={appVersion}
      data-git-sha={deployment.gitSha}
      data-testid="home-shell"
      data-vercel-project={deployment.project}
    >
      <h1>Wawi Learns</h1>
      <p>Offline-ready child learning shell.</p>
      <p data-testid="build-identity">
        Version {appVersion} · Build {deployment.gitSha} · Hosted by {deployment.project}
      </p>
      <p>
        <a href="/offline">Open the offline page</a>
      </p>
    </main>
  );
}
