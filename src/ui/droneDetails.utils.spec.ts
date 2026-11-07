import { describe, expect, it } from "vitest";
import { formatCoordinates, formatDistance } from "./droneDetails.utils";

describe("formatDistance", () => {
  it.each([
    [0, "0 m"],
    [849.6, "850 m"],
    [999, "999 m"],
    [1000, "1.0 km"],
    [3749, "3.7 km"],
  ])("shows %f meters as %s", (meters, expected) => {
    expect(formatDistance(meters)).toBe(expected);
  });
});

describe("formatCoordinates", () => {
  it("shows latitude first, with 5 decimals", () => {
    expect(formatCoordinates([24.97, 60.312345678])).toBe("60.31235, 24.97000");
  });
});
