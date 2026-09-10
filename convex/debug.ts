/**
 * ONE-SHOT DEBUG: reads auth environment variables and returns their state.
 * Call via: POST https://tacit-pony-603.eu-west-1.convex.cloud/api/mutation
 * with { path: "debug:readAuthEnv", args: {}, format: "json" }
 * REMOVE THIS FILE after diagnosis.
 */
export const readAuthEnv = async (): Promise<{
  resendKeyLength: number;
  resendKeyPrefix: string;
  emailFrom: string;
  emailFromLength: number;
}> => {
  const key = process.env.AUTH_RESEND_KEY ?? "";
  const from = process.env.AUTH_EMAIL_FROM ?? "";
  return {
    resendKeyLength: key.length,
    resendKeyPrefix: key.length > 3 ? key.substring(0, 3) + "..." : "(empty)",
    emailFrom: from || "(empty)",
    emailFromLength: from.length,
  };
};