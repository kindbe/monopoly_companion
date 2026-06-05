import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
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
    expect(screen.queryByText(/boardwalk/i)).not.toBeInTheDocument();
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
});
