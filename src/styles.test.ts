import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const css = readFileSync("src/styles.css", "utf8")

describe("Tailwind stylesheet", () => {
  it("defines app motion keyframes with reduced-motion handling", () => {
    expect(css).toContain(`@import "tailwindcss";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));`)
    expect(css).toMatch(/@keyframes app-enter/)
    expect(css).toMatch(/@keyframes property-reveal/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
  })
})
