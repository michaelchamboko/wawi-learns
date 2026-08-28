/**
 * Custom pack draft and approval (SLC-008-T004).
 * Parents build a private pack draft; validation produces a revision id.
 * The exact revision id must be approved before the overlay exposes it to
 * the child. Editing after approval invalidates the revision.
 */
import { validateCustomPackDraft, type CustomPackValidationResult } from "./custom-pack-validator";

export type CustomPackStatus = "draft" | "validated" | "approved" | "edited" | "withdrawn";

export interface CustomPackDraft {
  readonly id: string;
  readonly ownerParentId: string;
  readonly childProfileId: string;
  readonly theme: string;
  readonly items: readonly string[];
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly revisionId: string | null;
  readonly status: CustomPackStatus;
  readonly audit: string;
}

export const buildCustomPackDraft = (params: {
  id: string;
  ownerParentId: string;
  childProfileId: string;
  theme: string;
  items: readonly string[];
  now?: number;
}): CustomPackDraft => {
  if (params.items.length === 0) throw new Error("custom-pack:empty");
  if (params.theme.trim().length < 3) throw new Error("custom-pack:theme-too-short");
  return {
    id: params.id,
    ownerParentId: params.ownerParentId,
    childProfileId: params.childProfileId,
    theme: params.theme.trim(),
    items: [...params.items],
    createdAt: params.now ?? Date.now(),
    updatedAt: params.now ?? Date.now(),
    revisionId: null,
    status: "draft",
    audit: "parent-draft",
  };
};

const REVISION_PREFIX = "rev-";

export const revisionIdForDraft = (draft: CustomPackDraft, validatedAt: number): string =>
  `${REVISION_PREFIX}${draft.id}-${validatedAt}`;

export const validateAndStampDraft = (
  draft: CustomPackDraft,
  now: number = Date.now(),
): { draft: CustomPackDraft; validation: CustomPackValidationResult } => {
  if (draft.status === "approved" || draft.status === "withdrawn") {
    return {
      draft,
      validation: { ok: false, errors: [`cannot-validate-${draft.status}`] },
    };
  }
  const validation = validateCustomPackDraft({ theme: draft.theme, items: draft.items });
  if (!validation.ok) {
    return { draft, validation };
  }
  return {
    draft: {
      ...draft,
      status: "validated",
      revisionId: revisionIdForDraft(draft, now),
      updatedAt: now,
    },
    validation,
  };
};

export const approveCustomPackRevision = (
  draft: CustomPackDraft,
  revisionId: string,
  now: number = Date.now(),
): CustomPackDraft => {
  if (draft.status !== "validated") throw new Error(`custom-pack:not-validated:${draft.status}`);
  if (draft.revisionId !== revisionId) throw new Error("custom-pack:revision-mismatch");
  return { ...draft, status: "approved", updatedAt: now };
};

export const editCustomPackDraft = (draft: CustomPackDraft, items: readonly string[], now: number = Date.now()): CustomPackDraft => {
  if (draft.status !== "approved" && draft.status !== "edited") return draft;
  return {
    ...draft,
    items: [...items],
    status: "edited",
    revisionId: null,
    updatedAt: now,
  };
};

export const withdrawCustomPackDraft = (draft: CustomPackDraft, now: number = Date.now()): CustomPackDraft => {
  if (draft.status === "withdrawn") return draft;
  return { ...draft, status: "withdrawn", updatedAt: now };
};

export const overlayExposesDraft = (draft: CustomPackDraft): boolean => draft.status === "approved";
