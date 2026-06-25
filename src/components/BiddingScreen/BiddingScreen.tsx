import { calculateOpeningBid, QUICK_BID_INCREMENTS } from "@/domain/bidding";
import { cx } from "@/common/classNames";
import { biddingLayoutClass, currentBidClass, inputClass, kickerClass, panelClass, primaryActionClass, propertyStageClass, secondaryActionClass } from "@/common/uiClasses";
import { PropertyCard } from "@/components/PropertyCard/PropertyCard";
import type { BiddingScreenProps } from "@/components/BiddingScreen/types";

export function BiddingScreen(props: BiddingScreenProps) {
  const activeSilentPlayers =
    props.tiedPlayerIds.length > 0
      ? props.players.filter((player) => props.tiedPlayerIds.includes(player.id))
      : props.players;
  const ascendingAuction = props.ascendingAuction;

  return (
    <div className={biddingLayoutClass}>
      <section className={propertyStageClass}>
        <p className={kickerClass}>
          Property {props.currentIndex} of {props.totalCount}
        </p>
        <PropertyCard property={props.currentProperty} />
        <p className="m-0 font-black uppercase tracking-[0.08em]">Opening bid: ${calculateOpeningBid(props.currentProperty)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {props.deck.hidden.map((property) => (
            <span className="rounded-md border border-dashed border-emerald-300 bg-emerald-50 px-2.5 py-2 text-xs font-extrabold text-emerald-700 shadow-sm transition duration-200 dark:border-emerald-400/35 dark:bg-emerald-400/10 dark:text-emerald-200" key={property.id}>Hidden</span>
          ))}
        </div>
      </section>

      <section className={panelClass}>
        <h2>{props.mode === "ascending" ? "Ascending Auction" : props.tiedPlayerIds.length ? "Sudden-Death Re-Bid" : "Silent Auction"}</h2>
        {props.mode === "ascending" && ascendingAuction ? (
          <>
            <p className={currentBidClass}>Current bid: ${ascendingAuction.currentBid}</p>
            {props.bidFeedback ? (
              <span className="mt-2 inline-block animate-[bid-pop_360ms_ease-out] text-[1.35rem] font-black text-emerald-600 dark:text-emerald-300" data-testid="bid-pop">
                +${props.bidFeedback.increment}
              </span>
            ) : null}
            <div className="grid gap-2.5">
              {props.players.map((player) => (
                <div
                  className={cx(
                    "grid items-center gap-2 rounded-lg border border-violet-100 bg-white/60 p-2.5 shadow-sm transition duration-200 md:grid-cols-[1fr_auto_auto] dark:border-violet-400/20 dark:bg-white/5",
                    !ascendingAuction.activeBidderIds.includes(player.id) && "opacity-45 grayscale"
                  )}
                  data-testid={`bidder-row-${player.id}`}
                  key={player.id}
                >
                  <div className="grid min-w-32.5 gap-0.5">
                    <strong>{player.name}</strong>
                    <span className="text-slate-600 dark:text-violet-200/76">${player.remainingCash}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5" aria-label={`${player.name} bid increments`}>
                    {QUICK_BID_INCREMENTS.map((bidIncrement) => (
                      <button
                        className={secondaryActionClass}
                        type="button"
                        aria-label={`${player.name} +$${bidIncrement}`}
                        disabled={!ascendingAuction.activeBidderIds.includes(player.id)}
                        key={bidIncrement}
                        onClick={() => props.placeBid(player.id, bidIncrement)}
                      >
                        +${bidIncrement}
                      </button>
                    ))}
                  </div>
                  <button
                    className={secondaryActionClass}
                    type="button"
                    aria-label={`${player.name} Skip`}
                    disabled={!ascendingAuction.activeBidderIds.includes(player.id)}
                    onClick={() => props.passBidder(player.id)}
                  >
                    Skip
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-2.5">
              {activeSilentPlayers.map((player) => (
                <div className="grid items-end gap-2 rounded-lg border border-violet-100 bg-white/60 p-2.5 shadow-sm transition duration-200 md:grid-cols-[1fr_110px_110px] dark:border-violet-400/20 dark:bg-white/5" key={player.id}>
                  <strong>{player.name}</strong>
                  <label className="grid gap-1 text-xs font-extrabold">
                    Opening
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      step={props.increment}
                      value={props.silentBids[player.id]?.openingBid ?? 0}
                      onChange={(event) =>
                        props.setSilentBids((bids) => ({
                          ...bids,
                          [player.id]: {
                            openingBid: Number(event.target.value),
                            maxBid: bids[player.id]?.maxBid ?? 0
                          }
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-extrabold">
                    Max
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      step={props.increment}
                      value={props.silentBids[player.id]?.maxBid ?? 0}
                      onChange={(event) =>
                        props.setSilentBids((bids) => ({
                          ...bids,
                          [player.id]: {
                            openingBid: bids[player.id]?.openingBid ?? 0,
                            maxBid: Number(event.target.value)
                          }
                        }))
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
            <button type="button" className={primaryActionClass} onClick={props.submitSilentAuction}>
              Resolve bids
            </button>
          </>
        )}
        <button type="button" className={secondaryActionClass} onClick={props.skipProperty}>
          Skip no-bid
        </button>
        {props.message ? <p role="alert">{props.message}</p> : null}
      </section>
    </div>
  );
}
