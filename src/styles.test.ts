import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { MONOPOLY_PROPERTIES, type Property } from "@/domain/bidding"
import {
  propertyAccent,
  propertyBandText,
  propertyGroupSlug
} from "@/common/propertyDisplay"

const css = readFileSync("src/styles.css", "utf8")

/**
 * The three contrast modes the stylesheet keys off `[data-contrast]`.
 * `standard` is the implicit default and therefore has no override block: it
 * resolves entirely from the base `:root` and `@theme` layers.
 */
const MODES = ["standard", "high-contrast", "dark"] as const
type Mode = (typeof MODES)[number]

/** WCAG 2.1 AA floors, tightened to AAA for text in the high-contrast mode. */
const TEXT_MINIMUM: Record<Mode, number> = {
  standard: 4.5,
  "high-contrast": 7,
  dark: 4.5
}
const NON_TEXT_MINIMUM = 3

/**
 * Text pairings: a foreground role rendered as text directly on a background
 * role. Card roles are listed against the card stock rather than the page
 * ground, because card ink is deliberately scoped to the card.
 */
const TEXT_PAIRINGS = [
  ["--color-ink", "--color-surface"],
  ["--color-ink", "--color-surface-raised"],
  ["--color-ink-muted", "--color-surface"],
  ["--color-ink-muted", "--color-surface-raised"],
  ["--color-card-ink", "--color-surface-card"],
  ["--color-card-ink-muted", "--color-surface-card"],
  ["--color-btn-ink", "--color-btn-face"],
  ["--color-btn-ink-alt", "--color-btn-face-alt"]
] as const

/** Non-text pairings: focus rings and meaningful boundaries. */
const NON_TEXT_PAIRINGS = [
  ["--color-focus", "--color-surface"],
  ["--color-focus", "--color-surface-raised"],
  ["--color-rule", "--color-surface"],
  ["--color-card-rule", "--color-surface-card"],
  // `.on-card` repoints --color-focus at the card ink, so a focus ring drawn
  // inside a card is measured against card stock rather than the page ground.
  ["--color-card-ink", "--color-surface-card"]
] as const

const modeTokens: Record<Mode, Record<string, string>> = {
  standard: baseTokens(),
  "high-contrast": {
    ...baseTokens(),
    ...parseBlock('[data-contrast="high-contrast"]')
  },
  dark: { ...baseTokens(), ...parseBlock('[data-contrast="dark"]') }
}

const groupBandTextRoles = parseGroupBandTextRoles()

