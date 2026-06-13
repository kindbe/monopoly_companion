import { describe, expect, it, vi } from "vitest";
import { createSessionEngine } from "./sessionEngine";

describe("shared multiplayer session engine", () => {
  it("preserves host creation, player join, private state, bids, skips, expiry, and disconnect behavior", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const engine = createSessionEngine({ codeGenerator: () => "TABLE1", random: () => 0.1 });
    const host = engine.createSession({ hostName: "Host", propertyCount: 1, increment: 10, countdownSeconds: 5 });
    const player = engine.joinSession({ joinCode: host.joinCode, name: "Joelle" });

    engine.startBidding({ joinCode: host.joinCode, now: 1000 });
    const openingBid = engine.getPlayerState(host.joinCode, host.playerId).currentBid;

    engine.raiseBid({ joinCode: host.joinCode, playerId: host.playerId, increment: 10, now: 2000 });
    engine.skipProperty({ joinCode: host.joinCode, playerId: player.playerId, now: 3000 });
    engine.resolveExpiredRounds(7000);
    engine.markDisconnected(host.joinCode, player.playerId);

    const hostState = engine.getHostState(host.joinCode);
    const playerState = engine.getPlayerState(host.joinCode, host.playerId);

    expect(host).toEqual({ joinCode: "TABLE1", playerId: "player-1" });
    expect(player).toEqual({ joinCode: "TABLE1", playerId: "player-2" });
    expect(hostState.phase).toBe("complete");
    expect(hostState.players).toEqual([
      { id: "player-1", name: "Host", connected: true },
      { id: "player-2", name: "Joelle", connected: false }
    ]);
    expect(hostState.completedBids).toEqual([expect.objectContaining({ winnerId: host.playerId, price: openingBid + 10 })]);
    expect(playerState.player.remainingCash).toBe(1500 - openingBid - 10);
    expect(playerState.player.properties).toHaveLength(1);
    expect(JSON.stringify(playerState)).not.toContain("Joelle");
    expect(JSON.stringify(playerState)).not.toContain("player-2");

    vi.useRealTimers();
  });
});
