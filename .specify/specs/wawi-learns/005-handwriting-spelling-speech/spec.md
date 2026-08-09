# SLC-005 — Handwriting, spelling and speech specification

**Requirements:** PRD-FR-012, PRD-FR-013, PRD-FR-014, PRD-FR-015
**Depends on:** SLC-004

## Vertical scope

Extend the adaptive lesson with tile-to-dictation spelling, local adaptive tracing, reviewed `en-GB` audio and consented confidence-based speaking. Each modality supplies only its own evidence, safely degrades when unavailable and never stores raw child audio.

## Acceptance criteria

- **AC-SLC-005-001:** Tracing scores reviewed letter/word/number formations across finger, stylus and mouse while tolerance adapts separately from word knowledge.
- **AC-SLC-005-002:** Spelling progresses from grapheme tiles through missing letters, whole-word typing and dictated phrases/sentences with phonics-linked correction.
- **AC-SLC-005-003:** Audio follows reviewed-core → cached premium → browser fallback, supports all required modes and remains usable offline.
- **AC-SLC-005-004:** Pronunciation uses parent consent, confidence/noise/history signals and accent-fair uncertainty behavior; raw audio is absent from Convex, Vercel, IndexedDB, caches, logs and analytics.
- **AC-SLC-005-005:** Disabled/denied/offline speaking stays unassessed and cannot block unrelated dimensions.

## Non-goals

No medical diagnosis, accent conformity, continuous listening, raw stroke upload by default, handwriting-as-reading evidence or live provider dependency for core learning.
