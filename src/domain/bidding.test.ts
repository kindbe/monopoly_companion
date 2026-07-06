import { describe, expect, it } from "vitest"
import {
  buildEligiblePropertyPool,
  calculateOpeningBid,
  createPropertyDeck,
  MONOPOLY_PROPERTIES
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
