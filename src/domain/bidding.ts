export type PropertyCategory = "street" | "railroad" | "utility"

type BaseProperty = {
  id: string
  name: string
  category: PropertyCategory
  retailValue: number
  mortgage: number
}

export type StreetProperty = BaseProperty & {
  category: "street"
  colorGroup: string
  rent: [number, number, number, number, number, number]
  houseCost: number
  hotelCost: number
}

export type RailroadProperty = BaseProperty & {
  category: "railroad"
  rentDescription: string
}

export type UtilityProperty = BaseProperty & {
  category: "utility"
  rentDescription: string
}

export type Property = StreetProperty | RailroadProperty | UtilityProperty

export type Player = {
  id: string
  name: string
  remainingCash: number
  properties: Property[]
}

export type PoolOptions = {
  includeRailroads: boolean
  includeUtilities: boolean
}

export type PropertyDeck = {
  revealed: Property[]
  hidden: Property[]
}

export type AuctionResult = {
  winnerId: string | null
  price: number
}

export const STARTING_CASH = 1500
export const QUICK_BID_INCREMENTS = [10, 20, 50, 100] as const

export const MONOPOLY_PROPERTIES: Property[] = [
  street(
    "mediterranean-avenue",
    "Mediterranean Avenue",
    "Purple",
    60,
    30,
    [2, 10, 30, 90, 160, 250],
    50
  ),
  street(
    "baltic-avenue",
    "Baltic Avenue",
    "Purple",
    60,
    30,
    [4, 20, 60, 180, 320, 450],
    50
  ),
  street(
    "oriental-avenue",
    "Oriental Avenue",
    "Light Blue",
    100,
    50,
    [6, 30, 90, 270, 400, 550],
    50
  ),
  street(
    "vermont-avenue",
    "Vermont Avenue",
    "Light Blue",
    100,
    50,
    [6, 30, 90, 270, 400, 550],
    50
  ),
  street(
    "connecticut-avenue",
    "Connecticut Avenue",
    "Light Blue",
    120,
    60,
    [8, 40, 100, 300, 450, 600],
    50
  ),
  street(
    "st-charles-place",
    "St. Charles Place",
    "Pink",
    140,
    70,
    [10, 50, 150, 450, 625, 750],
    100
  ),
  street(
    "states-avenue",
    "States Avenue",
    "Pink",
    140,
    70,
    [10, 50, 150, 450, 625, 750],
    100
  ),
  street(
    "virginia-avenue",
    "Virginia Avenue",
    "Pink",
    160,
    80,
    [12, 60, 180, 500, 700, 900],
    100
  ),
  street(
    "st-james-place",
    "St. James Place",
    "Orange",
    180,
    90,
    [14, 70, 200, 550, 750, 950],
    100
  ),
  street(
    "tennessee-avenue",
    "Tennessee Avenue",
    "Orange",
    180,
    90,
    [14, 70, 200, 550, 750, 950],
    100
  ),
  street(
    "new-york-avenue",
    "New York Avenue",
    "Orange",
    200,
    100,
    [16, 80, 220, 600, 800, 1000],
    100
  ),
  street(
    "kentucky-avenue",
    "Kentucky Avenue",
    "Red",
    220,
    110,
    [18, 90, 250, 700, 875, 1050],
    150
  ),
  street(
    "indiana-avenue",
    "Indiana Avenue",
    "Red",
    220,
    110,
    [18, 90, 250, 700, 875, 1050],
    150
  ),
  street(
    "illinois-avenue",
    "Illinois Avenue",
    "Red",
    240,
    120,
    [20, 100, 300, 750, 925, 1100],
    150
  ),
  street(
    "atlantic-avenue",
    "Atlantic Avenue",
    "Yellow",
    260,
    130,
    [22, 110, 330, 800, 975, 1150],
    150
  ),
  street(
    "ventnor-avenue",
    "Ventnor Avenue",
    "Yellow",
    260,
    130,
    [22, 110, 330, 800, 975, 1150],
    150
  ),
  street(
    "marvin-gardens",
    "Marvin Gardens",
    "Yellow",
    280,
    140,
    [24, 120, 360, 850, 1025, 1200],
    150
  ),
  street(
    "pacific-avenue",
    "Pacific Avenue",
    "Green",
    300,
    150,
    [26, 130, 390, 900, 1100, 1275],
    200
  ),
  street(
    "north-carolina-avenue",
    "North Carolina Avenue",
    "Green",
    300,
    150,
    [26, 130, 390, 900, 1100, 1275],
    200
  ),
  street(
    "pennsylvania-avenue",
    "Pennsylvania Avenue",
    "Green",
    320,
    160,
    [28, 150, 450, 1000, 1200, 1400],
    200
  ),
  street(
    "park-place",
    "Park Place",
    "Dark Blue",
    350,
    175,
    [35, 175, 500, 1100, 1300, 1500],
    200
  ),
  street(
    "boardwalk",
    "Boardwalk",
    "Dark Blue",
    400,
    200,
    [50, 200, 600, 1400, 1700, 2000],
    200
  ),
  railroad("reading-railroad", "Reading Railroad"),
  railroad("pennsylvania-railroad", "Pennsylvania Railroad"),
  railroad("b-and-o-railroad", "B. & O. Railroad"),
  railroad("short-line", "Short Line"),
  utility("electric-company", "Electric Company"),
  utility("water-works", "Water Works")
]

