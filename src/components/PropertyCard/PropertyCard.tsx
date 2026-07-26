import {
  propertyBandClass,
  propertyBandLabelClass,
  propertyBodyClass,
  propertyCardClass,
  propertyCardLargeClass,
  propertyFootClass,
  propertyKickerClass,
  propertyPriceRowClass,
  propertyRentKeyClass,
  propertyRentLeaderClass,
  propertyRentListClass,
  propertyRentRowClass,
  propertyRentValueClass,
  propertyRuleClass,
  propertyTitleClass,
  propertyTitleLargeClass
} from "@/common/uiClasses"
import { propertyGroupLabel, propertyGroupSlug } from "@/common/propertyDisplay"
import type { PropertyCardProps } from "@/components/PropertyCard/types"

const RENT_LABELS = [
  "Rent",
  "With 1 House",
  "With 2 Houses",
  "With 3 Houses",
  "With 4 Houses",
  "With Hotel"
]

export function PropertyCard({
  property,
  size = "regular"
}: PropertyCardProps) {
  const groupLabel = propertyGroupLabel(property)
  return (
    <article
      className={size === "large" ? propertyCardLargeClass : propertyCardClass}
      data-group={propertyGroupSlug(property)}
      aria-label={`Title deed, ${property.name}, ${groupLabel} group`}
    >
      <div className={propertyBandClass}>
        <span className={propertyBandLabelClass}>{groupLabel}</span>
      </div>
      <div className={propertyBodyClass}>
        <p className={propertyKickerClass}>Title Deed</p>
        <h2
          className={
            size === "large" ? propertyTitleLargeClass : propertyTitleClass
          }
        >
          {property.name}
        </h2>
        <div className={propertyPriceRowClass}>
          <span>Price: ${property.retailValue}</span>
          <span>Mortgage: ${property.mortgage}</span>
        </div>
        <hr className={propertyRuleClass} />
        {property.category === "street" ? (
          <>
            <ul
              className={propertyRentListClass}
              aria-label={`${property.name} rent schedule`}
            >
              {RENT_LABELS.map((label, index) => (
                <li className={propertyRentRowClass} key={label}>
                  <span className={propertyRentKeyClass}>{label}</span>
                  <span
                    className={propertyRentLeaderClass}
                    aria-hidden="true"
                  />
                  <span className={propertyRentValueClass}>
                    ${property.rent[index]}
                  </span>
                </li>
              ))}
            </ul>
            <hr className={propertyRuleClass} />
            <p className={propertyFootClass}>
              Houses ${property.houseCost} each. Hotel ${property.hotelCost}{" "}
              plus 4 houses.
            </p>
          </>
        ) : (
          <p className={propertyFootClass}>{property.rentDescription}</p>
        )}
      </div>
    </article>
  )
}
