import { actionRowClass, checkboxClass, checkRowClass, fieldClass, finePrintClass, inputClass, panelClass, primaryActionClass, secondaryActionClass, setupGridClass, startBandClass } from "@/common/uiClasses";
import type { HostSetupScreenProps } from "@/components/HostSetupScreen/types";

export function HostSetupScreen(props: HostSetupScreenProps) {
  return (
    <div className={setupGridClass}>
      <section className={panelClass}>
        <h2>Host Multiplayer</h2>
        <label className={fieldClass}>
          <span>Host name</span>
          <input className={inputClass} aria-label="Host name" value={props.hostName} onChange={(event) => props.setHostName(event.target.value)} />
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
            onChange={(event) => props.setBidDeadline(clampNumber(Number(event.target.value), 5, 30))}
          />
        </label>
        <label className={fieldClass}>
          <span>Max bids per property</span>
          <input
            className={inputClass}
            aria-label="Max bids per property"
            type="number"
            min={1}
            max={5}
            step={1}
            value={props.maxBidsPerPlayer}
            onChange={(event) => props.setMaxBidsPerPlayer(clampNumber(Number(event.target.value), 1, 5))}
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
            onChange={(event) => props.setIncludeRailroads(event.target.checked)}
          />
          Include railroads
        </label>
        <label className={checkRowClass}>
          <input
            className={checkboxClass}
            type="checkbox"
            checked={props.includeUtilities}
            onChange={(event) => props.setIncludeUtilities(event.target.checked)}
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
            onChange={(event) => props.setPropertyCount(Number(event.target.value))}
          />
        </label>
        <p className={finePrintClass}>{props.maxProperties} eligible properties. The reveal list stays hidden.</p>
      </section>

      <section className={startBandClass}>
        {props.message ? <p role="alert">{props.message}</p> : null}
        <div className={actionRowClass}>
          <button type="button" className={primaryActionClass} onClick={props.createSession}>
            Create session
          </button>
          <button type="button" className={secondaryActionClass} onClick={props.back}>
            Back
          </button>
        </div>
      </section>
    </div>
  );
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}
