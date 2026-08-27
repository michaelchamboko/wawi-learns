import type { AttemptDimension } from "../../local-data/src/types";

export type MvpActivityKind =
  | "learn-card"
  | "audio-picture"
  | "picture-word"
  | "trace"
  | "spell"
  | "say-word"
  | "letter-tiles"
  | "mixed-recap";

export type MicrophoneRequirement = "none" | "required";

export interface MvpActivity {
  readonly id: string;
  readonly kind: MvpActivityKind;
  readonly word: string;
  readonly itemId: string;
  readonly image: string;
  readonly prompt: string;
  readonly dimension: AttemptDimension;
  readonly choices?: readonly string[];
  readonly microphone?: MicrophoneRequirement;
}

export const MVP_SESSION_PLAN: readonly MvpActivity[] = [
  {
    id: "learn-cat",
    kind: "learn-card",
    word: "cat",
    itemId: "w-cat",
    image: "/content/mvp/images/cat.svg",
    prompt: "Meet the cat. Tap the speaker, then say cat.",
    dimension: "phonics",
  },
  {
    id: "hear-sun",
    kind: "audio-picture",
    word: "sun",
    itemId: "w-sun",
    image: "/content/mvp/images/sun.svg",
    prompt: "Listen. Which picture says sun?",
    choices: ["sun", "cat", "can"],
    dimension: "phonics",
  },
  {
    id: "read-sit",
    kind: "picture-word",
    word: "sit",
    itemId: "w-sit",
    image: "/content/mvp/images/sit.svg",
    prompt: "Which word matches the picture?",
    choices: ["sat", "sit", "sun"],
    dimension: "reading",
  },
  {
    id: "trace-sat",
    kind: "trace",
    word: "sat",
    itemId: "w-sat",
    image: "/content/mvp/images/sat.svg",
    prompt: "Trace sat with your finger.",
    dimension: "tracing",
  },
  {
    id: "spell-can",
    kind: "spell",
    word: "can",
    itemId: "w-can",
    image: "/content/mvp/images/can.svg",
    prompt: "Spell can.",
    choices: ["c", "a", "n"],
    dimension: "spelling",
  },
  {
    id: "say-cat",
    kind: "say-word",
    word: "cat",
    itemId: "w-cat",
    image: "/content/mvp/images/cat.svg",
    prompt: "Say cat after the sound.",
    dimension: "speech",
    microphone: "required",
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

export const restoredActivityIndex = (savedIndex: string | null): number | null => {
  if (savedIndex === null) return null;
  const parsedIndex = Number.parseInt(savedIndex, 10);
  return Math.min(
    Math.max(Number.isNaN(parsedIndex) ? 0 : parsedIndex, 0),
    MVP_SESSION_PLAN.length - 1,
  );
};
