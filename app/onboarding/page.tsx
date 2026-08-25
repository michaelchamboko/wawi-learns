"use client";

import { useConvexAuth } from "@convex-dev/auth/react";
import { anyApi } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";

export default function AssessmentOnboardingPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const assessment = useQuery(anyApi.assessments.getCurrentAssessment) as {
    profile: { _id: string; displayName: string } | null;
    candidate: { _id: string; status: string; targetItems: number } | null;
    attempts: { itemId: string; dimension: string; result: string }[];
  } | undefined;
  const start = useMutation(anyApi.assessments.startAssessment);
  const record = useMutation(anyApi.assessments.recordAssessmentAttempt);
  const skip = useMutation(anyApi.assessments.skipAssessment);
  const [busy, setBusy] = useState(false);

  if (isLoading || assessment === undefined) return <main className="learner-shell"><section className="setup-card"><p aria-live="polite">Getting the assessment ready…</p></section></main>;
  if (!isAuthenticated) return <main className="learner-shell"><section className="setup-card"><h1>Parent sign-in required</h1><p>This private assessment opens after parent verification.</p><Link className="primary-button" href="/home">Go to parent sign-in</Link></section></main>;
  if (!assessment.profile) return <main className="learner-shell"><section className="setup-card"><h1>Set up the learner first</h1><p>Create the sole learner profile before starting the assessment.</p><Link className="primary-button" href="/home">Set up learner</Link></section></main>;

  const run = async (action: () => Promise<unknown>) => { setBusy(true); try { await action(); } finally { setBusy(false); } };
  if (!assessment.candidate) return <main className="learner-shell" data-testid="assessment-start"><section className="setup-card"><p className="eyebrow">A gentle starting point</p><h1>Let&apos;s find the right first steps for {assessment.profile.displayName}.</h1><p>There are no grades here. Your estimate only helps choose a starting point.</p><div className="form-row"><button className="primary-button" disabled={busy} onClick={() => void run(() => start({ childProfileId: assessment.profile!._id, parentEstimate: "new" }))}>New to this</button><button className="secondary-button" disabled={busy} onClick={() => void run(() => start({ childProfileId: assessment.profile!._id, parentEstimate: "some" }))}>Some experience</button><button className="link-button" disabled={busy} onClick={() => void run(() => start({ childProfileId: assessment.profile!._id, parentEstimate: "unsure" }))}>Not sure</button></div></section></main>;

  if (assessment.candidate.status !== "open") return <main className="learner-shell" data-testid="assessment-incomplete"><section className="setup-card"><p className="eyebrow">Assessment saved</p><h1>{assessment.candidate.status === "completed" ? "A starting point is ready." : "We can continue when you are ready."}</h1><p>{assessment.candidate.status === "completed" ? "This is a starting point, not a grade." : "The unfinished assessment stays in your private parent account."}</p><button className="primary-button" disabled={busy} onClick={() => void run(() => start({ childProfileId: assessment.profile!._id, parentEstimate: "unsure" }))}>Start a new assessment</button></section></main>;

  const nextNumber = assessment.attempts.length + 1;
  const dimension = ["phonics", "spelling", "reading", "maths"][assessment.attempts.length % 4]!;
  const itemId = `${dimension}-probe-${nextNumber}`;
  return <main className="learner-shell" data-testid="assessment-session"><section className="setup-card"><p className="progress-label">Step {nextNumber} of {assessment.candidate.targetItems}</p><h1>Try this {dimension} activity</h1><p>Choose what feels right. You can pause and come back later.</p><div className="form-row"><button className="primary-button" disabled={busy} onClick={() => void run(() => record({ candidateId: assessment.candidate!._id, dimension, itemId, result: "correct" }))}>I can try it</button><button className="secondary-button" disabled={busy} onClick={() => void run(() => record({ candidateId: assessment.candidate!._id, dimension, itemId, result: "partial" }))}>I&apos;m learning this</button><button className="link-button" disabled={busy} onClick={() => void run(() => skip({ candidateId: assessment.candidate!._id }))}>Pause assessment</button></div></section></main>;
}
