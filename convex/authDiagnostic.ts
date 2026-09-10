import { query } from "./_generated/server";

export const checkAuthTables = query({
  args: {},
  returns: "any",
  handler: async (ctx) => {
    const requiredTables = [
      "authUsers",
      "authAccounts",
      "authSessions",
      "authRefreshTokens",
    ];

    const results: Record<string, { exists: boolean; count?: number; error?: string }> = {};

    for (const tableName of requiredTables) {
      try {
        const count = await ctx.db.query(tableName as any).collect();
        results[tableName] = { exists: true, count: count.length };
      } catch (err) {
        results[tableName] = {
          exists: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    return results;
  },
});