"use client";

import { useState } from "react";
import { MvpActivityRenderer, type MicrophoneState } from "../../../packages/ui/src/MvpActivityRenderer";
import { MVP_SESSION_PLAN, activityProgressLabel } from "../../../packages/ui/src";
import type { AttemptEvent } from "../../../packages/local-data/src";

type HarnessEvent = Pick<AttemptEvent, "dimension" | "itemId" | "result">;

export function MultimodalHarness() {
  const [index, setIndex] = useState(0);
  const [events, setEvents] = useState<HarnessEvent[]>([]);
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>("unknown");
  const [online, setOnline] = useState(true);
  const activity = MVP_SESSION_PLAN[index];

  const record = async (result: AttemptEvent["result"]) => {
    setEvents((prev) => [...prev, { dimension: activity.dimension, itemId: activity.itemId, result }]);
    setIndex((current) => Math.min(current + 1, MVP_SESSION_PLAN.length - 1));
  };

  return (
    <main className="learner-shell" data-testid="multimodal-harness">
      <div className="session-actions">
        <span className="progress-label" data-testid="activity-progress">{activityProgressLabel(index)}</span>
        <span data-testid="current-dimension">{activity.dimension}</span>
        <button type="button" data-testid="toggle-offline" onClick={() => setOnline((value) => !value)}>
          {online ? "Go offline" : "Go online"}
        </button>
        <button type="button" data-testid="deny-microphone" onClick={() => setMicrophoneState("denied")}>Deny microphone</button>
      </div>
      <MvpActivityRenderer
        activity={activity}
        hintCount={0}
        onHint={() => undefined}
        onSpeak={() => undefined}
        onAnswer={record}
        onCancel={() => undefined}
        onRequestMicrophone={() => setMicrophoneState("granted")}
        microphoneState={microphoneState}
        online={online}
      />
      <output data-testid="attempt-log">{events.map((event) => `${event.dimension}:${event.itemId}:${event.result}`).join("|")}</output>
    </main>
  );
}
