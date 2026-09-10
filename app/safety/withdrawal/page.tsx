const SCRIPT = String.raw`
(() => {
  const storageKey = 'wawi.safety.withdrawal.harness';
  const snapshot = {
    installationId: 'install-a',
    parentId: 'parent-1',
    childProfileId: 'child-1',
    packVersion: '1.0.0',
    packDigest: 'a'.repeat(64),
    issuedAt: 1700000000000,
  };
  const seedPack = { packVersion: '1.0.0', packDigest: 'a'.repeat(64) };
  const state = {
    withdrawalState: 'open',
    queueState: 'open',
    storageStatus: 'empty',
  };
  const withdrawalEl = document.querySelector('[data-testid="withdrawal-state"]');
  const queueEl = document.querySelector('[data-testid="queue-state"]');
  const storageEl = document.querySelector('[data-testid="storage-status"]');
  const seedButton = document.querySelector('[data-testid="seed-snapshot"]');
  const requestButton = document.querySelector('[data-testid="request-withdrawal"]');
  const ackButton = document.querySelector('[data-testid="acknowledge-withdrawal"]');
  const breakButton = document.querySelector('[data-testid="break-storage"]');

  const loadSnapshot = () => {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  };

  const saveSnapshot = (next) => {
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const render = () => {
    if (withdrawalEl) withdrawalEl.textContent = state.withdrawalState;
    if (queueEl) queueEl.textContent = state.queueState;
    if (storageEl) storageEl.textContent = state.storageStatus;
  };

  seedButton?.addEventListener('click', () => {
    saveSnapshot({ snapshot, pack: seedPack });
    state.storageStatus = 'seeded';
    render();
  });

  requestButton?.addEventListener('click', () => {
    state.withdrawalState = 'pending';
    state.queueState = 'blocked';
    render();
  });

  ackButton?.addEventListener('click', () => {
    state.withdrawalState = 'acknowledged';
    state.queueState = 'blocked';
    render();
  });

  breakButton?.addEventListener('click', () => {
    const before = loadSnapshot();
    const prior = before ? JSON.stringify(before) : null;
    try {
      const next = before ? { ...before, pack: { ...before.pack, packDigest: 'b'.repeat(64) } } : { snapshot, pack: { ...seedPack, packDigest: 'b'.repeat(64) } };
      if (next.pack.packDigest !== snapshot.packDigest) {
        throw new Error('pack mismatch');
      }
      saveSnapshot(next);
    } catch {
      const after = loadSnapshot();
      state.storageStatus = before && after && JSON.stringify(after) === prior ? 'kept' : 'changed';
      render();
      return;
    }
    state.storageStatus = 'changed';
    render();
  });

  render();
})();
`;

export default function WithdrawalPage() {
  return (
    <main className="learner-shell" data-testid="withdrawal-harness">
      <section className="setup-card">
        <h1>Consent withdrawal controls</h1>
        <p data-testid="withdrawal-state">open</p>
        <p data-testid="queue-state">open</p>
        <p data-testid="storage-status">empty</p>
        <button type="button" data-testid="seed-snapshot">
          Seed snapshot
        </button>
        <button type="button" data-testid="request-withdrawal">
          Request withdrawal
        </button>
        <button type="button" data-testid="acknowledge-withdrawal">
          Acknowledge withdrawal
        </button>
        <button type="button" data-testid="break-storage">
          Break storage
        </button>
      </section>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </main>
  );
}
