# SLC-011 code impact

- `app/`: generic parent entry, client-side auth provider, child home, activity UI, and visual system.
- `convex/`: auth configuration, parent profile, installation, learner home, and attempt ingestion functions.
- `packages/local-data/` and `packages/learning-engine/`: existing durable-attempt contract consumed without changing its public wire shape.
- `public/content/mvp/`: five project-original SVG illustrations.
