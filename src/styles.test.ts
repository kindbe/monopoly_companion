import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const css = readFileSync("src/styles.css", "utf8")

describe("Tailwind stylesheet", () => {
  it("defines app motion keyframes with reduced-motion handling", () => {
    expect(css).toContain(`@import "tailwindcss";

@theme {`)
    expect(css).toMatch(/@custom-variant dark/)
    expect(css).toMatch(/@keyframes app-enter/)
    expect(css).toMatch(/@keyframes property-reveal/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
  })

  it("defines design tokens and heading hierarchy", () => {
    for (const token of [
      "--color-surface",
      "--color-surface-raised",
      "--color-ink",
      "--color-ink-muted",
      "--color-accent",
      "--color-action",
      "--color-focus"
    ]) {
      expect(css).toContain(token)
    }

    expect(css).toMatch(/@layer base/)
    expect(css).toMatch(/h1\s*{[^}]*font-size:[^}]*font-weight: 800/s)
    expect(css).toMatch(/h2\s*{[^}]*font-size:[^}]*font-weight: 750/s)
    expect(css).toMatch(/h3\s*{[^}]*font-size:[^}]*font-weight: 700/s)
  })

  it("keeps theme token pairings above WCAG contrast minimums", () => {
    const themes = [
      parseTokenBlock("@theme"),
      parseTokenBlock('[data-theme="dark"]')
    ]

    for (const theme of themes) {
      expect(
        contrastRatio(theme["--color-ink"], theme["--color-surface"])
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrastRatio(theme["--color-action-ink"], theme["--color-action"])
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrastRatio(
          theme["--color-action-ink"],
          theme["--color-action-hover"]
        )
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrastRatio(
          theme["--color-action-disabled-ink"],
          theme["--color-action-disabled"]
        )
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrastRatio(theme["--color-focus"], theme["--color-surface"])
      ).toBeGreaterThanOrEqual(3)
    }
  })
})

function parseTokenBlock(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = css.match(new RegExp(`${escapedSelector}\\s*{([^}]*)}`))
  if (!match) throw new Error(`Missing token block ${selector}`)

  return Object.fromEntries(
    [...match[1].matchAll(/(--color-[\w-]+):\s*(#[\da-f]{6});/gi)].map(
      ([, name, value]) => [name, value]
    )
  )
}

function contrastRatio(left: string, right: string) {
  const leftLuminance = relativeLuminance(left)
  const rightLuminance = relativeLuminance(right)
  const lighter = Math.max(leftLuminance, rightLuminance)
  const darker = Math.min(leftLuminance, rightLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

function relativeLuminance(hexColor: string) {
  const [red, green, blue] = hexToRgb(hexColor).map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function hexToRgb(hexColor: string) {
  const normalized = hexColor.replace("#", "")
  return [0, 2, 4].map((start) =>
    Number.parseInt(normalized.slice(start, start + 2), 16)
  )
}
