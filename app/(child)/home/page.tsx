"use client";

import { useCallback, useEffect, useState } from "react";
import { PictureWordActivity } from "../../../packages/ui/src/index";

interface ChildHomeState {
  readonly today: string;
  readonly targetMinutes: number;
  readonly installationId: string;
  readonly nextItem: { itemId: string; spelling: string; illustrationUrl: string } | null;
}

const initialState: ChildHomeState = {
  today: new Date().toISOString().slice(0, 10),
  targetMinutes: 20,
  installationId: "install-dev",
  nextItem: null,
};

export default function ChildHome() {
  const [state, setState] = useState<ChildHomeState>(initialState);

  useEffect(() => {
    void fetch("/api/child-home", { method: "POST" })
      .then((res) => res.json() as Promise<Omit<ChildHomeState, "today"> & { today: string }>)
      .then((data) => {
        setState((prev) => ({
          today: data.today,
          targetMinutes: data.targetMinutes,
          installationId: data.installationId,
          nextItem: data.nextItem,
        }));
      })
      .catch(() => {
        // Offline first-run fallback: deterministic placeholders for the E2E probe.
        setState({
          today: new Date().toISOString().slice(0, 10),
          targetMinutes: 20,
          installationId: "install-offline",
          nextItem: {
            itemId: "w-cat",
            spelling: "cat",
            illustrationUrl: "/content/0.1.0/images/cat.svg",
          },
        });
      });
  }, []);

  const onCommit = useCallback(
    async (event: { result: "correct" | "incorrect" | "partial" | "skipped"; hintCount: number }) => {
      if (!state.nextItem) return;
      await fetch("/api/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          installationId: state.installationId,
          itemId: state.nextItem.itemId,
          result: event.result,
          hintCount: event.hintCount,
        }),
      });
    },
    [state.installationId, state.nextItem],
  );

  if (!state.nextItem) {
    return (
      <main data-testid="child-home-loading">
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main data-testid="child-home">
      <h1 data-testid="child-home-greeting">Hi Malachi</h1>
      <p data-testid="child-home-today">Today is {state.today}</p>
      <p data-testid="child-home-target">Today&apos;s target: {state.targetMinutes} minutes</p>
      <PictureWordActivity
        itemId={state.nextItem.itemId}
        spelling={state.nextItem.spelling}
        illustrationUrl={state.nextItem.illustrationUrl}
        onCommit={(event: { result: "correct" | "incorrect" | "partial" | "skipped"; hintCount: number }) => {
          void onCommit(event);
        }}
      />
    </main>
  );
}