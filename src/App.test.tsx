import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import App, { countdownTickDelay } from "@/App"
import { sortPropertiesByDisplayValue } from "@/common/propertyDisplay"
import { MONOPOLY_PROPERTIES } from "@/domain/bidding"

describe("App", () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    document.documentElement.removeAttribute("data-theme")
  })

  it("starts with a simplified multiplayer landing", () => {
    render(<App />)

    expect(
      screen.getByRole("button", { name: /host multiplayer/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /join session/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/hidden-deck setup auction/i)
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: /property bid companion/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /ascending/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /silent/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /^start bidding$/i })
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/\$1500 starting cash/i)).not.toBeInTheDocument()
  })

  it("uses the modern visual treatment on the landing surface", () => {
    render(<App />)

    const landing = screen
      .getByRole("heading", { name: /start a property auction/i })
      .closest("section")

    expect(landing).toHaveClass("border-violet-200")
    expect(landing?.className).not.toContain("bg-[#e4c142]")
    expect(landing?.className).not.toContain("shadow-[5px_5px_0_#20251d]")
  })

  it("animates the active screen when moving between app phases", async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByTestId("active-screen")).toHaveClass(
      "animate-[app-enter_260ms_ease-out]"
    )

    await user.click(screen.getByRole("button", { name: /host multiplayer/i }))

    expect(screen.getByTestId("active-screen")).toHaveClass(
      "animate-[app-enter_260ms_ease-out]"
    )
    expect(
      screen.getByRole("heading", { name: /host multiplayer/i })
    ).toBeInTheDocument()
  })

  it("defaults theme from prefers-color-scheme and uses a compact icon toggle", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
    )
    const user = userEvent.setup()

    render(<App />)

    expect(document.documentElement).toHaveAttribute("data-theme", "dark")

    const themeToggle = screen.getByRole("button", {
      name: /switch to light mode/i
    })
    expect(themeToggle).toHaveAttribute("title", "Switch to light mode")
    expect(themeToggle).toHaveClass("size-5")
    expect(themeToggle).not.toHaveTextContent(/switch/i)

    await user.click(themeToggle)

    expect(document.documentElement).toHaveAttribute("data-theme", "light")
  })

  it("removes redundant player bidding labels and folds starting cash into remaining cash", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /join session/i }))
    await user.type(screen.getByLabelText(/join code/i), "TABLE1")
    await user.type(screen.getByLabelText(/player name/i), "Joelle")
    await user.click(screen.getByRole("button", { name: /^join$/i }))

    expect(screen.queryByText(/current property/i)).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: /joelle/i })
    ).not.toBeInTheDocument()
    expect(screen.getByText(/your cash: \$1500 \/ \$1500/i)).toBeInTheDocument()
    expect(screen.queryByText(/\$1500 starting cash/i)).not.toBeInTheDocument()
  })

  it("shows multiplayer setup after choosing host multiplayer", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /host multiplayer/i }))

    expect(
      screen.getByRole("heading", { name: /host multiplayer/i })
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/host name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/include railroads/i)).not.toBeChecked()
    expect(screen.getByLabelText(/include utilities/i)).not.toBeChecked()
    expect(screen.getByLabelText(/property count/i)).toHaveValue(10)
    expect(screen.getByLabelText(/bid deadline/i)).toHaveValue(10)
    expect(screen.getByLabelText(/max bids per property/i)).toHaveValue(3)
    expect(
      screen.getByRole("button", { name: /create session/i })
    ).toBeInTheDocument()
  })

  it("sends the host-defined max bid count when creating a multiplayer session", async () => {
    const sockets: FakeSocket[] = []
    vi.stubGlobal(
      "WebSocket",
      class extends FakeSocket {
        static OPEN = 1

        constructor(url: string) {
          super(url)
          sockets.push(this)
        }
      }
    )
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /host multiplayer/i }))
    await user.type(screen.getByLabelText(/host name/i), "Host")
    await user.clear(screen.getByLabelText(/max bids per property/i))
    await user.type(screen.getByLabelText(/max bids per property/i), "5")
    await user.click(screen.getByRole("button", { name: /create session/i }))

    expect(JSON.parse(sockets[0].sentMessages[0])).toMatchObject({
      type: "create-session",
      hostName: "Host",
      config: {
        maxBidsPerPlayer: 5
      }
    })
  })

  it("requires a host name before creating a session", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /host multiplayer/i }))
    await user.click(screen.getByRole("button", { name: /create session/i }))

    expect(screen.getByRole("alert")).toHaveTextContent(
      /host name is required/i
    )
  })

  it("shows host lobby server errors when start bidding is rejected", async () => {
    const sockets: FakeSocket[] = []
    vi.stubGlobal(
      "WebSocket",
      class extends FakeSocket {
        static OPEN = 1

        constructor(url: string) {
          super(url)
          sockets.push(this)
        }
      }
    )
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /host multiplayer/i }))
    await user.type(screen.getByLabelText(/host name/i), "Host")
    await user.click(screen.getByRole("button", { name: /create session/i }))
    act(() => {
      sockets[0].emit("open")
      sockets[0].emit("message", {
        data: JSON.stringify({
          type: "joined",
          joinCode: "TABLE1",
          playerId: "player-1"
        })
      })
      sockets[0].emit("message", {
        data: JSON.stringify({
          type: "host-state",
          state: {
            role: "host",
            joinCode: "TABLE1",
            phase: "lobby",
            players: [{ id: "player-1", name: "Host", connected: true }],
            currentProperty: null,
            currentBid: 0,
            openingBid: 0,
            remainingPropertyCount: 0,
            countdownRemaining: 0,
            roundMessage: null,
            completedBids: [],
            summary: []
          }
        })
      })
    })

    await user.click(
      screen.getByRole("button", { name: /start multiplayer bidding/i })
    )
    act(() => {
      sockets[0].emit("message", {
        data: JSON.stringify({
          type: "error",
          message: "At least two players are required."
        })
      })
    })

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /at least two players are required/i
    )
  })

  it("falls back from host lobby to local setup and completes a skipped one-property auction", async () => {
    vi.stubGlobal(
      "WebSocket",
      class extends FakeSocket {
        static OPEN = 1
      }
    )
    const user = userEvent.setup()
    render(<App />)

    await enterLocalSetup(user)
    await user.clear(screen.getByLabelText(/property count/i))
    await user.type(screen.getByLabelText(/property count/i), "1")
    await user.click(screen.getByRole("button", { name: /^start bidding$/i }))

    expect(
      screen.getByRole("heading", { name: /ascending auction/i })
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /skip no-bid/i }))

    expect(
      await screen.findByRole("heading", { name: /setup complete/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/1 properties resolved/i)).toBeInTheDocument()
  })

  it("requires a join code and name for player join", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /join session/i }))
    await user.click(screen.getByRole("button", { name: /^join$/i }))

    expect(screen.getByRole("alert")).toHaveTextContent(
      /join code and player name are required/i
    )
  })

  it("shows the private player bidding view after joining", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /join session/i }))
    await user.type(screen.getByLabelText(/join code/i), "TABLE1")
    await user.type(screen.getByLabelText(/player name/i), "Joelle")
    await user.click(screen.getByRole("button", { name: /^join$/i }))

    expect(
      screen.queryByRole("heading", { name: /player bidding/i })
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/current property/i)).not.toBeInTheDocument()
    expect(screen.getByText(/your cash: \$1500 \/ \$1500/i)).toBeInTheDocument()
    expect(screen.getByText(/remaining properties: 10/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /^\+\$10$/i })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /skip/i })).toBeInTheDocument()
    expect(screen.queryByText(/bid deadline/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Isaac/)).not.toBeInTheDocument()
  })

  it("keeps player bid and skip controls inside narrow containers", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /join session/i }))
    await user.type(screen.getByLabelText(/join code/i), "TABLE1")
    await user.type(screen.getByLabelText(/player name/i), "Joelle")
    await user.click(screen.getByRole("button", { name: /^join$/i }))

    const quickBidGrid = screen.getByTestId("player-quick-bids")
    const skipButton = screen.getByRole("button", { name: /^skip$/i })

    expect(quickBidGrid).toHaveClass("grid-cols-2")
    expect(quickBidGrid).toHaveClass("[&>button]:min-w-0")
    expect(skipButton).toHaveClass("min-w-0")
    for (const button of screen.getAllByRole("button", { name: /^\+\$/i })) {
      expect(button).toHaveClass("min-w-0")
      expect(button).toHaveClass("px-2")
    }
  })

  it("renders clickable won mini property cards that open the full card", async () => {
    const sockets: FakeSocket[] = []
    vi.stubGlobal(
      "WebSocket",
      class extends FakeSocket {
        static OPEN = 1

        constructor(url: string) {
          super(url)
          sockets.push(this)
        }
      }
    )
    const propertyById = new Map(
      MONOPOLY_PROPERTIES.map((property) => [property.id, property])
    )
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /join session/i }))
    await user.type(screen.getByLabelText(/join code/i), "TABLE1")
    await user.type(screen.getByLabelText(/player name/i), "Joelle")
    await user.click(screen.getByRole("button", { name: /^join$/i }))
    act(() => {
      sockets[0].emit("open")
      sockets[0].emit("message", {
        data: JSON.stringify({
          type: "joined",
          joinCode: "TABLE1",
          playerId: "player-1"
        })
      })
      sockets[0].emit("message", {
        data: JSON.stringify({
          type: "player-state",
          state: {
            role: "player",
            joinCode: "TABLE1",
            player: {
              id: "player-1",
              name: "Joelle",
              remainingCash: 920,
              properties: [
                propertyById.get("boardwalk")!,
                propertyById.get("st-james-place")!,
                propertyById.get("baltic-avenue")!
              ]
            },
            currentProperty: propertyById.get("mediterranean-avenue")!,
            currentBid: 20,
            currentBidderName: "Isaac",
            openingBid: 20,
            remainingPropertyCount: 1,
            countdownRemaining: 10,
            remainingBidCount: 0,
            hasSkipped: false,
            roundMessage: null
          }
        })
      })
    })

    const miniCards = screen.getAllByTestId("mini-property-card")

    expect(miniCards).toHaveLength(3)
    for (const card of miniCards) {
      expect(card).toHaveStyle({ backgroundColor: "rgb(255, 255, 255)" })
      expect(card.style.backgroundImage).toContain("linear-gradient")
      expect(card.style.getPropertyValue("--property-color")).toMatch(/^#/)
    }

    await user.click(screen.getByRole("button", { name: /view boardwalk/i }))

    const dialog = await screen.findByRole("dialog", { name: /boardwalk/i })
    expect(dialog).toHaveTextContent(/title deed/i)
    expect(dialog).toHaveTextContent(/price: \$400/i)
    expect(dialog).toHaveTextContent(/mortgage: \$200/i)
  })

  it("shows remaining bids, disables bids at zero, and attributes the current multiplayer bid", async () => {
    const sockets: FakeSocket[] = []
    vi.stubGlobal(
      "WebSocket",
      class extends FakeSocket {
        static OPEN = 1

        constructor(url: string) {
          super(url)
          sockets.push(this)
        }
      }
    )
    const propertyById = new Map(
      MONOPOLY_PROPERTIES.map((property) => [property.id, property])
    )
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /join session/i }))
    await user.type(screen.getByLabelText(/join code/i), "TABLE1")
    await user.type(screen.getByLabelText(/player name/i), "Joelle")
    await user.click(screen.getByRole("button", { name: /^join$/i }))
    act(() => {
      sockets[0].emit("open")
      sockets[0].emit("message", {
        data: JSON.stringify({
          type: "joined",
          joinCode: "TABLE1",
          playerId: "player-1"
        })
      })
      sockets[0].emit("message", {
        data: JSON.stringify({
          type: "player-state",
          state: {
            role: "player",
            joinCode: "TABLE1",
            player: {
              id: "player-1",
              name: "Joelle",
              remainingCash: 920,
              properties: []
            },
            currentProperty: propertyById.get("mediterranean-avenue")!,
            currentBid: 70,
            currentBidderName: "Isaac",
            openingBid: 20,
            remainingPropertyCount: 1,
            countdownRemaining: 10,
            remainingBidCount: 0,
            hasSkipped: false,
            roundMessage: null
          }
        })
      })
    })

    expect(screen.getByText(/current bid: \$70 by isaac/i)).toBeInTheDocument()
    expect(screen.getByText(/bids remaining: 0/i)).toBeInTheDocument()
    for (const button of screen.getAllByRole("button", { name: /^\+\$/i })) {
      expect(button).toBeDisabled()
    }
  })
})

