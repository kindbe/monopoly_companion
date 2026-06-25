import type { CompletedBid } from "@/common/auctionTypes";
import type { Player, Property } from "@/domain/bidding";

export type CompleteScreenProps = {
  players: Player[];
  completedBids: CompletedBid[];
  restart: () => void;
  inspectProperty: (property: Property) => void;
  lastWinnerName: string | null;
};
