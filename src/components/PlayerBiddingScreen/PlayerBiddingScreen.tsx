import { cx } from "@/common/classNames"
import {
  biddingLayoutClass,
  compactPrimaryActionClass,
  compactSecondaryActionClass,
  countdownClassBase,
  currentBidClass,
  finePrintClass,
  panelClass,
  propertyStageClass
} from "@/common/uiClasses"
import { PropertyCard } from "@/components/PropertyCard/PropertyCard"
import { MiniPropertyCards } from "@/components/MiniPropertyCards/MiniPropertyCards"
import { QUICK_BID_INCREMENTS, STARTING_CASH } from "@/domain/bidding"
import type { PlayerBiddingScreenProps } from "@/components/PlayerBiddingScreen/types"

export function PlayerBiddingScreen({
  sessionPhase,
  currentProperty,
  currentBid,
  currentBidderName,
  remainingPropertyCount,
  countdownRemaining,
  remainingBidCount,
  remainingCash,
  wonProperties,
  hasSkipped,
  roundMessage,
  inspectProperty,
  bid,
  skip
}: PlayerBiddingScreenProps) {
  const biddingActive = sessionPhase === "bidding"
  const countdownClass = cx(
    countdownClassBase,
    countdownRemaining <= 5 &&
      countdownRemaining > 0 &&
      "animate-[urgent-pulse_900ms_ease-in-out_infinite] border-rose-200 text-rose-600 dark:border-rose-300/35 dark:text-rose-300"
  )
  return (
    <div className={biddingLayoutClass}>
      <section className={propertyStageClass}>
        <div className="relative mx-auto w-full max-w-105">
          {currentProperty ? <PropertyCard property={currentProperty} /> : null}
          {roundMessage === "Skipped!" ? (
            <div
              className="absolute inset-0 z-1 grid animate-[overlay-in_220ms_ease-out] rotate-[-7deg] place-items-center rounded-xl bg-violet-950/75 text-[clamp(2.4rem,9vw,5.4rem)] font-bold uppercase tracking-[0.06em] text-white backdrop-blur-[2px] [text-shadow:0_4px_0_rgba(0,0,0,0.45)]"
              data-testid="skipped-overlay"
            >
              Skipped!
            </div>
          ) : null}
        </div>
        <p className={countdownClass}>{countdownRemaining}s</p>
        <p>Remaining properties: {remainingPropertyCount}</p>
      </section>
      <section className={`${panelClass} grid content-start gap-3`}>
        {roundMessage ? <p role="status">{roundMessage}</p> : null}
        <p className={currentBidClass}>
          Current bid: ${currentBid}
          {currentBidderName ? ` by ${currentBidderName}` : ""}
        </p>
        <p className={finePrintClass}>Bids remaining: {remainingBidCount}</p>
        <div className="grid items-stretch gap-2.5 md:grid-cols-[minmax(150px,1fr)_minmax(170px,1.15fr)]">
          <p className="mt-2.5 grid min-h-24 place-items-center rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-center font-semibold text-emerald-800 shadow-sm shadow-emerald-950/10 transition duration-200 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200 dark:shadow-black/20">
            Your cash: ${remainingCash} / ${STARTING_CASH}
          </p>
          <div
            className="grid grid-cols-2 gap-2 [&>button]:min-w-0"
            data-testid="player-quick-bids"
          >
            {QUICK_BID_INCREMENTS.map((bidIncrement) => (
              <button
                type="button"
                className={compactPrimaryActionClass}
                disabled={
                  !biddingActive || hasSkipped || remainingBidCount <= 0
                }
                key={bidIncrement}
                onClick={() => bid(bidIncrement)}
              >
                +${bidIncrement}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className={`${compactSecondaryActionClass} w-full`}
          disabled={!biddingActive || hasSkipped}
          onClick={skip}
        >
          {hasSkipped ? "Skipped this round" : "Skip"}
        </button>
        <h3>Your properties</h3>
        {wonProperties.length ? (
          <MiniPropertyCards
            properties={wonProperties}
            inspectProperty={inspectProperty}
          />
        ) : (
          <p className={finePrintClass}>No properties won</p>
        )}
      </section>
    </div>
  )
}
