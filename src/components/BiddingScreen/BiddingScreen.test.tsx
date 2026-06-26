import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BiddingScreen } from "@/components/BiddingScreen/BiddingScreen";
import type { BiddingScreenProps } from "@/components/BiddingScreen/types";
import { createAscendingAuction, createPlayers, MONOPOLY_PROPERTIES } from "@/domain/bidding";

describe("BiddingScreen", () => {
  it("renders ascending controls and forwards bid, skip, and pass actions", async () => {
    const user = userEvent.setup();
    const props = biddingProps();

    render(<BiddingScreen {...props} />);

    expect(screen.getByRole("heading", { name: /ascending auction/i })).toBeInTheDocument();
    expect(screen.getByTestId("bid-pop")).toHaveTextContent("+$10");

    await user.click(screen.getByRole("button", { name: /joelle \+\$20/i }));
    await user.click(screen.getByRole("button", { name: /isaac skip/i }));
    await user.click(screen.getByRole("button", { name: /skip no-bid/i }));

    expect(props.placeBid).toHaveBeenCalledWith("player-1", 20);
    expect(props.passBidder).toHaveBeenCalledWith("player-2");
    expect(props.skipProperty).toHaveBeenCalled();
  });

  it("renders silent auction controls and updates bid inputs", async () => {
    const user = userEvent.setup();
    const props = {
      ...biddingProps(),
      mode: "silent" as const,
      ascendingAuction: null,
      tiedPlayerIds: ["player-2"],
      message: "Top bids tied."
    };

    render(<BiddingScreen {...props} />);

    expect(screen.getByRole("heading", { name: /sudden-death re-bid/i })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/top bids tied/i);
    expect(screen.getByText("Isaac")).toBeInTheDocument();
    expect(screen.queryByText("Joelle")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/opening/i));
    await user.type(screen.getByLabelText(/opening/i), "30");
    await user.clear(screen.getByLabelText(/max/i));
    await user.type(screen.getByLabelText(/max/i), "90");
    await user.click(screen.getByRole("button", { name: /resolve bids/i }));

    expect(props.setSilentBids).toHaveBeenCalled();
    expect(props.submitSilentAuction).toHaveBeenCalled();
  });
});

function biddingProps(): BiddingScreenProps {
  const players = createPlayers(["Joelle", "Isaac"]);
  const currentProperty = MONOPOLY_PROPERTIES.find((property) => property.id === "mediterranean-avenue")!;
  return {
    mode: "ascending",
    players,
    deck: { revealed: [currentProperty], hidden: [MONOPOLY_PROPERTIES[1]] },
    currentProperty,
    currentIndex: 1,
    totalCount: 2,
    increment: 10,
    ascendingAuction: createAscendingAuction(players, 10, 20),
    silentBids: {
      "player-1": { openingBid: 20, maxBid: 0 },
      "player-2": { openingBid: 20, maxBid: 0 }
    },
    tiedPlayerIds: [],
    setSilentBids: vi.fn(),
    placeBid: vi.fn(),
    passBidder: vi.fn(),
    skipProperty: vi.fn(),
    submitSilentAuction: vi.fn(),
    message: "",
    bidFeedback: { playerId: "player-1", increment: 10 }
  };
}
