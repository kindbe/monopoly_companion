import type React from "react"
import { RotateCcw, Trophy } from "lucide-react"
import {
  finePrintClass,
  mastheadTitleClass,
  panelClass,
  secondaryActionClass
} from "@/common/uiClasses"
import { groupWonProperties, propertyAccent } from "@/common/propertyDisplay"
import type { CompleteScreenProps } from "@/components/CompleteScreen/types"

export function CompleteScreen({
  players,
  completedBids,
  restart,
  inspectProperty,
  lastWinnerName
}: CompleteScreenProps) {
  return (
    <div className="grid gap-3.5">
      <section className="flex items-center gap-3.5 rounded-lg border border-emerald-200 bg-[linear-gradient(135deg,#ecfff6_0%,#f2edff_100%)] p-4 text-slate-950 shadow-[0_18px_44px_rgba(16,185,129,0.14)] ring-1 ring-white/80 dark:border-emerald-400/25 dark:bg-[linear-gradient(135deg,#10251d_0%,#211c3c_100%)] dark:text-violet-50 dark:ring-white/5">
        <Trophy size={34} />
        <h2 className={mastheadTitleClass}>Setup complete</h2>
        <p>{completedBids.length} properties resolved.</p>
        {lastWinnerName ? <p>{lastWinnerName} wins!</p> : null}
      </section>
      <section className="grid gap-2.5 md:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
        {players.map((player) => (
          <article className={panelClass} key={player.id}>
            <h3>{player.name}</h3>
            <p className="mb-2 mt-0 text-2xl font-black">
              ${player.remainingCash}
            </p>
            {player.properties.length ? (
              <div className="grid gap-3">
                {groupWonProperties(player.properties).map((group) => (
                  <section key={group.label}>
                    <h4 className="mb-2 mt-0 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-600 dark:text-violet-200/76">
                      {group.label} color group
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {group.properties.map((property) => (
                        <button
                          type="button"
                          className="grid min-h-19.5 w-27 content-between rounded-lg border border-violet-200 bg-[linear-gradient(var(--property-color)_0_24px,transparent_24px),#ffffff] px-2 pb-2 pt-7 text-left text-slate-950 shadow-[0_8px_20px_rgba(76,58,139,0.10)] transition duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_14px_28px_rgba(76,58,139,0.16)] focus-visible:-translate-y-1 focus-visible:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-violet-400/35 dark:text-slate-950"
                          style={
                            {
                              "--property-color": propertyAccent(property)
                            } as React.CSSProperties
                          }
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
            ) : (
              <p className={finePrintClass}>No properties won</p>
            )}
          </article>
        ))}
      </section>
      <button type="button" className={secondaryActionClass} onClick={restart}>
        <RotateCcw size={18} /> New setup
      </button>
    </div>
  )
}
