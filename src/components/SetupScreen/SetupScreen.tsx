import { Gavel, Shuffle } from "lucide-react"
import {
  actionRowClass,
  checkboxClass,
  checkRowClass,
  fieldClass,
  finePrintClass,
  inputClass,
  modeButtonClass,
  panelClass,
  primaryActionClass,
  secondaryActionClass,
  setupGridClass,
  startBandClass
} from "@/common/uiClasses"
import type { SetupScreenProps } from "@/components/SetupScreen/types"

export function SetupScreen(props: SetupScreenProps) {
  return (
    <div className={setupGridClass}>
      <section className={panelClass}>
        <h2>Auction Rules</h2>
        <div className="mb-4 grid grid-cols-2 gap-2" aria-label="Bidding mode">
          <button
            type="button"
            className={modeButtonClass}
            aria-pressed={props.mode === "ascending"}
            onClick={() => props.setMode("ascending")}
          >
            <Gavel size={18} /> Ascending
          </button>
          <button
            type="button"
            className={modeButtonClass}
            aria-pressed={props.mode === "silent"}
            onClick={() => props.setMode("silent")}
          >
            <Shuffle size={18} /> Silent
          </button>
        </div>
        <label className={fieldClass}>
          <span>Bid increment</span>
          <input
            className={inputClass}
            aria-label="Bid increment"
            type="number"
            min={1}
            step={1}
            value={props.increment}
            onChange={(event) =>
              props.setIncrement(Math.max(1, Number(event.target.value)))
            }
          />
        </label>
        <label className={fieldClass}>
          <span>Bid deadline</span>
          <input
            className={inputClass}
            aria-label="Bid deadline"
            type="number"
            min={5}
            max={30}
            step={1}
            value={props.bidDeadline}
            onChange={(event) =>
              props.setBidDeadline(
                clampNumber(Number(event.target.value), 5, 30)
              )
            }
          />
        </label>
      </section>

      <section className={panelClass}>
        <h2>Property Pool</h2>
        <label className={checkRowClass}>
          <input
            className={checkboxClass}
            type="checkbox"
            checked={props.includeRailroads}
            onChange={(event) =>
              props.setIncludeRailroads(event.target.checked)
            }
          />
          Include railroads
        </label>
        <label className={checkRowClass}>
          <input
            className={checkboxClass}
            type="checkbox"
            checked={props.includeUtilities}
            onChange={(event) =>
              props.setIncludeUtilities(event.target.checked)
            }
          />
          Include utilities
        </label>
        <label className={fieldClass}>
          <span>Property count</span>
          <input
            className={inputClass}
            aria-label="Property count"
            type="number"
            min={1}
            max={props.maxProperties}
            value={props.propertyCount}
            onChange={(event) =>
              props.setPropertyCount(Number(event.target.value))
            }
          />
        </label>
        <p className={finePrintClass}>
          {props.maxProperties} eligible properties. The reveal list stays
          hidden.
        </p>
      </section>

      <section className={`${panelClass} grid content-start gap-2`}>
        <h2>Players</h2>
        {props.playerNames.map((name, index) => (
          <div className="grid grid-cols-[1fr_42px] gap-2" key={index}>
            <input
              className={inputClass}
              aria-label={`Player ${index + 1} name`}
              value={name}
              onChange={(event) =>
                props.updatePlayerName(index, event.target.value)
              }
            />
            <button
              className={secondaryActionClass}
              type="button"
              onClick={() => props.removePlayer(index)}
              aria-label={`Remove player ${index + 1}`}
            >
              -
            </button>
          </div>
        ))}
        <button
          type="button"
          className={secondaryActionClass}
          onClick={props.addPlayer}
        >
          Add player
        </button>
      </section>

      <section className={startBandClass}>
        {props.message ? <p role="alert">{props.message}</p> : null}
        <div className={actionRowClass}>
          <button
            type="button"
            className={primaryActionClass}
            onClick={props.startBidding}
          >
            <Gavel size={20} /> Start bidding
          </button>
          <button
            type="button"
            className={secondaryActionClass}
            onClick={props.hostMultiplayer}
          >
            Host multiplayer
          </button>
          <button
            type="button"
            className={secondaryActionClass}
            onClick={props.joinMultiplayer}
          >
            Join session
          </button>
        </div>
      </section>
    </div>
  )
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}
