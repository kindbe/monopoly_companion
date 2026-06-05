export type PropertyCategory = "street" | "railroad" | "utility";

export type Property = {
  id: string;
  name: string;
  category: PropertyCategory;
  colorGroup?: string;
};

export type Player = {
  id: string;
  name: string;
  remainingCash: number;
  properties: Property[];
};

export type PoolOptions = {
  includeRailroads: boolean;
  includeUtilities: boolean;
};

export type PropertyDeck = {
  revealed: Property[];
  hidden: Property[];
};

export type AscendingAuction = {
  increment: number;
  activeBidderIds: string[];
  currentBid: number;
  currentBidderId: string | null;
  status: "open" | "sold" | "skipped";
  result: AuctionResult | null;
};

export type AuctionResult = {
  winnerId: string | null;
  price: number;
};

export type SilentBid = {
  playerId: string;
  openingBid: number;
  maxBid: number;
  remainingCash: number;
};

export type SilentAuctionResult = {
  status: "sold" | "tie" | "skipped";
  winnerId: string | null;
  price: number;
  tiedPlayerIds: string[];
};

export const STARTING_CASH = 1500;

export const MONOPOLY_PROPERTIES: Property[] = [
  { id: "mediterranean-avenue", name: "Mediterranean Avenue", category: "street", colorGroup: "Brown" },
  { id: "baltic-avenue", name: "Baltic Avenue", category: "street", colorGroup: "Brown" },
  { id: "oriental-avenue", name: "Oriental Avenue", category: "street", colorGroup: "Light Blue" },
  { id: "vermont-avenue", name: "Vermont Avenue", category: "street", colorGroup: "Light Blue" },
  { id: "connecticut-avenue", name: "Connecticut Avenue", category: "street", colorGroup: "Light Blue" },
  { id: "st-charles-place", name: "St. Charles Place", category: "street", colorGroup: "Pink" },
  { id: "states-avenue", name: "States Avenue", category: "street", colorGroup: "Pink" },
  { id: "virginia-avenue", name: "Virginia Avenue", category: "street", colorGroup: "Pink" },
  { id: "st-james-place", name: "St. James Place", category: "street", colorGroup: "Orange" },
  { id: "tennessee-avenue", name: "Tennessee Avenue", category: "street", colorGroup: "Orange" },
  { id: "new-york-avenue", name: "New York Avenue", category: "street", colorGroup: "Orange" },
  { id: "kentucky-avenue", name: "Kentucky Avenue", category: "street", colorGroup: "Red" },
  { id: "indiana-avenue", name: "Indiana Avenue", category: "street", colorGroup: "Red" },
  { id: "illinois-avenue", name: "Illinois Avenue", category: "street", colorGroup: "Red" },
  { id: "atlantic-avenue", name: "Atlantic Avenue", category: "street", colorGroup: "Yellow" },
  { id: "ventnor-avenue", name: "Ventnor Avenue", category: "street", colorGroup: "Yellow" },
  { id: "marvin-gardens", name: "Marvin Gardens", category: "street", colorGroup: "Yellow" },
  { id: "pacific-avenue", name: "Pacific Avenue", category: "street", colorGroup: "Green" },
  { id: "north-carolina-avenue", name: "North Carolina Avenue", category: "street", colorGroup: "Green" },
  { id: "pennsylvania-avenue", name: "Pennsylvania Avenue", category: "street", colorGroup: "Green" },
  { id: "park-place", name: "Park Place", category: "street", colorGroup: "Dark Blue" },
  { id: "boardwalk", name: "Boardwalk", category: "street", colorGroup: "Dark Blue" },
  { id: "reading-railroad", name: "Reading Railroad", category: "railroad" },
  { id: "pennsylvania-railroad", name: "Pennsylvania Railroad", category: "railroad" },
  { id: "b-and-o-railroad", name: "B. & O. Railroad", category: "railroad" },
  { id: "short-line", name: "Short Line", category: "railroad" },
  { id: "electric-company", name: "Electric Company", category: "utility" },
  { id: "water-works", name: "Water Works", category: "utility" }
];

export function createPlayers(names: string[], startingCash = STARTING_CASH): Player[] {
  return names
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, index) => ({
      id: `player-${index + 1}`,
      name,
      remainingCash: startingCash,
      properties: []
    }));
}

export function buildEligiblePropertyPool(options: PoolOptions): Property[] {
  return MONOPOLY_PROPERTIES.filter((property) => {
    if (property.category === "street") return true;
    if (property.category === "railroad") return options.includeRailroads;
    return options.includeUtilities;
  });
}

export function createPropertyDeck({
  pool,
  count,
  random = Math.random
}: {
  pool: Property[];
  count: number;
  random?: () => number;
}): PropertyDeck {
  if (!Number.isInteger(count) || count < 1 || count > pool.length) {
    throw new Error("Property count must be between 1 and the eligible pool size.");
  }

  const shuffled = [...pool];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return {
    revealed: [],
    hidden: shuffled.slice(0, count)
  };
}

export function revealNextProperty(deck: PropertyDeck): {
  deck: PropertyDeck;
  property: Property | null;
} {
  const [property, ...remainingHidden] = deck.hidden;

  if (!property) {
    return { deck, property: null };
  }

  return {
    property,
    deck: {
      revealed: [...deck.revealed, property],
      hidden: remainingHidden
    }
  };
}

