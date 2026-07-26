import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MiniPropertyCards } from "@/components/MiniPropertyCards/MiniPropertyCards"
import { MONOPOLY_PROPERTIES } from "@/domain/bidding"

describe("MiniPropertyCards", () => {
  it("does not reserve a fixed four-track minimum width for owned properties", () => {
    // A fixed `repeat(4, minmax(92px, 1fr))` grid reserves 392px of
    // min-content regardless of how many properties are held, which forces
    // page-wide horizontal overflow at a 375px viewport with even one owned
    // property. jsdom performs no layout, so this asserts the cause; the
    // rendered overflow itself is covered by Playwright.
    render(
      <MiniPropertyCards
        properties={[MONOPOLY_PROPERTIES[0]]}
        inspectProperty={vi.fn()}
      />
    )

    const grid = screen.getByTestId("mini-property-card").parentElement

    expect(grid?.className).not.toMatch(/grid-cols-\[repeat\(\s*\d/)
    expect(grid?.className).toMatch(/repeat\(auto-(fill|fit),/)
  })
})
