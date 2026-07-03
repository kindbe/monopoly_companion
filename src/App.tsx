import { Moon, Sun } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import {
  assignProperty,
  buildEligiblePropertyPool,
  calculateOpeningBid,
  createAscendingAuction,
  createPlayers,
  createPropertyDeck,
  passAscendingBidder,
  placeAscendingBid,
  resolveSilentAuction,
  revealNextProperty,
  skipCurrentProperty,
  type AscendingAuction,
  type Player,
  type Property,
  type PropertyDeck,
  type SilentBid
} from "@/domain/bidding"
import type {
  BiddingMode,
  CompletedBid,
  Phase,
  Theme
} from "@/common/auctionTypes"
import {
  activeScreenClass,
  appShellClass,
  mastheadClass,
  themeToggleClass
} from "@/common/uiClasses"
import { BiddingScreen } from "@/components/BiddingScreen/BiddingScreen"
import { CompleteScreen } from "@/components/CompleteScreen/CompleteScreen"
import { HostLobbyScreen } from "@/components/HostLobbyScreen/HostLobbyScreen"
import { HostSetupScreen } from "@/components/HostSetupScreen/HostSetupScreen"
import { LandingScreen } from "@/components/LandingScreen/LandingScreen"
import { PlayerBiddingScreen } from "@/components/PlayerBiddingScreen/PlayerBiddingScreen"
import { PlayerJoinScreen } from "@/components/PlayerJoinScreen/PlayerJoinScreen"
import { PropertyDialog } from "@/components/PropertyDialog/PropertyDialog"
import { SetupScreen } from "@/components/SetupScreen/SetupScreen"
import type { HostState, PlayerState, ServerEvent } from "@/shared/multiplayer"
import {
  browserSupportsWebRtc,
  chooseMultiplayerMode
} from "@/shared/multiplayerMode"
import { createBrowserWebRtcMultiplayerTransport } from "@/shared/browserWebRtcMultiplayerTransport"
import {
  createWebSocketMultiplayerTransport,
  type MultiplayerTransport
} from "@/shared/multiplayerTransport"

const DEFAULT_PLAYER_NAMES = ["Joelle", "Isaac", "Durd"]

