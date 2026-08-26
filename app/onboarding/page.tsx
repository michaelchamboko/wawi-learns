"use client";

import { useConvexAuth } from "@convex-dev/auth/react";
import { anyApi } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { hasConvexConfiguration } from "../ConvexClientProvider";
import { AssessmentAuthLink, AssessmentExperience, type AssessmentEstimate, type AssessmentResult } from "./assessment-experience";

export default function AssessmentOnboardingPage() {
  if (!hasConvexConfiguration) return <main className="learner-shell" data-testid="parent-setup-required"><section className="setup-card"><p className="eyebrow">Wawi Learns</p><h1>Parent setup is needed.</h1><p>This private assessment opens after the parent connection has been configured.</p><Link className="primary-button" href="/">Back to the parent page</Link></section></main>;
  return <ConfiguredAssessmentOnboardingPage />;
}

function ConfiguredAssessmentOnboardingPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const assessment = useQuery(anyApi.assessments.getCurrentAssessment) as { profile: { _id: string; displayName: string } | null; candidate: { _id: string; status: "open" | "completed" | "incomplete"; targetItems: number; version: number } | null; attempts: { itemId: string; dimension: string; result: string }[] } | undefined;
  const start = useMutation(anyApi.assessments.startAssessment);
  const record = useMutation(anyApi.assessments.recordAssessmentAttempt);
  const skip = useMutation(anyApi.assessments.skipAssessment);
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<unknown>) => { setBusy(true); try { await action(); } finally { setBusy(false); } };
  if (isLoading) return <main className="learner-shell"><section className="setup-card"><p aria-live="polite">Getting the assessment ready…</p></section></main>;
  if (!isAuthenticated) return <main className="learner-shell"><section className="setup-card"><h1>Parent sign-in required</h1><p>This private assessment opens after parent verification.</p><AssessmentAuthLink /></section></main>;
  if (assessment === undefined) return <main className="learner-shell"><section className="setup-card"><p aria-live="polite">Getting the assessment ready…</p></section></main>;
  if (!assessment.profile) return <main className="learner-shell"><section className="setup-card"><h1>Set up the learner first</h1><p>Create the sole learner profile before starting the assessment.</p><Link className="primary-button" href="/home">Set up learner</Link></section></main>;
  return <AssessmentExperience profile={assessment.profile} candidate={assessment.candidate} attempts={assessment.attempts} busy={busy} onStart={(estimate: AssessmentEstimate) => void run(() => start({ childProfileId: assessment.profile!._id, parentEstimate: estimate }))} onRecord={(candidateId: string, dimension: string, itemId: string, result: AssessmentResult) => void run(() => record({ candidateId, dimension, itemId, result }))} onSkip={(candidateId: string) => void run(() => skip({ candidateId }))} />;
}
