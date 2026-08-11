/**
 * Adaptive tracing scorer (SLC-005-T001).
 * Pure function over a sequence of pointer samples; no raw paths leave the
 * renderer. Returns derived scoring components only.
 */
export interface TraceSample {
  readonly x: number;
  readonly y: number;
  readonly pressure?: number;
  readonly timestamp: number;
}

export interface FormationCorridor {
  readonly mask: ReadonlyArray<{ readonly x: number; readonly y: number }>;
  readonly bbox: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
}

export interface TraceTolerance {
  readonly coverageFloor: number;
  readonly corridorFloor: number;
  readonly startFloor: number;
  readonly directionFloor: number;
}

export const DEFAULT_TRACE_TOLERANCE: TraceTolerance = {
  coverageFloor: 0.6,
  corridorFloor: 0.5,
  startFloor: 0.7,
  directionFloor: 0.5,
};

export interface TraceScore {
  readonly coverage: number;
  readonly corridor: number;
  readonly start: number;
  readonly direction: number;
  readonly completion: boolean;
  readonly passed: boolean;
  readonly reason: string;
}

const inBbox = (
  point: { x: number; y: number },
  bbox: FormationCorridor["bbox"],
): boolean =>
  point.x >= bbox.x &&
  point.x <= bbox.x + bbox.width &&
  point.y >= bbox.y &&
  point.y <= bbox.y + bbox.height;

const pointNearMask = (
  point: { x: number; y: number },
  mask: ReadonlyArray<{ x: number; y: number }>,
  tolerance: number,
): boolean => {
  for (const m of mask) {
    const dx = point.x - m.x;
    const dy = point.y - m.y;
    if (Math.sqrt(dx * dx + dy * dy) <= tolerance) return true;
  }
  return false;
};

const COVERAGE_CELL = 12;

export const scoreTrace = (
  samples: readonly TraceSample[],
  formation: FormationCorridor,
  tolerance: TraceTolerance = DEFAULT_TRACE_TOLERANCE,
): TraceScore => {
  if (samples.length < 2) {
    return {
      coverage: 0,
      corridor: 0,
      start: 0,
      direction: 0,
      completion: false,
      passed: false,
      reason: "too-few-samples",
    };
  }

  // Coverage: percent of cells in the bbox that received at least one sample.
  const cells = new Set<string>();
  for (const sample of samples) {
    if (!inBbox(sample, formation.bbox)) continue;
    const cx = Math.floor((sample.x - formation.bbox.x) / COVERAGE_CELL);
    const cy = Math.floor((sample.y - formation.bbox.y) / COVERAGE_CELL);
    cells.add(`${cx}:${cy}`);
  }
  const totalCells =
    Math.ceil(formation.bbox.width / COVERAGE_CELL) *
    Math.ceil(formation.bbox.height / COVERAGE_CELL);
  const coverage = totalCells === 0 ? 0 : cells.size / totalCells;

  // Corridor: percent of samples inside the corridor mask.
  const inside = samples.filter((s) => pointNearMask(s, formation.mask, 16)).length;
  const corridor = inside / samples.length;

  // Start: did the first sample start near the first waypoint?
  const startWaypoint = formation.mask[0];
  const firstSample = samples[0]!;
  const startDistance = startWaypoint
    ? Math.hypot(firstSample.x - startWaypoint.x, firstSample.y - startWaypoint.y)
    : Number.POSITIVE_INFINITY;
  const start = startWaypoint
    ? Math.max(0, 1 - startDistance / 50)
    : 1;

  // Direction: does the average sample-to-sample motion agree with the dominant corridor direction?
  let dx = 0;
  let dy = 0;
  for (let i = 1; i < samples.length; i += 1) {
    dx += samples[i]!.x - samples[i - 1]!.x;
    dy += samples[i]!.y - samples[i - 1]!.y;
  }
  const totalMotion = Math.abs(dx) + Math.abs(dy);
  const direction =
    totalMotion === 0
      ? 0
      : Math.max(Math.abs(dx), Math.abs(dy)) / totalMotion;

  const completion =
    coverage >= tolerance.coverageFloor && corridor >= tolerance.corridorFloor;
  const passed =
    completion &&
    start >= tolerance.startFloor &&
    direction >= tolerance.directionFloor;

  return {
    coverage,
    corridor,
    start,
    direction,
    completion,
    passed,
    reason: passed
      ? "passed"
      : !completion
        ? "below-coverage-or-corridor"
        : start < tolerance.startFloor
          ? "wrong-start"
          : "wrong-direction",
  };
};