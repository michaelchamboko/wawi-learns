# SLC-003 code impact

## Consumes

Content-pack activation from SLC-002, ADR-006 licensing and ADR-007 packaging. No learning scheduler changes.

## Creates

- `packages/content-schema/` and `packages/validation/` production implementations.
- `content/curriculum/<version>/`, `content/imports/`, `content/assets/` reviewed sources.
- `scripts/content/import.ts`, `validate.ts`, `build-packs.ts`, `verify-pack.ts`.
- `public/content/<version>/` only as deterministic build output, not manually edited source.
- Content unit/property/e2e fixtures.

## Regression paths

US spelling, unsupported grapheme, duplicate word, non-decodable sentence, wrong answer, missing asset/licence, symlink escape, corrupt hash, incompatible version, withdrawn pack and nondeterministic rebuild.

## Test coverage map

| Acceptance | Evidence |
|---|---|
| AC-SLC-003-001 | `tests/content/schema.test.ts`, `validators.test.ts` |
| AC-SLC-003-002 | `tests/content/english-inventory.test.ts` |
| AC-SLC-003-003 | `tests/content/reading-media-inventory.test.ts` |
| AC-SLC-003-004 | `tests/content/maths-inventory.test.ts` |
| AC-SLC-003-005 | `tests/integration/content/pack-build.test.ts`, `tests/e2e/content/core-pack-install.spec.ts` |
