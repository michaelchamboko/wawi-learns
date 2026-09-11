import { describe, expect, it } from "vitest";
import { ConvexError } from "convex/values";
import { parentAuthErrorMessage } from "../../../app/(child)/home/parent-auth-errors";

describe("parentAuthErrorMessage", () => {
  it("explains a confirmed duplicate account and offers recovery", () => {
    expect(parentAuthErrorMessage("signUp", new ConvexError("ACCOUNT_EXISTS"))).toBe(
      "An account with this email already exists. Sign in or choose Forgot password to recover it.",
    );
  });

  it("does not distinguish missing accounts from incorrect sign-in passwords", () => {
    expect(parentAuthErrorMessage("signIn", new ConvexError("INVALID_CREDENTIALS"))).toBe(
      "The email or password is incorrect. Check your details or choose Forgot password.",
    );
  });

  it("never displays internal errors or guesses that a server failure is a duplicate account", () => {
    for (const error of [new Error("[CONVEX A(auth:signIn)] [Request ID: secret-id] Server Error Called by client"), new Error("secret"), new ConvexError("private-data"), null]) {
      expect(parentAuthErrorMessage("signUp", error)).toBe(
        "We couldn't create your account. If you've registered before, sign in or choose Forgot password. Otherwise, try again shortly.",
      );
    }
  });

  it("provides specific safe recovery guidance", () => {
    expect(parentAuthErrorMessage("resetVerification", new ConvexError("INVALID_RESET_CODE"))).toContain("incorrect or expired");
    expect(parentAuthErrorMessage("reset", new ConvexError("RESET_EMAIL_UNAVAILABLE"))).toContain("couldn't send");
    expect(parentAuthErrorMessage("signIn", new ConvexError("TOO_MANY_ATTEMPTS"))).toContain("Wait a few minutes");
    expect(parentAuthErrorMessage("signUp", new ConvexError("PASSWORD_TOO_SHORT"))).toContain("at least 8 characters");
  });
});
