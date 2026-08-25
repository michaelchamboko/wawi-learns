# Wawi Learns requirement register

**Authority:** `Wawi Learns PRD.md` v1.0, SHA-256 `e2eced5839b60fbd7047c8605fd03483464dc719f993353ea5846c17acf62257`.

Each grouped ID below is the stable planning identifier. The source column preserves the PRD's finer-grained requirement labels and section boundaries so implementation evidence can trace in both directions.

## Functional requirements

| ID | Source | Requirement summary | Primary slice |
|---|---|---|---|
| PRD-FR-001 | §§10–10.5 | Versioned, DfE-led Reception/Year 1 curriculum, systematic synthetic phonics and British English are the teaching authority. | SLC-003 |
| PRD-FR-002 | §§11–12 | Ship the complete minimum curated inventory and versioned metadata for words, sentences, stories, phonics, maths and assets. | SLC-003 |
| PRD-FR-003 | FR-ONB-01…06 | Secure parent onboarding, exactly one learner profile, adaptive/skip/restart baseline flows and recoverable offline-pack selection. | SLC-002 |
| PRD-FR-004 | FR-CH-01…06 | One-action, voice-led child navigation with separated daily-target states, unlimited continuation and no dead ends. | SLC-004 |
| PRD-FR-005 | FR-ACT-01…15 | Progressively unlock every required English, handwriting, speech, story, maths and mixed-mastery activity. | SLC-004 |
| PRD-FR-006 | §16 | A deterministic, configurable lesson builder schedules new, weak and retained work, rotates demand, preserves positive pacing and audits parent overrides. | SLC-004 |
| PRD-FR-007 | §17 | Track immutable evidence and dimension-specific mastery through New, Learning, Practising, Strong, Mastered and Relearning using multi-day, multi-modal thresholds. | SLC-004 |
| PRD-FR-008 | FR-WEAK-01…06 | Detect weak items, change modality, resurface them at spaced intervals, control backlog and explain the reason to the parent. | SLC-004 |
| PRD-FR-009 | §19 | Give varied positive correction, neutral teaching after errors, guessing control and no learning-time penalties. | SLC-004 |
| PRD-FR-010 | FR-PHON-01…08 | Teach reviewed sounds, blending, segmenting, grapheme units, decodability, exception words and cumulative review. | SLC-004 |
| PRD-FR-011 | FR-READ-01…05 | Progress through controlled sentences, word support, separate comprehension evidence and cautious retelling. | SLC-006 |
| PRD-FR-012 | FR-SPELL-01…05 | Deliver adaptive tile-to-dictation spelling, phonics-linked correction, error analysis and simple composition. | SLC-005 |
| PRD-FR-013 | §23 | Deliver adaptive finger/stylus/mouse tracing for letters, words and numbers using licensed formation assets while keeping raw paths local by default. | SLC-005 |
| PRD-FR-014 | FR-TTS-01…06 | Provide reviewed `en-GB` audio and a human/premium/browser fallback hierarchy with parent controls and complete offline clips. | SLC-005 |
| PRD-FR-015 | §25 | Provide consented, confidence-based, accent-fair pronunciation assessment with ephemeral audio and an unscored offline fallback. | SLC-005 |
| PRD-FR-016 | FR-MATH-01…07 | Cover Reception and Year 1 maths through concrete-pictorial-abstract teaching, worked examples, misconception tracking and varied delayed mastery. | SLC-007 |
| PRD-FR-017 | §27 | Deliver curated and revision-specific parent-approved AI stories with validated comprehension and private-overlay distribution. | SLC-006 |
| PRD-FR-018 | §28 | Keep scheduling/mastery deterministic; run constrained provider calls server-side; validate, cache, cap and safely fall back for all AI use cases. | SLC-006 |
| PRD-FR-019 | FR-IMG-01…04 | Use reviewed, unambiguous, licensed and greyscale-resilient core imagery; gate AI images through validation and parent approval. | SLC-003 |
| PRD-FR-020 | §30 | Provide learning-only collection, building and character rewards without loss, shame or forced streak pressure. | SLC-008 |
| PRD-FR-021 | FR-PAR-01…08 | Provide evidence-backed dashboard detail, overrides, custom packs, assisted activities, consent controls, export and verified deletion. | SLC-008 |
| PRD-FR-022 | §32 | Run every core learner capability offline using atomic versioned stores, append-only idempotent sync, deterministic conflict rules and clear parent sync status. | SLC-002 |
| PRD-FR-023 | §§33–34 | Use a TypeScript/React/Next.js PWA on Vercel with Convex as the sole child-data and provider authority and the specified focused package structure. | SLC-002 |
| PRD-FR-024 | §35 | Enforce child-best-interest privacy, minimum data, versioned consent, no tracking, server-only secrets, retention, withdrawal and child-safe AI. | SLC-009 |
| PRD-FR-025 | §36 | Meet child touch, voice, contrast, motion, caption, focus, hand-preference and accidental-interruption usability requirements. | SLC-009 |
| PRD-FR-026 | §38 | Report educational evidence, not time, and calculate baseline and fortnightly progress only from eligible non-overlapping evidence windows. | SLC-008 |
| PRD-FR-027 | FR-CMS-01…02 | Build a maintainer-only import and validation pipeline; do not create a runtime CMS or content-administrator role. | SLC-003 |
| PRD-FR-028 | §40 | Review every adopted repository/package for licence, maintenance, security, size, PWA/accessibility/privacy and replacement cost. | SLC-001 |
| PRD-FR-029 | FR-AUTH-01…04 | Authenticate the parent, open the single learner directly, lock sensitive parent mode and preserve only authorised child mode offline. | SLC-002 |
| PRD-FR-030 | §42 | Separate local/test/preview/production, require the full PR check set, deploy GitHub previews and approved `main` to Vercel `wawi-learns`, deploy Convex safely and expose version provenance. | SLC-010 |
| PRD-FR-031 | §43 | Implement the complete learning, curriculum, offline, speech, handwriting, AI-safety, usability and Android/Chrome test matrix. | SLC-009 |
| PRD-FR-032 | §44, AC-01…37 | Release only when every Version 1 P0 acceptance criterion has decisive evidence. | SLC-010 |

