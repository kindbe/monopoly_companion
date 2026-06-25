import type { Property } from "@/domain/bidding";

export type BiddingMode = "ascending" | "silent";
export type Phase = "landing" | "hostSetup" | "setup" | "bidding" | "complete" | "hostLobby" | "playerJoin" | "playerBidding";
export type Theme = "light" | "dark";

export type CompletedBid = {
  property: Property;
  winnerId: string | null;
  price: number;
};
