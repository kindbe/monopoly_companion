import {
  actionRowClass,
  finePrintClass,
  kickerClass,
  panelClass,
  primaryActionClass,
  secondaryActionClass,
  setupGridClass,
  startBandClass
} from "@/common/uiClasses"
import type { HostLobbyScreenProps } from "@/components/HostLobbyScreen/types"

export function HostLobbyScreen({
  joinCode,
  players,
  phase,
  currentProperty,
  currentBid,
  currentBidderName,
  countdownRemaining,
  completedBidCount,
  message,
  startBidding,
  restart
}: HostLobbyScreenProps) {
  return (
    <div className={setupGridClass}>
      <section className={panelClass}>
        <h2>Host Lobby</h2>
        <p className={kickerClass}>Join code</p>
        <div
          className="rounded-md border border-violet-200 bg-white/95 p-4 text-3xl font-black tracking-[0.08em] text-violet-900 shadow-[0_12px_28px_rgba(76,58,139,0.12)] ring-1 ring-white/80 dark:border-violet-400/30 dark:bg-[#12182a] dark:text-emerald-200 dark:ring-white/5"
          data-testid="join-code"
        >
          {joinCode}
        </div>
        <p className={finePrintClass}>
          Players join from their own browser using this code.
        </p>
      </section>
      <section className={panelClass}>
        <h2>Players</h2>
        {players.length ? (
          <ul>
            {players.map((player) => (
              <li key={player.id}>
                {player.name} {player.connected ? "connected" : "disconnected"}
              </li>
            ))}
          </ul>
        ) : (
          <p className={finePrintClass}>Waiting for players to join.</p>
        )}
        {phase === "bidding" ? (
          <div className={finePrintClass}>
            <p>
              {currentProperty ?? "Current property"} with {countdownRemaining}s
              remaining.
            </p>
            <p>
              Current bid: ${currentBid}
              {currentBidderName ? ` by ${currentBidderName}` : ""}
            </p>
          </div>
        ) : null}
        {phase === "complete" ? (
          <p className={finePrintClass}>Completed bids: {completedBidCount}</p>
        ) : null}
      </section>
      <section className={startBandClass}>
        {message ? <p role="alert">{message}</p> : null}
        <div className={actionRowClass}>
          <button
            type="button"
            className={primaryActionClass}
            onClick={startBidding}
          >
            Start multiplayer bidding
          </button>
          <button
            type="button"
            className={secondaryActionClass}
            onClick={restart}
          >
            Back
          </button>
        </div>
      </section>
    </div>
  )
}
