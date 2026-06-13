import type { ClientCommand, HostState, PlayerState, ServerEvent, SessionConfig } from "./multiplayer";
import { createSessionEngine } from "./sessionEngine";

type HostAuthoritativeSessionOptions = {
  hostName: string;
  config: Partial<SessionConfig>;
  codeGenerator?: () => string;
  random?: () => number;
  sendPlayerEvent: (peerId: string, event: ServerEvent) => void;
};

export type HostAuthoritativeSession = ReturnType<typeof createHostAuthoritativeSession>;

export function createHostAuthoritativeSession({
  hostName,
  config,
  codeGenerator,
  random,
  sendPlayerEvent
}: HostAuthoritativeSessionOptions) {
  const engine = createSessionEngine({ codeGenerator, random });
  const host = engine.createSession({ ...config, hostName });
  const peerPlayers = new Map<string, string>();

  function handlePeerIntent(peerId: string, command: ClientCommand) {
    try {
      switch (command.type) {
        case "join-session": {
          const joined = engine.joinSession({ joinCode: host.joinCode, name: command.name });
          peerPlayers.set(peerId, joined.playerId);
          sendPlayerEvent(peerId, { type: "joined", joinCode: host.joinCode, playerId: joined.playerId });
          sendPlayerSnapshot(peerId, joined.playerId);
          break;
        }
        case "raise-bid":
          engine.raiseBid({
            joinCode: host.joinCode,
            playerId: command.playerId,
            increment: command.increment
          });
          broadcastPlayerSnapshots();
          break;
        case "submit-bid":
          engine.submitBid({
            joinCode: host.joinCode,
            playerId: command.playerId,
            amount: command.amount
          });
          broadcastPlayerSnapshots();
          break;
        case "skip-property":
          engine.skipProperty({ joinCode: host.joinCode, playerId: command.playerId });
          broadcastPlayerSnapshots();
          break;
        case "start-bidding":
        case "create-session":
          break;
      }
    } catch (error) {
      sendPlayerEvent(peerId, {
        type: "error",
        message: error instanceof Error ? error.message : "Command failed."
      });
    }
  }

  function startBidding(now = Date.now()) {
    engine.startBidding({ joinCode: host.joinCode, now });
    broadcastPlayerSnapshots();
  }

  function resolveExpiredRounds(now = Date.now()) {
    engine.resolveExpiredRounds(now);
    broadcastPlayerSnapshots();
  }

  function markPeerDisconnected(peerId: string) {
    const playerId = peerPlayers.get(peerId);
    if (!playerId) {
      return;
    }
    engine.markDisconnected(host.joinCode, playerId);
  }

  function reconnectPeer(peerId: string, playerId: string) {
    engine.markConnected(host.joinCode, playerId);
    peerPlayers.set(peerId, playerId);
    sendPlayerSnapshot(peerId, playerId);
  }

  function getHostState(): HostState {
    return engine.getHostState(host.joinCode);
  }

  function getPlayerState(playerId: string): PlayerState {
    return engine.getPlayerState(host.joinCode, playerId);
  }

  function broadcastPlayerSnapshots() {
    for (const [peerId, playerId] of peerPlayers.entries()) {
      sendPlayerSnapshot(peerId, playerId);
    }
  }

  function sendPlayerSnapshot(peerId: string, playerId: string) {
    sendPlayerEvent(peerId, { type: "player-state", state: getPlayerState(playerId) });
  }

  return {
    joinCode: host.joinCode,
    hostPlayerId: host.playerId,
    handlePeerIntent,
    startBidding,
    resolveExpiredRounds,
    markPeerDisconnected,
    reconnectPeer,
    getHostState,
    getPlayerState
  };
}
