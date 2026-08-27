/**
 * Reviewed feedback phrases and no-punishment state selection (SLC-004-T004).
 *
 * Feedback is reviewed/project copy only — never comparative, never shaming.
 * The selection rotates through a small reviewed set so the child is not
 * over-praised into a false sense of mastery and is not punished on a miss.
 * All logic is pure and deterministic given the inputs.
 */

export type FeedbackTone = "celebrate" | "encourage" | "retry" | "neutral";

export interface FeedbackSelection {
  readonly message: string;
  readonly tone: FeedbackTone;
  /** Stable reason code for observability (no child text in logs). */
  readonly reason: string;
}

/** Reviewed celebration phrases (PRD-FR-009: warm, specific, never comparative). */
export const CELEBRATE_PHRASES: readonly string[] = [
  "Lovely work!",
  "That's it!",
  "You did it!",
  "Brilliant trying!",
  "Well done!",
];

/** Reviewed retry phrase — no-punishment, never "wrong". */
export const RETRY_PHRASE = "Let's try another way.";

/**
 * Pick a reviewed feedback message. `attemptInARow` rotates through the
 * reviewed celebration phrases so the same phrase is not repeated back-to-back
 * and a long correct run is not inflated with escalating praise (keeps
 * feedback honest). Incorrect attempts always return the no-punishment retry.
 */
export const pickFeedback = (
  result: "correct" | "incorrect",
  attemptInARow: number,
  opts: { celebrate?: readonly string[] } = {},
): FeedbackSelection => {
  const celebrate = opts.celebrate ?? CELEBRATE_PHRASES;
  if (result === "incorrect") {
    return { message: RETRY_PHRASE, tone: "retry", reason: "no-punishment-retry" };
  }
  const index = ((attemptInARow % celebrate.length) + celebrate.length) % celebrate.length;
  const message = celebrate[index] ?? RETRY_PHRASE;
  return { message, tone: "celebrate", reason: "celebrate-rotate" };
};

/**
 * Derive the public status label for an item from a mastery state, without
 * leaking item text. Status vocabulary: introduced | practising | strong | mastered.
 */
export const statusBadge = (
  state: "new" | "learning" | "practising" | "strong" | "mastered" | "relearning",
): "introduced" | "practising" | "strong" | "mastered" => {
  switch (state) {
    case "new":
    case "learning":
    case "relearning":
      return "introduced";
    case "practising":
      return "practising";
    case "strong":
      return "strong";
    case "mastered":
      return "mastered";
  }
};
