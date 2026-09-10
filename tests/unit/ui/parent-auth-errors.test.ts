import { describe, expect, it } from "vitest";
import { parentAuthErrorMessage } from "../../../app/(child)/home/parent-auth-errors";

describe("parentAuthErrorMessage", () => {
  it("never exposes Convex request identifiers but surfaces the useful error", () => {
    const internalError = new Error(
      "[CONVEX A(auth:signIn)] [Request ID: 5e02ffd92e0bd256] Server Error Could not find public function for 'auth:signIn'. Called by client",
    );

    const message = parentAuthErrorMessage("signIn", internalError);

    expect(message).toContain("We couldn't sign you in");
    expect(message).toContain("Server Error Could not find public function");
    expect(message).not.toContain("Request ID");
    expect(message).not.toContain("CONVEX");
    expect(message).not.toContain("5e02ffd9");
  });

  it("surfaces the real error message alongside the safe prefix", () => {
    expect(parentAuthErrorMessage("signUp", new Error("secret"))).toBe(
      "We couldn't create the account yet. Please try again. (secret)",
    );
    expect(parentAuthErrorMessage("verify", new Error("bad token"))).toBe(
      "That code could not be confirmed. Check it and try again. (bad token)",
    );
    expect(parentAuthErrorMessage("reset", new Error("send failed"))).toBe(
      "We couldn't send a reset code. Please try again. (send failed)",
    );
  });
});