"use client";

import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { anyApi } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hasConvexConfiguration } from "../ConvexClientProvider";
import { cancelActivityAttempt, commitActivityAttemptThenAdvance, startSession } from "../../packages/learning-engine/src/session";
import { LocalAttemptStore } from "../../packages/local-data/src";
import { canOpenChildModeOffline, persistInstallationSnapshot, prepareEssentialPack, readActivePack, readInstallationSnapshot, type InstallationSnapshot, type SyncReceipt } from "../../packages/local-data/src";
import { MVP_SESSION_PLAN, MvpActivityRenderer, activityProgressLabel, restoredActivityIndex } from "../../packages/ui/src";
import { parentAuthErrorMessage, type ParentAuthMode } from "../(child)/home/parent-auth-errors";
import { OfflineEntry } from "../offline/offline-entry";

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

export default function HomePage() {
  if (typeof navigator !== "undefined" && typeof window !== "undefined" && window.location.pathname === "/home" && !navigator.onLine) return <OfflineEntry />;
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
  const [mode, setMode] = useState<ParentAuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const isReset = mode === "reset";
  const isResetVerification = mode === "resetVerification";
  const isNewPassword = mode === "signUp" || isResetVerification;

  useEffect(() => { headingRef.current?.focus(); }, [mode]);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  const changeMode = (nextMode: ParentAuthMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  const requestReset = async () => {
    await signIn("password", { email: email.trim().toLowerCase(), flow: "reset" });
    setMode("resetVerification");
    setShowPassword(false);
    setSuccess("If an account exists for this email, a reset code will arrive shortly. Check your inbox and spam folder. Use the latest code within 15 minutes.");
  };

  const resendCode = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await requestReset();
    } catch (reason) {
      setError(parentAuthErrorMessage("reset", reason));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    const password = form.get(isResetVerification ? "newPassword" : "password");
    if (isNewPassword && (typeof password !== "string" || password.length < 8)) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (isResetVerification && password !== form.get("confirmPassword")) {
      setError("Your passwords don't match. Enter the same new password in both fields.");
      return;
    }
    form.delete("confirmPassword");
    form.set("email", email.trim().toLowerCase());
    form.set("flow", isResetVerification ? "reset-verification" : mode);
    setBusy(true);
    try {
      if (isReset) {
        await requestReset();
        return;
      }
      await signIn("password", form);
      setSuccess(isResetVerification ? "Password updated. Signing you in..." : "Signing you in...");
    } catch (reason) {
      setError(parentAuthErrorMessage(mode, reason));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="learner-shell auth-shell" data-testid="parent-auth"><section className="auth-card" aria-labelledby="auth-title">
      <p className="eyebrow">Wawi Learns · Parent area</p>
      <h1 id="auth-title" ref={headingRef} tabIndex={-1}>{isReset ? "Forgot your password?" : isResetVerification ? "Set a new password" : mode === "signUp" ? "Create your account" : "Welcome back"}</h1>
      <p>{isReset ? "Enter the email you registered with. We'll send you a code to reset your password." : isResetVerification ? "Enter your email code and choose a new password. Your learning data stays safe." : "Parents manage access. Children do not need an account."}</p>
      <form key={mode} className="auth-form" aria-busy={busy} onSubmit={(event) => void submit(event)}>
        <label>Email<input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" autoCapitalize="none" spellCheck={false} readOnly={isResetVerification} disabled={busy} /></label>
        {isResetVerification ? <><label>Reset code<input name="code" inputMode="numeric" pattern="[0-9]{8}" minLength={8} maxLength={8} required autoComplete="one-time-code" aria-describedby="code-help" disabled={busy} /></label><small id="code-help">Enter the 8-digit code from your latest email.</small></> : null}
        {!isReset ? <>
          <label>{isResetVerification ? "New password" : "Password"}<input name={isResetVerification ? "newPassword" : "password"} type={showPassword ? "text" : "password"} required minLength={isNewPassword ? 8 : undefined} autoComplete={isNewPassword ? "new-password" : "current-password"} aria-describedby={isNewPassword ? "password-help" : undefined} disabled={busy} /></label>
          {isNewPassword ? <small id="password-help">Use at least 8 characters.</small> : null}
          {isResetVerification ? <label>Confirm new password<input name="confirmPassword" type={showPassword ? "text" : "password"} required minLength={8} autoComplete="new-password" disabled={busy} /></label> : null}
          <div className="form-row auth-password-actions">
            <button className="link-button" type="button" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} disabled={busy}>{showPassword ? "Hide password" : "Show password"}</button>
            {mode === "signIn" ? <button className="link-button" type="button" onClick={() => changeMode("reset")} disabled={busy}>Forgot password?</button> : null}
          </div>
        </> : null}
        {error ? <p ref={errorRef} tabIndex={-1} className="form-error" role="alert">{error}</p> : null}
        {success ? <p className="form-success" role="status">{success}</p> : null}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "Please wait…" : isReset ? "Send reset code" : isResetVerification ? "Reset password and sign in" : mode === "signIn" ? "Sign in" : "Create account"}</button>
      </form>
      <div className="form-row auth-navigation">
        {mode === "signIn" ? <button className="link-button" type="button" onClick={() => changeMode("signUp")} disabled={busy}>Create an account</button> : null}
        {mode === "signUp" ? <button className="link-button" type="button" onClick={() => changeMode("reset")} disabled={busy}>Forgot password?</button> : null}
        {isResetVerification ? <><button className="link-button" type="button" onClick={() => void resendCode()} disabled={busy}>Send a new code</button><button className="link-button" type="button" onClick={() => changeMode("reset")} disabled={busy}>Change email</button></> : null}
        {mode !== "signIn" ? <button className="link-button" type="button" onClick={() => changeMode("signIn")} disabled={busy}>Back to sign in</button> : null}
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
  if (!home.profile) return <main className="learner-shell"><section className="setup-card"><p className="eyebrow">One small setup</p><h2>Who is learning today?</h2><p>This name stays in the private parent account.</p><form className="auth-form" onSubmit={(event) => { event.preventDefault(); setCreating(true); setError(""); void createProfile({ displayName: name.trim() }).catch(() => setError("We could not save that yet. Please try again.")).finally(() => setCreating(false)); }}><label>Child&apos;s first name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required /></label>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="primary-button" type="submit" disabled={creating || !name.trim()}>{creating ? "Saving…" : "Start the adventure"}</button></form></section></main>;
  return <MvpLearner profile={home.profile} completedCount={home.completedCount} />;
}

