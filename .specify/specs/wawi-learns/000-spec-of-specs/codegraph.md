# Wawi Learns architecture evidence

## Repository observation

- Classification: greenfield.
- Local implementation source: only `Wawi Learns PRD.md` existed at planning intake.
- GitHub: private repository `michaelchamboko/wawi-learns`, created 2026-08-08, empty and without a default branch at inspection time.
- Vercel: existing project `wawi-learns`, project root `.`, Node.js `24.x`, framework preset `Other` before source exists.
- GitNexus: not applicable because there is no implementation graph. Direct tracing records proposed paths and contracts.
- Implementation-tree fingerprint before planning artifacts: `e270a0c06ed2d3359713b84a1084848a3378a03b03722eee699110d3aac4826e`.

## Target architecture

```text
app/                         Next.js App Router child and protected parent routes
public/                      manifest, icons, generated service worker and static shell
packages/ui/                 accessible child/parent primitives
packages/content-schema/     versioned content, pack and generated-content schemas
packages/learning-engine/    pure deterministic scheduling, evidence and mastery
packages/local-data/         IndexedDB, pack/overlay activation and sync queue
packages/tracing/            local stroke capture and scoring
packages/audio/              TTS, microphone and ephemeral speech contracts
packages/validation/         curriculum, safety, decodability and answer validators
convex/                      sole backend schema, auth, queries, mutations and provider actions
content/                     repository-managed curriculum sources and licensed assets
scripts/                     build-time import, validation, security and release evidence
tests/                       unit, integration, content, e2e, offline and device-matrix tests
```

Data flow is deliberately split at one boundary: child activities read/write local stores first; authenticated online reconciliation and every parent-sensitive/provider operation cross into Convex. Vercel never owns child state or private overlays.

## Proposed shared contracts

| Owner | Contract |
|---|---|
| SLC-002 | `proposed:packages/local-data/src/attempts.ts:appendAttempt(event: AttemptEvent) -> Promise<void>` |
| SLC-002 | `proposed:packages/local-data/src/packs.ts:activateValidatedPack(manifest: ContentPackManifest) -> Promise<ActivationResult>` |
| SLC-002 | `proposed:convex/lib/requireParent.ts:requireParent(ctx: QueryCtx|MutationCtx|ActionCtx) -> Promise<ParentContext>` |
| SLC-003 | `proposed:packages/content-schema/src/index.ts:ContentPackManifestSchema -> ZodSchema<ContentPackManifest>` |
| SLC-004 | `proposed:packages/learning-engine/src/nextActivity.ts:selectNextActivity(input: LessonContext) -> ActivityPlan` |
| SLC-004 | `proposed:packages/learning-engine/src/mastery.ts:projectMastery(events: readonly AttemptEvent[], rules: CurriculumRules) -> MasteryProjection` |
| SLC-005 | `proposed:packages/tracing/src/scoreTrace.ts:scoreTrace(input: TraceInput, formation: FormationPath) -> TraceScore` |
| SLC-005 | `proposed:packages/audio/src/speech.ts:scorePronunciation(request: PronunciationRequest) -> Promise<PronunciationOutcome>` |
| SLC-006 | `proposed:packages/validation/src/generatedContent.ts:validateGeneratedRevision(input: GeneratedRevision, rules: ValidationRules) -> ValidationResult` |
| SLC-007 | `proposed:packages/learning-engine/src/maths.ts:buildMathsActivity(input: MathsLessonContext) -> MathsActivityPlan` |
| SLC-008 | `proposed:convex/dashboard.ts:getParentDashboard(args: { childId: Id<"childProfile"> }) -> ParentDashboard` |

## Documentation evidence

Context7 tooling was unavailable in the planning environment, so the required fallback is explicit. Access timestamp for every entry: `2026-08-08T21:38:54Z`.

- `official:https://nextjs.org/docs/app/getting-started/installation@2026-08-08T21:38:54Z`
- `official:https://react.dev/learn/installation@2026-08-08T21:38:54Z`
- `official:https://www.typescriptlang.org/docs/@2026-08-08T21:38:54Z`
- `official:https://docs.convex.dev/quickstart/nextjs@2026-08-08T21:38:54Z`
- `official:https://docs.convex.dev/auth/overview@2026-08-08T21:38:54Z`
- `official:https://docs.convex.dev/functions/actions@2026-08-08T21:38:54Z`
- `official:https://docs.convex.dev/file-storage/overview@2026-08-08T21:38:54Z`
- `official:https://serwist.pages.dev/docs/next/getting-started@2026-08-08T21:38:54Z`
- `official:https://github.com/jakearchibald/idb@2026-08-08T21:38:54Z`
- `official:https://zod.dev/@2026-08-08T21:38:54Z`
- `official:https://vitest.dev/guide/@2026-08-08T21:38:54Z`
- `official:https://playwright.dev/docs/intro@2026-08-08T21:38:54Z`
- `official:https://vercel.com/docs/git/vercel-for-github@2026-08-08T21:38:54Z`

Each implementation task must re-check its dependency evidence when the lockfile changes. Missing authority blocks the task with `missing_documentation_evidence`.
