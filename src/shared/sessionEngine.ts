import {
  assignProperty,
  buildEligiblePropertyPool,
  calculateOpeningBid,
  createPlayers,
  createPropertyDeck,
  revealNextProperty,
  STARTING_CASH,
  validateBidAmount,
  type Player,
  type Property,
  type PropertyDeck
} from "../domain/bidding"
import type {
  CompletedBid,
  HostState,
  PlayerState,
  SessionConfig,
  SessionPhase
} from "./multiplayer"

type RoundAction = { kind: "bid"; amount: number } | { kind: "skip" }

type MultiplayerSession = {
  joinCode: string
  phase: SessionPhase
  config: SessionConfig
  players: Player[]
  connectedPlayerIds: Set<string>
  deck: PropertyDeck
  currentProperty: Property | null
  openingBid: number
  roundEndsAt: number | null
  roundActions: Map<string, RoundAction>
  roundSkippedPlayerIds: Set<string>
  roundBidCounts: Map<string, number>
  roundMessage: string | null
  completedBids: CompletedBid[]
}

type StoreOptions = {
  codeGenerator?: () => string
  random?: () => number
}

type CreateSessionInput = Partial<SessionConfig> & {
  hostName: string
}

type JoinSessionInput = {
  joinCode: string
  name: string
}

const DEFAULT_CONFIG: SessionConfig = {
  includeRailroads: false,
  includeUtilities: false,
  propertyCount: 10,
  increment: 10,
  countdownSeconds: 10,
  maxBidsPerPlayer: 3
}

