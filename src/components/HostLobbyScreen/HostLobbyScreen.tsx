import {
  actionRowClass,
  finePrintClass,
  joinCodeClass,
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
  message,
  startBidding,
  restart
}: HostLobbyScreenProps) {
  return (
    <div className={setupGridClass}>
      <section className={panelClass}>
        <h2>Host Lobby</h2>
        <p className={kickerClass}>Join code</p>
        <div className={joinCodeClass} data-testid="join-code">
          {joinCode}
        </div>
        <p className={finePrintClass}>
          Players join from their own browser using this code.
        </p>
      </section>
      <section className={panelClass}>
        <h2>Players</h2>
        {players.length ? (
          <ul className="m-0 grid list-none gap-0 p-0">
            {players.map((player) => (
              <li
                className="flex min-h-9 items-center border-0 border-b border-b-[var(--rule-soft)] py-1 text-sm uppercase tracking-[0.06em] last:border-b-0"
                key={player.id}
              >
                {player.name} {player.connected ? "connected" : "disconnected"}
              </li>
            ))}
          </ul>
        ) : (
          <p className={finePrintClass}>Waiting for players to join.</p>
        )}
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
