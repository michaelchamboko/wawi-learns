# ADR-006 — Content licensing and source register

- **Status:** accepted
- **Owner slice:** SLC-001-T005
- **Acceptance:** AC-SLC-001-004, AC-SLC-001-005
- **Supersedes:** none

## Decision

V1 curates all curriculum content only from sources whose document-specific
rights are recorded. Attribution-only material is not promoted by default:
verified Crown material under the Open Government Licence v3 (OGL v3) may be
used only with the required attribution and proof recorded in the manifest.
Unverified or incompatible material remains quarantined.

- **CC0 1.0 (Public Domain Dedication)** for words, decodable sentences,
  exception-word lists, GPC sequence metadata and any hand-drawn asset only
  when the source document or project record proves that dedication.
- **OGL v3 with attribution** for verified Crown material, including the
  applicable GOV.UK National Curriculum and Reading Framework material. The
  manifest must carry the source URL, OGL notice/attribution text and proof
  path. This tier is not admitted to a pack until the schema and validator
  support it explicitly.
- **Commercial perpetual licence with proof-of-purchase** for any recorded
  audio, illustration or tracing formation supplied by an external vendor.
  Each record carries the vendor, licence identifier, expiry and the
  proof-of-purchase path inside the manifest.
- **Project-original assets** are released under the repository's default
  licence only when the project authorship and attribution record are present.

### Source register

| Asset type                                    | Approved source                                                  | Licence                                               |
| --------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| GPC sequence and ordering                     | Verified GOV.UK National Curriculum / Reading Framework material | OGL v3 with attribution; document proof required      |
| Word list (Common Exception Words)            | DfE Letters and Sounds source                                    | Quarantined until document-specific rights are proven |
| Word list (Reception / Year 1 high-frequency) | NCELP and legacy/third-party lists                               | Quarantined until document-specific rights are proven |
| Phonics audio                                 | Recorded in-studio, project-original                             | Project release with authorship record                |
| Sentence / story text                         | Project-original                                                 | Project release with authorship record                |
| Illustration                                  | Project-original SVG pack                                        | Project release with authorship record                |
| Tracing formation paths                       | Project-original SVG                                             | Project release with authorship record                |
| Audio narration                               | Azure Speech, retained server-side only                          | commercial (Azure Speech licence)                     |
| Image generation brief                        | OpenRouter `openai/gpt-4o-mini`                                  | commercial (OpenRouter)                               |

### Rejected sources

- **Synthetic-phonics commercial programmes** (e.g. Jolly Phonics, Read Write
  Inc.) — rejected because their terms forbid derivative pack publication.
- **Copyrighted children's books** — rejected because no acceptable licence
  exists for redistribution inside a pack.
- **Stock-image providers with attribution-only licences** — rejected because
  attribution alone is not enforceable across a closed private beta.
- **NCELP, legacy Letters and Sounds and other third-party/republished lists**
  — quarantined because a public URL does not by itself prove redistribution
  rights. No record is promoted until its document-specific licence and
  attribution requirements are verified.

### Compliance check

Every content record carries `licence`, `licenceId`, `sourceUrl`,
`proofPath` (relative to the manifest), and review evidence. The licensing
test rejects unknown or unsupported tiers, including an OGL source before the
explicit OGL schema/validator work in R2. DfE, NCELP, legacy and third-party
items remain quarantined until their document-specific rights are proven; no
corpus review or promotion is implied by this ADR.

## Recovery semantics

- A licence change, a vendor relationship change or a new required asset
  type reopens this task via `action=reopen`.

## Rejected alternatives

- **Allow CC-BY / CC-BY-SA** — rejected because share-alike is incompatible
  with the V1 closed deployment.
- **Buy a one-off commercial licence for an entire curriculum** — rejected
  on cost and on the inability to prove the licence is perpetual across
  all assets.
