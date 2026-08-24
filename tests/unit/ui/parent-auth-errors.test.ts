import { describe, expect, it } from "vitest";
import { parentAuthErrorMessage } from "../../../app/(child)/home/parent-auth-errors";

describe("parentAuthErrorMessage", () => {
  it("never exposes Convex internals or request identifiers", () => {
    const internalError = new Error(
      "[CONVEX A(auth:signIn)] [Request ID: 5e02ffd92e0bd256] Server Error Could not find public function for 'auth:signIn'. Called by client",
    );

    const message = parentAuthErrorMessage("signIn", internalError);

    expect(message).toBe("We couldn’t sign you in. Check your details and try again.");
    expect(message).not.toContain("CONVEX");
    expect(message).not.toContain("Request ID");
    expect(message).not.toContain("auth:signIn");
  });

  it("uses safe flow-specific messages", () => {
    expect(parentAuthErrorMessage("signUp", new Error("secret"))).toBe(
      "We couldn’t create the account yet. Please try again.",
    );
    expect(parentAuthErrorMessage("verify", new Error("secret"))).toBe(
      "That code could not be confirmed. Check it and try again.",
    );
    expect(parentAuthErrorMessage("reset", new Error("secret"))).toBe(
      "We couldn’t send a reset code. Please try again.",
    );
  });
});
