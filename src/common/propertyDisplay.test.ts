import { describe, expect, it } from "vitest";
import { groupWonProperties } from "@/common/propertyDisplay";
import { MONOPOLY_PROPERTIES } from "@/domain/bidding";

describe("propertyDisplay", () => {
  it("groups won properties by color and sorts each group by ascending face value", () => {
    const propertyById = new Map(MONOPOLY_PROPERTIES.map((property) => [property.id, property]));

    const groups = groupWonProperties([
      propertyById.get("boardwalk")!,
      propertyById.get("connecticut-avenue")!,
      propertyById.get("oriental-avenue")!,
      propertyById.get("park-place")!
    ]);

    expect(groups.map((group) => group.label)).toEqual(["Light Blue", "Dark Blue"]);
    expect(groups.map((group) => group.properties.map((property) => property.name))).toEqual([
      ["Oriental Avenue", "Connecticut Avenue"],
      ["Park Place", "Boardwalk"]
    ]);
  });
});