export function createSessionEngine(options: StoreOptions = {}) {
  const sessions = new Map<string, MultiplayerSession>()
  const subscribers = new Map<string, Set<() => void>>()
  const codeGenerator = options.codeGenerator ?? createJoinCode
  const random = options.random ?? Math.random

  function createSession(input: CreateSessionInput) {
    const hostName = input.hostName.trim()
    if (!hostName) {
      throw new Error("Host name is required.")
    }
    const config = normalizeSessionConfig({ ...DEFAULT_CONFIG, ...input })
    const joinCode = generateUniqueJoinCode(sessions, codeGenerator)
    const [hostPlayer] = createPlayers([hostName])
    const session: MultiplayerSession = {
      joinCode,
      phase: "lobby",
      config,
      players: [hostPlayer],
      connectedPlayerIds: new Set([hostPlayer.id]),
      deck: { revealed: [], hidden: [] },
      currentProperty: null,
      openingBid: 0,
      roundEndsAt: null,
      roundActions: new Map(),
      roundSkippedPlayerIds: new Set(),
      roundBidCounts: new Map(),
      roundMessage: null,
      completedBids: []
    }

    sessions.set(joinCode, session)
    return { joinCode, playerId: hostPlayer.id }
  }

  function joinSession({ joinCode, name }: JoinSessionInput) {
    const session = getSession(joinCode)
    const trimmedName = name.trim()
    if (!trimmedName) {
      throw new Error("Player name is required.")
    }
    if (session.phase !== "lobby") {
      throw new Error("Session has already started.")
    }

    const [player] = createPlayers([trimmedName])
    const nextPlayer: Player = {
      ...player,
      id: `player-${session.players.length + 1}`,
      remainingCash: STARTING_CASH
    }
    session.players.push(nextPlayer)
    session.connectedPlayerIds.add(nextPlayer.id)
    notify(joinCode)

    return { joinCode, playerId: nextPlayer.id }
  }

  function startBidding({
    joinCode,
    now = Date.now()
  }: {
    joinCode: string
    now?: number
  }) {
    const session = getSession(joinCode)
    if (session.players.length < 2) {
      throw new Error("At least two players are required.")
    }
    const pool = buildEligiblePropertyPool(session.config)
    session.deck = createPropertyDeck({
      pool,
      count: Math.min(session.config.propertyCount, pool.length),
      random
    })
    session.phase = "bidding"
    revealNextRound(session, now)
    notify(joinCode)
  }

  function submitBid({
    joinCode,
    playerId,
    amount,
    now = Date.now()
  }: {
    joinCode: string
    playerId: string
    amount: number
    now?: number
  }) {
    const session = getActiveBiddingSession(joinCode, now)
    const player = getPlayer(session, playerId)
    if (session.roundSkippedPlayerIds.has(playerId)) {
      throw new Error("Skipped players cannot bid again this round.")
    }
    validateBidAmount(amount, player.remainingCash, session.config.increment)
    if (amount <= currentBid(session)) {
      throw new Error("Bid must exceed the current bid.")
    }
    if (remainingBidCount(session, playerId) <= 0) {
      throw new Error("No bids remaining for this property.")
    }

    session.roundBidCounts.set(playerId, bidCount(session, playerId) + 1)
    session.roundActions.set(playerId, { kind: "bid", amount })
    notify(joinCode)
  }

  function raiseBid({
    joinCode,
    playerId,
    increment,
    now = Date.now()
  }: {
    joinCode: string
    playerId: string
    increment: number
    now?: number
  }) {
    const session = getActiveBiddingSession(joinCode, now)
    submitBid({
      joinCode,
      playerId,
      amount: currentBid(session) + increment,
      now
    })
  }

  function skipProperty({
    joinCode,
    playerId,
    now = Date.now()
  }: {
    joinCode: string
    playerId: string
    now?: number
  }) {
    const session = getActiveBiddingSession(joinCode, now)
    getPlayer(session, playerId)
    session.roundSkippedPlayerIds.add(playerId)
    if (allPlayersSkipped(session)) {
      resolveCurrentRound(session, now, "Skipped!")
    }
    notify(joinCode)
  }

  function resolveExpiredRounds(now = Date.now()) {
    for (const session of sessions.values()) {
      if (
        session.phase !== "bidding" ||
        session.roundEndsAt === null ||
        session.roundEndsAt > now
      ) {
        continue
      }
      resolveCurrentRound(session, now)
      notify(session.joinCode)
    }
  }

  function getHostState(joinCode: string): HostState {
    return serializeHostState(getSession(joinCode))
  }

  function getPlayerState(joinCode: string, playerId: string): PlayerState {
    return serializePlayerState(getSession(joinCode), playerId)
  }

  function subscribe(joinCode: string, listener: () => void) {
    const listeners = subscribers.get(joinCode) ?? new Set<() => void>()
    listeners.add(listener)
    subscribers.set(joinCode, listeners)

    return () => {
      listeners.delete(listener)
    }
  }

  function markDisconnected(joinCode: string, playerId: string) {
    const session = getSession(joinCode)
    session.connectedPlayerIds.delete(playerId)
    notify(joinCode)
  }

  function markConnected(joinCode: string, playerId: string) {
    const session = getSession(joinCode)
    getPlayer(session, playerId)
    session.connectedPlayerIds.add(playerId)
    notify(joinCode)
  }

  function getSession(joinCode: string) {
    const session = sessions.get(joinCode.toUpperCase())
    if (!session) {
      throw new Error("Session not found.")
    }
    return session
  }

  function getActiveBiddingSession(joinCode: string, now: number) {
    const session = getSession(joinCode)
    if (
      session.phase !== "bidding" ||
      !session.currentProperty ||
      session.roundEndsAt === null
    ) {
      throw new Error("Bidding is not active.")
    }
    if (session.roundEndsAt <= now) {
      throw new Error("Bidding is closed.")
    }
    return session
  }

  function notify(joinCode: string) {
    subscribers.get(joinCode)?.forEach((listener) => listener())
  }

  return {
    createSession,
    joinSession,
    startBidding,
    submitBid,
    raiseBid,
    skipProperty,
    resolveExpiredRounds,
    getHostState,
    getPlayerState,
    subscribe,
    markDisconnected,
    markConnected
  }
}

function normalizeSessionConfig(config: SessionConfig): SessionConfig {
  return {
    ...config,
    countdownSeconds: clampWholeNumber(config.countdownSeconds, 5, 30),
    maxBidsPerPlayer: clampWholeNumber(config.maxBidsPerPlayer, 1, 5)
  }
}

function clampWholeNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(max, Math.max(min, Math.round(value)))
}

function revealNextRound(session: MultiplayerSession, now: number) {
  const revealed = revealNextProperty(session.deck)
  session.deck = revealed.deck
  session.currentProperty = revealed.property
  session.openingBid = revealed.property
    ? calculateOpeningBid(revealed.property)
    : 0
  session.roundActions = new Map()
  session.roundSkippedPlayerIds = new Set()
  session.roundBidCounts = new Map()

  if (!revealed.property) {
    session.phase = "complete"
    session.roundEndsAt = null
    return
  }

  session.roundEndsAt = now + session.config.countdownSeconds * 1000
}

