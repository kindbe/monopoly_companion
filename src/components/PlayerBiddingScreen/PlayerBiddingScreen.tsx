import { cx } from "@/common/classNames"
import {
  biddingCollectionClass,
  biddingDeedRegionClass,
  biddingDockClass,
  biddingHeaderClass,
  biddingLayoutClass,
  biddingScrollClass,
  countdownClassBase,
  countdownUnitClass,
  dockStatClass,
  dockStatLeadClass,
  dockStatsClass,
  finePrintClass,
  liveStateClass,
  lotCounterClass,
  passButtonClass,
  quickBidAmountClass,
  quickBidButtonClass,
  quickBidCaptionClass,
  quickBidGridClass,
  sectionHeadClass,
  skippedOverlayClass
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
  const bidsDisabled = !biddingActive || hasSkipped || remainingBidCount <= 0
  const countdownClass = cx(
    countdownClassBase,
    countdownRemaining <= 5 && countdownRemaining > 0 && "animate-pulse"
  )
  return (
    <div className={biddingLayoutClass}>
      {/* Pinned on phones; dissolves into the grid on the rail layout. */}
      <div className={biddingHeaderClass}>
        <p className={lotCounterClass}>
          Remaining properties: {remainingPropertyCount}
        </p>
        <div className={liveStateClass}>
          <span className={countdownClass}>{countdownRemaining}s</span>
          <span className={countdownUnitClass}>left</span>
        </div>
      </div>

      {/* Phone: the one scrolling region. Tablet: two separate rail zones. */}
      <div className={biddingScrollClass}>
        <div className={biddingDeedRegionClass}>
          <div className="relative mx-auto w-full max-w-105 sm:max-w-125 lg:max-w-140">
            {currentProperty ? (
              <PropertyCard property={currentProperty} size="large" />
            ) : null}
            {roundMessage === "Skipped!" ? (
              <div
                className={skippedOverlayClass}
                data-testid="skipped-overlay"
              >
                Skipped!
              </div>
            ) : null}
          </div>
        </div>

        {/* Reachable while bidding on every device: holdings are the bid. */}
        <section className={biddingCollectionClass}>
          <h3 className={sectionHeadClass}>
            Your properties · {wonProperties.length}
          </h3>
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

      {/* Phone: pinned thumb dock. Tablet: the middle rail zone. */}
      <div className={biddingDockClass}>
        {roundMessage ? (
          <p className={dockStatLeadClass} role="status">
            {roundMessage}
          </p>
        ) : null}
        <div className={dockStatsClass}>
          <span className={dockStatLeadClass}>
            Current bid: ${currentBid}
            {currentBidderName ? ` by ${currentBidderName}` : ""}
          </span>
          <span className={dockStatClass}>
            Your cash: ${remainingCash} / ${STARTING_CASH}
          </span>
          <span className={dockStatClass}>
            Bids remaining: {remainingBidCount}
          </span>
        </div>
        <div className={quickBidGridClass} data-testid="player-quick-bids">
          {QUICK_BID_INCREMENTS.map((bidIncrement) => (
            <button
              type="button"
              className={quickBidButtonClass}
              disabled={bidsDisabled}
              key={bidIncrement}
              onClick={() => bid(bidIncrement)}
            >
              <span className={quickBidAmountClass}>+${bidIncrement}</span>
              {/* Aria-hidden: the resulting total removes mental arithmetic
                  under time pressure without lengthening the button's
                  accessible name away from the increment it applies. */}
              <span className={quickBidCaptionClass} aria-hidden="true">
                Bid ${currentBid + bidIncrement}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className={passButtonClass}
          disabled={!biddingActive || hasSkipped}
          onClick={skip}
        >
          {hasSkipped ? "Skipped this round" : "Skip"}
        </button>
      </div>
    </div>
  )
}
