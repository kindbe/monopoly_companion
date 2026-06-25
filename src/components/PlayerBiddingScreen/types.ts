import type { Property } from "@/domain/bidding";

export type PlayerBiddingScreenProps = {
  playerName: string;
  currentProperty: Property | null;
  currentBid: number;
  currentBidderName: string | null;
  remainingPropertyCount: number;
  countdownRemaining: number;
  remainingBidCount: number;
  remainingCash: number;
  wonProperties: Property[];
  hasSkipped: boolean;
  roundMessage: string | null;
  bid: (bidIncrement: number) => void;
  skip: () => void;
};
