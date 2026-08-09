# Curriculum and Content Packs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and package the complete reviewed core curriculum so all mandatory teaching can run without AI or network access.

**Architecture:** Repository-managed YAML/JSON authoring sources pass Zod and deterministic educational validators into immutable versioned pack manifests. Validation is build-time only; Vercel serves approved shared packs, while Convex stores metadata and never turns the pipeline into a runtime CMS.

**Tech Stack:** TypeScript 7.0.2, Zod 4.4.3, Node 24.x build scripts, Vitest 4.1.10, static Vercel assets.

## Global Constraints

- Curriculum authority and source version are recorded before production use; product copy says UK-aligned.
- Core teaching inventory meets every exact PRD §11.3 minimum and remains available offline.
- British English, decodability, answer correctness, asset presence, safety and licence metadata fail closed.
- Historical content/curriculum versions remain immutable; new versions never rewrite attempt history.
- No AI generation is required to build or use the core pack.
- No proprietary phonics, book, font, image or audio asset enters the repository without recorded permission.

---

## Interfaces and data flow

- Produces `proposed:packages/content-schema/src/index.ts:ContentPackManifestSchema -> ZodSchema<ContentPackManifest>`.
- Produces `proposed:packages/validation/src/content.ts:validateContentRepository(input: ContentSourceTree) -> ValidationReport`.
- Produces `proposed:scripts/content/build-packs.ts:buildPacks(input: BuildPackInput) -> Promise<PackBuildResult>`.
- Consumes `activateValidatedPack` from SLC-002.

Source record → schema parse → British-English/phonics/safety/licence/answer/asset validators → deterministic canonical serialization → file hashes → essential/full manifest → preview install test → shared Vercel publication. Failed input produces no candidate manifest.

## Persistence, security and migration

Published packs are immutable by version. Convex stores pack metadata and withdrawal status, not a divergent copy. Pack schema migration creates a new version with compatibility declarations. Build tooling rejects symlinks and paths outside `content/`; licences and attribution travel with assets.

## Observability, deployment and rollback

CI emits validation counts and pack digests without content secrets. Publication copies only manifest-listed files to `public/content/<version>/`. Rollback withdraws the bad version and restores the previous manifest pointer; installed sessions remain pinned unless safety withdrawal requires immediate replacement.

## Documentation evidence

DfE and curriculum sources R1–R9 in the PRD are content authority. Zod/Next/Vercel official fallbacks are recorded in `../000-spec-of-specs/codegraph.md`. ADR-006 and ADR-007 must be accepted.

## Ordered implementation

1. Define content schemas, importers and complete validator harness.
2. Import/review curriculum versions, GPC progression, words, feedback and parent-assisted templates.
3. Import/review sentences, stories, images, audio and tracing formation assets.
4. Build the complete maths template and manipulative inventory.
5. Build, reproduce, install and withdrawal-test essential/full packs.

## Slice verification

Run `npm run test:content && npm exec playwright test tests/e2e/content/core-pack-install.spec.ts`. Expected: exact inventory thresholds met, byte-identical rebuild digests, clean install succeeds and a one-byte corruption is rejected.
