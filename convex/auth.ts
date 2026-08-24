import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { ResendOTP } from "./ResendOTP";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      verify: ResendOTP,
      reset: ResendOTP,
      profile(params) {
        const email = params.email;
        if (typeof email !== "string" || !email.includes("@")) {
          throw new ConvexError("Please enter a valid email address.");
        }
        return { email: email.trim().toLowerCase() };
      },
    }),
  ],
});
