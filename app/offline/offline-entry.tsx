"use client";

import { useState } from "react";
import Link from "next/link";
import { canOpenChildModeOffline, readOfflineAuthorization, requestSafetyLockout } from "../../packages/local-data/src";

export function OfflineEntry() {
  const [lockout, setLockout] = useState(false);
  const [now] = useState(() => Date.now());
  const authorization = typeof window === "undefined" ? null : readOfflineAuthorization({ getItem: (key) => window.localStorage.getItem(key) });
  const parentRoute = typeof window !== "undefined" && (window.location.pathname === "/home" || window.location.pathname === "/onboarding");
  const decision = authorization ? canOpenChildModeOffline({ now: () => now, snapshot: authorization.snapshot, activePack: authorization.activePack, requestedMode: "child" }) : { mode: "denied" as const, reason: "no-snapshot" };
  if (parentRoute || decision.mode !== "child") return <main data-testid="offline-shell"><h1>{parentRoute ? "Parent routes are unavailable offline" : "Child mode is unavailable"}</h1><p data-testid="offline-denial">{parentRoute ? "Reconnect to open parent settings or onboarding." : "This device needs a valid authorised pack before learning can open offline."}</p><Link href="/">Return to the app shell</Link></main>;
  return <main data-testid="offline-child-entry"><h1>Ready for offline learning</h1><p>Your validated child pack is available on this device.</p><p data-testid="offline-parent-denied">Parent settings and onboarding are unavailable offline.</p><button type="button" onClick={() => { setLockout(requestSafetyLockout({ getItem: (key) => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) })); }}>{lockout ? "Microphone disabled" : "Disable microphone"}</button>{lockout && <p data-testid="offline-safety-lockout">Safety lockout saved for online acknowledgement.</p>}</main>;
}
