import { WebSocketServer } from "ws";
import { createSessionStore } from "./session";
import { bindWebSocketServer } from "./transport";

const port = Number(process.env.PORT ?? 8787);
const store = createSessionStore();
const server = new WebSocketServer({ port });

bindWebSocketServer({ server, store });

setInterval(() => {
  store.resolveExpiredRounds();
}, 1000);

console.log(`Monopoly companion WebSocket server listening on ws://localhost:${port}`);
