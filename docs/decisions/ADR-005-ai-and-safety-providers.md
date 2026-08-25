# ADR-005 — AI and safety providers

- **Status:** accepted
- **Owner slice:** SLC-001-T005
- **Acceptance:** AC-SLC-001-004, AC-SLC-001-005
- **Supersedes:** none

## Decision

V1 routes all child-facing AI through a single paid **OpenRouter** model
policy. Two narrow actions are approved:

- `generateContent(action: "remediation" | "example_sentence" | "parent_summary")`
  with discriminated inputs and constrained JSON schemas validated
  server-side before the response leaves Convex.
- `generateStoryRevision(...)` is gated behind parent approval and the private
  overlay contract; it never publishes into the shared pack cache.

The OpenRouter account is configured with `usage:disabled`, `logging:off`,
`training_opt_in:false` at the account level. This is asserted by a
configuration probe before any action is enabled.

### Why OpenRouter

- OpenRouter aggregates multiple providers behind a single account, so a model
  swap is a single config change without rewriting the action.
- The two chosen models (`openai/gpt-4o-mini`, `anthropic/claude-3.5-haiku`)
  pass the V1 structured-output rubric (deterministic JSON, British English,
  phonics-aware decodability, no name/stable ID in payload).
- The product owner controls billing centrally and can revoke the key in one
  place if a model misbehaves.

### Benchmarks evaluated (synthetic fixtures only)

| Action | Model | Verdict |
|---|---|---|
| Remediation / example sentence | `openai/gpt-4o-mini` | selected |
| Remediation / example sentence | `anthropic/claude-3.5-haiku` | selected (fallback) |
| Remediation / example sentence | `openai/gpt-4o` | rejected (cost) |
| Remediation / example sentence | `meta-llama/llama-3.1-70b-instruct` | rejected (structured output flakiness) |
| Story revision | `anthropic/claude-3.5-sonnet` | selected |
| Story revision | `openai/gpt-4o` | rejected (cost & re-validation) |
| Story image brief | `openai/gpt-4o-mini` | selected (text brief only; image is reviewed asset) |

### Safety rubric

- Every action validates the provider output against a Zod schema; failure
  routes the deterministic curated fallback exactly once with no retry.
- A monthly cap and a circuit breaker enforce PRD NFR-02 and NFR-06; both are
  configurable via Convex env vars (`WAWI_AI_MONTHLY_CAP_USD`,
  `WAWI_AI_CIRCUIT_OPEN_AFTER_FAILURES`).
- The red-team corpus from PRD §43.6 is run in
  `tests/security/ai-red-team.test.ts`. Any new line added to that corpus is
  a recovery trigger.

### Privacy and licence

- AI remains fail-closed and disabled until a hosted configuration probe
  confirms that provider logging and training controls are disabled. The
  local `tests/integration/ai/cost-controls.test.ts` covers budget, circuit
  breaker and dedupe behavior; it does not claim to probe OpenRouter account
  configuration.
- No provider payload, prompt or response is written to operational logs.
  Only aggregate counters (latency, token count, validator outcome) are
  emitted.

## Recovery semantics

- A model deprecation, OpenRouter terms change or incident response
  reopens this task via `action=reopen`. The kill switch disables the
  action while keeping deterministic fallback behaviour intact.

## Rejected alternatives

- **Direct OpenAI / Anthropic SDKs** — rejected because they require two
  separate vendor relationships and two separate kill switches.
- **Self-hosted Llama** — rejected because hosting cost and safety review
  budget exceed the V1 cap.
- **Unconstrained multi-provider abstraction** — rejected because the
  PRD §28 contract requires one provider per use case with documented
  retention settings; an abstraction hides those settings.
