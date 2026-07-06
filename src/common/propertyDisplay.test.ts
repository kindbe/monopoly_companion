import { describe, expect, it } from "vitest"
import {
  groupWonProperties,
  propertyAccent,
  propertyBandText
} from "@/common/propertyDisplay"
import { MONOPOLY_PROPERTIES } from "@/domain/bidding"

describe("propertyDisplay", () => {
  it("groups won properties by color and sorts each group by ascending face value", () => {
    const propertyById = new Map(
      MONOPOLY_PROPERTIES.map((property) => [property.id, property])
    )

    const groups = groupWonProperties([
      propertyById.get("boardwalk")!,
      propertyById.get("connecticut-avenue")!,
      propertyById.get("oriental-avenue")!,
      propertyById.get("park-place")!
    ])

    expect(groups.map((group) => group.label)).toEqual([
      "Light Blue",
      "Dark Blue"
    ])
    expect(
      groups.map((group) => group.properties.map((property) => property.name))
    ).toEqual([
      ["Oriental Avenue", "Connecticut Avenue"],
      ["Park Place", "Boardwalk"]
    ])
  })

  it("selects accessible text colors for every property band", () => {
    const representativeIds = [
      "mediterranean-avenue",
      "oriental-avenue",
      "st-charles-place",
      "st-james-place",
      "kentucky-avenue",
      "atlantic-avenue",
      "pacific-avenue",
      "park-place",
      "reading-railroad",
      "electric-company"
    ]
    const properties = representativeIds.map((id) => {
      const property = MONOPOLY_PROPERTIES.find(
        (candidate) => candidate.id === id
      )
      if (!property) throw new Error(`Missing property ${id}`)
      return property
    })

    for (const property of properties) {
      expect(
        contrastRatio(propertyAccent(property), propertyBandText(property))
      ).toBeGreaterThanOrEqual(4.5)
    }
  })
})

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
