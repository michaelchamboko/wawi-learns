"use client";

import { useCallback, useState } from "react";

interface Props {
  readonly itemId: string;
  readonly spelling: string;
  readonly illustrationUrl: string;
  readonly onCommit: (event: { result: "correct" | "incorrect" | "partial" | "skipped"; hintCount: number }) => void;
}

export function PictureWordActivity({ itemId, spelling, illustrationUrl, onCommit }: Props) {
  const [hintCount, setHintCount] = useState(0);

  const tap = useCallback(
    (result: "correct" | "incorrect" | "partial") => {
      onCommit({ result, hintCount });
    },
    [hintCount, onCommit],
  );

  return (
    <section data-testid="picture-word-activity" data-item-id={itemId}>
      <img src={illustrationUrl} alt="" width={240} height={240} data-testid="picture-word-illustration" />
      <p data-testid="picture-word-spelling">{spelling}</p>
      <button
        type="button"
        data-testid="picture-word-correct"
        onClick={() => tap("correct")}
      >
        I got it
      </button>
      <button
        type="button"
        data-testid="picture-word-help"
        onClick={() => {
          setHintCount((n) => n + 1);
        }}
      >
        Help me
      </button>
      <button
        type="button"
        data-testid="picture-word-incorrect"
        onClick={() => tap("incorrect")}
      >
        I missed it
      </button>
      <p data-testid="picture-word-hint-count" aria-live="polite">
        Hints used: {hintCount}
      </p>
    </section>
  );
}