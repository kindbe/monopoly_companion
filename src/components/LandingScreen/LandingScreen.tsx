import { actionRowClass, kickerClass, primaryActionClass, secondaryActionClass, startBandClass } from "@/common/uiClasses";
import type { LandingScreenProps } from "@/components/LandingScreen/types";

export function LandingScreen({ hostMultiplayer, joinMultiplayer }: LandingScreenProps) {
  return (
    <section className={startBandClass}>
      <div>
        <p className={kickerClass}>Multiplayer setup</p>
        <h2>Start a property auction</h2>
      </div>
      <div className={actionRowClass}>
        <button type="button" className={primaryActionClass} onClick={hostMultiplayer}>
          Host Multiplayer
        </button>
        <button type="button" className={secondaryActionClass} onClick={joinMultiplayer}>
          Join Session
        </button>
      </div>
    </section>
  );
}
