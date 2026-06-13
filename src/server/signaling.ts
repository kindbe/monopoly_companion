import type { SignalingServerEvent } from "../shared/signaling";
import { isGameMessageType, isSignalingClientMessage, type SignalingClientMessage } from "../shared/signaling";

type SignalingTransport = {
  send(clientId: string, event: SignalingServerEvent): void;
};

type SignalingSession = {
  joinCode: string;
  hostClientId: string;
  playerClientIds: Set<string>;
  updatedAt: number;
};

type SignalingHandlerOptions = {
  ttlMs?: number;
  now?: () => number;
};

const DEFAULT_TTL_MS = 30 * 60 * 1000;

export function createSignalingHandler(
  transport: SignalingTransport,
  { ttlMs = DEFAULT_TTL_MS, now = Date.now }: SignalingHandlerOptions = {}
) {
  const sessions = new Map<string, SignalingSession>();
  const clientSessions = new Map<string, string>();

  function handle(clientId: string, rawMessage: string) {
    const parsed = parseMessage(rawMessage);
    if (parsed.kind === "game") {
      transport.send(clientId, { type: "signaling-error", message: "Game messages are not allowed on the signaling channel." });
      return;
    }
    if (parsed.kind !== "valid") {
      transport.send(clientId, { type: "signaling-error", message: "Invalid signaling message." });
      return;
    }

    const message = parsed.message;
    try {
      switch (message.type) {
        case "register-host":
          registerHost(clientId, message.joinCode);
          break;
        case "join-signaling":
          joinSignaling(clientId, message.joinCode, message.playerName);
          break;
        case "signal-offer":
          relay(clientId, message.peerId, { type: "signaling-offer", peerId: clientId, description: message.description });
          break;
        case "signal-answer":
          relay(clientId, message.peerId, { type: "signaling-answer", peerId: clientId, description: message.description });
          break;
        case "signal-ice-candidate":
          relay(clientId, message.peerId, { type: "signaling-ice-candidate", peerId: clientId, candidate: message.candidate });
          break;
        case "peer-connected":
          relay(clientId, message.peerId, { type: "signaling-peer-connected", peerId: clientId });
          break;
      }
    } catch (error) {
      transport.send(clientId, {
        type: "signaling-error",
        message: error instanceof Error ? error.message : "Signaling failed."
      });
    }
  }

  function registerHost(clientId: string, joinCode: string) {
    const normalizedJoinCode = normalizeJoinCode(joinCode);
    if (sessions.has(normalizedJoinCode)) {
      throw new Error("Join code is already registered.");
    }
    const session: SignalingSession = {
      joinCode: normalizedJoinCode,
      hostClientId: clientId,
      playerClientIds: new Set(),
      updatedAt: now()
    };
    sessions.set(normalizedJoinCode, session);
    clientSessions.set(clientId, normalizedJoinCode);
    transport.send(clientId, { type: "signaling-registered", joinCode: normalizedJoinCode });
  }

  function joinSignaling(clientId: string, joinCode: string, playerName: string) {
    const session = getSession(joinCode);
    session.playerClientIds.add(clientId);
    session.updatedAt = now();
    clientSessions.set(clientId, session.joinCode);
    transport.send(clientId, { type: "signaling-joined", joinCode: session.joinCode, hostPeerId: session.hostClientId });
    transport.send(session.hostClientId, { type: "signaling-peer-joined", peerId: clientId, playerName });
  }

  function relay(clientId: string, peerId: string, event: SignalingServerEvent) {
    const clientJoinCode = clientSessions.get(clientId);
    const peerJoinCode = clientSessions.get(peerId);
    if (!clientJoinCode || clientJoinCode !== peerJoinCode) {
      throw new Error("Peer is not in the signaling session.");
    }
    const session = sessions.get(clientJoinCode);
    if (session) {
      session.updatedAt = now();
    }
    transport.send(peerId, event);
  }

  function disconnect(clientId: string) {
    const joinCode = clientSessions.get(clientId);
    clientSessions.delete(clientId);
    if (!joinCode) {
      return;
    }
    const session = sessions.get(joinCode);
    if (!session) {
      return;
    }
    if (session.hostClientId === clientId) {
      for (const playerClientId of session.playerClientIds) {
        clientSessions.delete(playerClientId);
      }
      sessions.delete(joinCode);
      return;
    }
    session.playerClientIds.delete(clientId);
    session.updatedAt = now();
  }

  function expireSessions() {
    const cutoff = now() - ttlMs;
    for (const session of sessions.values()) {
      if (session.updatedAt > cutoff) {
        continue;
      }
      disconnect(session.hostClientId);
    }
  }

  function getSession(joinCode: string) {
    const session = sessions.get(normalizeJoinCode(joinCode));
    if (!session) {
      throw new Error("Signaling session not found.");
    }
    return session;
  }

  return {
    handle,
    disconnect,
    expireSessions
  };
}

function parseMessage(rawMessage: string):
  | { kind: "valid"; message: SignalingClientMessage }
  | { kind: "game" }
  | { kind: "invalid" } {
  try {
    const value = JSON.parse(String(rawMessage)) as unknown;
    if (!value || typeof value !== "object" || !("type" in value)) {
      return { kind: "invalid" };
    }
    const type = String((value as { type: unknown }).type);
    if (isGameMessageType(type)) {
      return { kind: "game" };
    }
    if (!isSignalingClientMessage(value)) {
      return { kind: "invalid" };
    }
    return { kind: "valid", message: value };
  } catch {
    return { kind: "invalid" };
  }
}

function normalizeJoinCode(joinCode: string) {
  const normalized = joinCode.trim().toUpperCase();
  if (!normalized) {
    throw new Error("Join code is required.");
  }
  return normalized;
}
