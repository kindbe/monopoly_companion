import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { HostLobbyScreen } from "@/components/HostLobbyScreen/HostLobbyScreen"

describe("HostLobbyScreen", () => {
  it("renders the join code, the roster including the host, and the start control", () => {
    render(
      <HostLobbyScreen
        joinCode="TABLE1"
        players={[
          { id: "player-1", name: "Host", connected: true },
          { id: "player-2", name: "Joelle", connected: false }
        ]}
        message=""
        startBidding={vi.fn()}
        restart={vi.fn()}
      />
    )

    expect(screen.getByTestId("join-code")).toHaveTextContent("TABLE1")
    expect(screen.getByText(/host connected/i)).toBeInTheDocument()
    expect(screen.getByText(/joelle disconnected/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /start multiplayer bidding/i })
    ).toBeInTheDocument()
  })

  it("renders no auction status view", () => {
    render(
      <HostLobbyScreen
        joinCode="TABLE1"
        players={[{ id: "player-1", name: "Host", connected: true }]}
        message=""
        startBidding={vi.fn()}
        restart={vi.fn()}
      />
    )

    expect(screen.queryByText(/current property/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/current bid/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/remaining\./i)).not.toBeInTheDocument()
    expect(screen.queryByText(/completed bids/i)).not.toBeInTheDocument()
  })
})
