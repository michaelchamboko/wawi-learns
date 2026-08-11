# ADR-004 — Tracing renderer

- **Status:** accepted
- **Owner slice:** SLC-001-T004
- **Acceptance:** AC-SLC-001-004, AC-SLC-001-005
- **Supersedes:** none

## Decision

V1 uses a **custom perfect-freehand pointer-event tracer** rendered to an
HTML5 Canvas with no third-party tracing library. The tracer captures
`pointerdown / pointermove / pointerup` events (touch, stylus, mouse) and
scores locally.

### Spike boundary

- `scoreTrace(input, formationPath): TraceScore` computes five components:
  coverage (percent of path cells visited), corridor (percent of samples
  inside the corridor mask), start, direction and order. Lifts and completion
  are reported but never grade a stroke.
- A tolerance ladder is curriculum-controlled: Reception allows larger
  corridors and lower coverage thresholds; Year 1 tightens both. The ladder
  is config-driven so an ADR bump does not require a code change.
- Raw pointer paths are kept in memory only for the duration of a single
  activity. They are never written to IndexedDB, Convex or telemetry.

### Benchmarks evaluated

| Candidate | Bundle | Maintenance | Replacement cost | Verdict |
|---|---|---|---|---|
| Custom pointer-event tracer | ~6 KB | In-repo | rewrite tracer | **selected** |
| `perfect-freehand` library | ~12 KB | Library | library rewrite | rejected (added dependency for a one-feature use) |
| `pressure.js` | ~4 KB | Library | drop and inline | rejected (no pressure for finger; not needed) |
| SVG path following | n/a | n/a | n/a | rejected (no live stroke feedback) |

### Why custom

- The tracer has to score a single stroke across curriculum-defined
  formation paths with a tolerance ladder. No off-the-shelf library covers
  all five components while letting us keep raw paths ephemeral.
- A six-kilobyte implementation keeps the trace budget well below the PRD
  NFR-01 60 fps frame target on Android 13.
- All scoring logic is deterministic and unit-tested; no third-party API
  surface can change without warning.

### Privacy and licence

- The renderer is in-repo code; no licence or privacy risk beyond the
  repository's standard policy.

## Recovery semantics

- A pointer-event API change (e.g. Safari Webkit regression), tolerance
  contract change or curriculum rule change reopens this task via
  `action=reopen`.

## Rejected alternatives

- **`perfect-freehand` library** — rejected because the V1 scoring rubric is
  curriculum-specific and importing a library only for the bezier
  approximation is more code than writing the small tracer directly.
- **`pressure.js` + perfect-freehand** — rejected for the same reason; pressure
  is not part of the scoring rubric for V1.