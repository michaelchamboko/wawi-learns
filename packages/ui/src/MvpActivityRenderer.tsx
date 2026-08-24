"use client";

import { useState } from "react";
import type { MvpActivity } from "./mvp-session";

export interface MvpActivityRendererProps {
  readonly activity: MvpActivity;
  readonly hintCount: number;
  readonly disabled?: boolean;
  readonly onAnswer: (result: "correct" | "incorrect") => Promise<void>;
  readonly onHint: () => void;
  readonly onSpeak: (word: string) => void;
}

const visualFor = (word: string): string => `/content/mvp/images/${word}.svg`;

export function MvpActivityRenderer({
  activity,
  hintCount,
  disabled = false,
  onAnswer,
  onHint,
  onSpeak,
}: MvpActivityRendererProps) {
  const [tiles, setTiles] = useState<string[]>([]);
  const isTileActivity = activity.kind === "letter-tiles";

  const choose = (choice: string) => {
    void onAnswer(choice === activity.word ? "correct" : "incorrect");
  };

  const chooseTile = (letter: string) => {
    const next = [...tiles, letter];
    setTiles(next);
    if (next.length !== activity.word.length) return;
    const isCorrect = next.join("") === activity.word;
    void onAnswer(isCorrect ? "correct" : "incorrect");
    if (!isCorrect) setTiles([]);
  };

  return (
    <section className="activity-card" aria-labelledby="activity-prompt" data-testid={`mvp-${activity.kind}`}>
      <div className="activity-toolbar">
        <button className="icon-button" type="button" onClick={() => onSpeak(activity.word)} aria-label={`Hear ${activity.word}`}>
          <span aria-hidden="true">🔊</span>
        </button>
        <button className="quiet-button" type="button" onClick={onHint} disabled={disabled}>
          Help me
        </button>
      </div>
      <p id="activity-prompt" className="activity-prompt">{activity.prompt}</p>
      <img className="activity-illustration" src={activity.image} alt={`Illustration for ${activity.word}`} />

      {activity.kind === "learn-card" ? (
        <button className="primary-button" type="button" onClick={() => void onAnswer("correct")} disabled={disabled}>
          I&apos;m ready
        </button>
      ) : null}

      {activity.kind === "audio-picture" ? (
        <div className="picture-choices" aria-label="Choose a picture">
          {activity.choices?.map((choice) => (
            <button className="picture-choice" type="button" key={choice} onClick={() => choose(choice)} disabled={disabled}>
              <img src={visualFor(choice)} alt={choice} />
            </button>
          ))}
        </div>
      ) : null}

      {(activity.kind === "picture-word" || activity.kind === "mixed-recap") ? (
        <div className="word-choices" aria-label="Choose a word">
          {activity.choices?.map((choice) => (
            <button className="choice-button" type="button" key={choice} onClick={() => choose(choice)} disabled={disabled}>
              {choice}
            </button>
          ))}
        </div>
      ) : null}

      {isTileActivity ? (
        <div className="tile-game" aria-label="Build the word">
          <div className="tile-slots" aria-label="Your word">{tiles.length ? tiles.join("") : "Tap the letters"}</div>
          <div className="letter-tiles">
            {["t", "s", "a"].map((letter, index) => (
              <button className="letter-tile" type="button" key={`${letter}-${index}`} onClick={() => chooseTile(letter)} disabled={disabled || tiles.includes(letter)}>
                {letter}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="hint-status" aria-live="polite">{hintCount ? `Hint ${hintCount}: listen, look, then try again.` : ""}</p>
    </section>
  );
}
