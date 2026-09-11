import { convexAuth } from "@convex-dev/auth/server";
import { passwordProvider } from "./lib/passwordProvider";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [passwordProvider],
});
