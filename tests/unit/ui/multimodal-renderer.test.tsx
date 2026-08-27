import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MvpActivityRenderer } from "../../../packages/ui/src/MvpActivityRenderer";
import type { MvpActivity } from "../../../packages/ui/src/mvp-session";

const speechActivity: MvpActivity = {
  id: "say-cat",
  kind: "say-word",
  word: "cat",
  itemId: "w-cat",
  image: "/content/mvp/images/cat.svg",
  prompt: "Say cat after the sound.",
  dimension: "speech",
  microphone: "required",
};

const render = (activity: MvpActivity, over: Partial<Parameters<typeof MvpActivityRenderer>[0]> = {}) =>
  renderToStaticMarkup(
    <MvpActivityRenderer
      activity={activity}
      hintCount={0}
      onAnswer={vi.fn()}
      onHint={vi.fn()}
      onSpeak={vi.fn()}
      onCancel={vi.fn()}
      microphoneState="unknown"
      online={true}
      {...over}
    />,
  );

describe("SLC-005-T005 — multimodal renderer behaviours", () => {
  it("renders a child-safe microphone permission action before speech practice", () => {
    const html = render(speechActivity, { microphoneState: "unknown" });
    expect(html).toContain("data-testid=\"microphone-permission\"");
    expect(html).toContain("Ask to use the microphone");
    expect(html).not.toContain("data-testid=\"speech-result-correct\"");
  });

  it("uses deterministic fallback practice when microphone permission is denied", () => {
    const html = render(speechActivity, { microphoneState: "denied" });
    expect(html).toContain("data-testid=\"speech-fallback\"");
    expect(html).toContain("Tap when you have said the word with a grown-up");
  });

  it("uses offline fallback practice instead of requesting the microphone offline", () => {
    const html = render(speechActivity, { online: false, microphoneState: "granted" });
    expect(html).toContain("data-testid=\"speech-fallback\"");
    expect(html).not.toContain("microphone-permission");
  });

  it("offers a cancel action without recording an attempt", () => {
    const html = render(speechActivity, { microphoneState: "granted" });
    expect(html).toContain("data-testid=\"cancel-activity\"");
    expect(html).toContain("Pause and try later");
  });
});
