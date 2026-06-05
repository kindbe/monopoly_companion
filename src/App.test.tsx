import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    document.documentElement.removeAttribute("data-theme");
  });

  it("starts with setup controls for mode, pool, count, increment, and players", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /property bid companion/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ascending/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /silent/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/include railroads/i)).not.toBeChecked();
    expect(screen.getByLabelText(/include utilities/i)).not.toBeChecked();
    expect(screen.getByLabelText(/property count/i)).toHaveValue(10);
    expect(screen.getByLabelText(/bid increment/i)).toHaveValue(10);
  });

  it("reveals one property at a time and keeps unrevealed property names hidden", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /start bidding/i }));

    expect(screen.getByText(/property 1 of 10/i)).toBeInTheDocument();
    expect(screen.getAllByText(/hidden/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Hidden$/i).length).toBeGreaterThan(0);
  });

  it("shows a deed-style property card with an opening bid and quick increment buttons", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /start bidding/i }));

    expect(screen.getByText(/price: \$/i)).toBeInTheDocument();
    expect(screen.getByText(/mortgage: \$/i)).toBeInTheDocument();
    expect(screen.getByText(/opening bid: \$/i)).toBeInTheDocument();
    expect(screen.getByText(/current bid: \$(?!0)/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /\+\$10/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /\+\$20/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /\+\$50/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /\+\$100/i }).length).toBeGreaterThan(0);
  });

  it("defaults theme from prefers-color-scheme and lets the user toggle", async () => {
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

    await user.click(screen.getByRole("button", { name: /switch to light mode/i }));

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("can skip no-bid properties and finish with player cash summaries", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /start bidding/i }));

    for (let count = 0; count < 10; count += 1) {
      await user.click(screen.getByRole("button", { name: /skip no-bid/i }));
    }

    expect(screen.getByRole("heading", { name: /setup complete/i })).toBeInTheDocument();
    expect(screen.getByText(/joelle/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\$1500/).length).toBeGreaterThan(0);
  });

  it("shows a multiplayer host lobby with a join code", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /host multiplayer/i }));

    expect(screen.getByRole("heading", { name: /host lobby/i })).toBeInTheDocument();
    expect(screen.getByText(/join code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start multiplayer bidding/i })).toBeInTheDocument();
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

    expect(screen.getByRole("heading", { name: /player bidding/i })).toBeInTheDocument();
    expect(screen.getByText(/current property/i)).toBeInTheDocument();
    expect(screen.getByText(/your cash: \$1500/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^\+\$10$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip/i })).toBeInTheDocument();
    expect(screen.queryByText(/Isaac/)).not.toBeInTheDocument();
  });
});
