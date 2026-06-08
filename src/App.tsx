import { Gavel, RotateCcw, Shuffle, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  assignProperty,
  buildEligiblePropertyPool,
  calculateOpeningBid,
  createAscendingAuction,
  createPlayers,
  createPropertyDeck,
  passAscendingBidder,
  placeAscendingBid,
  QUICK_BID_INCREMENTS,
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
import type { HostState, PlayerState, ServerEvent } from "./shared/multiplayer";

type BiddingMode = "ascending" | "silent";
type Phase = "setup" | "bidding" | "complete" | "hostLobby" | "playerJoin" | "playerBidding";
type Theme = "light" | "dark";

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
  const [bidDeadline, setBidDeadline] = useState(10);
  const [playerNames, setPlayerNames] = useState(DEFAULT_PLAYER_NAMES);
  const [players, setPlayers] = useState<Player[]>(() => createPlayers(DEFAULT_PLAYER_NAMES));
  const [deck, setDeck] = useState<PropertyDeck>({ revealed: [], hidden: [] });
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [ascendingAuction, setAscendingAuction] = useState<AscendingAuction | null>(null);
  const [silentBids, setSilentBids] = useState<Record<string, { openingBid: number; maxBid: number }>>({});
  const [tiedPlayerIds, setTiedPlayerIds] = useState<string[]>([]);
  const [completedBids, setCompletedBids] = useState<CompletedBid[]>([]);
  const [message, setMessage] = useState("");
  const [selectedWonProperty, setSelectedWonProperty] = useState<Property | null>(null);
  const [bidFeedback, setBidFeedback] = useState<{ playerId: string; increment: number } | null>(null);
  const [lastWinnerName, setLastWinnerName] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("TABLE1");
  const [playerJoinCode, setPlayerJoinCode] = useState("");
  const [joiningPlayerName, setJoiningPlayerName] = useState("");
  const [joinedPlayerName, setJoinedPlayerName] = useState("");
  const [multiplayerMessage, setMultiplayerMessage] = useState("");
  const [hostState, setHostState] = useState<HostState | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [localCountdownRemaining, setLocalCountdownRemaining] = useState(30);
  const [theme, setTheme] = useState<Theme>(() => initialTheme());
  const playerIdRef = useRef<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const eligiblePool = buildEligiblePropertyPool({ includeRailroads, includeUtilities });
  const cappedPropertyCount = Math.min(propertyCount, eligiblePool.length);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (phase !== "playerBidding" || !playerState) {
      return;
    }
    setLocalCountdownRemaining(playerState.countdownRemaining);
    let timeoutId: number | undefined;

    function tick(remaining: number) {
      timeoutId = window.setTimeout(() => {
        const nextRemaining = Math.max(0, remaining - 1);
        setLocalCountdownRemaining(nextRemaining);
        if (nextRemaining > 0) {
          playSound("tick");
          tick(nextRemaining);
        }
      }, countdownTickDelay(remaining));
    }

    tick(playerState.countdownRemaining);
    return () => window.clearTimeout(timeoutId);
  }, [phase, playerState]);

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
    setAscendingAuction(
      revealed.property && mode === "ascending"
        ? createAscendingAuction(nextPlayers, increment, calculateOpeningBid(revealed.property))
        : null
    );
    setSilentBids(
      Object.fromEntries(
        nextPlayers.map((player) => [
          player.id,
          { openingBid: revealed.property ? calculateOpeningBid(revealed.property) : 0, maxBid: 0 }
        ])
      )
    );
    setTiedPlayerIds([]);
    setCompletedBids([]);
    setMessage("");
    setPhase("bidding");
  }

  function revealFollowingProperty(nextPlayers = players, nextCompletedBids = completedBids, nextMessage = "") {
    const revealed = revealNextProperty(deck);
    setDeck(revealed.deck);
    setCurrentProperty(revealed.property);
    setAscendingAuction(
      revealed.property && mode === "ascending"
        ? createAscendingAuction(nextPlayers, increment, calculateOpeningBid(revealed.property))
        : null
    );
    setSilentBids(
      Object.fromEntries(
        nextPlayers.map((player) => [
          player.id,
          { openingBid: revealed.property ? calculateOpeningBid(revealed.property) : 0, maxBid: 0 }
        ])
      )
    );
    setTiedPlayerIds([]);
    setMessage(nextMessage);

    if (!revealed.property) {
      setCompletedBids(nextCompletedBids);
      setPhase("complete");
    }
  }

  function recordResult(winnerId: string | null, price: number, nextMessage = "") {
    if (!currentProperty) return;

    const result = { winnerId, price };
    const winnerName = players.find((player) => player.id === winnerId)?.name ?? null;
    const nextPlayers = winnerId ? assignProperty(players, currentProperty, result) : players;
    const nextCompletedBids = [...completedBids, { property: currentProperty, winnerId, price }];
    setPlayers(nextPlayers);
    setCompletedBids(nextCompletedBids);
    setLastWinnerName(winnerName);
    if (winnerName) {
      playSound("win");
    }
    revealFollowingProperty(nextPlayers, nextCompletedBids, nextMessage);
  }

  function placeBid(playerId: string, bidIncrement: number) {
    if (!ascendingAuction) return;
    const player = players.find((candidate) => candidate.id === playerId);
    if (!player) return;

    try {
      setAscendingAuction(
        placeAscendingBid(ascendingAuction, playerId, ascendingAuction.currentBid + bidIncrement, player.remainingCash)
      );
      setBidFeedback({ playerId, increment: bidIncrement });
      playSound("bid");
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
      const nextMessage =
        nextAuction.status === "skipped" ? "All players skipped. Moving to the next property." : "";
      recordResult(nextAuction.result.winnerId, nextAuction.result.price, nextMessage);
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

  function hostMultiplayer() {
    setJoinCode(createLocalJoinCode());
    setPhase("hostLobby");
    connectSocket((socket) => {
      socket.send(
        JSON.stringify({
          type: "create-session",
          config: {
            includeRailroads,
            includeUtilities,
            propertyCount: cappedPropertyCount,
            increment,
            countdownSeconds: e2eCountdownSeconds() ?? bidDeadline
          }
        })
      );
    });
  }

  function joinMultiplayer() {
    setPlayerJoinCode("");
    setJoiningPlayerName("");
    setMultiplayerMessage("");
    setPhase("playerJoin");
  }

  function submitPlayerJoin() {
    if (!playerJoinCode.trim() || !joiningPlayerName.trim()) {
      setMultiplayerMessage("Join code and player name are required.");
      return;
    }

    const nextName = joiningPlayerName.trim();
    const nextJoinCode = playerJoinCode.trim().toUpperCase();

    connectSocket((socket) => {
      socket.send(JSON.stringify({ type: "join-session", joinCode: nextJoinCode, name: nextName }));
    });

    setJoinedPlayerName(nextName);
    setMultiplayerMessage("");
    setPhase("playerBidding");
  }

  function startMultiplayerBidding() {
    if (socketRef.current?.readyState === WebSocket.OPEN && hostState?.joinCode) {
      socketRef.current.send(JSON.stringify({ type: "start-bidding", joinCode: hostState.joinCode }));
      return;
    }
    setPhase("setup");
  }

  function submitMultiplayerBid(bidIncrement: number) {
    if (!playerState || !playerIdRef.current || socketRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }
    socketRef.current.send(
      JSON.stringify({
        type: "raise-bid",
        joinCode: playerState.joinCode,
        playerId: playerIdRef.current,
        increment: bidIncrement
      })
    );
  }

  function skipMultiplayerProperty() {
    if (!playerState || !playerIdRef.current || socketRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }
    socketRef.current.send(
      JSON.stringify({
        type: "skip-property",
        joinCode: playerState.joinCode,
        playerId: playerIdRef.current
      })
    );
  }

  function connectSocket(onOpen: (socket: WebSocket) => void) {
    if (typeof WebSocket === "undefined") {
      return;
    }

    const socket = new WebSocket(webSocketUrl());
    socketRef.current = socket;
    socket.addEventListener("open", () => onOpen(socket));
    socket.addEventListener("message", (event) => {
      const serverEvent = JSON.parse(String(event.data)) as ServerEvent;
      if (serverEvent.type === "host-state") {
        setHostState(serverEvent.state);
        setJoinCode(serverEvent.state.joinCode);
      }
      if (serverEvent.type === "joined") {
        playerIdRef.current = serverEvent.playerId;
      }
      if (serverEvent.type === "player-state") {
        setPlayerState(serverEvent.state);
        setPhase("playerBidding");
      }
      if (serverEvent.type === "error") {
        setMultiplayerMessage(serverEvent.message);
      }
    });
  }

  return (
    <main className="app-shell">
      <section className="masthead">
        <div>
          <p className="kicker">Hidden-deck setup auction</p>
          <h1>Property Bid Companion</h1>
        </div>
        <div className="masthead-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          >
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </button>
          <div className="cash-badge">${STARTING_CASH} starting cash</div>
        </div>
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
          bidDeadline={bidDeadline}
          setBidDeadline={setBidDeadline}
          playerNames={playerNames}
          updatePlayerName={updatePlayerName}
          addPlayer={addPlayer}
          removePlayer={removePlayer}
          startBidding={startBidding}
          hostMultiplayer={hostMultiplayer}
          joinMultiplayer={joinMultiplayer}
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
          bidFeedback={bidFeedback}
        />
      ) : null}

      {phase === "complete" ? (
        <CompleteScreen
          players={players}
          completedBids={completedBids}
          restart={restart}
          inspectProperty={setSelectedWonProperty}
          lastWinnerName={lastWinnerName}
        />
      ) : null}

      {phase === "hostLobby" ? (
        <HostLobbyScreen
          joinCode={hostState?.joinCode ?? joinCode}
          players={hostState?.players ?? []}
          phase={hostState?.phase ?? "lobby"}
          currentProperty={hostState?.currentProperty?.name ?? null}
          countdownRemaining={hostState?.countdownRemaining ?? 0}
          completedBidCount={hostState?.completedBids.length ?? 0}
          startBidding={startMultiplayerBidding}
          restart={restart}
        />
      ) : null}

      {phase === "playerJoin" ? (
        <PlayerJoinScreen
          joinCode={playerJoinCode}
          name={joiningPlayerName}
          message={multiplayerMessage}
          setJoinCode={setPlayerJoinCode}
          setName={setJoiningPlayerName}
          join={submitPlayerJoin}
          back={restart}
        />
      ) : null}

      {phase === "playerBidding" ? (
        <PlayerBiddingScreen
          playerName={playerState?.player.name ?? joinedPlayerName}
          currentProperty={playerState?.currentProperty ?? null}
          currentBid={playerState?.currentBid ?? 0}
          remainingPropertyCount={playerState?.remainingPropertyCount ?? 10}
          countdownRemaining={localCountdownRemaining}
          remainingCash={playerState?.player.remainingCash ?? 1500}
          wonProperties={playerState?.player.properties ?? []}
          hasSkipped={playerState?.hasSkipped ?? false}
          roundMessage={playerState?.roundMessage ?? null}
          bid={submitMultiplayerBid}
          skip={skipMultiplayerProperty}
        />
      ) : null}

      {selectedWonProperty ? (
        <PropertyDialog property={selectedWonProperty} close={() => setSelectedWonProperty(null)} />
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
  bidDeadline: number;
  setBidDeadline: (seconds: number) => void;
  playerNames: string[];
  updatePlayerName: (index: number, name: string) => void;
  addPlayer: () => void;
  removePlayer: (index: number) => void;
  startBidding: () => void;
  hostMultiplayer: () => void;
  joinMultiplayer: () => void;
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
        <label className="field">
          <span>Bid deadline</span>
          <input
            aria-label="Bid deadline"
            type="number"
            min={5}
            max={30}
            step={1}
            value={props.bidDeadline}
            onChange={(event) => props.setBidDeadline(clampNumber(Number(event.target.value), 5, 30))}
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
        <div className="action-row">
          <button type="button" className="primary-action" onClick={props.startBidding}>
            <Gavel size={20} /> Start bidding
          </button>
          <button type="button" className="secondary-action" onClick={props.hostMultiplayer}>
            Host multiplayer
          </button>
          <button type="button" className="secondary-action" onClick={props.joinMultiplayer}>
            Join session
          </button>
        </div>
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
  placeBid: (playerId: string, bidIncrement: number) => void;
  passBidder: (playerId: string) => void;
  skipProperty: () => void;
  submitSilentAuction: () => void;
  message: string;
  bidFeedback: { playerId: string; increment: number } | null;
}) {
  const activeSilentPlayers =
    props.tiedPlayerIds.length > 0
      ? props.players.filter((player) => props.tiedPlayerIds.includes(player.id))
      : props.players;
  const ascendingAuction = props.ascendingAuction;

  return (
    <div className="bidding-layout">
      <section className="property-stage">
        <p className="kicker">
          Property {props.currentIndex} of {props.totalCount}
        </p>
        <PropertyCard property={props.currentProperty} />
        <p className="opening-bid">Opening bid: ${calculateOpeningBid(props.currentProperty)}</p>
        <div className="hidden-strip">
          {props.deck.hidden.map((property) => (
            <span key={property.id}>Hidden</span>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>{props.mode === "ascending" ? "Ascending Auction" : props.tiedPlayerIds.length ? "Sudden-Death Re-Bid" : "Silent Auction"}</h2>
        {props.mode === "ascending" && ascendingAuction ? (
          <>
            <p className="current-bid">Current bid: ${ascendingAuction.currentBid}</p>
            {props.bidFeedback ? (
              <span className="bid-pop" data-testid="bid-pop">
                +${props.bidFeedback.increment}
              </span>
            ) : null}
            <div className="bidder-list">
              {props.players.map((player) => (
                <div
                  className={`bidder-row ${ascendingAuction.activeBidderIds.includes(player.id) ? "" : "is-skipped"}`}
                  data-testid={`bidder-row-${player.id}`}
                  key={player.id}
                >
                  <div>
                    <strong>{player.name}</strong>
                    <span>${player.remainingCash}</span>
                  </div>
                  <div className="quick-bids" aria-label={`${player.name} bid increments`}>
                    {QUICK_BID_INCREMENTS.map((bidIncrement) => (
                      <button
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

function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="property-card" style={{ "--property-color": propertyAccent(property) } as React.CSSProperties}>
      <div className="property-color-band">
        <span>{property.category === "street" ? property.colorGroup : property.category}</span>
      </div>
      <div className="property-card-body">
        <p className="deed-label">Title Deed</p>
        <h2>{property.name}</h2>
        <div className="property-stat-row">
          <span>Price: ${property.retailValue}</span>
          <span>Mortgage: ${property.mortgage}</span>
        </div>
        {property.category === "street" ? (
          <>
            <div className="rent-grid" aria-label={`${property.name} rent schedule`}>
              <span>Rent ${property.rent[0]}</span>
              <span>1 house ${property.rent[1]}</span>
              <span>2 houses ${property.rent[2]}</span>
              <span>3 houses ${property.rent[3]}</span>
              <span>4 houses ${property.rent[4]}</span>
              <span>Hotel ${property.rent[5]}</span>
            </div>
            <p className="fine-print">
              Houses ${property.houseCost} each. Hotel ${property.hotelCost} plus 4 houses.
            </p>
          </>
        ) : (
          <p className="rent-description">{property.rentDescription}</p>
        )}
      </div>
    </article>
  );
}

function CompleteScreen({
  players,
  completedBids,
  restart,
  inspectProperty,
  lastWinnerName
}: {
  players: Player[];
  completedBids: CompletedBid[];
  restart: () => void;
  inspectProperty: (property: Property) => void;
  lastWinnerName: string | null;
}) {
  return (
    <div className="complete-layout">
      <section className={`complete-hero ${lastWinnerName ? "win-celebration" : ""}`}>
        <Trophy size={34} />
        <h2>Setup complete</h2>
        <p>{completedBids.length} properties resolved.</p>
        {lastWinnerName ? <p>{lastWinnerName} wins!</p> : null}
      </section>
      <section className="summary-grid">
        {players.map((player) => (
          <article className="summary-card" key={player.id}>
            <h3>{player.name}</h3>
            <p>${player.remainingCash}</p>
            {player.properties.length ? (
              <div className="won-property-groups">
                {groupWonProperties(player.properties).map((group) => (
                  <section className="won-property-group" key={group.label}>
                    <h4>{group.label} color group</h4>
                    <div className="mini-card-row">
                      {group.properties.map((property) => (
                        <button
                          type="button"
                          className="mini-property-card"
                          style={{ "--property-color": propertyAccent(property) } as React.CSSProperties}
                          aria-label={`View ${property.name}`}
                          key={property.id}
                          onClick={() => inspectProperty(property)}
                        >
                          <span>{property.name}</span>
                          <strong>${property.retailValue}</strong>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <p className="fine-print">No properties won</p>
            )}
          </article>
        ))}
      </section>
      <button type="button" className="secondary-action" onClick={restart}>
        <RotateCcw size={18} /> New setup
      </button>
    </div>
  );
}

function PropertyDialog({ property, close }: { property: Property; close: () => void }) {
  return (
    <div className="dialog-backdrop">
      <section className="property-dialog" role="dialog" aria-modal="true" aria-label={property.name}>
        <PropertyCard property={property} />
        <button type="button" className="secondary-action" onClick={close}>
          Close
        </button>
      </section>
    </div>
  );
}

function HostLobbyScreen({
  joinCode,
  players,
  phase,
  currentProperty,
  countdownRemaining,
  completedBidCount,
  startBidding,
  restart
}: {
  joinCode: string;
  players: { id: string; name: string; connected: boolean }[];
  phase: string;
  currentProperty: string | null;
  countdownRemaining: number;
  completedBidCount: number;
  startBidding: () => void;
  restart: () => void;
}) {
  return (
    <div className="setup-grid">
      <section className="panel">
        <h2>Host Lobby</h2>
        <p className="kicker">Join code</p>
        <div className="join-code" data-testid="join-code">{joinCode}</div>
        <p className="fine-print">Players join from their own browser using this code.</p>
      </section>
      <section className="panel">
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
          <p className="fine-print">Waiting for players to join.</p>
        )}
        {phase === "bidding" ? (
          <p className="fine-print">
            {currentProperty ?? "Current property"} with {countdownRemaining}s remaining.
          </p>
        ) : null}
        {phase === "complete" ? <p className="fine-print">Completed bids: {completedBidCount}</p> : null}
      </section>
      <section className="start-band">
        <div className="action-row">
          <button type="button" className="primary-action" onClick={startBidding}>
            Start multiplayer bidding
          </button>
          <button type="button" className="secondary-action" onClick={restart}>
            Back
          </button>
        </div>
      </section>
    </div>
  );
}

function PlayerJoinScreen({
  joinCode,
  name,
  message,
  setJoinCode,
  setName,
  join,
  back
}: {
  joinCode: string;
  name: string;
  message: string;
  setJoinCode: (value: string) => void;
  setName: (value: string) => void;
  join: () => void;
  back: () => void;
}) {
  return (
    <section className="panel join-panel">
      <h2>Join Session</h2>
      <label className="field">
        <span>Join code</span>
        <input aria-label="Join code" value={joinCode} onChange={(event) => setJoinCode(event.target.value)} />
      </label>
      <label className="field">
        <span>Player name</span>
        <input aria-label="Player name" value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      {message ? <p role="alert">{message}</p> : null}
      <div className="action-row">
        <button type="button" className="primary-action" onClick={join}>
          Join
        </button>
        <button type="button" className="secondary-action" onClick={back}>
          Back
        </button>
      </div>
    </section>
  );
}

function PlayerBiddingScreen({
  playerName,
  currentProperty,
  currentBid,
  remainingPropertyCount,
  countdownRemaining,
  remainingCash,
  wonProperties,
  hasSkipped,
  roundMessage,
  bid,
  skip
}: {
  playerName: string;
  currentProperty: Property | null;
  currentBid: number;
  remainingPropertyCount: number;
  countdownRemaining: number;
  remainingCash: number;
  wonProperties: Property[];
  hasSkipped: boolean;
  roundMessage: string | null;
  bid: (bidIncrement: number) => void;
  skip: () => void;
}) {
  const countdownClass = countdownRemaining <= 5 && countdownRemaining > 0 ? "countdown countdown-urgent" : "countdown";
  return (
    <div className="bidding-layout">
      <section className="property-stage">
        <div className="property-card-wrap">
          {currentProperty ? <PropertyCard property={currentProperty} /> : <p>Current property</p>}
          {roundMessage === "Skipped!" ? <div className="skipped-overlay">Skipped!</div> : null}
        </div>
        <p className={countdownClass}>{countdownRemaining}s</p>
        <p>Remaining properties: {remainingPropertyCount}</p>
      </section>
      <section className="panel player-bid-panel">
        <h2>{playerName}</h2>
        {roundMessage ? <p role="status">{roundMessage}</p> : null}
        <p className="current-bid">Current bid: ${currentBid}</p>
        <div className="money-bid-row">
          <p className="current-bid money-card">Your cash: ${remainingCash}</p>
          <div className="player-quick-bids">
            {QUICK_BID_INCREMENTS.map((bidIncrement) => (
              <button
                type="button"
                className="primary-action"
                disabled={hasSkipped}
                key={bidIncrement}
                onClick={() => bid(bidIncrement)}
              >
                +${bidIncrement}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="secondary-action skip-bar" disabled={hasSkipped} onClick={skip}>
          {hasSkipped ? "Skipped this round" : "Skip"}
        </button>
        <h3>Your properties</h3>
        {wonProperties.length ? <MiniPropertyCards properties={wonProperties} /> : <p className="fine-print">No properties won</p>}
      </section>
    </div>
  );
}

function MiniPropertyCards({ properties }: { properties: Property[] }) {
  return (
    <div className="mini-card-row player-mini-card-row">
      {sortPropertiesByDisplayValue(properties).map((property) => (
        <div
          className="mini-property-card player-mini-property-card"
          style={{ "--property-color": propertyAccent(property) } as React.CSSProperties}
          key={property.id}
        >
          <span>{property.name}</span>
        </div>
      ))}
    </div>
  );
}

function createLocalJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function webSocketUrl() {
  return import.meta.env.VITE_WS_URL ?? `ws://${window.location.hostname}:8787`;
}

function e2eCountdownSeconds() {
  const value = Number(import.meta.env.VITE_E2E_COUNTDOWN_SECONDS);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function countdownTickDelay(remainingSeconds: number) {
  return remainingSeconds <= 5 ? 350 : 1000;
}

function playSound(kind: "bid" | "win" | "tick") {
  if (typeof Audio === "undefined") {
    return;
  }
  const audio = new Audio(soundDataUri(kind));
  void audio.play?.();
}

function soundDataUri(kind: "bid" | "win" | "tick") {
  const tone = kind === "win" ? "win" : kind === "tick" ? "tick" : "bid";
  return `data:audio/wav;base64,${btoa(tone)}`;
}

function initialTheme(): Theme {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

function propertyAccent(property: Property) {
  if (property.category === "railroad") return "#1f2937";
  if (property.category === "utility") return "#0891b2";
  const colors: Record<string, string> = {
    Purple: "#7e3fa3",
    "Light Blue": "#7dd3fc",
    Pink: "#ec4899",
    Orange: "#f97316",
    Red: "#dc2626",
    Yellow: "#facc15",
    Green: "#16a34a",
    "Dark Blue": "#1d4ed8"
  };
  return colors[property.colorGroup] ?? "#111827";
}

export function sortPropertiesByDisplayValue(properties: Property[]) {
  return [...properties].sort((left, right) => {
    const groupDelta = propertyGroupRank(right) - propertyGroupRank(left);
    if (groupDelta !== 0) return groupDelta;
    return right.retailValue - left.retailValue;
  });
}

function propertyGroupRank(property: Property) {
  if (property.category === "railroad") return 1;
  if (property.category === "utility") return 0;
  const ranks: Record<string, number> = {
    "Dark Blue": 8,
    Green: 7,
    Yellow: 6,
    Red: 5,
    Orange: 4,
    Pink: 3,
    "Light Blue": 3,
    Purple: 2
  };
  return ranks[property.colorGroup] ?? 0;
}

function groupWonProperties(properties: Property[]) {
  const sortedProperties = sortPropertiesByDisplayValue(properties);
  const groups = new Map<string, Property[]>();
  for (const property of sortedProperties) {
    const label = property.category === "street" ? property.colorGroup : property.category;
    groups.set(label, [...(groups.get(label) ?? []), property]);
  }
  return [...groups.entries()].map(([label, groupProperties]) => ({
    label,
    properties: groupProperties
  }));
}
