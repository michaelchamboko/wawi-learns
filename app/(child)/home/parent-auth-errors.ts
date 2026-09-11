export type ParentAuthMode = "signIn" | "signUp" | "verify" | "reset" | "resetVerification";

const safeMessages: Record<ParentAuthMode, string> = {
  signIn: "We couldn't sign you in. Check your connection and try again. If you've forgotten your password, choose Forgot password.",
  signUp: "We couldn't create your account. If you've registered before, sign in or choose Forgot password. Otherwise, try again shortly.",
  verify: "That code could not be confirmed. Check it and try again.",
  reset: "We couldn't send a reset code. Please try again shortly. If this continues, contact the app owner.",
  resetVerification: "That code could not be confirmed. Check it and try again.",
};

export function parentAuthErrorMessage(mode: ParentAuthMode, reason: unknown): string {
  const code = reason instanceof ConvexError ? reason.data : null;
  switch (code) {
    case "ACCOUNT_EXISTS": return "An account with this email already exists. Sign in or choose Forgot password to recover it.";
    case "INVALID_CREDENTIALS": return "The email or password is incorrect. Check your details or choose Forgot password.";
    case "INVALID_EMAIL": return "Enter a valid email address.";
    case "PASSWORD_TOO_SHORT": return "Use a password with at least 8 characters.";
    case "INVALID_RESET_CODE": return "That reset code is incorrect or expired. Check the latest email or request a new code.";
    case "TOO_MANY_ATTEMPTS": return "Too many attempts. Wait a few minutes before trying again.";
    case "RESET_EMAIL_UNAVAILABLE": return safeMessages.reset;
    default: return safeMessages[mode];
  }
}
import { ConvexError } from "convex/values";
