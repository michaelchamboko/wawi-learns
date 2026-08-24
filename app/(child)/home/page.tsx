"use client";

import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { anyApi } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hasConvexConfiguration } from "../../ConvexClientProvider";
import { commitAttemptThenAdvance, startSession } from "../../../packages/learning-engine/src/session";
import { LocalAttemptStore } from "../../../packages/local-data/src";
import type { AttemptEvent, SyncReceipt } from "../../../packages/local-data/src";
import { MVP_SESSION_PLAN, MvpActivityRenderer, activityProgressLabel } from "../../../packages/ui/src";

type HomeData = { readonly profile: { readonly _id: string; readonly displayName: string } | null; readonly completedCount: number };
type Feedback = "correct" | "retry" | null;
const clientVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";

const newEventId = (): string => typeof crypto !== "undefined" && "randomUUID" in crypto
  ? crypto.randomUUID()
  : `attempt-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const installationIdFor = (profileId: string): string => {
  const key = `wawi:mvp-installation:${profileId}`;
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = `web-${newEventId()}`;
  window.localStorage.setItem(key, created);
  return created;
};

const speak = (word: string) => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-GB";
  window.speechSynthesis.speak(utterance);
};

export default function ChildHome() {
  if (!hasConvexConfiguration) return <ParentSetupRequired />;
  return <AuthenticatedChildHome />;
}

function ParentSetupRequired() {
  return <main className="learner-shell" data-testid="parent-setup-required"><section className="setup-card"><p className="eyebrow">Wawi Learns</p><h1>Parent setup is needed.</h1><p>This private beta opens after the parent connection has been configured.</p><Link className="primary-button" href="/">Back to the parent page</Link></section></main>;
}

function AuthenticatedChildHome() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  if (isLoading) return <LoadingShell label="Getting your adventure ready…" />;
  if (!isAuthenticated) return <ParentAuth />;
  return <LearnerHome />;
}

function ParentAuth() {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<"signIn" | "signUp" | "verify" | "reset" | "resetVerification">("signIn");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isVerification = mode === "verify" || mode === "resetVerification";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    form.set("email", email);
    form.set("flow", mode === "verify" ? "email-verification" : mode === "resetVerification" ? "reset-verification" : mode);
    try {
      await signIn("password", form);
      if (mode === "signUp") setMode("verify");
      if (mode === "reset") setMode("resetVerification");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Please check the details and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="learner-shell" data-testid="parent-auth"><section className="auth-card">
      <p className="eyebrow">Parent area</p><h1>{mode === "signUp" ? "Create your account" : mode === "verify" ? "Check your email" : mode === "reset" || mode === "resetVerification" ? "Reset your password" : "Welcome back"}</h1>
      <p>Parents manage access. Children do not need an account.</p>
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <label>Email<input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
        {!isVerification && mode !== "reset" ? <label>Password<input name="password" type="password" required autoComplete={mode === "signUp" ? "new-password" : "current-password"} /></label> : null}
        {isVerification ? <label>Code<input name="code" inputMode="numeric" required autoComplete="one-time-code" /></label> : null}
        {mode === "resetVerification" ? <label>New password<input name="newPassword" type="password" required autoComplete="new-password" /></label> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signIn" ? "Sign in" : mode === "signUp" ? "Create account" : mode === "reset" ? "Send code" : "Continue"}</button>
      </form>
      <div className="form-row">
        {mode === "signIn" ? <button className="link-button" type="button" onClick={() => setMode("signUp")}>Create an account</button> : null}
        {mode === "signIn" ? <button className="link-button" type="button" onClick={() => setMode("reset")}>Forgot password?</button> : null}
        {mode !== "signIn" ? <button className="link-button" type="button" onClick={() => setMode("signIn")}>Back to sign in</button> : null}
      </div>
    </section></main>
  );
}

function LearnerHome() {
  const home = useQuery(anyApi.learner.getCurrentLearnerHome) as HomeData | undefined;
  const createProfile = useMutation(anyApi.childProfiles.createOnlyChildProfile);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  if (home === undefined) return <LoadingShell label="Getting your adventure ready…" />;
  if (!home.profile) return <main className="learner-shell"><section className="setup-card"><p className="eyebrow">One small setup</p><h2>Who is learning today?</h2><p>This name stays in the private parent account.</p><form className="auth-form" onSubmit={(event) => { event.preventDefault(); setCreating(true); setError(""); void createProfile({ displayName: name.trim() }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "We could not save that yet.")).finally(() => setCreating(false)); }}><label>Child&apos;s first name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required /></label>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="primary-button" type="submit" disabled={creating || !name.trim()}>{creating ? "Saving…" : "Start the adventure"}</button></form></section></main>;
  return <MvpLearner profile={home.profile} completedCount={home.completedCount} />;
}

function MvpLearner({ profile, completedCount }: { profile: NonNullable<HomeData["profile"]>; completedCount: number }) {
  const registerInstallation = useMutation(anyApi.installations.registerInstallation);
  const ingestAttempts = useMutation(anyApi.attempts.ingestAttempts);
  const store = useMemo(() => new LocalAttemptStore("wawi-private-beta"), []);
  const [online, setOnline] = useState(true);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [status, setStatus] = useState("Ready when you are");
  const [error, setError] = useState("");
  const startedAt = useRef(0);
  const installationId = useRef<string | null>(null);
  const checkpointKey = `wawi:mvp-session:${profile._id}`;

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update); window.addEventListener("offline", update);
    const savedIndex = window.localStorage.getItem(checkpointKey);
    const restore = window.setTimeout(() => {
      if (savedIndex !== null && navigator.onLine) { setIndex(Math.min(Number(savedIndex) || 0, MVP_SESSION_PLAN.length - 1)); setStarted(true); }
    }, 0);
    return () => { window.clearTimeout(restore); window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, [checkpointKey]);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) { setStatus("Saved here — we’ll sync when you’re back online"); return; }
    const batch = await store.nextSyncBatch(25);
    if (!batch.length) return;
    setStatus("Saving your progress…");
    try { const receipt = await ingestAttempts({ events: batch }) as SyncReceipt; await store.acknowledgeSync(receipt); setStatus("Progress saved"); }
    catch { setStatus("Saved here — we’ll try again soon"); }
  }, [ingestAttempts, store]);

  useEffect(() => {
    if (!online) return;
    const syncTimer = window.setTimeout(() => void syncNow(), 0);
    return () => window.clearTimeout(syncTimer);
  }, [online, syncNow]);

  const start = async () => {
    setError("");
    if (!navigator.onLine) { setError("Reconnect to start today’s adventure."); return; }
    try { const id = installationIdFor(profile._id); await registerInstallation({ installationId: id }); installationId.current = id; setStarted(true); startedAt.current = Date.now(); }
    catch { setError("We could not start just yet. Please try again."); }
  };

  const answer = async (result: "correct" | "incorrect") => {
    const activity = MVP_SESSION_PLAN[index];
    const id = installationId.current ?? installationIdFor(profile._id);
    installationId.current = id;
    const base = { eventId: newEventId(), installationId: id, occurredAt: Date.now(), durationMs: Date.now() - startedAt.current, dimension: "phonics" as const, itemId: activity.itemId, result, hintCount, clientVersion };
    try {
      if (result === "correct") {
        const state = startSession(profile._id, id, clientVersion, { itemId: activity.itemId, dimension: "phonics", modality: activity.kind });
        const outcome = await commitAttemptThenAdvance(state, base, { appendAttempt: (event) => store.appendAttempt(event), now: () => Date.now() });
        if (!outcome.advance) throw new Error(outcome.nextState.lastError ?? "save-failed");
      } else await store.appendAttempt({ ...base, sourceSequence: 0, recordedAt: Date.now() } as AttemptEvent);
      await syncNow(); setFeedback(result === "correct" ? "correct" : "retry");
    } catch { setError("We need a grown-up to check this device before we continue."); }
  };

  const advance = () => {
    if (index + 1 >= MVP_SESSION_PLAN.length) { window.localStorage.removeItem(checkpointKey); setStarted(false); setIndex(0); setFeedback(null); setStatus("Adventure complete"); return; }
    const next = index + 1; window.localStorage.setItem(checkpointKey, String(next)); setIndex(next); setHintCount(0); setFeedback(null); startedAt.current = Date.now();
  };

  if (!online && !started) return <main className="learner-shell"><section className="reconnect-card"><h2>Let’s reconnect first.</h2><p>Your open adventure is safe. Come back online to continue.</p></section></main>;
  if (!started && status === "Adventure complete") return <main className="learner-shell"><section className="completion-card"><p className="eyebrow">Adventure complete</p><h2>You did five brilliant steps.</h2><div className="stars" aria-label="Five trail tokens">🍃 🍃 🍃 🍃 🍃</div><p>Every try helps your learning grow.</p><button className="primary-button" type="button" onClick={() => setStatus("Ready when you are")}>Back home</button></section></main>;
  if (!started) return <main className="learner-shell" data-testid="child-home"><header className="learner-header"><div><p className="eyebrow">Wawi Learns</p><h1>Hi {profile.displayName}</h1></div><span className="connection-status">{online ? status : "Saved on this device"}</span></header><section className="home-card"><p className="progress-label">Today&apos;s adventure</p><h2>Five small steps, one big smile.</h2><p>Listen, look, tap and build at your own pace.</p><div className="trail" aria-label={`${completedCount} activities completed today`}>{[1, 2, 3, 4, 5].map((step) => <span key={step} className={step <= completedCount ? "trail-token done" : "trail-token"}>{step}</span>)}</div><button className="primary-button" type="button" onClick={() => void start()}>Continue My Adventure <span aria-hidden="true">→</span></button>{error ? <p className="form-error" role="alert">{error}</p> : null}</section></main>;
  const activity = MVP_SESSION_PLAN[index];
  return <main className="learner-shell" data-testid="mvp-session"><div className="session-actions"><span className="progress-label">{activityProgressLabel(index)}</span><button className="link-button" type="button" onClick={() => setStarted(false)}>Pause and go home</button></div><MvpActivityRenderer activity={activity} hintCount={hintCount} disabled={feedback !== null} onHint={() => setHintCount((count) => count + 1)} onSpeak={speak} onAnswer={answer} />{feedback === "correct" ? <div className="feedback correct" role="status">Lovely work!<br /><button className="primary-button" type="button" onClick={advance}>{index + 1 === MVP_SESSION_PLAN.length ? "Finish adventure" : "Next step"}</button></div> : null}{feedback === "retry" ? <div className="feedback retry" role="status">Let&apos;s try another way.<br /><button className="primary-button" type="button" onClick={() => setFeedback(null)}>Try again</button></div> : null}{error ? <p className="form-error" role="alert">{error}</p> : null}</main>;
}

function LoadingShell({ label }: { label: string }) { return <main className="learner-shell"><section className="setup-card"><p aria-live="polite">{label}</p></section></main>; }