export function createAscendingAuction(players: Player[], increment: number): AscendingAuction {
  validateIncrement(increment);

  return {
    increment,
    activeBidderIds: players.map((player) => player.id),
    currentBid: 0,
    currentBidderId: null,
    status: "open",
    result: null
  };
}

export function placeAscendingBid(
  auction: AscendingAuction,
  playerId: string,
  amount: number,
  remainingCash = STARTING_CASH
): AscendingAuction {
  assertAuctionOpen(auction);

  if (!auction.activeBidderIds.includes(playerId)) {
    throw new Error("Passed bidders cannot place new bids.");
  }

  validateBidAmount(amount, remainingCash, auction.increment);

  if (amount <= auction.currentBid) {
    throw new Error("Bid must exceed the current bid.");
  }

  return {
    ...auction,
    currentBid: amount,
    currentBidderId: playerId
  };
}

export function passAscendingBidder(auction: AscendingAuction, playerId: string): AscendingAuction {
  assertAuctionOpen(auction);

  const activeBidderIds = auction.activeBidderIds.filter((id) => id !== playerId);

  if (activeBidderIds.length === 1 && auction.currentBidderId === activeBidderIds[0]) {
    return {
      ...auction,
      activeBidderIds,
      status: "sold",
      result: {
        winnerId: auction.currentBidderId,
        price: auction.currentBid
      }
    };
  }

  if (activeBidderIds.length === 0 || (activeBidderIds.length === 1 && auction.currentBidderId === null)) {
    return {
      ...auction,
      activeBidderIds,
      status: "skipped",
      result: { winnerId: null, price: 0 }
    };
  }

  return {
    ...auction,
    activeBidderIds
  };
}

export function skipCurrentProperty(auction: AscendingAuction): AscendingAuction {
  assertAuctionOpen(auction);

  return {
    ...auction,
    activeBidderIds: [],
    status: "skipped",
    result: { winnerId: null, price: 0 }
  };
}

export function resolveSilentAuction({
  bids,
  increment
}: {
  bids: SilentBid[];
  increment: number;
}): SilentAuctionResult {
  validateIncrement(increment);

  const validBids = bids.filter((bid) => bid.openingBid > 0 || bid.maxBid > 0);

  if (validBids.length === 0) {
    return { status: "skipped", winnerId: null, price: 0, tiedPlayerIds: [] };
  }

  for (const bid of validBids) {
    validateBidAmount(bid.openingBid, bid.remainingCash, increment);
    validateBidAmount(bid.maxBid, bid.remainingCash, increment);
    if (bid.maxBid < bid.openingBid) {
      throw new Error("Maximum bid must be at least the opening bid.");
    }
  }

  const sorted = [...validBids].sort((left, right) => right.maxBid - left.maxBid);
  const highBid = sorted[0];
  const tiedPlayerIds = sorted.filter((bid) => bid.maxBid === highBid.maxBid).map((bid) => bid.playerId);

  if (tiedPlayerIds.length > 1) {
    return { status: "tie", winnerId: null, price: 0, tiedPlayerIds };
  }

  const nextHighestMax = sorted[1]?.maxBid ?? 0;
  const challengerPrice = nextHighestMax > 0 ? nextHighestMax + increment : 0;
  const price = Math.min(highBid.maxBid, Math.max(highBid.openingBid, challengerPrice));

  return {
    status: "sold",
    winnerId: highBid.playerId,
    price,
    tiedPlayerIds: []
  };
}

export function assignProperty(players: Player[], property: Property, result: AuctionResult): Player[] {
  if (!result.winnerId) {
    return players;
  }

  return players.map((player) => {
    if (player.id !== result.winnerId) {
      return player;
    }

    return {
      ...player,
      remainingCash: player.remainingCash - result.price,
      properties: [...player.properties, property]
    };
  });
}

export function validateBidAmount(amount: number, remainingCash: number, increment: number): void {
  validateIncrement(increment);

  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error("Bid must be a positive whole-dollar amount.");
  }

  if (amount > remainingCash) {
    throw new Error("Bid cannot exceed remaining cash.");
  }

  if (amount > 0 && amount % increment !== 0) {
    throw new Error("Bid must match the selected bid increment.");
  }
}

export function validateSetup({
  players,
  propertyCount,
  eligiblePool,
  increment
}: {
  players: Player[];
  propertyCount: number;
  eligiblePool: Property[];
  increment: number;
}): string[] {
  const errors: string[] = [];

  if (players.length < 2) {
    errors.push("Add at least two players.");
  }

  if (!Number.isInteger(propertyCount) || propertyCount < 1 || propertyCount > eligiblePool.length) {
    errors.push("Choose a property count within the eligible pool size.");
  }

  try {
    validateIncrement(increment);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Choose a valid bid increment.");
  }

  return errors;
}

function validateIncrement(increment: number): void {
  if (!Number.isInteger(increment) || increment < 1) {
    throw new Error("Bid increment must be at least $1.");
  }
}

function assertAuctionOpen(auction: AscendingAuction): void {
  if (auction.status !== "open") {
    throw new Error("Auction is already resolved.");
  }
}
