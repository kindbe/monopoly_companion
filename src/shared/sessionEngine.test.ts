import { describe, expect, it, vi } from "vitest"
import { createSessionEngine } from "./sessionEngine"

describe("shared multiplayer session engine", () => {
  it("preserves host creation, player join, private state, bids, skips, expiry, and disconnect behavior", () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    const engine = createSessionEngine({
      codeGenerator: () => "TABLE1",
      random: () => 0.1
    })
    const host = engine.createSession({
      hostName: "Host",
      propertyCount: 1,
      increment: 10,
      countdownSeconds: 5
    })
    const player = engine.joinSession({
      joinCode: host.joinCode,
      name: "Joelle"
    })

    engine.startBidding({ joinCode: host.joinCode, now: 1000 })
    const openingBid = engine.getPlayerState(
      host.joinCode,
      host.playerId
    ).currentBid

    engine.raiseBid({
      joinCode: host.joinCode,
      playerId: host.playerId,
      increment: 10,
      now: 2000
    })
    engine.skipProperty({
      joinCode: host.joinCode,
      playerId: player.playerId,
      now: 3000
    })
    engine.resolveExpiredRounds(7000)
    engine.markDisconnected(host.joinCode, player.playerId)

    const hostState = engine.getHostState(host.joinCode)
    const playerState = engine.getPlayerState(host.joinCode, host.playerId)

    expect(host).toEqual({ joinCode: "TABLE1", playerId: "player-1" })
    expect(player).toEqual({ joinCode: "TABLE1", playerId: "player-2" })
    expect(hostState.phase).toBe("complete")
    expect(hostState.players).toEqual([
      { id: "player-1", name: "Host", connected: true },
      { id: "player-2", name: "Joelle", connected: false }
    ])
    expect(hostState.completedBids).toEqual([
      expect.objectContaining({
        winnerId: host.playerId,
        price: openingBid + 10
      })
    ])
    expect(playerState.player.remainingCash).toBe(1500 - openingBid - 10)
    expect(playerState.player.properties).toHaveLength(1)
    expect(JSON.stringify(playerState)).not.toContain("Joelle")
    expect(JSON.stringify(playerState)).not.toContain("player-2")

    vi.useRealTimers()
  })

  it("enforces per-property bid limits, tracks current bidder, and keeps the deadline fixed", () => {
    vi.useFakeTimers()
    vi.setSystemTime(5_000)
    const engine = createSessionEngine({
      codeGenerator: () => "TABLE1",
      random: () => 0.1
    })
    const host = engine.createSession({
      hostName: "Host",
      propertyCount: 2,
      increment: 10,
      countdownSeconds: 10,
      maxBidsPerPlayer: 3
    })
    const joelle = engine.joinSession({
      joinCode: host.joinCode,
      name: "Joelle"
    })

    engine.startBidding({ joinCode: host.joinCode, now: 1_000 })
    const openingBid = engine.getHostState(host.joinCode).currentBid

    expect(
      engine.getPlayerState(host.joinCode, host.playerId).remainingBidCount
    ).toBe(3)
    expect(engine.getHostState(host.joinCode).currentBidderName).toBeNull()

    engine.raiseBid({
      joinCode: host.joinCode,
      playerId: host.playerId,
      increment: 10,
      now: 2_000
    })
    engine.raiseBid({
      joinCode: host.joinCode,
      playerId: joelle.playerId,
      increment: 10,
      now: 3_000
    })
    engine.raiseBid({
      joinCode: host.joinCode,
      playerId: host.playerId,
      increment: 10,
      now: 4_000
    })
    engine.raiseBid({
      joinCode: host.joinCode,
      playerId: host.playerId,
      increment: 10,
      now: 5_000
    })
    vi.setSystemTime(5_000)

    expect(engine.getHostState(host.joinCode)).toMatchObject({
      currentBid: openingBid + 40,
      currentBidderName: "Host",
      countdownRemaining: 6
    })
    expect(
      engine.getPlayerState(host.joinCode, host.playerId).remainingBidCount
    ).toBe(0)
    expect(
      engine.getPlayerState(host.joinCode, joelle.playerId).remainingBidCount
    ).toBe(2)
    expect(() =>
      engine.raiseBid({
        joinCode: host.joinCode,
        playerId: host.playerId,
        increment: 10,
        now: 6_000
      })
    ).toThrow("No bids remaining for this property.")
    vi.setSystemTime(6_000)
    expect(engine.getHostState(host.joinCode).countdownRemaining).toBe(5)

    engine.resolveExpiredRounds(11_000)
    vi.setSystemTime(11_000)

    expect(engine.getHostState(host.joinCode).phase).toBe("bidding")
    expect(engine.getHostState(host.joinCode).currentBidderName).toBeNull()
    expect(
      engine.getPlayerState(host.joinCode, host.playerId).remainingBidCount
    ).toBe(3)
    vi.useRealTimers()
  })

  it("defaults max bids to three and clamps configured max bids between one and five", () => {
    const codes = ["TABLE1", "TABLE2", "TABLE3"]
    const engine = createSessionEngine({
      codeGenerator: () => codes.shift() ?? "TABLE4",
      random: () => 0.1
    })
    const defaultSession = engine.createSession({
      hostName: "Default",
      propertyCount: 1,
      increment: 10
    })
    const shortSession = engine.createSession({
      hostName: "Short",
      propertyCount: 1,
      increment: 10,
      maxBidsPerPlayer: 0
    })
    const longSession = engine.createSession({
      hostName: "Long",
      propertyCount: 1,
      increment: 10,
      maxBidsPerPlayer: 99
    })

    for (const joinCode of [
      defaultSession.joinCode,
      shortSession.joinCode,
      longSession.joinCode
    ]) {
      engine.joinSession({ joinCode, name: "Joelle" })
      engine.startBidding({ joinCode, now: 1_000 })
    }

    expect(
      engine.getPlayerState(defaultSession.joinCode, defaultSession.playerId)
        .remainingBidCount
    ).toBe(3)
    expect(
      engine.getPlayerState(shortSession.joinCode, shortSession.playerId)
        .remainingBidCount
    ).toBe(1)
    expect(
      engine.getPlayerState(longSession.joinCode, longSession.playerId)
        .remainingBidCount
    ).toBe(5)
  })

  it("does not let a skip erase an already submitted bid", () => {
    const engine = createSessionEngine({
      codeGenerator: () => "TABLE1",
      random: () => 0.1
    })
    const host = engine.createSession({
      hostName: "Host",
      propertyCount: 1,
      increment: 10
    })
    engine.joinSession({ joinCode: host.joinCode, name: "Joelle" })

    engine.startBidding({ joinCode: host.joinCode, now: 1_000 })
    const openingBid = engine.getHostState(host.joinCode).currentBid

    engine.raiseBid({
      joinCode: host.joinCode,
      playerId: host.playerId,
      increment: 10,
      now: 2_000
    })
    engine.skipProperty({
      joinCode: host.joinCode,
      playerId: host.playerId,
      now: 3_000
    })

    expect(engine.getHostState(host.joinCode)).toMatchObject({
      currentBid: openingBid + 10,
      currentBidderName: "Host"
    })
    expect(engine.getPlayerState(host.joinCode, host.playerId)).toMatchObject({
      hasSkipped: true,
      remainingBidCount: 2
    })
  })

  it("advances early when every connected player skips and another player is disconnected", () => {
    const engine = createSessionEngine({
      codeGenerator: () => "TABLE1",
      random: () => 0.1
    })
    const host = engine.createSession({
      hostName: "Host",
      propertyCount: 2,
      increment: 10
    })
    const joelle = engine.joinSession({
      joinCode: host.joinCode,
      name: "Joelle"
    })
    const mara = engine.joinSession({ joinCode: host.joinCode, name: "Mara" })

    engine.startBidding({ joinCode: host.joinCode, now: 1_000 })
    const firstProperty = engine.getHostState(host.joinCode).currentProperty
    engine.markDisconnected(host.joinCode, mara.playerId)

    engine.skipProperty({
      joinCode: host.joinCode,
      playerId: host.playerId,
      now: 2_000
    })
    engine.skipProperty({
      joinCode: host.joinCode,
      playerId: joelle.playerId,
      now: 3_000
    })

    const hostState = engine.getHostState(host.joinCode)
    expect(hostState.roundMessage).toBe("Skipped!")
    expect(hostState.currentProperty).not.toEqual(firstProperty)
    expect(hostState.completedBids).toEqual([
      { property: firstProperty, winnerId: null, price: 0 }
    ])
  })

  it("advances early when a disconnect completes the all-skipped condition", () => {
    const engine = createSessionEngine({
      codeGenerator: () => "TABLE1",
      random: () => 0.1
    })
    const host = engine.createSession({
      hostName: "Host",
      propertyCount: 2,
      increment: 10
    })
    const joelle = engine.joinSession({
      joinCode: host.joinCode,
      name: "Joelle"
    })
    const mara = engine.joinSession({ joinCode: host.joinCode, name: "Mara" })

    engine.startBidding({ joinCode: host.joinCode, now: 1_000 })
    const firstProperty = engine.getHostState(host.joinCode).currentProperty

    engine.skipProperty({
      joinCode: host.joinCode,
      playerId: host.playerId,
      now: 2_000
    })
    engine.skipProperty({
      joinCode: host.joinCode,
      playerId: joelle.playerId,
      now: 3_000
    })
    expect(engine.getHostState(host.joinCode).currentProperty).toEqual(
      firstProperty
    )

    engine.markDisconnected(host.joinCode, mara.playerId, 4_000)

    const hostState = engine.getHostState(host.joinCode)
    expect(hostState.roundMessage).toBe("Skipped!")
    expect(hostState.currentProperty).not.toEqual(firstProperty)
    expect(hostState.completedBids).toEqual([
      { property: firstProperty, winnerId: null, price: 0 }
    ])
  })

  it("does not advance early when no player is connected", () => {
    const engine = createSessionEngine({
      codeGenerator: () => "TABLE1",
      random: () => 0.1
    })
    const host = engine.createSession({
      hostName: "Host",
      propertyCount: 2,
      increment: 10
    })
    const joelle = engine.joinSession({
      joinCode: host.joinCode,
      name: "Joelle"
    })

    engine.startBidding({ joinCode: host.joinCode, now: 1_000 })
    const firstProperty = engine.getHostState(host.joinCode).currentProperty
    engine.markDisconnected(host.joinCode, host.playerId)
    engine.markDisconnected(host.joinCode, joelle.playerId)

    engine.skipProperty({
      joinCode: host.joinCode,
      playerId: host.playerId,
      now: 2_000
    })
    engine.skipProperty({
      joinCode: host.joinCode,
      playerId: joelle.playerId,
      now: 3_000
    })

    const hostState = engine.getHostState(host.joinCode)
    expect(hostState.roundMessage).toBeNull()
    expect(hostState.currentProperty).toEqual(firstProperty)
    expect(hostState.completedBids).toEqual([])
  })

  it("keeps the round open when a bid exists and every connected player then skips", () => {
    const engine = createSessionEngine({
      codeGenerator: () => "TABLE1",
      random: () => 0.1
    })
    const host = engine.createSession({
      hostName: "Host",
      propertyCount: 2,
      increment: 10,
      countdownSeconds: 10
    })
    const joelle = engine.joinSession({
      joinCode: host.joinCode,
      name: "Joelle"
    })
    const mara = engine.joinSession({ joinCode: host.joinCode, name: "Mara" })

    engine.startBidding({ joinCode: host.joinCode, now: 1_000 })
    const openingBid = engine.getHostState(host.joinCode).currentBid
    const firstProperty = engine.getHostState(host.joinCode).currentProperty

    engine.raiseBid({
      joinCode: host.joinCode,
      playerId: joelle.playerId,
      increment: 10,
      now: 2_000
    })
    engine.markDisconnected(host.joinCode, joelle.playerId)
    engine.skipProperty({
      joinCode: host.joinCode,
      playerId: host.playerId,
      now: 3_000
    })
    engine.skipProperty({
      joinCode: host.joinCode,
      playerId: mara.playerId,
      now: 4_000
    })

    const openRoundState = engine.getHostState(host.joinCode)
    expect(openRoundState.roundMessage).toBeNull()
    expect(openRoundState.currentProperty).toEqual(firstProperty)
    expect(openRoundState.completedBids).toEqual([])

    engine.resolveExpiredRounds(11_000)

    const settledState = engine.getHostState(host.joinCode)
    expect(settledState.completedBids).toEqual([
      {
        property: firstProperty,
        winnerId: joelle.playerId,
        price: openingBid + 10
      }
    ])
    expect(
      engine.getPlayerState(host.joinCode, joelle.playerId).player.properties
    ).toEqual([firstProperty])
  })

  it("keeps a disconnected winner's property and remaining cash in the roster", () => {
    const engine = createSessionEngine({
      codeGenerator: () => "TABLE1",
      random: () => 0.1
    })
    const host = engine.createSession({
      hostName: "Host",
      propertyCount: 1,
      increment: 10,
      countdownSeconds: 10
    })
    const joelle = engine.joinSession({
      joinCode: host.joinCode,
      name: "Joelle"
    })

    engine.startBidding({ joinCode: host.joinCode, now: 1_000 })
    const openingBid = engine.getHostState(host.joinCode).currentBid
    const wonProperty = engine.getHostState(host.joinCode).currentProperty

    engine.raiseBid({
      joinCode: host.joinCode,
      playerId: joelle.playerId,
      increment: 10,
      now: 2_000
    })
    engine.markDisconnected(host.joinCode, joelle.playerId)
    engine.resolveExpiredRounds(11_000)

    const joelleState = engine.getPlayerState(host.joinCode, joelle.playerId)
    expect(joelleState.player.properties).toEqual([wonProperty])
    expect(joelleState.player.remainingCash).toBe(1500 - openingBid - 10)
    expect(engine.getHostState(host.joinCode).players).toContainEqual({
      id: joelle.playerId,
      name: "Joelle",
      connected: false
    })
  })
})
