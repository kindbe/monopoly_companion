import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles.css", "utf8");
const bodyRule = css.match(/body\s*\{[^}]*\}/)?.[0] ?? "";

describe("visual polish styles", () => {
  it("avoids the dated gradients, diagonal stripes, oversized serif heading, and harsh red action color", () => {
    expect(css).not.toContain("Georgia");
    expect(css).not.toContain("Times New Roman");
    expect(css).not.toContain("repeating-linear-gradient");
    expect(bodyRule).not.toContain("gradient");
    expect(css).not.toContain("--accent: #df3d2f");
  });
});
