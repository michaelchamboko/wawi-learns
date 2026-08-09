# SLC-004 — Adaptive learner core specification

**Requirements:** PRD-FR-004, PRD-FR-005, PRD-FR-006, PRD-FR-007, PRD-FR-008, PRD-FR-009, PRD-FR-010
**Depends on:** SLC-003

## Vertical scope

Deliver the core learner loop: one clear next action builds a deterministic mixed English lesson from versioned content; attempts commit locally; teaching adapts by dimension and error pattern; delayed, multi-day evidence controls mastery; feedback is positive; and the daily target distinguishes introduced, practising and mastered.

## Acceptance criteria

- **AC-SLC-004-001:** Attempt projection implements every dimension, mastery state and configurable evidence threshold without cross-dimension leakage.
- **AC-SLC-004-002:** Scheduler respects prerequisites, weak-backlog ratios, spaced resurfacing, activity rotation, fatigue signals and audited parent overrides without letting overrides grant evidence.
- **AC-SLC-004-003:** Assessment and fortnightly progress windows report incomplete/insufficient/maintenance/improvement/intervention exactly as PRD §§13 and 38 require.
- **AC-SLC-004-004:** Child home and activity shell are voice-led, one-action, resumable and never dead-end or punish mistakes.
- **AC-SLC-004-005:** Core learn, picture/word, tile, sentence and mixed-mastery activities form an independently playable offline English journey.

## Non-goals

No speech scoring, production tracing, generated stories, full maths, rewards world or parent dashboard beyond diagnostic evidence hooks.
