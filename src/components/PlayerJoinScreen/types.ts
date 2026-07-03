export type PlayerJoinScreenProps = {
  joinCode: string
  name: string
  message: string
  setJoinCode: (value: string) => void
  setName: (value: string) => void
  join: () => void
  back: () => void
}
