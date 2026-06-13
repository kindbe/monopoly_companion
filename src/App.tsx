import { Gavel, Moon, RotateCcw, Shuffle, Sun, Trophy } from "lucide-react";
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
import { browserSupportsWebRtc, chooseMultiplayerMode } from "./shared/multiplayerMode";
import { createBrowserWebRtcMultiplayerTransport } from "./shared/browserWebRtcMultiplayerTransport";
import { createWebSocketMultiplayerTransport, type MultiplayerTransport } from "./shared/multiplayerTransport";

type BiddingMode = "ascending" | "silent";
type Phase = "landing" | "hostSetup" | "setup" | "bidding" | "complete" | "hostLobby" | "playerJoin" | "playerBidding";
type Theme = "light" | "dark";

type CompletedBid = {
  property: Property;
  winnerId: string | null;
  price: number;
};

const DEFAULT_PLAYER_NAMES = ["Joelle", "Isaac", "Durd"];

const appShellClass =
  "mx-auto min-h-screen w-full max-w-7xl bg-[#f7f4ff] px-[18px] text-slate-950 antialiased dark:bg-[#121020] dark:text-violet-50 [font-family:'Avenir_Next','Trebuchet_MS',Verdana,sans-serif]";
const mastheadClass = "flex justify-end py-2";
const mastheadTitleClass = "m-0 text-[clamp(1.75rem,4.5vw,3.25rem)] leading-[1.02]";
const kickerClass = "mb-2 mt-0 text-xs font-extrabold uppercase tracking-normal text-violet-600 dark:text-emerald-300";
const panelClass =
  "rounded-lg border border-violet-200/90 bg-white/88 p-4 shadow-[0_16px_38px_rgba(76,58,139,0.10)] ring-1 ring-white/80 transition duration-200 dark:border-violet-400/25 dark:bg-[#1a1730]/92 dark:shadow-[0_18px_44px_rgba(0,0,0,0.28)] dark:ring-white/5";
const setupGridClass = "grid gap-3.5 md:grid-cols-3";
const startBandClass =
  "col-span-full flex flex-col items-stretch justify-between gap-3 rounded-lg border border-violet-200 bg-[linear-gradient(135deg,#ffffff_0%,#f2edff_48%,#e9fbf3_100%)] p-4 shadow-[0_18px_44px_rgba(76,58,139,0.13)] ring-1 ring-white/80 transition duration-200 dark:border-violet-400/25 dark:bg-[linear-gradient(135deg,#1b1732_0%,#151f2d_52%,#10251d_100%)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.30)] dark:ring-white/5 md:flex-row md:items-center";
const actionRowClass = "flex flex-wrap gap-2.5";
const buttonBaseClass =
  "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-md border border-violet-200 px-4 py-2.5 font-extrabold text-slate-950 shadow-[0_8px_20px_rgba(76,58,139,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_12px_26px_rgba(76,58,139,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ff] active:translate-y-0 disabled:pointer-events-none disabled:opacity-45 dark:border-violet-400/30 dark:text-violet-50 dark:shadow-[0_10px_28px_rgba(0,0,0,0.22)] dark:focus-visible:ring-emerald-300 dark:focus-visible:ring-offset-[#121020]";
const primaryActionClass = `${buttonBaseClass} border-emerald-500 bg-emerald-500 text-white hover:border-emerald-400 hover:bg-emerald-400 dark:border-emerald-400 dark:bg-emerald-500 dark:text-[#07130f]`;
const compactPrimaryActionClass = `${primaryActionClass} min-w-0 px-2 sm:px-4`;
const secondaryActionClass = `${buttonBaseClass} bg-white/90 text-violet-900 hover:bg-violet-50 dark:bg-[#211c3c] dark:text-violet-50 dark:hover:bg-[#2a2350]`;
const compactSecondaryActionClass = `${secondaryActionClass} min-w-0 px-2 sm:px-4`;
const themeToggleClass =
  "inline-grid size-5 place-items-center p-0 text-violet-900 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:text-violet-50";
