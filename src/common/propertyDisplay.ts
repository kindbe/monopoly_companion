import type { Property } from "@/domain/bidding";

export function propertyAccent(property: Property) {
  if (property.category === "railroad") return "#1f2937";
  if (property.category === "utility") return "#0891b2";
  const colors: Record<string, string> = {
    Purple: "#7e3fa3",
    "Light Blue": "#7dd3fc",
    Pink: "#ec4899",
    Orange: "#f97316",
    Red: "#dc2626",
    Yellow: "#facc15",
    Green: "#16a34a",
    "Dark Blue": "#1d4ed8"
  };
  return colors[property.colorGroup] ?? "#111827";
}

export function sortPropertiesByDisplayValue(properties: Property[]) {
  return [...properties].sort((left, right) => {
    const groupDelta = propertyGroupRank(right) - propertyGroupRank(left);
    if (groupDelta !== 0) return groupDelta;
    return right.retailValue - left.retailValue;
  });
}

export function groupWonProperties(properties: Property[]) {
  const groups = new Map<string, Property[]>();
  for (const property of sortPropertiesByDisplayValue(properties)) {
    const label = property.category === "street" ? property.colorGroup : property.category;
    groups.set(label, [...(groups.get(label) ?? []), property]);
  }
  return [...groups.entries()]
    .map(([label, groupProperties]) => ({
      label,
      properties: groupProperties,
      rank: Math.min(...groupProperties.map(propertyGroupRank))
    }))
    .sort((left, right) => right.rank - left.rank);
}

function propertyGroupRank(property: Property) {
  if (property.category === "railroad") return 1;
  if (property.category === "utility") return 0;
  const ranks: Record<string, number> = {
    "Dark Blue": 8,
    Green: 7,
    Yellow: 6,
    Red: 5,
    Orange: 4,
    Pink: 3,
    "Light Blue": 3,
    Purple: 2
  };
  return ranks[property.colorGroup] ?? 0;
}
