import { Gavel, RotateCcw, Shuffle, Trophy } from "lucide-react";
import { useState } from "react";
import {
  assignProperty,
  buildEligiblePropertyPool,
  createAscendingAuction,
  createPlayers,
  createPropertyDeck,
  MONOPOLY_PROPERTIES,
  passAscendingBidder,
  placeAscendingBid,
  resolveSilentAuction,
  revealNextProperty,
  skipCurrentProperty,
  STARTING_CASH,
  type AscendingAuction,
  type Player,
  type Property,
  type PropertyDeck,
  type SilentBid
} from "./domain/bidding";

type BiddingMode = "ascending" | "silent";
type Phase = "setup" | "bidding" | "complete";

type CompletedBid = {
  property: Property;
  winnerId: string | null;
  price: number;
};

const DEFAULT_PLAYER_NAMES = ["Joelle", "Isaac", "Durd"];

export default function App() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<BiddingMode>("ascending");
  const [includeRailroads, setIncludeRailroads] = useState(false);
  const [includeUtilities, setIncludeUtilities] = useState(false);
  const [propertyCount, setPropertyCount] = useState(10);
  const [increment, setIncrement] = useState(10);
  const [playerNames, setPlayerNames] = useState(DEFAULT_PLAYER_NAMES);
  const [players, setPlayers] = useState<Player[]>(() => createPlayers(DEFAULT_PLAYER_NAMES));
  const [deck, setDeck] = useState<PropertyDeck>({ revealed: [], hidden: [] });
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [ascendingAuction, setAscendingAuction] = useState<AscendingAuction | null>(null);
  const [silentBids, setSilentBids] = useState<Record<string, { openingBid: number; maxBid: number }>>({});
  const [tiedPlayerIds, setTiedPlayerIds] = useState<string[]>([]);
  const [completedBids, setCompletedBids] = useState<CompletedBid[]>([]);
  const [message, setMessage] = useState("");

  const eligiblePool = buildEligiblePropertyPool({ includeRailroads, includeUtilities });
  const cappedPropertyCount = Math.min(propertyCount, eligiblePool.length);

  function updatePlayerName(index: number, name: string) {
    setPlayerNames((names) => names.map((current, currentIndex) => (currentIndex === index ? name : current)));
  }

  function addPlayer() {
    setPlayerNames((names) => [...names, `Player ${names.length + 1}`]);
  }

  function removePlayer(index: number) {
    setPlayerNames((names) => names.filter((_, currentIndex) => currentIndex !== index));
  }

  function startBidding() {
    const nextPlayers = createPlayers(playerNames);
    if (nextPlayers.length < 2) {
      setMessage("Add at least two players.");
      return;
    }

    const nextDeck = createPropertyDeck({ pool: eligiblePool, count: cappedPropertyCount });
    const revealed = revealNextProperty(nextDeck);
    setPlayers(nextPlayers);
    setDeck(revealed.deck);
    setCurrentProperty(revealed.property);
    setAscendingAuction(mode === "ascending" ? createAscendingAuction(nextPlayers, increment) : null);
    setSilentBids(Object.fromEntries(nextPlayers.map((player) => [player.id, { openingBid: 0, maxBid: 0 }])));
    setTiedPlayerIds([]);
    setCompletedBids([]);
    setMessage("");
    setPhase("bidding");
  }

  function revealFollowingProperty(nextPlayers = players, nextCompletedBids = completedBids) {
    const revealed = revealNextProperty(deck);
    setDeck(revealed.deck);
    setCurrentProperty(revealed.property);
    setAscendingAuction(revealed.property && mode === "ascending" ? createAscendingAuction(nextPlayers, increment) : null);
    setSilentBids(Object.fromEntries(nextPlayers.map((player) => [player.id, { openingBid: 0, maxBid: 0 }])));
    setTiedPlayerIds([]);
    setMessage("");

    if (!revealed.property) {
      setCompletedBids(nextCompletedBids);
      setPhase("complete");
    }
  }

  function recordResult(winnerId: string | null, price: number) {
    if (!currentProperty) return;

    const result = { winnerId, price };
    const nextPlayers = winnerId ? assignProperty(players, currentProperty, result) : players;
    const nextCompletedBids = [...completedBids, { property: currentProperty, winnerId, price }];
    setPlayers(nextPlayers);
    setCompletedBids(nextCompletedBids);
    revealFollowingProperty(nextPlayers, nextCompletedBids);
  }

  function placeBid(playerId: string) {
    if (!ascendingAuction) return;
    const player = players.find((candidate) => candidate.id === playerId);
    if (!player) return;

    try {
      setAscendingAuction(
        placeAscendingBid(ascendingAuction, playerId, ascendingAuction.currentBid + increment, player.remainingCash)
      );
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bid could not be placed.");
    }
  }

  function passBidder(playerId: string) {
    if (!ascendingAuction) return;
    const nextAuction = passAscendingBidder(ascendingAuction, playerId);
    setAscendingAuction(nextAuction);

    if (nextAuction.result) {
      recordResult(nextAuction.result.winnerId, nextAuction.result.price);
    }
  }

  function skipProperty() {
    if (mode === "ascending" && ascendingAuction) {
      skipCurrentProperty(ascendingAuction);
    }
    recordResult(null, 0);
  }

  function submitSilentAuction() {
    const participatingIds = tiedPlayerIds.length > 0 ? tiedPlayerIds : players.map((player) => player.id);
    const bids: SilentBid[] = players
      .filter((player) => participatingIds.includes(player.id))
      .map((player) => ({
        playerId: player.id,
        openingBid: silentBids[player.id]?.openingBid ?? 0,
        maxBid: silentBids[player.id]?.maxBid ?? 0,
        remainingCash: player.remainingCash
      }));

    try {
      const result = resolveSilentAuction({ bids, increment });
      if (result.status === "tie") {
        setTiedPlayerIds(result.tiedPlayerIds);
        setSilentBids(Object.fromEntries(result.tiedPlayerIds.map((playerId) => [playerId, { openingBid: 0, maxBid: 0 }])));
        setMessage("Top bids tied. Run sudden-death re-bid.");
        return;
      }

      recordResult(result.winnerId, result.price);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Silent auction could not be resolved.");
    }
  }

  function restart() {
    setPhase("setup");
    setPlayers(createPlayers(DEFAULT_PLAYER_NAMES));
    setCurrentProperty(null);
    setDeck({ revealed: [], hidden: [] });
    setCompletedBids([]);
    setMessage("");
  }

  return (
    <main className="app-shell">
      <section className="masthead">
        <div>
          <p className="kicker">Hidden-deck setup auction</p>
          <h1>Property Bid Companion</h1>
        </div>
        <div className="cash-badge">${STARTING_CASH} starting cash</div>
      </section>

      {phase === "setup" ? (
        <SetupScreen
          mode={mode}
          setMode={setMode}
          includeRailroads={includeRailroads}
          setIncludeRailroads={setIncludeRailroads}
          includeUtilities={includeUtilities}
          setIncludeUtilities={setIncludeUtilities}
          propertyCount={cappedPropertyCount}
          setPropertyCount={setPropertyCount}
          maxProperties={eligiblePool.length}
          increment={increment}
          setIncrement={setIncrement}
          playerNames={playerNames}
          updatePlayerName={updatePlayerName}
          addPlayer={addPlayer}
          removePlayer={removePlayer}
          startBidding={startBidding}
          message={message}
        />
      ) : null}

      {phase === "bidding" && currentProperty ? (
        <BiddingScreen
          mode={mode}
          players={players}
          deck={deck}
          currentProperty={currentProperty}
          currentIndex={completedBids.length + 1}
          totalCount={completedBids.length + 1 + deck.hidden.length}
          increment={increment}
          ascendingAuction={ascendingAuction}
          silentBids={silentBids}
          tiedPlayerIds={tiedPlayerIds}
          setSilentBids={setSilentBids}
          placeBid={placeBid}
          passBidder={passBidder}
          skipProperty={skipProperty}
          submitSilentAuction={submitSilentAuction}
          message={message}
        />
      ) : null}

      {phase === "complete" ? (
        <CompleteScreen players={players} completedBids={completedBids} restart={restart} />
      ) : null}
    </main>
  );
}

