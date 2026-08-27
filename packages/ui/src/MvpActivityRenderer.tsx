"use client";

import { useState } from "react";
import type { MvpActivity } from "./mvp-session";

export type MicrophoneState = "unknown" | "granted" | "denied";

export interface MvpActivityRendererProps {
  readonly activity: MvpActivity;
  readonly hintCount: number;
  readonly disabled?: boolean;
  readonly onAnswer: (result: "correct" | "incorrect" | "partial") => Promise<void>;
  readonly onHint: () => void;
  readonly onSpeak: (word: string) => void;
  readonly onCancel?: () => void;
  readonly onRequestMicrophone?: () => void;
  readonly microphoneState?: MicrophoneState;
  readonly online?: boolean;
}

const visualFor = (word: string): string => `/content/mvp/images/${word}.svg`;

export function MvpActivityRenderer({
  activity,
  hintCount,
  disabled = false,
  onAnswer,
  onHint,
  onSpeak,
  onCancel,
  onRequestMicrophone,
  microphoneState = "unknown",
  online = true,
}: MvpActivityRendererProps) {
  const [tiles, setTiles] = useState<string[]>([]);
  const isTileActivity = activity.kind === "letter-tiles" || activity.kind === "spell";

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
        <div className="tile-game" aria-label="Build the word" data-testid="spelling-practice">
          <div className="tile-slots" aria-label="Your word">{tiles.length ? tiles.join("") : "Tap the letters"}</div>
          <div className="letter-tiles">
            {(activity.choices ?? [...activity.word]).map((letter, index) => (
              <button className="letter-tile" type="button" key={`${letter}-${index}`} onClick={() => chooseTile(letter)} disabled={disabled || tiles.includes(letter)}>
                {letter}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {activity.kind === "trace" ? (
        <div className="trace-practice" data-testid="tracing-practice" aria-label={`Trace ${activity.word}`}>
          <p>Follow the letters with your finger: <strong>{activity.word}</strong></p>
          <button className="primary-button" type="button" onClick={() => void onAnswer("correct")} disabled={disabled}>
            I traced it
          </button>
        </div>
      ) : null}

      {activity.kind === "say-word" ? (
        <div className="speech-practice" data-testid="speech-practice">
          {!online || microphoneState === "denied" ? (
            <div data-testid="speech-fallback">
              <p>Tap when you have said the word with a grown-up.</p>
              <button className="primary-button" type="button" onClick={() => void onAnswer("partial")} disabled={disabled}>
                I said it
              </button>
            </div>
          ) : microphoneState === "unknown" ? (
            <button className="primary-button" type="button" data-testid="microphone-permission" onClick={onRequestMicrophone} disabled={disabled}>
              Ask to use the microphone
            </button>
          ) : (
            <button className="primary-button" type="button" data-testid="speech-record" onClick={() => void onAnswer("partial")} disabled={disabled}>
              Record my word
            </button>
          )}
          <button className="quiet-button" type="button" data-testid="cancel-activity" onClick={onCancel} disabled={disabled}>
            Pause and try later
          </button>
        </div>
      ) : null}

      <p className="hint-status" aria-live="polite">{hintCount ? `Hint ${hintCount}: listen, look, then try again.` : ""}</p>
    </section>
  );
}