export default function App() {
  const [phase, setPhase] = useState<Phase>("landing")
  const [mode, setMode] = useState<BiddingMode>("ascending")
  const [includeRailroads, setIncludeRailroads] = useState(false)
  const [includeUtilities, setIncludeUtilities] = useState(false)
  const [propertyCount, setPropertyCount] = useState(10)
  const [increment, setIncrement] = useState(10)
  const [bidDeadline, setBidDeadline] = useState(10)
  const [maxBidsPerPlayer, setMaxBidsPerPlayer] = useState(3)
  const [playerNames, setPlayerNames] = useState(DEFAULT_PLAYER_NAMES)
  const [players, setPlayers] = useState<Player[]>(() =>
    createPlayers(DEFAULT_PLAYER_NAMES)
  )
  const [deck, setDeck] = useState<PropertyDeck>({ revealed: [], hidden: [] })
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null)
  const [ascendingAuction, setAscendingAuction] =
    useState<AscendingAuction | null>(null)
  const [silentBids, setSilentBids] = useState<
    Record<string, { openingBid: number; maxBid: number }>
  >({})
  const [tiedPlayerIds, setTiedPlayerIds] = useState<string[]>([])
  const [completedBids, setCompletedBids] = useState<CompletedBid[]>([])
  const [message, setMessage] = useState("")
  const [selectedWonProperty, setSelectedWonProperty] =
    useState<Property | null>(null)
  const [bidFeedback, setBidFeedback] = useState<{
    playerId: string
    increment: number
  } | null>(null)
  const [lastWinnerName, setLastWinnerName] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState("TABLE1")
  const [hostName, setHostName] = useState("")
  const [playerJoinCode, setPlayerJoinCode] = useState("")
  const [joiningPlayerName, setJoiningPlayerName] = useState("")
  const [joinedPlayerName, setJoinedPlayerName] = useState("")
  const [multiplayerMessage, setMultiplayerMessage] = useState("")
  const [hostState, setHostState] = useState<HostState | null>(null)
  const [playerState, setPlayerState] = useState<PlayerState | null>(null)
  const [localCountdownRemaining, setLocalCountdownRemaining] = useState(30)
  const [theme, setTheme] = useState<Theme>(() => initialTheme())
  const playerIdRef = useRef<string | null>(null)
  const countdownRoundKeyRef = useRef<string | null>(null)
  const transportRef = useRef<MultiplayerTransport | null>(null)

  const eligiblePool = buildEligiblePropertyPool({
    includeRailroads,
    includeUtilities
  })
  const cappedPropertyCount = Math.min(propertyCount, eligiblePool.length)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem("theme", theme)
  }, [theme])

  useEffect(() => {
    if (phase !== "playerBidding" || !playerState) {
      return
    }
    const roundKey =
      playerState.currentProperty?.id ?? `${playerState.phase}-no-property`
    setLocalCountdownRemaining((current) => {
      if (countdownRoundKeyRef.current !== roundKey) {
        countdownRoundKeyRef.current = roundKey
        return playerState.countdownRemaining
      }
      return Math.min(current, playerState.countdownRemaining)
    })
    let timeoutId: number | undefined

    function tick(remaining: number) {
      timeoutId = window.setTimeout(() => {
        const nextRemaining = Math.max(0, remaining - 1)
        setLocalCountdownRemaining(nextRemaining)
        if (nextRemaining > 0) {
          playSound("tick")
          tick(nextRemaining)
        }
      }, countdownTickDelay())
    }

    tick(playerState.countdownRemaining)
    return () => window.clearTimeout(timeoutId)
  }, [phase, playerState?.currentProperty?.id, playerState?.phase])

  function updatePlayerName(index: number, name: string) {
    setPlayerNames((names) =>
      names.map((current, currentIndex) =>
        currentIndex === index ? name : current
      )
    )
  }

  function addPlayer() {
    setPlayerNames((names) => [...names, `Player ${names.length + 1}`])
  }

  function removePlayer(index: number) {
    setPlayerNames((names) =>
      names.filter((_, currentIndex) => currentIndex !== index)
    )
  }

  function startBidding() {
    const nextPlayers = createPlayers(playerNames)
    if (nextPlayers.length < 2) {
      setMessage("Add at least two players.")
      return
    }

    const nextDeck = createPropertyDeck({
      pool: eligiblePool,
      count: cappedPropertyCount
    })
    const revealed = revealNextProperty(nextDeck)
    setPlayers(nextPlayers)
    setDeck(revealed.deck)
    setCurrentProperty(revealed.property)
    setAscendingAuction(
      revealed.property && mode === "ascending"
        ? createAscendingAuction(
            nextPlayers,
            increment,
            calculateOpeningBid(revealed.property)
          )
        : null
    )
    setSilentBids(
      Object.fromEntries(
        nextPlayers.map((player) => [
          player.id,
          {
            openingBid: revealed.property
              ? calculateOpeningBid(revealed.property)
              : 0,
            maxBid: 0
          }
        ])
      )
    )
    setTiedPlayerIds([])
    setCompletedBids([])
    setMessage("")
    setPhase("bidding")
  }

  function revealFollowingProperty(
    nextPlayers = players,
    nextCompletedBids = completedBids,
    nextMessage = ""
  ) {
    const revealed = revealNextProperty(deck)
    setDeck(revealed.deck)
    setCurrentProperty(revealed.property)
    setAscendingAuction(
      revealed.property && mode === "ascending"
        ? createAscendingAuction(
            nextPlayers,
            increment,
            calculateOpeningBid(revealed.property)
          )
        : null
    )
    setSilentBids(
      Object.fromEntries(
        nextPlayers.map((player) => [
          player.id,
          {
            openingBid: revealed.property
              ? calculateOpeningBid(revealed.property)
              : 0,
            maxBid: 0
          }
        ])
      )
    )
    setTiedPlayerIds([])
    setMessage(nextMessage)

    if (!revealed.property) {
      setCompletedBids(nextCompletedBids)
      setPhase("complete")
    }
  }

  function recordResult(
    winnerId: string | null,
    price: number,
    nextMessage = ""
  ) {
    if (!currentProperty) return

    const result = { winnerId, price }
    const winnerName =
      players.find((player) => player.id === winnerId)?.name ?? null
    const nextPlayers = winnerId
      ? assignProperty(players, currentProperty, result)
      : players
    const nextCompletedBids = [
      ...completedBids,
      { property: currentProperty, winnerId, price }
    ]
    setPlayers(nextPlayers)
    setCompletedBids(nextCompletedBids)
    setLastWinnerName(winnerName)
    if (winnerName) {
      playSound("win")
    }
    revealFollowingProperty(nextPlayers, nextCompletedBids, nextMessage)
  }

  function placeBid(playerId: string, bidIncrement: number) {
    if (!ascendingAuction) return
    const player = players.find((candidate) => candidate.id === playerId)
    if (!player) return

    try {
      setAscendingAuction(
        placeAscendingBid(
          ascendingAuction,
          playerId,
          ascendingAuction.currentBid + bidIncrement,
          player.remainingCash
        )
      )
      setBidFeedback({ playerId, increment: bidIncrement })
      playSound("bid")
      setMessage("")
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Bid could not be placed."
      )
    }
  }

  function passBidder(playerId: string) {
    if (!ascendingAuction) return
    const nextAuction = passAscendingBidder(ascendingAuction, playerId)
    setAscendingAuction(nextAuction)

    if (nextAuction.result) {
      const nextMessage =
        nextAuction.status === "skipped"
          ? "All players skipped. Moving to the next property."
          : ""
      recordResult(
        nextAuction.result.winnerId,
        nextAuction.result.price,
        nextMessage
      )
    }
  }

  function skipProperty() {
    if (mode === "ascending" && ascendingAuction) {
      skipCurrentProperty(ascendingAuction)
    }
    recordResult(null, 0)
  }

  function submitSilentAuction() {
    const participatingIds =
      tiedPlayerIds.length > 0
        ? tiedPlayerIds
        : players.map((player) => player.id)
    const bids: SilentBid[] = players
      .filter((player) => participatingIds.includes(player.id))
      .map((player) => ({
        playerId: player.id,
        openingBid: silentBids[player.id]?.openingBid ?? 0,
        maxBid: silentBids[player.id]?.maxBid ?? 0,
        remainingCash: player.remainingCash
      }))

    try {
      const result = resolveSilentAuction({ bids, increment })
      if (result.status === "tie") {
        setTiedPlayerIds(result.tiedPlayerIds)
        setSilentBids(
          Object.fromEntries(
            result.tiedPlayerIds.map((playerId) => [
              playerId,
              { openingBid: 0, maxBid: 0 }
            ])
          )
        )
        setMessage("Top bids tied. Run sudden-death re-bid.")
        return
      }

      recordResult(result.winnerId, result.price)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Silent auction could not be resolved."
      )
    }
  }

  function restart() {
    setPhase("landing")
    setPlayers(createPlayers(DEFAULT_PLAYER_NAMES))
    setCurrentProperty(null)
    setDeck({ revealed: [], hidden: [] })
    setCompletedBids([])
    setMessage("")
  }

  function hostMultiplayer() {
    setHostName("")
    setMultiplayerMessage("")
    setPhase("hostSetup")
  }

  function createMultiplayerSession() {
    const nextHostName = hostName.trim()
    if (!nextHostName) {
      setMultiplayerMessage("Host name is required.")
      return
    }
    setJoinCode(createLocalJoinCode())
    setPhase("hostLobby")
    const transport = connectTransport()
    transport?.createSession({
      hostName: nextHostName,
      config: {
        includeRailroads,
        includeUtilities,
        propertyCount: cappedPropertyCount,
        increment,
        countdownSeconds: e2eCountdownSeconds() ?? bidDeadline,
        maxBidsPerPlayer
      }
    })
  }

  function joinMultiplayer() {
    setPlayerJoinCode("")
    setJoiningPlayerName("")
    setMultiplayerMessage("")
    setPhase("playerJoin")
  }

  function submitPlayerJoin() {
    if (!playerJoinCode.trim() || !joiningPlayerName.trim()) {
      setMultiplayerMessage("Join code and player name are required.")
      return
    }

    const nextName = joiningPlayerName.trim()
    const nextJoinCode = playerJoinCode.trim().toUpperCase()

    connectTransport()?.joinSession({ joinCode: nextJoinCode, name: nextName })

    setJoinedPlayerName(nextName)
    setMultiplayerMessage("")
    setPhase("playerBidding")
  }

  function startMultiplayerBidding() {
    setMultiplayerMessage("")
    if (transportRef.current?.isOpen() && hostState?.joinCode) {
      transportRef.current.startBidding(hostState.joinCode)
      return
    }
    setPhase("setup")
  }

  function submitMultiplayerBid(bidIncrement: number) {
    if (
      !playerState ||
      !playerIdRef.current ||
      !transportRef.current?.isOpen()
    ) {
      return
    }
    transportRef.current.raiseBid({
      joinCode: playerState.joinCode,
      playerId: playerIdRef.current,
      increment: bidIncrement
    })
  }

  function skipMultiplayerProperty() {
    if (
      !playerState ||
      !playerIdRef.current ||
      !transportRef.current?.isOpen()
    ) {
      return
    }
    transportRef.current.skipProperty({
      joinCode: playerState.joinCode,
      playerId: playerIdRef.current
    })
  }

  function connectTransport() {
    const mode = chooseMultiplayerMode({
      requestedMode: import.meta.env.VITE_MULTIPLAYER_TRANSPORT,
      hasWebRtc: browserSupportsWebRtc(),
      hasWebSocket: typeof WebSocket !== "undefined"
    })

    if (mode === "unavailable") {
      setMultiplayerMessage(
        "This browser does not support multiplayer connections."
      )
      return null
    }
    const handleEvent = (
      serverEvent: Parameters<typeof handleMultiplayerEvent>[0]
    ) => handleMultiplayerEvent(serverEvent)
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
          })
    transportRef.current = transport
    transport.connect()
    return transport
  }

  function handleMultiplayerEvent(serverEvent: ServerEvent) {
    if (serverEvent.type === "host-state") {
      setHostState(serverEvent.state)
      setJoinCode(serverEvent.state.joinCode)
    }
    if (serverEvent.type === "joined") {
      playerIdRef.current = serverEvent.playerId
    }
    if (serverEvent.type === "player-state") {
      setPlayerState(serverEvent.state)
      setPhase("playerBidding")
    }
    if (serverEvent.type === "error") {
      setMultiplayerMessage(serverEvent.message)
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
          onClick={() =>
            setTheme((current) => (current === "dark" ? "light" : "dark"))
          }
        >
          {theme === "dark" ? (
            <Sun aria-hidden="true" size={14} />
          ) : (
            <Moon aria-hidden="true" size={14} />
          )}
        </button>
      </section>

      <div
        className={activeScreenClass}
        data-testid="active-screen"
        key={phase}
      >
        {phase === "landing" ? (
          <LandingScreen
            hostMultiplayer={hostMultiplayer}
            joinMultiplayer={joinMultiplayer}
          />
        ) : null}

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
            maxBidsPerPlayer={maxBidsPerPlayer}
            setMaxBidsPerPlayer={setMaxBidsPerPlayer}
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
            currentBid={hostState?.currentBid ?? 0}
            currentBidderName={hostState?.currentBidderName ?? null}
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
            currentBidderName={playerState?.currentBidderName ?? null}
            remainingPropertyCount={playerState?.remainingPropertyCount ?? 10}
            countdownRemaining={localCountdownRemaining}
            remainingBidCount={playerState?.remainingBidCount ?? 3}
            remainingCash={playerState?.player.remainingCash ?? 1500}
            wonProperties={playerState?.player.properties ?? []}
            hasSkipped={playerState?.hasSkipped ?? false}
            roundMessage={playerState?.roundMessage ?? null}
            inspectProperty={setSelectedWonProperty}
            bid={submitMultiplayerBid}
            skip={skipMultiplayerProperty}
          />
        ) : null}
      </div>

      {selectedWonProperty ? (
        <PropertyDialog
          property={selectedWonProperty}
          close={() => setSelectedWonProperty(null)}
        />
      ) : null}
    </main>
  )
}

function createLocalJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function webSocketUrl() {
  return import.meta.env.VITE_WS_URL ?? `ws://${window.location.hostname}:8787`
}

function e2eCountdownSeconds() {
  const value = Number(import.meta.env.VITE_E2E_COUNTDOWN_SECONDS)
  return Number.isFinite(value) && value > 0 ? value : undefined
}

export function countdownTickDelay() {
  return 1000
}

function playSound(kind: "bid" | "win" | "tick") {
  try {
    playTone(kind)
  } catch {
    // Sound is best-effort; blocked or unsupported audio should never affect bidding.
  }
}

function playTone(kind: "bid" | "win" | "tick") {
  const audioWindow = window as typeof window & {
    webkitAudioContext?: typeof AudioContext
  }
  const AudioContextConstructor =
    audioWindow.AudioContext ?? audioWindow.webkitAudioContext
  if (!AudioContextConstructor) {
    return
  }
  const audioContext = new AudioContextConstructor()
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  const now = audioContext.currentTime
  const duration = kind === "win" ? 0.18 : kind === "tick" ? 0.035 : 0.08

  oscillator.type = "sine"
  oscillator.frequency.value =
    kind === "win" ? 660 : kind === "tick" ? 880 : 440
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(
    kind === "tick" ? 0.025 : 0.06,
    now + 0.01
  )
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  oscillator.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start(now)
  oscillator.stop(now + duration)
}

function initialTheme(): Theme {
  const savedTheme = localStorage.getItem("theme")
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light"
}
