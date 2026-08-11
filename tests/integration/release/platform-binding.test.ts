import { describe, expect, it } from "vitest";
import { readPlatformBinding } from "../../../packages/learning-engine/src/index";

describe("SLC-010-T003 — platform binding", () => {
  it("the repository is bound to michaelchamboko/wawi-learns", () => {
    const binding = readPlatformBinding();
    expect(binding.repo).toBe("https://github.com/michaelchamboko/wawi-learns.git");
  });

  it("the Vercel project is wawi-learns rooted at .", () => {
    const binding = readPlatformBinding();
    expect(binding.vercelProject).toBe("wawi-learns");
    expect(binding.vercelRoot).toBe(".");
  });

  it("the production branch is main with Node 24.x", () => {
    const binding = readPlatformBinding();
    expect(binding.productionBranch).toBe("main");
    expect(binding.nodeVersion).toBe("24.x");
  });

  it("the GitHub Actions workflow exists", () => {
    const binding = readPlatformBinding();
    expect(binding.hasCiWorkflow).toBe(true);
  });
});