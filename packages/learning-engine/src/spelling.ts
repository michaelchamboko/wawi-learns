/**
 * Spelling and composition analysis (SLC-005-T002).
 * Pure function over the typed attempt and the target word. Returns
 * a typed error taxonomy and a phonics-linked correction suggestion.
 */
export interface SpellingTarget {
  readonly spelling: string;
  readonly graphemes: readonly string[];
}

export type SpellingError =
  | "missing-letter"
  | "extra-letter"
  | "wrong-letter"
  | "reversal"
  | "capitalisation";

export interface SpellingAnalysis {
  readonly correct: boolean;
  readonly errors: readonly SpellingError[];
  readonly hint: string;
  readonly hintCount: number;
}

const areEqual = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase();

const isCapitalised = (letter: string): boolean =>
  letter !== letter.toLowerCase();

export const analyseSpelling = (
  input: string,
  target: SpellingTarget,
): SpellingAnalysis => {
  const trimmed = input.trim();
  const targetText = target.spelling;

  if (trimmed.length === targetText.length && areEqual(trimmed, targetText)) {
    // Detect overall capitalisation drift even when lowercased strings match.
    const errors: SpellingError[] = [];
    for (let i = 0; i < trimmed.length; i += 1) {
      if (isCapitalised(trimmed[i]!) !== isCapitalised(targetText[i]!)) {
        errors.push("capitalisation");
      }
    }
    if (errors.length === 0) {
      return { correct: true, errors: [], hint: "great work", hintCount: 0 };
    }
    return {
      correct: false,
      errors,
      hint: "Use lower case unless the word is at the start of a sentence",
      hintCount: errors.length,
    };
  }

  const aChars = Array.from(trimmed);
  const bChars = Array.from(targetText);
  const errors: SpellingError[] = [];
  let hintCount = 0;

  // Greedy left-to-right alignment that prefers matching equal (case-insensitive)
  // characters first; otherwise records the substitution/insertion/deletion.
  let i = 0;
  let j = 0;
  while (i < aChars.length && j < bChars.length) {
    if (areEqual(aChars[i]!, bChars[j]!)) {
      if (isCapitalised(aChars[i]!) !== isCapitalised(bChars[j]!)) {
        errors.push("capitalisation");
      }
      i += 1;
      j += 1;
      continue;
    }
    // Try to find a later match for aChars[i] in bChars (insertion in a).
    let matched = false;
    for (let look = j + 1; look < Math.min(bChars.length, j + 3); look += 1) {
      if (areEqual(aChars[i]!, bChars[look]!)) {
        for (let k = j; k < look; k += 1) {
          errors.push("missing-letter");
          hintCount += 1;
        }
        j = look;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    // No later match → substitution.
    const aLower = aChars[i]!.toLowerCase();
    const bLower = bChars[j]!.toLowerCase();
    const rev = (aLower === "b" && bLower === "d") || (aLower === "d" && bLower === "b");
    errors.push(rev ? "reversal" : "wrong-letter");
    hintCount += 1;
    i += 1;
    j += 1;
  }
  while (i < aChars.length) {
    errors.push("extra-letter");
    hintCount += 1;
    i += 1;
  }
  while (j < bChars.length) {
    errors.push("missing-letter");
    hintCount += 1;
    j += 1;
  }

  const firstGrapheme = target.graphemes[0];
  const hint = firstGrapheme
    ? `Try the first sound: /${firstGrapheme}/`
    : "Look at the first letter";

  return {
    correct: false,
    errors,
    hint,
    hintCount,
  };
};