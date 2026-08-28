"use client";

import { useMemo, useState } from "react";
import receptionSeed from "../../content/seed/maths.json";
import { buildMathsActivity, type MathsTemplate, type Representation } from "../../packages/learning-engine/src/maths";

const ALL_MATHS_TEMPLATES = receptionSeed as unknown as readonly MathsTemplate[];

const BASE_NOW = 1_700_000_000_000;

export interface ActivityRendererProps {
  readonly level?: "reception" | "year1";
  readonly testIdPrefix?: string;
  readonly summaryLabel?: string;
  readonly templates?: readonly MathsTemplate[];
}

const filterByLevel = (level: "reception" | "year1") =>
  ALL_MATHS_TEMPLATES.filter((template) => template.level === level);

export const ActivityRenderer = ({
  level = "reception",
  testIdPrefix = "reception-maths",
  summaryLabel = "Reception maths",
  templates,
}: ActivityRendererProps) => {
  const list = useMemo(() => templates ?? filterByLevel(level), [templates, level]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState(false);

  const current = useMemo(() => {
    const template = list[index] ?? list[0]!;
    return buildMathsActivity({
      template,
      seed: index + 1,
      now: BASE_NOW,
      recentRepresentations: list
        .slice(0, index)
        .map((item) => item.representation as Representation),
    });
  }, [index, list]);

  const progressText = `Activity ${Math.min(index + 1, list.length)} of ${list.length}`;

  const advance = () => {
    if (index + 1 >= list.length) {
      setCompleted(true);
      return;
    }
    setIndex((currentIndex) => currentIndex + 1);
    setShowAnswer(false);
  };

  if (completed) {
    return (
      <main className="learner-shell" data-testid={`${testIdPrefix}-complete`}>
        <section className="setup-card">
          <p className="eyebrow">{summaryLabel}</p>
          <h2>All steps are done.</h2>
          <p>Worked examples, practice and delayed recall all stayed offline-friendly.</p>
          <p data-testid={`${testIdPrefix}-summary`}>{list.length} outcomes rehearsed</p>
        </section>
      </main>
    );
  }

  return (
    <main className="learner-shell" data-testid={`${testIdPrefix}-journey`}>
      <section className="home-card">
        <p className="eyebrow">{summaryLabel}</p>
        <h1>Concrete, pictorial, abstract</h1>
        <p data-testid={`${testIdPrefix}-progress`}>{progressText}</p>
        <p>Accuracy and understanding matter more than speed.</p>
        <article className="activity-card" data-testid={`${testIdPrefix}-card`}>
          <p className="progress-label">{current.item.strand}</p>
          <h2>{current.item.prompt}</h2>
          <p data-testid="worked-example">Worked example: {current.workedExample}</p>
          <p data-testid="practice-note">Practice: {current.item.answer}</p>
          <p data-testid="support-strategy">{current.supportStrategy.join(" · ")}</p>
          <div className="form-row">
            <button className="link-button" type="button" onClick={() => setShowAnswer((visible) => !visible)}>
              {showAnswer ? "Hide answer" : "Show answer"}
            </button>
            <button className="primary-button" type="button" onClick={advance}>
              I got it
            </button>
          </div>
          {showAnswer ? <p data-testid={`${testIdPrefix}-answer`}>Answer: {current.item.answer}</p> : null}
        </article>
      </section>
    </main>
  );
};
