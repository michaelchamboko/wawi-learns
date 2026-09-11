import { Password } from "@convex-dev/auth/providers/Password";
import type { ConvexCredentialsUserConfig } from "@convex-dev/auth/providers/ConvexCredentials";
import { ConvexError } from "convex/values";
import { ResendOTP } from "../ResendOTP";

const password = Password({
  reset: ResendOTP,
  profile(params) {
    const email = params.email;
    if (typeof email !== "string" || !email.includes("@")) {
      throw new ConvexError("INVALID_EMAIL");
    }
    return { email: email.trim().toLowerCase() };
  },
  validatePasswordRequirements(password) {
    if (typeof password !== "string" || password.length < 8) {
      throw new ConvexError("PASSWORD_TOO_SHORT");
    }
  },
});

// Convex Auth 0.0.95 stores the real Password configuration in options.
const options = (password as typeof password & { options: ConvexCredentialsUserConfig }).options;

export const passwordProvider: typeof password = {
  ...options,
  id: "password",
  type: "credentials",
  async authorize(params, ctx) {
    const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : params.email;
    try {
      return await options.authorize({ ...params, email }, ctx);
    } catch (error) {
      if (error instanceof ConvexError) throw error;
      const message = error instanceof Error ? error.message : "";
      if (message === "TooManyFailedAttempts") throw new ConvexError("TOO_MANY_ATTEMPTS");
      if (params.flow === "reset" && message === "InvalidAccountId") return null;
      if (params.flow === "signIn" && ["InvalidAccountId", "InvalidSecret", "Invalid credentials"].includes(message)) {
        throw new ConvexError("INVALID_CREDENTIALS");
      }
      if (params.flow === "signUp" && typeof email === "string" && message.includes(`Account ${email} already exists`)) {
        throw new ConvexError("ACCOUNT_EXISTS");
      }
      if (params.flow === "reset-verification" && ["InvalidAccountId", "Invalid code", "Could not verify code"].includes(message)) {
        throw new ConvexError("INVALID_RESET_CODE");
      }
      throw error;
    }
  },
};
