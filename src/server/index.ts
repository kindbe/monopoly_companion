import { WebSocket, WebSocketServer } from "ws"
import { isSignalingClientMessage } from "../shared/signaling"
import { createSignalingHandler } from "./signaling"
import { createSessionStore } from "./session"
import { createCommandHandler } from "./transport"

const port = Number(process.env.PORT ?? 8787)
const store = createSessionStore()
const server = new WebSocketServer({ port })
let nextClientId = 1
const sockets = new Map<string, WebSocket>()

const gameHandler = createCommandHandler(store, {
  send(clientId, event) {
    const socket = sockets.get(clientId)
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(event))
    }
  }
})
const signalingHandler = createSignalingHandler({
  send(clientId, event) {
    const socket = sockets.get(clientId)
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(event))
    }
  }
})

server.on("connection", (socket) => {
  const clientId = `client-${nextClientId++}`
  sockets.set(clientId, socket)

  socket.on("message", (message) => {
    if (isSignalingMessage(message)) {
      signalingHandler.handle(clientId, String(message))
      return
    }
    gameHandler.handle(clientId, message)
  })
  socket.on("close", () => {
    sockets.delete(clientId)
    gameHandler.disconnect(clientId)
    signalingHandler.disconnect(clientId)
  })
})

setInterval(() => {
  store.resolveExpiredRounds()
  signalingHandler.expireSessions()
}, 1000)

console.log(
  `Monopoly companion WebSocket server listening on ws://localhost:${port}`
)

function isSignalingMessage(message: unknown) {
  try {
    return isSignalingClientMessage(JSON.parse(String(message)) as unknown)
  } catch {
    return false
  }
}
