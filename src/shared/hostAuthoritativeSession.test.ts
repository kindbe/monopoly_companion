import { describe, expect, it, vi } from "vitest"
import { createHostAuthoritativeSession } from "./hostAuthoritativeSession"

describe("host-authoritative multiplayer session", () => {
  it("owns session state in the host, routes peer intents, broadcasts private snapshots, and resolves countdowns", () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    const sent: Array<{ peerId: string; event: unknown }> = []
    const session = createHostAuthoritativeSession({
      hostName: "Host",
      config: { propertyCount: 1, increment: 10, countdownSeconds: 5 },
      codeGenerator: () => "TABLE1",
      random: () => 0.1,
      sendPlayerEvent: (peerId, event) => sent.push({ peerId, event })
    })

    session.handlePeerIntent("joelle-peer", {
      type: "join-session",
      joinCode: "TABLE1",
      name: "Joelle"
    })
    session.startBidding(1000)
    const openingBid = session.getHostState().currentBid
    session.handlePeerIntent("joelle-peer", {
      type: "raise-bid",
      joinCode: "TABLE1",
      playerId: "player-2",
      increment: 10
    })
    session.resolveExpiredRounds(7000)

    const finalHostState = session.getHostState()
    expect(session.joinCode).toBe("TABLE1")
    expect(finalHostState.phase).toBe("complete")
    expect(finalHostState.completedBids).toEqual([
      expect.objectContaining({ winnerId: "player-2", price: openingBid + 10 })
    ])
    expect(sent).toEqual(
      expect.arrayContaining([
        {
          peerId: "joelle-peer",
          event: { type: "joined", joinCode: "TABLE1", playerId: "player-2" }
        },
        expect.objectContaining({
          peerId: "joelle-peer",
          event: expect.objectContaining({
            type: "player-state",
            state: expect.objectContaining({
              role: "player",
              player: expect.objectContaining({
                id: "player-2",
                name: "Joelle"
              })
            })
          })
        })
      ])
    )
    expect(
      JSON.stringify(sent.find((event) => event.peerId === "joelle-peer"))
    ).not.toContain("Host")

    vi.useRealTimers()
  })

  it("marks disconnected peers unavailable and restores their latest snapshot on reconnect", () => {
    const sent: Array<{ peerId: string; event: unknown }> = []
    const session = createHostAuthoritativeSession({
      hostName: "Host",
      config: { propertyCount: 1, increment: 10 },
      codeGenerator: () => "TABLE1",
      sendPlayerEvent: (peerId, event) => sent.push({ peerId, event })
    })

    session.handlePeerIntent("joelle-peer", {
      type: "join-session",
      joinCode: "TABLE1",
      name: "Joelle"
    })
    session.markPeerDisconnected("joelle-peer")
    expect(session.getHostState().players).toContainEqual({
      id: "player-2",
      name: "Joelle",
      connected: false
    })

    session.reconnectPeer("joelle-peer-2", "player-2")

    expect(session.getHostState().players).toContainEqual({
      id: "player-2",
      name: "Joelle",
      connected: true
    })
    expect(sent).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          peerId: "joelle-peer-2",
          event: expect.objectContaining({ type: "player-state" })
        })
      ])
    )
  })

  it("advances early once every still-connected player skips", () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    const session = createHostAuthoritativeSession({
      hostName: "Host",
      config: { propertyCount: 2, increment: 10, countdownSeconds: 10 },
      codeGenerator: () => "TABLE1",
      random: () => 0.1,
      sendPlayerEvent: () => {}
    })

    session.handlePeerIntent("joelle-peer", {
      type: "join-session",
      joinCode: "TABLE1",
      name: "Joelle"
    })
    session.handlePeerIntent("mara-peer", {
      type: "join-session",
      joinCode: "TABLE1",
      name: "Mara"
    })
    session.startBidding(1000)
    const firstProperty = session.getHostState().currentProperty
    session.markPeerDisconnected("mara-peer")

    session.handlePeerIntent("host", {
      type: "skip-property",
      joinCode: "TABLE1",
      playerId: session.hostPlayerId
    })
    session.handlePeerIntent("joelle-peer", {
      type: "skip-property",
      joinCode: "TABLE1",
      playerId: "player-2"
    })

    const hostState = session.getHostState()
    expect(hostState.roundMessage).toBe("Skipped!")
    expect(hostState.currentProperty).not.toEqual(firstProperty)
    expect(hostState.completedBids).toEqual([
      { property: firstProperty, winnerId: null, price: 0 }
    ])

    vi.useRealTimers()
  })
})
