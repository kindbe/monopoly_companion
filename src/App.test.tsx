import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App, { countdownTickDelay, sortPropertiesByDisplayValue } from "./App";
import { MONOPOLY_PROPERTIES } from "./domain/bidding";

describe("App", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    document.documentElement.removeAttribute("data-theme");
  });

  it("starts with a simplified multiplayer landing", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: /host multiplayer/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join session/i })).toBeInTheDocument();
    expect(screen.queryByText(/hidden-deck setup auction/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /property bid companion/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ascending/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /silent/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^start bidding$/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/\$1500 starting cash/i)).not.toBeInTheDocument();
  });

  it("uses the modern visual treatment on the landing surface", () => {
    render(<App />);

    const landing = screen.getByRole("heading", { name: /start a property auction/i }).closest("section");

    expect(landing).toHaveClass("border-violet-200");
    expect(landing?.className).not.toContain("bg-[#e4c142]");
    expect(landing?.className).not.toContain("shadow-[5px_5px_0_#20251d]");
  });

  it("defaults theme from prefers-color-scheme and uses a compact icon toggle", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
    );
    const user = userEvent.setup();

    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");

    const themeToggle = screen.getByRole("button", { name: /switch to light mode/i });
    expect(themeToggle).toHaveAttribute("title", "Switch to light mode");
    expect(themeToggle).toHaveClass("size-5");
    expect(themeToggle).not.toHaveTextContent(/switch/i);

    await user.click(themeToggle);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("removes redundant player bidding labels and folds starting cash into remaining cash", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /join session/i }));
    await user.type(screen.getByLabelText(/join code/i), "TABLE1");
    await user.type(screen.getByLabelText(/player name/i), "Joelle");
    await user.click(screen.getByRole("button", { name: /^join$/i }));

    expect(screen.queryByText(/current property/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /joelle/i })).not.toBeInTheDocument();
    expect(screen.getByText(/your cash: \$1500 \/ \$1500/i)).toBeInTheDocument();
    expect(screen.queryByText(/\$1500 starting cash/i)).not.toBeInTheDocument();
  });

  it("shows multiplayer setup after choosing host multiplayer", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /host multiplayer/i }));

    expect(screen.getByRole("heading", { name: /host multiplayer/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/host name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/include railroads/i)).not.toBeChecked();
    expect(screen.getByLabelText(/include utilities/i)).not.toBeChecked();
    expect(screen.getByLabelText(/property count/i)).toHaveValue(10);
    expect(screen.getByLabelText(/bid deadline/i)).toHaveValue(10);
    expect(screen.getByRole("button", { name: /create session/i })).toBeInTheDocument();
  });

  it("requires a host name before creating a session", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /host multiplayer/i }));
    await user.click(screen.getByRole("button", { name: /create session/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/host name is required/i);
  });

  it("falls back to local setup from the host lobby and shows setup controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /host multiplayer/i }));
    await user.type(screen.getByLabelText(/host name/i), "Host");
    await user.click(screen.getByRole("button", { name: /create session/i }));
    await user.click(screen.getByRole("button", { name: /start multiplayer bidding/i }));

    expect(screen.getByRole("button", { name: /ascending/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /silent/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/include railroads/i)).not.toBeChecked();
    expect(screen.getByLabelText(/include utilities/i)).not.toBeChecked();
    expect(screen.getByLabelText(/property count/i)).toHaveValue(10);
    expect(screen.getByLabelText(/bid increment/i)).toHaveValue(10);
    expect(screen.getByLabelText(/bid deadline/i)).toHaveValue(10);
  });

  it("runs a local ascending auction through a win and property dialog", async () => {
    const AudioMock = vi.fn();
    const start = vi.fn();
    const stop = vi.fn();
    const connect = vi.fn();
    const exponentialRampToValueAtTime = vi.fn();
    const audioContext = {
      currentTime: 1,
      createOscillator: vi.fn(() => ({
        connect,
        frequency: { value: 0 },
        start,
        stop,
        type: "sine"
      })),
      createGain: vi.fn(() => ({
        connect,
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime
        }
      })),
      destination: {}
    };
    vi.stubGlobal("Audio", AudioMock);
    vi.stubGlobal("AudioContext", vi.fn(() => audioContext));
    const user = userEvent.setup();
    render(<App />);

    await enterLocalSetup(user);
    await user.clear(screen.getByLabelText(/property count/i));
    await user.type(screen.getByLabelText(/property count/i), "1");
    await user.click(screen.getByRole("button", { name: /start bidding/i }));
    const propertyName = screen.getAllByRole("heading", { level: 2 })[0].textContent ?? "";

    expect(screen.getByText(/property 1 of 1/i)).toBeInTheDocument();
    expect(screen.getByText(/price: \$/i)).toBeInTheDocument();
    expect(screen.getByText(/mortgage: \$/i)).toBeInTheDocument();
    expect(screen.getByText(/opening bid: \$/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^joelle \+\$20$/i }));

    expect(screen.getByTestId("bid-pop")).toHaveTextContent("+$20");
    expect(AudioMock).not.toHaveBeenCalled();
    expect(start).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /^isaac skip$/i }));
    await user.click(screen.getByRole("button", { name: /^durd skip$/i }));

    expect(screen.getByText(/joelle wins/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /setup complete/i })).toBeInTheDocument();
    expect(screen.getByText(/color group/i)).toBeInTheDocument();
    expect(start).toHaveBeenCalledTimes(2);
    expect(stop).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole("button", { name: new RegExp(`view ${propertyName}`, "i") }));

    expect(screen.getByRole("dialog", { name: new RegExp(propertyName, "i") })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("can skip no-bid local properties and finish with unchanged cash", async () => {
    const user = userEvent.setup();
    render(<App />);

    await enterLocalSetup(user);
    await user.clear(screen.getByLabelText(/property count/i));
    await user.type(screen.getByLabelText(/property count/i), "1");
    await user.click(screen.getByRole("button", { name: /start bidding/i }));
    await user.click(screen.getByRole("button", { name: /skip no-bid/i }));

    expect(screen.getByRole("heading", { name: /setup complete/i })).toBeInTheDocument();
    expect(screen.getAllByText(/\$1500/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no properties won/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /new setup/i }));

    expect(screen.getByRole("heading", { name: /start a property auction/i })).toBeInTheDocument();
  });

  it("resolves local silent auction ties with a sudden-death re-bid", async () => {
    const user = userEvent.setup();
    render(<App />);

    await enterLocalSetup(user);
    await user.click(screen.getByRole("button", { name: /silent/i }));
    await user.clear(screen.getByLabelText(/property count/i));
    await user.type(screen.getByLabelText(/property count/i), "1");
    await user.click(screen.getByRole("button", { name: /start bidding/i }));

    const openingInputs = screen.getAllByLabelText(/opening/i);
    const maxInputs = screen.getAllByLabelText(/^max$/i);
    await user.clear(openingInputs[0]);
    await user.type(openingInputs[0], "20");
    await user.clear(maxInputs[0]);
    await user.type(maxInputs[0], "100");
    await user.clear(openingInputs[1]);
    await user.type(openingInputs[1], "20");
    await user.clear(maxInputs[1]);
    await user.type(maxInputs[1], "100");
    await user.clear(openingInputs[2]);
    await user.type(openingInputs[2], "20");
    await user.clear(maxInputs[2]);
    await user.type(maxInputs[2], "20");

    await user.click(screen.getByRole("button", { name: /resolve bids/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/top bids tied/i);
    expect(screen.getByRole("heading", { name: /sudden-death re-bid/i })).toBeInTheDocument();

    const rebidMaxInputs = screen.getAllByLabelText(/^max$/i);
    await user.clear(rebidMaxInputs[0]);
    await user.type(rebidMaxInputs[0], "120");
    await user.clear(rebidMaxInputs[1]);
    await user.type(rebidMaxInputs[1], "100");
    await user.click(screen.getByRole("button", { name: /resolve bids/i }));

    expect(screen.getByRole("heading", { name: /setup complete/i })).toBeInTheDocument();
  });

  it("shows host lobby server errors when start bidding is rejected", async () => {
    const sockets: FakeSocket[] = [];
    vi.stubGlobal(
      "WebSocket",
      class extends FakeSocket {
        static OPEN = 1;

        constructor(url: string) {
          super(url);
          sockets.push(this);
        }
      }
    );
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /host multiplayer/i }));
    await user.type(screen.getByLabelText(/host name/i), "Host");
    await user.click(screen.getByRole("button", { name: /create session/i }));
    act(() => {
      sockets[0].emit("open");
      sockets[0].emit("message", {
        data: JSON.stringify({ type: "joined", joinCode: "TABLE1", playerId: "player-1" })
      });
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
      });
    });

    await user.click(screen.getByRole("button", { name: /start multiplayer bidding/i }));
    act(() => {
      sockets[0].emit("message", {
        data: JSON.stringify({ type: "error", message: "At least two players are required." })
      });
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(/at least two players are required/i);
  });

  it("requires a join code and name for player join", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /join session/i }));
    await user.click(screen.getByRole("button", { name: /^join$/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/join code and player name are required/i);
  });

  it("shows the private player bidding view after joining", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /join session/i }));
    await user.type(screen.getByLabelText(/join code/i), "TABLE1");
    await user.type(screen.getByLabelText(/player name/i), "Joelle");
    await user.click(screen.getByRole("button", { name: /^join$/i }));

    expect(screen.queryByRole("heading", { name: /player bidding/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/current property/i)).not.toBeInTheDocument();
    expect(screen.getByText(/your cash: \$1500 \/ \$1500/i)).toBeInTheDocument();
    expect(screen.getByText(/remaining properties: 10/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^\+\$10$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip/i })).toBeInTheDocument();
    expect(screen.queryByText(/bid deadline/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Isaac/)).not.toBeInTheDocument();
  });

  it("keeps player bid and skip controls inside narrow containers", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /join session/i }));
    await user.type(screen.getByLabelText(/join code/i), "TABLE1");
    await user.type(screen.getByLabelText(/player name/i), "Joelle");
    await user.click(screen.getByRole("button", { name: /^join$/i }));

    const quickBidGrid = screen.getByTestId("player-quick-bids");
    const skipButton = screen.getByRole("button", { name: /^skip$/i });

    expect(quickBidGrid).toHaveClass("grid-cols-2");
    expect(quickBidGrid).toHaveClass("[&>button]:min-w-0");
    expect(skipButton).toHaveClass("min-w-0");
    for (const button of screen.getAllByRole("button", { name: /^\+\$/i })) {
      expect(button).toHaveClass("min-w-0");
      expect(button).toHaveClass("px-2");
    }
  });

  it("renders won mini property cards with white backgrounds and property color headers", async () => {
    const sockets: FakeSocket[] = [];
    vi.stubGlobal(
      "WebSocket",
      class extends FakeSocket {
        static OPEN = 1;

        constructor(url: string) {
          super(url);
          sockets.push(this);
        }
      }
    );
    const propertyById = new Map(MONOPOLY_PROPERTIES.map((property) => [property.id, property]));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /join session/i }));
    await user.type(screen.getByLabelText(/join code/i), "TABLE1");
    await user.type(screen.getByLabelText(/player name/i), "Joelle");
    await user.click(screen.getByRole("button", { name: /^join$/i }));
    act(() => {
      sockets[0].emit("open");
      sockets[0].emit("message", {
        data: JSON.stringify({ type: "joined", joinCode: "TABLE1", playerId: "player-1" })
      });
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
            openingBid: 20,
            remainingPropertyCount: 1,
            countdownRemaining: 10,
            hasSkipped: false,
            roundMessage: null
          }
        })
      });
    });

    const miniCards = screen.getAllByTestId("mini-property-card");

    expect(miniCards).toHaveLength(3);
    for (const card of miniCards) {
      expect(card).toHaveStyle({ backgroundColor: "rgb(255, 255, 255)" });
      expect(card.style.backgroundImage).toContain("linear-gradient");
      expect(card.style.getPropertyValue("--property-color")).toMatch(/^#/);
    }
  });
});

