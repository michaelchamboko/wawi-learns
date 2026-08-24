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
      <div className="parent-entry">
        <p className="eyebrow">Wawi Learns</p>
        <h1>A gentle place to practise.</h1>
        <p>Parents start here. Your child&apos;s adventure stays private.</p>
        <a className="primary-button entry-button" href="/home">Parent sign in</a>
      </div>
      <span className="visually-hidden" data-testid="build-identity">
        Version {appVersion} · Build {deployment.gitSha} · Hosted by {deployment.project}
      </span>
    </main>
  );
}
