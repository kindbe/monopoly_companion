export type HostLobbyScreenProps = {
  joinCode: string
  players: { id: string; name: string; connected: boolean }[]
  phase: string
  currentProperty: string | null
  currentBid: number
  currentBidderName: string | null
  countdownRemaining: number
  completedBidCount: number
  message: string
  startBidding: () => void
  restart: () => void
}
