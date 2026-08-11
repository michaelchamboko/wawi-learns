export const dynamic = "force-static";
export const revalidate = false;

export default function OfflinePage() {
  return (
    <main data-testid="offline-shell">
      <h1>You are offline</h1>
      <p>Wawi Learns will keep the shell available even when the network is unavailable.</p>
    </main>
  );
}
