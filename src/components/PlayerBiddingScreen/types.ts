import type { Property } from "@/domain/bidding"
import type { SessionPhase } from "@/shared/multiplayer"

export type PlayerBiddingScreenProps = {
  playerName: string
  sessionPhase: SessionPhase
  currentProperty: Property | null
  currentBid: number
  currentBidderName: string | null
  remainingPropertyCount: number
  countdownRemaining: number
  remainingBidCount: number
  remainingCash: number
  wonProperties: Property[]
  hasSkipped: boolean
  roundMessage: string | null
  inspectProperty: (property: Property) => void
  bid: (bidIncrement: number) => void
  skip: () => void
}
