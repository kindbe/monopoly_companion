import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SetupScreen } from "@/components/SetupScreen/SetupScreen";
import type { SetupScreenProps } from "@/components/SetupScreen/types";

describe("SetupScreen", () => {
  it("wires setup controls to their callbacks", async () => {
    const user = userEvent.setup();
    const props = setupProps();

    render(<SetupScreen {...props} />);

    await user.click(screen.getByRole("button", { name: /silent/i }));
    fireEvent.change(screen.getByLabelText(/bid increment/i), { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText(/bid deadline/i), { target: { value: "99" } });
    await user.click(screen.getByLabelText(/include railroads/i));
    await user.click(screen.getByLabelText(/include utilities/i));
    fireEvent.change(screen.getByLabelText(/property count/i), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText(/player 1 name/i), { target: { value: "Ana" } });
    await user.click(screen.getByRole("button", { name: /remove player 2/i }));
    await user.click(screen.getByRole("button", { name: /add player/i }));
    await user.click(screen.getByRole("button", { name: /^start bidding$/i }));
    await user.click(screen.getByRole("button", { name: /host multiplayer/i }));
    await user.click(screen.getByRole("button", { name: /join session/i }));

    expect(props.setMode).toHaveBeenCalledWith("silent");
    expect(props.setIncrement).toHaveBeenLastCalledWith(20);
    expect(props.setBidDeadline).toHaveBeenLastCalledWith(30);
    expect(props.setIncludeRailroads).toHaveBeenCalledWith(true);
    expect(props.setIncludeUtilities).toHaveBeenCalledWith(true);
    expect(props.setPropertyCount).toHaveBeenLastCalledWith(4);
    expect(props.updatePlayerName).toHaveBeenLastCalledWith(0, "Ana");
    expect(props.removePlayer).toHaveBeenCalledWith(1);
    expect(props.addPlayer).toHaveBeenCalled();
    expect(props.startBidding).toHaveBeenCalled();
    expect(props.hostMultiplayer).toHaveBeenCalled();
    expect(props.joinMultiplayer).toHaveBeenCalled();
  });
});

function setupProps(): SetupScreenProps {
  return {
    mode: "ascending",
    setMode: vi.fn(),
    includeRailroads: false,
    setIncludeRailroads: vi.fn(),
    includeUtilities: false,
    setIncludeUtilities: vi.fn(),
    propertyCount: 3,
    setPropertyCount: vi.fn(),
    maxProperties: 22,
    increment: 10,
    setIncrement: vi.fn(),
    bidDeadline: 10,
    setBidDeadline: vi.fn(),
    playerNames: ["Joelle", "Isaac"],
    updatePlayerName: vi.fn(),
    addPlayer: vi.fn(),
    removePlayer: vi.fn(),
    startBidding: vi.fn(),
    hostMultiplayer: vi.fn(),
    joinMultiplayer: vi.fn(),
    message: "Ready"
  };
}
