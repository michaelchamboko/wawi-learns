import { mutation } from "./_generated/server";

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    // Find the account by email
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", "michaelchamboko@gmail.com")
      )
      .first();

    if (!account) {
      return { success: false, error: "Account not found" };
    }

    // Delete related records
    const userId = account.userId;

    // Delete auth sessions
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete verification codes
    const verificationCodes = await ctx.db
      .query("authVerificationCodes")
      .withIndex("accountId", (q) => q.eq("accountId", account._id))
      .collect();

    for (const code of verificationCodes) {
      await ctx.db.delete(code._id);
    }

    // Delete the account itself
    await ctx.db.delete(account._id);

    return { success: true, message: "Account deleted successfully" };
  },
});
