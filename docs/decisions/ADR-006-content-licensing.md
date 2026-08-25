# ADR-006 — Content licensing and source register

- **Status:** accepted
- **Owner slice:** SLC-001-T005
- **Acceptance:** AC-SLC-001-004, AC-SLC-001-005
- **Supersedes:** none

## Decision

V1 curates all curriculum content from explicit public-domain or
commercially-licensed sources. No copyleft, share-alike or attribution-only
licence is accepted for V1 because every published asset must be usable in a
closed private-beta without publishing source code. The single approved
licence tier is:

- **CC0 1.0 (Public Domain Dedication)** for words, decodable sentences,
  exception-word lists, GPC sequence metadata and any hand-drawn asset
  produced for the project.
- **Commercial perpetual licence with proof-of-purchase** for any recorded
  audio, illustration or tracing formation supplied by an external vendor.
  Each record carries the vendor, licence identifier, expiry and the
  proof-of-purchase path inside the manifest.
- **Project-original assets** are released under the repository's default
  licence with explicit attribution in the manifest.

### Source register

| Asset type | Approved source | Licence |
|---|---|---|
| GPC sequence and ordering | DfE Letters and Sounds (republished as project-original metadata) | CC0 1.0 |
| Word list (Common Exception Words) | DfE Letters and Sounds CEW list | CC0 1.0 |
| Word list (Reception / Year 1 high-frequency) | Project-curated from DfE and NCELP public lists | CC0 1.0 |
| Phonics audio | Recorded in-studio, project-original | CC0 1.0 (project release) |
| Sentence / story text | Project-original | CC0 1.0 (project release) |
| Illustration | Project-original SVG pack | CC0 1.0 |
| Tracing formation paths | Project-original SVG | CC0 1.0 |
| Audio narration | Azure Speech, retained server-side only | commercial (Azure Speech licence) |
| Image generation brief | OpenRouter `openai/gpt-4o-mini` | commercial (OpenRouter) |

### Rejected sources

- **Synthetic-phonics commercial programmes** (e.g. Jolly Phonics, Read Write
  Inc.) — rejected because their terms forbid derivative pack publication.
- **Copyrighted children's books** — rejected because no acceptable licence
  exists for redistribution inside a pack.
- **Stock-image providers with attribution-only licences** — rejected because
  attribution alone is not enforceable across a closed private beta.

### Compliance check

Every content record carries `licence`, `licenceId`, `sourceUrl`,
`proofPath` (relative to the manifest). A validator
(`tests/content/licensing.test.ts`) rejects the build when any record is
missing one of these fields or references an unknown licence tier.

## Recovery semantics

- A licence change, a vendor relationship change or a new required asset
  type reopens this task via `action=reopen`.

## Rejected alternatives

- **Allow CC-BY / CC-BY-SA** — rejected because share-alike is incompatible
  with the V1 closed deployment.
- **Buy a one-off commercial licence for an entire curriculum** — rejected
  on cost and on the inability to prove the licence is perpetual across
  all assets.
