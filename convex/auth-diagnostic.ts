import { query } from "./_generated/server";

export const listAuthTables = query({
  args: {},
  handler: async (ctx) => {
    const tablesToCheck = [
      "authUsers",
      "authAccounts",
      "authSessions",
      "authRefreshTokens",
      "authVerifications",
    ];

    const results: Record<string, { exists: boolean; count?: number; error?: string }> = {};

    for (const table of tablesToCheck) {
      try {
        const count = await ctx.db.query(table as any).collect();
        results[table] = { exists: true, count: count.length };
      } catch (err) {
        results[table] = { exists: false, error: err instanceof Error ? err.message : String(err) };
      }
    }

    return results;
  },
});