export function calculateOpeningBid(property: Property): number {
  return Math.ceil((property.retailValue * 0.25) / 10) * 10
}

export function createPlayers(
  names: string[],
  startingCash = STARTING_CASH
): Player[] {
  return names
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, index) => ({
      id: `player-${index + 1}`,
      name,
      remainingCash: startingCash,
      properties: []
    }))
}

export function buildEligiblePropertyPool(options: PoolOptions): Property[] {
  return MONOPOLY_PROPERTIES.filter((property) => {
    if (property.category === "street") return true
    if (property.category === "railroad") return options.includeRailroads
    return options.includeUtilities
  })
}

export function createPropertyDeck({
  pool,
  count,
  random = Math.random
}: {
  pool: Property[]
  count: number
  random?: () => number
}): PropertyDeck {
  if (!Number.isInteger(count) || count < 1 || count > pool.length) {
    throw new Error(
      "Property count must be between 1 and the eligible pool size."
    )
  }

  const shuffled = [...pool]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index]
    ]
  }

  return {
    revealed: [],
    hidden: shuffled.slice(0, count)
  }
}

export function revealNextProperty(deck: PropertyDeck): {
  deck: PropertyDeck
  property: Property | null
} {
  const [property, ...remainingHidden] = deck.hidden

  if (!property) {
    return { deck, property: null }
  }

  return {
    property,
    deck: {
      revealed: [...deck.revealed, property],
      hidden: remainingHidden
    }
  }
}

export function assignProperty(
  players: Player[],
  property: Property,
  result: AuctionResult
): Player[] {
  if (!result.winnerId) {
    return players
  }

  return players.map((player) => {
    if (player.id !== result.winnerId) {
      return player
    }

    return {
      ...player,
      remainingCash: player.remainingCash - result.price,
      properties: [...player.properties, property]
    }
  })
}

export function validateBidAmount(
  amount: number,
  remainingCash: number,
  increment: number
): void {
  validateIncrement(increment)

  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error("Bid must be a positive whole-dollar amount.")
  }

  if (amount > remainingCash) {
    throw new Error("Bid cannot exceed remaining cash.")
  }

  if (amount > 0 && amount % increment !== 0) {
    throw new Error("Bid must match the selected bid increment.")
  }
}

function validateIncrement(increment: number): void {
  if (!Number.isInteger(increment) || increment < 1) {
    throw new Error("Bid increment must be at least $1.")
  }
}

function street(
  id: string,
  name: string,
  colorGroup: string,
  retailValue: number,
  mortgage: number,
  rent: StreetProperty["rent"],
  houseCost: number
): StreetProperty {
  return {
    id,
    name,
    category: "street",
    colorGroup,
    retailValue,
    mortgage,
    rent,
    houseCost,
    hotelCost: houseCost
  }
}

function railroad(id: string, name: string): RailroadProperty {
  return {
    id,
    name,
    category: "railroad",
    retailValue: 200,
    mortgage: 100,
    rentDescription: "Rent $25, $50, $100, or $200 depending on railroads owned"
  }
}

function utility(id: string, name: string): UtilityProperty {
  return {
    id,
    name,
    category: "utility",
    retailValue: 150,
    mortgage: 75,
    rentDescription:
      "Rent 4x dice roll if one utility is owned; 10x if both are owned"
  }
}