class FakeSocket {
  static OPEN = 1

  readyState = FakeSocket.OPEN
  sentMessages: string[] = []
  private listeners = new Map<
    string,
    Array<() => void> | Array<(event: { data: unknown }) => void>
  >()

  constructor(public url: string) {}

  addEventListener(type: "open", listener: () => void): void
  addEventListener(
    type: "message",
    listener: (event: { data: unknown }) => void
  ): void
  addEventListener(
    type: "open" | "message",
    listener: (() => void) | ((event: { data: unknown }) => void)
  ) {
    const listeners = this.listeners.get(type) ?? []
    this.listeners.set(type, [...listeners, listener] as typeof listeners)
  }

  send(message: string) {
    this.sentMessages.push(message)
  }

  emit(type: "open"): void
  emit(type: "message", event: { data: unknown }): void
  emit(type: "open" | "message", event?: { data: unknown }) {
    const listeners = this.listeners.get(type) ?? []
    if (type === "open") {
      for (const listener of listeners as Array<() => void>) {
        listener()
      }
      return
    }
    for (const listener of listeners as Array<
      (payload: { data: unknown }) => void
    >) {
      listener(event ?? { data: undefined })
    }
  }
}

async function enterLocalSetup(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /host multiplayer/i }))
  await user.type(screen.getByLabelText(/host name/i), "Host")
  await user.click(screen.getByRole("button", { name: /create session/i }))
  await user.click(
    screen.getByRole("button", { name: /start multiplayer bidding/i })
  )
}

