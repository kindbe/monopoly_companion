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
    document.documentElement.removeAttribute("data-contrast")
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

  it("uses the title-deed visual treatment on the landing surface", () => {
    render(<App />)

    const landing = screen
      .getByRole("heading", { name: /start a property auction/i })
      .closest("section")

    // A rule-and-whitespace zone, not a panel: the landing band is separated
    // by a hairline rule against the semantic token, carries no fill and no
    // shadow, and introduces no chroma of its own.
    expect(landing).toHaveClass("border-rule")
    expect(landing).toHaveClass("[border-top-width:var(--rule-weight)]")
    expect(landing?.className).not.toMatch(/violet|emerald|rose|slate/)
    expect(landing?.className).not.toMatch(/\bshadow-/)
    expect(landing?.className).not.toMatch(/\bbg-/)
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

  it("defaults contrast from prefers-color-scheme and cycles all three modes", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    )
    const user = userEvent.setup()

    render(<App />)

    expect(document.documentElement).toHaveAttribute("data-contrast", "dark")

    const contrastToggle = screen.getByRole("button", {
      name: /contrast: dark\. switch to standard mode/i
    })
    expect(contrastToggle).toHaveAttribute(
      "title",
      "Contrast: dark. Switch to standard mode"
    )
    expect(contrastToggle).toHaveClass("min-h-11")
    expect(contrastToggle).toHaveClass("min-w-11")
    expect(contrastToggle).not.toHaveTextContent(/switch/i)

    await user.click(contrastToggle)

    expect(document.documentElement).toHaveAttribute(
      "data-contrast",
      "standard"
    )
    expect(localStorage.getItem("theme")).toBe("standard")

    await user.click(
      screen.getByRole("button", {
        name: /contrast: standard\. switch to high contrast mode/i
      })
    )

    expect(document.documentElement).toHaveAttribute(
      "data-contrast",
      "high-contrast"
    )

    await user.click(
      screen.getByRole("button", {
        name: /contrast: high contrast\. switch to dark mode/i
      })
    )

    expect(document.documentElement).toHaveAttribute("data-contrast", "dark")
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

  it("shows an error and stays in the host lobby when bidding starts without an open connection", async () => {
    vi.stubGlobal(
      "WebSocket",
      class extends FakeSocket {
        static OPEN = 1
      }
    )
    const user = userEvent.setup()
    render(<App />)

    await attemptStartWithoutOpenConnection(user)

    expect(
      screen.getByRole("heading", { name: /host lobby/i })
    ).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent(
      /multiplayer connection is not ready/i
    )
    expect(
      screen.queryByRole("button", { name: /^start bidding$/i })
    ).not.toBeInTheDocument()
  })

  it("moves the host out of the lobby and into the bidding view on player state", async () => {
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
    })

    expect(
      screen.getByRole("heading", { name: /host lobby/i })
    ).toBeInTheDocument()

    act(() => {
      sockets[0].emit("message", {
        data: JSON.stringify({
          type: "player-state",
          state: {
            role: "player",
            joinCode: "TABLE1",
            phase: "bidding",
            player: {
              id: "player-1",
              name: "Host",
              remainingCash: 1500,
              properties: []
            },
            currentProperty: propertyById.get("boardwalk")!,
            currentBid: 0,
            currentBidderName: null,
            openingBid: 0,
            remainingPropertyCount: 3,
            countdownRemaining: 10,
            remainingBidCount: 3,
            hasSkipped: false,
            roundMessage: null
          }
        })
      })
    })

    expect(
      screen.queryByRole("heading", { name: /host lobby/i })
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId("join-code")).not.toBeInTheDocument()
    expect(screen.getByText(/your cash: \$1500 \/ \$1500/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^\+\$10$/i })).toBeEnabled()
    expect(screen.getByRole("button", { name: /^skip$/i })).toBeEnabled()
  })

  it("disables the bid and skip controls once the session is complete", async () => {
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
            phase: "complete",
            player: {
              id: "player-1",
              name: "Joelle",
              remainingCash: 920,
              properties: []
            },
            currentProperty: null,
            currentBid: 0,
            currentBidderName: null,
            openingBid: 0,
            remainingPropertyCount: 0,
            countdownRemaining: 0,
            remainingBidCount: 3,
            hasSkipped: false,
            roundMessage: null
          }
        })
      })
    })

    for (const button of screen.getAllByRole("button", { name: /^\+\$/i })) {
      expect(button).toBeDisabled()
    }
    expect(screen.getByRole("button", { name: /^skip$/i })).toBeDisabled()
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

    // The dock runs the four quick bids across a single row on phones and
    // folds them to a 2x2 grid once the rail layout takes over at 1024px.
    expect(quickBidGrid).toHaveClass("grid-cols-4")
    expect(quickBidGrid).toHaveClass("lg:grid-cols-2")
    expect(quickBidGrid).toHaveClass("[&>button]:min-w-0")
    expect(skipButton).toHaveClass("min-w-0")
    for (const button of screen.getAllByRole("button", { name: /^\+\$/i })) {
      expect(button).toHaveClass("min-w-0")
      expect(button).toHaveClass("px-2")
    }
  })

  it("keeps pass quieter than the quick bids while staying a 44px target", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /join session/i }))
    await user.type(screen.getByLabelText(/join code/i), "TABLE1")
    await user.type(screen.getByLabelText(/player name/i), "Joelle")
    await user.click(screen.getByRole("button", { name: /^join$/i }))

    const passButton = screen.getByRole("button", { name: /^skip$/i })
    const quickBid = screen.getAllByRole("button", { name: /^\+\$/i })[0]

    // Pass carries no fill and no offset shadow, and never thickens its rule,
    // while every quick bid carries all three.
    expect(passButton.className).not.toMatch(/\bbg-btn-face\b/)
    expect(passButton.className).not.toContain("box-shadow:var(--btn-offset)")
    expect(passButton.className).not.toContain("var(--rule-weight)")
    expect(passButton).toHaveClass("min-h-11")
    expect(quickBid).toHaveClass("bg-btn-face")
    expect(quickBid.className).toContain("box-shadow:var(--btn-offset)")
    expect(quickBid).toHaveClass("min-h-14")
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
      // The band is a real bordered element keyed on the group slug, not an
      // inline background-image gradient: background images are discarded
      // under forced colors, and the group must survive as text.
      expect(card.dataset.group).toMatch(/^[a-z]+$/)
      expect(card.style.backgroundImage).toBe("")
      expect(card).toHaveClass("bg-surface-card")

      const band = card.querySelector(".deed-band")
      expect(band).not.toBeNull()
      expect(band?.textContent?.trim()).toBeTruthy()
    }

    // Every group is named in text on its own chip, for streets too.
    expect(miniCards.map((card) => card.dataset.group)).toEqual([
      "purple",
      "orange",
      "darkblue"
    ])
    expect(
      miniCards.map((card) => card.querySelector(".deed-band")?.textContent)
    ).toEqual(["Purple", "Orange", "Dark Blue"])

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

async function attemptStartWithoutOpenConnection(
  user: ReturnType<typeof userEvent.setup>
) {
  await user.click(screen.getByRole("button", { name: /host multiplayer/i }))
  await user.type(screen.getByLabelText(/host name/i), "Host")
  await user.click(screen.getByRole("button", { name: /create session/i }))
  await user.click(
    screen.getByRole("button", { name: /start multiplayer bidding/i })
  )
}

describe("countdown urgency", () => {
  it("keeps countdown ticks at one second even near the deadline", () => {
    expect(countdownTickDelay()).toBe(1000)
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
