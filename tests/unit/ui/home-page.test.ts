import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage from "../../../app/home/page";

describe("home shell", () => {
  it("fails closed when parent setup is not configured", () => {
    const markup = renderToStaticMarkup(createElement(HomePage));

    expect(markup).toContain('data-testid="parent-setup-required"');
    expect(markup).toMatch(/parent setup is needed/i);
    expect(markup).not.toContain("Malachi");
  });
});
