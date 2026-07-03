import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { CompleteScreen } from "@/components/CompleteScreen/CompleteScreen"
import { createPlayers, MONOPOLY_PROPERTIES } from "@/domain/bidding"

describe("CompleteScreen", () => {
  it("groups won properties and forwards card inspection and restart actions", async () => {
    const user = userEvent.setup()
    const players = createPlayers(["Joelle", "Isaac"])
    const propertyById = new Map(
      MONOPOLY_PROPERTIES.map((property) => [property.id, property])
    )
    players[0] = {
      ...players[0],
      remainingCash: 750,
      properties: [
        propertyById.get("boardwalk")!,
        propertyById.get("park-place")!,
        propertyById.get("oriental-avenue")!
      ]
    }
    const inspectProperty = vi.fn()
    const restart = vi.fn()

    render(
      <CompleteScreen
        players={players}
        completedBids={[
          {
            property: propertyById.get("boardwalk")!,
            winnerId: "player-1",
            price: 400
          }
        ]}
        restart={restart}
        inspectProperty={inspectProperty}
        lastWinnerName="Joelle"
      />
    )

    expect(screen.getByText(/joelle wins/i)).toBeInTheDocument()
    expect(screen.getByText(/light blue color group/i)).toBeInTheDocument()
    expect(screen.getByText(/dark blue color group/i)).toBeInTheDocument()
    expect(screen.getByText(/no properties won/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /view park place/i }))
    await user.click(screen.getByRole("button", { name: /new setup/i }))

    expect(inspectProperty).toHaveBeenCalledWith(propertyById.get("park-place"))
    expect(restart).toHaveBeenCalled()
  })
})
