import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("AUTH_RESEND_KEY", "re_test_fixture");
vi.stubEnv("AUTH_EMAIL_FROM", "onboarding@resend.dev");
vi.stubEnv("SITE_URL", "https://wawi-learns.vercel.app");
const { passwordProvider } = await import("../../../convex/lib/passwordProvider");
const runMutation = vi.fn();
const fetchEmail = vi.fn();
const ctx = { runMutation, auth: { config: {} } } as unknown as Parameters<typeof passwordProvider.authorize>[1];
const account = { _id: "account-1", userId: "user-1" };
const user = { _id: "user-1" };
const params = { email: " Parent@Example.com ", flow: "reset-verification", code: "12345678", newPassword: "new-test-password" };
const mutations = () => runMutation.mock.calls.map(([, input]) => input.args);

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchEmail);
  fetchEmail.mockResolvedValue(new Response(JSON.stringify({ id: "email-1" }), { status: 200 }));
  runMutation.mockImplementation(async (_name, { args }) => {
    if (args.type === "retrieveAccountWithCredentials") return { account, user };
    if (args.type === "createVerificationCode") return args.email;
    if (args.type === "verifyCodeAndSignIn") return { userId: "user-1", sessionId: "session-1" };
    return null;
  });
});

afterAll(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("password provider recovery through the Convex mutation boundary", () => {
  it("retains native hashing and registers recovery only as an extra provider", () => {
    expect(passwordProvider.crypto?.hashSecret).toBeTypeOf("function");
    expect(passwordProvider.extraProviders?.filter(Boolean)).toHaveLength(1);
  });

  it("requests and emails an expiring code for the normalized email", async () => {
    const started = Date.now();
    await expect(passwordProvider.authorize({ email: params.email, flow: "reset" }, ctx)).resolves.toBeNull();
    const request = mutations().find((args) => args.type === "createVerificationCode");
    expect(request).toMatchObject({ accountId: "account-1", email: "parent@example.com", allowExtraProviders: true });
    expect(request.expirationTime - started).toBeGreaterThanOrEqual(15 * 60 * 1000);
    expect(request.expirationTime - started).toBeLessThan(15 * 60 * 1000 + 5000);
    expect(request.code).toMatch(/^\d{8}$/);
    expect(fetchEmail).toHaveBeenCalledOnce();
    expect(JSON.parse(fetchEmail.mock.calls[0][1].body)).toMatchObject({ to: ["parent@example.com"], from: "onboarding@resend.dev" });
  });

  it("returns the same reset response for a missing account without sending email", async () => {
    runMutation.mockResolvedValue("InvalidAccountId");
    await expect(passwordProvider.authorize({ email: params.email, flow: "reset" }, ctx)).resolves.toBeNull();
    expect(fetchEmail).not.toHaveBeenCalled();
  });

  it("does not disguise a delivery failure as a sent code", async () => {
    fetchEmail.mockResolvedValue(new Response(JSON.stringify({ name: "validation_error", message: "provider-private-detail" }), { status: 403 }));
    await expect(passwordProvider.authorize({ email: params.email, flow: "reset" }, ctx)).rejects.toMatchObject({ data: "RESET_EMAIL_UNAVAILABLE" });
  });

  it("changes credentials and revokes other sessions after verification", async () => {
    await expect(passwordProvider.authorize(params, ctx)).resolves.toMatchObject({ userId: "user-1", sessionId: "session-1" });
    expect(mutations().map((args) => args.type)).toEqual(["retrieveAccountWithCredentials", "verifyCodeAndSignIn", "modifyAccount", "invalidateSessions"]);
    expect(mutations()[2]).toMatchObject({ provider: "password", account: { id: "parent@example.com", secret: "new-test-password" } });
    expect(mutations()[3]).toMatchObject({ userId: "user-1", except: ["session-1"] });
  });

  it.each([null, { userId: "another-user", sessionId: "session-2" }])("rejects an unverified or cross-account code", async (result) => {
    runMutation.mockImplementation(async (_name, { args }) => args.type === "retrieveAccountWithCredentials" ? { account, user } : result);
    await expect(passwordProvider.authorize(params, ctx)).rejects.toMatchObject({ data: "INVALID_RESET_CODE" });
    expect(mutations().some((args) => ["modifyAccount", "invalidateSessions"].includes(args.type))).toBe(false);
  });

  it.each(["InvalidSecret", "InvalidAccountId"])("returns safe sign-in feedback for %s", async (message) => {
    runMutation.mockResolvedValue(message);
    await expect(passwordProvider.authorize({ email: params.email, flow: "signIn", password: "wrong-password" }, ctx)).rejects.toMatchObject({ data: "INVALID_CREDENTIALS" });
  });

  it("classifies a confirmed duplicate without returning the email or stack", async () => {
    runMutation.mockRejectedValue(new Error("Uncaught Error: Account parent@example.com already exists\n at internalMutation"));
    await expect(passwordProvider.authorize({ email: params.email, flow: "signUp", password: "wrong-password" }, ctx)).rejects.toMatchObject({ data: "ACCOUNT_EXISTS" });
  });

  it("preserves unknown failures rather than guessing a user error", async () => {
    const failure = new Error("database unavailable");
    runMutation.mockRejectedValue(failure);
    await expect(passwordProvider.authorize({ email: params.email, flow: "reset" }, ctx)).rejects.toBe(failure);
  });
});
