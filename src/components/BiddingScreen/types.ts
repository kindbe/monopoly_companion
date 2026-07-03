import type React from "react"
import type { BiddingMode } from "@/common/auctionTypes"
import type {
  AscendingAuction,
  Player,
  Property,
  PropertyDeck
} from "@/domain/bidding"

export type BiddingScreenProps = {
  mode: BiddingMode
  players: Player[]
  deck: PropertyDeck
  currentProperty: Property
  currentIndex: number
  totalCount: number
  increment: number
  ascendingAuction: AscendingAuction | null
  silentBids: Record<string, { openingBid: number; maxBid: number }>
  tiedPlayerIds: string[]
  setSilentBids: React.Dispatch<
    React.SetStateAction<Record<string, { openingBid: number; maxBid: number }>>
  >
  placeBid: (playerId: string, bidIncrement: number) => void
  passBidder: (playerId: string) => void
  skipProperty: () => void
  submitSilentAuction: () => void
  message: string
  bidFeedback: { playerId: string; increment: number } | null
}
