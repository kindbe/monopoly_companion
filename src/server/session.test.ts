import { describe, expect, it, vi } from "vitest";
import { createSessionStore } from "./session";

describe("multiplayer session store", () => {
  it("creates unique join codes and rejects invalid joins", () => {
    const codes = ["TABLE1", "TABLE1", "TABLE2"];
    const store = createSessionStore({ codeGenerator: () => codes.shift() ?? "TABLE3" });

    const first = store.createSession({ propertyCount: 2, increment: 10 });
    const second = store.createSession({ propertyCount: 2, increment: 10 });

    expect(first.joinCode).toBe("TABLE1");
    expect(second.joinCode).toBe("TABLE2");
    expect(() => store.joinSession({ joinCode: "MISSING", name: "Durd" })).toThrow("Session not found.");
    expect(() => store.joinSession({ joinCode: first.joinCode, name: "" })).toThrow("Player name is required.");
  });

  it("starts bidding with a hidden property deck and private player state", () => {
    const store = createSessionStore({ codeGenerator: () => "TABLE1", random: () => 0.2 });
    const session = store.createSession({ propertyCount: 2, increment: 10 });
    const joelle = store.joinSession({ joinCode: session.joinCode, name: "Joelle" });
    store.joinSession({ joinCode: session.joinCode, name: "Isaac" });

    store.startBidding({ joinCode: session.joinCode, now: 1000 });

    const hostState = store.getHostState(session.joinCode);
    const playerState = store.getPlayerState(session.joinCode, joelle.playerId);

    expect(hostState.phase).toBe("bidding");
    expect(hostState.joinCode).toBe("TABLE1");
    expect(hostState.players).toEqual([
      { id: "player-1", name: "Joelle", connected: true },
      { id: "player-2", name: "Isaac", connected: true }
    ]);
    expect(playerState.openingBid).toBeGreaterThan(0);
    expect(playerState).toMatchObject({
      phase: "bidding",
      currentBid: playerState.openingBid,
      remainingPropertyCount: 2,
      player: {
        id: "player-1",
        name: "Joelle",
        remainingCash: 1500,
        properties: []
      }
    });
    expect(JSON.stringify(playerState)).not.toContain("Isaac");
    expect(JSON.stringify(playerState)).not.toContain("player-2");
  });

  it("records bids and skips, rejects late bids, and resolves countdown expiry", () => {
    const store = createSessionStore({ codeGenerator: () => "TABLE1", random: () => 0.1 });
    const session = store.createSession({ propertyCount: 1, increment: 10 });
    const joelle = store.joinSession({ joinCode: session.joinCode, name: "Joelle" });
    const isaac = store.joinSession({ joinCode: session.joinCode, name: "Isaac" });

    store.startBidding({ joinCode: session.joinCode, now: 1000 });
    const openingBid = store.getPlayerState(session.joinCode, joelle.playerId).currentBid;
    expect(openingBid).toBeGreaterThan(0);

    store.raiseBid({ joinCode: session.joinCode, playerId: joelle.playerId, increment: 10, now: 2000 });
    store.skipProperty({ joinCode: session.joinCode, playerId: isaac.playerId, now: 3000 });

    expect(store.getPlayerState(session.joinCode, joelle.playerId).currentBid).toBe(openingBid + 10);

    store.resolveExpiredRounds(31_000);

    const finalJoelle = store.getPlayerState(session.joinCode, joelle.playerId);
    const finalHost = store.getHostState(session.joinCode);
    expect(finalJoelle.phase).toBe("complete");
    expect(finalJoelle.player.remainingCash).toBe(1500 - openingBid - 10);
    expect(finalJoelle.player.properties).toHaveLength(1);
    expect(finalHost.completedBids).toEqual([
      expect.objectContaining({ winnerId: joelle.playerId, price: openingBid + 10 })
    ]);
    expect(() =>
      store.submitBid({ joinCode: session.joinCode, playerId: joelle.playerId, amount: 120, now: 32_000 })
    ).toThrow("Bidding is not active.");
  });

  it("notifies subscribers when state changes", () => {
    const listener = vi.fn();
    const store = createSessionStore({ codeGenerator: () => "TABLE1" });
    const session = store.createSession({ propertyCount: 1, increment: 10 });
    store.subscribe(session.joinCode, listener);

    store.joinSession({ joinCode: session.joinCode, name: "Joelle" });

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
