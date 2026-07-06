import type { Property } from "@/domain/bidding"

export function propertyAccent(property: Property) {
  if (property.category === "railroad") return "#1f2937"
  if (property.category === "utility") return "#0891b2"
  const colors: Record<string, string> = {
    Purple: "#7e3fa3",
    "Light Blue": "#7dd3fc",
    Pink: "#ec4899",
    Orange: "#f97316",
    Red: "#dc2626",
    Yellow: "#facc15",
    Green: "#16a34a",
    "Dark Blue": "#1d4ed8"
  }
  return colors[property.colorGroup] ?? "#111827"
}

export function propertyBandText(property: Property) {
  const accent = propertyAccent(property)
  const darkText = "#111827"
  const lightText = "#ffffff"
  return contrastRatio(accent, darkText) >= contrastRatio(accent, lightText)
    ? darkText
    : lightText
}

export function sortPropertiesByDisplayValue(properties: Property[]) {
  return [...properties].sort((left, right) => {
    const groupDelta = propertyGroupRank(left) - propertyGroupRank(right)
    if (groupDelta !== 0) return groupDelta
    const valueDelta = left.retailValue - right.retailValue
    if (valueDelta !== 0) return valueDelta
    return left.name.localeCompare(right.name)
  })
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

export function groupWonProperties(properties: Property[]) {
  const groups = new Map<string, Property[]>()
  for (const property of sortPropertiesByDisplayValue(properties)) {
    const label =
      property.category === "street" ? property.colorGroup : property.category
    groups.set(label, [...(groups.get(label) ?? []), property])
  }
  return [...groups.entries()]
    .map(([label, groupProperties]) => ({
      label,
      properties: groupProperties,
      rank: Math.min(...groupProperties.map(propertyGroupRank))
    }))
    .sort((left, right) => {
      const rankDelta = left.rank - right.rank
      if (rankDelta !== 0) return rankDelta
      return left.label.localeCompare(right.label)
    })
}

function propertyGroupRank(property: Property) {
  if (property.category === "utility") return 150
  if (property.category === "railroad") return 200
  const ranks: Record<string, number> = {
    Purple: 60,
    "Light Blue": 100,
    Pink: 140,
    Orange: 180,
    Red: 220,
    Yellow: 260,
    Green: 300,
    "Dark Blue": 350
  }
  return ranks[property.colorGroup] ?? property.retailValue
}
