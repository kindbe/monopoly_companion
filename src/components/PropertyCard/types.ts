import type { Property } from "@/domain/bidding"

export type PropertyCardProps = {
  property: Property
  /**
   * `large` lets the property name become the dominant text on a wide
   * viewport, where the deed occupies a full column. The dialog keeps
   * `regular`, since it is capped to card width at every viewport.
   */
  size?: "regular" | "large"
}