function SetupScreen(props: {
  mode: BiddingMode;
  setMode: (mode: BiddingMode) => void;
  includeRailroads: boolean;
  setIncludeRailroads: (enabled: boolean) => void;
  includeUtilities: boolean;
  setIncludeUtilities: (enabled: boolean) => void;
  propertyCount: number;
  setPropertyCount: (count: number) => void;
  maxProperties: number;
  increment: number;
  setIncrement: (increment: number) => void;
  playerNames: string[];
  updatePlayerName: (index: number, name: string) => void;
  addPlayer: () => void;
  removePlayer: (index: number) => void;
  startBidding: () => void;
  message: string;
}) {
  return (
    <div className="setup-grid">
      <section className="panel">
        <h2>Auction Rules</h2>
        <div className="segmented" aria-label="Bidding mode">
          <button type="button" aria-pressed={props.mode === "ascending"} onClick={() => props.setMode("ascending")}>
            <Gavel size={18} /> Ascending
          </button>
          <button type="button" aria-pressed={props.mode === "silent"} onClick={() => props.setMode("silent")}>
            <Shuffle size={18} /> Silent
          </button>
        </div>
        <label className="field">
          <span>Bid increment</span>
          <input
            aria-label="Bid increment"
            type="number"
            min={1}
            step={1}
            value={props.increment}
            onChange={(event) => props.setIncrement(Math.max(1, Number(event.target.value)))}
          />
        </label>
      </section>

      <section className="panel">
        <h2>Property Pool</h2>
        <label className="check-row">
          <input
            type="checkbox"
            checked={props.includeRailroads}
            onChange={(event) => props.setIncludeRailroads(event.target.checked)}
          />
          Include railroads
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={props.includeUtilities}
            onChange={(event) => props.setIncludeUtilities(event.target.checked)}
          />
          Include utilities
        </label>
        <label className="field">
          <span>Property count</span>
          <input
            aria-label="Property count"
            type="number"
            min={1}
            max={props.maxProperties}
            value={props.propertyCount}
            onChange={(event) => props.setPropertyCount(Number(event.target.value))}
          />
        </label>
        <p className="fine-print">{props.maxProperties} eligible properties. The reveal list stays hidden.</p>
      </section>

      <section className="panel players-panel">
        <h2>Players</h2>
        {props.playerNames.map((name, index) => (
          <div className="player-input" key={index}>
            <input
              aria-label={`Player ${index + 1} name`}
              value={name}
              onChange={(event) => props.updatePlayerName(index, event.target.value)}
            />
            <button type="button" onClick={() => props.removePlayer(index)} aria-label={`Remove player ${index + 1}`}>
              -
            </button>
          </div>
        ))}
        <button type="button" className="secondary-action" onClick={props.addPlayer}>
          Add player
        </button>
      </section>

      <section className="start-band">
        {props.message ? <p role="alert">{props.message}</p> : null}
        <button type="button" className="primary-action" onClick={props.startBidding}>
          <Gavel size={20} /> Start bidding
        </button>
      </section>
    </div>
  );
}

