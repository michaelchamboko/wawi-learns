export type ParentAuthMode = "signIn" | "signUp" | "verify" | "reset" | "resetVerification";

const safeMessages: Record<ParentAuthMode, string> = {
  signIn: "We couldn’t sign you in. Check your details and try again.",
  signUp: "We couldn’t create the account yet. Please try again.",
  verify: "That code could not be confirmed. Check it and try again.",
  reset: "We couldn’t send a reset code. Please try again.",
  resetVerification: "That code could not be confirmed. Check it and try again.",
};

export function parentAuthErrorMessage(mode: ParentAuthMode, reason: unknown): string {
  void reason;
  return safeMessages[mode];
}
