"use client";

import Link from "next/link";
import { useState } from "react";

export type AssessmentEstimate = "new" | "some" | "unsure";
export type AssessmentResult = "correct" | "incorrect" | "partial" | "skipped";
export type AssessmentProfile = { _id: string; displayName: string };
export type AssessmentCandidate = { _id: string; status: "open" | "completed" | "incomplete"; targetItems: number; version: number };
export type AssessmentAttempt = { itemId: string; dimension: string; result: string };

type Props = { profile: AssessmentProfile; candidate: AssessmentCandidate | null; attempts: AssessmentAttempt[]; busy: boolean; onStart: (estimate: AssessmentEstimate) => void; onRecord: (candidateId: string, dimension: string, itemId: string, result: AssessmentResult) => void; onSkip: (candidateId: string) => void };

export function AssessmentExperience({ profile, candidate, attempts, busy, onStart, onRecord, onSkip }: Props) {
  const [paused, setPaused] = useState(false);
  if (!candidate) return <main className="learner-shell" data-testid="assessment-start"><section className="setup-card"><p className="eyebrow">A gentle starting point</p><h1>Let&apos;s find the right first steps for {profile.displayName}.</h1><p>There are no grades here. Your estimate only helps choose a starting point.</p><div className="form-row"><button data-testid="estimate-new" className="primary-button" disabled={busy} onClick={() => onStart("new")}>New to this</button><button data-testid="estimate-some" className="secondary-button" disabled={busy} onClick={() => onStart("some")}>Some experience</button><button data-testid="estimate-unsure" className="link-button" disabled={busy} onClick={() => onStart("unsure")}>Not sure</button></div></section></main>;
  if (candidate.status !== "open") return <main className="learner-shell" data-testid="assessment-incomplete"><section className="setup-card"><p className="eyebrow">Assessment saved</p><h1>{candidate.status === "completed" ? "A starting point is ready." : "We can continue when you are ready."}</h1><p>{candidate.status === "completed" ? "This is a starting point, never a label." : "The unfinished assessment stays in your private parent account."}</p><button data-testid="assessment-restart" className="primary-button" disabled={busy} onClick={() => onStart("unsure")}>Start a new assessment</button></section></main>;
  if (paused) return <main className="learner-shell" data-testid="assessment-paused"><section className="setup-card"><p className="eyebrow">Assessment paused</p><h1>Your place is saved.</h1><p>This open assessment can be resumed without losing its history.</p><div className="form-row"><button data-testid="assessment-resume" className="primary-button" onClick={() => setPaused(false)}>Resume assessment</button><button data-testid="assessment-skip" className="link-button" disabled={busy} onClick={() => onSkip(candidate._id)}>Skip assessment</button></div></section></main>;
  const nextNumber = attempts.length + 1;
  const dimension = ["phonics", "spelling", "reading", "maths"][attempts.length % 4]!;
  const itemId = `${dimension}-probe-${nextNumber}`;
  return <main className="learner-shell" data-testid="assessment-session"><section className="setup-card"><p className="progress-label">Step {nextNumber} of {candidate.targetItems}</p><p>Assessment version {candidate.version}</p><h1>Try this {dimension} activity</h1><p>Choose what feels right. You can pause and come back later.</p><div className="form-row"><button data-testid="assessment-attempt" className="primary-button" disabled={busy} onClick={() => onRecord(candidate._id, dimension, itemId, "correct")}>I can try it</button><button className="secondary-button" disabled={busy} onClick={() => onRecord(candidate._id, dimension, itemId, "partial")}>I&apos;m learning this</button><button data-testid="assessment-pause" className="link-button" onClick={() => setPaused(true)}>Pause assessment</button></div></section></main>;
}

export function AssessmentAuthLink() { return <Link className="primary-button" href="/home">Go to parent sign-in</Link>; }
