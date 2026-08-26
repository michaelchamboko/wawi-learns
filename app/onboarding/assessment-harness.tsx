"use client";

import { useState } from "react";
import { AssessmentExperience, type AssessmentAttempt, type AssessmentCandidate, type AssessmentEstimate, type AssessmentResult } from "./assessment-experience";

export function AssessmentHarness() {
  const [candidate, setCandidate] = useState<AssessmentCandidate | null>(null);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [history, setHistory] = useState<AssessmentCandidate[]>([]);
  const start = (estimate: AssessmentEstimate) => {
    void estimate;
    const next = { _id: `candidate-${history.length + 1}`, status: "open" as const, targetItems: 20, version: history.length + 1 };
    setHistory((previous) => [...previous, next]);
    setCandidate(next);
    setAttempts([]);
  };
  const record = (candidateId: string, dimension: string, itemId: string, result: AssessmentResult) => {
    const nextAttempts = [...attempts, { itemId, dimension, result }];
    setAttempts(nextAttempts);
    if (["phonics", "spelling", "reading", "maths"].every((required) => nextAttempts.some((attempt) => attempt.dimension === required))) {
      setCandidate((current) => current && { ...current, status: "completed" });
      setHistory((previous) => previous.map((item) => item._id === candidateId ? { ...item, status: "completed" } : item));
    }
  };
  const skip = (candidateId: string) => {
    setCandidate((current) => current && { ...current, status: "incomplete" });
    setHistory((previous) => previous.map((item) => item._id === candidateId ? { ...item, status: "incomplete" } : item));
  };
  return <AssessmentExperience profile={{ _id: "harness-child", displayName: "Test learner" }} candidate={candidate} attempts={attempts} busy={false} onStart={start} onRecord={record} onSkip={skip} />;
}