function BiddingScreen(props: {
  mode: BiddingMode;
  players: Player[];
  deck: PropertyDeck;
  currentProperty: Property;
  currentIndex: number;
  totalCount: number;
  increment: number;
  ascendingAuction: AscendingAuction | null;
  silentBids: Record<string, { openingBid: number; maxBid: number }>;
  tiedPlayerIds: string[];
  setSilentBids: React.Dispatch<React.SetStateAction<Record<string, { openingBid: number; maxBid: number }>>>;
  placeBid: (playerId: string) => void;
  passBidder: (playerId: string) => void;
  skipProperty: () => void;
  submitSilentAuction: () => void;
  message: string;
}) {
  const activeSilentPlayers =
    props.tiedPlayerIds.length > 0
      ? props.players.filter((player) => props.tiedPlayerIds.includes(player.id))
      : props.players;

  return (
    <div className="bidding-layout">
      <section className="property-stage">
        <p className="kicker">
          Property {props.currentIndex} of {props.totalCount}
        </p>
        <h2>{props.currentProperty.name}</h2>
        <p>{props.currentProperty.colorGroup ?? props.currentProperty.category}</p>
        <div className="hidden-strip">
          {props.deck.hidden.map((property) => (
            <span key={property.id}>Hidden</span>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>{props.mode === "ascending" ? "Ascending Auction" : props.tiedPlayerIds.length ? "Sudden-Death Re-Bid" : "Silent Auction"}</h2>
        {props.mode === "ascending" && props.ascendingAuction ? (
          <>
            <p className="current-bid">Current bid: ${props.ascendingAuction.currentBid}</p>
            <div className="bidder-list">
              {props.players.map((player) => (
                <div className="bidder-row" key={player.id}>
                  <div>
                    <strong>{player.name}</strong>
                    <span>${player.remainingCash}</span>
                  </div>
                  <button type="button" onClick={() => props.placeBid(player.id)}>
                    +${props.increment}
                  </button>
                  <button type="button" onClick={() => props.passBidder(player.id)}>
                    Pass
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="silent-grid">
              {activeSilentPlayers.map((player) => (
                <div className="silent-row" key={player.id}>
                  <strong>{player.name}</strong>
                  <label>
                    Opening
                    <input
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
                  <label>
                    Max
                    <input
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
            <button type="button" className="primary-action" onClick={props.submitSilentAuction}>
              Resolve bids
            </button>
          </>
        )}
        <button type="button" className="secondary-action" onClick={props.skipProperty}>
          Skip no-bid
        </button>
        {props.message ? <p role="alert">{props.message}</p> : null}
      </section>
    </div>
  );
}

function CompleteScreen({
  players,
  completedBids,
  restart
}: {
  players: Player[];
  completedBids: CompletedBid[];
  restart: () => void;
}) {
  return (
    <div className="complete-layout">
      <section className="complete-hero">
        <Trophy size={34} />
        <h2>Setup complete</h2>
        <p>{completedBids.length} properties resolved.</p>
      </section>
      <section className="summary-grid">
        {players.map((player) => (
          <article className="summary-card" key={player.id}>
            <h3>{player.name}</h3>
            <p>${player.remainingCash}</p>
            <ul>
              {player.properties.length ? (
                player.properties.map((property) => <li key={property.id}>{property.name}</li>)
              ) : (
                <li>No properties won</li>
              )}
            </ul>
          </article>
        ))}
      </section>
      <button type="button" className="secondary-action" onClick={restart}>
        <RotateCcw size={18} /> New setup
      </button>
    </div>
  );
}
