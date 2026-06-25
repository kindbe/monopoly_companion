import { actionRowClass, fieldClass, inputClass, panelClass, primaryActionClass, secondaryActionClass } from "@/common/uiClasses";
import type { PlayerJoinScreenProps } from "@/components/PlayerJoinScreen/types";

export function PlayerJoinScreen({ joinCode, name, message, setJoinCode, setName, join, back }: PlayerJoinScreenProps) {
  return (
    <section className={`${panelClass} max-w-130`}>
      <h2>Join Session</h2>
      <label className={fieldClass}>
        <span>Join code</span>
        <input className={inputClass} aria-label="Join code" value={joinCode} onChange={(event) => setJoinCode(event.target.value)} />
      </label>
      <label className={fieldClass}>
        <span>Player name</span>
        <input className={inputClass} aria-label="Player name" value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      {message ? <p role="alert">{message}</p> : null}
      <div className={actionRowClass}>
        <button type="button" className={primaryActionClass} onClick={join}>
          Join
        </button>
        <button type="button" className={secondaryActionClass} onClick={back}>
          Back
        </button>
      </div>
    </section>
  );
}
