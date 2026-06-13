import type { ClientCommand, ServerEvent, SessionConfig } from "./multiplayer";

type WebSocketLike = {
  readyState: number;
  addEventListener(type: "open", listener: () => void): void;
  addEventListener(type: "message", listener: (event: { data: unknown }) => void): void;
  send(message: string): void;
};

type WebSocketConstructor = new (url: string) => WebSocketLike;

export type MultiplayerTransport = {
  connect(): void;
  isOpen(): boolean;
  createSession(input: { hostName: string; config?: Partial<SessionConfig> }): void;
  joinSession(input: { joinCode: string; name: string }): void;
  startBidding(joinCode: string): void;
  raiseBid(input: { joinCode: string; playerId: string; increment: number }): void;
  skipProperty(input: { joinCode: string; playerId: string }): void;
};

type WebSocketTransportOptions = {
  url: string;
  WebSocketCtor?: WebSocketConstructor;
  onEvent: (event: ServerEvent) => void;
};

export function createWebSocketMultiplayerTransport({
  url,
  WebSocketCtor = WebSocket,
  onEvent
}: WebSocketTransportOptions): MultiplayerTransport {
  let socket: WebSocketLike | null = null;
  const pendingCommands: ClientCommand[] = [];

  function connect() {
    socket = new WebSocketCtor(url);
    socket.addEventListener("open", () => {
      for (const command of pendingCommands.splice(0)) {
        sendCommand(command);
      }
    });
    socket.addEventListener("message", (event) => {
      onEvent(JSON.parse(String(event.data)) as ServerEvent);
    });
  }

  function sendCommand(command: ClientCommand) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(command));
      return;
    }
    pendingCommands.push(command);
  }

  return {
    connect,
    isOpen() {
      return socket?.readyState === WebSocket.OPEN;
    },
    createSession({ hostName, config }) {
      sendCommand({ type: "create-session", hostName, config });
    },
    joinSession({ joinCode, name }) {
      sendCommand({ type: "join-session", joinCode, name });
    },
    startBidding(joinCode) {
      sendCommand({ type: "start-bidding", joinCode });
    },
    raiseBid({ joinCode, playerId, increment }) {
      sendCommand({ type: "raise-bid", joinCode, playerId, increment });
    },
    skipProperty({ joinCode, playerId }) {
      sendCommand({ type: "skip-property", joinCode, playerId });
    }
  };
}