function MvpLearner({ profile, completedCount }: { profile: NonNullable<HomeData["profile"]>; completedCount: number }) {
  const registerInstallation = useMutation(anyApi.installations.registerInstallation);
  const ingestAttempts = useMutation(anyApi.attempts.ingestAttempts);
  const store = useMemo(() => new LocalAttemptStore("wawi-private-beta"), []);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [status, setStatus] = useState("Ready when you are");
  const [offlineAuthorized, setOfflineAuthorized] = useState(false);
  const [microphoneState, setMicrophoneState] = useState<"unknown" | "granted" | "denied">("unknown");
  const [error, setError] = useState("");
  const startedAt = useRef(0);
  const installationId = useRef<string | null>(null);
  const checkpointKey = `wawi:mvp-session:${profile._id}`;

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update); window.addEventListener("offline", update);
    const savedIndex = restoredActivityIndex(window.localStorage.getItem(checkpointKey));
    const savedSnapshot = readInstallationSnapshot({ getItem: (key) => window.localStorage.getItem(key) });
    const restore = window.setTimeout(() => {
      if (savedSnapshot) {
        const activePack = readActivePack({ getItem: (key) => window.localStorage.getItem(key) });
        if (!activePack) return;
        setOfflineAuthorized(canOpenChildModeOffline({ now: () => Date.now(), snapshot: savedSnapshot, activePack, requestedMode: "child" }).mode === "child");
      }
      if (savedIndex !== null) { setIndex(savedIndex); setStarted(true); startedAt.current = Date.now(); }
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
    if (!navigator.onLine) { if (offlineAuthorized) { setStarted(true); startedAt.current = Date.now(); } else setError("Reconnect to start today’s adventure."); return; }
    try { const id = installationIdFor(profile._id); const registered = await registerInstallation({ installationId: id }) as InstallationSnapshot; const activePack = await prepareEssentialPack(async (url) => (await fetch(url)).arrayBuffer()); const storage = { getItem: (key: string) => window.localStorage.getItem(key), setItem: (key: string, value: string) => window.localStorage.setItem(key, value) }; if (!activePack || activePack.packDigest !== registered.packDigest || activePack.packVersion !== registered.packVersion || !persistInstallationSnapshot(registered, activePack, storage) || canOpenChildModeOffline({ now: () => Date.now(), snapshot: registered, activePack, requestedMode: "child" }).mode !== "child") throw new Error("pack validation failed"); installationId.current = id; setOfflineAuthorized(true); setStarted(true); startedAt.current = Date.now(); }
    catch { setError("We could not start just yet. Please try again."); }
  };

  const answer = async (result: "correct" | "incorrect" | "partial") => {
    const activity = MVP_SESSION_PLAN[index];
    const id = installationId.current ?? installationIdFor(profile._id);
    installationId.current = id;
    const base = { eventId: newEventId(), occurredAt: Date.now(), durationMs: Date.now() - startedAt.current, result, hintCount };
    try {
      const state = startSession(profile._id, id, clientVersion, { itemId: activity.itemId, dimension: activity.dimension, modality: activity.kind });
      const outcome = await commitActivityAttemptThenAdvance(state, activity, base, { appendAttempt: (event) => store.appendAttempt(event), now: () => Date.now() });
      if (!outcome.advance) throw new Error(outcome.nextState.lastError ?? "save-failed");
      await syncNow(); setFeedback(result === "correct" ? "correct" : "retry");
    } catch { setError("We need a grown-up to check this device before we continue."); }
  };

  const advance = () => {
    if (index + 1 >= MVP_SESSION_PLAN.length) { window.localStorage.removeItem(checkpointKey); setStarted(false); setIndex(0); setFeedback(null); setStatus("Adventure complete"); return; }
    const next = index + 1; window.localStorage.setItem(checkpointKey, String(next)); setIndex(next); setHintCount(0); setFeedback(null); startedAt.current = Date.now();
  };

  const cancelCurrentActivity = () => {
    const activity = MVP_SESSION_PLAN[index];
    const id = installationId.current ?? installationIdFor(profile._id);
    const state = startSession(profile._id, id, clientVersion, { itemId: activity.itemId, dimension: activity.dimension, modality: activity.kind });
    cancelActivityAttempt(state, activity, microphoneState === "denied" ? "microphone-denied" : !online ? "offline" : "child-cancelled");
    setStarted(false);
    setFeedback(null);
    setStatus("Paused — no attempt recorded");
  };

  const requestMicrophone = async () => {
    try {
      const permission = await navigator.permissions?.query?.({ name: "microphone" as PermissionName });
      setMicrophoneState(permission?.state === "denied" ? "denied" : "granted");
    } catch {
      setMicrophoneState("denied");
    }
  };

  if (!online && !started && !offlineAuthorized) return <main className="learner-shell"><section className="reconnect-card"><h2>Let’s reconnect first.</h2><p>Your open adventure is safe. Come back online to continue.</p></section></main>;
  if (!started && status === "Adventure complete") return <main className="learner-shell"><section className="completion-card"><p className="eyebrow">Adventure complete</p><h2>You did six brilliant steps.</h2><div className="stars" aria-label="Six trail tokens">🍃 🍃 🍃 🍃 🍃 🍃</div><p>Every try helps your learning grow.</p><button className="primary-button" type="button" onClick={() => setStatus("Ready when you are")}>Back home</button></section></main>;
  if (!started) return <main className="learner-shell" data-testid="child-home"><header className="learner-header"><div><p className="eyebrow">Wawi Learns</p><h1>Hi {profile.displayName}</h1></div><span className="connection-status">{online ? status : "Saved on this device"}</span></header><section className="home-card"><p className="progress-label">Today&apos;s adventure</p><h2>Six small steps, one big smile.</h2><p>Listen, look, tap, trace, spell and say at your own pace.</p><div className="trail" aria-label={`${completedCount} activities completed today`}>{[1, 2, 3, 4, 5, 6].map((step) => <span key={step} className={step <= completedCount ? "trail-token done" : "trail-token"}>{step}</span>)}</div><button className="primary-button" type="button" onClick={() => void start()}>Continue My Adventure <span aria-hidden="true">→</span></button>{error ? <p className="form-error" role="alert">{error}</p> : null}</section></main>;
  const activity = MVP_SESSION_PLAN[index];
  return <main className="learner-shell" data-testid="mvp-session"><div className="session-actions"><span className="progress-label">{activityProgressLabel(index)}</span><button className="link-button" type="button" onClick={() => setStarted(false)}>Pause and go home</button></div><MvpActivityRenderer activity={activity} hintCount={hintCount} disabled={feedback !== null} onHint={() => setHintCount((count) => count + 1)} onSpeak={speak} onAnswer={answer} onCancel={cancelCurrentActivity} onRequestMicrophone={() => void requestMicrophone()} microphoneState={microphoneState} online={online} />{feedback === "correct" ? <div className="feedback correct" role="status">Lovely work!<br /><button className="primary-button" type="button" onClick={advance}>{index + 1 === MVP_SESSION_PLAN.length ? "Finish adventure" : "Next step"}</button></div> : null}{feedback === "retry" ? <div className="feedback retry" role="status">Let&apos;s try another way.<br /><button className="primary-button" type="button" onClick={() => setFeedback(null)}>Try again</button></div> : null}{error ? <p className="form-error" role="alert">{error}</p> : null}</main>;
}

function LoadingShell({ label }: { label: string }) { return <main className="learner-shell"><section className="setup-card"><p aria-live="polite">{label}</p></section></main>; }
