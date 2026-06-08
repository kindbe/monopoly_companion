import type { Player, PoolOptions, Property } from "../domain/bidding";

export type SessionPhase = "lobby" | "bidding" | "complete";

export type SessionConfig = PoolOptions & {
  propertyCount: number;
  increment: number;
  countdownSeconds: number;
};

export type CompletedBid = {
  property: Property;
  winnerId: string | null;
  price: number;
};

export type HostPlayerSummary = {
  id: string;
  name: string;
  connected: boolean;
};

export type HostState = {
  role: "host";
  joinCode: string;
  phase: SessionPhase;
  players: HostPlayerSummary[];
  currentProperty: Property | null;
  currentBid: number;
  openingBid: number;
  remainingPropertyCount: number;
  countdownRemaining: number;
  roundMessage: string | null;
  completedBids: CompletedBid[];
  summary: Player[];
};

export type PlayerState = {
  role: "player";
  joinCode: string;
  phase: SessionPhase;
  currentProperty: Property | null;
  currentBid: number;
  openingBid: number;
  remainingPropertyCount: number;
  countdownRemaining: number;
  hasSkipped: boolean;
  roundMessage: string | null;
  player: Player;
};

export type ClientCommand =
  | { type: "create-session"; config?: Partial<SessionConfig> }
  | { type: "join-session"; joinCode: string; name: string }
  | { type: "start-bidding"; joinCode: string }
  | { type: "submit-bid"; joinCode: string; playerId: string; amount: number }
  | { type: "raise-bid"; joinCode: string; playerId: string; increment: number }
  | { type: "skip-property"; joinCode: string; playerId: string };

export type ServerEvent =
  | { type: "host-state"; state: HostState }
  | { type: "player-state"; state: PlayerState }
  | { type: "joined"; joinCode: string; playerId: string }
  | { type: "error"; message: string };
