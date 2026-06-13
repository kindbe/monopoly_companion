import { describe, expect, it, vi } from "vitest";
import { createSignalingHandler } from "./signaling";

describe("WebRTC signaling handler", () => {
  it("registers hosts, matches players, and relays negotiation messages", () => {
    const sent = new Map<string, unknown[]>();
    const handler = createSignalingHandler({
      send(clientId, event) {
        sent.set(clientId, [...(sent.get(clientId) ?? []), event]);
      }
    });

    handler.handle("host", JSON.stringify({ type: "register-host", joinCode: "table1" }));
    handler.handle("player", JSON.stringify({ type: "join-signaling", joinCode: "TABLE1", playerName: "Joelle" }));
    handler.handle("host", JSON.stringify({ type: "signal-offer", peerId: "player", description: { type: "offer", sdp: "offer-sdp" } }));
    handler.handle("player", JSON.stringify({ type: "signal-answer", peerId: "host", description: { type: "answer", sdp: "answer-sdp" } }));
    handler.handle("host", JSON.stringify({ type: "signal-ice-candidate", peerId: "player", candidate: { candidate: "candidate" } }));

    expect(sent.get("host")).toEqual([
      { type: "signaling-registered", joinCode: "TABLE1" },
      { type: "signaling-peer-joined", peerId: "player", playerName: "Joelle" },
      { type: "signaling-answer", peerId: "player", description: { type: "answer", sdp: "answer-sdp" } }
    ]);
    expect(sent.get("player")).toEqual([
      { type: "signaling-joined", joinCode: "TABLE1", hostPeerId: "host" },
      { type: "signaling-offer", peerId: "host", description: { type: "offer", sdp: "offer-sdp" } },
      { type: "signaling-ice-candidate", peerId: "host", candidate: { candidate: "candidate" } }
    ]);
  });

  it("rejects unknown join codes, duplicate hosts, and game-state messages", () => {
    const send = vi.fn();
    const handler = createSignalingHandler({ send });

    handler.handle("host", JSON.stringify({ type: "register-host", joinCode: "TABLE1" }));
    handler.handle("second-host", JSON.stringify({ type: "register-host", joinCode: "TABLE1" }));
    handler.handle("player", JSON.stringify({ type: "join-signaling", joinCode: "MISSING", playerName: "Joelle" }));
    handler.handle("player", JSON.stringify({ type: "raise-bid", joinCode: "TABLE1", playerId: "player-1", increment: 10 }));

    expect(send).toHaveBeenCalledWith("second-host", { type: "signaling-error", message: "Join code is already registered." });
    expect(send).toHaveBeenCalledWith("player", { type: "signaling-error", message: "Signaling session not found." });
    expect(send).toHaveBeenCalledWith("player", { type: "signaling-error", message: "Game messages are not allowed on the signaling channel." });
  });

  it("cleans up sessions on disconnect and TTL expiry", () => {
    const send = vi.fn();
    let now = 0;
    const handler = createSignalingHandler({ send }, { ttlMs: 1000, now: () => now });

    handler.handle("host", JSON.stringify({ type: "register-host", joinCode: "TABLE1" }));
    handler.disconnect("host");
    handler.handle("player", JSON.stringify({ type: "join-signaling", joinCode: "TABLE1", playerName: "Joelle" }));

    handler.handle("host-2", JSON.stringify({ type: "register-host", joinCode: "TABLE2" }));
    now = 1001;
    handler.expireSessions();
    handler.handle("player-2", JSON.stringify({ type: "join-signaling", joinCode: "TABLE2", playerName: "Isaac" }));

    expect(send).toHaveBeenCalledWith("player", { type: "signaling-error", message: "Signaling session not found." });
    expect(send).toHaveBeenCalledWith("player-2", { type: "signaling-error", message: "Signaling session not found." });
  });
});
