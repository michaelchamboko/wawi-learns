"use client";

import { useMemo, useState } from "react";
import receptionSeed from "../../content/seed/maths.json";
import { buildMathsActivity, type MathsTemplate, type Representation } from "../../packages/learning-engine/src/maths";

const RECEPTION_TEMPLATES = receptionSeed.filter((template) => template.level === "reception") as unknown as readonly MathsTemplate[];

const BASE_NOW = 1_700_000_000_000;

export const ActivityRenderer = () => {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState(false);

  const current = useMemo(() => {
    const template = RECEPTION_TEMPLATES[index] ?? RECEPTION_TEMPLATES[0]!;
    return buildMathsActivity({
      template,
      seed: index + 1,
      now: BASE_NOW,
      recentRepresentations: RECEPTION_TEMPLATES.slice(0, index).map((item) => item.representation as Representation),
    });
  }, [index]);

  const progressText = `Activity ${Math.min(index + 1, RECEPTION_TEMPLATES.length)} of ${RECEPTION_TEMPLATES.length}`;

  const advance = () => {
    if (index + 1 >= RECEPTION_TEMPLATES.length) {
      setCompleted(true);
      return;
    }
    setIndex((currentIndex) => currentIndex + 1);
    setShowAnswer(false);
  };

  if (completed) {
    return (
      <main className="learner-shell" data-testid="reception-maths-complete">
        <section className="setup-card">
          <p className="eyebrow">Reception maths</p>
          <h2>All thirteen steps are done.</h2>
          <p>Worked examples, practice and delayed recall all stayed offline-friendly.</p>
          <p data-testid="reception-maths-summary">{RECEPTION_TEMPLATES.length} reception outcomes rehearsed</p>
        </section>
      </main>
    );
  }

  return (
    <main className="learner-shell" data-testid="reception-maths-journey">
      <section className="home-card">
        <p className="eyebrow">Reception maths</p>
        <h1>Concrete, pictorial, abstract</h1>
        <p data-testid="reception-maths-progress">{progressText}</p>
        <p>Accuracy and understanding matter more than speed.</p>
        <article className="activity-card" data-testid="reception-maths-card">
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
          {showAnswer ? <p data-testid="reception-answer">Answer: {current.item.answer}</p> : null}
        </article>
      </section>
    </main>
  );
};
