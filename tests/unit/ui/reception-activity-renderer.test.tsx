import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActivityRenderer } from "../../../app/home/activity-renderer";

describe("SLC-007-T002 — reception maths renderer", () => {
  it("shows the first worked example and practice step for reception maths", () => {
    const markup = renderToStaticMarkup(createElement(ActivityRenderer));
    expect(markup).toContain('data-testid="reception-maths-journey"');
    expect(markup).toContain("Reception maths");
    expect(markup).toContain("Activity 1 of 13");
    expect(markup).toContain("Worked example");
    expect(markup).toContain("I got it");
  });
});
