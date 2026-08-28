"use client";

import { useState } from "react";
import {
  approveCustomPackRevision,
  buildCustomPackDraft,
  editCustomPackDraft,
  overlayExposesDraft,
  validateAndStampDraft,
  withdrawCustomPackDraft,
  type CustomPackDraft,
} from "../../../packages/learning-engine/src/custom-pack";

const NOW = Date.now();

const seedDraft = (): CustomPackDraft =>
  buildCustomPackDraft({
    id: "pack-harness",
    ownerParentId: "parent-1",
    childProfileId: "child-1",
    theme: "garden adventure",
    items: ["find the cat", "spot the moon", "say the rhyme"],
    now: NOW,
  });

export function CustomPackHarness() {
  const [draft, setDraft] = useState<CustomPackDraft>(seedDraft());
  const [validation, setValidation] = useState<{ ok: boolean; errors: readonly string[] }>({ ok: true, errors: [] });

  const validate = () => {
    const { draft: stamped, validation: result } = validateAndStampDraft(draft, Date.now());
    setDraft(stamped);
    setValidation(result);
  };

  const approve = () => {
    if (!draft.revisionId) return;
    try {
      setDraft(approveCustomPackRevision(draft, draft.revisionId, Date.now()));
      setValidation({ ok: true, errors: [] });
    } catch (error) {
      setValidation({ ok: false, errors: [error instanceof Error ? error.message : "unknown"] });
    }
  };

  const edit = () => {
    setDraft(editCustomPackDraft(draft, ["find the duck", "spot the moon"], Date.now()));
  };

  const withdraw = () => {
    setDraft(withdrawCustomPackDraft(draft, Date.now()));
  };

  return (
    <main className="learner-shell" data-testid="custom-pack-harness">
      <section className="home-card">
        <p className="eyebrow">Custom pack</p>
        <h1>Exact revision approval</h1>
        <p data-testid="custom-pack-status">Status: {draft.status}</p>
        <p data-testid="custom-pack-revision">Revision: {draft.revisionId ?? "—"}</p>
        <p data-testid="custom-pack-overlay" data-active={overlayExposesDraft(draft) ? "true" : "false"}>
          Overlay exposes: {overlayExposesDraft(draft) ? "yes" : "no"}
        </p>
        <p data-testid="custom-pack-validation" data-ok={validation.ok ? "true" : "false"}>
          Validation: {validation.ok ? "ok" : validation.errors.join(", ")}
        </p>
        <p data-testid="custom-pack-items">Items: {draft.items.join(" | ")}</p>
        <div className="form-row">
          <button className="link-button" type="button" onClick={validate} data-testid="custom-pack-validate">
            Validate draft
          </button>
          <button className="link-button" type="button" onClick={approve} data-testid="custom-pack-approve">
            Approve revision
          </button>
          <button className="link-button" type="button" onClick={edit} data-testid="custom-pack-edit">
            Edit approved pack
          </button>
          <button className="link-button" type="button" onClick={withdraw} data-testid="custom-pack-withdraw">
            Withdraw
          </button>
        </div>
      </section>
    </main>
  );
}
