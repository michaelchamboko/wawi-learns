# Private-beta UX MVP implementation plan

Use client-side Convex Auth and direct authenticated Convex functions. The
browser writes an immutable attempt to IndexedDB before moving forward, then
syncs the outbox when connected. Content is a fixed five-item project-original
pack; `speechSynthesis` is fallback playback only.

The task packet preserves existing SLC-002, SLC-003, and SLC-004 acceptance
states. It is a validation-only vertical slice.
