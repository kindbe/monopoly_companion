import type { RawData, WebSocket } from "ws";
import type { ClientCommand, ServerEvent } from "../shared/multiplayer";
import type { createSessionStore } from "./session";

type SessionStore = ReturnType<typeof createSessionStore>;

type Transport = {
  send(clientId: string, event: ServerEvent): void;
};

type ClientRegistration = {
  role: "host" | "player";
  joinCode: string;
  playerId?: string;
};

export function createCommandHandler(store: SessionStore, transport: Transport) {
  const clients = new Map<string, ClientRegistration>();
  const sessionSubscriptions = new Set<string>();

  function handle(clientId: string, rawMessage: string | RawData) {
    const parsed = parseCommand(rawMessage);
    if (parsed.kind === "invalid") {
      transport.send(clientId, { type: "error", message: "Invalid command." });
      return;
    }
    if (parsed.kind === "unknown") {
      transport.send(clientId, { type: "error", message: "Unknown command." });
      return;
    }
    const command = parsed.command;

    try {
      switch (command.type) {
        case "create-session": {
          const session = store.createSession(command.config);
          clients.set(clientId, { role: "host", joinCode: session.joinCode });
          ensureSubscribed(session.joinCode);
          sendHostState(session.joinCode);
          break;
        }
        case "join-session": {
          const joined = store.joinSession({ joinCode: command.joinCode, name: command.name });
          clients.set(clientId, { role: "player", joinCode: joined.joinCode, playerId: joined.playerId });
          ensureSubscribed(joined.joinCode);
          transport.send(clientId, { type: "joined", joinCode: joined.joinCode, playerId: joined.playerId });
          sendHostState(joined.joinCode);
          sendPlayerState(clientId, joined.joinCode, joined.playerId);
          break;
        }
        case "start-bidding": {
          store.startBidding({ joinCode: command.joinCode });
          broadcastSession(command.joinCode);
          break;
        }
        case "submit-bid": {
          store.submitBid({
            joinCode: command.joinCode,
            playerId: command.playerId,
            amount: command.amount
          });
          broadcastSession(command.joinCode);
          break;
        }
        case "raise-bid": {
          store.raiseBid({
            joinCode: command.joinCode,
            playerId: command.playerId,
            increment: command.increment
          });
          broadcastSession(command.joinCode);
          break;
        }
        case "skip-property": {
          store.skipProperty({ joinCode: command.joinCode, playerId: command.playerId });
          broadcastSession(command.joinCode);
          break;
        }
        default:
          transport.send(clientId, { type: "error", message: "Unknown command." });
      }
    } catch (error) {
      transport.send(clientId, {
        type: "error",
        message: error instanceof Error ? error.message : "Command failed."
      });
    }
  }

  function disconnect(clientId: string) {
    const registration = clients.get(clientId);
    clients.delete(clientId);

    if (registration?.role === "player" && registration.playerId) {
      store.markDisconnected(registration.joinCode, registration.playerId);
      sendHostState(registration.joinCode);
    }
  }

  function broadcastSession(joinCode: string) {
    for (const [clientId, registration] of clients.entries()) {
      if (registration.joinCode !== joinCode) {
        continue;
      }

      if (registration.role === "host") {
        sendHostStateToClient(clientId, joinCode);
      } else if (registration.playerId) {
        sendPlayerState(clientId, joinCode, registration.playerId);
      }
    }
  }

  function ensureSubscribed(joinCode: string) {
    if (sessionSubscriptions.has(joinCode)) {
      return;
    }
    sessionSubscriptions.add(joinCode);
    store.subscribe(joinCode, () => broadcastSession(joinCode));
  }

  function sendHostState(joinCode: string) {
    for (const [clientId, registration] of clients.entries()) {
      if (registration.role === "host" && registration.joinCode === joinCode) {
        sendHostStateToClient(clientId, joinCode);
      }
    }
  }

  function sendHostStateToClient(clientId: string, joinCode: string) {
    transport.send(clientId, { type: "host-state", state: store.getHostState(joinCode) });
  }

  function sendPlayerState(clientId: string, joinCode: string, playerId: string) {
    transport.send(clientId, { type: "player-state", state: store.getPlayerState(joinCode, playerId) });
  }

  return {
    handle,
    disconnect,
    broadcastSession
  };
}

export function bindWebSocketServer({
  server,
  store
}: {
  server: { on(event: "connection", listener: (socket: WebSocket) => void): void };
  store: SessionStore;
}) {
  let nextClientId = 1;
  const sockets = new Map<string, WebSocket>();
  const handler = createCommandHandler(store, {
    send(clientId, event) {
      const socket = sockets.get(clientId);
      if (socket && socket.readyState === 1) {
        socket.send(JSON.stringify(event));
      }
    }
  });

  server.on("connection", (socket) => {
    const clientId = `client-${nextClientId++}`;
    sockets.set(clientId, socket);

    socket.on("message", (message) => handler.handle(clientId, message));
    socket.on("close", () => {
      sockets.delete(clientId);
      handler.disconnect(clientId);
    });
  });

  return handler;
}

function parseCommand(rawMessage: string | RawData):
  | { kind: "valid"; command: ClientCommand }
  | { kind: "unknown" }
  | { kind: "invalid" } {
  try {
    const value = JSON.parse(String(rawMessage)) as unknown;
    if (!value || typeof value !== "object" || !("type" in value)) {
      return { kind: "invalid" };
    }
    if (!isCommand(value)) {
      return { kind: "unknown" };
    }
    return { kind: "valid", command: value };
  } catch {
    return { kind: "invalid" };
  }
}

function isCommand(value: unknown): value is ClientCommand {
  const command = value as { type: string };
  return [
    "create-session",
    "join-session",
    "start-bidding",
    "submit-bid",
    "raise-bid",
    "skip-property"
  ].includes(command.type);
}
