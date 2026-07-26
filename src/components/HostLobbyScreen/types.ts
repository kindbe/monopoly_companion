export type HostLobbyScreenProps = {
  joinCode: string
  players: { id: string; name: string; connected: boolean }[]
  message: string
  startBidding: () => void
  restart: () => void
}
