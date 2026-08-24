export type MvpActivityKind =
  | "learn-card"
  | "audio-picture"
  | "picture-word"
  | "letter-tiles"
  | "mixed-recap";

export interface MvpActivity {
  readonly id: string;
  readonly kind: MvpActivityKind;
  readonly word: string;
  readonly itemId: string;
  readonly image: string;
  readonly prompt: string;
  readonly choices?: readonly string[];
}

export const MVP_SESSION_PLAN: readonly MvpActivity[] = [
  {
    id: "learn-cat",
    kind: "learn-card",
    word: "cat",
    itemId: "w-cat",
    image: "/content/mvp/images/cat.svg",
    prompt: "Meet the cat. Tap the speaker, then say cat.",
  },
  {
    id: "hear-sun",
    kind: "audio-picture",
    word: "sun",
    itemId: "w-sun",
    image: "/content/mvp/images/sun.svg",
    prompt: "Listen. Which picture says sun?",
    choices: ["sun", "cat", "can"],
  },
  {
    id: "read-sit",
    kind: "picture-word",
    word: "sit",
    itemId: "w-sit",
    image: "/content/mvp/images/sit.svg",
    prompt: "Which word matches the picture?",
    choices: ["sat", "sit", "sun"],
  },
  {
    id: "build-sat",
    kind: "letter-tiles",
    word: "sat",
    itemId: "w-sat",
    image: "/content/mvp/images/sat.svg",
    prompt: "Build the word sat.",
  },
  {
    id: "recap-can",
    kind: "mixed-recap",
    word: "can",
    itemId: "w-can",
    image: "/content/mvp/images/can.svg",
    prompt: "One more. Which word matches the picture?",
    choices: ["can", "cat", "sat"],
  },
];

export const nextActivityIndex = (
  currentIndex: number,
  result: "correct" | "incorrect",
): number | null => {
  if (result === "incorrect") return currentIndex;
  return currentIndex + 1 < MVP_SESSION_PLAN.length ? currentIndex + 1 : null;
};

export const activityProgressLabel = (index: number): string =>
  `Activity ${index + 1} of ${MVP_SESSION_PLAN.length}`;
