import type React from "react"
import {
  finePrintClass,
  propertyBandClass,
  propertyBodyClass,
  propertyCardClass,
  propertyTitleClass
} from "@/common/uiClasses"
import { propertyAccent } from "@/common/propertyDisplay"
import type { PropertyCardProps } from "@/components/PropertyCard/types"

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <article
      className={propertyCardClass}
      style={
        { "--property-color": propertyAccent(property) } as React.CSSProperties
      }
    >
      <div className={propertyBandClass}>
        <span>
          {property.category === "street"
            ? ""
            : property.category}
        </span>
      </div>
      <div className={propertyBodyClass}>
        <p className="m-0 font-black uppercase tracking-[0.08em]">Title Deed</p>
        <h2 className={propertyTitleClass}>{property.name}</h2>
        <div className="grid grid-cols-2 gap-1.5 font-black">
          <span>Price: ${property.retailValue}</span>
          <span>Mortgage: ${property.mortgage}</span>
        </div>
        {property.category === "street" ? (
          <>
            <div
              className="grid grid-cols-2 gap-1.5 text-left"
              aria-label={`${property.name} rent schedule`}
            >
              <span>Rent ${property.rent[0]}</span>
              <span>1 house ${property.rent[1]}</span>
              <span>2 houses ${property.rent[2]}</span>
              <span>3 houses ${property.rent[3]}</span>
              <span>4 houses ${property.rent[4]}</span>
              <span>Hotel ${property.rent[5]}</span>
            </div>
            <p className={finePrintClass}>
              Houses ${property.houseCost} each. Hotel ${property.hotelCost}{" "}
              plus 4 houses.
            </p>
          </>
        ) : (
          <p className="border-t border-[#1b1b18]/25 pt-1.5 font-extrabold">
            {property.rentDescription}
          </p>
        )}
      </div>
    </article>
  )
}
