import type React from "react"
import {
  groupWonProperties,
  propertyAccent,
  propertyBandText
} from "@/common/propertyDisplay"
import type { Property } from "@/domain/bidding"
import type { MiniPropertyCardsProps } from "@/components/MiniPropertyCards/types"

export function MiniPropertyCards({
  properties,
  inspectProperty
}: MiniPropertyCardsProps) {
  return (
    <div className="grid gap-3">
      {groupWonProperties(properties).map((group) => (
        <section key={group.label}>
          <h4 className="mb-2 mt-0 text-xs font-semibold uppercase tracking-widest text-ink-muted">
            {group.label} color group
          </h4>
          <div className="grid grid-cols-[repeat(4,minmax(92px,1fr))] gap-2">
            {group.properties.map((property) => (
              <button
                type="button"
                className="grid min-h-19 content-between rounded-lg border border-violet-200 bg-white px-2 pb-2 pt-7 text-left text-slate-950 shadow-md shadow-violet-950/10 transition duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg hover:shadow-violet-950/15 focus-visible:-translate-y-1 focus-visible:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:border-violet-400/35"
                data-testid="mini-property-card"
                style={miniPropertyCardStyle(property)}
                aria-label={`View ${property.name}`}
                key={property.id}
                onClick={() => inspectProperty(property)}
              >
                <span>{property.name}</span>
                <strong>${property.retailValue}</strong>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function miniPropertyCardStyle(property: Property) {
  const accent = propertyAccent(property)
  return {
    "--property-color": accent,
    "--property-band-text": propertyBandText(property),
    backgroundColor: "#ffffff",
    backgroundImage: `linear-gradient(var(--property-color) 0 24px, transparent 24px)`,
    color: "#0f172a"
  } as React.CSSProperties
}