describe("Tailwind stylesheet", () => {
  it("declares the three token layers the modes are built from", () => {
    expect(css).toContain('@import "tailwindcss";')
    // Layer 2 is `@theme static`, not `@theme`: the roles are emitted as
    // utilities unconditionally rather than on first use.
    expect(css).toMatch(/@theme static\s*{/)
    expect(css).toMatch(/@custom-variant dark/)
    expect(css).toMatch(/\[data-contrast="high-contrast"\]\s*{/)
    expect(css).toMatch(/\[data-contrast="dark"\]\s*{/)
  })

  it("keeps app motion keyframes with reduced-motion handling", () => {
    expect(css).toMatch(/@keyframes app-enter/)
    expect(css).toMatch(/@keyframes property-reveal/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
  })

  it("keeps the color band usable under forced colors", () => {
    expect(css).toMatch(/@media \(forced-colors: active\)/)
    // The band must be a real painted element, never a background-image, or
    // forced-colors discards the only chroma in the interface.
    expect(css).toMatch(/\.deed-band\s*{[^}]*background-color:/)
  })

  it("defines a descending heading size scale with bold weights", () => {
    expect(css).toMatch(/@layer base/)
    const [h1, h2, h3] = ["h1", "h2", "h3"].map(headingStyle)
    for (const heading of [h1, h2, h3]) {
      expect(heading.fontWeight).toBeGreaterThanOrEqual(600)
    }
    expect(h1.maxFontSizeRem).toBeGreaterThan(h2.maxFontSizeRem)
    expect(h2.maxFontSizeRem).toBeGreaterThan(h3.maxFontSizeRem)
  })

  it("defines every semantic role referenced by the contrast assertions", () => {
    const roles = [
      ...new Set(
        [...TEXT_PAIRINGS, ...NON_TEXT_PAIRINGS].flatMap((pairing) => pairing)
      )
    ]
    for (const role of roles) {
      expect(modeTokens.standard[role], `missing role ${role}`).toBeDefined()
    }
  })
})

describe.each(MODES)("contrast mode %s", (mode) => {
  it.each(TEXT_PAIRINGS)("renders %s on %s as legible text", (ink, ground) => {
    expect(
      contrastRatio(token(mode, ink), token(mode, ground))
    ).toBeGreaterThanOrEqual(TEXT_MINIMUM[mode])
  })

  it.each(NON_TEXT_PAIRINGS)(
    "separates %s from %s as a non-text indicator",
    (indicator, ground) => {
      expect(
        contrastRatio(token(mode, indicator), token(mode, ground))
      ).toBeGreaterThanOrEqual(NON_TEXT_MINIMUM)
    }
  )
})

/**
 * The group name is rendered as text on the band in every mode, so each band
 * fill has to clear the text floor against the band ink the stylesheet selects
 * for it — including the luminance-shifted high-contrast ramp.
 */
describe("property group bands", () => {
  const groupProperties = representativeGroupProperties()

  it("styles exactly the ten groups the property data produces", () => {
    expect(Object.keys(groupBandTextRoles.base).sort()).toEqual(
      [...groupProperties.keys()].sort()
    )
    expect(groupProperties.size).toBe(10)
  })

  it.each([...groupProperties])(
    "matches propertyAccent and propertyBandText for %s",
    (slug, property) => {
      expect(propertyAccent(property).toLowerCase()).toBe(
        token("standard", `--color-group-${slug}`)
      )
      expect(propertyBandText(property).toLowerCase()).toBe(
        token("standard", bandTextRole("standard", slug))
      )
    }
  )

  describe.each(MODES)("in %s", (mode) => {
    it.each([...groupProperties.keys()])(
      "keeps the %s band name legible on its fill",
      (slug) => {
        expect(
          contrastRatio(
            token(mode, `--color-group-${slug}`),
            token(mode, bandTextRole(mode, slug))
          )
        ).toBeGreaterThanOrEqual(TEXT_MINIMUM[mode])
      }
    )

    it.each([...groupProperties.keys()])(
      "picks the better of the two band inks for %s",
      (slug) => {
        // Guards the defect this test caught: the stylesheet hardcoded one ink
        // per group, so green and utility kept light ink in the ramps where
        // dark ink is the legible choice. Whichever ink is declared must be the
        // higher-contrast of the two available.
        const fill = token(mode, `--color-group-${slug}`)
        const chosen = token(mode, bandTextRole(mode, slug))
        const rejected = token(
          mode,
          bandTextRole(mode, slug) === "--color-band-ink-dark"
            ? "--color-band-ink-light"
            : "--color-band-ink-dark"
        )
        expect(contrastRatio(fill, chosen)).toBeGreaterThanOrEqual(
          contrastRatio(fill, rejected)
        )
      }
    )
  })
})

/**
 * The declared band ink for a group in a mode. Band ink is per-mode because the
 * high-contrast ramp shifts fill luminance far enough that two groups flip to
 * the opposite ink; a mode override wins over the group's base declaration.
 */
function bandTextRole(mode: Mode, slug: string) {
  const role = groupBandTextRoles[mode]?.[slug] ?? groupBandTextRoles.base[slug]
  if (!role) throw new Error(`Group ${slug} has no --band-text role in ${mode}`)
  return role
}

/** One property per group slug, so every band pairing is covered exactly once. */
function representativeGroupProperties() {
  const groups = new Map<string, Property>()
  for (const property of MONOPOLY_PROPERTIES) {
    const slug = propertyGroupSlug(property)
    if (!groups.has(slug)) groups.set(slug, property)
  }
  return groups
}

/**
 * Layer 1 (raw palette) plus layer 2 (semantic roles). `:root` appears more
 * than once, so every occurrence is merged.
 */
function baseTokens(): Record<string, string> {
  const roots = [...css.matchAll(/(?:^|\s):root\s*{([^{}]*)}/g)].map(
    (match) => match[1]
  )
  const blocks = [
    ...roots.map(parseDeclarations),
    parseDeclarations(blockBody(/@theme static\s*{([^{}]*)}/, "@theme static"))
  ]
  return blocks.reduce<Record<string, string>>(
    (merged, block) => ({ ...merged, ...block }),
    {}
  )
}

function parseBlock(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  // `\s*{` keeps this anchored to the token block: a descendant selector
  // sharing the same prefix has a combinator before its brace.
  return parseDeclarations(
    blockBody(new RegExp(`${escaped}\\s*{([^{}]*)}`), selector)
  )
}

/**
 * Band ink roles, split into the base declaration each group carries and any
 * per-mode override. A rule may list several groups, so the selector is scanned
 * for every `[data-group]` it names rather than assuming one per block.
 */
function parseGroupBandTextRoles() {
  const roles: Record<string, Record<string, string>> = { base: {} }
  for (const mode of MODES) roles[mode] = {}

  for (const [, selector, body] of css.matchAll(
    /([^{}]*\[data-group="[\w-]+"\][^{}]*)\s*{([^{}]*)}/g
  )) {
    const bandText = parseDeclarations(body)["--band-text"]
    const role = bandText?.match(/^var\(\s*(--[\w-]+)\s*\)$/)?.[1]
    if (!role) continue
    const mode = selector.match(/\[data-contrast="([\w-]+)"\]/)?.[1] ?? "base"
    for (const [, slug] of selector.matchAll(/\[data-group="([\w-]+)"\]/g)) {
      roles[mode][slug] = role
    }
  }
  return roles
}

function blockBody(pattern: RegExp, label: string) {
  const match = css.match(pattern)
  if (!match) throw new Error(`Missing token block ${label}`)
  return match[1]
}

function parseDeclarations(body: string) {
  return Object.fromEntries(
    [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.trim()
    ])
  ) as Record<string, string>
}

/**
 * Resolves a role to a literal colour for one mode, following `var()`
 * indirection into the raw palette. Anything that is not a six-digit hex
 * throws rather than silently skipping the contrast check, so introducing
 * `oklch()` or `color-mix()` in a token block fails this suite deliberately.
 */
function token(mode: Mode, name: string) {
  const tokens = modeTokens[mode]
  let value: string | undefined = tokens[name]
  for (let hop = 0; hop < 8; hop += 1) {
    if (value === undefined) break
    const reference: RegExpMatchArray | null = value.match(
      /^var\(\s*(--[\w-]+)\s*\)$/
    )
    if (reference === null) break
    value = tokens[reference[1]]
  }
  if (value === undefined) {
    throw new Error(`Token ${name} is undefined in mode ${mode}`)
  }
  const color = value.trim().toLowerCase()
  if (!/^#[\da-f]{6}$/.test(color)) {
    throw new Error(
      `Token ${name} in mode ${mode} resolves to "${color}", which is not a six-digit hex colour`
    )
  }
  return color
}

function headingStyle(tag: string) {
  const body = blockBody(new RegExp(`\\s${tag}\\s*{([^{}]*)}`), tag)
  const declarations = Object.fromEntries(
    [...body.matchAll(/([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.trim()
    ])
  )
  const fontSize = declarations["font-size"]
  if (!fontSize) throw new Error(`Missing font-size for ${tag}`)
  const sizes = [...fontSize.matchAll(/([\d.]+)rem/g)].map(([, size]) =>
    Number(size)
  )
  if (!sizes.length) throw new Error(`No rem font-size for ${tag}`)
  return {
    fontWeight: Number(declarations["font-weight"]),
    maxFontSizeRem: Math.max(...sizes)
  }
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
