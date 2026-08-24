import { expect, test } from "vitest";
import { ingestAttempts } from "../../../convex/attempts";
import { createOnlyChildProfile } from "../../../convex/childProfiles";
import { ResendOTP } from "../../../convex/ResendOTP";

test("SLC-011-T002 — parent authority mutations are defined", () => {
  expect(ingestAttempts).toBeTypeOf("function");
  expect(createOnlyChildProfile).toBeTypeOf("function");
  expect(ResendOTP).toBeDefined();
});