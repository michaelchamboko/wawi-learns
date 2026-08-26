"use client";

import { useEffect, useState } from "react";
import { canOpenChildModeOffline, OFFLINE_AUTHORIZATION_KEY, persistInstallationSnapshot, prepareEssentialPack, readActivePack, readInstallationSnapshot, readOfflineAuthorization, ESSENTIAL_PACK_DIGEST, ESSENTIAL_PACK_VERSION, type InstallationSnapshot } from "../../packages/local-data/src";

const snapshot: InstallationSnapshot = { installationId: "harness-install", parentId: "parent-1", childProfileId: "child-1", packVersion: ESSENTIAL_PACK_VERSION, packDigest: ESSENTIAL_PACK_DIGEST, issuedAt: Date.now() };

export function OfflineAuthorizationHarness() {
  const [authorized, setAuthorized] = useState(false);
  const [online, setOnline] = useState(true);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update(); window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  const authorize = async () => {
    const storage = { getItem: (key: string) => window.localStorage.getItem(key), setItem: (key: string, value: string) => window.localStorage.setItem(key, value) };
    const pack = await prepareEssentialPack(async (url) => (await fetch(url)).arrayBuffer());
    setAuthorized(pack ? persistInstallationSnapshot(snapshot, pack, storage) : false);
  };
  const enter = () => {
    const stored = readInstallationSnapshot({ getItem: (key: string) => window.localStorage.getItem(key) });
    const pack = readActivePack({ getItem: (key: string) => window.localStorage.getItem(key) });
    setDenied(canOpenChildModeOffline({ now: () => Date.now(), snapshot: stored, activePack: pack, requestedMode: "child" }).mode !== "child");
  };
  const storage = { getItem: (key: string) => window.localStorage.getItem(key), setItem: (key: string, value: string) => window.localStorage.setItem(key, value) };
  const corrupt = () => {
    const pack = readActivePack(storage);
    setDenied(!pack || !persistInstallationSnapshot({ ...snapshot, packDigest: "b".repeat(64) }, pack, storage));
  };
  const revoke = () => {
    const current = readOfflineAuthorization(storage);
    if (current) { storage.setItem(OFFLINE_AUTHORIZATION_KEY, JSON.stringify({ ...current, snapshot: { ...current.snapshot, revokedAt: Date.now() - 1 } })); setDenied(true); }
  };
  const clear = () => { window.localStorage.removeItem(OFFLINE_AUTHORIZATION_KEY); setAuthorized(false); setDenied(true); };
  return <main className="learner-shell" data-testid="offline-harness"><section className="setup-card"><p className="eyebrow">{online ? "Online authorisation" : "Offline child mode"}</p><h1>{denied ? "Child mode unavailable" : authorized ? "Offline access is ready" : "Connect the learner"}</h1><p>{authorized ? "Only the validated child snapshot and essential pack are available offline." : "A parent session must register this installation before child mode can open offline."}</p>{!authorized && <button className="primary-button" data-testid="authorize-offline" onClick={authorize}>Authorise this device</button>}{authorized && <button className="primary-button" data-testid="enter-child-offline" onClick={enter}>Open child mode</button>}{authorized && <><button type="button" data-testid="corrupt-offline-update" onClick={corrupt}>Reject corrupt update</button><button type="button" data-testid="revoke-offline" onClick={revoke}>Revoke authorization</button><button type="button" data-testid="clear-offline" onClick={clear}>Clear authorization</button></>}{!online && authorized && !denied && <p data-testid="offline-child-shell">Child mode open offline.</p>}<p data-testid="parent-route-denied">Parent routes remain unavailable offline.</p></section></main>;
}