## Non-functional requirements

| ID | Source | Requirement summary | Primary slice |
|---|---|---|---|
| PRD-NFR-001 | NFR-01 | Meet local feedback, transition, offline-launch, TTS-start and tracing frame-time targets across the release matrix. | SLC-009 |
| PRD-NFR-002 | NFR-02 | Prevent attempt loss, deduplicate sync, exceed 99.5% crash-free private-beta sessions, resume packs and fail safely when AI fails. | SLC-009 |
| PRD-NFR-003 | NFR-03 | Pass every mandatory offline journey after a clean validated pack download. | SLC-009 |
| PRD-NFR-004 | NFR-04 | Scan dependencies/secrets, enforce server authorisation and protected production, verify manifests, CSP and least browser permission, and trace every production deployment. | SLC-009 |
| PRD-NFR-005 | NFR-05 | Use strict TypeScript, boundary schemas, shared domain types and versioned explicit educational rules without hidden prompt authority. | SLC-002 |
| PRD-NFR-006 | NFR-06 | Observe crashes, sync, validation, provider, cost and pack failures without raw audio or unnecessary personal data. | SLC-009 |
| PRD-NFR-007 | NFR-07 | Avoid continuous microphone/background work and repeated downloads; expose pack and mobile-data cost. | SLC-009 |
| PRD-NFR-008 | NFR-08 | Block publication of any curriculum/content item whose validation fails. | SLC-003 |
| PRD-NFR-009 | NFR-09 | Maintain continuous Spark implementation throughput: keep one ACTIVE packet plus up to two READY packets, avoid unnecessary packet-level pauses, and preserve one-task-at-a-time write ownership. | SLC-011 |

## Coverage rule

Every task references at least one ID above and at least one `AC-SLC-*` criterion. `SLC-010` owns the final cross-slice mapping to PRD `AC-01…37`; it does not replace the per-slice acceptance evidence.
