export type ParentAuthMode = "signIn" | "signUp" | "verify" | "reset" | "resetVerification";

const safeMessages: Record<ParentAuthMode, string> = {
  signIn: "We couldn't sign you in. Check your details and try again.",
  signUp: "We couldn't create the account yet. Please try again.",
  verify: "That code could not be confirmed. Check it and try again.",
  reset: "We couldn't send a reset code. Please try again.",
  resetVerification: "That code could not be confirmed. Check it and try again.",
};

export function parentAuthErrorMessage(mode: ParentAuthMode, reason: unknown): string {
  const raw = typeof reason === "object" && reason !== null && "message" in reason
    ? (reason as { message: string }).message
    : typeof reason === "string"
      ? reason
      : "";
  
  // Check for specific error patterns
  if (raw.toLowerCase().includes("already exists") || raw.toLowerCase().includes("duplicate")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  
  if (raw.toLowerCase().includes("invalid password") || raw.toLowerCase().includes("wrong password")) {
    return "Incorrect password. Please try again or reset your password.";
  }
  
  if (raw.toLowerCase().includes("not found") || raw.toLowerCase().includes("no account")) {
    return "No account found with this email. Please create an account first.";
  }
  
  const detail = raw
    .replace(/\[Request ID: [^\]]+\]/g, "")
    .replace(/\[CONVEX [^\]]+\]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const suffix = detail ? ` (${detail})` : "";
  return safeMessages[mode] + suffix;
}
