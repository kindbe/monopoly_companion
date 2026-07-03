export type HostSetupScreenProps = {
  hostName: string
  setHostName: (name: string) => void
  includeRailroads: boolean
  setIncludeRailroads: (enabled: boolean) => void
  includeUtilities: boolean
  setIncludeUtilities: (enabled: boolean) => void
  propertyCount: number
  setPropertyCount: (count: number) => void
  maxProperties: number
  bidDeadline: number
  setBidDeadline: (seconds: number) => void
  maxBidsPerPlayer: number
  setMaxBidsPerPlayer: (count: number) => void
  message: string
  createSession: () => void
  back: () => void
}
