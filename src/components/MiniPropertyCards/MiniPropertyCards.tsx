import type React from "react";
import { propertyAccent, sortPropertiesByDisplayValue } from "@/common/propertyDisplay";
import type { Property } from "@/domain/bidding";
import type { MiniPropertyCardsProps } from "@/components/MiniPropertyCards/types";

export function MiniPropertyCards({ properties }: MiniPropertyCardsProps) {
  return (
    <div className="grid grid-cols-[repeat(4,minmax(92px,1fr))] gap-2">
      {sortPropertiesByDisplayValue(properties).map((property) => (
        <div
          className="pointer-events-none grid min-h-19 content-between rounded-lg border border-violet-200 bg-white px-2 pb-2 pt-7 text-left text-slate-950 shadow-[0_8px_20px_rgba(76,58,139,0.10)] transition duration-200 dark:border-violet-400/35 dark:bg-white dark:text-slate-950"
          data-testid="mini-property-card"
          style={miniPropertyCardStyle(property)}
          key={property.id}
        >
          <span>{property.name}</span>
        </div>
      ))}
    </div>
  );
}

function miniPropertyCardStyle(property: Property) {
  const accent = propertyAccent(property);
  return {
    "--property-color": accent,
    backgroundColor: "#ffffff",
    backgroundImage: `linear-gradient(${accent} 0 24px, transparent 24px)`
  } as React.CSSProperties;
}
