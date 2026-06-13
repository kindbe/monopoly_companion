import type { ClientCommand, ServerEvent, SessionConfig } from "./multiplayer";
import type { MultiplayerTransport } from "./multiplayerTransport";
import type { SignalingClientMessage, SignalingServerEvent } from "./signaling";
import { createHostAuthoritativeSession, type HostAuthoritativeSession } from "./hostAuthoritativeSession";
import { createWebRtcHostTransport, createWebRtcPlayerTransport, type WebRtcHostTransport, type WebRtcPlayerTransport } from "./webrtcTransport";

type BrowserWebRtcTransportOptions = {
  signalingUrl: string;
  onEvent: (event: ServerEvent) => void;
  onError: (message: string) => void;
};

export function createBrowserWebRtcMultiplayerTransport({
  signalingUrl,
  onEvent,
  onError
}: BrowserWebRtcTransportOptions): MultiplayerTransport {
  let signalingSocket: WebSocket | null = null;
  let hostTransport: WebRtcHostTransport | null = null;
  let playerTransport: WebRtcPlayerTransport | null = null;
  let hostSession: HostAuthoritativeSession | null = null;
  let playerId: string | null = null;
  let hostTimer: number | null = null;
  const pendingSignals: SignalingClientMessage[] = [];

  function connect() {
    signalingSocket = new WebSocket(signalingUrl);
    signalingSocket.addEventListener("open", () => {
      for (const message of pendingSignals.splice(0)) {
        sendSignal(message);
      }
    });
    signalingSocket.addEventListener("message", (event) => {
      const signalingEvent = JSON.parse(String(event.data)) as SignalingServerEvent;
      if (signalingEvent.type === "signaling-error") {
        onError(signalingEvent.message);
        return;
      }
      void hostTransport?.handleSignal(signalingEvent);
      void playerTransport?.handleSignal(signalingEvent);
    });
    signalingSocket.addEventListener("close", () => {
      onError("Signaling connection closed.");
    });
  }

  function createSession({ hostName, config }: { hostName: string; config?: Partial<SessionConfig> }) {
    hostSession = createHostAuthoritativeSession({
      hostName,
      config: config ?? {},
      sendPlayerEvent(peerId, event) {
        hostTransport?.sendPlayerEvent(peerId, event);
      }
    });
    playerId = hostSession.hostPlayerId;
    hostTransport = createWebRtcHostTransport({
      joinCode: hostSession.joinCode,
      sendSignal,
      onError,
      onPlayerIntent(peerId, message) {
        hostSession?.handlePeerIntent(peerId, message);
        emitHostState();
      }
    });
    hostTransport.connect();
    onEvent({ type: "joined", joinCode: hostSession.joinCode, playerId: hostSession.hostPlayerId });
    emitHostState();
  }

  function joinSession({ joinCode, name }: { joinCode: string; name: string }) {
    playerTransport = createWebRtcPlayerTransport({
      joinCode,
      playerName: name,
      sendSignal,
      onEvent(event) {
        if (event.type === "joined") {
          playerId = event.playerId;
        }
        onEvent(event);
      },
      onError
    });
    playerTransport.connect();
    playerTransport.sendJoin();
  }

  function startBidding(joinCode: string) {
    if (!hostSession || hostSession.joinCode !== joinCode || !playerId) {
      onError("Host session is not ready.");
      return;
    }
    hostSession.startBidding();
    startHostTimer();
    onEvent({ type: "player-state", state: hostSession.getPlayerState(playerId) });
    emitHostState();
  }

  function raiseBid(command: Omit<Extract<ClientCommand, { type: "raise-bid" }>, "type">) {
    if (hostSession) {
      hostSession.handlePeerIntent("host", { type: "raise-bid", ...command });
      if (playerId) {
        onEvent({ type: "player-state", state: hostSession.getPlayerState(playerId) });
      }
      emitHostState();
      return;
    }
    playerTransport?.raiseBid(command);
  }

  function skipProperty(command: Omit<Extract<ClientCommand, { type: "skip-property" }>, "type">) {
    if (hostSession) {
      hostSession.handlePeerIntent("host", { type: "skip-property", ...command });
      if (playerId) {
        onEvent({ type: "player-state", state: hostSession.getPlayerState(playerId) });
      }
      emitHostState();
      return;
    }
    playerTransport?.skipProperty(command);
  }

  function emitHostState() {
    if (hostSession) {
      onEvent({ type: "host-state", state: hostSession.getHostState() });
    }
  }

  function sendSignal(message: SignalingClientMessage) {
    if (signalingSocket?.readyState === WebSocket.OPEN) {
      signalingSocket.send(JSON.stringify(message));
      return;
    }
    pendingSignals.push(message);
  }

  function startHostTimer() {
    if (hostTimer !== null) {
      window.clearInterval(hostTimer);
    }
    hostTimer = window.setInterval(() => {
      if (!hostSession || !playerId) {
        return;
      }
      hostSession.resolveExpiredRounds();
      onEvent({ type: "player-state", state: hostSession.getPlayerState(playerId) });
      emitHostState();
      if (hostSession.getHostState().phase === "complete" && hostTimer !== null) {
        window.clearInterval(hostTimer);
        hostTimer = null;
      }
    }, 1000);
  }

  return {
    connect,
    isOpen() {
      return signalingSocket?.readyState === WebSocket.OPEN;
    },
    createSession,
    joinSession,
    startBidding,
    raiseBid,
    skipProperty
  };
}
