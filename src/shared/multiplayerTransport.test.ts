import { describe, expect, it, vi } from "vitest"
import { createWebSocketMultiplayerTransport } from "./multiplayerTransport"
import type { ServerEvent } from "./multiplayer"

describe("WebSocket multiplayer transport", () => {
  it("sends multiplayer commands and forwards server events", () => {
    const socket = new FakeWebSocket()
    const WebSocketCtor = vi.fn(function WebSocketCtor() {
      return socket
    })
    const onEvent = vi.fn()
    const transport = createWebSocketMultiplayerTransport({
      url: "ws://example.test",
      WebSocketCtor,
      onEvent
    })

    transport.connect()
    socket.open()
    transport.createSession({
      hostName: "Host",
      config: { propertyCount: 1, increment: 10 }
    })
    transport.joinSession({ joinCode: "TABLE1", name: "Joelle" })
    transport.startBidding("TABLE1")
    transport.raiseBid({
      joinCode: "TABLE1",
      playerId: "player-1",
      increment: 10
    })
    transport.skipProperty({ joinCode: "TABLE1", playerId: "player-2" })

    const event: ServerEvent = {
      type: "joined",
      joinCode: "TABLE1",
      playerId: "player-1"
    }
    socket.message(event)

    expect(WebSocketCtor).toHaveBeenCalledWith("ws://example.test")
    expect(socket.sent.map((message) => JSON.parse(message))).toEqual([
      {
        type: "create-session",
        hostName: "Host",
        config: { propertyCount: 1, increment: 10 }
      },
      { type: "join-session", joinCode: "TABLE1", name: "Joelle" },
      { type: "start-bidding", joinCode: "TABLE1" },
      {
        type: "raise-bid",
        joinCode: "TABLE1",
        playerId: "player-1",
        increment: 10
      },
      { type: "skip-property", joinCode: "TABLE1", playerId: "player-2" }
    ])
    expect(onEvent).toHaveBeenCalledWith(event)
    expect(transport.isOpen()).toBe(true)
  })
})

class FakeWebSocket {
  readonly sent: string[] = []
  readyState = 0
  private listeners = new Map<
    string,
    Array<(event: { data: unknown }) => void>
  >()

  addEventListener(type: string, listener: (event: { data: unknown }) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener])
  }

  send(message: string) {
    this.sent.push(message)
  }

  open() {
    this.readyState = 1
    this.listeners.get("open")?.forEach((listener) => listener({ data: "" }))
  }

  message(event: ServerEvent) {
    this.listeners
      .get("message")
      ?.forEach((listener) => listener({ data: JSON.stringify(event) }))
  }
}
