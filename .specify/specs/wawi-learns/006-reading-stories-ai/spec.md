# SLC-006 — Reading, stories and governed AI specification

**Requirements:** PRD-FR-011, PRD-FR-017, PRD-FR-018, PRD-FR-019
**Depends on:** SLC-005

## Vertical scope

Deliver controlled sentence reading, comprehension and curated stories offline, then add server-side constrained AI remediation, examples, summaries, stories and images. Generated child content is immutable by revision, fail-closed, parent-approved where required and delivered only by an authenticated private overlay.

## Acceptance criteria

- **AC-SLC-006-001:** Reading accuracy and comprehension remain separate; controlled text, word support, retelling and curated reader work offline.
- **AC-SLC-006-002:** Generated revisions follow draft → validation/approval → published/withdrawn transitions; any material edit invalidates validation and approval.
- **AC-SLC-006-003:** OpenRouter/provider actions receive minimum data server-side, never control learning, validate against deterministic evidence/rules and use curated fallback without automatic retry.
- **AC-SLC-006-004:** Approved story/image/custom content is authorised to the exact child/revision and distributed only through the private overlay, never a public Vercel pack/URL.
- **AC-SLC-006-005:** Spend cap, dedupe, cache, timeout, circuit breaker, safety red-team, withdrawal and no-provider journeys pass.

## Non-goals

No free-form child chat, diagnosis, AI scheduling/mastery, automatic story publication, public personalised assets or AI dependency for core learning.
