import { expect, test } from "vitest";
import { ingestAttempts } from "../../../convex/attempts.ts";
import { createOnlyChildProfile } from "../../../convex/childProfiles.ts";
import { ResendOTP } from "../../../convex/ResendOTP.ts";

test("SLC-011-T002 — parent authority mutations are defined", () => {
  expect(ingestAttempts).toBeTypeOf("function");
  expect(createOnlyChildProfile).toBeTypeOf("function");
  expect(ResendOTP).toBeDefined();
});