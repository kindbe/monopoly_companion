import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionStore } from "./session";

describe("multiplayer session store", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates unique join codes and rejects invalid joins", () => {
    const codes = ["TABLE1", "TABLE1", "TABLE2"];
    const store = createSessionStore({ codeGenerator: () => codes.shift() ?? "TABLE3" });

    const first = store.createSession({ hostName: "Host", propertyCount: 2, increment: 10, countdownSeconds: 99 });
    const second = store.createSession({ hostName: "Other Host", propertyCount: 2, increment: 10, countdownSeconds: 1 });

    expect(first.joinCode).toBe("TABLE1");
    expect(second.joinCode).toBe("TABLE2");
    expect(() => store.joinSession({ joinCode: "MISSING", name: "Durd" })).toThrow("Session not found.");
    expect(() => store.joinSession({ joinCode: first.joinCode, name: "" })).toThrow("Player name is required.");
  });

  it("creates the host as the first player and rejects blank host names", () => {
    const store = createSessionStore({ codeGenerator: () => "TABLE1" });

    expect(() => store.createSession({ hostName: " " })).toThrow("Host name is required.");

    const session = store.createSession({ hostName: "Durd", propertyCount: 1, increment: 10 });

    expect(session).toEqual({ joinCode: "TABLE1", playerId: "player-1" });
    expect(store.getHostState(session.joinCode).players).toEqual([{ id: "player-1", name: "Durd", connected: true }]);
    expect(store.getPlayerState(session.joinCode, session.playerId).player).toMatchObject({
      id: "player-1",
      name: "Durd",
      remainingCash: 1500,
      properties: []
    });
  });

  it("defaults countdown to 10 seconds and clamps configured deadlines between 5 and 30 seconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const codes = ["TABLE1", "TABLE2", "TABLE3"];
    const store = createSessionStore({ codeGenerator: () => codes.shift() ?? "TABLE4", random: () => 0.2 });

    const defaultSession = store.createSession({ hostName: "Default Host", propertyCount: 1, increment: 10 });
    const shortSession = store.createSession({ hostName: "Short Host", propertyCount: 1, increment: 10, countdownSeconds: 1 });
    const longSession = store.createSession({ hostName: "Long Host", propertyCount: 1, increment: 10, countdownSeconds: 99 });

    for (const joinCode of [defaultSession.joinCode, shortSession.joinCode, longSession.joinCode]) {
      store.joinSession({ joinCode, name: "Isaac" });
      store.startBidding({ joinCode, now: 1000 });
    }

    expect(store.getHostState(defaultSession.joinCode).countdownRemaining).toBe(10);
    expect(store.getHostState(shortSession.joinCode).countdownRemaining).toBe(5);
    expect(store.getHostState(longSession.joinCode).countdownRemaining).toBe(30);
  });

  it("starts bidding with a hidden property deck and private player state", () => {
    const store = createSessionStore({ codeGenerator: () => "TABLE1", random: () => 0.2 });
    const session = store.createSession({ hostName: "Joelle", propertyCount: 2, increment: 10 });
    store.joinSession({ joinCode: session.joinCode, name: "Isaac" });

    store.startBidding({ joinCode: session.joinCode, now: 1000 });

    const hostState = store.getHostState(session.joinCode);
    const playerState = store.getPlayerState(session.joinCode, session.playerId);

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
    const session = store.createSession({ hostName: "Joelle", propertyCount: 1, increment: 10 });
    const isaac = store.joinSession({ joinCode: session.joinCode, name: "Isaac" });

    store.startBidding({ joinCode: session.joinCode, now: 1000 });
    const openingBid = store.getPlayerState(session.joinCode, session.playerId).currentBid;
    expect(openingBid).toBeGreaterThan(0);

    store.raiseBid({ joinCode: session.joinCode, playerId: session.playerId, increment: 10, now: 2000 });
    store.skipProperty({ joinCode: session.joinCode, playerId: isaac.playerId, now: 3000 });

    expect(store.getPlayerState(session.joinCode, session.playerId).currentBid).toBe(openingBid + 10);

    store.resolveExpiredRounds(31_000);

    const finalJoelle = store.getPlayerState(session.joinCode, session.playerId);
    const finalHost = store.getHostState(session.joinCode);
    expect(finalJoelle.phase).toBe("complete");
    expect(finalJoelle.player.remainingCash).toBe(1500 - openingBid - 10);
    expect(finalJoelle.player.properties).toHaveLength(1);
    expect(finalHost.completedBids).toEqual([
      expect.objectContaining({ winnerId: session.playerId, price: openingBid + 10 })
    ]);
    expect(() =>
      store.submitBid({ joinCode: session.joinCode, playerId: session.playerId, amount: 120, now: 32_000 })
    ).toThrow("Bidding is not active.");
  });

  it("marks skipped players, blocks them from bidding again, and advances when everyone skips", () => {
    const store = createSessionStore({ codeGenerator: () => "TABLE1", random: () => 0.1 });
    const session = store.createSession({ hostName: "Joelle", propertyCount: 2, increment: 10 });
    const isaac = store.joinSession({ joinCode: session.joinCode, name: "Isaac" });

    store.startBidding({ joinCode: session.joinCode, now: 1000 });
    const firstProperty = store.getHostState(session.joinCode).currentProperty?.id;

    store.skipProperty({ joinCode: session.joinCode, playerId: session.playerId, now: 2000 });

    expect(store.getPlayerState(session.joinCode, session.playerId).hasSkipped).toBe(true);
    expect(() =>
      store.raiseBid({ joinCode: session.joinCode, playerId: session.playerId, increment: 10, now: 2500 })
    ).toThrow("Skipped players cannot bid again this round.");

    store.skipProperty({ joinCode: session.joinCode, playerId: isaac.playerId, now: 3000 });

    const hostState = store.getHostState(session.joinCode);
    expect(hostState.completedBids).toEqual([expect.objectContaining({ winnerId: null, price: 0 })]);
    expect(hostState.currentProperty?.id).not.toBe(firstProperty);
    expect(hostState.roundMessage).toBe("Skipped!");
  });

  it("notifies subscribers when state changes", () => {
    const listener = vi.fn();
    const store = createSessionStore({ codeGenerator: () => "TABLE1" });
    const session = store.createSession({ hostName: "Host", propertyCount: 1, increment: 10 });
    store.subscribe(session.joinCode, listener);

    store.joinSession({ joinCode: session.joinCode, name: "Joelle" });

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