describe("countdown urgency", () => {
  it("keeps countdown ticks at one second even near the deadline", () => {
    expect(countdownTickDelay(20)).toBe(1000)
    expect(countdownTickDelay(5)).toBe(1000)
    expect(countdownTickDelay(1)).toBe(1000)
  })
})

describe("property display refinements", () => {
  it("uses purple for Mediterranean Avenue and Baltic Avenue", () => {
    expect(
      MONOPOLY_PROPERTIES.find(
        (property) => property.id === "mediterranean-avenue"
      )
    ).toMatchObject({
      colorGroup: "Purple"
    })
    expect(
      MONOPOLY_PROPERTIES.find((property) => property.id === "baltic-avenue")
    ).toMatchObject({
      colorGroup: "Purple"
    })
  })

  it("sorts owned property cards by ascending face value", () => {
    const propertyById = new Map(
      MONOPOLY_PROPERTIES.map((property) => [property.id, property])
    )
    const sorted = sortPropertiesByDisplayValue([
      propertyById.get("mediterranean-avenue")!,
      propertyById.get("kentucky-avenue")!,
      propertyById.get("boardwalk")!,
      propertyById.get("water-works")!,
      propertyById.get("reading-railroad")!
    ])

    expect(sorted.map((property) => property.id)).toEqual([
      "mediterranean-avenue",
      "water-works",
      "reading-railroad",
      "kentucky-avenue",
      "boardwalk"
    ])
  })
})
