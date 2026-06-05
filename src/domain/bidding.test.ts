import { describe, expect, it } from "vitest";
import {
  buildEligiblePropertyPool,
  createAscendingAuction,
  createPlayers,
  createPropertyDeck,
  passAscendingBidder,
  placeAscendingBid,
  resolveSilentAuction,
  skipCurrentProperty
} from "./bidding";

describe("property pool and hidden deck", () => {
  it("defaults to 10 street properties and excludes railroads and utilities", () => {
    const pool = buildEligiblePropertyPool({
      includeRailroads: false,
      includeUtilities: false
    });

    const deck = createPropertyDeck({
      pool,
      count: 10,
      random: () => 0.42
    });

    expect(pool).toHaveLength(22);
    expect(pool.every((property) => property.category === "street")).toBe(true);
    expect(deck.revealed).toHaveLength(0);
    expect(deck.hidden).toHaveLength(10);
  });

  it("includes optional railroads and utilities when enabled", () => {
    const pool = buildEligiblePropertyPool({
      includeRailroads: true,
      includeUtilities: true
    });

    expect(pool.filter((property) => property.category === "railroad")).toHaveLength(4);
    expect(pool.filter((property) => property.category === "utility")).toHaveLength(2);
    expect(pool).toHaveLength(28);
  });
});

describe("ascending auction", () => {
  it("assigns a property to the last active bidder and deducts cash", () => {
    const players = createPlayers(["Joelle", "Isaac", "Durd"]);
    let auction = createAscendingAuction(players, 10);

    auction = placeAscendingBid(auction, "player-1", 100);
    auction = placeAscendingBid(auction, "player-2", 120);
    auction = passAscendingBidder(auction, "player-3");
    auction = passAscendingBidder(auction, "player-1");

    expect(auction.status).toBe("sold");
    expect(auction.result).toEqual({ winnerId: "player-2", price: 120 });
  });

  it("skips a property when nobody bids", () => {
    const players = createPlayers(["Joelle", "Isaac"]);
    const auction = skipCurrentProperty(createAscendingAuction(players, 10));

    expect(auction.status).toBe("skipped");
    expect(auction.result).toEqual({ winnerId: null, price: 0 });
  });
});

describe("silent auction", () => {
  it("uses proxy-style pricing with the configured increment", () => {
    const result = resolveSilentAuction({
      increment: 10,
      bids: [
        { playerId: "player-1", openingBid: 100, maxBid: 300, remainingCash: 1500 },
        { playerId: "player-2", openingBid: 80, maxBid: 220, remainingCash: 1500 },
        { playerId: "player-3", openingBid: 120, maxBid: 180, remainingCash: 1500 }
      ]
    });

    expect(result).toEqual({
      status: "sold",
      winnerId: "player-1",
      price: 230,
      tiedPlayerIds: []
    });
  });

  it("requests sudden-death re-bid when top max bids tie", () => {
    const result = resolveSilentAuction({
      increment: 10,
      bids: [
        { playerId: "player-1", openingBid: 100, maxBid: 300, remainingCash: 1500 },
        { playerId: "player-2", openingBid: 120, maxBid: 300, remainingCash: 1500 },
        { playerId: "player-3", openingBid: 140, maxBid: 250, remainingCash: 1500 }
      ]
    });

    expect(result).toEqual({
      status: "tie",
      winnerId: null,
      price: 0,
      tiedPlayerIds: ["player-1", "player-2"]
    });
  });
});