const fieldClass = "my-2.5 grid gap-1.5 font-extrabold";
const checkRowClass = "my-2.5 grid grid-cols-[auto_1fr] items-center gap-1.5 font-extrabold";
const inputClass =
  "min-h-[42px] w-full rounded-md border border-violet-200 bg-white/95 px-2.5 py-2 text-slate-950 shadow-inner shadow-violet-100/40 transition duration-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-violet-400/30 dark:bg-[#12182a] dark:text-violet-50 dark:shadow-none";
const finePrintClass = "mt-2.5 text-slate-600 dark:text-violet-200/76";
const currentBidClass = finePrintClass;
const biddingLayoutClass = "grid gap-3.5 md:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]";
const modeButtonClass =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-violet-200 bg-white/85 px-3 py-2 font-extrabold text-violet-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 aria-pressed:border-emerald-400 aria-pressed:bg-emerald-50 aria-pressed:text-emerald-800 dark:border-violet-400/25 dark:bg-[#211c3c] dark:text-violet-50 dark:hover:bg-[#2a2350] dark:aria-pressed:border-emerald-300 dark:aria-pressed:bg-emerald-400/15 dark:aria-pressed:text-emerald-200";
const checkboxClass = "size-4 accent-emerald-500 transition duration-200";
const propertyStageClass =
  "grid min-h-[260px] content-center gap-3 rounded-lg border border-violet-200 bg-[linear-gradient(145deg,#ffffff_0%,#f3efff_52%,#ecfff6_100%)] p-4 shadow-[0_18px_44px_rgba(76,58,139,0.13)] ring-1 ring-white/80 dark:border-violet-400/25 dark:bg-[linear-gradient(145deg,#19172c_0%,#151b2d_52%,#10251d_100%)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.30)] dark:ring-white/5 md:min-h-[420px]";
const propertyCardClass =
  "mx-auto w-full max-w-[420px] animate-[property-reveal_360ms_ease-out] overflow-hidden rounded-xl border border-violet-300 bg-white text-slate-950 shadow-[0_18px_36px_rgba(76,58,139,0.16)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_46px_rgba(76,58,139,0.20)] dark:border-violet-400/35 dark:bg-[#f8fbff] dark:text-slate-950";
const propertyBandClass =
  "grid min-h-[72px] place-items-center border-b border-violet-200 bg-(--property-color) font-black uppercase text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.45)]";
const propertyBodyClass = "grid gap-2.5 p-4 text-center";
const propertyTitleClass = "text-[clamp(1.3rem,4vw,2rem)] uppercase text-[#1b1830]";
const countdownClassBase =
  "mx-auto mt-1 w-full max-w-[420px] rounded-lg border border-emerald-200 bg-white/86 p-3 text-center text-3xl font-black tracking-[0.02em] text-emerald-600 shadow-[0_12px_28px_rgba(16,185,129,0.12)] transition duration-200 dark:border-emerald-400/30 dark:bg-[#182437]/90 dark:text-emerald-300";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("landing");
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
  const [hostName, setHostName] = useState("");
  const [playerJoinCode, setPlayerJoinCode] = useState("");
  const [joiningPlayerName, setJoiningPlayerName] = useState("");
  const [joinedPlayerName, setJoinedPlayerName] = useState("");
  const [multiplayerMessage, setMultiplayerMessage] = useState("");
  const [hostState, setHostState] = useState<HostState | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [localCountdownRemaining, setLocalCountdownRemaining] = useState(30);
  const [theme, setTheme] = useState<Theme>(() => initialTheme());
  const playerIdRef = useRef<string | null>(null);
  const transportRef = useRef<MultiplayerTransport | null>(null);

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
    setPhase("landing");
    setPlayers(createPlayers(DEFAULT_PLAYER_NAMES));
    setCurrentProperty(null);
    setDeck({ revealed: [], hidden: [] });
    setCompletedBids([]);
    setMessage("");
  }

  function hostMultiplayer() {
    setHostName("");
    setMultiplayerMessage("");
    setPhase("hostSetup");
  }

  function createMultiplayerSession() {
    const nextHostName = hostName.trim();
    if (!nextHostName) {
      setMultiplayerMessage("Host name is required.");
      return;
    }
    setJoinCode(createLocalJoinCode());
    setPhase("hostLobby");
    const transport = connectTransport();
    transport?.createSession({
      hostName: nextHostName,
      config: {
        includeRailroads,
        includeUtilities,
        propertyCount: cappedPropertyCount,
        increment,
        countdownSeconds: e2eCountdownSeconds() ?? bidDeadline
      }
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

    connectTransport()?.joinSession({ joinCode: nextJoinCode, name: nextName });

    setJoinedPlayerName(nextName);
    setMultiplayerMessage("");
    setPhase("playerBidding");
  }

  function startMultiplayerBidding() {
    setMultiplayerMessage("");
    if (transportRef.current?.isOpen() && hostState?.joinCode) {
      transportRef.current.startBidding(hostState.joinCode);
      return;
    }
    setPhase("setup");
  }

  function submitMultiplayerBid(bidIncrement: number) {
    if (!playerState || !playerIdRef.current || !transportRef.current?.isOpen()) {
      return;
    }
    transportRef.current.raiseBid({
      joinCode: playerState.joinCode,
      playerId: playerIdRef.current,
      increment: bidIncrement
    });
  }

  function skipMultiplayerProperty() {
    if (!playerState || !playerIdRef.current || !transportRef.current?.isOpen()) {
      return;
    }
    transportRef.current.skipProperty({
      joinCode: playerState.joinCode,
      playerId: playerIdRef.current
    });
  }

  function connectTransport() {
    const mode = chooseMultiplayerMode({
      requestedMode: import.meta.env.VITE_MULTIPLAYER_TRANSPORT,
      hasWebRtc: browserSupportsWebRtc(),
      hasWebSocket: typeof WebSocket !== "undefined"
    });

    if (mode === "unavailable") {
      setMultiplayerMessage("This browser does not support multiplayer connections.");
      return null;
    }
    const handleEvent = (serverEvent: Parameters<typeof handleMultiplayerEvent>[0]) => handleMultiplayerEvent(serverEvent);
    const transport =
      mode === "webrtc"
        ? createBrowserWebRtcMultiplayerTransport({
            signalingUrl: webSocketUrl(),
            onEvent: handleEvent,
            onError: setMultiplayerMessage
          })
        : createWebSocketMultiplayerTransport({
            url: webSocketUrl(),
            onEvent: handleEvent
          });
    transportRef.current = transport;
    transport.connect();
    return transport;
  }

  function handleMultiplayerEvent(serverEvent: ServerEvent) {
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
  }

  return (
    <main className={appShellClass}>
      <section className={mastheadClass}>
        <button
          type="button"
          className={themeToggleClass}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        >
          {theme === "dark" ? <Sun aria-hidden="true" size={14} /> : <Moon aria-hidden="true" size={14} />}
        </button>
      </section>

      {phase === "landing" ? <LandingScreen hostMultiplayer={hostMultiplayer} joinMultiplayer={joinMultiplayer} /> : null}

      {phase === "hostSetup" ? (
        <HostSetupScreen
          hostName={hostName}
          setHostName={setHostName}
          includeRailroads={includeRailroads}
          setIncludeRailroads={setIncludeRailroads}
          includeUtilities={includeUtilities}
          setIncludeUtilities={setIncludeUtilities}
          propertyCount={cappedPropertyCount}
          setPropertyCount={setPropertyCount}
          maxProperties={eligiblePool.length}
          bidDeadline={bidDeadline}
          setBidDeadline={setBidDeadline}
          message={multiplayerMessage}
          createSession={createMultiplayerSession}
          back={restart}
        />
      ) : null}

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
          message={multiplayerMessage}
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
    <div className={setupGridClass}>
      <section className={panelClass}>
        <h2>Auction Rules</h2>
        <div className="mb-4 grid grid-cols-2 gap-2" aria-label="Bidding mode">
          <button type="button" className={modeButtonClass} aria-pressed={props.mode === "ascending"} onClick={() => props.setMode("ascending")}>
            <Gavel size={18} /> Ascending
          </button>
          <button type="button" className={modeButtonClass} aria-pressed={props.mode === "silent"} onClick={() => props.setMode("silent")}>
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
            onChange={(event) => props.setIncrement(Math.max(1, Number(event.target.value)))}
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
            onChange={(event) => props.setBidDeadline(clampNumber(Number(event.target.value), 5, 30))}
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

      <section className={`${panelClass} grid content-start gap-2`}>
        <h2>Players</h2>
        {props.playerNames.map((name, index) => (
          <div className="grid grid-cols-[1fr_42px] gap-2" key={index}>
            <input
              className={inputClass}
              aria-label={`Player ${index + 1} name`}
              value={name}
              onChange={(event) => props.updatePlayerName(index, event.target.value)}
            />
            <button className={secondaryActionClass} type="button" onClick={() => props.removePlayer(index)} aria-label={`Remove player ${index + 1}`}>
              -
            </button>
          </div>
        ))}
        <button type="button" className={secondaryActionClass} onClick={props.addPlayer}>
          Add player
        </button>
      </section>

      <section className={startBandClass}>
        {props.message ? <p role="alert">{props.message}</p> : null}
        <div className={actionRowClass}>
          <button type="button" className={primaryActionClass} onClick={props.startBidding}>
            <Gavel size={20} /> Start bidding
          </button>
          <button type="button" className={secondaryActionClass} onClick={props.hostMultiplayer}>
            Host multiplayer
          </button>
          <button type="button" className={secondaryActionClass} onClick={props.joinMultiplayer}>
            Join session
          </button>
        </div>
      </section>
    </div>
  );
}

function LandingScreen({
  hostMultiplayer,
  joinMultiplayer
}: {
  hostMultiplayer: () => void;
  joinMultiplayer: () => void;
}) {
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

function HostSetupScreen(props: {
  hostName: string;
  setHostName: (name: string) => void;
  includeRailroads: boolean;
  setIncludeRailroads: (enabled: boolean) => void;
  includeUtilities: boolean;
  setIncludeUtilities: (enabled: boolean) => void;
  propertyCount: number;
  setPropertyCount: (count: number) => void;
  maxProperties: number;
  bidDeadline: number;
  setBidDeadline: (seconds: number) => void;
  message: string;
  createSession: () => void;
  back: () => void;
}) {
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

function PropertyCard({ property }: { property: Property }) {
  return (
    <article className={propertyCardClass} style={{ "--property-color": propertyAccent(property) } as React.CSSProperties}>
      <div className={propertyBandClass}>
        <span>{property.category === "street" ? property.colorGroup : property.category}</span>
      </div>
      <div className={propertyBodyClass}>
        <p className="m-0 font-black uppercase tracking-[0.08em]">Title Deed</p>
        <h2 className={propertyTitleClass}>{property.name}</h2>
        <div className="grid grid-cols-2 gap-1.5 font-black">
          <span>Price: ${property.retailValue}</span>
          <span>Mortgage: ${property.mortgage}</span>
        </div>
        {property.category === "street" ? (
          <>
            <div className="grid grid-cols-2 gap-1.5 text-left" aria-label={`${property.name} rent schedule`}>
              <span>Rent ${property.rent[0]}</span>
              <span>1 house ${property.rent[1]}</span>
              <span>2 houses ${property.rent[2]}</span>
              <span>3 houses ${property.rent[3]}</span>
              <span>4 houses ${property.rent[4]}</span>
              <span>Hotel ${property.rent[5]}</span>
            </div>
            <p className={finePrintClass}>
              Houses ${property.houseCost} each. Hotel ${property.hotelCost} plus 4 houses.
            </p>
          </>
        ) : (
          <p className="border-t border-[#1b1b18]/25 pt-1.5 font-extrabold">{property.rentDescription}</p>
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
    <div className="grid gap-3.5">
      <section className="flex items-center gap-3.5 rounded-lg border border-emerald-200 bg-[linear-gradient(135deg,#ecfff6_0%,#f2edff_100%)] p-4 text-slate-950 shadow-[0_18px_44px_rgba(16,185,129,0.14)] ring-1 ring-white/80 dark:border-emerald-400/25 dark:bg-[linear-gradient(135deg,#10251d_0%,#211c3c_100%)] dark:text-violet-50 dark:ring-white/5">
        <Trophy size={34} />
        <h2 className={mastheadTitleClass}>Setup complete</h2>
        <p>{completedBids.length} properties resolved.</p>
        {lastWinnerName ? <p>{lastWinnerName} wins!</p> : null}
      </section>
      <section className="grid gap-2.5 md:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
        {players.map((player) => (
          <article className={panelClass} key={player.id}>
            <h3>{player.name}</h3>
            <p className="mb-2 mt-0 text-2xl font-black">${player.remainingCash}</p>
            {player.properties.length ? (
              <div className="grid gap-3">
                {groupWonProperties(player.properties).map((group) => (
                  <section key={group.label}>
                    <h4 className="mb-2 mt-0 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-600 dark:text-violet-200/76">{group.label} color group</h4>
                    <div className="flex flex-wrap gap-2">
                      {group.properties.map((property) => (
                        <button
                          type="button"
                          className="grid min-h-19.5 w-27 content-between rounded-lg border border-violet-200 bg-[linear-gradient(var(--property-color)_0_24px,transparent_24px),#ffffff] px-2 pb-2 pt-7 text-left text-slate-950 shadow-[0_8px_20px_rgba(76,58,139,0.10)] transition duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_14px_28px_rgba(76,58,139,0.16)] focus-visible:-translate-y-1 focus-visible:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-violet-400/35 dark:text-slate-950"
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
              <p className={finePrintClass}>No properties won</p>
            )}
          </article>
        ))}
      </section>
      <button type="button" className={secondaryActionClass} onClick={restart}>
        <RotateCcw size={18} /> New setup
      </button>
    </div>
  );
}

function PropertyDialog({ property, close }: { property: Property; close: () => void }) {
  return (
    <div className="fixed inset-0 z-10 grid place-items-center bg-violet-950/55 p-5 backdrop-blur-sm">
      <section className="grid animate-[app-enter_220ms_ease-out] justify-items-center gap-4" role="dialog" aria-modal="true" aria-label={property.name}>
        <PropertyCard property={property} />
        <button type="button" className={secondaryActionClass} onClick={close}>
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
  message,
  startBidding,
  restart
}: {
  joinCode: string;
  players: { id: string; name: string; connected: boolean }[];
  phase: string;
  currentProperty: string | null;
  countdownRemaining: number;
  completedBidCount: number;
  message: string;
  startBidding: () => void;
  restart: () => void;
}) {
  return (
    <div className={setupGridClass}>
      <section className={panelClass}>
        <h2>Host Lobby</h2>
        <p className={kickerClass}>Join code</p>
        <div className="rounded-md border border-violet-200 bg-white/95 p-4 text-3xl font-black tracking-[0.08em] text-violet-900 shadow-[0_12px_28px_rgba(76,58,139,0.12)] ring-1 ring-white/80 dark:border-violet-400/30 dark:bg-[#12182a] dark:text-emerald-200 dark:ring-white/5" data-testid="join-code">{joinCode}</div>
        <p className={finePrintClass}>Players join from their own browser using this code.</p>
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
          <p className={finePrintClass}>
            {currentProperty ?? "Current property"} with {countdownRemaining}s remaining.
          </p>
        ) : null}
        {phase === "complete" ? <p className={finePrintClass}>Completed bids: {completedBidCount}</p> : null}
      </section>
      <section className={startBandClass}>
        {message ? <p role="alert">{message}</p> : null}
        <div className={actionRowClass}>
          <button type="button" className={primaryActionClass} onClick={startBidding}>
            Start multiplayer bidding
          </button>
          <button type="button" className={secondaryActionClass} onClick={restart}>
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
  const countdownClass = cx(
    countdownClassBase,
    countdownRemaining <= 5 &&
      countdownRemaining > 0 &&
      "animate-[urgent-pulse_900ms_ease-in-out_infinite] border-rose-200 text-rose-600 dark:border-rose-300/35 dark:text-rose-300"
  );
  return (
    <div className={biddingLayoutClass}>
      <section className={propertyStageClass}>
        <div className="relative mx-auto w-full max-w-105">
          {currentProperty ? <PropertyCard property={currentProperty} /> : null}
          {roundMessage === "Skipped!" ? (
            <div
              className="absolute inset-0 z-1 grid animate-[overlay-in_220ms_ease-out] rotate-[-7deg] place-items-center rounded-xl bg-violet-950/75 text-[clamp(2.4rem,9vw,5.4rem)] font-black uppercase tracking-[0.06em] text-white backdrop-blur-[2px] [text-shadow:0_4px_0_rgba(0,0,0,0.45)]"
              data-testid="skipped-overlay"
            >
              Skipped!
            </div>
          ) : null}
        </div>
        <p className={countdownClass}>{countdownRemaining}s</p>
        <p>Remaining properties: {remainingPropertyCount}</p>
      </section>
      <section className={`${panelClass} grid content-start gap-3`}>
        {roundMessage ? <p role="status">{roundMessage}</p> : null}
        <p className={currentBidClass}>Current bid: ${currentBid}</p>
        <div className="grid items-stretch gap-2.5 md:grid-cols-[minmax(150px,1fr)_minmax(170px,1.15fr)]">
          <p className="mt-2.5 grid min-h-24 place-items-center rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-center font-black text-emerald-800 shadow-inner shadow-emerald-100/60 transition duration-200 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200 dark:shadow-none">
            Your cash: ${remainingCash} / ${STARTING_CASH}
          </p>
          <div className="grid grid-cols-2 gap-2 [&>button]:min-w-0" data-testid="player-quick-bids">
            {QUICK_BID_INCREMENTS.map((bidIncrement) => (
              <button
                type="button"
                className={compactPrimaryActionClass}
                disabled={hasSkipped}
                key={bidIncrement}
                onClick={() => bid(bidIncrement)}
              >
                +${bidIncrement}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className={`${compactSecondaryActionClass} w-full`} disabled={hasSkipped} onClick={skip}>
          {hasSkipped ? "Skipped this round" : "Skip"}
        </button>
        <h3>Your properties</h3>
        {wonProperties.length ? <MiniPropertyCards properties={wonProperties} /> : <p className={finePrintClass}>No properties won</p>}
      </section>
    </div>
  );
}

function MiniPropertyCards({ properties }: { properties: Property[] }) {
  return (
    <div className="grid grid-cols-[repeat(4,minmax(92px,1fr))] gap-2">
      {sortPropertiesByDisplayValue(properties).map((property) => (
        <div
          className="pointer-events-none grid min-h-19 content-between rounded-lg border border-violet-200 bg-white px-2 pb-2 pt-7 text-left text-slate-950 shadow-[0_8px_20px_rgba(76,58,139,0.10)] transition duration-200 dark:border-violet-400/35 dark:bg-white dark:text-slate-950"
          data-testid="mini-property-card"
          style={miniPropertyCardStyle(property)}
          key={property.id}
        >
          <span>{property.name}</span>
        </div>
      ))}
    </div>
  );
}

function miniPropertyCardStyle(property: Property) {
  const accent = propertyAccent(property);
  return {
    "--property-color": accent,
    backgroundColor: "#ffffff",
    backgroundImage: `linear-gradient(${accent} 0 24px, transparent 24px)`
  } as React.CSSProperties;
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
  try {
    playTone(kind);
  } catch {
    // Sound is best-effort; blocked or unsupported audio should never affect bidding.
  }
}

function playTone(kind: "bid" | "win" | "tick") {
  const audioWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!AudioContextConstructor) {
    return;
  }
  const audioContext = new AudioContextConstructor();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;
  const duration = kind === "win" ? 0.18 : kind === "tick" ? 0.035 : 0.08;

  oscillator.type = "sine";
  oscillator.frequency.value = kind === "win" ? 660 : kind === "tick" ? 880 : 440;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(kind === "tick" ? 0.025 : 0.06, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
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
