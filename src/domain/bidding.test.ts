import { describe, expect, it } from "vitest"
import {
  buildEligiblePropertyPool,
  calculateOpeningBid,
  createAscendingAuction,
  createPlayers,
  createPropertyDeck,
  MONOPOLY_PROPERTIES,
  passAscendingBidder,
  placeAscendingBid,
  resolveSilentAuction,
  skipCurrentProperty
} from "./bidding"

describe("property pool and hidden deck", () => {
  it("defaults to 10 street properties and excludes railroads and utilities", () => {
    const pool = buildEligiblePropertyPool({
      includeRailroads: false,
      includeUtilities: false
    })

    const deck = createPropertyDeck({
      pool,
      count: 10,
      random: () => 0.42
    })

    expect(pool).toHaveLength(22)
    expect(pool.every((property) => property.category === "street")).toBe(true)
    expect(deck.revealed).toHaveLength(0)
    expect(deck.hidden).toHaveLength(10)
  })

  it("includes optional railroads and utilities when enabled", () => {
    const pool = buildEligiblePropertyPool({
      includeRailroads: true,
      includeUtilities: true
    })

    expect(
      pool.filter((property) => property.category === "railroad")
    ).toHaveLength(4)
    expect(
      pool.filter((property) => property.category === "utility")
    ).toHaveLength(2)
    expect(pool).toHaveLength(28)
  })
})

describe("property card data", () => {
  it("includes street deed stats for Boardwalk", () => {
    const boardwalk = MONOPOLY_PROPERTIES.find(
      (property) => property.id === "boardwalk"
    )

    expect(boardwalk).toMatchObject({
      category: "street",
      colorGroup: "Dark Blue",
      retailValue: 400,
      rent: [50, 200, 600, 1400, 1700, 2000],
      mortgage: 200,
      houseCost: 200,
      hotelCost: 200
    })
  })

  it("includes railroad and utility deed stats", () => {
    expect(
      MONOPOLY_PROPERTIES.find((property) => property.id === "reading-railroad")
    ).toMatchObject({
      category: "railroad",
      retailValue: 200,
      mortgage: 100,
      rentDescription: expect.stringContaining("$25")
    })
    expect(
      MONOPOLY_PROPERTIES.find((property) => property.id === "electric-company")
    ).toMatchObject({
      category: "utility",
      retailValue: 150,
      mortgage: 75,
      rentDescription: expect.stringContaining("4x")
    })
  })

  it("calculates opening bids as 25% of retail value rounded up to the nearest $10", () => {
    const findProperty = (id: string) => {
      const property = MONOPOLY_PROPERTIES.find(
        (candidate) => candidate.id === id
      )
      if (!property) throw new Error(`Missing property ${id}`)
      return property
    }

    expect(calculateOpeningBid(findProperty("boardwalk"))).toBe(100)
    expect(calculateOpeningBid(findProperty("mediterranean-avenue"))).toBe(20)
    expect(calculateOpeningBid(findProperty("water-works"))).toBe(40)
  })
})

describe("ascending auction", () => {
  it("assigns a property to the last active bidder and deducts cash", () => {
    const players = createPlayers(["Joelle", "Isaac", "Durd"])
    let auction = createAscendingAuction(players, 10)

    auction = placeAscendingBid(auction, "player-1", 100)
    auction = placeAscendingBid(auction, "player-2", 120)
    auction = passAscendingBidder(auction, "player-3")
    auction = passAscendingBidder(auction, "player-1")

    expect(auction.status).toBe("sold")
    expect(auction.result).toEqual({ winnerId: "player-2", price: 120 })
  })

  it("starts at a property opening bid and accepts quick increment raises", () => {
    const players = createPlayers(["Joelle", "Isaac"])
    let auction = createAscendingAuction(players, 10, 100)

    expect(auction.currentBid).toBe(100)

    auction = placeAscendingBid(auction, "player-1", 120, 1500)

    expect(auction.currentBid).toBe(120)
    expect(() => placeAscendingBid(auction, "player-2", 220, 200)).toThrow(
      "Bid cannot exceed remaining cash."
    )
  })

  it("skips a property when nobody bids", () => {
    const players = createPlayers(["Joelle", "Isaac"])
    const auction = skipCurrentProperty(createAscendingAuction(players, 10))

    expect(auction.status).toBe("skipped")
    expect(auction.result).toEqual({ winnerId: null, price: 0 })
  })
})

describe("silent auction", () => {
  it("uses proxy-style pricing with the configured increment", () => {
    const result = resolveSilentAuction({
      increment: 10,
      bids: [
        {
          playerId: "player-1",
          openingBid: 100,
          maxBid: 300,
          remainingCash: 1500
        },
        {
          playerId: "player-2",
          openingBid: 80,
          maxBid: 220,
          remainingCash: 1500
        },
        {
          playerId: "player-3",
          openingBid: 120,
          maxBid: 180,
          remainingCash: 1500
        }
      ]
    })

    expect(result).toEqual({
      status: "sold",
      winnerId: "player-1",
      price: 230,
      tiedPlayerIds: []
    })
  })

  it("requests sudden-death re-bid when top max bids tie", () => {
    const result = resolveSilentAuction({
      increment: 10,
      bids: [
        {
          playerId: "player-1",
          openingBid: 100,
          maxBid: 300,
          remainingCash: 1500
        },
        {
          playerId: "player-2",
          openingBid: 120,
          maxBid: 300,
          remainingCash: 1500
        },
        {
          playerId: "player-3",
          openingBid: 140,
          maxBid: 250,
          remainingCash: 1500
        }
      ]
    })

    expect(result).toEqual({
      status: "tie",
      winnerId: null,
      price: 0,
      tiedPlayerIds: ["player-1", "player-2"]
    })
  })
})
