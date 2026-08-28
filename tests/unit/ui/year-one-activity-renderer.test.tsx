import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActivityRenderer } from "../../../app/home/activity-renderer";

describe("SLC-007-T003 — year one maths renderer", () => {
  it("shows the first worked example and practice step for year one maths", () => {
    const markup = renderToStaticMarkup(
      createElement(ActivityRenderer, { level: "year1", testIdPrefix: "year-one-maths", summaryLabel: "Year 1 maths" }),
    );
    expect(markup).toContain('data-testid="year-one-maths-journey"');
    expect(markup).toContain("Year 1 maths");
    expect(markup).toContain("Activity 1 of 35");
    expect(markup).toContain("Worked example");
  });
});
