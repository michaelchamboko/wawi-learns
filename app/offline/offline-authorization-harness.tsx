"use client";

import { useEffect, useState } from "react";
import { canOpenChildModeOffline, persistInstallationSnapshot, readInstallationSnapshot, type ActivePackState, type InstallationSnapshot } from "../../packages/local-data/src/offline-auth";

const snapshot: InstallationSnapshot = { installationId: "harness-install", parentId: "parent-1", childProfileId: "child-1", packVersion: "1.0.0", packDigest: "a".repeat(64), issuedAt: Date.now() };
const pack: ActivePackState = { packVersion: "1.0.0", packDigest: "a".repeat(64), essentialAssetUrls: ["/content/entry.json"], complete: true };

export function OfflineAuthorizationHarness() {
  const [authorized, setAuthorized] = useState(false);
  const [online, setOnline] = useState(true);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update(); window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  const authorize = () => {
    const storage = { setItem: (key: string, value: string) => window.localStorage.setItem(key, value) };
    setAuthorized(persistInstallationSnapshot(snapshot, pack, storage));
  };
  const enter = () => {
    const stored = readInstallationSnapshot({ getItem: (key: string) => window.localStorage.getItem(key) });
    setDenied(canOpenChildModeOffline({ now: () => Date.now(), snapshot: stored, activePack: pack, requestedMode: "child" }).mode !== "child");
  };
  return <main className="learner-shell" data-testid="offline-harness"><section className="setup-card"><p className="eyebrow">{online ? "Online authorisation" : "Offline child mode"}</p><h1>{denied ? "Child mode unavailable" : authorized ? "Offline access is ready" : "Connect the learner"}</h1><p>{authorized ? "Only the validated child snapshot and essential pack are available offline." : "A parent session must register this installation before child mode can open offline."}</p>{!authorized && <button className="primary-button" data-testid="authorize-offline" onClick={authorize}>Authorise this device</button>}{authorized && <button className="primary-button" data-testid="enter-child-offline" onClick={enter}>Open child mode</button>}{!online && authorized && !denied && <p data-testid="offline-child-shell">Child mode open offline.</p>}<p data-testid="parent-route-denied">Parent routes remain unavailable offline.</p></section></main>;
}
