import { circle } from "@turf/circle";
import { describe, expect, it } from "vitest";
import type { LngLat } from "./geo.types";
import { bearingTo, distance, offset } from "./geo.utils";

const VANTAA: LngLat = [24.97, 60.3];

describe("offset", () => {
  it("changes only the latitude when moving north", () => {
    const [lng, lat] = offset(VANTAA, 0, 1000);

    expect(lng).toBeCloseTo(VANTAA[0], 10);
    expect(lat).toBeCloseTo(VANTAA[1] + 1000 / 111_320, 10);
  });

  it("changes only the longitude when moving east", () => {
    const [lng, lat] = offset(VANTAA, 90, 1000);

    expect(lng).toBeGreaterThan(VANTAA[0]);
    expect(lat).toBeCloseTo(VANTAA[1], 10);
  });

  it("covers twice the longitude at 60 degrees north as at the equator", () => {
    const atEquator = offset([0, 0], 90, 1000)[0];
    const atSixtyNorth = offset([0, 60], 90, 1000)[0];

    expect(atSixtyNorth).toBeCloseTo(atEquator * 2, 8);
  });
});

describe("distance", () => {
  it("is zero between a point and itself", () => {
    expect(distance(VANTAA, VANTAA)).toBe(0);
  });

  it("is the same in both directions", () => {
    const other = offset(VANTAA, 40, 5000);

    expect(distance(VANTAA, other)).toBeCloseTo(distance(other, VANTAA), 8);
  });

  it.each([0, 45, 90, 135, 200, 315])("measures an offset at bearing %i correctly", (bearing) => {
    expect(distance(VANTAA, offset(VANTAA, bearing, 2500))).toBeCloseTo(2500, 0);
  });

  it("stays within 1% of turf across the range of a sensor", () => {
    const [ring] = circle(VANTAA, 3500, { steps: 16, units: "meters" }).geometry.coordinates;

    for (const point of ring) {
      const measured = distance(VANTAA, point as LngLat);

      expect(Math.abs(measured - 3500)).toBeLessThan(35);
    }
  });
});

describe("bearingTo", () => {
  it.each([
    ["north", [24.97, 60.31], 0],
    ["east", [24.98, 60.3], 90],
    ["south", [24.97, 60.29], 180],
    ["west", [24.96, 60.3], 270],
  ] as [string, LngLat, number][])("returns the bearing due %s", (_, target, expected) => {
    expect(bearingTo(VANTAA, target)).toBeCloseTo(expected, 8);
  });

  it.each([0, 45, 90, 135, 200, 315])("recovers the bearing %i used by offset", (bearing) => {
    expect(bearingTo(VANTAA, offset(VANTAA, bearing, 2500))).toBeCloseTo(bearing, 1);
  });
});