function resolveCurrentRound(
  session: MultiplayerSession,
  now: number,
  nextRoundMessage: string | null = null
) {
  if (!session.currentProperty) {
    session.phase = "complete"
    return
  }

  const bids = [...session.roundActions.entries()]
    .filter(([, action]) => action.kind === "bid")
    .map(([playerId, action]) => ({
      playerId,
      amount: action.kind === "bid" ? action.amount : 0
    }))
  const winner = bids.sort((left, right) => right.amount - left.amount)[0]
  const result = winner
    ? { winnerId: winner.playerId, price: winner.amount }
    : { winnerId: null, price: 0 }

  session.players = assignProperty(
    session.players,
    session.currentProperty,
    result
  )
  session.completedBids.push({
    property: session.currentProperty,
    ...result
  })
  revealNextRound(session, now)
  session.roundMessage = nextRoundMessage
}

function serializeHostState(session: MultiplayerSession): HostState {
  return {
    role: "host",
    joinCode: session.joinCode,
    phase: session.phase,
    players: session.players.map((player) => ({
      id: player.id,
      name: player.name,
      connected: session.connectedPlayerIds.has(player.id)
    })),
    currentProperty: session.currentProperty,
    currentBid: currentBid(session),
    currentBidderName: currentBidderName(session),
    openingBid: session.openingBid,
    remainingPropertyCount: remainingPropertyCount(session),
    countdownRemaining: countdownRemaining(session),
    roundMessage: session.roundMessage,
    completedBids: session.completedBids,
    summary: session.players
  }
}

function serializePlayerState(
  session: MultiplayerSession,
  playerId: string
): PlayerState {
  const player = getPlayer(session, playerId)
  return {
    role: "player",
    joinCode: session.joinCode,
    phase: session.phase,
    currentProperty: session.currentProperty,
    currentBid: currentBid(session),
    currentBidderName: currentBidderName(session),
    openingBid: session.openingBid,
    remainingPropertyCount: remainingPropertyCount(session),
    countdownRemaining: countdownRemaining(session),
    remainingBidCount: remainingBidCount(session, playerId),
    hasSkipped: session.roundSkippedPlayerIds.has(playerId),
    roundMessage: session.roundMessage,
    player
  }
}

function currentBid(session: MultiplayerSession) {
  return Math.max(
    session.openingBid,
    ...[...session.roundActions.values()]
      .filter((action) => action.kind === "bid")
      .map((action) => (action.kind === "bid" ? action.amount : 0))
  )
}

function currentBidderName(session: MultiplayerSession) {
  const highestBid = [...session.roundActions.entries()]
    .filter(([, action]) => action.kind === "bid")
    .map(([playerId, action]) => ({
      playerId,
      amount: action.kind === "bid" ? action.amount : 0
    }))
    .sort((left, right) => right.amount - left.amount)[0]
  if (!highestBid) {
    return null
  }
  return (
    session.players.find((player) => player.id === highestBid.playerId)?.name ??
    null
  )
}

function bidCount(session: MultiplayerSession, playerId: string) {
  return session.roundBidCounts.get(playerId) ?? 0
}

function remainingBidCount(session: MultiplayerSession, playerId: string) {
  return Math.max(
    0,
    session.config.maxBidsPerPlayer - bidCount(session, playerId)
  )
}

function remainingPropertyCount(session: MultiplayerSession) {
  return (session.currentProperty ? 1 : 0) + session.deck.hidden.length
}

function countdownRemaining(session: MultiplayerSession, now = Date.now()) {
  if (session.roundEndsAt === null) {
    return 0
  }
  return Math.max(0, Math.ceil((session.roundEndsAt - now) / 1000))
}

function allPlayersSkipped(session: MultiplayerSession) {
  return (
    session.roundActions.size === 0 &&
    session.players.length > 0 &&
    session.players.every((player) =>
      session.roundSkippedPlayerIds.has(player.id)
    )
  )
}

function generateUniqueJoinCode(
  sessions: Map<string, MultiplayerSession>,
  generator: () => string
) {
  for (let attempts = 0; attempts < 20; attempts += 1) {
    const code = generator().toUpperCase()
    if (!sessions.has(code)) {
      return code
    }
  }
  throw new Error("Unable to generate a unique join code.")
}

function createJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

function getPlayer(session: MultiplayerSession, playerId: string) {
  const player = session.players.find((candidate) => candidate.id === playerId)
  if (!player) {
    throw new Error("Player not found.")
  }
  return player
}
