import { Contrast, Moon, Sun } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { buildEligiblePropertyPool, type Property } from "@/domain/bidding"
import type { Phase } from "@/common/auctionTypes"
import {
  CONTRAST_MODE_STORAGE_KEY,
  contrastModeLabel,
  nextContrastMode,
  persistContrastMode,
  resolveInitialContrastMode,
  type ContrastMode
} from "@/common/contrastMode"
import { cx } from "@/common/classNames"
import {
  activeScreenClass,
  appShellClass,
  fullBleedScreenClass,
  mastheadClass,
  scrollingScreenClass,
  themeToggleClass
} from "@/common/uiClasses"
import { HostLobbyScreen } from "@/components/HostLobbyScreen/HostLobbyScreen"
import { HostSetupScreen } from "@/components/HostSetupScreen/HostSetupScreen"
import { LandingScreen } from "@/components/LandingScreen/LandingScreen"
import { PlayerBiddingScreen } from "@/components/PlayerBiddingScreen/PlayerBiddingScreen"
import { PlayerJoinScreen } from "@/components/PlayerJoinScreen/PlayerJoinScreen"
import { PropertyDialog } from "@/components/PropertyDialog/PropertyDialog"
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

export default function App() {
  const [phase, setPhase] = useState<Phase>("landing")
  const [includeRailroads, setIncludeRailroads] = useState(false)
  const [includeUtilities, setIncludeUtilities] = useState(false)
  const [propertyCount, setPropertyCount] = useState(10)
  const [bidDeadline, setBidDeadline] = useState(10)
  const [maxBidsPerPlayer, setMaxBidsPerPlayer] = useState(3)
  const [selectedWonProperty, setSelectedWonProperty] =
    useState<Property | null>(null)
  const [joinCode, setJoinCode] = useState("TABLE1")
  const [hostName, setHostName] = useState("")
  const [playerJoinCode, setPlayerJoinCode] = useState("")
  const [joiningPlayerName, setJoiningPlayerName] = useState("")
  const [joinedPlayerName, setJoinedPlayerName] = useState("")
  const [multiplayerMessage, setMultiplayerMessage] = useState("")
  const [hostState, setHostState] = useState<HostState | null>(null)
  const [playerState, setPlayerState] = useState<PlayerState | null>(null)
  const [localCountdownRemaining, setLocalCountdownRemaining] = useState(30)
  const [contrastMode, setContrastMode] = useState<ContrastMode>(() =>
    resolveInitialContrastMode()
  )
  const playerIdRef = useRef<string | null>(null)
  const countdownRoundKeyRef = useRef<string | null>(null)
  const transportRef = useRef<MultiplayerTransport | null>(null)

  const eligiblePool = buildEligiblePropertyPool({
    includeRailroads,
    includeUtilities
  })
  const cappedPropertyCount = Math.min(propertyCount, eligiblePool.length)

  useEffect(() => {
    document.documentElement.dataset.contrast = contrastMode
    persistContrastMode(CONTRAST_MODE_STORAGE_KEY, contrastMode)
  }, [contrastMode])

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
          playSound()
          tick(nextRemaining)
        }
      }, countdownTickDelay())
    }

    tick(playerState.countdownRemaining)
    return () => window.clearTimeout(timeoutId)
  }, [phase, playerState?.currentProperty?.id, playerState?.phase])

  function restart() {
    setPhase("landing")
    setMultiplayerMessage("")
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
        increment: 10,
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
    setMultiplayerMessage("Multiplayer connection is not ready. Try again.")
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
          aria-label={`Contrast: ${contrastModeLabel(contrastMode)}. Switch to ${contrastModeLabel(nextContrastMode(contrastMode))} mode`}
          title={`Contrast: ${contrastModeLabel(contrastMode)}. Switch to ${contrastModeLabel(nextContrastMode(contrastMode))} mode`}
          onClick={() => setContrastMode(nextContrastMode)}
        >
          {contrastMode === "standard" ? (
            <Sun aria-hidden="true" size={14} />
          ) : null}
          {contrastMode === "high-contrast" ? (
            <Contrast aria-hidden="true" size={14} />
          ) : null}
          {contrastMode === "dark" ? (
            <Moon aria-hidden="true" size={14} />
          ) : null}
        </button>
      </section>

      <div
        className={cx(
          activeScreenClass,
          phase === "playerBidding"
            ? fullBleedScreenClass
            : scrollingScreenClass
        )}
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

        {phase === "hostLobby" ? (
          <HostLobbyScreen
            joinCode={hostState?.joinCode ?? joinCode}
            players={hostState?.players ?? []}
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
            sessionPhase={playerState?.phase ?? "bidding"}
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

function playSound() {
  try {
    playTone()
  } catch {
    // Sound is best-effort; blocked or unsupported audio should never affect bidding.
  }
}

function playTone() {
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
  const duration = 0.035

  oscillator.type = "sine"
  oscillator.frequency.value = 880
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.025, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  oscillator.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start(now)
  oscillator.stop(now + duration)
}
