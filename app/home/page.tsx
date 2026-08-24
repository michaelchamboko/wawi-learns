import { readDeploymentIdentity } from "../deployment-identity";

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
      <div>Wawi Learns</div>
    </main>
  );
}