const SCRIPT = String.raw`
(() => {
  const state = {
    circuitOpen: false,
    recentRequestDigest: null,
    lastRequestAt: null,
    budgetReason: 'available',
  };
  const now = 1700000000000;
  const requestDigest = 'provider-request';
  const statusEl = document.querySelector('[data-testid="provider-status"]');
  const fallbackEl = document.querySelector('[data-testid="provider-fallback"]');
  const reasonEl = document.querySelector('[data-testid="budget-reason"]');
  const outageButton = document.querySelector('[data-testid="simulate-outage"]');
  const requestButton = document.querySelector('[data-testid="send-request"]');

  const reserveAiBudget = () => {
    const remaining = 10;
    if (state.circuitOpen) {
      return { allowed: false, reason: 'circuit-open' };
    }
    if (
      state.recentRequestDigest === requestDigest &&
      state.lastRequestAt !== null &&
      now - state.lastRequestAt < 1000
    ) {
      return { allowed: false, reason: 'duplicate-recent' };
    }
    if (state.lastRequestAt !== null && now - state.lastRequestAt < 500) {
      return { allowed: false, reason: 'rate-limited' };
    }
    return { allowed: true, reason: 'ok' };
  };

  const render = () => {
    const decision = reserveAiBudget();
    const status = state.circuitOpen ? 'circuit-open' : decision.allowed ? 'available' : decision.reason;
    if (statusEl) statusEl.textContent = status;
    if (fallbackEl) fallbackEl.textContent = status === 'available' ? 'No fallback needed.' : 'Fallback active while provider work is paused.';
    if (reasonEl) reasonEl.textContent = state.budgetReason;
  };

  outageButton?.addEventListener('click', () => {
    state.circuitOpen = true;
    state.budgetReason = 'circuit-open';
    render();
  });

  requestButton?.addEventListener('click', () => {
    const decision = reserveAiBudget();
    if (decision.allowed) {
      state.recentRequestDigest = requestDigest;
      state.lastRequestAt = now;
      state.budgetReason = 'available';
    } else {
      state.budgetReason = decision.reason;
    }
    render();
  });

  render();
})();
`;

export default function ProviderOutagePage() {
  return (
    <main className="learner-shell" data-testid="provider-outage-harness">
      <section className="setup-card">
        <h1>Provider safety controls</h1>
        <p data-testid="provider-status">available</p>
        <p data-testid="provider-fallback">No fallback needed.</p>
        <p data-testid="budget-reason">available</p>
        <button type="button" data-testid="send-request">
          Send provider request
        </button>
        <button type="button" data-testid="simulate-outage">
          Simulate outage
        </button>
      </section>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </main>
  );
}
