import { describe, expect, it, vi } from "vitest";
import type { ServerEvent } from "../shared/multiplayer";
import { createSessionStore } from "./session";
import { createCommandHandler } from "./transport";

describe("WebSocket command transport", () => {
  it("handles create, join, start, bid, and skip commands with role-filtered events", () => {
    const store = createSessionStore({ codeGenerator: () => "TABLE1", random: () => 0.3 });
    const sent = new Map<string, ServerEvent[]>();
    const handler = createCommandHandler(store, {
      send(clientId, event) {
        sent.set(clientId, [...(sent.get(clientId) ?? []), event]);
      }
    });

    handler.handle("host", JSON.stringify({ type: "create-session", config: { propertyCount: 1, increment: 10 } }));
    handler.handle("joelle-client", JSON.stringify({ type: "join-session", joinCode: "TABLE1", name: "Joelle" }));
    handler.handle("isaac-client", JSON.stringify({ type: "join-session", joinCode: "TABLE1", name: "Isaac" }));
    handler.handle("host", JSON.stringify({ type: "start-bidding", joinCode: "TABLE1" }));
    const startedState = findLastEvent(sent.get("joelle-client") ?? [], "player-state");
    const openingBid = startedState?.type === "player-state" ? startedState.state.currentBid : 0;
    handler.handle("joelle-client", JSON.stringify({ type: "raise-bid", joinCode: "TABLE1", playerId: "player-1", increment: 10 }));
    handler.handle("isaac-client", JSON.stringify({ type: "skip-property", joinCode: "TABLE1", playerId: "player-2" }));

    const hostEvents = sent.get("host") ?? [];
    const playerEvents = sent.get("joelle-client") ?? [];
    expect(hostEvents.some((event) => event.type === "host-state" && event.state.joinCode === "TABLE1")).toBe(true);
    expect(playerEvents.some((event) => event.type === "joined" && event.playerId === "player-1")).toBe(true);
    const latestPlayerState = findLastEvent(playerEvents, "player-state");
    expect(latestPlayerState).toMatchObject({
      type: "player-state",
      state: {
        role: "player",
        player: { id: "player-1", name: "Joelle" },
        currentBid: openingBid + 10
      }
    });
    expect(JSON.stringify(latestPlayerState)).not.toContain("Isaac");
    expect(JSON.stringify(latestPlayerState)).not.toContain("player-2");
  });

  it("sends errors for invalid JSON and unknown commands", () => {
    const store = createSessionStore();
    const send = vi.fn();
    const handler = createCommandHandler(store, { send });

    handler.handle("client-1", "{bad json");
    handler.handle("client-1", JSON.stringify({ type: "bogus" }));

    expect(send).toHaveBeenCalledWith("client-1", { type: "error", message: "Invalid command." });
    expect(send).toHaveBeenCalledWith("client-1", { type: "error", message: "Unknown command." });
  });

  it("marks joined players disconnected when their client disconnects", () => {
    const store = createSessionStore({ codeGenerator: () => "TABLE1" });
    const sent = new Map<string, ServerEvent[]>();
    const handler = createCommandHandler(store, {
      send(clientId, event) {
        sent.set(clientId, [...(sent.get(clientId) ?? []), event]);
      }
    });

    handler.handle("host", JSON.stringify({ type: "create-session" }));
    handler.handle("joelle-client", JSON.stringify({ type: "join-session", joinCode: "TABLE1", name: "Joelle" }));
    handler.disconnect("joelle-client");

    const latestHostState = findLastEvent(sent.get("host") ?? [], "host-state");
    expect(latestHostState).toMatchObject({
      type: "host-state",
      state: {
        players: [{ id: "player-1", name: "Joelle", connected: false }]
      }
    });
  });
});

function findLastEvent(events: ServerEvent[], type: ServerEvent["type"]) {
  return [...events].reverse().find((event) => event.type === type);
}
