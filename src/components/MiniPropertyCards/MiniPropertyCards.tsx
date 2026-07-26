import {
  groupWonProperties,
  propertyGroupLabel,
  propertyGroupSlug
} from "@/common/propertyDisplay"
import {
  chipBandClass,
  chipBandLabelClass,
  chipClass,
  chipGridClass,
  chipNameClass,
  sectionHeadClass
} from "@/common/uiClasses"
import type { MiniPropertyCardsProps } from "@/components/MiniPropertyCards/types"

export function MiniPropertyCards({
  properties,
  inspectProperty
}: MiniPropertyCardsProps) {
  return (
    <div className="grid gap-3">
      {groupWonProperties(properties).map((group) => (
        <section key={group.label}>
          <h4 className={`${sectionHeadClass} mb-1.5 mt-0`}>
            {group.label} color group
          </h4>
          <div className={chipGridClass}>
            {group.properties.map((property) => (
              <button
                type="button"
                className={chipClass}
                data-testid="mini-property-card"
                data-group={propertyGroupSlug(property)}
                aria-label={`View ${property.name}`}
                key={property.id}
                onClick={() => inspectProperty(property)}
              >
                <span className={chipBandClass}>
                  <span className={chipBandLabelClass}>
                    {propertyGroupLabel(property)}
                  </span>
                </span>
                <span className={chipNameClass}>{property.name}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