class FakeSocket {
  static OPEN = 1;

  readyState = FakeSocket.OPEN;
  sentMessages: string[] = [];
  private listeners = new Map<string, Array<(event: any) => void>>();

  constructor(public url: string) {}

  addEventListener(type: string, listener: (event: any) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  send(message: string) {
    this.sentMessages.push(message);
  }

  emit(type: string, event: any = {}) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

async function enterLocalSetup(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /host multiplayer/i }));
  await user.type(screen.getByLabelText(/host name/i), "Host");
  await user.click(screen.getByRole("button", { name: /create session/i }));
  await user.click(screen.getByRole("button", { name: /start multiplayer bidding/i }));
}

describe("countdown urgency", () => {
  it("speeds up tick timing near the deadline", () => {
    expect(countdownTickDelay(20)).toBe(1000);
    expect(countdownTickDelay(5)).toBe(350);
    expect(countdownTickDelay(1)).toBe(350);
  });
});

describe("property display refinements", () => {
  it("uses purple for Mediterranean Avenue and Baltic Avenue", () => {
    expect(MONOPOLY_PROPERTIES.find((property) => property.id === "mediterranean-avenue")).toMatchObject({
      colorGroup: "Purple"
    });
    expect(MONOPOLY_PROPERTIES.find((property) => property.id === "baltic-avenue")).toMatchObject({
      colorGroup: "Purple"
    });
  });

  it("sorts owned property cards by most valuable color group first", () => {
    const propertyById = new Map(MONOPOLY_PROPERTIES.map((property) => [property.id, property]));
    const sorted = sortPropertiesByDisplayValue([
      propertyById.get("mediterranean-avenue")!,
      propertyById.get("kentucky-avenue")!,
      propertyById.get("boardwalk")!,
      propertyById.get("water-works")!,
      propertyById.get("reading-railroad")!
    ]);

    expect(sorted.map((property) => property.id)).toEqual([
      "boardwalk",
      "kentucky-avenue",
      "mediterranean-avenue",
      "reading-railroad",
      "water-works"
    ]);
  });
});
